package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"
)

type borrowingService struct {
	borrowingRepo     domain.BorrowingRepository
	assetRepo         domain.AssetRepository
	userRepo          repositories.UserRepository
	waService         WhatsAppService
	notifService      NotificationService
	auditRepo         domain.AuditRepository
	assetDeletionRepo domain.AssetDeletionRequestRepository
}

func NewBorrowingService(
	borrowingRepo domain.BorrowingRepository,
	assetRepo domain.AssetRepository,
	userRepo repositories.UserRepository,
	waService WhatsAppService,
	notifService NotificationService,
	auditRepo domain.AuditRepository,
	assetDeletionRepo domain.AssetDeletionRequestRepository,
) domain.BorrowingService {
	return &borrowingService{
		borrowingRepo:     borrowingRepo,
		assetRepo:         assetRepo,
		userRepo:          userRepo,
		waService:         waService,
		notifService:      notifService,
		auditRepo:         auditRepo,
		assetDeletionRepo: assetDeletionRepo,
	}
}

func (s *borrowingService) CreateBorrowing(userID string, userName string, input *domain.CreateBorrowingInput) ([]*domain.Borrowing, error) {
	// 1. Get User
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	var createdBorrowings []*domain.Borrowing
	var assetNames []string
	

	
	// Pre-validate all assets before saving any (Atomic behavior)
	var validAssets []*domain.Asset
	for _, assetID := range input.AssetIDs {
		asset, err := s.assetRepo.FindByID(assetID)
		if err != nil || asset == nil {
			return nil, fmt.Errorf("asset with ID %s not found", assetID)
		}
		if asset.Status != "Tersedia" {
			return nil, fmt.Errorf("aset %s tidak tersedia", asset.Name)
		}
		isActive, err := s.borrowingRepo.HasActiveBorrowing(assetID)
		if err != nil {
			return nil, err
		}
		if isActive {
			return nil, fmt.Errorf("aset %s sedang dalam peminjaman aktif", asset.Name)
		}
		if s.assetDeletionRepo != nil {
			pendingDeletions, err := s.assetDeletionRepo.FindAll("Pending")
			if err == nil {
				for _, pd := range pendingDeletions {
					if pd.AssetID == asset.ID {
						return nil, fmt.Errorf("aset %s sedang dalam pengajuan penghapusan dan tidak dapat dipinjam", asset.Name)
					}
				}
			}
		}
		validAssets = append(validAssets, asset)
	}

	now := time.Now()
	yymmdd := now.Format("060102")
	idPrefix := fmt.Sprintf("BRW-%s", yymmdd)

	// To avoid race conditions with seq generation during loop, we get the current count once.
	count, _ := s.borrowingRepo.CountByDatePrefix(idPrefix)
	
	userIdPart := userID
	if len(userID) > 4 {
		userIdPart = userID[:4]
	}

	// Prepare records
	for i, asset := range validAssets {
		seq := count + int64(i) + 1
		idStr := fmt.Sprintf("BRW-%s%02d-%s", yymmdd, seq, strings.ToUpper(userIdPart))

		borrowing := &domain.Borrowing{
			ID:              idStr,
			UserID:          userID,
			BorrowerName:    user.Name,
			AssetID:         asset.ID,
			AssetName:       asset.Name,
			StartDate:       input.StartDate,
			EndDate:         input.EndDate,
			Purpose:         input.Purpose,
			Status:          "Pending_Supervisor",
		}

		createdBorrowings = append(createdBorrowings, borrowing)
		assetNames = append(assetNames, asset.Name)
	}

	// Create records in a single database transaction
	err = s.borrowingRepo.CreateMultiple(createdBorrowings)
	if err != nil {
		return nil, err
	}
	
	if s.auditRepo != nil {
		for _, b := range createdBorrowings {
			newPayload, _ := json.Marshal(b)
			if errAudit := s.auditRepo.Create(&domain.AuditLog{
				Action:     "CREATE_BORROWING",
				EntityName: "Borrowing",
				EntityID:   b.ID,
				OldPayload: "null",
				NewPayload: string(newPayload),
				ChangedBy:  userName,
			}); errAudit != nil {
				return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
			}
		}
	}

	// Send Notification to Supervisors & Administrators
	joinedAssets := strings.Join(assetNames, ", ")
	msg := fmt.Sprintf("Permintaan peminjaman baru dari %s untuk aset: %s. Tujuan: %s", user.Name, joinedAssets, input.Purpose)
	_ = s.notifService.CreateNotificationForRole("Supervisor", "Peminjaman Baru (Multi)", msg, "borrowing")
	_ = s.notifService.CreateNotificationForRole("Administrator", "Peminjaman Baru (Multi)", msg, "borrowing")
	
	notifyRoles := []string{"Supervisor", "Administrator"}
	for _, role := range notifyRoles {
		usersByRole, _ := s.userRepo.FindByRole(role)
		for _, u := range usersByRole {
			if u.Phone != "" {
				waMsg := fmt.Sprintf("Halo %s, terdapat permintaan peminjaman baru:\n\nPeminjam: %s\nAset: %s\nTujuan: %s\n\nSilakan cek di sistem SAIMS.", u.Name, user.Name, joinedAssets, input.Purpose)
				go s.waService.SendMessage(u.Phone, waMsg)
			}
		}
	}

	return createdBorrowings, nil
}

func (s *borrowingService) GetBorrowings(options *domain.BorrowingQueryOptions) (*domain.PaginatedResponse, error) {
	if options.Page <= 0 {
		options.Page = 1
	}
	// Limit 0 means fetch all if not paginating, but usually default to 10
	if options.Limit == 0 {
		options.Limit = 10
	}

	borrowings, total, err := s.borrowingRepo.FindAll(options)
	if err != nil {
		return nil, err
	}

	totalPages := 1
	if options.Limit > 0 {
		totalPages = int((total + int64(options.Limit) - 1) / int64(options.Limit))
	}

	return &domain.PaginatedResponse{
		Data:       borrowings,
		Total:      total,
		Page:       options.Page,
		Limit:      options.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *borrowingService) UpdateBorrowingStatus(id string, input *domain.UpdateBorrowingStatusInput, userRole string, actorID string, actorName string) (*domain.Borrowing, error) {
	if input.Status != "Menunggu_Kembali" {
		if userRole != "Administrator" && userRole != "Supervisor" {
			return nil, errors.New("unauthorized role for this action")
		}
	}

	borrowing, err := s.borrowingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if borrowing == nil {
		return nil, errors.New("borrowing not found")
	}

	asset, err := s.assetRepo.FindByID(borrowing.AssetID)
	if err != nil {
		return nil, err
	}
	if asset == nil {
		return nil, errors.New("asset not found")
	}
	
	oldBorrowingJSON, _ := json.Marshal(borrowing)

	// Logic based on new status
	switch input.Status {
	case "Approved":
		borrowing.Status = "Approved"
		asset.Status = "Dipinjam"
	case "Rejected":
		borrowing.Status = "Rejected"
		borrowing.RejectionReason = input.RejectionReason
		// If it was Pending, asset is still Tersedia. No change needed, but just in case:
		asset.Status = "Tersedia"
	case "Menunggu_Kembali":
		borrowing.Status = "Menunggu_Kembali"
		// Asset status remains "Dipinjam"
	case "Selesai":
		borrowing.Status = "Selesai"
		if input.AssetCondition != "" {
			asset.Condition = input.AssetCondition
			if input.AssetCondition == "Rusak Berat" {
				asset.Status = "Tidak Tersedia"
			} else {
				asset.Status = "Tersedia"
			}
		} else {
			asset.Status = "Tersedia"
		}
	case "Return_Rejected":
		borrowing.Status = "Return_Rejected"
		borrowing.RejectionReason = input.RejectionReason
		// Asset status remains "Dipinjam"
	default:
		return nil, errors.New("invalid status update")
	}

	err = s.borrowingRepo.UpdateStatus(borrowing, asset)
	if err != nil {
		return nil, err
	}
	
	if s.auditRepo != nil {
		newBorrowingJSON, _ := json.Marshal(borrowing)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "UPDATE_BORROWING",
			EntityName: "Borrowing",
			EntityID:   id,
			OldPayload: string(oldBorrowingJSON),
			NewPayload: string(newBorrowingJSON),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	// Send notifications based on status change
	borrower, _ := s.userRepo.FindByID(borrowing.UserID)
	if borrower != nil {
		if input.Status == "Approved" || input.Status == "Rejected" || input.Status == "Selesai" || input.Status == "Return_Rejected" {
			var msg string
			var title string
			if input.Status == "Approved" {
				title = "Peminjaman Disetujui"
				msg = fmt.Sprintf("Peminjaman aset %s Anda telah DISETUJUI.", asset.Name)
			} else if input.Status == "Rejected" {
				title = "Peminjaman Ditolak"
				msg = fmt.Sprintf("Mohon maaf peminjaman aset %s Anda DITOLAK. Alasan: %s", asset.Name, input.RejectionReason)
			} else if input.Status == "Selesai" {
				title = "Peminjaman Selesai"
				msg = fmt.Sprintf("Pengembalian aset %s Anda telah diverifikasi dan SELESAI.", asset.Name)
			} else if input.Status == "Return_Rejected" {
				title = "Pengembalian Ditolak"
				msg = fmt.Sprintf("Mohon maaf pengembalian aset %s Anda DITOLAK. Alasan: %s. Silakan ajukan ulang.", asset.Name, input.RejectionReason)
			}
			
			// In-App Notification to Borrower
			_ = s.notifService.CreateNotificationForUser(borrower.ID, title, msg, "borrowing")
			
			// WA Notification to Borrower
			if borrower.Phone != "" {
				waMsg := fmt.Sprintf("Halo %s, %s", borrower.Name, msg)
				go s.waService.SendMessage(borrower.Phone, waMsg)
			}
		} else if input.Status == "Menunggu_Kembali" {
			// Notify Supervisors and Admins about the return request
			title := "Antrean Pengembalian Aset"
			msg := fmt.Sprintf("Pengguna %s telah mengajukan pengembalian untuk aset %s. Menunggu verifikasi Anda.", borrower.Name, asset.Name)
			
			_ = s.notifService.CreateNotificationForRole("Supervisor", title, msg, "borrowing")
			_ = s.notifService.CreateNotificationForRole("Administrator", title, msg, "borrowing")
			
			notifyRoles := []string{"Supervisor", "Administrator"}
			for _, role := range notifyRoles {
				usersByRole, _ := s.userRepo.FindByRole(role)
				for _, u := range usersByRole {
					if u.Phone != "" {
						waMsg := fmt.Sprintf("Halo %s, %s", u.Name, msg)
						go s.waService.SendMessage(u.Phone, waMsg)
					}
				}
			}
		}
	}

	return borrowing, nil
}

func (s *borrowingService) DeleteBorrowing(id string, userRole string, userID string, actorName string) error {
	borrowing, err := s.borrowingRepo.FindByID(id)
	if err != nil {
		return err
	}
	if borrowing == nil {
		return errors.New("borrowing not found")
	}

	// Only allow deletion if status is Rejected
	if borrowing.Status != "Rejected" {
		return errors.New("hanya pengajuan yang ditolak (rejected) yang dapat dihapus")
	}

	// Staff can only delete their own
	if userRole == "Staff" && borrowing.UserID != userID {
		return errors.New("unauthorized to delete this borrowing")
	}

	err = s.borrowingRepo.Delete(id)
	if err == nil && s.auditRepo != nil {
		oldPayload, _ := json.Marshal(borrowing)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "DELETE_BORROWING",
			EntityName: "Borrowing",
			EntityID:   id,
			OldPayload: string(oldPayload),
			NewPayload: "null",
			ChangedBy:  actorName,
		}); errAudit != nil {
			return fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}
	return err
}
