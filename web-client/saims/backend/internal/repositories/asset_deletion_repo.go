package repositories

import (
	"gorm.io/gorm"
	"saims-backend/internal/domain"
)

type assetDeletionRequestRepository struct {
	db *gorm.DB
}

// NewAssetDeletionRequestRepository creates a new repository instance
func NewAssetDeletionRequestRepository(db *gorm.DB) domain.AssetDeletionRequestRepository {
	return &assetDeletionRequestRepository{db: db}
}

func (r *assetDeletionRequestRepository) Create(req *domain.AssetDeletionRequest) error {
	return r.db.Create(req).Error
}

func (r *assetDeletionRequestRepository) FindAll(status string) ([]domain.AssetDeletionRequest, error) {
	var requests []domain.AssetDeletionRequest
	query := r.db.Preload("Asset").Preload("Requester").Preload("Approver")
	
	if status != "" {
		query = query.Where("status = ?", status)
	}

	err := query.Order("created_at desc").Find(&requests).Error
	return requests, err
}

func (r *assetDeletionRequestRepository) FindByID(id string) (*domain.AssetDeletionRequest, error) {
	var req domain.AssetDeletionRequest
	err := r.db.Preload("Asset").Preload("Requester").Preload("Approver").First(&req, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}

func (r *assetDeletionRequestRepository) UpdateStatus(id string, status string, approverID string) error {
	return r.db.Model(&domain.AssetDeletionRequest{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":      status,
			"approver_id": approverID,
		}).Error
}
