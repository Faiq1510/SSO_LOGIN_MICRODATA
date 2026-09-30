package unit

import (
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"
)

func TestSSOLogin_Success(t *testing.T) {
	ssoSecret := "test_sso_secret_key_123"
	os.Setenv("SSO_SHARED_SECRET", ssoSecret)
	defer os.Unsetenv("SSO_SHARED_SECRET")

	mockUserRepo := new(MockUserRepository)
	mockWAService := new(MockWhatsAppService)
	mockAuditRepo := new(MockAuditRepository)

	authService := services.NewAuthService(mockUserRepo, mockWAService, mockAuditRepo, nil)

	// Create a valid SSO token signed with ssoSecret
	claims := jwt.MapClaims{
		"iss":              "portal-login-microdata",
		"user_id_external": "admin@saims.com",
		"role_external":    "Administrator",
		"exp":              time.Now().Add(5 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(ssoSecret))
	assert.NoError(t, err)

	existingUser := &domain.User{
		ID:    "user-uuid-123",
		Name:  "Admin SAIMS",
		Email: "admin@saims.com",
		Role:  "Administrator",
	}

	mockUserRepo.On("FindByEmail", "admin@saims.com").Return(existingUser, nil)
	mockUserRepo.On("UpdateLastLogin", "user-uuid-123").Return(nil)
	mockAuditRepo.On("Create", mock.Anything).Return(nil).Maybe()

	accessToken, refreshToken, user, err := authService.SSOLogin(tokenString)

	assert.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	assert.NotEmpty(t, refreshToken)
	assert.Equal(t, "admin@saims.com", user.Email)
	assert.Equal(t, "Administrator", user.Role)
}

func TestSSOLogin_InvalidIssuer(t *testing.T) {
	ssoSecret := "test_sso_secret_key_123"
	os.Setenv("SSO_SHARED_SECRET", ssoSecret)
	defer os.Unsetenv("SSO_SHARED_SECRET")

	mockUserRepo := new(MockUserRepository)
	mockWAService := new(MockWhatsAppService)
	mockAuditRepo := new(MockAuditRepository)

	authService := services.NewAuthService(mockUserRepo, mockWAService, mockAuditRepo, nil)

	claims := jwt.MapClaims{
		"iss":              "unknown-issuer",
		"user_id_external": "admin@saims.com",
		"role_external":    "Administrator",
		"exp":              time.Now().Add(5 * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(ssoSecret))
	assert.NoError(t, err)

	_, _, _, err = authService.SSOLogin(tokenString)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid SSO token issuer")
}
