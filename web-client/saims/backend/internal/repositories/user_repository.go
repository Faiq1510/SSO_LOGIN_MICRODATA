package repositories

import (
	"errors"
	"time"
	"gorm.io/gorm"
	"saims-backend/internal/domain"
)

type UserRepository interface {
	Create(user *domain.User) error
	FindByEmail(email string) (*domain.User, error)
	FindByPhone(phone string) (*domain.User, error)
	FindByID(id string) (*domain.User, error)
	FindAll() ([]domain.User, error)
	FindByRole(role string) ([]domain.User, error)
	UpdateRole(id string, role string) error
	UpdateProfile(id string, fields map[string]interface{}) error
	UpdatePassword(id string, hashedPassword string) error
	Delete(id string) error
	UpdateLastLogin(userID string) error
	UpdateOTP(id string, otpCode *string, otpExpiry *time.Time) error
	UpdateVerification(id string, isVerified bool) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

func (r *userRepository) Create(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByEmail(email string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil if not found instead of error
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByPhone(phone string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("phone = ?", phone).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByID(id string) (*domain.User, error) {
	var user domain.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindAll() ([]domain.User, error) {
	var users []domain.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *userRepository) FindByRole(role string) ([]domain.User, error) {
	var users []domain.User
	err := r.db.Where("role = ?", role).Find(&users).Error
	return users, err
}

func (r *userRepository) UpdateRole(id string, role string) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Update("role", role).Error
}

func (r *userRepository) UpdateProfile(id string, fields map[string]interface{}) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Updates(fields).Error
}

func (r *userRepository) UpdatePassword(id string, hashedPassword string) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Update("password", hashedPassword).Error
}

func (r *userRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.User{}).Error
}

func (r *userRepository) UpdateLastLogin(userID string) error {
	return r.db.Model(&domain.User{}).Where("id = ?", userID).Update("last_login", gorm.Expr("NOW()")).Error
}

func (r *userRepository) UpdateOTP(id string, otpCode *string, otpExpiry *time.Time) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Updates(map[string]interface{}{
		"otp_code":   otpCode,
		"otp_expiry": otpExpiry,
	}).Error
}

func (r *userRepository) UpdateVerification(id string, isVerified bool) error {
	return r.db.Model(&domain.User{}).Where("id = ?", id).Update("is_verified", isVerified).Error
}
