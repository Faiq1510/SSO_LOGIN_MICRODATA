package unit

import (
	"testing"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ─────────────────────────────────────────────────────
//  MOCK: BorrowingRepository
// ─────────────────────────────────────────────────────

type MockBorrowingRepository struct {
	mock.Mock
}

func (m *MockBorrowingRepository) Create(b *domain.Borrowing) error {
	args := m.Called(b)
	return args.Error(0)
}
func (m *MockBorrowingRepository) CreateMultiple(borrowings []*domain.Borrowing) error {
	args := m.Called(borrowings)
	return args.Error(0)
}
func (m *MockBorrowingRepository) Delete(id string) error {
	args := m.Called(id)
	return args.Error(0)
}
func (m *MockBorrowingRepository) FindAll(options *domain.BorrowingQueryOptions) ([]domain.Borrowing, int64, error) {
	args := m.Called(options)
	return args.Get(0).([]domain.Borrowing), args.Get(1).(int64), args.Error(2)
}
func (m *MockBorrowingRepository) FindByID(id string) (*domain.Borrowing, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Borrowing), args.Error(1)
}
func (m *MockBorrowingRepository) UpdateStatus(b *domain.Borrowing, asset *domain.Asset) error {
	args := m.Called(b, asset)
	return args.Error(0)
}
func (m *MockBorrowingRepository) CountByDatePrefix(datePrefix string) (int64, error) {
	args := m.Called(datePrefix)
	return args.Get(0).(int64), args.Error(1)
}
func (m *MockBorrowingRepository) FindDueBorrowings(date string) ([]domain.Borrowing, error) {
	args := m.Called(date)
	return args.Get(0).([]domain.Borrowing), args.Error(1)
}
func (m *MockBorrowingRepository) HasActiveBorrowing(assetID string) (bool, error) {
	args := m.Called(assetID)
	return args.Get(0).(bool), args.Error(1)
}
func (m *MockBorrowingRepository) FindPendingByAssetID(assetID string) ([]domain.Borrowing, error) {
	args := m.Called(assetID)
	return args.Get(0).([]domain.Borrowing), args.Error(1)
}
func (m *MockBorrowingRepository) IsAssetActivelyBorrowed(assetID string) (bool, error) {
	args := m.Called(assetID)
	return args.Bool(0), args.Error(1)
}

// ─────────────────────────────────────────────────────
//  MOCK: NotificationService
// ─────────────────────────────────────────────────────

type MockNotificationService struct {
	mock.Mock
}

func (m *MockNotificationService) CreateNotificationForRole(role, title, message, refType string) error {
	args := m.Called(role, title, message, refType)
	return args.Error(0)
}
func (m *MockNotificationService) CreateNotificationForUser(userID, title, message, refType string) error {
	args := m.Called(userID, title, message, refType)
	return args.Error(0)
}
func (m *MockNotificationService) GetUserNotifications(userID string) ([]domain.Notification, error) {
	args := m.Called(userID)
	return args.Get(0).([]domain.Notification), args.Error(1)
}
func (m *MockNotificationService) GetUnreadCount(userID string) (int64, error) {
	args := m.Called(userID)
	return args.Get(0).(int64), args.Error(1)
}
func (m *MockNotificationService) MarkAsRead(id string, userID string) error {
	args := m.Called(id, userID)
	return args.Error(0)
}
func (m *MockNotificationService) MarkAllAsRead(userID string) error {
	args := m.Called(userID)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────────────

func newBorrowingService(
	bRepo *MockBorrowingRepository,
	aRepo *MockAssetRepository,
	uRepo *MockUserRepository,
	wa *MockWhatsAppService,
	notif *MockNotificationService,
	dRepo ...domain.AssetDeletionRequestRepository,
) domain.BorrowingService {
	var deletionRepo domain.AssetDeletionRequestRepository
	if len(dRepo) > 0 {
		deletionRepo = dRepo[0]
	}
	return services.NewBorrowingService(bRepo, aRepo, uRepo, wa, notif, nil, deletionRepo)
}

type MockAssetDeletionRequestRepository struct {
	mock.Mock
}

func (m *MockAssetDeletionRequestRepository) Create(req *domain.AssetDeletionRequest) error {
	args := m.Called(req)
	return args.Error(0)
}
func (m *MockAssetDeletionRequestRepository) FindAll(status string) ([]domain.AssetDeletionRequest, error) {
	args := m.Called(status)
	return args.Get(0).([]domain.AssetDeletionRequest), args.Error(1)
}
func (m *MockAssetDeletionRequestRepository) FindByID(id string) (*domain.AssetDeletionRequest, error) {
	args := m.Called(id)
	return args.Get(0).(*domain.AssetDeletionRequest), args.Error(1)
}
func (m *MockAssetDeletionRequestRepository) UpdateStatus(id string, status string, approverID string) error {
	args := m.Called(id, status, approverID)
	return args.Error(0)
}

// ST-15 ❌ Negatif — Ajukan pinjam aset yang sedang dalam Pengajuan Penghapusan
func TestCreateBorrowing_WhenAssetHasPendingDeletion_ShouldReturnError(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	delRepo := new(MockAssetDeletionRequestRepository)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif, delRepo)

	user := &domain.User{ID: "user-123", Name: "Budi", Role: "Staff"}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"}

	uRepo.On("FindByID", "user-123").Return(user, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("HasActiveBorrowing", "JKT-IT-26-0001").Return(false, nil)
	delRepo.On("FindAll", "Pending").Return([]domain.AssetDeletionRequest{
		{AssetID: "JKT-IT-26-0001", Status: "Pending"},
	}, nil)

	input := &domain.CreateBorrowingInput{AssetIDs: []string{"JKT-IT-26-0001"}, StartDate: "2026-07-05", EndDate: "2026-07-10", Purpose: "Test"}
	result, err := svc.CreateBorrowing("user-123", "actorName", input)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "sedang dalam pengajuan penghapusan")
}

// =============================================================
//  TEST GROUP: CreateBorrowing
// =============================================================

// ST-12 ✅ Positif — Staff ajukan pinjam aset Tersedia → status Pending
func TestCreateBorrowing_WhenAssetAvailable_ShouldSucceed(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	user := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812", Role: "Staff"}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"}

	uRepo.On("FindByID", "user-123").Return(user, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("HasActiveBorrowing", "JKT-IT-26-0001").Return(false, nil)
	bRepo.On("CountByDatePrefix", mock.Anything).Return(int64(0), nil)
	bRepo.On("CreateMultiple", mock.AnythingOfType("[]*domain.Borrowing")).Return(nil)
	notif.On("CreateNotificationForRole", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByRole", mock.Anything).Return([]domain.User{}, nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	input := &domain.CreateBorrowingInput{
		AssetIDs:  []string{"JKT-IT-26-0001"},
		StartDate: "2026-07-05",
		EndDate:   "2026-07-10",
		Purpose:   "Presentasi klien",
	}

	result, err := svc.CreateBorrowing("user-123", "actorName", input)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Pending_Supervisor", result[0].Status)
}

// ST-13 ❌ Negatif — Ajukan pinjam aset yang sedang Dipinjam
func TestCreateBorrowing_WhenAssetBorrowed_ShouldReturnError(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	user := &domain.User{ID: "user-123", Name: "Budi", Role: "Staff"}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Dipinjam"} // sedang dipinjam

	uRepo.On("FindByID", "user-123").Return(user, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)

	input := &domain.CreateBorrowingInput{AssetIDs: []string{"JKT-IT-26-0001"}, StartDate: "2026-07-05", EndDate: "2026-07-10", Purpose: "Test"}
	result, err := svc.CreateBorrowing("user-123", "actorName", input)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "tidak tersedia")
}

// ❌ Negatif — Ajukan pinjam aset yang sedang diajukan (Pending) atau aktif dipinjam
func TestCreateBorrowing_WhenAssetHasActiveBorrowing_ShouldReturnError(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	user := &domain.User{ID: "user-123", Name: "Budi", Role: "Staff"}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"} // Status tersedia tapi ada transaksi aktif

	uRepo.On("FindByID", "user-123").Return(user, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("HasActiveBorrowing", "JKT-IT-26-0001").Return(true, nil) // Ada transaksi aktif

	input := &domain.CreateBorrowingInput{AssetIDs: []string{"JKT-IT-26-0001"}, StartDate: "2026-07-05", EndDate: "2026-07-10", Purpose: "Test"}
	result, err := svc.CreateBorrowing("user-123", "actorName", input)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "sedang dalam peminjaman aktif")
}

// ST-14 ❌ Negatif — Ajukan pinjam aset yang sedang Maintenance
func TestCreateBorrowing_WhenAssetMaintenance_ShouldReturnError(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	user := &domain.User{ID: "user-123", Name: "Budi", Role: "Staff"}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Maintenance"} // sedang maintenance

	uRepo.On("FindByID", "user-123").Return(user, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)

	input := &domain.CreateBorrowingInput{AssetIDs: []string{"JKT-IT-26-0001"}, StartDate: "2026-07-05", EndDate: "2026-07-10", Purpose: "Test"}
	result, err := svc.CreateBorrowing("user-123", "actorName", input)

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "tidak tersedia")
}

// =============================================================
//  TEST GROUP: UpdateBorrowingStatus (Supervisor)
// =============================================================

// S-05 ✅ Positif — Supervisor menyetujui pengajuan pending
func TestUpdateBorrowingStatus_Approved_BySpv_ShouldSucceed(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	borrowing := &domain.Borrowing{
		ID: "BRW-001", UserID: "user-123", AssetID: "JKT-IT-26-0001",
		AssetName: "Laptop Dell", Status: "Pending_Supervisor",
	}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"}
	borrower := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812"}

	bRepo.On("FindByID", "BRW-001").Return(borrowing, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("UpdateStatus", mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByID", "user-123").Return(borrower, nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateBorrowingStatus("BRW-001", &domain.UpdateBorrowingStatusInput{Status: "Approved"}, "Supervisor", "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Approved", result.Status)
}

// S-06 ✅ Positif — Supervisor menolak pengajuan dengan alasan
func TestUpdateBorrowingStatus_Rejected_BySpv_ShouldSucceed(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	borrowing := &domain.Borrowing{
		ID: "BRW-001", UserID: "user-123", AssetID: "JKT-IT-26-0001",
		AssetName: "Laptop Dell", Status: "Pending_Supervisor",
	}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"}
	borrower := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812"}

	bRepo.On("FindByID", "BRW-001").Return(borrowing, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("UpdateStatus", mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByID", "user-123").Return(borrower, nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateBorrowingStatus("BRW-001", &domain.UpdateBorrowingStatusInput{Status: "Rejected", RejectionReason: "Aset sedang dibutuhkan divisi lain"},
		"Supervisor", "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Rejected", result.Status)
	assert.Equal(t, "Aset sedang dibutuhkan divisi lain", result.RejectionReason)
}

// ✅ Positif — Staff ajukan pengembalian (Menunggu_Kembali)
func TestUpdateBorrowingStatus_MenungguKembali_ByStaff_ShouldSucceed(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	borrowing := &domain.Borrowing{
		ID: "BRW-001", UserID: "user-123", AssetID: "JKT-IT-26-0001",
		AssetName: "Laptop Dell", Status: "Approved",
	}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Dipinjam"}
	borrower := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812"}

	bRepo.On("FindByID", "BRW-001").Return(borrowing, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("UpdateStatus", mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByID", "user-123").Return(borrower, nil)
	uRepo.On("FindByRole", mock.Anything).Return([]domain.User{}, nil)
	notif.On("CreateNotificationForRole", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateBorrowingStatus("BRW-001", &domain.UpdateBorrowingStatusInput{Status: "Menunggu_Kembali"}, "Staff", "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Menunggu_Kembali", result.Status)
}

// ✅ Positif — Supervisor konfirmasi pengembalian (Selesai)
func TestUpdateBorrowingStatus_Selesai_BySpv_ShouldSucceed(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	borrowing := &domain.Borrowing{
		ID: "BRW-001", UserID: "user-123", AssetID: "JKT-IT-26-0001",
		AssetName: "Laptop Dell", Status: "Menunggu_Kembali",
	}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Dipinjam"}
	borrower := &domain.User{ID: "user-123", Name: "Budi", Phone: "+62812"}

	bRepo.On("FindByID", "BRW-001").Return(borrowing, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	bRepo.On("UpdateStatus", mock.Anything, mock.Anything).Return(nil)
	uRepo.On("FindByID", "user-123").Return(borrower, nil)
	notif.On("CreateNotificationForUser", mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(nil)
	wa.On("SendMessage", mock.Anything, mock.Anything).Return(nil)

	result, err := svc.UpdateBorrowingStatus("BRW-001", &domain.UpdateBorrowingStatusInput{Status: "Selesai"}, "Supervisor", "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Selesai", result.Status)
}

// ST-17 ❌ Negatif — Staff mencoba menyetujui peminjaman (unauthorized)
func TestUpdateBorrowingStatus_ApproveByStaff_ShouldReturnError(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	result, err := svc.UpdateBorrowingStatus("BRW-001", &domain.UpdateBorrowingStatusInput{Status: "Approved"}, "Staff", "actorID", "actorName")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "unauthorized")
}

// ❌ Negatif — Status tidak valid
func TestUpdateBorrowingStatus_WithInvalidStatus_ShouldReturnError(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	borrowing := &domain.Borrowing{ID: "BRW-001", UserID: "user-123", AssetID: "JKT-IT-26-0001"}
	asset := &domain.Asset{ID: "JKT-IT-26-0001", Status: "Tersedia"}

	bRepo.On("FindByID", "BRW-001").Return(borrowing, nil)
	aRepo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)

	result, err := svc.UpdateBorrowingStatus("BRW-001", &domain.UpdateBorrowingStatusInput{Status: "StatusTidakAda"}, "Supervisor", "actorID", "actorName")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "invalid status")
}

// =============================================================
//  TEST GROUP: GetBorrowings
// =============================================================

// ✅ Positif — Get Borrowings with Options
func TestGetBorrowings_WithFilter_ShouldReturnPaginatedList(t *testing.T) {
	bRepo := new(MockBorrowingRepository)
	aRepo := new(MockAssetRepository)
	uRepo := new(MockUserRepository)
	wa := new(MockWhatsAppService)
	notif := new(MockNotificationService)
	svc := newBorrowingService(bRepo, aRepo, uRepo, wa, notif)

	borrowings := []domain.Borrowing{
		{ID: "BRW-001", Status: "Pending_Supervisor"},
	}

	options := &domain.BorrowingQueryOptions{Page: 1, Limit: 10, Status: "Pending_Supervisor"}

	bRepo.On("FindAll", options).Return(borrowings, int64(1), nil)

	result, err := svc.GetBorrowings(options)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(1), result.Total)
}


