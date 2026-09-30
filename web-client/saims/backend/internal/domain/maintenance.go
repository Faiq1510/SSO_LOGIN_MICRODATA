package domain

import "time"

// Maintenance represents the maintenance_records table in the database
type Maintenance struct {
	ID             string    `gorm:"primaryKey;type:varchar(50)" json:"id"`
	AssetID        string    `gorm:"not null;type:varchar(50);index" json:"asset_id"`
	Asset          Asset     `gorm:"-" json:"-"`
	AssetName      string    `gorm:"type:text" json:"asset_name"`
	TechnicianID   string    `gorm:"type:uuid" json:"technician_id"`
	TechnicianName string    `gorm:"type:text" json:"technician_name"`
	Type           string    `gorm:"not null;default:'Rutin';type:text" json:"type"`         // Rutin | Perbaikan | Kalibrasi
	Status         string    `gorm:"not null;default:'Dijadwalkan';type:text" json:"status"` // Dijadwalkan | Sedang Berjalan | Selesai
	ScheduledDate  string    `gorm:"type:text" json:"scheduled_date"`
	ActualStartDate string   `gorm:"type:text" json:"actual_start_date"`
	CompletedDate  string    `gorm:"type:text" json:"completed_date"`
	EstimatedCost  float64   `gorm:"type:numeric" json:"estimated_cost"`
	ActualCost     *float64  `gorm:"type:numeric" json:"actual_cost"`
	Notes          string    `gorm:"type:text" json:"notes"`
	PaymentStatus  string    `gorm:"not null;default:'Menunggu Pembayaran';type:text" json:"payment_status"`
	InvoiceURL     *string   `gorm:"type:text" json:"invoice_url"`
	CreatedAt      time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime" json:"updated_at"`
	IsEdited       bool      `gorm:"default:false" json:"is_edited"`
}

// MaintenanceRepository interface defines database operations
type MaintenanceRepository interface {
	Create(maintenance *Maintenance) error
	FindAll(options *MaintenanceQueryOptions) ([]Maintenance, int64, error)
	FindByID(id string) (*Maintenance, error)
	Update(maintenance *Maintenance) error
	CountByDatePrefix(datePrefix string) (int64, error)
	FindMaintenanceByScheduledDate(date string) ([]Maintenance, error)
	IsAssetInActiveMaintenance(assetID string) (bool, error)
	CreateBulk(maintenances []*Maintenance) error
	UpdatePaymentStatusAndInvoice(id string, status string, invoiceURL string) error
}

// MaintenanceService interface defines business logic
type MaintenanceService interface {
	CreateMaintenance(input *CreateMaintenanceInput) (*Maintenance, error)
	CreateBulkMaintenance(technicianID string, technicianName string, input *CreateBulkMaintenanceInput) ([]*Maintenance, error)
	GetMaintenances(options *MaintenanceQueryOptions) (*PaginatedResponse, error)
	UpdateMaintenanceStatus(id string, input *UpdateMaintenanceStatusInput) (*Maintenance, error)
	UpdateMaintenanceDetails(id string, technicianID string, input *UpdateMaintenanceDetailsInput) (*Maintenance, error)
	ConfirmPayment(maintenanceIDs []string, adminID string) error
}

// DTOs

type MaintenanceQueryOptions struct {
	Page          int
	Limit         int
	Search        string
	Status        string
	Type          string
	PaymentStatus string
	TechnicianID  string
	SortBy        string
	SortOrder     string
}

type CreateMaintenanceInput struct {
	AssetID        string  `json:"asset_id"` // For backward compatibility
	AssetIDs       []string `json:"asset_ids"` // For bulk insertion
	TechnicianID   string  `json:"technician_id"`
	TechnicianName string  `json:"technician_name"`
	Type           string  `json:"type" binding:"required"`
	ScheduledDate  string  `json:"scheduled_date" binding:"required"`
	Notes          string  `json:"notes"`
	EstimatedCost float64 `json:"estimated_cost"`
}

type CreateBulkMaintenanceInput struct {
	AssetIDs       []string `json:"asset_ids" binding:"required,min=1"`
	TechnicianID   string  `json:"technician_id"`
	TechnicianName string  `json:"technician_name"`
	Type           string  `json:"type" binding:"required"`
	ScheduledDate  string  `json:"scheduled_date" binding:"required"`
	Notes          string  `json:"notes"`
	EstimatedCost float64 `json:"estimated_cost"`
}

type UpdateMaintenanceStatusInput struct {
	Status         string  `json:"status" binding:"required"`
	CompletedDate  string  `json:"completed_date"`
	ActualCost     float64 `json:"actual_cost"`
	Notes          string  `json:"notes"`
	AssetCondition string  `json:"asset_condition"`
}

type UpdateMaintenanceDetailsInput struct {
	Type          string  `json:"type" binding:"required"`
	ScheduledDate string  `json:"scheduled_date" binding:"required"`
	EstimatedCost float64 `json:"estimated_cost"`
	Notes         string  `json:"notes"`
}
