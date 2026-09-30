package domain

import (
	"time"
)

// Notification represents the in-app notification entity
type Notification struct {
	ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    string    `gorm:"type:uuid;not null;index" json:"user_id"`
	Title     string    `gorm:"type:text;not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Type      string    `gorm:"type:varchar(50)" json:"type"` // e.g. "borrowing", "maintenance", "system"
	IsRead    bool      `gorm:"default:false" json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// NotificationRepository defines the interface for notification data access
type NotificationRepository interface {
	Create(notification *Notification) error
	FindByUserID(userID string) ([]Notification, error)
	MarkAsRead(id string, userID string) error
	MarkAllAsRead(userID string) error
	CountUnread(userID string) (int64, error)
}
