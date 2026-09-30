package domain

import (
	"time"
)

// User represents the users table in the database
type User struct {
	ID          string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email       string    `gorm:"type:text;unique;not null" json:"email"`
	Password    string    `gorm:"type:text;not null" json:"-"` // Hidden from JSON response
	Name        string    `gorm:"type:text;not null" json:"name"`
	Phone       string    `gorm:"type:text;not null" json:"phone"`
	Role        string    `gorm:"type:text;default:'Staff'" json:"role"`
	Department  string    `gorm:"type:text" json:"department"`
	IDKaryawan  string    `gorm:"type:varchar(50)" json:"id_karyawan"`
	IsVerified  bool      `gorm:"default:false" json:"is_verified"`
	OTPCode     *string   `gorm:"type:varchar(6)" json:"-"`
	OTPExpiry   *time.Time `json:"-"`
	LastLogin   time.Time `json:"last_login"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// RegisterRequest represents the payload for user registration
type RegisterRequest struct {
	Name       string `json:"name" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=8"`
	Phone      string `json:"phone" binding:"required"`
	Department string `json:"department"`
}

// LoginRequest represents the payload for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// VerifyOTPRequest represents the payload for OTP verification
type VerifyOTPRequest struct {
	Email   string `json:"email" binding:"required,email"`
	OTPCode string `json:"otp_code" binding:"required,len=6"`
}

// ResendOTPRequest represents the payload for requesting a new OTP
type ResendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// AuthResponse represents the response containing token and user info
type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// UpdateRoleRequest represents the payload for updating user role
type UpdateRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

// UpdateProfileRequest represents the payload for updating a user's own profile
type UpdateProfileRequest struct {
	Name       string `json:"name"`
	Phone      string `json:"phone" binding:"required"`
	Department string `json:"department"`
	IDKaryawan string `json:"id_karyawan"`
}

// ChangePasswordRequest represents the payload for changing own password
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// VerifyPhoneRequest represents the payload for verifying profile phone number change
type VerifyPhoneRequest struct {
	OTPCode string `json:"otp_code" binding:"required,len=6"`
	Phone   string `json:"phone" binding:"required"`
}

// ForgotPasswordRequest represents the payload for requesting password reset OTP
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordWithOTPRequest represents the payload for resetting password using OTP
type ResetPasswordWithOTPRequest struct {
	Email       string `json:"email" binding:"required,email"`
	OTPCode     string `json:"otp_code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}



