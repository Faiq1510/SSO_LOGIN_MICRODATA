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
	"saims-backend/pkg/utils"
)

func setupUserRouter(mockService *MockUserService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	
	handler := handlers.NewUserHandler(mockService)
	
	mockJWT := new(MockJWTBlacklistRepository)
	mockJWT.On("IsBlacklisted", mock.Anything).Return(false)

	// Apply similar route structure as routes.go
	users := router.Group("/api/users")
	users.Use(middleware.RequireAuth(mockJWT))
	{
		users.PUT("/profile", handler.UpdateProfile)
		users.PUT("/change-password", handler.ChangePassword)

		adminOnly := users.Group("")
		adminOnly.Use(middleware.RequireRole("Administrator"))
		{
			adminOnly.GET("", handler.GetUsers)
			adminOnly.GET("/:id", handler.GetUserByID)
			adminOnly.PUT("/:id/role", handler.UpdateUserRole)
			adminOnly.DELETE("/:id", handler.DeleteUser)
		}
	}
	
	return router
}

// Helper to generate a valid token for testing
func getTestToken(role string) string {
	accessToken, _, _ := utils.GenerateTokens("user-123", role, "Test User")
	return accessToken
}

func TestUserAPI_RoleAccess(t *testing.T) {
	mockService := new(MockUserService)
	router := setupUserRouter(mockService)

	mockUser := &domain.User{ID: "user-123", Name: "Updated Name"}
	mockUsers := []domain.User{{ID: "1", Name: "Admin User", Role: "Administrator"}}

	testCases := []struct {
		name         string
		method       string
		url          string
		role         string
		expectedCode int
		mockSetup    func()
		reqBody      interface{}
	}{
		// PUT /api/users/profile
		{"UpdateProfile_Admin", http.MethodPut, "/api/users/profile", "Administrator", http.StatusOK, func() {
			mockService.On("UpdateProfile", "user-123", mock.Anything, "user-123", "Test User").Return(mockUser, false, nil).Once()
		}, domain.UpdateProfileRequest{Name: "Updated Name", Phone: "08123456789"}},
		{"UpdateProfile_Supervisor", http.MethodPut, "/api/users/profile", "Supervisor", http.StatusOK, func() {
			mockService.On("UpdateProfile", "user-123", mock.Anything, "user-123", "Test User").Return(mockUser, false, nil).Once()
		}, domain.UpdateProfileRequest{Name: "Updated Name", Phone: "08123456789"}},
		{"UpdateProfile_Staff", http.MethodPut, "/api/users/profile", "Staff", http.StatusOK, func() {
			mockService.On("UpdateProfile", "user-123", mock.Anything, "user-123", "Test User").Return(mockUser, false, nil).Once()
		}, domain.UpdateProfileRequest{Name: "Updated Name", Phone: "08123456789"}},
		{"UpdateProfile_Teknisi", http.MethodPut, "/api/users/profile", "Teknisi", http.StatusOK, func() {
			mockService.On("UpdateProfile", "user-123", mock.Anything, "user-123", "Test User").Return(mockUser, false, nil).Once()
		}, domain.UpdateProfileRequest{Name: "Updated Name", Phone: "08123456789"}},

		// GET /api/users (Admin only)
		{"GetUsers_Admin", http.MethodGet, "/api/users", "Administrator", http.StatusOK, func() {
			mockService.On("GetAllUsers").Return(mockUsers, nil).Once()
		}, nil},
		{"GetUsers_Supervisor", http.MethodGet, "/api/users", "Supervisor", http.StatusForbidden, func() {}, nil},
		{"GetUsers_Staff", http.MethodGet, "/api/users", "Staff", http.StatusForbidden, func() {}, nil},
		{"GetUsers_Teknisi", http.MethodGet, "/api/users", "Teknisi", http.StatusForbidden, func() {}, nil},

		// GET /api/users/:id (Admin only)
		{"GetUserByID_Admin", http.MethodGet, "/api/users/1", "Administrator", http.StatusOK, func() {
			mockService.On("GetUserByID", "1").Return(mockUser, nil).Once()
		}, nil},
		{"GetUserByID_Supervisor", http.MethodGet, "/api/users/1", "Supervisor", http.StatusForbidden, func() {}, nil},
		{"GetUserByID_Staff", http.MethodGet, "/api/users/1", "Staff", http.StatusForbidden, func() {}, nil},
		{"GetUserByID_Teknisi", http.MethodGet, "/api/users/1", "Teknisi", http.StatusForbidden, func() {}, nil},

		// PUT /api/users/:id/role (Admin only)
		{"UpdateRole_Admin", http.MethodPut, "/api/users/user-123/role", "Administrator", http.StatusOK, func() {
			mockService.On("UpdateUserRole", "user-123", "Supervisor", "user-123", "Test User").Return(nil).Once()
		}, map[string]string{"role": "Supervisor"}},
		{"UpdateRole_Supervisor", http.MethodPut, "/api/users/user-123/role", "Supervisor", http.StatusForbidden, func() {}, map[string]string{"role": "Supervisor"}},
		{"UpdateRole_Staff", http.MethodPut, "/api/users/user-123/role", "Staff", http.StatusForbidden, func() {}, map[string]string{"role": "Supervisor"}},
		{"UpdateRole_Teknisi", http.MethodPut, "/api/users/user-123/role", "Teknisi", http.StatusForbidden, func() {}, map[string]string{"role": "Supervisor"}},

		// DELETE /api/users/:id (Admin only)
		{"DeleteUser_Admin", http.MethodDelete, "/api/users/1", "Administrator", http.StatusOK, func() {
			mockService.On("DeleteUser", "1", "user-123", "Test User").Return(nil).Once()
		}, nil},
		{"DeleteUser_Supervisor", http.MethodDelete, "/api/users/1", "Supervisor", http.StatusForbidden, func() {}, nil},
		{"DeleteUser_Staff", http.MethodDelete, "/api/users/1", "Staff", http.StatusForbidden, func() {}, nil},
		{"DeleteUser_Teknisi", http.MethodDelete, "/api/users/1", "Teknisi", http.StatusForbidden, func() {}, nil},
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

func TestGetUsersAPI_Unauthorized_NoToken(t *testing.T) {
	mockService := new(MockUserService)
	router := setupUserRouter(mockService)

	req, _ := http.NewRequest(http.MethodGet, "/api/users", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
