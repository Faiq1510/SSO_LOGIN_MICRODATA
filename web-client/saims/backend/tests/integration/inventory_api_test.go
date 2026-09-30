package integration

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"saims-backend/internal/domain"
	"saims-backend/internal/handlers"
	"saims-backend/internal/middleware"
)

func setupAssetRouter(mockService *MockAssetService, mockDeletionService *MockAssetDeletionRequestService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	handler := handlers.NewAssetHandler(mockService, mockDeletionService)
	
	mockJWT := new(MockJWTBlacklistRepository)
	mockJWT.On("IsBlacklisted", mock.Anything).Return(false)
	
	assets := router.Group("/api/assets")
	assets.Use(middleware.RequireAuth(mockJWT))
	{
		assets.GET("", handler.GetAssets)
		assets.GET("/:id", handler.GetAssetByID)

		adminAssets := assets.Group("")
		adminAssets.Use(middleware.RequireRole("Administrator"))
		{
			adminAssets.POST("", handler.CreateAsset)
			adminAssets.POST("/bulk", handler.CreateBulkAssets)
			adminAssets.PUT("/:id", handler.UpdateAsset)
			adminAssets.DELETE("/:id", handler.DeleteAsset)
		}
	}
	
	return router
}

func TestAssetAPI_RoleAccess(t *testing.T) {
	mockService := new(MockAssetService)
	mockDeletionService := new(MockAssetDeletionRequestService)
	router := setupAssetRouter(mockService, mockDeletionService)

	mockResponse := &domain.PaginatedResponse{Data: []domain.Asset{{ID: "A-1"}}, Total: 1}
	mockAsset := &domain.Asset{ID: "A-1"}

	testCases := []struct {
		name         string
		method       string
		url          string
		role         string
		expectedCode int
		mockSetup    func()
		reqBody      interface{}
	}{
		// GET /api/assets (Allowed for all authenticated users)
		{"GetAssets_Admin", http.MethodGet, "/api/assets?page=1&limit=10", "Administrator", http.StatusOK, func() {
			mockService.On("GetAssets", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},
		{"GetAssets_Supervisor", http.MethodGet, "/api/assets?page=1&limit=10", "Supervisor", http.StatusOK, func() {
			mockService.On("GetAssets", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},
		{"GetAssets_Staff", http.MethodGet, "/api/assets?page=1&limit=10", "Staff", http.StatusOK, func() {
			mockService.On("GetAssets", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},
		{"GetAssets_Teknisi", http.MethodGet, "/api/assets?page=1&limit=10", "Teknisi", http.StatusOK, func() {
			mockService.On("GetAssets", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},

		// POST /api/assets (Admin only)
		{"CreateAsset_Admin", http.MethodPost, "/api/assets", "Administrator", http.StatusCreated, func() {
			mockService.On("CreateAsset", mock.Anything, "user-123", "Test User").Return(mockAsset, nil).Once()
		}, domain.CreateAssetInput{Name: "Monitor", Category: "IT", Location: "JKT", Status: "Tersedia", Condition: "Baik"}},
		{"CreateAsset_Supervisor", http.MethodPost, "/api/assets", "Supervisor", http.StatusForbidden, func() {}, domain.CreateAssetInput{Name: "Monitor"}},
		{"CreateAsset_Staff", http.MethodPost, "/api/assets", "Staff", http.StatusForbidden, func() {}, domain.CreateAssetInput{Name: "Monitor"}},
		{"CreateAsset_Teknisi", http.MethodPost, "/api/assets", "Teknisi", http.StatusForbidden, func() {}, domain.CreateAssetInput{Name: "Monitor"}},

		// POST /api/assets/bulk (Admin only)
		{"CreateBulkAsset_Admin", http.MethodPost, "/api/assets/bulk", "Administrator", http.StatusCreated, func() {
			mockService.On("CreateBulkAssets", mock.Anything, "user-123", "Test User").Return([]*domain.Asset{mockAsset}, nil).Once()
		}, domain.CreateBulkAssetsInput{Name: "Monitor", Category: "IT", Location: "JKT", Items: []domain.BulkAssetItem{{SerialNumber: "SN1"}}}},
		{"CreateBulkAsset_Supervisor", http.MethodPost, "/api/assets/bulk", "Supervisor", http.StatusForbidden, func() {}, domain.CreateBulkAssetsInput{Name: "Monitor"}},
		{"CreateBulkAsset_Staff", http.MethodPost, "/api/assets/bulk", "Staff", http.StatusForbidden, func() {}, domain.CreateBulkAssetsInput{Name: "Monitor"}},
		{"CreateBulkAsset_Teknisi", http.MethodPost, "/api/assets/bulk", "Teknisi", http.StatusForbidden, func() {}, domain.CreateBulkAssetsInput{Name: "Monitor"}},

		// PUT /api/assets/:id (Admin only)
		{"UpdateAsset_Admin", http.MethodPut, "/api/assets/A-1", "Administrator", http.StatusOK, func() {
			mockService.On("UpdateAsset", "A-1", mock.Anything, "user-123", "Test User").Return(mockAsset, nil).Once()
		}, domain.UpdateAssetInput{Name: "Updated"}},
		{"UpdateAsset_Supervisor", http.MethodPut, "/api/assets/A-1", "Supervisor", http.StatusForbidden, func() {}, domain.UpdateAssetInput{Name: "Updated"}},
		{"UpdateAsset_Staff", http.MethodPut, "/api/assets/A-1", "Staff", http.StatusForbidden, func() {}, domain.UpdateAssetInput{Name: "Updated"}},
		{"UpdateAsset_Teknisi", http.MethodPut, "/api/assets/A-1", "Teknisi", http.StatusForbidden, func() {}, domain.UpdateAssetInput{Name: "Updated"}},

		// DELETE /api/assets/:id (Admin only - via request)
		{"DeleteAsset_Admin", http.MethodDelete, "/api/assets/A-1", "Administrator", http.StatusOK, func() {
			mockDeletionService.On("CreateRequest", "A-1", "user-123", "Test User", "Test reason").Return(&domain.AssetDeletionRequest{}, nil).Once()
		}, map[string]string{"reason": "Test reason"}},
		{"DeleteAsset_Supervisor", http.MethodDelete, "/api/assets/A-1", "Supervisor", http.StatusForbidden, func() {}, map[string]string{"reason": "Test reason"}},
		{"DeleteAsset_Staff", http.MethodDelete, "/api/assets/A-1", "Staff", http.StatusForbidden, func() {}, map[string]string{"reason": "Test reason"}},
		{"DeleteAsset_Teknisi", http.MethodDelete, "/api/assets/A-1", "Teknisi", http.StatusForbidden, func() {}, map[string]string{"reason": "Test reason"}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			tc.mockSetup()

			var bodyBytes []byte
			if tc.reqBody != nil {
				bodyBytes, _ = json.Marshal(tc.reqBody)
			}
			req, _ := http.NewRequest(tc.method, tc.url, bytes.NewBuffer(bodyBytes))

			token := getTestToken(tc.role)
			req.Header.Set("Authorization", "Bearer "+token)
			if tc.reqBody != nil {
				req.Header.Set("Content-Type", "application/json")
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tc.expectedCode, w.Code)
		})
	}
}
