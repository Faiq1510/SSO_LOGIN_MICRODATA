package repositories

import (
	"errors"
	"saims-backend/internal/domain"

	"gorm.io/gorm"
)

type assetRepository struct {
	db *gorm.DB
}

// NewAssetRepository creates a new instance of AssetRepository
func NewAssetRepository(db *gorm.DB) domain.AssetRepository {
	return &assetRepository{db: db}
}

func (r *assetRepository) Create(asset *domain.Asset) error {
	return r.db.Create(asset).Error
}

func (r *assetRepository) FindAll(options *domain.AssetQueryOptions) ([]domain.Asset, int64, error) {
	var assets []domain.Asset
	var total int64

	query := r.db.Model(&domain.Asset{})

	if options.Search != "" {
		searchTerm := "%" + options.Search + "%"
		query = query.Where("name ILIKE ? OR id ILIKE ?", searchTerm, searchTerm)
	}
	if options.Category != "" {
		query = query.Where("category = ?", options.Category)
	}
	if options.Status != "" {
		query = query.Where("status = ?", options.Status)
	}
	if options.Condition != "" {
		query = query.Where("condition = ?", options.Condition)
	}
	if options.Location != "" {
		query = query.Where("location = ?", options.Location)
	}

	// Count total records matching the filters (before pagination)
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (options.Page - 1) * options.Limit
	err = query.Preload("Images").Order("created_at desc").Offset(offset).Limit(options.Limit).Find(&assets).Error

	return assets, total, err
}

func (r *assetRepository) FindByID(id string) (*domain.Asset, error) {
	var asset domain.Asset
	err := r.db.Preload("Images").Where("id = ?", id).First(&asset).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("asset not found")
		}
		return nil, err
	}
	return &asset, nil
}

func (r *assetRepository) Update(asset *domain.Asset) error {
	return r.db.Save(asset).Error
}

func (r *assetRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Asset{}).Error
}

func (r *assetRepository) Restore(id string) error {
	return r.db.Unscoped().Model(&domain.Asset{}).Where("id = ?", id).Update("deleted_at", nil).Error
}

func (r *assetRepository) HardDelete(id string) error {
	return r.db.Unscoped().Where("id = ?", id).Delete(&domain.Asset{}).Error
}

func (r *assetRepository) DeleteOldTrash(days int) error {
	return r.db.Unscoped().Where("deleted_at < NOW() - INTERVAL '1 day' * ?", days).Delete(&domain.Asset{}).Error
}

func (r *assetRepository) FindDeleted(options *domain.AssetQueryOptions) ([]domain.Asset, int64, error) {
	var assets []domain.Asset
	var total int64

	query := r.db.Unscoped().Model(&domain.Asset{}).Where("deleted_at IS NOT NULL")

	if options.Search != "" {
		searchTerm := "%" + options.Search + "%"
		query = query.Where("name ILIKE ? OR id ILIKE ?", searchTerm, searchTerm)
	}
	if options.Category != "" {
		query = query.Where("category = ?", options.Category)
	}
	if options.Status != "" {
		query = query.Where("status = ?", options.Status)
	}
	if options.Condition != "" {
		query = query.Where("condition = ?", options.Condition)
	}
	if options.Location != "" {
		query = query.Where("location = ?", options.Location)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	offset := (options.Page - 1) * options.Limit
	err = query.Preload("Images").Order("deleted_at desc").Offset(offset).Limit(options.Limit).Find(&assets).Error

	return assets, total, err
}

func (r *assetRepository) GetLastIDByPrefix(prefix string) (string, error) {
	var asset domain.Asset
	err := r.db.Unscoped().Where("id LIKE ?", prefix+"%").Order("id desc").First(&asset).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil // No existing asset with this prefix
		}
		return "", err
	}
	return asset.ID, nil
}
