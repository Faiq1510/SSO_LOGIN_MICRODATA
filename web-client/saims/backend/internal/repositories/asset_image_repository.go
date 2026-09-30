package repositories

import (
	"saims-backend/internal/domain"

	"gorm.io/gorm"
)

type assetImageRepository struct {
	db *gorm.DB
}

func NewAssetImageRepository(db *gorm.DB) domain.AssetImageRepository {
	return &assetImageRepository{db: db}
}

func (r *assetImageRepository) Create(image *domain.AssetImage) error {
	return r.db.Create(image).Error
}

func (r *assetImageRepository) FindByAssetID(assetID string) ([]domain.AssetImage, error) {
	var images []domain.AssetImage
	err := r.db.Where("asset_id = ?", assetID).Order("sort_order ASC, created_at ASC").Find(&images).Error
	return images, err
}

func (r *assetImageRepository) FindPrimaryByAssetID(assetID string) (*domain.AssetImage, error) {
	var image domain.AssetImage
	err := r.db.Where("asset_id = ? AND is_primary = ?", assetID, true).First(&image).Error
	if err != nil {
		return nil, err
	}
	return &image, nil
}

func (r *assetImageRepository) FindByID(id string) (*domain.AssetImage, error) {
	var image domain.AssetImage
	err := r.db.Where("id = ?", id).First(&image).Error
	if err != nil {
		return nil, err
	}
	return &image, nil
}

func (r *assetImageRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.AssetImage{}).Error
}

func (r *assetImageRepository) Restore(id string) error {
	return r.db.Unscoped().Model(&domain.AssetImage{}).Where("id = ?", id).Update("deleted_at", nil).Error
}

func (r *assetImageRepository) HardDelete(id string) error {
	return r.db.Unscoped().Where("id = ?", id).Delete(&domain.AssetImage{}).Error
}

func (r *assetImageRepository) FindDeletedByAssetID(assetID string) ([]domain.AssetImage, error) {
	var images []domain.AssetImage
	err := r.db.Unscoped().Where("asset_id = ? AND deleted_at IS NOT NULL", assetID).Find(&images).Error
	return images, err
}

func (r *assetImageRepository) SetPrimary(assetID, imageID string) error {
	// Start a transaction to ensure atomic update
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Set all to false
		if err := tx.Model(&domain.AssetImage{}).Where("asset_id = ?", assetID).Update("is_primary", false).Error; err != nil {
			return err
		}
		// Set the specified one to true
		if err := tx.Model(&domain.AssetImage{}).Where("id = ?", imageID).Update("is_primary", true).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *assetImageRepository) FindAllObjectKeys() ([]string, error) {
	var keys []string
	err := r.db.Model(&domain.AssetImage{}).Pluck("object_key", &keys).Error
	return keys, err
}
