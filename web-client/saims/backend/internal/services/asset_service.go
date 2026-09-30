package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
	"saims-backend/pkg/utils"
)

type assetService struct {
	repo              domain.AssetRepository
	borrowingRepo     domain.BorrowingRepository
	maintRepo         repositories.MaintenanceRepository
	imageRepo         domain.AssetImageRepository
	storageSvc        StorageService
	auditRepo         domain.AuditRepository
	assetDeletionRepo domain.AssetDeletionRequestRepository
}

// NewAssetService creates a new instance of AssetService
func NewAssetService(
	repo domain.AssetRepository,
	borrowingRepo domain.BorrowingRepository,
	maintRepo repositories.MaintenanceRepository,
	imageRepo domain.AssetImageRepository,
	storageSvc StorageService,
	auditRepo domain.AuditRepository,
	assetDeletionRepo domain.AssetDeletionRequestRepository,
) domain.AssetService {
	return &assetService{
		repo:              repo,
		borrowingRepo:     borrowingRepo,
		maintRepo:         maintRepo,
		imageRepo:         imageRepo,
		storageSvc:        storageSvc,
		auditRepo:         auditRepo,
		assetDeletionRepo: assetDeletionRepo,
	}
}

// Helper to get prefix for Location
func getLocationPrefix(location string) (string, error) {
	locUpper := strings.ToUpper(location)
	switch locUpper {
	case "JAKARTA":
		return "JKT", nil
	case "BANDARLAMPUNG":
		return "BDL", nil
	default:
		return "", errors.New("lokasi harus Jakarta atau Bandarlampung")
	}
}

// Helper to get prefix for Category
func getCategoryPrefix(category string) string {
	catUpper := strings.ToUpper(category)
	switch catUpper {
	case "IT":
		return "IT"
	case "ELEKTRONIK":
		return "ELK"
	case "FURNITUR", "FURNITURE":
		return "FURN"
	case "KENDARAAN":
		return "KND"
	default:
		if len(catUpper) >= 3 {
			return catUpper[:3]
		}
		return catUpper
	}
}

// generateAssetID generates ID like JKT-IT-26-0001
func (s *assetService) generateAssetID(location, category string) (string, error) {
	locPrefix, err := getLocationPrefix(location)
	if err != nil {
		return "", err
	}
	catPrefix := getCategoryPrefix(category)
	year := time.Now().Format("06") // "26" for 2026

	prefix := fmt.Sprintf("%s-%s-%s-", locPrefix, catPrefix, year)

	lastID, err := s.repo.GetLastIDByPrefix(prefix)
	if err != nil {
		return "", err
	}

	var newSeq int = 1
	if lastID != "" {
		// Extract the last 4 digits
		parts := strings.Split(lastID, "-")
		if len(parts) == 4 {
			seqStr := parts[3]
			seq, err := strconv.Atoi(seqStr)
			if err == nil {
				newSeq = seq + 1
			}
		}
	}

	return fmt.Sprintf("%s%04d", prefix, newSeq), nil
}

func (s *assetService) CreateAsset(input *domain.CreateAssetInput, actorID, actorName string) (*domain.Asset, error) {
	id, err := s.generateAssetID(input.Location, input.Category)
	if err != nil {
		return nil, errors.New("failed to generate asset ID: " + err.Error())
	}

	var purchaseDate *string
	if input.PurchaseDate != "" {
		purchaseDate = &input.PurchaseDate
	}

	var serialNumber *string
	if input.SerialNumber != "" {
		serialNumber = &input.SerialNumber
	}

	asset := &domain.Asset{
		ID:           id,
		Name:         input.Name,
		Category:     input.Category,
		Location:     input.Location,
		Status:       input.Status,
		Condition:    input.Condition,
		PurchaseDate: purchaseDate,
		SerialNumber: serialNumber,
		QRCode:       "SAIMS-" + id,
		Description:  input.Description,
	}

	err = s.repo.Create(asset)
	if err != nil {
		return nil, err
	}
	
	if s.auditRepo != nil {
		newPayload, _ := json.Marshal(asset)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "CREATE_ASSET",
			EntityName: "Asset",
			EntityID:   id,
			OldPayload: "null",
			NewPayload: string(newPayload),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	return asset, nil
}

func (s *assetService) CreateBulkAssets(input *domain.CreateBulkAssetsInput, actorID, actorName string) ([]*domain.Asset, error) {
	locPrefix, err := getLocationPrefix(input.Location)
	if err != nil {
		return nil, errors.New("failed to generate asset ID: " + err.Error())
	}
	catPrefix := getCategoryPrefix(input.Category)
	year := time.Now().Format("06") // "26" for 2026
	prefix := fmt.Sprintf("%s-%s-%s-", locPrefix, catPrefix, year)

	lastID, err := s.repo.GetLastIDByPrefix(prefix)
	if err != nil {
		return nil, err
	}

	var startSeq int = 1
	if lastID != "" {
		parts := strings.Split(lastID, "-")
		if len(parts) == 4 {
			seqStr := parts[3]
			seq, err := strconv.Atoi(seqStr)
			if err == nil {
				startSeq = seq + 1
			}
		}
	}

	var createdAssets []*domain.Asset
	for i, item := range input.Items {
		id := fmt.Sprintf("%s%04d", prefix, startSeq+i)
		status := item.Status
		if status == "" {
			status = "Tersedia"
		}
		var purchaseDate *string
		if input.PurchaseDate != "" {
			purchaseDate = &input.PurchaseDate
		}

		var serialNumber *string
		if item.SerialNumber != "" {
			serialNumber = &item.SerialNumber
		}

		asset := &domain.Asset{
			ID:           id,
			Name:         input.Name,
			Category:     input.Category,
			Location:     input.Location,
			Status:       status,
			Condition:    item.Condition,
			PurchaseDate: purchaseDate,
			SerialNumber: serialNumber,
			QRCode:       "SAIMS-" + id,
			Description:  input.Description,
		}

		err = s.repo.Create(asset)
		if err != nil {
			return nil, err
		}
		
		if s.auditRepo != nil {
			newPayload, _ := json.Marshal(asset)
			if errAudit := s.auditRepo.Create(&domain.AuditLog{
				Action:     "CREATE_ASSET",
				EntityName: "Asset",
				EntityID:   id,
				OldPayload: "null",
				NewPayload: string(newPayload),
				ChangedBy:  actorName,
			}); errAudit != nil {
				return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
			}
		}
		createdAssets = append(createdAssets, asset)
	}

	return createdAssets, nil
}

func (s *assetService) GetAssets(options *domain.AssetQueryOptions) (*domain.PaginatedResponse, error) {
	// Set default values if not provided
	if options.Page <= 0 {
		options.Page = 1
	}
	if options.Limit <= 0 {
		options.Limit = 10
	}

	assets, total, err := s.repo.FindAll(options)
	if err != nil {
		return nil, err
	}

	if s.assetDeletionRepo != nil {
		pendingDeletions, err := s.assetDeletionRepo.FindAll("Pending")
		if err == nil && len(pendingDeletions) > 0 {
			pendingMap := make(map[string]bool)
			for _, pd := range pendingDeletions {
				pendingMap[pd.AssetID] = true
			}
			for i := range assets {
				if pendingMap[assets[i].ID] {
					assets[i].HasPendingDeletion = true
				}
			}
		}
	}

	totalPages := int((total + int64(options.Limit) - 1) / int64(options.Limit))

	return &domain.PaginatedResponse{
		Data:       assets,
		Total:      total,
		Page:       options.Page,
		Limit:      options.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *assetService) GetAssetByID(id string) (*domain.Asset, error) {
	asset, err := s.repo.FindByID(id)
	if err != nil || asset == nil {
		return asset, err
	}
	if s.assetDeletionRepo != nil {
		pendingDeletions, err := s.assetDeletionRepo.FindAll("Pending")
		if err == nil {
			for _, pd := range pendingDeletions {
				if pd.AssetID == asset.ID {
					asset.HasPendingDeletion = true
					break
				}
			}
		}
	}
	return asset, nil
}

func (s *assetService) UpdateAsset(id string, input *domain.UpdateAssetInput, actorID, actorName string) (*domain.Asset, error) {
	asset, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	
	oldAssetJSON, _ := json.Marshal(asset)

	// Update fields if provided (basic simple update strategy)
	if input.Name != "" {
		asset.Name = input.Name
	}
	if input.Category != "" {
		asset.Category = input.Category
	}
	if input.Location != "" {
		// Validasi lokasi strict
		_, errLoc := getLocationPrefix(input.Location)
		if errLoc != nil {
			return nil, errLoc
		}
		asset.Location = input.Location
	}
	if input.Status != "" {
		asset.Status = input.Status
	}
	if input.Condition != "" {
		asset.Condition = input.Condition
	}
	if input.PurchaseDate != nil {
		if *input.PurchaseDate == "" {
			asset.PurchaseDate = nil
		} else {
			asset.PurchaseDate = input.PurchaseDate
		}
	}
	if input.SerialNumber != nil {
		if *input.SerialNumber == "" {
			asset.SerialNumber = nil
		} else {
			asset.SerialNumber = input.SerialNumber
		}
	}
	// Description might be explicitly cleared, but checking empty is simpler here
	asset.Description = input.Description

	err = s.repo.Update(asset)
	if err != nil {
		return nil, err
	}
	
	if s.auditRepo != nil {
		newAssetJSON, _ := json.Marshal(asset)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_ASSET",
			EntityName: "Asset",
			EntityID:   id,
			OldPayload: string(oldAssetJSON),
			NewPayload: string(newAssetJSON),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	return asset, nil
}

func (s *assetService) DeleteAsset(id string, actorID, actorName string) error {
	asset, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	// 1. Validasi peminjaman aktif
	isActivelyBorrowed, err := s.borrowingRepo.IsAssetActivelyBorrowed(id)
	if err != nil {
		return err
	}
	if isActivelyBorrowed {
		return errors.New("aset tidak bisa dihapus karena sedang dipinjam")
	}

	// 2. Validasi maintenance aktif
	isActivelyMaintained, err := s.maintRepo.IsAssetInActiveMaintenance(id)
	if err != nil {
		return err
	}
	if isActivelyMaintained {
		return errors.New("aset tidak bisa dihapus karena sedang dalam masa maintenance")
	}

	// 3. Auto-reject pending borrowings
	pendingBorrowings, err := s.borrowingRepo.FindPendingByAssetID(id)
	if err != nil {
		return err
	}
	for _, pb := range pendingBorrowings {
		pb.Status = "Rejected"
		pb.RejectionReason = "Aset telah dihapus dari sistem"
		err = s.borrowingRepo.UpdateStatus(&pb, nil)
		if err != nil {
			return err
		}
	}

	// 4. Soft Delete gambar aset dari Database (Jangan hapus dari MinIO dulu untuk Recycle Bin)
	images, err := s.imageRepo.FindByAssetID(id)
	if err == nil {
		for _, img := range images {
			_ = s.imageRepo.Delete(img.ID)
		}
	}

	err = s.repo.Delete(id)
	if err != nil {
		if utils.IsForeignKeyViolation(err) {
			return errors.New("aset tidak bisa dihapus karena memiliki riwayat transaksi peminjaman atau perawatan")
		}
		return err
	}
	
	if s.auditRepo != nil {
		oldPayload, _ := json.Marshal(asset)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "DELETE_ASSET",
			EntityName: "Asset",
			EntityID:   id,
			OldPayload: string(oldPayload),
			NewPayload: "null",
			ChangedBy:  actorName,
		}); errAudit != nil {
			return fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	return nil
}

func (s *assetService) GetDeletedAssets(options *domain.AssetQueryOptions) (*domain.PaginatedResponse, error) {
	if options.Page <= 0 {
		options.Page = 1
	}
	if options.Limit <= 0 {
		options.Limit = 10
	}

	assets, total, err := s.repo.FindDeleted(options)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(options.Limit) - 1) / int64(options.Limit))

	return &domain.PaginatedResponse{
		Data:       assets,
		Total:      total,
		Page:       options.Page,
		Limit:      options.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *assetService) RestoreAsset(id string, actorID, actorName string) error {
	err := s.repo.Restore(id)
	if err != nil {
		return err
	}

	// Restore images
	images, err := s.imageRepo.FindDeletedByAssetID(id)
	if err == nil {
		for _, img := range images {
			_ = s.imageRepo.Restore(img.ID)
		}
	}

	if s.auditRepo != nil {
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "RESTORE_ASSET",
			EntityName: "Asset",
			EntityID:   id,
			OldPayload: "null",
			NewPayload: "{\"status\":\"restored\"}",
			ChangedBy:  actorName,
		}); errAudit != nil {
			return fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	return nil
}
