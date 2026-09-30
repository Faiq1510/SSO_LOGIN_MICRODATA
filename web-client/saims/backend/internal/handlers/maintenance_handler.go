package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"saims-backend/internal/domain"
	"saims-backend/internal/services"
)

type MaintenanceHandler struct {
	service services.MaintenanceService
}

func NewMaintenanceHandler(service services.MaintenanceService) *MaintenanceHandler {
	return &MaintenanceHandler{service}
}

// GetMaintenances returns all maintenance records
func (h *MaintenanceHandler) GetMaintenances(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")
	typeParam := c.Query("type")
	paymentStatus := c.Query("payment_status")
	sortBy := c.Query("sort_by")
	sortOrder := c.Query("sort_order")
	techID := c.Query("technician_id")

	options := &domain.MaintenanceQueryOptions{
		Page:          page,
		Limit:         limit,
		Search:        search,
		Status:        status,
		Type:          typeParam,
		PaymentStatus: paymentStatus,
		TechnicianID:  techID,
		SortBy:        sortBy,
		SortOrder:     sortOrder,
	}

	if role, exists := c.Get("role"); exists && role.(string) == "Teknisi" {
		if userID, exists := c.Get("userID"); exists {
			options.TechnicianID = userID.(string)
		}
	}

	response, err := h.service.GetMaintenances(options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data maintenance"})
		return
	}
	c.JSON(http.StatusOK, response)
}

// CreateMaintenance creates a new maintenance record (Administrator & Teknisi only)
func (h *MaintenanceHandler) CreateMaintenance(c *gin.Context) {
	var input domain.CreateMaintenanceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get technician identity from JWT context (set by RequireAuth middleware)
	technicianID, _ := c.Get("userID")
	technicianName := ""
	if name, exists := c.Get("userName"); exists {
		technicianName, _ = name.(string)
	}

	// If Administrator, they can assign a specific technician via input
	if role, exists := c.Get("role"); exists && role.(string) == "Administrator" {
		if input.TechnicianID != "" {
			technicianID = input.TechnicianID
			technicianName = input.TechnicianName
		}
	}

	if len(input.AssetIDs) > 0 {
		bulkInput := &domain.CreateBulkMaintenanceInput{
			AssetIDs:      input.AssetIDs,
			Type:          input.Type,
			ScheduledDate: input.ScheduledDate,
			Notes:         input.Notes,
			EstimatedCost: input.EstimatedCost,
		}
		records, err := h.service.CreateBulkMaintenance(technicianID.(string), technicianName, bulkInput)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"message": "Bulk maintenance records created successfully",
			"data":    records,
		})
		return
	}

	record, err := h.service.CreateMaintenance(
		technicianID.(string),
		technicianName,
		&input,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Maintenance record created successfully",
		"data":    record,
	})
}

// UpdateMaintenanceStatus updates the status of a maintenance record (Administrator & Teknisi only)
func (h *MaintenanceHandler) UpdateMaintenanceStatus(c *gin.Context) {
	id := c.Param("id")

	var input domain.UpdateMaintenanceStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	role, _ := c.Get("role")

	record, err := h.service.UpdateMaintenanceStatus(id, userID.(string), role.(string), &input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Maintenance status updated successfully",
		"data":    record,
	})
}

// UpdateDetails updates the specific details of a maintenance record (Technician & Admin only)
func (h *MaintenanceHandler) UpdateDetails(c *gin.Context) {
	id := c.Param("id")

	var input domain.UpdateMaintenanceDetailsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("userID")
	role, _ := c.Get("role")

	record, err := h.service.UpdateMaintenanceDetails(id, userID.(string), role.(string), &input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Maintenance details updated successfully",
		"data":    record,
	})
}

// ConfirmPayment confirms payment for one or multiple maintenance records (Administrator only)
func (h *MaintenanceHandler) ConfirmPayment(c *gin.Context) {
	var input struct {
		MaintenanceIDs []string `json:"maintenance_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminID, _ := c.Get("userID")
	adminName := ""
	if name, exists := c.Get("userName"); exists {
		adminName, _ = name.(string)
	}

	err := h.service.ConfirmPayment(input.MaintenanceIDs, adminID.(string), adminName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment confirmed and invoices generated",
	})
}
