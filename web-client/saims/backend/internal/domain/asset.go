package domain

import (
	"time"

	"gorm.io/gorm"
)

// Asset represents the assets table in database
type Asset struct {
	ID           string         `gorm:"primaryKey;type:varchar(50)" json:"id"`
	Name         string         `gorm:"not null;type:text" json:"name"`
	Category     string         `gorm:"not null;type:text" json:"category"`
	Location     string         `gorm:"not null;type:text" json:"location"`
	Status       string         `gorm:"not null;default:'Tersedia';type:text" json:"status"`
	Condition    string         `gorm:"not null;default:'Baik';type:text" json:"condition"`
	PurchaseDate *string        `gorm:"type:text" json:"purchase_date"`
	SerialNumber *string        `gorm:"type:text" json:"serial_number"`
	QRCode       string         `gorm:"unique;type:text" json:"qr_code"`
	Description  string         `gorm:"type:text" json:"description"`
	Images              []AssetImage   `gorm:"foreignKey:AssetID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images,omitempty"`
	HasPendingDeletion  bool           `gorm:"-" json:"has_pending_deletion"`
	CreatedAt           time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// AssetRepository interface defines database operations
type AssetRepository interface {
	Create(asset *Asset) error
	FindAll(options *AssetQueryOptions) ([]Asset, int64, error)
	FindByID(id string) (*Asset, error)
	Update(asset *Asset) error
	Delete(id string) error
	Restore(id string) error
	HardDelete(id string) error
	FindDeleted(options *AssetQueryOptions) ([]Asset, int64, error)
	DeleteOldTrash(days int) error
	GetLastIDByPrefix(prefix string) (string, error)
}

// AssetService interface defines business logic
type AssetService interface {
	CreateAsset(input *CreateAssetInput, actorID, actorName string) (*Asset, error)
	CreateBulkAssets(input *CreateBulkAssetsInput, actorID, actorName string) ([]*Asset, error)
	GetAssets(options *AssetQueryOptions) (*PaginatedResponse, error)
	GetAssetByID(id string) (*Asset, error)
	UpdateAsset(id string, input *UpdateAssetInput, actorID, actorName string) (*Asset, error)
	DeleteAsset(id string, actorID, actorName string) error
	RestoreAsset(id string, actorID, actorName string) error
	GetDeletedAssets(options *AssetQueryOptions) (*PaginatedResponse, error)
}

// Data Transfer Objects (DTO)

type AssetQueryOptions struct {
	Page      int
	Limit     int
	Search    string
	Category  string
	Status    string
	Condition string
	Location  string
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type CreateAssetInput struct {
	Name         string `json:"name" binding:"required"`
	Category     string `json:"category" binding:"required"`
	Location     string `json:"location" binding:"required"`
	Status       string `json:"status" binding:"required"`
	Condition    string `json:"condition" binding:"required"`
	PurchaseDate string `json:"purchase_date"`
	SerialNumber string `json:"serial_number"`
	Description  string `json:"description"`
}

type UpdateAssetInput struct {
	Name         string `json:"name"`
	Category     string `json:"category"`
	Location     string `json:"location"`
	Status       string `json:"status"`
	Condition    string `json:"condition"`
	PurchaseDate *string `json:"purchase_date"`
	SerialNumber *string `json:"serial_number"`
	Description  string `json:"description"`
}

type CreateBulkAssetsInput struct {
	Name         string          `json:"name" binding:"required"`
	Category     string          `json:"category" binding:"required"`
	Location     string          `json:"location" binding:"required"`
	PurchaseDate string          `json:"purchase_date"`
	Description  string          `json:"description"`
	Items        []BulkAssetItem `json:"items" binding:"required,min=1"`
}

type BulkAssetItem struct {
	SerialNumber string `json:"serial_number"`
	Condition    string `json:"condition" binding:"required"`
	Status       string `json:"status"`
}
