package repositories

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"saims-backend/internal/domain"
)

type MaintenanceRepository interface {
	Create(m *domain.Maintenance, asset *domain.Asset) error
	FindAll(options *domain.MaintenanceQueryOptions) ([]domain.Maintenance, int64, error)
	FindByID(id string) (*domain.Maintenance, error)
	Update(m *domain.Maintenance) error
	UpdateStatus(m *domain.Maintenance, asset *domain.Asset) error
	GetLastID() (string, error)
	FindMaintenanceByScheduledDate(date string) ([]domain.Maintenance, error)
	CreateBulk(maintenances []*domain.Maintenance) error
	UpdatePaymentStatusAndInvoice(id string, status string, invoiceURL string) error
	IsAssetInActiveMaintenance(assetID string) (bool, error)
}

type maintenanceRepository struct {
	db *gorm.DB
}

func NewMaintenanceRepository(db *gorm.DB) MaintenanceRepository {
	return &maintenanceRepository{db}
}

func (r *maintenanceRepository) Create(m *domain.Maintenance, asset *domain.Asset) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(m).Error; err != nil {
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

func (r *maintenanceRepository) FindAll(options *domain.MaintenanceQueryOptions) ([]domain.Maintenance, int64, error) {
	var records []domain.Maintenance
	var total int64

	query := r.db.Model(&domain.Maintenance{})

	if options.Search != "" {
		searchTerm := "%" + options.Search + "%"
		query = query.Where("asset_name ILIKE ? OR technician_name ILIKE ? OR id ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if options.Status != "" {
		if options.Status == "history" {
			query = query.Where("status = ?", "Selesai")
		} else if options.Status == "active" {
			query = query.Where("status IN ?", []string{"Dijadwalkan", "Sedang Berjalan"})
		} else {
			query = query.Where("status = ?", options.Status)
		}
	}

	if options.Type != "" && options.Type != "Semua" {
		query = query.Where("type = ?", options.Type)
	}

	if options.PaymentStatus != "" && options.PaymentStatus != "Semua" {
		query = query.Where("payment_status = ?", options.PaymentStatus)
	}

	if options.TechnicianID != "" {
		query = query.Where("technician_id = ?", options.TechnicianID)
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if options.Limit > 0 {
		offset := (options.Page - 1) * options.Limit
		query = query.Offset(offset).Limit(options.Limit)
	}

	if options.SortBy != "" {
		sortDir := "DESC"
		if strings.ToUpper(options.SortOrder) == "ASC" {
			sortDir = "ASC"
		}
		query = query.Order(fmt.Sprintf("%s %s", options.SortBy, sortDir))
	} else if options.Status == "history" || options.Status == "Selesai" {
		query = query.Order("completed_date DESC, updated_at DESC")
	} else {
		query = query.Order("created_at DESC")
	}

	err = query.Find(&records).Error
	return records, total, err
}

func (r *maintenanceRepository) FindByID(id string) (*domain.Maintenance, error) {
	var m domain.Maintenance
	err := r.db.Where("id = ?", id).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &m, nil
}

func (r *maintenanceRepository) Update(m *domain.Maintenance) error {
	return r.db.Save(m).Error
}

func (r *maintenanceRepository) UpdateStatus(m *domain.Maintenance, asset *domain.Asset) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(m).Error; err != nil {
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

func (r *maintenanceRepository) GetLastID() (string, error) {
	var m domain.Maintenance
	year := time.Now().Format("06")
	prefix := fmt.Sprintf("MNT-%s-", year)

	err := r.db.Where("id LIKE ?", prefix+"%").Order("id DESC").First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil
		}
		return "", err
	}

	parts := strings.Split(m.ID, "-")
	return parts[len(parts)-1], nil
}

func (r *maintenanceRepository) FindMaintenanceByScheduledDate(date string) ([]domain.Maintenance, error) {
	var maintenances []domain.Maintenance
	err := r.db.Where("scheduled_date = ? AND status != 'Selesai'", date).Find(&maintenances).Error
	return maintenances, err
}

func (r *maintenanceRepository) IsAssetInActiveMaintenance(assetID string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Maintenance{}).
		Where("asset_id = ? AND status IN ?", assetID, []string{"Dijadwalkan", "Sedang Berjalan"}).
		Count(&count).Error
	return count > 0, err
}

func (r *maintenanceRepository) CreateBulk(maintenances []*domain.Maintenance) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, m := range maintenances {
			if err := tx.Create(m).Error; err != nil {
				return err
			}
			if err := tx.Model(&domain.Asset{}).Where("id = ?", m.AssetID).Update("status", "Maintenance").Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *maintenanceRepository) UpdatePaymentStatusAndInvoice(id string, status string, invoiceURL string) error {
	updates := map[string]interface{}{
		"payment_status": status,
	}
	if invoiceURL != "" {
		updates["invoice_url"] = invoiceURL
	}
	return r.db.Model(&domain.Maintenance{}).Where("id = ?", id).Updates(updates).Error
}
