package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strings"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
	"saims-backend/pkg/utils"
)

type AuthService interface {
	Register(req domain.RegisterRequest) (*domain.User, error)
	Login(req domain.LoginRequest) (string, string, *domain.User, bool, error) // access, refresh, user, requireOTP, error
	VerifyOTP(req domain.VerifyOTPRequest) (string, string, *domain.User, error) // access, refresh, user, error
	ResendOTP(email string) error
	RefreshToken(refreshToken string) (string, string, error)
	Logout(accessToken string, refreshToken string) error
	SSOLogin(ssoToken string) (string, string, *domain.User, error)
	ForgotPassword(email string) error
	ResetPasswordWithOTP(req domain.ResetPasswordWithOTPRequest) error
}

type authService struct {
	userRepo         repositories.UserRepository
	whatsappService  WhatsAppService
	auditRepo        domain.AuditRepository
	jwtBlacklistRepo repositories.JWTBlacklistRepository
}

func NewAuthService(userRepo repositories.UserRepository, whatsappService WhatsAppService, auditRepo domain.AuditRepository, jwtBlacklistRepo repositories.JWTBlacklistRepository) AuthService {
	return &authService{userRepo, whatsappService, auditRepo, jwtBlacklistRepo}
}

func (s *authService) Register(req domain.RegisterRequest) (*domain.User, error) {
	// Validate password complexity
	if err := utils.ValidatePasswordComplexity(req.Password); err != nil {
		return nil, err
	}

	// Check if email already exists
	existingUser, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("email already registered")
	}

	// Check if phone already exists
	existingPhone, err := s.userRepo.FindByPhone(req.Phone)
	if err != nil {
		return nil, err
	}
	if existingPhone != nil {
		return nil, errors.New("Nomor Whatsapp sudah terdaftar.")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user domain model
	user := domain.User{
		Name:       req.Name,
		Email:      req.Email,
		Password:   hashedPassword,
		Phone:      req.Phone,
		Department: req.Department,
		Role:       "Staff", // Default role
		IsVerified: false,
	}

	// Save to database
	err = s.userRepo.Create(&user)
	if err != nil {
		return nil, err
	}

	// Generate 6-digit OTP
	nBig1, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	otpCode := fmt.Sprintf("%06d", nBig1.Int64())
	otpExpiry := time.Now().Add(1 * time.Minute)

	// Save OTP to user
	err = s.userRepo.UpdateOTP(user.ID, &otpCode, &otpExpiry)
	if err != nil {
		return nil, errors.New("failed to generate OTP")
	}

	// Send OTP via WhatsApp
	message := fmt.Sprintf("Kode OTP Pendaftaran SAIMS Anda adalah: %s. Kode ini berlaku selama 1 menit.", otpCode)
	go s.whatsappService.SendMessage(user.Phone, message) // Run in background

	if s.auditRepo != nil {
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "CREATE_USER",
			EntityName: "User",
			EntityID:   user.ID,
			OldPayload: "null", // explicitly passing null to avoid jsonb error
			NewPayload: `{"name":"` + user.Name + `","email":"` + user.Email + `","role":"` + user.Role + `"}`,
			ChangedBy:  user.Name, // Self-registration
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	return &user, nil
}

func (s *authService) Login(req domain.LoginRequest) (string, string, *domain.User, bool, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return "", "", nil, false, err
	}
	if user == nil {
		return "", "", nil, false, errors.New("invalid email or password")
	}

	// Verify password
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		return "", "", nil, false, errors.New("invalid email or password")
	}


	// Generate JWTs
	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Role, user.Name)
	if err != nil {
		return "", "", nil, false, err
	}

	// Update last login
	_ = s.userRepo.UpdateLastLogin(user.ID)

	return accessToken, refreshToken, user, false, nil
}

func (s *authService) VerifyOTP(req domain.VerifyOTPRequest) (string, string, *domain.User, error) {
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return "", "", nil, err
	}
	if user == nil {
		return "", "", nil, errors.New("invalid email")
	}

	if user.OTPCode == nil || user.OTPExpiry == nil {
		return "", "", nil, errors.New("OTP not requested or already verified")
	}

	if time.Now().After(*user.OTPExpiry) {
		return "", "", nil, errors.New("OTP has expired")
	}

	if *user.OTPCode != req.OTPCode {
		return "", "", nil, errors.New("invalid OTP code")
	}

	// Clear OTP and set IsVerified = true
	_ = s.userRepo.UpdateOTP(user.ID, nil, nil)
	_ = s.userRepo.UpdateVerification(user.ID, true)

	// Generate JWTs
	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Role, user.Name)
	if err != nil {
		return "", "", nil, err
	}

	// Update last login
	_ = s.userRepo.UpdateLastLogin(user.ID)

	return accessToken, refreshToken, user, nil
}

func (s *authService) ResendOTP(email string) error {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	if user.IsVerified {
		return errors.New("account already verified")
	}

	// Generate 6-digit OTP
	nBig2, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	otpCode := fmt.Sprintf("%06d", nBig2.Int64())
	otpExpiry := time.Now().Add(5 * time.Minute)

	// Save OTP to user
	err = s.userRepo.UpdateOTP(user.ID, &otpCode, &otpExpiry)
	if err != nil {
		return errors.New("failed to generate OTP")
	}

	// Send OTP via WhatsApp
	message := fmt.Sprintf("Kode OTP baru SAIMS Anda adalah: %s. Kode ini berlaku selama 5 menit.", otpCode)
	go s.whatsappService.SendMessage(user.Phone, message) // Run in background

	return nil
}

func (s *authService) ForgotPassword(email string) error {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("Email tidak terdaftar.")
	}

	if user.Phone == "" {
		return errors.New("Nomor WhatsApp tidak terdaftar pada akun ini.")
	}

	// Generate 6-digit OTP
	nBig, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	otpCode := fmt.Sprintf("%06d", nBig.Int64())
	otpExpiry := time.Now().Add(5 * time.Minute)

	// Save OTP to user
	err = s.userRepo.UpdateOTP(user.ID, &otpCode, &otpExpiry)
	if err != nil {
		return errors.New("Gagal memproses OTP lupa password.")
	}

	// Send OTP via WhatsApp
	message := fmt.Sprintf("Halo %s, Kode OTP Reset Password SAIMS Anda adalah: %s. Berlaku selama 5 menit. Jangan berikan kode ini kepada siapapun.", user.Name, otpCode)
	go s.whatsappService.SendMessage(user.Phone, message)

	return nil
}

func (s *authService) ResetPasswordWithOTP(req domain.ResetPasswordWithOTPRequest) error {
	// Validate password complexity
	if err := utils.ValidatePasswordComplexity(req.NewPassword); err != nil {
		return err
	}

	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("Email tidak terdaftar.")
	}

	if user.OTPCode == nil || user.OTPExpiry == nil {
		return errors.New("OTP belum diminta atau sudah tidak berlaku.")
	}

	if time.Now().After(*user.OTPExpiry) {
		return errors.New("Kode OTP telah kedaluwarsa.")
	}

	if *user.OTPCode != req.OTPCode {
		return errors.New("Kode OTP tidak valid.")
	}

	// Hash new password
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return errors.New("Gagal memproses password baru.")
	}

	// Update password and clear OTP
	if err := s.userRepo.UpdatePassword(user.ID, hashedPassword); err != nil {
		return errors.New("Gagal memperbarui password.")
	}
	_ = s.userRepo.UpdateOTP(user.ID, nil, nil)

	// Audit Log
	if s.auditRepo != nil {
		_ = s.auditRepo.Create(&domain.AuditLog{
			Action:     "RESET_PASSWORD_OTP",
			EntityName: "User",
			EntityID:   user.ID,
			OldPayload: "null",
			NewPayload: `{"email":"` + user.Email + `"}`,
			ChangedBy:  user.Name,
		})
	}

	return nil
}

func (s *authService) RefreshToken(refreshToken string) (string, string, error) {
	claims, err := utils.ValidateToken(refreshToken)
	if err != nil {
		return "", "", errors.New("invalid or expired refresh token")
	}

	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "refresh" {
		return "", "", errors.New("invalid token type")
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", "", errors.New("invalid token claims")
	}

	// Optionally check if token is blacklisted
	if s.jwtBlacklistRepo != nil && s.jwtBlacklistRepo.IsBlacklisted(refreshToken) {
		return "", "", errors.New("refresh token is blacklisted")
	}

	user, err := s.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return "", "", errors.New("user not found")
	}

	accessToken, newRefreshToken, err := utils.GenerateTokens(user.ID, user.Role, user.Name)
	if err != nil {
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}

func (s *authService) Logout(accessToken string, refreshToken string) error {
	if s.jwtBlacklistRepo != nil {
		if accessToken != "" {
			claims, err := utils.ValidateToken(accessToken)
			if err == nil {
				if exp, ok := claims["exp"].(float64); ok {
					_ = s.jwtBlacklistRepo.Create(&domain.JWTBlacklist{
						Token: accessToken,
						ExpiresAt: time.Unix(int64(exp), 0),
					})
				}
			}
		}
		if refreshToken != "" {
			claims, err := utils.ValidateToken(refreshToken)
			if err == nil {
				if exp, ok := claims["exp"].(float64); ok {
					_ = s.jwtBlacklistRepo.Create(&domain.JWTBlacklist{
						Token: refreshToken,
						ExpiresAt: time.Unix(int64(exp), 0),
					})
				}
			}
		}
	}
	return nil
}

func (s *authService) SSOLogin(ssoToken string) (string, string, *domain.User, error) {
	claims, err := utils.ValidateSSOToken(ssoToken)
	if err != nil {
		return "", "", nil, fmt.Errorf("invalid SSO token: %w", err)
	}

	iss, _ := claims["iss"].(string)
	if iss != "portal-login-microdata" {
		return "", "", nil, errors.New("invalid SSO token issuer")
	}

	extUserID, _ := claims["user_id_external"].(string)
	// Sanitize: trim whitespace and stray non-alphanumeric characters from edges
	extUserID = strings.TrimSpace(extUserID)
	extUserID = strings.TrimRight(extUserID, "()[]{}")
	extUserID = strings.TrimSpace(extUserID)
	if extUserID == "" {
		return "", "", nil, errors.New("invalid SSO token payload: missing external user ID")
	}

	extRole, _ := claims["role_external"].(string)
	// Validate role against all valid SAIMS roles (case-insensitive check)
	validRoles := map[string]bool{
		"Administrator": true,
		"Supervisor":    true,
		"Staff":         true,
		"Teknisi":       true,
		"admin":         true,
		"superadmin":    true,
		"user":          true,
	}
	if extRole != "" && !validRoles[extRole] {
		return "", "", nil, fmt.Errorf("role '%s' is not authorized for SSO access", extRole)
	}

	// Lookup user in SAIMS: try by email first, then by UUID
	var user *domain.User
	if strings.Contains(extUserID, "@") {
		user, _ = s.userRepo.FindByEmail(extUserID)
	} else if isValidUUID(extUserID) {
		user, _ = s.userRepo.FindByID(extUserID)
	}

	// Fallback: if not found by primary method, try the other
	if user == nil && !strings.Contains(extUserID, "@") {
		user, _ = s.userRepo.FindByEmail(extUserID)
	}
	if user == nil && strings.Contains(extUserID, "@") && isValidUUID(extUserID) {
		user, _ = s.userRepo.FindByID(extUserID)
	}

	if user == nil {
		name, _ := claims["name_external"].(string)
		if strings.TrimSpace(name) == "" {
			name = extUserID
		}

		// Provision SSO-only accounts without creating a usable local password.
		passwordBytes := make([]byte, 32)
		if _, err := rand.Read(passwordBytes); err != nil {
			return "", "", nil, fmt.Errorf("failed to provision SSO user: %w", err)
		}
		password, err := utils.HashPassword(hex.EncodeToString(passwordBytes))
		if err != nil {
			return "", "", nil, fmt.Errorf("failed to provision SSO user: %w", err)
		}

		user = &domain.User{
			Email:      extUserID,
			Password:   password,
			Name:       name,
			Phone:      "",
			Role:       "Staff",
			Department: "General",
			IsVerified: true,
		}
		if err := s.userRepo.Create(user); err != nil {
			return "", "", nil, fmt.Errorf("failed to provision SSO user: %w", err)
		}
	}

	// Generate SAIMS native JWT tokens
	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Role, user.Name)
	if err != nil {
		return "", "", nil, fmt.Errorf("failed to generate SAIMS session tokens: %w", err)
	}

	_ = s.userRepo.UpdateLastLogin(user.ID)

	if s.auditRepo != nil {
		_ = s.auditRepo.Create(&domain.AuditLog{
			Action:     "SSO_LOGIN",
			EntityName: "User",
			EntityID:   user.ID,
			OldPayload: "null",
			NewPayload: `{"email":"` + user.Email + `","role":"` + user.Role + `","provider":"portal-login-microdata"}`,
			ChangedBy:  user.Name,
		})
	}

	return accessToken, refreshToken, user, nil
}

var uuidRegex = regexp.MustCompile(`(?i)^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func isValidUUID(u string) bool {
	return uuidRegex.MatchString(u)
}

