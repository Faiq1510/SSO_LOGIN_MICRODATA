package domain

import (
	"time"

	"gorm.io/gorm"
)

// AssetImage represents the asset_images table in database
type AssetImage struct {
	ID          string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	AssetID     string         `gorm:"type:varchar(50);not null" json:"asset_id"`
	ObjectKey   string         `gorm:"type:text;not null" json:"object_key"`
	BucketName  string         `gorm:"type:text;not null;default:'inventory-assets'" json:"bucket_name"`
	FileName    string         `gorm:"type:text" json:"file_name"`
	MimeType    string         `gorm:"type:text" json:"mime_type"`
	FileSize    int64          `gorm:"type:bigint" json:"file_size"`
	IsPrimary   bool           `gorm:"not null;default:false" json:"is_primary"`
	SortOrder   int            `gorm:"not null;default:0" json:"sort_order"`
	UploadedBy  *string        `gorm:"type:uuid" json:"uploaded_by"`
	CreatedAt   time.Time      `gorm:"default:now()" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"default:now()" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// AssetImageRepository defines database operations for asset images
type AssetImageRepository interface {
	Create(image *AssetImage) error
	FindByAssetID(assetID string) ([]AssetImage, error)
	FindPrimaryByAssetID(assetID string) (*AssetImage, error)
	FindByID(id string) (*AssetImage, error)
	Delete(id string) error
	Restore(id string) error
	FindDeletedByAssetID(assetID string) ([]AssetImage, error)
	HardDelete(id string) error
	SetPrimary(assetID, imageID string) error
	FindAllObjectKeys() ([]string, error)
}

