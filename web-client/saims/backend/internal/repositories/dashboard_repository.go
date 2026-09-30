package repositories

import (
	"gorm.io/gorm"
	"saims-backend/internal/domain"
)

type dashboardRepository struct {
	db *gorm.DB
}

func NewDashboardRepository(db *gorm.DB) domain.DashboardRepository {
	return &dashboardRepository{db: db}
}

func (r *dashboardRepository) GetStats() (*domain.DashboardStats, error) {
	var stats domain.DashboardStats

	// Count Total Assets
	if err := r.db.Model(&domain.Asset{}).Count(&stats.TotalAssets).Error; err != nil {
		return nil, err
	}

	// Count by Status
	r.db.Model(&domain.Asset{}).Where("status = ?", "Tersedia").Count(&stats.AvailableAssets)
	r.db.Model(&domain.Asset{}).Where("status = ?", "Dipinjam").Count(&stats.BorrowedAssets)
	r.db.Model(&domain.Asset{}).Where("status = ?", "Maintenance").Count(&stats.MaintenanceAssets)

	// Count Users
	if err := r.db.Model(&domain.User{}).Count(&stats.TotalUsers).Error; err != nil {
		return nil, err
	}

	// Count Borrowings & Maintenances
	if err := r.db.Model(&domain.Borrowing{}).Count(&stats.TotalBorrowings).Error; err != nil {
		return nil, err
	}
	if err := r.db.Model(&domain.Maintenance{}).Count(&stats.TotalMaintenance).Error; err != nil {
		return nil, err
	}

	// Category Stats
	var catStats []domain.CategoryStat
	err := r.db.Model(&domain.Asset{}).
		Select("category, count(*) as count").
		Group("category").
		Scan(&catStats).Error
	if err != nil {
		return nil, err
	}
	stats.CategoriesStats = catStats

	// Condition Stats
	var condStats []domain.ConditionStat
	err = r.db.Model(&domain.Asset{}).
		Select("condition, count(*) as count").
		Group("condition").
		Scan(&condStats).Error
	if err != nil {
		return nil, err
	}
	stats.ConditionsStats = condStats

	return &stats, nil
}

func (r *dashboardRepository) GetLandingStats() (*domain.LandingStats, error) {
	var stats domain.LandingStats

	if err := r.db.Table("users").Select("count(distinct role)").Scan(&stats.RoleTypes).Error; err != nil {
		return nil, err
	}

	if err := r.db.Table("notifications").Count(&stats.AutoNotifications).Error; err != nil {
		return nil, err
	}

	return &stats, nil
}
