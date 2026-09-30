package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"saims-backend/internal/domain"
)

// GetEnv is a utility to read an environment or return a default value
func GetEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// ConnectDatabase initializes the database connection using GORM
func ConnectDatabase() (*gorm.DB, error) {
	host := GetEnv("DB_HOST", "localhost")
	user := GetEnv("DB_USER", "postgres")
	password := GetEnv("DB_PASSWORD", "")	
	dbname := GetEnv("DB_NAME", "saims_db")
	port := GetEnv("DB_PORT", "5432")
	sslmode := GetEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s application_name=saims_app",
		host, user, password, dbname, port, sslmode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Run AutoMigrate to initialize schema on startup
	log.Println("[MIGRATION] Running AutoMigrate to initialize schema...")
	if err := db.AutoMigrate(
		&domain.User{},
		&domain.Asset{},
		&domain.AssetImage{},
		&domain.Borrowing{},
		&domain.Maintenance{},
		&domain.AuditLog{},
		&domain.Notification{},
		&domain.AssetDeletionRequest{},
		&domain.JWTBlacklist{},
	); err != nil {
		log.Printf("[MIGRATION] AutoMigrate error: %v", err)
	}
	log.Println("[MIGRATION] AutoMigrate completed")

	// Drop avatar column if it exists in users table
	if db.Migrator().HasColumn(&domain.User{}, "avatar") {
		log.Println("Dropping avatar column from users table...")
		if err := db.Migrator().DropColumn(&domain.User{}, "avatar"); err != nil {
			log.Printf("Failed to drop avatar column: %v", err)
		}
	}

	// Fix maintenances.id: was uuid, should be varchar(50) for custom IDs like MNT-26-0001
	if db.Migrator().HasTable(&domain.Maintenance{}) {
		var colType string
		db.Raw("SELECT data_type FROM information_schema.columns WHERE table_name = 'maintenances' AND column_name = 'id'").Scan(&colType)
		if colType == "uuid" {
			log.Println("[MIGRATION] maintenances.id is uuid, converting to varchar(50)...")
			if res := db.Exec("ALTER TABLE maintenances ALTER COLUMN id DROP DEFAULT"); res.Error != nil {
				log.Printf("[MIGRATION] DROP DEFAULT warning (ignorable): %v", res.Error)
			}
			if res := db.Exec("ALTER TABLE maintenances ALTER COLUMN id TYPE varchar(50) USING id::text"); res.Error != nil {
				log.Printf("[MIGRATION] ALTER COLUMN error: %v", res.Error)
			} else {
				log.Println("[MIGRATION] maintenances.id successfully converted to varchar(50)")
			}
		}
	}

	log.Println("Database connection established successfully")
	
	// Run status reconciliation audit
	reconcileAssetStatuses(db)

	return db, nil
}

func reconcileAssetStatuses(db *gorm.DB) {
	log.Println("[AUDIT] Running asset status reconciliation...")

	// 1. Reconcile assets in 'Maintenance' status
	var maintenanceAssets []domain.Asset
	err := db.Model(&domain.Asset{}).
		Where("status = ? AND id NOT IN (SELECT asset_id FROM maintenances WHERE status IN ?)", 
			"Maintenance", []string{"Dijadwalkan", "Sedang Berjalan"}).
		Find(&maintenanceAssets).Error

	if err != nil {
		log.Printf("[AUDIT] Error querying maintenance assets: %v", err)
	} else if len(maintenanceAssets) > 0 {
		for _, asset := range maintenanceAssets {
			log.Printf("[AUDIT] Correcting Asset status: ID=%s, Name=%s (status changed from Maintenance -> Tersedia)", asset.ID, asset.Name)
			if err := db.Model(&domain.Asset{}).Where("id = ?", asset.ID).Update("status", "Tersedia").Error; err != nil {
				log.Printf("[AUDIT] Failed to update asset %s: %v", asset.ID, err)
			}
		}
	}

	// 2. Reconcile assets in 'Dipinjam' status
	var borrowedAssets []domain.Asset
	err = db.Model(&domain.Asset{}).
		Where("status = ? AND id NOT IN (SELECT asset_id FROM borrowings WHERE status IN ?)", 
			"Dipinjam", []string{"Approved", "Menunggu_Kembali", "Return_Rejected"}).
		Find(&borrowedAssets).Error

	if err != nil {
		log.Printf("[AUDIT] Error querying borrowed assets: %v", err)
	} else if len(borrowedAssets) > 0 {
		for _, asset := range borrowedAssets {
			log.Printf("[AUDIT] Correcting Asset status: ID=%s, Name=%s (status changed from Dipinjam -> Tersedia)", asset.ID, asset.Name)
			if err := db.Model(&domain.Asset{}).Where("id = ?", asset.ID).Update("status", "Tersedia").Error; err != nil {
				log.Printf("[AUDIT] Failed to update asset %s: %v", asset.ID, err)
			}
		}
	}

	log.Println("[AUDIT] Asset status reconciliation completed.")
}
