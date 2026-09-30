package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
)

type MaintenanceService interface {
	CreateMaintenance(technicianID string, technicianName string, input *domain.CreateMaintenanceInput) (*domain.Maintenance, error)
	CreateBulkMaintenance(technicianID string, technicianName string, input *domain.CreateBulkMaintenanceInput) ([]*domain.Maintenance, error)
	GetMaintenances(options *domain.MaintenanceQueryOptions) (*domain.PaginatedResponse, error)
	UpdateMaintenanceStatus(id string, userID string, userRole string, input *domain.UpdateMaintenanceStatusInput) (*domain.Maintenance, error)
	UpdateMaintenanceDetails(id string, userID string, userRole string, input *domain.UpdateMaintenanceDetailsInput) (*domain.Maintenance, error)
	ConfirmPayment(maintenanceIDs []string, adminID string, adminName string) error
}

type maintenanceService struct {
	maintenanceRepo repositories.MaintenanceRepository
	assetRepo       domain.AssetRepository
	userRepo        repositories.UserRepository
	auditRepo       domain.AuditRepository
	waService       WhatsAppService
	notifService    NotificationService
	invoiceService  InvoiceService
	storageService  StorageService
}

func NewMaintenanceService(
	maintenanceRepo repositories.MaintenanceRepository,
	assetRepo domain.AssetRepository,
	userRepo repositories.UserRepository,
	auditRepo domain.AuditRepository,
	waService WhatsAppService,
	notifService NotificationService,
	invoiceService InvoiceService,
	storageService StorageService,
) MaintenanceService {
	return &maintenanceService{maintenanceRepo, assetRepo, userRepo, auditRepo, waService, notifService, invoiceService, storageService}
}

func (s *maintenanceService) generateID() (string, error) {
	year := time.Now().Format("06")
	lastID, err := s.maintenanceRepo.GetLastID()
	if err != nil {
		return "", err
	}

	seq := 1
	if lastID != "" {
		num, err := strconv.Atoi(lastID)
		if err == nil {
			seq = num + 1
		}
	}
	return fmt.Sprintf("MNT-%s-%04d", year, seq), nil
}

func (s *maintenanceService) CreateMaintenance(technicianID string, technicianName string, input *domain.CreateMaintenanceInput) (*domain.Maintenance, error) {
	// Validate type
	validTypes := map[string]bool{"Rutin": true, "Perbaikan": true, "Kalibrasi": true}
	if !validTypes[input.Type] {
		return nil, errors.New("tipe maintenance tidak valid (Rutin | Perbaikan | Kalibrasi)")
	}

	// Get asset info
	asset, err := s.assetRepo.FindByID(input.AssetID)
	if err != nil {
		return nil, err
	}
	if asset == nil {
		return nil, errors.New("aset tidak ditemukan")
	}
	if asset.Status != "Tersedia" {
		return nil, errors.New("aset tidak tersedia untuk maintenance")
	}

	id, err := s.generateID()
	if err != nil {
		return nil, err
	}

	m := &domain.Maintenance{
		ID:             id,
		AssetID:        input.AssetID,
		AssetName:      asset.Name,
		TechnicianID:   technicianID,
		TechnicianName: technicianName,
		Type:           input.Type,
		Status:         "Dijadwalkan",
		ScheduledDate:  input.ScheduledDate,
		Notes:          input.Notes,
		EstimatedCost:  input.EstimatedCost,
	}

	asset.Status = "Maintenance"

	if err := s.maintenanceRepo.Create(m, asset); err != nil {
		return nil, err
	}

	if s.auditRepo != nil {
		newPayload, _ := json.Marshal(m)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "CREATE_MAINTENANCE",
			EntityName: "Maintenance",
			EntityID:   m.ID,
			OldPayload: "null",
			NewPayload: string(newPayload),
			ChangedBy:  technicianName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	// Send Notification to Admins
	adminMsg := fmt.Sprintf("Terdapat jadwal maintenance baru untuk aset %s (Tipe: %s, Jadwal: %s).", asset.Name, input.Type, input.ScheduledDate)
	_ = s.notifService.CreateNotificationForRole("Administrator", "Jadwal Maintenance Baru", adminMsg, "maintenance")

	admins, _ := s.userRepo.FindByRole("Administrator")
	for _, admin := range admins {
		if admin.Phone != "" {
			waMsg := fmt.Sprintf("Halo %s, terdapat jadwal maintenance baru:\n\nTeknisi: %s\nAset: %s\nTipe: %s\nJadwal: %s\n\nSilakan cek di sistem SAIMS.", admin.Name, technicianName, asset.Name, input.Type, input.ScheduledDate)
			go s.waService.SendMessage(admin.Phone, waMsg)
		}
	}

	// Send Notification to Technician (if available)
	if technicianID != "" {
		techMsg := fmt.Sprintf("Anda dijadwalkan untuk maintenance aset %s pada %s.", asset.Name, input.ScheduledDate)
		_ = s.notifService.CreateNotificationForUser(technicianID, "Tugas Maintenance", techMsg, "maintenance")

		tech, _ := s.userRepo.FindByID(technicianID)
		if tech != nil && tech.Phone != "" {
			waMsg := fmt.Sprintf("Halo %s, Anda telah dijadwalkan untuk maintenance:\n\nAset: %s\nTipe: %s\nJadwal: %s\nCatatan: %s", tech.Name, asset.Name, input.Type, input.ScheduledDate, input.Notes)
			go s.waService.SendMessage(tech.Phone, waMsg)
		}
	}

	return m, nil
}

func (s *maintenanceService) GetMaintenances(options *domain.MaintenanceQueryOptions) (*domain.PaginatedResponse, error) {
	if options.Page <= 0 {
		options.Page = 1
	}
	if options.Limit == 0 {
		options.Limit = 10
	}

	records, total, err := s.maintenanceRepo.FindAll(options)
	if err != nil {
		return nil, err
	}

	totalPages := 1
	if options.Limit > 0 {
		totalPages = int((total + int64(options.Limit) - 1) / int64(options.Limit))
	}

	return &domain.PaginatedResponse{
		Data:       records,
		Total:      total,
		Page:       options.Page,
		Limit:      options.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *maintenanceService) UpdateMaintenanceStatus(id string, userID string, userRole string, input *domain.UpdateMaintenanceStatusInput) (*domain.Maintenance, error) {
	// Validate status
	validStatuses := map[string]bool{"Dijadwalkan": true, "Sedang Berjalan": true, "Selesai": true}
	if !validStatuses[input.Status] {
		return nil, errors.New("status tidak valid (Dijadwalkan | Sedang Berjalan | Selesai)")
	}

	m, err := s.maintenanceRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("maintenance record tidak ditemukan")
	}

	asset, err := s.assetRepo.FindByID(m.AssetID)
	if err != nil {
		return nil, err
	}
	if asset == nil {
		return nil, errors.New("aset tidak ditemukan")
	}

	oldStatus := m.Status
	oldEstimatedCost := m.EstimatedCost
	var oldActualCost *float64
	if m.ActualCost != nil {
		val := *m.ActualCost
		oldActualCost = &val
	}
	oldNotes := m.Notes

	m.Status = input.Status

	if input.Status == "Sedang Berjalan" && oldStatus != "Sedang Berjalan" {
		m.ActualStartDate = time.Now().Format("2006-01-02 15:04:05")
	}

	if input.Notes != "" {
		m.Notes = input.Notes
	}
	if input.ActualCost > 0 {
		val := input.ActualCost
		m.ActualCost = &val
	}
	if input.CompletedDate != "" {
		m.CompletedDate = input.CompletedDate
	} else if input.Status == "Selesai" {
		m.CompletedDate = time.Now().Format("2006-01-02 15:04:05")
		asset.Status = "Tersedia"

		if input.AssetCondition == "Baik" || input.AssetCondition == "Rusak Ringan" || input.AssetCondition == "Rusak Berat" {
			asset.Condition = input.AssetCondition
		}
	}

	if err := s.maintenanceRepo.UpdateStatus(m, asset); err != nil {
		return nil, err
	}

	// Create Audit Trail
	if s.auditRepo != nil {
		oldValues, _ := json.Marshal(map[string]interface{}{
			"status":         oldStatus,
			"estimated_cost": oldEstimatedCost,
			"actual_cost":    oldActualCost,
			"notes":          oldNotes,
		})
		newValues, _ := json.Marshal(map[string]interface{}{
			"status":         m.Status,
			"estimated_cost": m.EstimatedCost,
			"actual_cost":    m.ActualCost,
			"notes":          m.Notes,
		})

		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_STATUS_" + m.Status,
			EntityName: "Maintenance",
			EntityID:   m.ID,
			OldPayload: string(oldValues),
			NewPayload: string(newValues),
			ChangedBy:  m.TechnicianName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	// Notify Admin for ANY status update
	adminMsg := fmt.Sprintf("Status maintenance aset %s berubah menjadi '%s' (Teknisi: %s).", asset.Name, input.Status, m.TechnicianName)
	_ = s.notifService.CreateNotificationForRole("Administrator", "Update Status Maintenance", adminMsg, "maintenance")

	admins, _ := s.userRepo.FindByRole("Administrator")
	for _, admin := range admins {
		if admin.Phone != "" {
			waMsg := fmt.Sprintf("Halo %s, status maintenance untuk aset %s telah diperbarui menjadi '%s' oleh %s.", admin.Name, asset.Name, input.Status, m.TechnicianName)
			go s.waService.SendMessage(admin.Phone, waMsg)
		}
	}

	return m, nil
}

func (s *maintenanceService) UpdateMaintenanceDetails(id string, userID string, userRole string, input *domain.UpdateMaintenanceDetailsInput) (*domain.Maintenance, error) {
	validTypes := map[string]bool{"Rutin": true, "Perbaikan": true, "Kalibrasi": true}
	if !validTypes[input.Type] {
		return nil, errors.New("tipe maintenance tidak valid (Rutin | Perbaikan | Kalibrasi)")
	}

	m, err := s.maintenanceRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, errors.New("maintenance record tidak ditemukan")
	}

	if userRole != "Administrator" {
		return nil, errors.New("anda tidak memiliki akses untuk mengedit maintenance ini")
	}

	if m.Status != "Dijadwalkan" {
		return nil, errors.New("jadwal maintenance hanya dapat diedit sebelum pekerjaan dimulai")
	}

	// Keep record for audit purposes
	oldMaintenanceJSON, _ := json.Marshal(m)

	m.Type = input.Type
	m.ScheduledDate = input.ScheduledDate
	m.EstimatedCost = input.EstimatedCost
	m.Notes = input.Notes
	m.IsEdited = true
	m.UpdatedAt = time.Now()

	if err := s.maintenanceRepo.Update(m); err != nil {
		return nil, err
	}

	if s.auditRepo != nil {
		newMaintenanceJSON, _ := json.Marshal(m)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_MAINTENANCE",
			EntityName: "Maintenance",
			EntityID:   id,
			OldPayload: string(oldMaintenanceJSON),
			NewPayload: string(newMaintenanceJSON),
			ChangedBy:  userID,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	// Notify Admins
	adminMsg := fmt.Sprintf("Detail maintenance %s telah diedit oleh Teknisi %s.", id, m.TechnicianName)
	_ = s.notifService.CreateNotificationForRole("Administrator", "Maintenance Diedit", adminMsg, "maintenance")

	admins, _ := s.userRepo.FindByRole("Administrator")
	for _, admin := range admins {
		if admin.Phone != "" {
			waMsg := fmt.Sprintf("Halo %s, detail maintenance %s untuk aset %s telah diedit oleh Teknisi %s.\nSilakan cek perubahan di sistem SAIMS.", admin.Name, id, m.AssetName, m.TechnicianName)
			go s.waService.SendMessage(admin.Phone, waMsg)
		}
	}

	return m, nil
}

func (s *maintenanceService) CreateBulkMaintenance(technicianID string, technicianName string, input *domain.CreateBulkMaintenanceInput) ([]*domain.Maintenance, error) {
	var records []*domain.Maintenance

	validTypes := map[string]bool{"Rutin": true, "Perbaikan": true, "Kalibrasi": true}
	if !validTypes[input.Type] {
		return nil, errors.New("tipe maintenance tidak valid")
	}

	year := time.Now().Format("06")
	lastID, err := s.maintenanceRepo.GetLastID()
	if err != nil {
		return nil, err
	}

	seq := 1
	if lastID != "" {
		if num, err := strconv.Atoi(lastID); err == nil {
			seq = num + 1
		}
	}

	for _, assetID := range input.AssetIDs {
		asset, err := s.assetRepo.FindByID(assetID)
		if err != nil {
			return nil, fmt.Errorf("aset dengan ID %s tidak ditemukan", assetID)
		}

		newID := fmt.Sprintf("MNT-%s-%04d", year, seq)
		seq++

		record := &domain.Maintenance{
			ID:             newID,
			AssetID:        assetID,
			AssetName:      asset.Name,
			TechnicianID:   technicianID,
			TechnicianName: technicianName,
			ScheduledDate:  input.ScheduledDate,
			Type:           input.Type,
			Status:         "Dijadwalkan",
			PaymentStatus:  "Menunggu Pembayaran",
			EstimatedCost:  input.EstimatedCost,
			Notes:          input.Notes,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		records = append(records, record)
	}

	// Use GORM transaction tx.CreateInBatches as required by project rule
	err = s.maintenanceRepo.CreateBulk(records)
	if err != nil {
		return nil, err
	}

	for _, record := range records {
		asset, err := s.assetRepo.FindByID(record.AssetID)
		if err == nil {
			asset.Status = "Maintenance"
			_ = s.assetRepo.Update(asset)
		}

		if s.auditRepo != nil {
			newPayload, _ := json.Marshal(record)
			_ = s.auditRepo.Create(&domain.AuditLog{
				Action:     "CREATE_MAINTENANCE",
				EntityName: "Maintenance",
				EntityID:   record.ID,
				OldPayload: "null",
				NewPayload: string(newPayload),
				ChangedBy:  technicianName,
			})
		}
	}

	// Send Notification to Admins
	adminMsg := fmt.Sprintf("Terdapat %d jadwal maintenance baru secara bulk (Tipe: %s, Jadwal: %s).", len(records), input.Type, input.ScheduledDate)
	_ = s.notifService.CreateNotificationForRole("Administrator", "Jadwal Maintenance Baru", adminMsg, "maintenance")

	admins, _ := s.userRepo.FindByRole("Administrator")
	for _, admin := range admins {
		if admin.Phone != "" {
			waMsg := fmt.Sprintf("Halo %s, terdapat %d jadwal maintenance baru:\n\nTeknisi: %s\nTipe: %s\nJadwal: %s\n\nSilakan cek di sistem SAIMS.", admin.Name, len(records), technicianName, input.Type, input.ScheduledDate)
			go s.waService.SendMessage(admin.Phone, waMsg)
		}
	}

	// Send Notification to Technician (if available)
	if technicianID != "" {
		techMsg := fmt.Sprintf("Anda dijadwalkan untuk %d maintenance aset pada %s.", len(records), input.ScheduledDate)
		_ = s.notifService.CreateNotificationForUser(technicianID, "Tugas Maintenance", techMsg, "maintenance")

		tech, _ := s.userRepo.FindByID(technicianID)
		if tech != nil && tech.Phone != "" {
			var assetNames string
			for i, r := range records {
				if i > 0 {
					assetNames += ", "
				}
				assetNames += r.AssetName
			}
			waMsg := fmt.Sprintf("Halo %s, Anda telah dijadwalkan untuk %d maintenance:\n\nAset: %s\nTipe: %s\nJadwal: %s\nCatatan: %s", tech.Name, len(records), assetNames, input.Type, input.ScheduledDate, input.Notes)
			go s.waService.SendMessage(tech.Phone, waMsg)
		}
	}

	return records, nil
}

func (s *maintenanceService) ConfirmPayment(maintenanceIDs []string, adminID string, adminName string) error {
	var maintenances []*domain.Maintenance
	var expectedTechID string

	for _, id := range maintenanceIDs {
		m, err := s.maintenanceRepo.FindByID(id)
		if err != nil {
			return err
		}
		if m != nil && m.PaymentStatus != "Lunas" {
			if expectedTechID == "" {
				expectedTechID = m.TechnicianID
			} else if expectedTechID != m.TechnicianID {
				return errors.New("seluruh data yang dipilih harus berasal dari teknisi yang sama")
			}
			maintenances = append(maintenances, m)
		}
	}

	if len(maintenances) == 0 {
		return errors.New("tidak ada maintenance yang valid untuk dibayar")
	}

	pdfBuf, err := s.invoiceService.GenerateInvoicePDF(maintenances, adminName)
	if err != nil {
		return fmt.Errorf("failed to generate invoice: %w", err)
	}

	ctx := context.Background()
	fileName := fmt.Sprintf("invoices/INV-%d-%s.pdf", time.Now().Unix(), adminID)

	bucketName := os.Getenv("MINIO_BUCKET")
	if bucketName == "" {
		bucketName = "inventory-assets"
	}
	err = s.storageService.UploadFile(ctx, bucketName, fileName, pdfBuf, int64(pdfBuf.Len()), "application/pdf")
	if err != nil {
		return fmt.Errorf("failed to upload invoice: %w", err)
	}

	publicEndpoint := os.Getenv("MINIO_PUBLIC_ENDPOINT")
	if publicEndpoint == "" {
		publicEndpoint = "http://localhost:9000"
	}
	invoiceURL := fmt.Sprintf("%s/%s/%s", publicEndpoint, bucketName, fileName)

	for _, m := range maintenances {
		err = s.maintenanceRepo.UpdatePaymentStatusAndInvoice(m.ID, "Lunas", invoiceURL)
		if err != nil {
			// Log error but continue
			fmt.Printf("Failed to update payment status for %s: %v\n", m.ID, err)
		}
	}

	// Send notification to technician
	if expectedTechID != "" {
		payMsg := fmt.Sprintf("Pembayaran maintenance Anda (%d item) telah dikonfirmasi LUNAS oleh %s.", len(maintenances), adminName)
		_ = s.notifService.CreateNotificationForUser(expectedTechID, "Pembayaran Maintenance Lunas", payMsg, "payment")

		tech, _ := s.userRepo.FindByID(expectedTechID)
		if tech != nil && tech.Phone != "" {
			waMsg := fmt.Sprintf("Halo %s, pembayaran maintenance Anda untuk %d item telah dikonfirmasi LUNAS oleh Admin %s.\nInvoice URL: %s", tech.Name, len(maintenances), adminName, invoiceURL)
			go s.waService.SendMessage(tech.Phone, waMsg)
		}
	}

	// Send notification to Administrators
	adminMsg := fmt.Sprintf("Pembayaran maintenance untuk Teknisi (%d item) telah dikonfirmasi LUNAS oleh %s.", len(maintenances), adminName)
	_ = s.notifService.CreateNotificationForRole("Administrator", "Konfirmasi Pembayaran Lunas", adminMsg, "payment")

	return nil
}
