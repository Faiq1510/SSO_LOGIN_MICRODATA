package integration

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"saims-backend/internal/domain"
	"saims-backend/internal/handlers"
)

func setupAuthRouter(mockService *MockAuthService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	handler := handlers.NewAuthHandler(mockService)
	auth := router.Group("/api/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/login", handler.Login)
		auth.POST("/verify-otp", handler.VerifyOTP)
		auth.POST("/resend-otp", handler.ResendOTP)
		auth.GET("/sso/callback", handler.SSOCallback)
		auth.POST("/forgot-password", handler.ForgotPassword)
		auth.POST("/reset-password", handler.ResetPasswordWithOTP)
	}
	
	return router
}

func TestRegisterAPI_Success(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	reqBody := domain.RegisterRequest{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: "Password123",
		Phone:    "08123456789",
	}
	
	mockUser := &domain.User{
		ID:    "123",
		Email: "test@example.com",
		Name:  "Test User",
	}

	mockService.On("Register", reqBody).Return(mockUser, nil)

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "test@example.com", response["email"])
	assert.Contains(t, response["message"], "OTP")
}

func TestRegisterAPI_BadRequest(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	// Missing required fields will trigger binding error or service error
	reqBody := domain.RegisterRequest{
		Email: "test@example.com",
	}

	// Assuming the service returns an error for invalid input or we force it here
	mockService.On("Register", reqBody).Return(nil, errors.New("email already registered"))

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.NotNil(t, response["error"])
}

func TestLoginAPI_Success(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	reqBody := domain.LoginRequest{
		Email:    "test@example.com",
		Password: "Password123",
	}
	
	mockUser := &domain.User{
		ID:    "123",
		Email: "test@example.com",
		Role:  "Staff",
	}
	mockToken := "mock-jwt-token"

	mockService.On("Login", reqBody).Return(mockToken, "mock-refresh-token", mockUser, false, nil)

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	
	var response domain.AuthResponse
	json.Unmarshal(w.Body.Bytes(), &response)
	// JWT is now in HttpOnly cookie, Token field is empty or removed
	assert.Equal(t, "test@example.com", response.User.Email)
}

func TestLoginAPI_Unauthorized(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	reqBody := domain.LoginRequest{
		Email:    "test@example.com",
		Password: "WrongPassword123",
	}

	mockService.On("Login", reqBody).Return("", "", (*domain.User)(nil), false, errors.New("invalid email or password"))

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestVerifyOTPAPI_Success(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	reqBody := domain.VerifyOTPRequest{
		Email:   "test@example.com",
		OTPCode: "123456",
	}
	
	mockUser := &domain.User{
		ID:         "123",
		Email:      "test@example.com",
		IsVerified: true,
	}
	mockToken := "mock-jwt-token"

	mockService.On("VerifyOTP", reqBody).Return(mockToken, "mock-refresh-token", mockUser, nil)

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/verify-otp", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestSSOCallbackAPI_Success(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	ssoToken := "valid-sso-token"
	mockUser := &domain.User{
		ID:    "123",
		Email: "admin@saims.com",
		Role:  "Administrator",
	}

	mockService.On("SSOLogin", ssoToken).Return("mock-access-token", "mock-refresh-token", mockUser, nil)

	req, _ := http.NewRequest(http.MethodGet, "/api/auth/sso/callback?sso_token="+ssoToken, nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Equal(t, "SSO Login successful", response["message"])
	assert.NotNil(t, response["user"])
}

func TestSSOCallbackAPI_InvalidToken(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	ssoToken := "invalid-token"
	mockService.On("SSOLogin", ssoToken).Return("", "", (*domain.User)(nil), errors.New("invalid SSO token"))

	req, _ := http.NewRequest(http.MethodGet, "/api/auth/sso/callback?sso_token="+ssoToken, nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestForgotPasswordAPI_Success(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	reqBody := domain.ForgotPasswordRequest{
		Email: "test@example.com",
	}

	mockService.On("ForgotPassword", "test@example.com").Return(nil)

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/forgot-password", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["message"], "OTP")
}

func TestResetPasswordWithOTPAPI_Success(t *testing.T) {
	mockService := new(MockAuthService)
	router := setupAuthRouter(mockService)

	reqBody := domain.ResetPasswordWithOTPRequest{
		Email:       "test@example.com",
		OTPCode:     "123456",
		NewPassword: "Password123!",
	}

	mockService.On("ResetPasswordWithOTP", reqBody).Return(nil)

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/reset-password", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["message"], "Password berhasil diperbarui")
}

