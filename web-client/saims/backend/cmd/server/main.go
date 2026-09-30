package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	ginzap "github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "saims-backend/docs"
	"saims-backend/internal/config"
	"saims-backend/internal/cron"
	"saims-backend/internal/logger"
	"saims-backend/internal/repositories"
	"saims-backend/internal/routes"
	"saims-backend/internal/services"
	"go.uber.org/zap"
)

// @title SAIMS API
// @version 1.0
// @description Smart Asset & Inventory Management System API
// @host localhost:8080
// @BasePath /api
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	// Load .env
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading it. Using OS environment variables.")
	}

	// Initialize Logger
	logger.Init()
	defer logger.Sync()

	// Timezone: Alpine doesn't have tzdata, use UTC
	time.Local = time.UTC

	// Initialize Database connection
	db, err := config.ConnectDatabase()
	if err != nil {
		logger.Log.Fatal("Failed to connect to database", zap.Error(err))
	}
	
	// Create Gin Router
	router := gin.New()

	// Add Zap Logger middleware
	router.Use(ginzap.Ginzap(logger.Log, time.RFC3339, true))
	router.Use(ginzap.RecoveryWithZap(logger.Log, true))

	// CORS configuration
	configCors := cors.DefaultConfig()
	
	allowedOrigins := config.GetEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
	if allowedOrigins == "*" {
		configCors.AllowAllOrigins = true
	} else {
		configCors.AllowOrigins = strings.Split(allowedOrigins, ",")
	}
	
	configCors.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	configCors.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Idempotency-Key"}
	configCors.AllowCredentials = true
	router.Use(cors.New(configCors))

	// Swagger documentation route
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Initialize MinIO client
	minioClient := config.InitMinio()

	// Setup API Routes
	routes.SetupRoutes(router, db, minioClient)

	// Setup and Start Cron Jobs
	assetRepo := repositories.NewAssetRepository(db)
	assetImageRepo := repositories.NewAssetImageRepository(db)
	storageService := services.NewStorageService(minioClient)
	bucketName := config.GetEnv("MINIO_BUCKET", "inventory-assets")
	gcService := services.NewGarbageCollectorService(storageService, assetImageRepo, assetRepo, bucketName)

	scheduler := cron.SetupCron(db, gcService)
	scheduler.Start()

	// Initial GC Cleanup
	go func() {
		ctx := context.Background()
		if err := gcService.RunCleanup(ctx); err != nil {
			logger.Log.Error("Initial GC Cleanup failed", zap.Error(err))
		}
	}()

	// Start server with Graceful Shutdown
	port := config.GetEnv("PORT", "8080")
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		logger.Log.Info("Server running", zap.String("port", port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Log.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Log.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Log.Fatal("Server forced to shutdown", zap.Error(err))
	}
	logger.Log.Info("Server exiting")
}
