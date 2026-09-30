package repositories

import (
	"gorm.io/gorm"
	"saims-backend/internal/domain"
)

type borrowingRepository struct {
	db *gorm.DB
}

// NewBorrowingRepository creates a new instance of BorrowingRepository
func NewBorrowingRepository(db *gorm.DB) domain.BorrowingRepository {
	return &borrowingRepository{db: db}
}

func (r *borrowingRepository) Create(borrowing *domain.Borrowing) error {
	return r.db.Create(borrowing).Error
}

func (r *borrowingRepository) CreateMultiple(borrowings []*domain.Borrowing) error {
	return r.db.Create(borrowings).Error
}

func (r *borrowingRepository) FindAll(options *domain.BorrowingQueryOptions) ([]domain.Borrowing, int64, error) {
	var borrowings []domain.Borrowing
	var total int64

	query := r.db.Model(&domain.Borrowing{})

	if options.Search != "" {
		searchTerm := "%" + options.Search + "%"
		query = query.Where("borrower_name ILIKE ? OR asset_name ILIKE ? OR id ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if options.Status != "" {
		if options.Status == "history" {
			query = query.Where("status IN ?", []string{"Selesai", "Rejected"})
		} else {
			query = query.Where("status = ?", options.Status)
		}
	}

	if options.UserID != "" {
		query = query.Where("user_id = ?", options.UserID)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	// Apply pagination if Limit > 0
	if options.Limit > 0 {
		offset := (options.Page - 1) * options.Limit
		query = query.Offset(offset).Limit(options.Limit)
	}

	err = query.Order("created_at desc").Find(&borrowings).Error
	return borrowings, total, err
}

func (r *borrowingRepository) FindByID(id string) (*domain.Borrowing, error) {
	var borrowing domain.Borrowing
	err := r.db.Where("id = ?", id).First(&borrowing).Error
	if err != nil {
		return nil, err
	}
	return &borrowing, nil
}

func (r *borrowingRepository) UpdateStatus(borrowing *domain.Borrowing, asset *domain.Asset) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(borrowing).Error; err != nil {
			return err
		}
		if asset != nil {
			if err := tx.Save(asset).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *borrowingRepository) CountByDatePrefix(idPrefix string) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Borrowing{}).Where("id LIKE ?", idPrefix+"%").Count(&count).Error
	return count, err
}

func (r *borrowingRepository) FindDueBorrowings(date string) ([]domain.Borrowing, error) {
	var borrowings []domain.Borrowing
	err := r.db.Where("end_date = ? AND status = 'Selesai' = false AND status = 'Rejected' = false", date).Find(&borrowings).Error
	return borrowings, err
}

func (r *borrowingRepository) HasActiveBorrowing(assetID string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Borrowing{}).
		Where("asset_id = ? AND status NOT IN ?", assetID, []string{"Rejected", "Selesai"}).
		Count(&count).Error
	return count > 0, err
}

func (r *borrowingRepository) FindPendingByAssetID(assetID string) ([]domain.Borrowing, error) {
	var borrowings []domain.Borrowing
	err := r.db.Where("asset_id = ? AND status = ?", assetID, "Pending_Supervisor").Find(&borrowings).Error
	return borrowings, err
}

func (r *borrowingRepository) IsAssetActivelyBorrowed(assetID string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Borrowing{}).
		Where("asset_id = ? AND status IN ?", assetID, []string{"Approved", "Menunggu_Kembali", "Return_Rejected"}).
		Count(&count).Error
	return count > 0, err
}

func (r *borrowingRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Borrowing{}).Error
}
