package main

import (
	"fmt"
	"log"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
	"saims-backend/internal/services"
	"gorm.io/gorm"
)

func SeedAssets(db *gorm.DB) {
	assetRepo := repositories.NewAssetRepository(db)
	borrowingRepo := repositories.NewBorrowingRepository(db)
	maintenanceRepo := repositories.NewMaintenanceRepository(db)
	assetImageRepo := repositories.NewAssetImageRepository(db)
	assetService := services.NewAssetService(assetRepo, borrowingRepo, maintenanceRepo, assetImageRepo, nil, nil, nil)

	dummyAssets := []domain.CreateAssetInput{
		{Name: "Laptop Dell XPS 13", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-01-10", SerialNumber: "SN-DEL-101", Description: "Laptop dev team"},
		{Name: "MacBook Pro M2 14 inch", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-02-15", SerialNumber: "SN-MAC-102", Description: "Laptop manager"},
		{Name: "Monitor LG 27 inch 4K", Category: "Elektronik", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-03-01", SerialNumber: "SN-LG-103", Description: "Monitor tambahan"},
		{Name: "Keyboard Mechanical Keychron K2", Category: "IT", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-03-10", SerialNumber: "SN-KEY-104", Description: "Keyboard kantor"},
		{Name: "Mouse Logitech MX Master 3S", Category: "IT", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-03-12", SerialNumber: "SN-LOG-105", Description: "Mouse wireless"},
		{Name: "Proyektor Epson EB-X51", Category: "Elektronik", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-11-20", SerialNumber: "SN-EPS-106", Description: "Ruang meeting utama"},
		{Name: "Printer HP LaserJet Pro", Category: "Elektronik", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-12-05", SerialNumber: "SN-HP-107", Description: "Printer HR"},
		{Name: "Laptop ThinkPad T14", Category: "IT", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-01-22", SerialNumber: "SN-THP-108", Description: "Laptop sales"},
		{Name: "Router Mikrotik RB750Gr3", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-05-15", SerialNumber: "SN-MIK-109", Description: "Router utama lantai 2"},
		{Name: "Switch Cisco Catalyst 2960", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-06-10", SerialNumber: "SN-CIS-110", Description: "Switch server"},
		{Name: "TV Samsung 55 inch Smart TV", Category: "Elektronik", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-02-28", SerialNumber: "SN-SAM-111", Description: "Lobby area"},
		{Name: "AC Daikin 1.5 PK", Category: "Elektronik", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2023-08-11", SerialNumber: "SN-DAI-112", Description: "Ruang server"},
		{Name: "Meja Kerja Olympic", Category: "Furnitur", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2023-09-01", SerialNumber: "-", Description: "Meja staff"},
		{Name: "Kursi Ergonomis Ergotec", Category: "Furnitur", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2023-09-05", SerialNumber: "-", Description: "Kursi staff"},
		{Name: "Mesin Fotocopy Canon IR-2006", Category: "Elektronik", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-10-10", SerialNumber: "SN-CAN-115", Description: "Area print lt 1"},
		{Name: "MacBook Air M1", Category: "IT", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-11-12", SerialNumber: "SN-MAC-116", Description: "Laptop design"},
		{Name: "Tablet iPad Pro 11", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-04-01", SerialNumber: "SN-IPA-117", Description: "Tablet direksi"},
		{Name: "Smartphone Samsung S23 Ultra", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-04-05", SerialNumber: "SN-SAM-118", Description: "Ponsel operasional"},
		{Name: "Kamera DSLR Canon EOS 90D", Category: "Elektronik", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-07-20", SerialNumber: "SN-CAN-119", Description: "Tim media"},
		{Name: "Tripod Takara", Category: "Elektronik", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-07-22", SerialNumber: "SN-TAK-120", Description: "Tim media"},
		{Name: "Laptop ASUS ROG Zephyrus", Category: "IT", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-05-10", SerialNumber: "SN-ASU-121", Description: "Laptop video editor"},
		{Name: "Headset Jabra Evolve 20", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-05-15", SerialNumber: "SN-JAB-122", Description: "CS team"},
		{Name: "Webcam Logitech C920", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2025-05-16", SerialNumber: "SN-LOG-123", Description: "Webcam meeting"},
		{Name: "UPS APC Smart-UPS 1500VA", Category: "Elektronik", Location: "Bandarlampung", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-03-30", SerialNumber: "SN-APC-124", Description: "Backup server"},
		{Name: "Server Dell PowerEdge R740", Category: "IT", Location: "Jakarta", Status: "Tersedia", Condition: "Baik", PurchaseDate: "2024-01-10", SerialNumber: "SN-DEL-125", Description: "Main server app"},
	}

	count := 0
	for _, a := range dummyAssets {
		_, err := assetService.CreateAsset(&a, "System", "System")
		if err != nil {
			log.Printf("Failed to create asset %s: %v", a.Name, err)
		} else {
			count++
		}
	}

	fmt.Printf("Successfully seeded %d assets!\n", count)
}
