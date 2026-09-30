package domain

import (
	"time"
)

// Borrowing represents the borrowings table in database
type Borrowing struct {
	ID              string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	UserID          string    `gorm:"not null;type:uuid" json:"user_id"`
	BorrowerName    string    `gorm:"type:text" json:"borrower_name"`
	AssetID         string    `gorm:"type:varchar(50);not null;index" json:"asset_id"`
	AssetName       string    `gorm:"type:text" json:"asset_name"`
	StartDate       string    `gorm:"type:text" json:"start_date"`
	EndDate         string    `gorm:"type:text" json:"end_date"`
	Purpose         string    `gorm:"type:text" json:"purpose"`
	Status          string    `gorm:"not null;default:'Pending_Supervisor';type:text" json:"status"`
	RejectionReason string    `gorm:"type:text" json:"rejection_reason"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// BorrowingRepository interface defines database operations
type BorrowingRepository interface {
	Create(borrowing *Borrowing) error
	CreateMultiple(borrowings []*Borrowing) error
	FindAll(options *BorrowingQueryOptions) ([]Borrowing, int64, error)
	FindByID(id string) (*Borrowing, error)
	UpdateStatus(borrowing *Borrowing, asset *Asset) error
	CountByDatePrefix(datePrefix string) (int64, error)
	FindDueBorrowings(date string) ([]Borrowing, error)
	HasActiveBorrowing(assetID string) (bool, error)
	FindPendingByAssetID(assetID string) ([]Borrowing, error)
	IsAssetActivelyBorrowed(assetID string) (bool, error)
	Delete(id string) error
}

// BorrowingService interface defines business logic
type BorrowingService interface {
	CreateBorrowing(userID string, userName string, input *CreateBorrowingInput) ([]*Borrowing, error)
	GetBorrowings(options *BorrowingQueryOptions) (*PaginatedResponse, error)
	UpdateBorrowingStatus(id string, input *UpdateBorrowingStatusInput, userRole string, actorID string, actorName string) (*Borrowing, error)
	DeleteBorrowing(id string, userRole string, userID string, actorName string) error
}

// Data Transfer Objects (DTO)

type BorrowingQueryOptions struct {
	Page     int
	Limit    int
	Search   string
	Status   string
	UserID   string
}

type CreateBorrowingInput struct {
	AssetIDs  []string `json:"asset_ids" binding:"required,min=1"`
	StartDate string   `json:"start_date" binding:"required"`
	EndDate   string   `json:"end_date" binding:"required"`
	Purpose   string   `json:"purpose" binding:"required"`
}

type UpdateBorrowingStatusInput struct {
	Status          string `json:"status" binding:"required"`
	RejectionReason string `json:"rejection_reason"`
	AssetCondition  string `json:"asset_condition"`
}
