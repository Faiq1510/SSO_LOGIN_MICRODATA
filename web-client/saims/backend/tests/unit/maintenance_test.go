package unit

import (
	"testing"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
	"saims-backend/internal/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ─────────────────────────────────────────────────────
//  MOCK: MaintenanceRepository (repositories package)
// ─────────────────────────────────────────────────────

type MockMaintenanceRepository struct {
	mock.Mock
}

func (m *MockMaintenanceRepository) Create(maint *domain.Maintenance, asset *domain.Asset) error {
	args := m.Called(maint, asset)
	return args.Error(0)
}
func (m *MockMaintenanceRepository) FindAll(options *domain.MaintenanceQueryOptions) ([]domain.Maintenance, int64, error) {
	args := m.Called(options)
	return args.Get(0).([]domain.Maintenance), args.Get(1).(int64), args.Error(2)
}
func (m *MockMaintenanceRepository) FindByID(id string) (*domain.Maintenance, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Maintenance), args.Error(1)
}
func (m *MockMaintenanceRepository) Update(maint *domain.Maintenance) error {
	args := m.Called(maint)
	return args.Error(0)
}
func (m *MockMaintenanceRepository) UpdateStatus(maint *domain.Maintenance, asset *domain.Asset) error {
	args := m.Called(maint, asset)
	return args.Error(0)
}
func (m *MockMaintenanceRepository) GetLastID() (string, error) {
	args := m.Called()
	return args.String(0), args.Error(1)
}
func (m *MockMaintenanceRepository) FindMaintenanceByScheduledDate(date string) ([]domain.Maintenance, error) {
	args := m.Called(date)
	return args.Get(0).([]domain.Maintenance), args.Error(1)
}
func (m *MockMaintenanceRepository) IsAssetInActiveMaintenance(assetID string) (bool, error) {
	args := m.Called(assetID)
	return args.Bool(0), args.Error(1)
}
func (m *MockMaintenanceRepository) CreateBulk(maintenances []*domain.Maintenance) error {
	args := m.Called(maintenances)
	return args.Error(0)
}
func (m *MockMaintenanceRepository) UpdatePaymentStatusAndInvoice(id string, status string, invoiceURL string) error {
	args := m.Called(id, status, invoiceURL)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  Helper: ensure mock satisfies interface
// ─────────────────────────────────────────────────────

var _ repositories.MaintenanceRepository = (*MockMaintenanceRepository)(nil)

func newMaintenanceService(
	mRepo *MockMaintenanceRepository,
	aRepo *MockAssetRepository,
	uRepo *MockUserRepository,
	wa *MockWhatsAppService,
	notif *MockNotificationService,
) services.MaintenanceService {
	return services.NewMaintenanceService(mRepo, aRepo, uRepo, nil, wa, notif, nil, nil)
}

// =============================================================
//  TEST GROUP: CreateMaintenance
// =============================================================

// T-01 ✅ Positif — Buat jadwal maintenance untuk aset Tersedia
func TestCreateMaintenance_WhenAssetAvailable_ShouldSucceed(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"}

	mRepo.On("GetLastID").Return("", nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	mRepo.On("Create", mock.AnythingOfType("*domain.Maintenance"), mock.AnythingOfType("*domain.Asset")).Return(nil)
	notif.On("CreateNotificationForRole", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByRole", "Administrator").Return([]domain.User{}, nil)
	uRepo.On("FindByID", mock.Anything).Return((*domain.User)(nil), nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	input := &domain.CreateMaintenanceInput{
		AssetID:       "JKT-IT-26-0001",
		TechnicianID:  "tech-001",
		Type:          "Rutin",
		ScheduledDate: "2026-07-10",
		Notes:         "Cek kondisi rutin",
	}

	result, err := svc.CreateMaintenance("tech-001", "Andi Teknisi", input)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Dijadwalkan", result.Status)
	assert.Equal(t, "JKT-IT-26-0001", result.AssetID)
}

// T-02 ❌ Negatif — Buat maintenance untuk aset yang sedang Dipinjam
func TestCreateMaintenance_WhenAssetBorrowed_ShouldReturnError(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Dipinjam"}
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)

	input := &domain.CreateMaintenanceInput{
		AssetID: "JKT-IT-26-0001", Type: "Rutin", ScheduledDate: "2026-07-10",
	}

	result, err := svc.CreateMaintenance("tech-001", "Andi Teknisi", input)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "tidak tersedia untuk maintenance")
}

// ❌ Negatif — Tipe maintenance tidak valid
func TestCreateMaintenance_WithInvalidType_ShouldReturnError(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	input := &domain.CreateMaintenanceInput{
		AssetID: "JKT-IT-26-0001", Type: "Modifikasi", ScheduledDate: "2026-07-10", // tidak valid
	}

	result, err := svc.CreateMaintenance("tech-001", "Andi Teknisi", input)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "tipe maintenance tidak valid")
}

// =============================================================
//  TEST GROUP: UpdateMaintenanceStatus
// =============================================================

// T-03 ✅ Positif — Update status maintenance → Selesai (aset kembali Tersedia)
func TestUpdateMaintenanceStatus_ToSelesai_ShouldSucceed(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	maint := &domain.Maintenance{
		ID: "MNT-26-0001", AssetID: "JKT-IT-26-0001",
		AssetName: "Laptop Dell", TechnicianID: "tech-001", Status: "Sedang Berjalan",
	}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Maintenance"}

	mRepo.On("FindByID", "MNT-26-0001").Return(maint, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	mRepo.On("UpdateStatus", mock.Anything, mock.Anything).Return(nil)
	notif.On("CreateNotificationForRole", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByRole", "Administrator").Return([]domain.User{}, nil)
	uRepo.On("FindByID", "tech-001").Return(&domain.User{ID: "tech-001", Name: "Andi", Phone: "+62812"}, nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateMaintenanceStatus("MNT-26-0001", "tech-001", "Teknisi", &domain.UpdateMaintenanceStatusInput{
		Status:        "Selesai",
		CompletedDate: "2026-07-10",
		ActualCost:    500000,
		Notes:         "Selesai tanpa masalah",
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Selesai", result.Status)
}

// ✅ Positif — Update status maintenance → Sedang Berjalan
func TestUpdateMaintenanceStatus_ToSedangBerjalan_ShouldSucceed(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	maint := &domain.Maintenance{
		ID: "MNT-26-0001", AssetID: "JKT-IT-26-0001",
		AssetName: "Laptop Dell", TechnicianID: "tech-001", Status: "Dijadwalkan",
	}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Maintenance"}

	mRepo.On("FindByID", "MNT-26-0001").Return(maint, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	mRepo.On("UpdateStatus", mock.Anything, mock.Anything).Return(nil)
	notif.On("CreateNotificationForRole", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByRole", mock.Anything).Return([]domain.User{}, nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByID", "tech-001").Return(&domain.User{ID: "tech-001", Name: "Andi", Phone: "+62812"}, nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateMaintenanceStatus("MNT-26-0001", "tech-001", "Teknisi", &domain.UpdateMaintenanceStatusInput{
		Status: "Sedang Berjalan",
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Sedang Berjalan", result.Status)
}

// ❌ Negatif — Status maintenance tidak valid
func TestUpdateMaintenanceStatus_WithInvalidStatus_ShouldReturnError(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	result, err := svc.UpdateMaintenanceStatus("MNT-26-0001", "admin-1", "Administrator", &domain.UpdateMaintenanceStatusInput{
		Status: "Dibatalkan", // tidak ada di enum
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "status tidak valid")
}

// ❌ Negatif — Maintenance record tidak ditemukan
func TestUpdateMaintenanceStatus_WhenRecordNotFound_ShouldReturnError(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	mRepo.On("FindByID", "MNT-INVALID").Return(nil, nil)

	result, err := svc.UpdateMaintenanceStatus("MNT-INVALID", "admin-1", "Administrator", &domain.UpdateMaintenanceStatusInput{
		Status: "Selesai",
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "tidak ditemukan")
}

// =============================================================
//  TEST GROUP: UpdateMaintenanceDetails
// =============================================================

// ✅ Positif — Edit detail maintenance yang belum Selesai
func TestUpdateMaintenanceDetails_WhenNotSelesai_ShouldSucceed(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	maint := &domain.Maintenance{
		ID: "MNT-26-0001", AssetID: "JKT-IT-26-0001", TechnicianID: "tech-001", Status: "Dijadwalkan",
	}

	mRepo.On("FindByID", "MNT-26-0001").Return(maint, nil)
	mRepo.On("Update", mock.Anything).Return(nil)
	notif.On("CreateNotificationForRole", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByID", mock.Anything).Return(&domain.User{Name: "Teknisi"}, nil)
	uRepo.On("FindByRole", mock.Anything).Return([]domain.User{}, nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateMaintenanceDetails("MNT-26-0001", "tech-001", "Administrator", &domain.UpdateMaintenanceDetailsInput{
		Type:          "Perbaikan",
		ScheduledDate: "2026-07-15",
		Notes:         "Reschedule",
	})

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Perbaikan", result.Type)
	assert.True(t, result.IsEdited)
}

// ❌ Negatif — Teknisi mencoba edit data yang dibuat teknisi lain
func TestUpdateMaintenanceDetails_ByDifferentTechnician_ShouldReturnError(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	maint := &domain.Maintenance{
		ID: "MNT-26-0001", AssetID: "JKT-IT-26-0001", TechnicianID: "tech-001", Status: "Dijadwalkan",
	}

	mRepo.On("FindByID", "MNT-26-0001").Return(maint, nil)

	result, err := svc.UpdateMaintenanceDetails("MNT-26-0001", "tech-999", "Teknisi", &domain.UpdateMaintenanceDetailsInput{
		Type:          "Perbaikan",
		ScheduledDate: "2026-07-15",
	})

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "anda tidak memiliki akses")
}

// =============================================================
//  TEST GROUP: GetMaintenances
// =============================================================

// ✅ Positif — Ambil daftar maintenance dengan pagination
func TestGetMaintenances_WithPagination_ShouldReturnPaginatedList(t *testing.T) {
	mRepo := new(MockMaintenanceRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newMaintenanceService(mRepo, aRepo, uRepo, wa, notif)

	records := []domain.Maintenance{
		{ID: "MNT-26-0001", Status: "Dijadwalkan"},
	}

	options := &domain.MaintenanceQueryOptions{Page: 1, Limit: 10, Status: "Dijadwalkan"}

	mRepo.On("FindAll", options).Return(records, int64(1), nil)

	result, err := svc.GetMaintenances(options)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(1), result.Total)
}
