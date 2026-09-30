package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"
)

type AuthHandler struct {
	authService services.AuthService
}

func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{authService}
}

// Register handler
func (h *AuthHandler) Register(c *gin.Context) {
	var req domain.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.authService.Register(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "OTP has been sent to your WhatsApp",
		"email":   user.Email,
	})
}

// Login handler
func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, refreshToken, user, requireOTP, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if requireOTP {
		c.JSON(http.StatusOK, gin.H{
			"message":     "OTP required",
			"require_otp": true,
			"email":       user.Email,
		})
		return
	}

	// Set HttpOnly Cookies
	c.SetCookie("access_token", accessToken, int(15*60), "/", "", false, true) // 15 mins, secure=false for dev
	c.SetCookie("refresh_token", refreshToken, int(7*24*60*60), "/", "", false, true) // 7 days

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    user,
	})
}

// VerifyOTP handler
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req domain.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	accessToken, refreshToken, user, err := h.authService.VerifyOTP(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set HttpOnly Cookies
	c.SetCookie("access_token", accessToken, int(15*60), "/", "", false, true)
	c.SetCookie("refresh_token", refreshToken, int(7*24*60*60), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP Verified successfully",
		"user":    user,
	})
}

// ResendOTP handler
func (h *AuthHandler) ResendOTP(c *gin.Context) {
	var req domain.ResendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.authService.ResendOTP(req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "OTP has been resent to your WhatsApp",
	})
}

// Refresh handler
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token not found"})
		return
	}

	newAccessToken, newRefreshToken, err := h.authService.RefreshToken(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set HttpOnly Cookies
	c.SetCookie("access_token", newAccessToken, int(15*60), "/", "", false, true)
	c.SetCookie("refresh_token", newRefreshToken, int(7*24*60*60), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
	})
}

// Logout handler
func (h *AuthHandler) Logout(c *gin.Context) {
	accessToken, _ := c.Cookie("access_token")
	refreshToken, _ := c.Cookie("refresh_token")

	err := h.authService.Logout(accessToken, refreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	// Clear cookies
	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// SSOCallback handler
func (h *AuthHandler) SSOCallback(c *gin.Context) {
	ssoToken := c.Query("sso_token")
	if ssoToken == "" {
		var body struct {
			SSOToken string `json:"sso_token"`
		}
		if err := c.ShouldBindJSON(&body); err == nil && body.SSOToken != "" {
			ssoToken = body.SSOToken
		}
	}

	if ssoToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sso_token query parameter or JSON body is required"})
		return
	}

	accessToken, refreshToken, user, err := h.authService.SSOLogin(ssoToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Set HttpOnly Cookies for SAIMS session
	c.SetCookie("access_token", accessToken, int(15*60), "/", "", false, true)
	c.SetCookie("refresh_token", refreshToken, int(7*24*60*60), "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message":      "SSO Login successful",
		"user":         user,
		"token":        accessToken,
		"access_token": accessToken,
	})
}

// ForgotPassword handler
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req domain.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ForgotPassword(req.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kode OTP reset password telah dikirimkan ke WhatsApp Anda.",
	})
}

// ResetPasswordWithOTP handler
func (h *AuthHandler) ResetPasswordWithOTP(c *gin.Context) {
	var req domain.ResetPasswordWithOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ResetPasswordWithOTP(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diperbarui. Silakan login kembali dengan password baru Anda.",
	})
}

