package repositories

import (
	"saims-backend/internal/domain"
	"gorm.io/gorm"
)

type JWTBlacklistRepository interface {
	Create(blacklist *domain.JWTBlacklist) error
	IsBlacklisted(token string) bool
}

type jwtBlacklistRepository struct {
	db *gorm.DB
}

func NewJWTBlacklistRepository(db *gorm.DB) JWTBlacklistRepository {
	return &jwtBlacklistRepository{db}
}

func (r *jwtBlacklistRepository) Create(blacklist *domain.JWTBlacklist) error {
	return r.db.Create(blacklist).Error
}

func (r *jwtBlacklistRepository) IsBlacklisted(token string) bool {
	var count int64
	r.db.Model(&domain.JWTBlacklist{}).Where("token = ?", token).Count(&count)
	return count > 0
}
