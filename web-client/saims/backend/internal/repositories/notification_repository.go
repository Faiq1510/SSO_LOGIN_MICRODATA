package repositories

import (
	"saims-backend/internal/domain"
	"gorm.io/gorm"
)

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) domain.NotificationRepository {
	return &notificationRepository{db}
}

func (r *notificationRepository) Create(notification *domain.Notification) error {
	return r.db.Create(notification).Error
}

func (r *notificationRepository) FindByUserID(userID string) ([]domain.Notification, error) {
	var notifications []domain.Notification
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notifications).Error
	return notifications, err
}

func (r *notificationRepository) MarkAsRead(id string, userID string) error {
	return r.db.Model(&domain.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error
}

func (r *notificationRepository) MarkAllAsRead(userID string) error {
	return r.db.Model(&domain.Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Update("is_read", true).Error
}

func (r *notificationRepository) CountUnread(userID string) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&count).Error
	return count, err
}
