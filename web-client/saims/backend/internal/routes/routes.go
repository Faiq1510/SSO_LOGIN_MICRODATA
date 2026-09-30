package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"

	"saims-backend/internal/config"
	"saims-backend/internal/handlers"
	"saims-backend/internal/middleware"
	"saims-backend/internal/repositories"
	"saims-backend/internal/services"
)

// SetupRoutes registers all API endpoints
func SetupRoutes(router *gin.Engine, db *gorm.DB, minioClient *minio.Client) {
	api := router.Group("/api")

	// Apply global security and rate-limiting middlewares
	api.Use(middleware.RequestID(), middleware.SecurityHeaders(), middleware.RateLimit(), middleware.Idempotency())

	// Health check — public
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "SAIMS API is running"})
	})

	// ─── Repositories ────────────────────────────────────────────────────────
	userRepo := repositories.NewUserRepository(db)
	assetRepo := repositories.NewAssetRepository(db)
	assetImageRepo := repositories.NewAssetImageRepository(db)
	notificationRepo := repositories.NewNotificationRepository(db)
	borrowingRepo := repositories.NewBorrowingRepository(db)
	maintenanceRepo := repositories.NewMaintenanceRepository(db)
	dashboardRepo := repositories.NewDashboardRepository(db)
	auditRepo := repositories.NewAuditRepository(db)
	assetDeletionRepo := repositories.NewAssetDeletionRequestRepository(db)
	jwtBlacklistRepo := repositories.NewJWTBlacklistRepository(db)

	// ─── External Services ───────────────────────────────────────────────────
	waService := services.NewWhatsAppService()
	storageService := services.NewStorageService(minioClient)

	// ─── Domain Services ─────────────────────────────────────────────────────
	authService := services.NewAuthService(userRepo, waService, auditRepo, jwtBlacklistRepo)
	userService := services.NewUserService(userRepo, waService, storageService, config.GetEnv("MINIO_BUCKET", "inventory-assets"), auditRepo)
	notificationService := services.NewNotificationService(notificationRepo, userRepo)

	assetService := services.NewAssetService(
		assetRepo,
		borrowingRepo,
		maintenanceRepo,
		assetImageRepo,
		storageService,
		auditRepo,
		assetDeletionRepo,
	)

	assetImageService := services.NewAssetImageService(
		assetImageRepo,
		storageService,
		config.GetEnv("MINIO_BUCKET", "inventory-assets"),
		config.GetEnv("MINIO_PUBLIC_ENDPOINT", ""),
	)
	borrowingService := services.NewBorrowingService(borrowingRepo, assetRepo, userRepo, waService, notificationService, auditRepo, assetDeletionRepo)
	invoiceService := services.NewInvoiceService()
	maintenanceService := services.NewMaintenanceService(maintenanceRepo, assetRepo, userRepo, auditRepo, waService, notificationService, invoiceService, storageService)
	dashboardService := services.NewDashboardService(dashboardRepo)
	assetDeletionService := services.NewAssetDeletionRequestService(assetDeletionRepo, auditRepo, borrowingRepo, maintenanceRepo, notificationService)

	// ─── Handlers ────────────────────────────────────────────────────────────
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	assetHandler := handlers.NewAssetHandler(assetService, assetDeletionService)
	assetImageHandler := handlers.NewAssetImageHandler(assetImageService)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	borrowingHandler := handlers.NewBorrowingHandler(borrowingService)
	maintenanceHandler := handlers.NewMaintenanceHandler(maintenanceService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)
	assetDeletionHandler := handlers.NewAssetDeletionHandler(assetDeletionService, assetService)
	auditLogHandler := handlers.NewAuditLogHandler(auditRepo)

	// ─── Auth Routes (Public) ───────────────────────────────────────────────────
	// POST /api/auth/register  — All roles
	// POST /api/auth/login     — All roles
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/verify-otp", authHandler.VerifyOTP)
		auth.POST("/resend-otp", authHandler.ResendOTP)
		auth.POST("/refresh", authHandler.RefreshToken)
		auth.POST("/logout", authHandler.Logout)
		auth.GET("/sso/callback", authHandler.SSOCallback)
		auth.POST("/sso/callback", authHandler.SSOCallback)
		auth.POST("/forgot-password", authHandler.ForgotPassword)
		auth.POST("/reset-password", authHandler.ResetPasswordWithOTP)
	}

	// ─── User Routes ────────────────────────────────────────────────────────────
	users := api.Group("/users")

	users.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		// PUT /api/users/profile        — All roles (self)
		// PUT /api/users/change-password — All roles (self)
		// These must be registered BEFORE /:id to avoid route conflicts
		users.PUT("/profile", userHandler.UpdateProfile)
		users.POST("/profile/verify-phone", userHandler.VerifyPhone)
		users.PUT("/change-password", userHandler.ChangePassword)

		// GET /api/users        — Administrator only
		// GET /api/users/:id    — Administrator only
		// PUT /api/users/:id/role  — Administrator only (V*)
		// DELETE /api/users/:id    — Administrator only (V*)
		adminOnly := users.Group("")
		adminOnly.Use(middleware.RequireRole("Administrator"))
		{
			adminOnly.GET("", userHandler.GetUsers)
			adminOnly.GET("/:id", userHandler.GetUserByID)
			adminOnly.PUT("/:id/role", userHandler.UpdateUserRole)
			adminOnly.DELETE("/:id", userHandler.DeleteUser)
		}
	}

	// ─── Audit Logs Routes ──────────────────────────────────────────────────────
	auditLogs := api.Group("/audit-logs")
	auditLogs.Use(middleware.RequireAuth(jwtBlacklistRepo), middleware.RequireRole("Administrator"))
	{
		auditLogs.GET("", auditLogHandler.GetAuditLogs)
	}

	// ─── Asset Routes ────────────────────────────────────────────────────────────
	// GET /api/assets      — All roles
	// GET /api/assets/:id  — All roles
	// POST /api/assets     — Administrator only
	// PUT /api/assets/:id  — Administrator only
	// DELETE /api/assets/:id — Administrator only
	assets := api.Group("/assets")
	assets.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		assets.GET("", assetHandler.GetAssets)

		adminAssets := assets.Group("")
		adminAssets.Use(middleware.RequireRole("Administrator"))
		{
			adminAssets.GET("/trash", assetHandler.GetDeletedAssets)
			adminAssets.POST("/:id/restore", assetHandler.RestoreAsset)

			adminAssets.POST("", assetHandler.CreateAsset)
			adminAssets.POST("/bulk", assetHandler.CreateBulkAssets)
			adminAssets.PUT("/:id", assetHandler.UpdateAsset)

			// Asset Images routes
			adminAssets.POST("/:id/images", assetImageHandler.UploadImage)
			adminAssets.DELETE("/:id/images/:imageId", assetImageHandler.DeleteImage)
			adminAssets.PUT("/:id/images/:imageId/primary", assetImageHandler.SetPrimaryImage)
		}

		assets.GET("/:id", assetHandler.GetAssetByID)
		assets.GET("/:id/images", assetImageHandler.GetImages)

		adminAndSuperAssets := assets.Group("")
		adminAndSuperAssets.Use(middleware.RequireRole("Administrator", "Supervisor"))
		{
			adminAndSuperAssets.DELETE("/:id", assetHandler.DeleteAsset)
		}
	}

	// ─── Asset Deletion Requests ────────────────────────────────────────────────
	assetDeletions := api.Group("/asset-deletions")
	assetDeletions.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		superOnly := assetDeletions.Group("")
		superOnly.Use(middleware.RequireRole("Supervisor"))
		{
			superOnly.GET("", assetDeletionHandler.GetRequests)
			superOnly.POST("/:id/approve", assetDeletionHandler.ApproveRequest)
			superOnly.POST("/:id/reject", assetDeletionHandler.RejectRequest)
		}
	}

	// ─── Borrowing Routes ────────────────────────────────────────────────────────
	// GET /api/borrowings           — Administrator, Supervisor, Staff
	// POST /api/borrowings          — Administrator, Supervisor, Staff
	// PUT /api/borrowings/:id/status — Administrator, Supervisor only
	borrowings := api.Group("/borrowings")
	borrowings.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		allBorrowingRoles := borrowings.Group("")
		allBorrowingRoles.Use(middleware.RequireRole("Administrator", "Supervisor", "Staff"))
		{
			allBorrowingRoles.GET("", borrowingHandler.GetBorrowings)
			allBorrowingRoles.POST("", borrowingHandler.CreateBorrowing)
			allBorrowingRoles.DELETE("/:id", borrowingHandler.DeleteBorrowing)
			allBorrowingRoles.PUT("/:id/status", borrowingHandler.UpdateBorrowingStatus)
		}
	}

	// ─── Maintenance Routes ──────────────────────────────────────────────────────
	// GET /api/maintenance              — All roles
	// POST /api/maintenance             — Administrator, Teknisi only
	// PUT /api/maintenance/:id/status   — Teknisi only
	maintenance := api.Group("/maintenance")
	maintenance.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		maintenance.GET("", maintenanceHandler.GetMaintenances)

		techAdminOnly := maintenance.Group("")
		techAdminOnly.Use(middleware.RequireRole("Administrator", "Teknisi"))
		{
			techAdminOnly.POST("", maintenanceHandler.CreateMaintenance)
			techAdminOnly.PUT("/:id/details", maintenanceHandler.UpdateDetails)
		}

		techOnly := maintenance.Group("")
		techOnly.Use(middleware.RequireRole("Teknisi"))
		{
			techOnly.PUT("/:id/status", maintenanceHandler.UpdateMaintenanceStatus)
		}
		
		adminOnly := maintenance.Group("")
		adminOnly.Use(middleware.RequireRole("Administrator"))
		{
			adminOnly.POST("/payment/confirm", maintenanceHandler.ConfirmPayment)
		}
	}

	// ─── Public Routes ────────────────────────────────────────────────────────────
	public := api.Group("/public")
	{
		public.GET("/landing-stats", dashboardHandler.GetLandingStats)
	}

	// ─── Dashboard Routes ────────────────────────────────────────────────────────
	// GET /api/dashboard/stats — All roles
	dashboard := api.Group("/dashboard")
	dashboard.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		dashboard.GET("/stats", dashboardHandler.GetStats)
	}

	// ─── Notification Routes ─────────────────────────────────────────────────────
	notifications := api.Group("/notifications")
	notifications.Use(middleware.RequireAuth(jwtBlacklistRepo))
	{
		notifications.GET("", notificationHandler.GetMyNotifications)
		notifications.PUT("/read-all", notificationHandler.MarkAllAsRead)
		notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
	}
}
