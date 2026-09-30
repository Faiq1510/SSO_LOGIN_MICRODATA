package handlers

// This file contains all Swagger API documentation annotations.
// It is kept separate to prevent cluttering the actual source code files.
// Run `swag init -g cmd/server/main.go` from the backend directory to regenerate the swagger files.

import (
	_ "saims-backend/internal/domain"
)

// ==========================================
// AUTHENTICATION
// ==========================================

// @Summary Register a new user
// @Description Register a new user and get user details
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body domain.RegisterRequest true "Registration data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/register [post]
func _swagger_Register() {}

// @Summary Login user
// @Description Authenticate user. Catatan: API masuk tidak lagi mengembalikan Token di dalam tubuh JSON, melainkan berevolusi menjadi Set-Cookie HttpOnly.
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body domain.LoginRequest true "Login credentials"
// @Success 200 {object} domain.AuthResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /auth/login [post]
func _swagger_Login() {}

// @Summary Verify OTP
// @Description Verify OTP and return JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body domain.VerifyOTPRequest true "OTP credentials"
// @Success 200 {object} domain.AuthResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /auth/verify-otp [post]
func _swagger_VerifyOTP() {}

// @Summary Resend OTP
// @Description Resend OTP to user's WhatsApp
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body domain.ResendOTPRequest true "Email credentials"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/resend-otp [post]
func _swagger_ResendOTP() {}

// @Summary Logout user
// @Description Blacklist active JWT token and clear auth cookies
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /auth/logout [post]
func _swagger_Logout() {}

// ==========================================
// ASSETS
// ==========================================

// @Summary Create a new asset
// @Description Create a new asset with details
// @Tags Assets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.CreateAssetInput true "Asset Input"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets [post]
func _swagger_CreateAsset() {}

// @Summary Create multiple assets
// @Description Create multiple assets in bulk
// @Tags Assets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.CreateBulkAssetsInput true "Bulk Assets Input"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/bulk [post]
func _swagger_CreateBulkAssets() {}

// @Summary Get list of assets
// @Description Get a paginated list of assets with optional filters
// @Tags Assets
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number"
// @Param limit query int false "Limit per page"
// @Param search query string false "Search query"
// @Param category query string false "Category"
// @Param status query string false "Status"
// @Param condition query string false "Condition"
// @Param location query string false "Location"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets [get]
func _swagger_GetAssets() {}

// @Summary Get asset by ID
// @Description Get details of a specific asset
// @Tags Assets
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /assets/{id} [get]
func _swagger_GetAssetByID() {}

// @Summary Update an asset
// @Description Update details of an existing asset
// @Tags Assets
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Param input body domain.UpdateAssetInput true "Asset Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/{id} [put]
func _swagger_UpdateAsset() {}

// @Summary Delete an asset
// @Description Delete an existing asset
// @Tags Assets
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/{id} [delete]
func _swagger_DeleteAsset() {}

// ==========================================
// ASSET IMAGES
// ==========================================

// @Summary Upload asset image
// @Description Upload an image for a specific asset
// @Tags Asset Images
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Param image formData file true "Image File"
// @Param is_primary formData boolean false "Set as primary image"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/{id}/images [post]
func _swagger_UploadImage() {}

// @Summary Get images by asset ID
// @Description Get all images for a specific asset
// @Tags Asset Images
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/{id}/images [get]
func _swagger_GetImages() {}

// @Summary Delete asset image
// @Description Delete a specific asset image
// @Tags Asset Images
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Param imageId path string true "Image ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/{id}/images/{imageId} [delete]
func _swagger_DeleteImage() {}

// @Summary Set primary image
// @Description Set a specific image as the primary image for an asset
// @Tags Asset Images
// @Produce json
// @Security BearerAuth
// @Param id path string true "Asset ID"
// @Param imageId path string true "Image ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /assets/{id}/images/{imageId}/primary [put]
func _swagger_SetPrimaryImage() {}

// ==========================================
// BORROWINGS
// ==========================================

// @Summary Create borrowing request
// @Description Create a new borrowing request
// @Tags Borrowings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.CreateBorrowingInput true "Borrowing Input"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /borrowings [post]
func _swagger_CreateBorrowing() {}

// @Summary Get borrowing requests
// @Description Get list of borrowing requests
// @Tags Borrowings
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number"
// @Param limit query int false "Limit per page"
// @Param search query string false "Search query"
// @Param status query string false "Status filter"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /borrowings [get]
func _swagger_GetBorrowings() {}

// @Summary Update borrowing status
// @Description Update the status of a borrowing request
// @Tags Borrowings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Borrowing ID"
// @Param input body domain.UpdateBorrowingStatusInput true "Status Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /borrowings/{id}/status [put]
func _swagger_UpdateBorrowingStatus() {}

// @Summary Delete borrowing request
// @Description Delete a borrowing request
// @Tags Borrowings
// @Produce json
// @Security BearerAuth
// @Param id path string true "Borrowing ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /borrowings/{id} [delete]
func _swagger_DeleteBorrowing() {}

// ==========================================
// DASHBOARD
// ==========================================

// @Summary Get dashboard stats
// @Description Get overall statistics for the dashboard
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /dashboard/stats [get]
func _swagger_GetStats() {}

// @Summary Get landing stats
// @Description Get statistics for the landing page
// @Tags Dashboard
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /public/landing-stats [get]
func _swagger_GetLandingStats() {}

// ==========================================
// MAINTENANCES
// ==========================================

// @Summary Get maintenance records
// @Description Get a paginated list of maintenance records
// @Tags Maintenances
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number"
// @Param limit query int false "Limit per page"
// @Param search query string false "Search query"
// @Param status query string false "Status filter"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /maintenance [get]
func _swagger_GetMaintenances() {}

// @Summary Create maintenance record
// @Description Create a new maintenance record
// @Tags Maintenances
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.CreateMaintenanceInput true "Maintenance Input"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /maintenance [post]
func _swagger_CreateMaintenance() {}

// @Summary Update maintenance status
// @Description Update the status of a maintenance record
// @Tags Maintenances
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Maintenance ID"
// @Param input body domain.UpdateMaintenanceStatusInput true "Status Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /maintenance/{id}/status [put]
func _swagger_UpdateMaintenanceStatus() {}

// @Summary Update maintenance details
// @Description Update the specific details of a maintenance record
// @Tags Maintenances
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Maintenance ID"
// @Param input body domain.UpdateMaintenanceDetailsInput true "Details Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /maintenance/{id}/details [put]
func _swagger_UpdateDetails() {}

// @Summary Confirm bulk payment for maintenance
// @Description Confirm payment for multiple maintenance records (Administrator only) and generate PDF invoice
// @Tags Maintenances
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body map[string]interface{} true "Bulk Payment Input: maintenance_ids array"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /maintenance/payment/confirm [post]
func _swagger_ConfirmPayment() {}

// ==========================================
// NOTIFICATIONS
// ==========================================

// @Summary Get user notifications
// @Description Get notifications for the authenticated user
// @Tags Notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /notifications [get]
func _swagger_GetMyNotifications() {}

// @Summary Mark notification as read
// @Description Mark a specific notification as read
// @Tags Notifications
// @Produce json
// @Security BearerAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /notifications/{id}/read [put]
func _swagger_MarkAsRead() {}

// @Summary Mark all notifications as read
// @Description Mark all notifications for the user as read
// @Tags Notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /notifications/read-all [put]
func _swagger_MarkAllAsRead() {}

// ==========================================
// USERS
// ==========================================

// @Summary Get all users
// @Description Get a list of all users
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /users [get]
func _swagger_GetUsers() {}

// @Summary Get user by ID
// @Description Get details of a specific user
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /users/{id} [get]
func _swagger_GetUserByID() {}

// @Summary Update user role
// @Description Update the role of a user
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Param input body domain.UpdateRoleRequest true "Role Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /users/{id}/role [put]
func _swagger_UpdateUserRole() {}

// @Summary Update user profile
// @Description Update profile of the authenticated user
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.UpdateProfileRequest true "Profile Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /users/profile [put]
func _swagger_UpdateProfile() {}

// @Summary Verify phone with OTP
// @Description Verify phone number update with OTP
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.VerifyPhoneRequest true "OTP Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /users/profile/verify-phone [post]
func _swagger_VerifyPhone() {}

// @Summary Change user password
// @Description Change password of the authenticated user
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body domain.ChangePasswordRequest true "Password Update Input"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /users/change-password [put]
func _swagger_ChangePassword() {}

// @Summary Delete user
// @Description Delete an existing user
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /users/{id} [delete]
func _swagger_DeleteUser() {}
// @Summary Health Check
// @Description Check API health status
// @Tags Public
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func _swagger_Health() {}



