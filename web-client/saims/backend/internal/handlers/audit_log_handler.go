package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"saims-backend/internal/domain"
)

type AuditLogHandler struct {
	auditRepo domain.AuditRepository
}

func NewAuditLogHandler(auditRepo domain.AuditRepository) *AuditLogHandler {
	return &AuditLogHandler{auditRepo: auditRepo}
}

func (h *AuditLogHandler) GetAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	
	offset := (page - 1) * limit

	filters := map[string]string{
		"changed_by": c.Query("user"),
		"start_date": c.Query("start_date"),
		"end_date":   c.Query("end_date"),
		"action":     c.Query("action"),
	}

	logs, total, err := h.auditRepo.FindAll(offset, limit, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil audit logs"})
		return
	}

	totalPages := 1
	if limit > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	c.JSON(http.StatusOK, domain.PaginatedResponse{
		Data:       logs,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}
