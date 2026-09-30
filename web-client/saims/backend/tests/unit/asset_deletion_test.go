package unit

import (
	"testing"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockAssetDeletionRepository struct {
	mock.Mock
}

type MockAuditRepository struct {
	mock.Mock
}

func (m *MockAuditRepository) Create(log *domain.AuditLog) error {
	args := m.Called(log)
	return args.Error(0)
}
func (m *MockAuditRepository) FindAll(offset, limit int, filters map[string]string) ([]domain.AuditLog, int64, error) {
	args := m.Called(offset, limit, filters)
	return args.Get(0).([]domain.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *MockAssetDeletionRepository) Create(req *domain.AssetDeletionRequest) error {
	args := m.Called(req)
	return args.Error(0)
}

func (m *MockAssetDeletionRepository) FindAll(status string) ([]domain.AssetDeletionRequest, error) {
	args := m.Called(status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.AssetDeletionRequest), args.Error(1)
}

func (m *MockAssetDeletionRepository) FindByID(id string) (*domain.AssetDeletionRequest, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.AssetDeletionRequest), args.Error(1)
}

func (m *MockAssetDeletionRepository) UpdateStatus(id string, status string, approverID string) error {
	args := m.Called(id, status, approverID)
	return args.Error(0)
}

func TestAssetDeletionRequest_CreateRequest_SendsNotification(t *testing.T) {
	mockRepo := new(MockAssetDeletionRepository)
	mockAudit := new(MockAuditRepository)
	mockBorrowing := new(MockBorrowingRepository)
	mockMaint := new(MockMaintenanceRepository)
	mockNotif := new(MockNotificationService)

	svc := services.NewAssetDeletionRequestService(mockRepo, mockAudit, mockBorrowing, mockMaint, mockNotif)

	assetID := "AST-26-0001"
	reqID := uuid.New().String()
	actorName := "Admin Test"
	reason := "Barang rusak total"

	mockBorrowing.On("IsAssetActivelyBorrowed", assetID).Return(false, nil)
	mockMaint.On("IsAssetInActiveMaintenance", assetID).Return(false, nil)
	mockRepo.On("FindAll", "Pending").Return([]domain.AssetDeletionRequest{}, nil)
	mockRepo.On("Create", mock.Anything).Return(nil)
	mockAudit.On("Create", mock.Anything).Return(nil)
	mockNotif.On("CreateNotificationForRole", "Supervisor", "Pengajuan Penghapusan Aset", mock.Anything, "deletion").Return(nil)

	req, err := svc.CreateRequest(assetID, reqID, actorName, reason)

	assert.NoError(t, err)
	assert.NotNil(t, req)
	assert.Equal(t, assetID, req.AssetID)
	assert.Equal(t, "Pending", req.Status)

	mockNotif.AssertExpectations(t)
}

func TestAssetDeletionRequest_ApproveRequest_SendsNotification(t *testing.T) {
	mockRepo := new(MockAssetDeletionRepository)
	mockAudit := new(MockAuditRepository)
	mockBorrowing := new(MockBorrowingRepository)
	mockMaint := new(MockMaintenanceRepository)
	mockNotif := new(MockNotificationService)

	svc := services.NewAssetDeletionRequestService(mockRepo, mockAudit, mockBorrowing, mockMaint, mockNotif)

	reqUUID := uuid.New()
	userUUID := uuid.New()
	approverUUID := uuid.New().String()
	actorName := "Supervisor Test"

	existingReq := &domain.AssetDeletionRequest{
		ID:          reqUUID,
		AssetID:     "AST-26-0001",
		RequesterID: userUUID,
		Reason:      "Rusak parah",
		Status:      "Pending",
	}

	mockRepo.On("FindByID", reqUUID.String()).Return(existingReq, nil)
	mockRepo.On("UpdateStatus", reqUUID.String(), "Approved", approverUUID).Return(nil)
	mockAudit.On("Create", mock.Anything).Return(nil)
	mockNotif.On("CreateNotificationForUser", userUUID.String(), "Penghapusan Aset Disetujui", mock.Anything, "deletion").Return(nil)

	err := svc.ApproveRequest(reqUUID.String(), approverUUID, actorName)

	assert.NoError(t, err)
	mockNotif.AssertExpectations(t)
}
