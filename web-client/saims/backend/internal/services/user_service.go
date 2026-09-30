package services

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
	"saims-backend/pkg/utils"
)

type UserService interface {
	GetAllUsers() ([]domain.User, error)
	GetUserByID(id string) (*domain.User, error)
	UpdateUserRole(id string, role string, actorID, actorName string) error
	UpdateProfile(id string, req domain.UpdateProfileRequest, actorID, actorName string) (*domain.User, bool, error)
	VerifyPhone(id string, req domain.VerifyPhoneRequest, actorID, actorName string) (*domain.User, error)
	ChangePassword(id string, req domain.ChangePasswordRequest, actorID, actorName string) error
	DeleteUser(id string, actorID, actorName string) error
}

type userService struct {
	userRepo        repositories.UserRepository
	whatsappService WhatsAppService
	storageService  StorageService
	bucketName      string
	auditRepo       domain.AuditRepository
}

func NewUserService(userRepo repositories.UserRepository, whatsappService WhatsAppService, storageService StorageService, bucketName string, auditRepo domain.AuditRepository) UserService {
	return &userService{userRepo, whatsappService, storageService, bucketName, auditRepo}
}

func (s *userService) GetAllUsers() ([]domain.User, error) {
	return s.userRepo.FindAll()
}

func (s *userService) GetUserByID(id string) (*domain.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (s *userService) UpdateUserRole(id string, role string, actorID, actorName string) error {
	validRoles := map[string]bool{
		"Administrator": true,
		"Staff":         true,
		"Supervisor":    true,
		"Teknisi":       true,
	}
	if !validRoles[role] {
		return errors.New("invalid role")
	}

	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}
	
	oldRole := user.Role
	err = s.userRepo.UpdateRole(id, role)
	
	if err == nil && s.auditRepo != nil {
		oldPayload, _ := json.Marshal(map[string]interface{}{"role": oldRole})
		newPayload, _ := json.Marshal(map[string]interface{}{"role": role})
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_USER",
			EntityName: "User",
			EntityID:   id,
			OldPayload: string(oldPayload),
			NewPayload: string(newPayload),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}
	
	return err
}

func (s *userService) UpdateProfile(id string, req domain.UpdateProfileRequest, actorID, actorName string) (*domain.User, bool, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, false, err
	}
	if user == nil {
		return nil, false, errors.New("user not found")
	}

	fields := map[string]interface{}{}
	if req.Name != "" {
		fields["name"] = req.Name
	}
	if req.Department != "" {
		fields["department"] = req.Department
	}
	if req.IDKaryawan != "" {
		fields["id_karyawan"] = req.IDKaryawan
	}

	otpRequired := false
	if req.Phone != "" && req.Phone != user.Phone {
		// Check if phone already registered by another user
		existingPhone, err := s.userRepo.FindByPhone(req.Phone)
		if err != nil {
			return nil, false, err
		}
		if existingPhone != nil && existingPhone.ID != user.ID {
			return nil, false, errors.New("Nomor Whatsapp sudah terdaftar.")
		}

		otpRequired = true

		// Generate 6-digit OTP
		nBig, _ := rand.Int(rand.Reader, big.NewInt(1000000))
		otpCode := fmt.Sprintf("%06d", nBig.Int64())
		otpExpiry := time.Now().Add(1 * time.Minute)

		// Save OTP to user
		err = s.userRepo.UpdateOTP(user.ID, &otpCode, &otpExpiry)
		if err != nil {
			return nil, false, errors.New("failed to generate OTP")
		}

		// Send OTP via WhatsApp to the new phone number
		message := fmt.Sprintf("Kode OTP pembaruan nomor WhatsApp SAIMS Anda adalah: %s. Kode ini berlaku selama 1 menit.", otpCode)
		go s.whatsappService.SendMessage(req.Phone, message) // Send in background
	}

	if len(fields) > 0 {
		if err := s.userRepo.UpdateProfile(id, fields); err != nil {
			return nil, false, err
		}
		
		if s.auditRepo != nil {
			oldPayload, _ := json.Marshal(user)
			updatedUser, _ := s.userRepo.FindByID(id)
			newPayload, _ := json.Marshal(updatedUser)
			if errAudit := s.auditRepo.Create(&domain.AuditLog{
				Action:     "UPDATE_USER",
				EntityName: "User",
				EntityID:   id,
				OldPayload: string(oldPayload),
				NewPayload: string(newPayload),
				ChangedBy:  actorName,
			}); errAudit != nil {
				return nil, false, fmt.Errorf("failed to create audit log: %w", errAudit)
			}
		}
	}

	updatedUser, err := s.userRepo.FindByID(id)
	return updatedUser, otpRequired, err
}

func (s *userService) VerifyPhone(id string, req domain.VerifyPhoneRequest, actorID, actorName string) (*domain.User, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	if user.OTPCode == nil || user.OTPExpiry == nil {
		return nil, errors.New("OTP tidak ditemukan atau sudah kadaluarsa")
	}

	if time.Now().After(*user.OTPExpiry) {
		return nil, errors.New("Kode OTP telah kadaluarsa")
	}

	if *user.OTPCode != req.OTPCode {
		return nil, errors.New("Kode OTP tidak valid")
	}

	// Check if phone already registered by another user (security check)
	existingPhone, err := s.userRepo.FindByPhone(req.Phone)
	if err != nil {
		return nil, err
	}
	if existingPhone != nil && existingPhone.ID != user.ID {
		return nil, errors.New("Nomor Whatsapp sudah terdaftar.")
	}

	// Clear OTP and update phone
	fields := map[string]interface{}{
		"phone":      req.Phone,
		"otp_code":   nil,
		"otp_expiry": nil,
	}
	if err := s.userRepo.UpdateProfile(id, fields); err != nil {
		return nil, err
	}
	
	if s.auditRepo != nil {
		oldPayload, _ := json.Marshal(user)
		updatedUser, _ := s.userRepo.FindByID(id)
		newPayload, _ := json.Marshal(updatedUser)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_USER",
			EntityName: "User",
			EntityID:   id,
			OldPayload: string(oldPayload),
			NewPayload: string(newPayload),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	return s.userRepo.FindByID(id)
}

func (s *userService) ChangePassword(id string, req domain.ChangePasswordRequest, actorID, actorName string) error {
	// Validate new password complexity
	if err := utils.ValidatePasswordComplexity(req.NewPassword); err != nil {
		return err
	}

	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	if !utils.CheckPasswordHash(req.CurrentPassword, user.Password) {
		return errors.New("password lama tidak sesuai")
	}

	hashed, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		return err
	}

	err = s.userRepo.UpdatePassword(id, hashed)
	if err == nil && s.auditRepo != nil {
		oldPayload, _ := json.Marshal(map[string]interface{}{"password": "[HIDDEN]"})
		newPayload, _ := json.Marshal(map[string]interface{}{"password": "[HIDDEN]"})
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_USER",
			EntityName: "User",
			EntityID:   id,
			OldPayload: string(oldPayload),
			NewPayload: string(newPayload),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}
	return err
}

func (s *userService) DeleteUser(id string, actorID, actorName string) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	err = s.userRepo.Delete(id)
	if err != nil {
		if utils.IsForeignKeyViolation(err) {
			return errors.New("pengguna tidak bisa dihapus karena memiliki riwayat peminjaman atau penugasan di sistem")
		}
		return err
	}
	
	if s.auditRepo != nil {
		oldPayload, _ := json.Marshal(user)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "DELETE_USER",
			EntityName: "User",
			EntityID:   id,
			OldPayload: string(oldPayload),
			NewPayload: "null",
			ChangedBy:  actorName,
		}); errAudit != nil {
			return fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}
	return nil
}
