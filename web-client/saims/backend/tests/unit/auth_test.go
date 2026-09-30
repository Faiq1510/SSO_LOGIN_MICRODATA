package unit

import (
	"errors"
	"testing"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"
	"saims-backend/pkg/utils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ─────────────────────────────────────────────────────
//  MOCK: UserRepository
// ─────────────────────────────────────────────────────

type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(user *domain.User) error {
	args := m.Called(user)
	return args.Error(0)
}
func (m *MockUserRepository) FindByEmail(email string) (*domain.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}
func (m *MockUserRepository) FindByPhone(phone string) (*domain.User, error) {
	args := m.Called(phone)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}
func (m *MockUserRepository) FindByID(id string) (*domain.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}
func (m *MockUserRepository) FindAll() ([]domain.User, error) {
	args := m.Called()
	return args.Get(0).([]domain.User), args.Error(1)
}
func (m *MockUserRepository) FindByRole(role string) ([]domain.User, error) {
	args := m.Called(role)
	return args.Get(0).([]domain.User), args.Error(1)
}
func (m *MockUserRepository) UpdateRole(id string, role string) error {
	args := m.Called(id, role)
	return args.Error(0)
}
func (m *MockUserRepository) UpdateProfile(id string, fields map[string]interface{}) error {
	args := m.Called(id, fields)
	return args.Error(0)
}
func (m *MockUserRepository) UpdatePassword(id string, hashedPassword string) error {
	args := m.Called(id, hashedPassword)
	return args.Error(0)
}
func (m *MockUserRepository) Delete(id string) error {
	args := m.Called(id)
	return args.Error(0)
}
func (m *MockUserRepository) UpdateLastLogin(userID string) error {
	args := m.Called(userID)
	return args.Error(0)
}
func (m *MockUserRepository) UpdateOTP(id string, otpCode *string, otpExpiry *time.Time) error {
	args := m.Called(id, otpCode, otpExpiry)
	return args.Error(0)
}
func (m *MockUserRepository) UpdateVerification(id string, isVerified bool) error {
	args := m.Called(id, isVerified)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  MOCK: WhatsAppService
// ─────────────────────────────────────────────────────

type MockWhatsAppService struct {
	mock.Mock
}

func (m *MockWhatsAppService) SendMessage(phone, message string) error {
	args := m.Called(phone, message)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  HELPER
// ─────────────────────────────────────────────────────

func newAuthService(repo *MockUserRepository, wa *MockWhatsAppService) services.AuthService {
	// Provide a nil auditRepo and jwtBlacklist for testing since auth audits aren't strictly tested in these unit tests,
	// or mock it if needed. We'll pass nil for now.
	return services.NewAuthService(repo, wa, nil, nil)
}

// =============================================================
//  TEST GROUP: Register
// =============================================================

// ST-01 ✅ Positif — Registrasi dengan data lengkap dan valid
func TestRegister_WithValidData_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	req := domain.RegisterRequest{
		Name:       "Budi Santoso",
		Email:      "budi@example.com",
		Password:   "Password123",
		Phone:      "+6281234567890",
		Department: "IT",
	}

	repo.On("FindByEmail", req.Email).Return(nil, nil)
	repo.On("FindByPhone", req.Phone).Return(nil, nil)
	repo.On("Create", mock.AnythingOfType("*domain.User")).Return(nil)
	repo.On("UpdateOTP", mock.Anything, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	user, err := svc.Register(req)

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, req.Email, user.Email)
	assert.Equal(t, "Staff", user.Role)
	assert.False(t, user.IsVerified)
}

// ST-02 ❌ Negatif — Email sudah terdaftar
func TestRegister_WhenEmailAlreadyExists_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	existingUser := &domain.User{Email: "budi@example.com"}
	req := domain.RegisterRequest{
		Name: "Budi Lain", Email: "budi@example.com",
		Password: "Password123", Phone: "+6281111111111",
	}
	repo.On("FindByEmail", req.Email).Return(existingUser, nil)

	user, err := svc.Register(req)

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "email already registered")
}

// ST-03 ❌ Negatif — Nomor WhatsApp sudah terdaftar
func TestRegister_WhenPhoneAlreadyExists_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	existingPhone := &domain.User{Phone: "+6281234567890"}
	req := domain.RegisterRequest{
		Name: "Citra Dewi", Email: "citra@example.com",
		Password: "Password123", Phone: "+6281234567890",
	}
	repo.On("FindByEmail", req.Email).Return(nil, nil)
	repo.On("FindByPhone", req.Phone).Return(existingPhone, nil)

	user, err := svc.Register(req)

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "Nomor Whatsapp sudah terdaftar")
}

// ❌ Negatif — Gagal saat menyimpan ke database
func TestRegister_WhenDatabaseFails_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	req := domain.RegisterRequest{
		Name: "Gagal Menyimpan", Email: "gagal@example.com",
		Password: "Password123", Phone: "+628999999999",
	}
	repo.On("FindByEmail", req.Email).Return(nil, nil)
	repo.On("FindByPhone", req.Phone).Return(nil, nil)
	repo.On("Create", mock.AnythingOfType("*domain.User")).Return(errors.New("db error"))

	user, err := svc.Register(req)

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "db error")
}

// =============================================================
//  TEST GROUP: Login
// =============================================================

// A-01 ✅ Positif — Login dengan kredensial valid
func TestLogin_WithValidCredentials_ShouldReturnToken(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	hashedPwd, _ := utils.HashPassword("Password123")
	user := &domain.User{
		ID: "uuid-1234", Email: "admin@example.com",
		Password: hashedPwd, IsVerified: true, Role: "Staff",
	}

	req := domain.LoginRequest{Email: "admin@example.com", Password: "Password123"}
	repo.On("FindByEmail", req.Email).Return(user, nil)
	repo.On("UpdateLastLogin", user.ID).Return(nil)

	accessToken, refreshToken, returnedUser, requireOTP, err := svc.Login(req)

	assert.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	assert.NotEmpty(t, refreshToken)
	assert.False(t, requireOTP)
	assert.NotNil(t, returnedUser)
	assert.Equal(t, "Staff", returnedUser.Role)
}

// A-02 ❌ Negatif — Password salah
func TestLogin_WithWrongPassword_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	hashedPwd, _ := utils.HashPassword("PasswordBenar123")
	user := &domain.User{
		ID: "uuid-1234", Email: "admin@example.com",
		Password: hashedPwd, IsVerified: true,
	}

	req := domain.LoginRequest{Email: "admin@example.com", Password: "PasswordSalah123"}
	repo.On("FindByEmail", req.Email).Return(user, nil)

	accessToken, refreshToken, returnedUser, requireOTP, err := svc.Login(req)

	assert.Error(t, err)
	assert.Empty(t, accessToken)
	assert.Empty(t, refreshToken)
	assert.False(t, requireOTP)
	assert.Nil(t, returnedUser)
}

// A-03 ❌ Negatif — Email tidak terdaftar
func TestLogin_WhenEmailNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	req := domain.LoginRequest{Email: "tidakada@example.com", Password: "Password123"}
	repo.On("FindByEmail", req.Email).Return(nil, nil)

	accessToken, refreshToken, returnedUser, requireOTP, err := svc.Login(req)

	assert.Error(t, err)
	assert.Empty(t, accessToken)
	assert.Empty(t, refreshToken)
	assert.False(t, requireOTP)
	assert.Nil(t, returnedUser)
}



// =============================================================
//  TEST GROUP: VerifyOTP
// =============================================================

// ST-05 ✅ Positif — OTP benar dan belum kadaluarsa
func TestVerifyOTP_WithValidCode_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	validOTP := "123456"
	validExpiry := time.Now().Add(30 * time.Second)
	user := &domain.User{
		ID: "uuid-1234", Email: "budi@example.com",
		OTPCode: &validOTP, OTPExpiry: &validExpiry, IsVerified: false,
	}

	req := domain.VerifyOTPRequest{Email: "budi@example.com", OTPCode: "123456"}
	repo.On("FindByEmail", req.Email).Return(user, nil)
	repo.On("UpdateOTP", user.ID, mock.Anything, mock.Anything).Return(nil) // clear OTP
	repo.On("UpdateVerification", user.ID, true).Return(nil)
	repo.On("UpdateLastLogin", user.ID).Return(nil)

	accessToken, refreshToken, returnedUser, err := svc.VerifyOTP(req)

	assert.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	assert.NotEmpty(t, refreshToken)
	assert.NotNil(t, returnedUser)
}

// ST-06 ❌ Negatif — OTP salah
func TestVerifyOTP_WithWrongCode_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	correctOTP := "123456"
	validExpiry := time.Now().Add(30 * time.Second)
	user := &domain.User{
		ID: "uuid-1234", Email: "budi@example.com",
		OTPCode: &correctOTP, OTPExpiry: &validExpiry, IsVerified: false,
	}

	req := domain.VerifyOTPRequest{Email: "budi@example.com", OTPCode: "000000"}
	repo.On("FindByEmail", req.Email).Return(user, nil)

	accessToken, refreshToken, returnedUser, err := svc.VerifyOTP(req)

	assert.Error(t, err)
	assert.Empty(t, accessToken)
	assert.Empty(t, refreshToken)
	assert.Nil(t, returnedUser)
}

// ST-07 ❌ Negatif — OTP sudah kadaluarsa (lebih dari 1 menit)
func TestVerifyOTP_WhenOTPExpired_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	correctOTP := "123456"
	expiredTime := time.Now().Add(-2 * time.Minute)
	user := &domain.User{
		ID: "uuid-1234", Email: "budi@example.com",
		OTPCode: &correctOTP, OTPExpiry: &expiredTime, IsVerified: false,
	}

	req := domain.VerifyOTPRequest{Email: "budi@example.com", OTPCode: "123456"}
	repo.On("FindByEmail", req.Email).Return(user, nil)

	accessToken, refreshToken, returnedUser, err := svc.VerifyOTP(req)

	assert.Error(t, err)
	assert.Empty(t, accessToken)
	assert.Empty(t, refreshToken)
	assert.Nil(t, returnedUser)
	assert.Contains(t, err.Error(), "expired")
}

// =============================================================
//  TEST GROUP: ResendOTP
// =============================================================

// ST-08 ✅ Positif — Kirim ulang OTP ke akun belum terverifikasi
func TestResendOTP_WhenAccountNotVerified_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	user := &domain.User{
		ID: "uuid-1234", Email: "budi@example.com",
		Phone: "+6281234567890", IsVerified: false,
	}

	repo.On("FindByEmail", "budi@example.com").Return(user, nil)
	repo.On("UpdateOTP", user.ID, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", user.Phone, mock.Anything).Return(nil)

	err := svc.ResendOTP("budi@example.com")

	assert.NoError(t, err)
}

// ST-09 ❌ Negatif — Kirim ulang OTP ke akun yang sudah terverifikasi
func TestResendOTP_WhenAccountAlreadyVerified_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	user := &domain.User{
		ID: "uuid-1234", Email: "budi@example.com",
		IsVerified: true,
	}
	repo.On("FindByEmail", "budi@example.com").Return(user, nil)

	err := svc.ResendOTP("budi@example.com")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "already verified")
}

// ❌ Negatif — Kirim ulang OTP ke email yang tidak ada
func TestResendOTP_WhenEmailNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	repo.On("FindByEmail", "tidakada@example.com").Return(nil, nil)

	err := svc.ResendOTP("tidakada@example.com")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

// ─────────────────────────────────────────────────────
//  FORGOT PASSWORD & RESET PASSWORD VIA OTP TESTS
// ─────────────────────────────────────────────────────

// TestForgotPassword_Success
func TestForgotPassword_Success(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	user := &domain.User{
		ID: "uuid-1234", Name: "Budi Santoso", Email: "budi@example.com", Phone: "+6281234567890",
	}

	repo.On("FindByEmail", "budi@example.com").Return(user, nil)
	repo.On("UpdateOTP", user.ID, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", user.Phone, mock.Anything).Return(nil)

	err := svc.ForgotPassword("budi@example.com")
	assert.NoError(t, err)
}

// TestForgotPassword_EmailNotFound
func TestForgotPassword_EmailNotFound(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	repo.On("FindByEmail", "notfound@example.com").Return(nil, nil)

	err := svc.ForgotPassword("notfound@example.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Email tidak terdaftar")
}

// TestResetPasswordWithOTP_Success
func TestResetPasswordWithOTP_Success(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	otpCode := "123456"
	otpExpiry := time.Now().Add(5 * time.Minute)
	user := &domain.User{
		ID: "uuid-1234", Name: "Budi Santoso", Email: "budi@example.com",
		OTPCode: &otpCode, OTPExpiry: &otpExpiry,
	}

	repo.On("FindByEmail", "budi@example.com").Return(user, nil)
	repo.On("UpdatePassword", user.ID, mock.Anything).Return(nil)
	repo.On("UpdateOTP", user.ID, mock.Anything, mock.Anything).Return(nil)

	err := svc.ResetPasswordWithOTP(domain.ResetPasswordWithOTPRequest{
		Email:       "budi@example.com",
		OTPCode:     "123456",
		NewPassword: "Password123!",
	})
	assert.NoError(t, err)
}

// TestResetPasswordWithOTP_InvalidOTP
func TestResetPasswordWithOTP_InvalidOTP(t *testing.T) {
	repo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	svc := newAuthService(repo, wa)

	otpCode := "123456"
	otpExpiry := time.Now().Add(5 * time.Minute)
	user := &domain.User{
		ID: "uuid-1234", Name: "Budi Santoso", Email: "budi@example.com",
		OTPCode: &otpCode, OTPExpiry: &otpExpiry,
	}

	repo.On("FindByEmail", "budi@example.com").Return(user, nil)

	err := svc.ResetPasswordWithOTP(domain.ResetPasswordWithOTPRequest{
		Email:       "budi@example.com",
		OTPCode:     "999999",
		NewPassword: "Password123!",
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Kode OTP tidak valid")
}
