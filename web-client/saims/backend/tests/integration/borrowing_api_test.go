package integration

import (
	"bytes"
	"encoding/json"
	"errors"
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

func setupBorrowingRouter(mockService *MockBorrowingService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	handler := handlers.NewBorrowingHandler(mockService)
	mockJWT := new(MockJWTBlacklistRepository)
	mockJWT.On("IsBlacklisted", mock.Anything).Return(false)
	
	borrowings := router.Group("/api/borrowings")
	borrowings.Use(middleware.RequireAuth(mockJWT))
	{
		allRoles := borrowings.Group("")
		allRoles.Use(middleware.RequireRole("Administrator", "Supervisor", "Staff"))
		{
			allRoles.GET("", handler.GetBorrowings)
			allRoles.POST("", handler.CreateBorrowing)
		}
		
		adminSuper := borrowings.Group("")
		adminSuper.Use(middleware.RequireRole("Administrator", "Supervisor"))
		{
			adminSuper.PUT("/:id/status", handler.UpdateBorrowingStatus)
		}
	}
	
	return router
}

func TestBorrowingAPI_RoleAccess(t *testing.T) {
	mockService := new(MockBorrowingService)
	router := setupBorrowingRouter(mockService)

	testCases := []struct {
		name         string
		method       string
		url          string
		role         string
		expectedCode int
		mockSetup    func()
		reqBody      interface{}
	}{
		// GET /api/borrowings
		{"GetBorrowings_Admin", http.MethodGet, "/api/borrowings", "Administrator", http.StatusOK, func() {
			mockService.On("GetBorrowings", mock.Anything).Return(&domain.PaginatedResponse{Data: []domain.Borrowing{}, Total: 0}, nil).Once()
		}, nil},
		{"GetBorrowings_Supervisor", http.MethodGet, "/api/borrowings", "Supervisor", http.StatusOK, func() {
			mockService.On("GetBorrowings", mock.Anything).Return(&domain.PaginatedResponse{Data: []domain.Borrowing{}, Total: 0}, nil).Once()
		}, nil},
		{"GetBorrowings_Staff", http.MethodGet, "/api/borrowings", "Staff", http.StatusOK, func() {
			mockService.On("GetBorrowings", mock.Anything).Return(&domain.PaginatedResponse{Data: []domain.Borrowing{}, Total: 0}, nil).Once()
		}, nil},
		{"GetBorrowings_Teknisi", http.MethodGet, "/api/borrowings", "Teknisi", http.StatusForbidden, func() {}, nil},

		// POST /api/borrowings
		{"CreateBorrowing_Admin", http.MethodPost, "/api/borrowings", "Administrator", http.StatusCreated, func() {
			mockService.On("CreateBorrowing", "user-123", "Test User", mock.Anything).Return([]*domain.Borrowing{{ID: "BRW-1"}}, nil).Once()
		}, domain.CreateBorrowingInput{AssetIDs: []string{"A-1"}, StartDate: "2026-07-04", EndDate: "2026-07-06", Purpose: "Test"}},
		{"CreateBorrowing_Supervisor", http.MethodPost, "/api/borrowings", "Supervisor", http.StatusCreated, func() {
			mockService.On("CreateBorrowing", "user-123", "Test User", mock.Anything).Return([]*domain.Borrowing{{ID: "BRW-1"}}, nil).Once()
		}, domain.CreateBorrowingInput{AssetIDs: []string{"A-1"}, StartDate: "2026-07-04", EndDate: "2026-07-06", Purpose: "Test"}},
		{"CreateBorrowing_Staff", http.MethodPost, "/api/borrowings", "Staff", http.StatusCreated, func() {
			mockService.On("CreateBorrowing", "user-123", "Test User", mock.Anything).Return([]*domain.Borrowing{{ID: "BRW-1"}}, nil).Once()
		}, domain.CreateBorrowingInput{AssetIDs: []string{"A-1"}, StartDate: "2026-07-04", EndDate: "2026-07-06", Purpose: "Test"}},
		{"CreateBorrowing_Teknisi", http.MethodPost, "/api/borrowings", "Teknisi", http.StatusForbidden, func() {}, domain.CreateBorrowingInput{AssetIDs: []string{"A-1"}}},

		// PUT /api/borrowings/:id/status
		{"UpdateStatus_Admin", http.MethodPut, "/api/borrowings/BRW-123/status", "Administrator", http.StatusOK, func() {
			mockService.On("UpdateBorrowingStatus", "BRW-123", mock.Anything, "Administrator", "user-123", "Test User").Return(&domain.Borrowing{ID: "BRW-123"}, nil).Once()
		}, domain.UpdateBorrowingStatusInput{Status: "Approved"}},
		{"UpdateStatus_Supervisor", http.MethodPut, "/api/borrowings/BRW-123/status", "Supervisor", http.StatusOK, func() {
			mockService.On("UpdateBorrowingStatus", "BRW-123", mock.Anything, "Supervisor", "user-123", "Test User").Return(&domain.Borrowing{ID: "BRW-123"}, nil).Once()
		}, domain.UpdateBorrowingStatusInput{Status: "Approved"}},
		{"UpdateStatus_Staff", http.MethodPut, "/api/borrowings/BRW-123/status", "Staff", http.StatusForbidden, func() {}, domain.UpdateBorrowingStatusInput{Status: "Approved"}},
		{"UpdateStatus_Teknisi", http.MethodPut, "/api/borrowings/BRW-123/status", "Teknisi", http.StatusForbidden, func() {}, domain.UpdateBorrowingStatusInput{Status: "Approved"}},
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

func TestCreateBorrowingAPI_AssetNotAvailable(t *testing.T) {
	mockService := new(MockBorrowingService)
	router := setupBorrowingRouter(mockService)

	reqBody := domain.CreateBorrowingInput{
		AssetIDs:  []string{"JKT-IT-26-0001"},
		StartDate: "2026-07-04",
		EndDate:   "2026-07-06",
		Purpose:   "Keperluan Dinas",
	}

	mockService.On("CreateBorrowing", "user-123", "Test User", &reqBody).Return(nil, errors.New("aset Laptop Dell tidak tersedia"))

	bodyBytes, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest(http.MethodPost, "/api/borrowings", bytes.NewBuffer(bodyBytes))
	
	// Inject Staff token
	token := getTestToken("Staff")
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	assert.Contains(t, response["error"], "tidak tersedia")
}
