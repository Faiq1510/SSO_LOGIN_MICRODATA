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

func setupMaintenanceRouter(mockService *MockMaintenanceService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()

	handler := handlers.NewMaintenanceHandler(mockService)

	mockJWT := new(MockJWTBlacklistRepository)
	mockJWT.On("IsBlacklisted", mock.Anything).Return(false)

	maintenance := router.Group("/api/maintenance")
	maintenance.Use(middleware.RequireAuth(mockJWT))
	{
		maintenance.GET("", handler.GetMaintenances)

		techAdminOnly := maintenance.Group("")
		techAdminOnly.Use(middleware.RequireRole("Administrator", "Teknisi"))
		{
			techAdminOnly.POST("", handler.CreateMaintenance)
			techAdminOnly.PUT("/:id/details", handler.UpdateDetails)
		}

		techOnly := maintenance.Group("")
		techOnly.Use(middleware.RequireRole("Teknisi"))
		{
			techOnly.PUT("/:id/status", handler.UpdateMaintenanceStatus)
		}
	}

	return router
}

func TestMaintenanceAPI_RoleAccess(t *testing.T) {
	mockService := new(MockMaintenanceService)
	router := setupMaintenanceRouter(mockService)

	mockResponse := &domain.PaginatedResponse{Data: []domain.Maintenance{{ID: "MNT-1"}}, Total: 1}
	mockMnt := &domain.Maintenance{ID: "MNT-1"}

	testCases := []struct {
		name         string
		method       string
		url          string
		role         string
		expectedCode int
		mockSetup    func()
		reqBody      interface{}
	}{
		// GET /api/maintenance (Allowed for all authenticated users)
		{"GetMaintenances_Admin", http.MethodGet, "/api/maintenance", "Administrator", http.StatusOK, func() {
			mockService.On("GetMaintenances", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},
		{"GetMaintenances_Supervisor", http.MethodGet, "/api/maintenance", "Supervisor", http.StatusOK, func() {
			mockService.On("GetMaintenances", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},
		{"GetMaintenances_Staff", http.MethodGet, "/api/maintenance", "Staff", http.StatusOK, func() {
			mockService.On("GetMaintenances", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},
		{"GetMaintenances_Teknisi", http.MethodGet, "/api/maintenance", "Teknisi", http.StatusOK, func() {
			mockService.On("GetMaintenances", mock.Anything).Return(mockResponse, nil).Once()
		}, nil},

		// POST /api/maintenance (Admin, Teknisi only)
		{"CreateMaintenance_Admin", http.MethodPost, "/api/maintenance", "Administrator", http.StatusCreated, func() {
			mockService.On("CreateMaintenance", "user-123", "Test User", mock.Anything).Return(mockMnt, nil).Once()
		}, domain.CreateMaintenanceInput{AssetID: "A-1", Type: "Perbaikan", ScheduledDate: "2026-07-15", EstimatedCost: 100000}},
		{"CreateMaintenance_Supervisor", http.MethodPost, "/api/maintenance", "Supervisor", http.StatusForbidden, func() {}, domain.CreateMaintenanceInput{AssetID: "A-1", Type: "Perbaikan", ScheduledDate: "2026-07-15", EstimatedCost: 100000}},
		{"CreateMaintenance_Staff", http.MethodPost, "/api/maintenance", "Staff", http.StatusForbidden, func() {}, domain.CreateMaintenanceInput{AssetID: "A-1", Type: "Perbaikan", ScheduledDate: "2026-07-15", EstimatedCost: 100000}},
		{"CreateMaintenance_Teknisi", http.MethodPost, "/api/maintenance", "Teknisi", http.StatusCreated, func() {
			mockService.On("CreateMaintenance", "user-123", "Test User", mock.Anything).Return(mockMnt, nil).Once()
		}, domain.CreateMaintenanceInput{AssetID: "A-1", Type: "Perbaikan", ScheduledDate: "2026-07-15", EstimatedCost: 100000}},

		// PUT /api/maintenance/:id/details (Admin, Teknisi only)
		{"UpdateDetails_Admin", http.MethodPut, "/api/maintenance/MNT-1/details", "Administrator", http.StatusOK, func() {
			mockService.On("UpdateMaintenanceDetails", "MNT-1", "user-123", "Administrator", mock.Anything).Return(mockMnt, nil).Once()
		}, domain.UpdateMaintenanceDetailsInput{Type: "Test", ScheduledDate: "2026-07-15"}},
		{"UpdateDetails_Supervisor", http.MethodPut, "/api/maintenance/MNT-1/details", "Supervisor", http.StatusForbidden, func() {}, domain.UpdateMaintenanceDetailsInput{Type: "Test", ScheduledDate: "2026-07-15"}},
		{"UpdateDetails_Staff", http.MethodPut, "/api/maintenance/MNT-1/details", "Staff", http.StatusForbidden, func() {}, domain.UpdateMaintenanceDetailsInput{Type: "Test", ScheduledDate: "2026-07-15"}},
		{"UpdateDetails_Teknisi", http.MethodPut, "/api/maintenance/MNT-1/details", "Teknisi", http.StatusOK, func() {
			mockService.On("UpdateMaintenanceDetails", "MNT-1", "user-123", "Teknisi", mock.Anything).Return(mockMnt, nil).Once()
		}, domain.UpdateMaintenanceDetailsInput{Type: "Test", ScheduledDate: "2026-07-15"}},

		// PUT /api/maintenance/:id/status (Teknisi only)
		{"UpdateStatus_Admin", http.MethodPut, "/api/maintenance/MNT-1/status", "Administrator", http.StatusForbidden, func() {}, domain.UpdateMaintenanceStatusInput{Status: "Selesai"}},
		{"UpdateStatus_Supervisor", http.MethodPut, "/api/maintenance/MNT-1/status", "Supervisor", http.StatusForbidden, func() {}, domain.UpdateMaintenanceStatusInput{Status: "Selesai"}},
		{"UpdateStatus_Staff", http.MethodPut, "/api/maintenance/MNT-1/status", "Staff", http.StatusForbidden, func() {}, domain.UpdateMaintenanceStatusInput{Status: "Selesai"}},
		{"UpdateStatus_Teknisi", http.MethodPut, "/api/maintenance/MNT-1/status", "Teknisi", http.StatusOK, func() {
			mockService.On("UpdateMaintenanceStatus", "MNT-1", "user-123", "Teknisi", mock.Anything).Return(mockMnt, nil).Once()
		}, domain.UpdateMaintenanceStatusInput{Status: "Selesai"}},
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
