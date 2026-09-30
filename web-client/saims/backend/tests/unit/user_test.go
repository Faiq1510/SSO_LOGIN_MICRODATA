package unit

import (
	"testing"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"
	"saims-backend/pkg/utils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ─────────────────────────────────────────────────────
//  Helper: create UserService
// ─────────────────────────────────────────────────────

func newUserService(repo *MockUserRepository) services.UserService {
	mockWa := new(MockWhatsAppService)
	return services.NewUserService(repo, mockWa, nil, "test-bucket", nil)
}

// =============================================================
//  TEST GROUP: GetAllUsers
// =============================================================

// A-04 ✅ Positif — GetAllUsers mengembalikan daftar user
func TestGetAllUsers_ShouldReturnList(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	users := []domain.User{
		{ID: "1", Name: "Admin", Role: "Administrator"},
		{ID: "2", Name: "Budi", Role: "Staff"},
	}
	repo.On("FindAll").Return(users, nil)

	result, err := svc.GetAllUsers()

	assert.NoError(t, err)
	assert.Len(t, result, 2)
}

// =============================================================
//  TEST GROUP: GetUserByID
// =============================================================

// ✅ Positif — Ambil user berdasarkan ID yang valid
func TestGetUserByID_WhenUserExists_ShouldReturnUser(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	user := &domain.User{ID: "user-123", Name: "Admin", Role: "Administrator"}
	repo.On("FindByID", "user-123").Return(user, nil)

	result, err := svc.GetUserByID("user-123")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Admin", result.Name)
}

// ❌ Negatif — User tidak ditemukan
func TestGetUserByID_WhenUserNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	repo.On("FindByID", "user-999").Return(nil, nil)

	result, err := svc.GetUserByID("user-999")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
}

// =============================================================
//  TEST GROUP: UpdateUserRole
// =============================================================

// A-05 ✅ Positif — Admin mengubah role Staff → Supervisor
func TestUpdateUserRole_WithValidRole_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	targetUser := &domain.User{ID: "user-456", Name: "Budi", Role: "Staff"}
	repo.On("FindByID", "user-456").Return(targetUser, nil)
	repo.On("UpdateRole", "user-456", "Supervisor").Return(nil)

	err := svc.UpdateUserRole("user-456", "Supervisor", "actorID", "actorName")

	assert.NoError(t, err)
	repo.AssertCalled(t, "UpdateRole", "user-456", "Supervisor")
}

// ❌ Negatif — Role tidak valid
func TestUpdateUserRole_WithInvalidRole_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	err := svc.UpdateUserRole("user-456", "SuperAdmin", "actorID", "actorName") // role tidak ada

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid role")
}

// ❌ Negatif — User tidak ditemukan
func TestUpdateUserRole_WhenUserNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	repo.On("FindByID", "user-999").Return(nil, nil)

	err := svc.UpdateUserRole("user-999", "Staff", "actorID", "actorName")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "user not found")
}

// =============================================================
//  TEST GROUP: UpdateProfile
// =============================================================

// ✅ Positif — Update profil diri sendiri (tanpa ganti HP)
func TestUpdateProfile_WithValidData_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	user := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812"}
	updated := &domain.User{ID: "user-123", Name: "Budi Baru", Phone: "+62812"}

	req := domain.UpdateProfileRequest{Name: "Budi Baru", Phone: "+62812"}
	repo.On("FindByID", "user-123").Return(user, nil).Once()
	repo.On("UpdateProfile", "user-123", mock.Anything).Return(nil)
	repo.On("FindByID", "user-123").Return(updated, nil).Once()

	result, otpRequired, err := svc.UpdateProfile("user-123", req, "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.False(t, otpRequired)
	assert.Equal(t, "Budi Baru", result.Name)
}

// ✅ Positif — Update profil dengan ganti nomor HP (memicu OTP)
func TestUpdateProfile_WhenPhoneChanges_ShouldRequireOTP(t *testing.T) {
	repo := new(MockUserRepository)
	
	// Create mock services manually to expect WhatsApp send message
	mockWa := new(MockWhatsAppService)
	svc := services.NewUserService(repo, mockWa, nil, "test-bucket", nil)

	user := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812"}
	
	req := domain.UpdateProfileRequest{Phone: "+628999"}
	
	repo.On("FindByID", "user-123").Return(user, nil).Once()
	repo.On("FindByPhone", "+628999").Return(nil, nil).Once()
	repo.On("UpdateOTP", "user-123", mock.Anything, mock.Anything).Return(nil).Once()
	repo.On("FindByID", "user-123").Return(user, nil).Once() // to return updated user

	mockWa.On("SendMessage", "+628999", mock.Anything).Return(nil).Once()

	result, otpRequired, err := svc.UpdateProfile("user-123", req, "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.True(t, otpRequired)
	
	// Let background goroutine finish
	time.Sleep(50 * time.Millisecond)
	mockWa.AssertExpectations(t)
}

// ❌ Negatif — Update profil user yang tidak ada
func TestUpdateProfile_WhenUserNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	repo.On("FindByID", "user-999").Return(nil, nil)

	result, otpRequired, err := svc.UpdateProfile("user-999", domain.UpdateProfileRequest{Phone: "+62812"}, "actorID", "actorName")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.False(t, otpRequired)
	assert.Contains(t, err.Error(), "user not found")
}

// =============================================================
//  TEST GROUP: VerifyPhone
// =============================================================

func TestVerifyPhone_Success(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	otpCode := "123456"
	expiry := time.Now().Add(1 * time.Minute)
	user := &domain.User{ID: "user-123", Phone: "+62812", OTPCode: &otpCode, OTPExpiry: &expiry}
	updated := &domain.User{ID: "user-123", Phone: "+628999"}

	repo.On("FindByID", "user-123").Return(user, nil).Once()
	repo.On("FindByPhone", "+628999").Return(nil, nil).Once()
	repo.On("UpdateProfile", "user-123", mock.MatchedBy(func(fields map[string]interface{}) bool {
		return fields["phone"] == "+628999" && fields["otp_code"] == nil
	})).Return(nil).Once()
	repo.On("FindByID", "user-123").Return(updated, nil).Once()

	result, err := svc.VerifyPhone("user-123", domain.VerifyPhoneRequest{OTPCode: "123456", Phone: "+628999"}, "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "+628999", result.Phone)
}

func TestVerifyPhone_InvalidOTP(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	otpCode := "123456"
	expiry := time.Now().Add(1 * time.Minute)
	user := &domain.User{ID: "user-123", Phone: "+62812", OTPCode: &otpCode, OTPExpiry: &expiry}

	repo.On("FindByID", "user-123").Return(user, nil).Once()

	result, err := svc.VerifyPhone("user-123", domain.VerifyPhoneRequest{OTPCode: "654321", Phone: "+628999"}, "actorID", "actorName")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "OTP tidak valid")
}

// =============================================================
//  TEST GROUP: ChangePassword
// =============================================================

// ✅ Positif — Ganti password dengan password lama yang benar
func TestChangePassword_WithCorrectCurrentPassword_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	hashed, _ := utils.HashPassword("PasswordLama123")
	user := &domain.User{ID: "user-123", Password: hashed}

	repo.On("FindByID", "user-123").Return(user, nil)
	repo.On("UpdatePassword", "user-123", mock.AnythingOfType("string")).Return(nil)

	err := svc.ChangePassword("user-123", domain.ChangePasswordRequest{
		CurrentPassword: "PasswordLama123",
		NewPassword:     "PasswordBaru123",
	}, "actorID", "actorName")

	assert.NoError(t, err)
}

// ❌ Negatif — Ganti password dengan password lama yang salah
func TestChangePassword_WithWrongCurrentPassword_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	hashed, _ := utils.HashPassword("PasswordBenar123")
	user := &domain.User{ID: "user-123", Password: hashed}

	repo.On("FindByID", "user-123").Return(user, nil)

	err := svc.ChangePassword("user-123", domain.ChangePasswordRequest{
		CurrentPassword: "PasswordSalah123",
		NewPassword:     "PasswordBaru123",
	}, "actorID", "actorName")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "password lama tidak sesuai")
}

// =============================================================
//  TEST GROUP: DeleteUser
// =============================================================

// A-07 ✅ Positif — Hapus user lain
func TestDeleteUser_WhenUserExists_ShouldSucceed(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	user := &domain.User{ID: "user-456", Name: "Budi"}
	repo.On("FindByID", "user-456").Return(user, nil)
	repo.On("Delete", "user-456").Return(nil)

	err := svc.DeleteUser("user-456", "actorID", "actorName")

	assert.NoError(t, err)
	repo.AssertCalled(t, "Delete", "user-456")
}

// ❌ Negatif — Hapus user yang tidak ada
func TestDeleteUser_WhenUserNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockUserRepository)
	svc := newUserService(repo)

	repo.On("FindByID", "user-999").Return(nil, nil)

	err := svc.DeleteUser("user-999", "actorID", "actorName")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "user not found")
}

