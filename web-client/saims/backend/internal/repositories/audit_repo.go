package repositories

import (
	"gorm.io/gorm"
	"saims-backend/internal/domain"
)

type auditRepository struct {
	db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) domain.AuditRepository {
	return &auditRepository{db}
}

func (r *auditRepository) Create(log *domain.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *auditRepository) FindAll(offset, limit int, filters map[string]string) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	query := r.db.Model(&domain.AuditLog{})

	if user, ok := filters["changed_by"]; ok && user != "" {
		query = query.Where("changed_by ILIKE ?", "%"+user+"%")
	}
	if action, ok := filters["action"]; ok && action != "" {
		query = query.Where("action = ?", action)
	}
	if startDate, ok := filters["start_date"]; ok && startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}
	if endDate, ok := filters["end_date"]; ok && endDate != "" {
		// Append time to include the whole day
		query = query.Where("created_at <= ?", endDate+" 23:59:59")
	}

	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	err = query.Order("created_at DESC").Find(&logs).Error
	return logs, total, err
}
