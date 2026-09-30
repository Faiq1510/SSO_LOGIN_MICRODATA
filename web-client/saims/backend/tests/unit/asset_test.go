package unit

import (
	"context"
	"errors"
	"io"
	"net/url"
	"testing"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ─────────────────────────────────────────────────────
//  MOCK: AssetRepository
// ─────────────────────────────────────────────────────

type MockAssetRepository struct {
	mock.Mock
}

func (m *MockAssetRepository) Create(asset *domain.Asset) error {
	args := m.Called(asset)
	return args.Error(0)
}
func (m *MockAssetRepository) FindAll(options *domain.AssetQueryOptions) ([]domain.Asset, int64, error) {
	args := m.Called(options)
	return args.Get(0).([]domain.Asset), args.Get(1).(int64), args.Error(2)
}
func (m *MockAssetRepository) FindByID(id string) (*domain.Asset, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Asset), args.Error(1)
}
func (m *MockAssetRepository) Update(asset *domain.Asset) error {
	args := m.Called(asset)
	return args.Error(0)
}
func (m *MockAssetRepository) Delete(id string) error {
	args := m.Called(id)
	return args.Error(0)
}
func (m *MockAssetRepository) GetLastIDByPrefix(prefix string) (string, error) {
	args := m.Called(prefix)
	return args.String(0), args.Error(1)
}
func (m *MockAssetRepository) Restore(id string) error {
	return m.Called(id).Error(0)
}
func (m *MockAssetRepository) HardDelete(id string) error {
	return m.Called(id).Error(0)
}
func (m *MockAssetRepository) FindDeleted(options *domain.AssetQueryOptions) ([]domain.Asset, int64, error) {
	args := m.Called(options)
	return args.Get(0).([]domain.Asset), args.Get(1).(int64), args.Error(2)
}
func (m *MockAssetRepository) DeleteOldTrash(days int) error {
	return m.Called(days).Error(0)
}

// ─────────────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────────────

type MockAssetImageRepository struct{ mock.Mock }
func (m *MockAssetImageRepository) Create(image *domain.AssetImage) error { return m.Called(image).Error(0) }
func (m *MockAssetImageRepository) FindByAssetID(assetID string) ([]domain.AssetImage, error) { args := m.Called(assetID); return args.Get(0).([]domain.AssetImage), args.Error(1) }
func (m *MockAssetImageRepository) FindByID(id string) (*domain.AssetImage, error) { args := m.Called(id); if args.Get(0) == nil { return nil, args.Error(1) }; return args.Get(0).(*domain.AssetImage), args.Error(1) }
func (m *MockAssetImageRepository) Delete(id string) error { return m.Called(id).Error(0) }
func (m *MockAssetImageRepository) SetPrimary(assetID, imageID string) error { return m.Called(assetID, imageID).Error(0) }
func (m *MockAssetImageRepository) FindPrimaryByAssetID(assetID string) (*domain.AssetImage, error) {
	args := m.Called(assetID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.AssetImage), args.Error(1)
}
func (m *MockAssetImageRepository) FindAllObjectKeys() ([]string, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]string), args.Error(1)
}
func (m *MockAssetImageRepository) Restore(id string) error {
	return m.Called(id).Error(0)
}
func (m *MockAssetImageRepository) HardDelete(id string) error {
	return m.Called(id).Error(0)
}
func (m *MockAssetImageRepository) FindDeletedByAssetID(assetID string) ([]domain.AssetImage, error) {
	args := m.Called(assetID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.AssetImage), args.Error(1)
}

type MockStorageService struct{ mock.Mock }
func (m *MockStorageService) UploadFile(ctx context.Context, bucketName, objectName string, reader io.Reader, objectSize int64, contentType string) error {
	return m.Called(ctx, bucketName, objectName, reader, objectSize, contentType).Error(0)
}
func (m *MockStorageService) DeleteFile(ctx context.Context, bucketName, objectName string) error { return m.Called(ctx, bucketName, objectName).Error(0) }
func (m *MockStorageService) GeneratePresignedURL(ctx context.Context, bucketName, objectName string, expiresIn time.Duration) (*url.URL, error) {
	args := m.Called(ctx, bucketName, objectName, expiresIn)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*url.URL), args.Error(1)
}
func (m *MockStorageService) ListObjects(ctx context.Context, bucketName, prefix string) ([]services.ObjectInfo, error) {
	args := m.Called(ctx, bucketName, prefix)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]services.ObjectInfo), args.Error(1)
}
func (m *MockStorageService) CopyObject(ctx context.Context, bucketName, srcKey, dstKey string) error {
	return m.Called(ctx, bucketName, srcKey, dstKey).Error(0)
}

func newAssetService(repo *MockAssetRepository) domain.AssetService {
	bRepo := new(MockBorrowingRepository)
	mRepo := new(MockMaintenanceRepository)
	iRepo := new(MockAssetImageRepository)
	sSvc := new(MockStorageService)
	
	bRepo.On("IsAssetActivelyBorrowed", mock.Anything).Return(false, nil).Maybe()
	mRepo.On("IsAssetInActiveMaintenance", mock.Anything).Return(false, nil).Maybe()
	bRepo.On("FindPendingByAssetID", mock.Anything).Return([]domain.Borrowing{}, nil).Maybe()
	iRepo.On("FindByAssetID", mock.Anything).Return([]domain.AssetImage{}, nil).Maybe()

	svc := services.NewAssetService(repo, bRepo, mRepo, iRepo, sSvc, nil, nil)
	return svc
}

// =============================================================
//  TEST GROUP: CreateAsset
// =============================================================

// A-09 ✅ Positif — Tambah aset dengan data lengkap dan lokasi valid
func TestCreateAsset_WithValidData_ShouldSucceed(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	input := &domain.CreateAssetInput{
		Name:      "Laptop Dell",
		Category:  "IT",
		Location:  "Jakarta",
		Status:    "Tersedia",
		Condition: "Baik",
	}

	repo.On("GetLastIDByPrefix", mock.AnythingOfType("string")).Return("", nil)
	repo.On("Create", mock.AnythingOfType("*domain.Asset")).Return(nil)

	asset, err := svc.CreateAsset(input, "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, asset)
	assert.Contains(t, asset.ID, "JKT-IT") // format ID: JKT-IT-26-0001
	assert.Contains(t, asset.QRCode, "SAIMS-")
}

// A-10 ❌ Negatif — Lokasi tidak valid (bukan Jakarta/Bandarlampung)
func TestCreateAsset_WithInvalidLocation_ShouldReturnError(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	input := &domain.CreateAssetInput{
		Name:      "Laptop",
		Category:  "IT",
		Location:  "Surabaya", // tidak valid
		Status:    "Tersedia",
		Condition: "Baik",
	}

	asset, err := svc.CreateAsset(input, "actorID", "actorName")

	assert.Error(t, err)
	assert.Nil(t, asset)
	assert.Contains(t, err.Error(), "lokasi harus Jakarta atau Bandarlampung")
}

// ✅ Positif — Tambah aset dengan lokasi Bandarlampung
func TestCreateAsset_WithBandarLampungLocation_ShouldSucceed(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	input := &domain.CreateAssetInput{
		Name:      "Meja Kerja",
		Category:  "Furnitur",
		Location:  "Bandarlampung",
		Status:    "Tersedia",
		Condition: "Baik",
	}

	repo.On("GetLastIDByPrefix", mock.AnythingOfType("string")).Return("", nil)
	repo.On("Create", mock.AnythingOfType("*domain.Asset")).Return(nil)

	asset, err := svc.CreateAsset(input, "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, asset)
	assert.Contains(t, asset.ID, "BDL-FURN")
}

// =============================================================
//  TEST GROUP: GetAssets
// =============================================================

// ✅ Positif — Ambil daftar aset dengan pagination
func TestGetAssets_WithPagination_ShouldReturnPaginatedList(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	assets := []domain.Asset{
		{ID: "JKT-IT-26-0001", Name: "Laptop 1"},
		{ID: "JKT-IT-26-0002", Name: "Laptop 2"},
	}
	
	options := &domain.AssetQueryOptions{Page: 1, Limit: 10}
	
	repo.On("FindAll", options).Return(assets, int64(2), nil)

	result, err := svc.GetAssets(options)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(2), result.Total)
	assert.Equal(t, 1, result.TotalPages)
}

// =============================================================
//  TEST GROUP: GetAssetByID
// =============================================================

// ✅ Positif — Ambil aset dengan ID yang ada
func TestGetAssetByID_WhenAssetExists_ShouldReturnAsset(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	asset := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Dell", Status: "Tersedia"}
	repo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)

	result, err := svc.GetAssetByID("JKT-IT-26-0001")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Laptop Dell", result.Name)
}

// ❌ Negatif — Aset tidak ditemukan
func TestGetAssetByID_WhenAssetNotFound_ShouldReturnNil(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	repo.On("FindByID", "INVALID-ID").Return(nil, errors.New("record not found"))

	result, err := svc.GetAssetByID("INVALID-ID")

	assert.Error(t, err)
	assert.Nil(t, result)
}

// =============================================================
//  TEST GROUP: UpdateAsset
// =============================================================

// A-11 ✅ Positif — Update aset dengan data valid
func TestUpdateAsset_WithValidData_ShouldSucceed(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	existing := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop Lama", Location: "Jakarta", Status: "Tersedia"}
	repo.On("FindByID", "JKT-IT-26-0001").Return(existing, nil)
	repo.On("Update", mock.AnythingOfType("*domain.Asset")).Return(nil)

	result, err := svc.UpdateAsset("JKT-IT-26-0001", &domain.UpdateAssetInput{Name: "Laptop Baru"}, "actorID", "actorName")

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Laptop Baru", result.Name)
}

// ❌ Negatif — Update aset dengan lokasi tidak valid
func TestUpdateAsset_WithInvalidLocation_ShouldReturnError(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	existing := &domain.Asset{ID: "JKT-IT-26-0001", Name: "Laptop", Location: "Jakarta"}
	repo.On("FindByID", "JKT-IT-26-0001").Return(existing, nil)

	result, err := svc.UpdateAsset("JKT-IT-26-0001", &domain.UpdateAssetInput{Location: "Medan"}, "actorID", "actorName")

	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "lokasi harus Jakarta atau Bandarlampung")
}

// =============================================================
//  TEST GROUP: DeleteAsset
// =============================================================

// A-12 ✅ Positif — Hapus aset yang tersedia
func TestDeleteAsset_WhenAssetExists_ShouldSucceed(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	asset := &domain.Asset{ID: "JKT-IT-26-0001", Status: "Tersedia"}
	repo.On("FindByID", "JKT-IT-26-0001").Return(asset, nil)
	repo.On("Delete", "JKT-IT-26-0001").Return(nil)

	err := svc.DeleteAsset("JKT-IT-26-0001", "actorID", "actorName")

	assert.NoError(t, err)
}

// ❌ Negatif — Hapus aset yang tidak ada di database
func TestDeleteAsset_WhenAssetNotFound_ShouldReturnError(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	repo.On("FindByID", "INVALID-ID").Return(nil, errors.New("record not found"))

	err := svc.DeleteAsset("INVALID-ID", "actorID", "actorName")
	assert.Error(t, err)
}

func TestCreateBulkAssets_WithValidData_ShouldSucceed(t *testing.T) {
	repo := new(MockAssetRepository)
	svc := newAssetService(repo)

	input := &domain.CreateBulkAssetsInput{
		Name:     "Kursi Kantor",
		Category: "Furnitur",
		Location: "Jakarta",
		Items: []domain.BulkAssetItem{
			{SerialNumber: "SN-K-01", Condition: "Baik"},
			{SerialNumber: "SN-K-02", Condition: "Rusak"},
		},
	}

	repo.On("GetLastIDByPrefix", mock.AnythingOfType("string")).Return("JKT-FURN-26-0002", nil)
	repo.On("Create", mock.AnythingOfType("*domain.Asset")).Return(nil)

	assets, err := svc.CreateBulkAssets(input, "test-user-id", "Test User")

	assert.NoError(t, err)
	assert.Len(t, assets, 2)
	assert.Equal(t, "JKT-FURN-26-0003", assets[0].ID)
	assert.Equal(t, "JKT-FURN-26-0004", assets[1].ID)
	assert.Equal(t, "SN-K-01", *assets[0].SerialNumber)
	assert.Equal(t, "SN-K-02", *assets[1].SerialNumber)
	assert.Equal(t, "Baik", assets[0].Condition)
	assert.Equal(t, "Rusak", assets[1].Condition)
}

