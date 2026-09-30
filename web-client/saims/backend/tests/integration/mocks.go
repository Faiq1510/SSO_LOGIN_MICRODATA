package integration

import (
	"context"
	"mime/multipart"

	"saims-backend/internal/domain"

	"github.com/stretchr/testify/mock"
)

// ─────────────────────────────────────────────────────
//  MOCK: AuthService
// ─────────────────────────────────────────────────────
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(req domain.RegisterRequest) (*domain.User, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}
func (m *MockAuthService) Login(req domain.LoginRequest) (string, string, *domain.User, bool, error) {
	args := m.Called(req)
	if args.Get(2) == nil {
		return args.String(0), args.String(1), nil, args.Bool(3), args.Error(4)
	}
	return args.String(0), args.String(1), args.Get(2).(*domain.User), args.Bool(3), args.Error(4)
}
func (m *MockAuthService) VerifyOTP(req domain.VerifyOTPRequest) (string, string, *domain.User, error) {
	args := m.Called(req)
	if args.Get(2) == nil {
		return args.String(0), args.String(1), nil, args.Error(3)
	}
	return args.String(0), args.String(1), args.Get(2).(*domain.User), args.Error(3)
}
func (m *MockAuthService) ResendOTP(email string) error {
	args := m.Called(email)
	return args.Error(0)
}

func (m *MockAuthService) Logout(userID string, tokenString string) error {
	args := m.Called(userID, tokenString)
	return args.Error(0)
}

func (m *MockAuthService) RefreshToken(refreshToken string) (string, string, error) {
	args := m.Called(refreshToken)
	return args.String(0), args.String(1), args.Error(2)
}

func (m *MockAuthService) SSOLogin(ssoToken string) (string, string, *domain.User, error) {
	args := m.Called(ssoToken)
	if args.Get(2) == nil {
		return args.String(0), args.String(1), nil, args.Error(3)
	}
	return args.String(0), args.String(1), args.Get(2).(*domain.User), args.Error(3)
}

func (m *MockAuthService) ForgotPassword(email string) error {
	args := m.Called(email)
	return args.Error(0)
}

func (m *MockAuthService) ResetPasswordWithOTP(req domain.ResetPasswordWithOTPRequest) error {
	args := m.Called(req)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  MOCK: AuditRepository
// ─────────────────────────────────────────────────────
type MockAuditRepository struct {
	mock.Mock
}

func (m *MockAuditRepository) Create(log *domain.AuditLog) error {
	args := m.Called(log)
	return args.Error(0)
}

func (m *MockAuditRepository) FindAll(offset, limit int, filters map[string]string) ([]domain.AuditLog, int64, error) {
	args := m.Called(offset, limit, filters)
	
	var logs []domain.AuditLog
	if args.Get(0) != nil {
		logs = args.Get(0).([]domain.AuditLog)
	}
	
	return logs, int64(args.Int(1)), args.Error(2)
}

// ─────────────────────────────────────────────────────
//  MOCK: UserService
// ─────────────────────────────────────────────────────
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetAllUsers() ([]domain.User, error) {
	args := m.Called()
	return args.Get(0).([]domain.User), args.Error(1)
}
func (m *MockUserService) GetUserByID(id string) (*domain.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}
func (m *MockUserService) UpdateUserRole(id string, role string, actorID, actorName string) error {
	args := m.Called(id, role, actorID, actorName)
	return args.Error(0)
}
func (m *MockUserService) UpdateProfile(id string, req domain.UpdateProfileRequest, actorID, actorName string) (*domain.User, bool, error) {
	args := m.Called(id, req, actorID, actorName)
	if args.Get(0) == nil {
		return nil, args.Bool(1), args.Error(2)
	}
	return args.Get(0).(*domain.User), args.Bool(1), args.Error(2)
}
func (m *MockUserService) VerifyPhone(id string, req domain.VerifyPhoneRequest, actorID, actorName string) (*domain.User, error) {
	args := m.Called(id, req, actorID, actorName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}
func (m *MockUserService) ChangePassword(id string, req domain.ChangePasswordRequest, actorID, actorName string) error {
	args := m.Called(id, req, actorID, actorName)
	return args.Error(0)
}
func (m *MockUserService) DeleteUser(id string, actorID, actorName string) error {
	args := m.Called(id, actorID, actorName)
	return args.Error(0)
}
func (m *MockUserService) UploadAvatar(ctx context.Context, userID string, fileHeader *multipart.FileHeader) (string, error) {
	args := m.Called(ctx, userID, fileHeader)
	return args.String(0), args.Error(1)
}
func (m *MockUserService) GetAvatarPresignedURL(ctx context.Context, filename string) (string, error) {
	args := m.Called(ctx, filename)
	return args.String(0), args.Error(1)
}

// ─────────────────────────────────────────────────────
//  MOCK: AssetService
// ─────────────────────────────────────────────────────
type MockAssetService struct {
	mock.Mock
}

func (m *MockAssetService) CreateAsset(input *domain.CreateAssetInput, actorID, actorName string) (*domain.Asset, error) {
	args := m.Called(input, actorID, actorName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Asset), args.Error(1)
}
func (m *MockAssetService) CreateBulkAssets(input *domain.CreateBulkAssetsInput, actorID, actorName string) ([]*domain.Asset, error) {
	args := m.Called(input, actorID, actorName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Asset), args.Error(1)
}
func (m *MockAssetService) GetAssets(options *domain.AssetQueryOptions) (*domain.PaginatedResponse, error) {
	args := m.Called(options)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PaginatedResponse), args.Error(1)
}
func (m *MockAssetService) GetAssetByID(id string) (*domain.Asset, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Asset), args.Error(1)
}
func (m *MockAssetService) UpdateAsset(id string, input *domain.UpdateAssetInput, actorID, actorName string) (*domain.Asset, error) {
	args := m.Called(id, input, actorID, actorName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Asset), args.Error(1)
}
func (m *MockAssetService) DeleteAsset(id string, actorID, actorName string) error {
	args := m.Called(id, actorID, actorName)
	return args.Error(0)
}
func (m *MockAssetService) RestoreAsset(id string, actorID, actorName string) error {
	args := m.Called(id, actorID, actorName)
	return args.Error(0)
}
func (m *MockAssetService) GetDeletedAssets(options *domain.AssetQueryOptions) (*domain.PaginatedResponse, error) {
	args := m.Called(options)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PaginatedResponse), args.Error(1)
}

// ─────────────────────────────────────────────────────
//  MOCK: BorrowingService
// ─────────────────────────────────────────────────────
type MockBorrowingService struct {
	mock.Mock
}

func (m *MockBorrowingService) CreateBorrowing(userID string, userName string, input *domain.CreateBorrowingInput) ([]*domain.Borrowing, error) {
	args := m.Called(userID, userName, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Borrowing), args.Error(1)
}
func (m *MockBorrowingService) GetBorrowings(options *domain.BorrowingQueryOptions) (*domain.PaginatedResponse, error) {
	args := m.Called(options)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PaginatedResponse), args.Error(1)
}
func (m *MockBorrowingService) UpdateBorrowingStatus(id string, input *domain.UpdateBorrowingStatusInput, userRole string, actorID string, actorName string) (*domain.Borrowing, error) {
	args := m.Called(id, input, userRole, actorID, actorName)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Borrowing), args.Error(1)
}
func (m *MockBorrowingService) DeleteBorrowing(id string, userRole string, userID string, actorName string) error {
	args := m.Called(id, userRole, userID, actorName)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  MOCK: AssetDeletionRequestService
// ─────────────────────────────────────────────────────
type MockAssetDeletionRequestService struct {
	mock.Mock
}

func (m *MockAssetDeletionRequestService) CreateRequest(assetID string, requesterID string, actorName string, reason string) (*domain.AssetDeletionRequest, error) {
	args := m.Called(assetID, requesterID, actorName, reason)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.AssetDeletionRequest), args.Error(1)
}
func (m *MockAssetDeletionRequestService) GetRequests(status string) ([]domain.AssetDeletionRequest, error) {
	args := m.Called(status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.AssetDeletionRequest), args.Error(1)
}
func (m *MockAssetDeletionRequestService) ApproveRequest(id string, approverID string, actorName string) error {
	args := m.Called(id, approverID, actorName)
	return args.Error(0)
}
func (m *MockAssetDeletionRequestService) RejectRequest(id string, approverID string, actorName string) error {
	args := m.Called(id, approverID, actorName)
	return args.Error(0)
}

// ─────────────────────────────────────────────────────
//  MOCK: MaintenanceService
// ─────────────────────────────────────────────────────
type MockMaintenanceService struct {
	mock.Mock
}

func (m *MockMaintenanceService) CreateMaintenance(technicianID string, technicianName string, input *domain.CreateMaintenanceInput) (*domain.Maintenance, error) {
	args := m.Called(technicianID, technicianName, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Maintenance), args.Error(1)
}

func (m *MockMaintenanceService) GetMaintenances(options *domain.MaintenanceQueryOptions) (*domain.PaginatedResponse, error) {
	args := m.Called(options)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.PaginatedResponse), args.Error(1)
}

func (m *MockMaintenanceService) UpdateMaintenanceStatus(id string, userID string, userRole string, input *domain.UpdateMaintenanceStatusInput) (*domain.Maintenance, error) {
	args := m.Called(id, userID, userRole, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Maintenance), args.Error(1)
}

func (m *MockMaintenanceService) UpdateMaintenanceDetails(id string, userID string, userRole string, input *domain.UpdateMaintenanceDetailsInput) (*domain.Maintenance, error) {
	args := m.Called(id, userID, userRole, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Maintenance), args.Error(1)
}

func (m *MockMaintenanceService) ConfirmPayment(maintenanceIDs []string, adminID string, adminName string) error {
	args := m.Called(maintenanceIDs, adminID, adminName)
	return args.Error(0)
}

func (m *MockMaintenanceService) CreateBulkMaintenance(technicianID string, technicianName string, input *domain.CreateBulkMaintenanceInput) ([]*domain.Maintenance, error) {
	args := m.Called(technicianID, technicianName, input)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Maintenance), args.Error(1)
}

// ─────────────────────────────────────────────────────
//  MOCK: JWTBlacklistRepository
// ─────────────────────────────────────────────────────
type MockJWTBlacklistRepository struct {
	mock.Mock
}

func (m *MockJWTBlacklistRepository) Create(blacklist *domain.JWTBlacklist) error {
	args := m.Called(blacklist)
	return args.Error(0)
}

func (m *MockJWTBlacklistRepository) IsBlacklisted(token string) bool {
	args := m.Called(token)
	return args.Bool(0)
}
