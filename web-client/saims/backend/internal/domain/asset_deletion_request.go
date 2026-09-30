package domain

import (
	"time"

	"github.com/google/uuid"
)

// AssetDeletionRequest represents a request to delete an asset
type AssetDeletionRequest struct {
	ID          uuid.UUID `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AssetID     string    `gorm:"not null;type:varchar(50)" json:"asset_id"`
	RequesterID uuid.UUID `gorm:"not null;type:uuid;column:requested_by" json:"requested_by"`
	ApproverID  *uuid.UUID `gorm:"type:uuid" json:"approver_id,omitempty"` // Can be null if pending
	Reason      string    `gorm:"not null;type:text" json:"reason"`
	Status      string    `gorm:"not null;default:'Pending';type:text" json:"status"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships for eager loading
	Asset     *Asset `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
	Requester *User  `gorm:"foreignKey:RequesterID" json:"requester,omitempty"`
	Approver  *User  `gorm:"foreignKey:ApproverID" json:"approver,omitempty"`
}

// AssetDeletionRequestRepository interface defines database operations
type AssetDeletionRequestRepository interface {
	Create(req *AssetDeletionRequest) error
	FindAll(status string) ([]AssetDeletionRequest, error)
	FindByID(id string) (*AssetDeletionRequest, error)
	UpdateStatus(id string, status string, approverID string) error
}

// AssetDeletionRequestService interface defines business logic
type AssetDeletionRequestService interface {
	CreateRequest(assetID string, requesterID string, actorName string, reason string) (*AssetDeletionRequest, error)
	GetRequests(status string) ([]AssetDeletionRequest, error)
	ApproveRequest(id string, approverID string, actorName string) error
	RejectRequest(id string, approverID string, actorName string) error
}
