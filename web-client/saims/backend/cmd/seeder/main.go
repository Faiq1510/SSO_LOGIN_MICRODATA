package main

import (
	"log"

	"github.com/joho/godotenv"
	"saims-backend/internal/config"
	"saims-backend/internal/domain"
	"saims-backend/pkg/utils"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using default env vars")
	}

	// Connect to Database
	db, err := config.ConnectDatabase()
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// Prepare admin user data
	email := "admin@example.com"
	password := "Admin@123"

	// Check if admin already exists
	var existingUser domain.User
	if err := db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		log.Println("Admin user already exists.")
	} else {
		// Hash password
		hashedPassword, err := utils.HashPassword(password)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		// Create user
		adminUser := domain.User{
			Name:       "Administrator",
			Email:      email,
			Password:   hashedPassword,
			Role:       "Administrator", // Force set to Administrator
			Department: "Management",
		}

		// Save to DB
		if err := db.Create(&adminUser).Error; err != nil {
			log.Fatalf("Failed to seed admin user: %v", err)
		}

		log.Println("Admin account successfully created!")
	}


	// Seed assets
	// SeedAssets(db)
}
