package domain

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

// AuditLog represents a record of a change in the system
type AuditLog struct {
	ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Action     string    `gorm:"type:varchar(50);not null" json:"action"`       // e.g. "UPDATE_STATUS_SELESAI"
	EntityName string    `gorm:"type:varchar(100);not null" json:"entity_name"` // e.g. "Maintenance"
	EntityID   string    `gorm:"type:varchar(100);not null" json:"entity_id"`   // e.g. "MNT-26-0001"
	OldPayload string    `gorm:"type:jsonb" json:"old_payload"`                 // JSON string
	NewPayload string    `gorm:"type:jsonb" json:"new_payload"`                 // JSON string
	ChangedBy  string    `gorm:"type:varchar(255);not null" json:"changed_by"`  // User ID or Name
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// BeforeUpdate prevents modification of existing audit logs
func (a *AuditLog) BeforeUpdate(tx *gorm.DB) (err error) {
	return errors.New("Audit logs are immutable")
}

// BeforeDelete prevents deletion of existing audit logs
func (a *AuditLog) BeforeDelete(tx *gorm.DB) (err error) {
	return errors.New("Audit logs are immutable")
}

// AuditRepository defines the interface for audit database operations
type AuditRepository interface {
	Create(log *AuditLog) error
	FindAll(offset, limit int, filters map[string]string) ([]AuditLog, int64, error)
}
