package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"
)

type UserHandler struct {
	userService services.UserService
}

func NewUserHandler(userService services.UserService) *UserHandler {
	return &UserHandler{userService}
}

// GetUsers returns all users — Administrator only (enforced via route middleware)
func (h *UserHandler) GetUsers(c *gin.Context) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengguna"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Users retrieved successfully",
		"data":    users,
	})
}

// GetUserByID returns a single user — Administrator only (enforced via route middleware)
func (h *UserHandler) GetUserByID(c *gin.Context) {
	id := c.Param("id")
	user, err := h.userService.GetUserByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "User retrieved successfully",
		"data":    user,
	})
}

// UpdateUserRole updates a user's role — Administrator only (enforced via route middleware)
func (h *UserHandler) UpdateUserRole(c *gin.Context) {
	id := c.Param("id")

	var req domain.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	actorID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	
	actorIDStr, _ := actorID.(string)
	actorNameStr, _ := actorName.(string)

	err := h.userService.UpdateUserRole(id, req.Role, actorIDStr, actorNameStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User role updated successfully"})
}

// UpdateProfile allows any authenticated user to update their own profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req domain.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	userName, _ := c.Get("userName")
	actorNameStr, _ := userName.(string)

	user, otpRequired, err := h.userService.UpdateProfile(userID.(string), req, userID.(string), actorNameStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Profile updated successfully",
		"otp_required": otpRequired,
		"data":         user,
	})
}

// VerifyPhone verifies the OTP code for updating phone number
func (h *UserHandler) VerifyPhone(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req domain.VerifyPhoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	userName, _ := c.Get("userName")
	actorNameStr, _ := userName.(string)

	user, err := h.userService.VerifyPhone(userID.(string), req, userID.(string), actorNameStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Nomor WhatsApp berhasil diverifikasi dan diperbarui!",
		"data":    user,
	})
}

// ChangePassword allows any authenticated user to change their own password
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req domain.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	userName, _ := c.Get("userName")
	actorNameStr, _ := userName.(string)

	if err := h.userService.ChangePassword(userID.(string), req, userID.(string), actorNameStr); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// DeleteUser deletes a user — Administrator only (enforced via route middleware)
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	actorID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	
	actorIDStr, _ := actorID.(string)
	actorNameStr, _ := actorName.(string)

	err := h.userService.DeleteUser(id, actorIDStr, actorNameStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
