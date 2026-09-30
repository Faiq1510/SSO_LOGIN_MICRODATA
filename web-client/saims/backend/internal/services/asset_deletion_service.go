package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"saims-backend/internal/domain"
	"saims-backend/internal/repositories"

	"github.com/google/uuid"
)

type assetDeletionRequestService struct {
	repo          domain.AssetDeletionRequestRepository
	auditRepo     domain.AuditRepository
	borrowingRepo domain.BorrowingRepository
	maintRepo     repositories.MaintenanceRepository
	notifService  NotificationService
}

func NewAssetDeletionRequestService(
	repo domain.AssetDeletionRequestRepository,
	auditRepo domain.AuditRepository,
	borrowingRepo domain.BorrowingRepository,
	maintRepo repositories.MaintenanceRepository,
	notifService NotificationService,
) domain.AssetDeletionRequestService {
	return &assetDeletionRequestService{
		repo:          repo,
		auditRepo:     auditRepo,
		borrowingRepo: borrowingRepo,
		maintRepo:     maintRepo,
		notifService:  notifService,
	}
}

func (s *assetDeletionRequestService) CreateRequest(assetID string, requesterID string, actorName string, reason string) (*domain.AssetDeletionRequest, error) {
	reqID, err := uuid.Parse(requesterID)
	if err != nil {
		return nil, errors.New("invalid requester ID")
	}

	// 1. Validasi peminjaman aktif
	if s.borrowingRepo != nil {
		isActivelyBorrowed, err := s.borrowingRepo.IsAssetActivelyBorrowed(assetID)
		if err != nil {
			return nil, err
		}
		if isActivelyBorrowed {
			return nil, errors.New("aset tidak bisa diajukan untuk dihapus karena sedang dipinjam")
		}
	}

	// 2. Validasi maintenance aktif
	if s.maintRepo != nil {
		isActivelyMaintained, err := s.maintRepo.IsAssetInActiveMaintenance(assetID)
		if err != nil {
			return nil, err
		}
		if isActivelyMaintained {
			return nil, errors.New("aset tidak bisa diajukan untuk dihapus karena sedang dalam masa maintenance")
		}
	}

	// 3. Check if there is already a Pending request for this asset
	existingRequests, err := s.repo.FindAll("Pending")
	if err == nil {
		for _, r := range existingRequests {
			if r.AssetID == assetID {
				return nil, errors.New("Aset ini sudah memiliki pengajuan penghapusan yang menanti persetujuan")
			}
		}
	}

	req := &domain.AssetDeletionRequest{
		AssetID:     assetID,
		RequesterID: reqID,
		Reason:      reason,
		Status:      "Pending",
	}

	if err := s.repo.Create(req); err != nil {
		return nil, err
	}

	if s.auditRepo != nil {
		newPayload, _ := json.Marshal(req)
		if errAudit := s.auditRepo.Create(&domain.AuditLog{
			Action:     "CREATE_ASSET_DELETION_REQUEST",
			EntityName: "AssetDeletionRequest",
			EntityID:   req.ID.String(),
			OldPayload: "null",
			NewPayload: string(newPayload),
			ChangedBy:  actorName,
		}); errAudit != nil {
			return nil, fmt.Errorf("failed to create audit log: %w", errAudit)
		}
	}

	if s.notifService != nil {
		msg := fmt.Sprintf("Permintaan penghapusan baru untuk aset ID: %s dari %s. Alasan: %s", assetID, actorName, reason)
		_ = s.notifService.CreateNotificationForRole("Supervisor", "Pengajuan Penghapusan Aset", msg, "deletion")
	}

	return req, nil
}

func (s *assetDeletionRequestService) GetRequests(status string) ([]domain.AssetDeletionRequest, error) {
	return s.repo.FindAll(status)
}

func (s *assetDeletionRequestService) ApproveRequest(id string, approverID string, actorName string) error {
	req, _ := s.repo.FindByID(id)

	err := s.repo.UpdateStatus(id, "Approved", approverID)
	if err == nil {
		if s.auditRepo != nil {
			if errAudit := s.auditRepo.Create(&domain.AuditLog{
				Action:     "APPROVE_ASSET_DELETION_REQUEST",
				EntityName: "AssetDeletionRequest",
				EntityID:   id,
				OldPayload: "{\"status\": \"Pending\"}",
				NewPayload: "{\"status\": \"Approved\"}",
				ChangedBy:  actorName,
			}); errAudit != nil {
				return fmt.Errorf("failed to create audit log: %w", errAudit)
			}
		}

		if s.notifService != nil && req != nil {
			msg := fmt.Sprintf("Pengajuan penghapusan untuk aset ID: %s telah DISETUJUI oleh Supervisor (%s).", req.AssetID, actorName)
			_ = s.notifService.CreateNotificationForUser(req.RequesterID.String(), "Penghapusan Aset Disetujui", msg, "deletion")
		}
	}
	return err
}

func (s *assetDeletionRequestService) RejectRequest(id string, approverID string, actorName string) error {
	req, _ := s.repo.FindByID(id)

	err := s.repo.UpdateStatus(id, "Rejected", approverID)
	if err == nil {
		if s.auditRepo != nil {
			if errAudit := s.auditRepo.Create(&domain.AuditLog{
				Action:     "REJECT_ASSET_DELETION_REQUEST",
				EntityName: "AssetDeletionRequest",
				EntityID:   id,
				OldPayload: "{\"status\": \"Pending\"}",
				NewPayload: "{\"status\": \"Rejected\"}",
				ChangedBy:  actorName,
			}); errAudit != nil {
				return fmt.Errorf("failed to create audit log: %w", errAudit)
			}
		}

		if s.notifService != nil && req != nil {
			msg := fmt.Sprintf("Pengajuan penghapusan untuk aset ID: %s DITOLAK oleh Supervisor (%s).", req.AssetID, actorName)
			_ = s.notifService.CreateNotificationForUser(req.RequesterID.String(), "Penghapusan Aset Ditolak", msg, "deletion")
		}
	}
	return err
}
