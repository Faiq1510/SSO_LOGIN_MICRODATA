package domain

type CategoryStat struct {
	Category string `json:"category"`
	Count    int64  `json:"count"`
}

type ConditionStat struct {
	Condition string `json:"condition"`
	Count     int64  `json:"count"`
}

type DashboardStats struct {
	TotalAssets       int64           `json:"total_assets"`
	AvailableAssets   int64           `json:"available_assets"`
	BorrowedAssets    int64           `json:"borrowed_assets"`
	MaintenanceAssets int64           `json:"maintenance_assets"`
	TotalUsers        int64           `json:"total_users"`
	TotalBorrowings   int64           `json:"total_borrowings"`
	TotalMaintenance  int64           `json:"total_maintenance"`
	CategoriesStats   []CategoryStat  `json:"categories_stats"`
	ConditionsStats   []ConditionStat `json:"conditions_stats"`
}

type LandingStats struct {
	IntegratedModules int64   `json:"integrated_modules"`
	RoleTypes         int64   `json:"role_types"`
	AutoNotifications int64   `json:"auto_notifications"`
	SystemUptime      float64 `json:"system_uptime"`
}

type DashboardRepository interface {
	GetStats() (*DashboardStats, error)
	GetLandingStats() (*LandingStats, error)
}

type DashboardService interface {
	GetStats() (*DashboardStats, error)
	GetLandingStats() (*LandingStats, error)
}
