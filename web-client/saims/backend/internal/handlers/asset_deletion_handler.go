package handlers

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"saims-backend/internal/domain"
)

type AssetDeletionHandler struct {
	service      domain.AssetDeletionRequestService
	assetService domain.AssetService
}

func NewAssetDeletionHandler(service domain.AssetDeletionRequestService, assetService domain.AssetService) *AssetDeletionHandler {
	return &AssetDeletionHandler{
		service:      service,
		assetService: assetService,
	}
}

// GetRequests GET /api/asset-deletions
func (h *AssetDeletionHandler) GetRequests(c *gin.Context) {
	status := c.Query("status") // Optional filter
	requests, err := h.service.GetRequests(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deletion requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Deletion requests retrieved successfully",
		"data":    requests,
	})
}

// isBusinessLogicError checks if the error is a known business rule violation
func isBusinessLogicError(err error) bool {
	msg := err.Error()
	businessErrors := []string{
		"sedang dipinjam",
		"sedang dalam masa maintenance",
		"memiliki riwayat transaksi",
		"tidak bisa dihapus",
		"asset not found",
	}
	for _, be := range businessErrors {
		if strings.Contains(msg, be) {
			return true
		}
	}
	return false
}

// ApproveRequest POST /api/asset-deletions/:id/approve
func (h *AssetDeletionHandler) ApproveRequest(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorNameStr, _ := actorName.(string)
	userIDStr, _ := userID.(string)

	// Get the specific request to find the AssetID
	reqs, err := h.service.GetRequests("")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deletion request"})
		return
	}

	var assetID string
	var reqStatus string
	for _, req := range reqs {
		if req.ID.String() == id {
			assetID = req.AssetID
			reqStatus = req.Status
			break
		}
	}

	if assetID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Prevent re-approving already processed requests
	if reqStatus != "Pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request sudah diproses sebelumnya (status: " + reqStatus + ")"})
		return
	}

	// Update status to Approved
	if err := h.service.ApproveRequest(id, userIDStr, actorNameStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyetujui pengajuan hapus aset"})
		return
	}

	// Execute physical deletion
	if err := h.assetService.DeleteAsset(assetID, userIDStr, actorNameStr); err != nil {
		// Rollback: revert the approval back to Pending since deletion failed
		if rollbackErr := h.service.RejectRequest(id, userIDStr, actorNameStr); rollbackErr != nil {
			log.Printf("CRITICAL: Failed to rollback approval for deletion request %s: %v", id, rollbackErr)
		}

		// Return appropriate HTTP status based on error type
		if isBusinessLogicError(err) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"message": "Approval dibatalkan karena aset tidak dapat dihapus saat ini",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Gagal menghapus aset",
				"message": "Approval dibatalkan karena terjadi kesalahan sistem",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deletion request approved and asset deleted"})
}

// RejectRequest POST /api/asset-deletions/:id/reject
func (h *AssetDeletionHandler) RejectRequest(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorNameStr, _ := actorName.(string)
	userIDStr, _ := userID.(string)

	if err := h.service.RejectRequest(id, userIDStr, actorNameStr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menolak pengajuan hapus aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deletion request rejected"})
}

