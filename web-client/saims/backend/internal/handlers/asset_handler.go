package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"saims-backend/internal/domain"
)

type AssetHandler struct {
	service         domain.AssetService
	deletionService domain.AssetDeletionRequestService
}

func NewAssetHandler(service domain.AssetService, deletionService domain.AssetDeletionRequestService) *AssetHandler {
	return &AssetHandler{service: service, deletionService: deletionService}
}

// CreateAsset POST /api/assets
func (h *AssetHandler) CreateAsset(c *gin.Context) {
	var input domain.CreateAssetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	actorID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorIDStr, _ := actorID.(string)
	actorNameStr, _ := actorName.(string)

	asset, err := h.service.CreateAsset(&input, actorIDStr, actorNameStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat aset"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Asset created successfully",
		"data":    asset,
	})
}

// CreateBulkAssets POST /api/assets/bulk
func (h *AssetHandler) CreateBulkAssets(c *gin.Context) {
	var input domain.CreateBulkAssetsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	actorID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorIDStr, _ := actorID.(string)
	actorNameStr, _ := actorName.(string)

	assets, err := h.service.CreateBulkAssets(&input, actorIDStr, actorNameStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat aset massal"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Bulk assets created successfully",
		"data":    assets,
	})
}

// GetAssets GET /api/assets
func (h *AssetHandler) GetAssets(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	category := c.Query("category")
	status := c.Query("status")
	condition := c.Query("condition")
	location := c.Query("location")

	options := &domain.AssetQueryOptions{
		Page:      page,
		Limit:     limit,
		Search:    search,
		Category:  category,
		Status:    status,
		Condition: condition,
		Location:  location,
	}

	response, err := h.service.GetAssets(options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assets"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetAssetByID GET /api/assets/:id
func (h *AssetHandler) GetAssetByID(c *gin.Context) {
	id := c.Param("id")
	asset, err := h.service.GetAssetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": asset,
	})
}

// UpdateAsset PUT /api/assets/:id
func (h *AssetHandler) UpdateAsset(c *gin.Context) {
	id := c.Param("id")
	var input domain.UpdateAssetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	actorID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorIDStr, _ := actorID.(string)
	actorNameStr, _ := actorName.(string)

	asset, err := h.service.UpdateAsset(id, &input, actorIDStr, actorNameStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Asset updated successfully",
		"data":    asset,
	})
}

// DeleteAsset DELETE /api/assets/:id
func (h *AssetHandler) DeleteAsset(c *gin.Context) {
	id := c.Param("id")
	
	role, _ := c.Get("role")
	userID, _ := c.Get("userID")

	if role == "Administrator" {
		// Needs a reason in the body
		var req struct {
			Reason string `json:"reason" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Reason is required for deletion request"})
			return
		}

		actorName, _ := c.Get("userName")
		actorNameStr, _ := actorName.(string)

		deletionReq, err := h.deletionService.CreateRequest(id, userID.(string), actorNameStr, req.Reason)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Deletion request created successfully",
			"data":    deletionReq,
		})
		return
	}

	actorName, _ := c.Get("userName")
	actorNameStr, _ := actorName.(string)

	// Supervisor/Admin deletes directly
	if role == "Supervisor" || role == "Administrator" {
		// Log as deletion request but approve immediately
		req, _ := h.deletionService.CreateRequest(id, userID.(string), actorNameStr, "Direct deletion by "+role.(string))
		if req != nil {
			_ = h.deletionService.ApproveRequest(req.ID.String(), userID.(string), actorNameStr)
		}
	}

	err := h.service.DeleteAsset(id, userID.(string), actorNameStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Asset deleted successfully",
	})
}


// GetDeletedAssets GET /api/assets/trash
func (h *AssetHandler) GetDeletedAssets(c *gin.Context) {
	var options domain.AssetQueryOptions
	if err := c.ShouldBindQuery(&options); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.service.GetDeletedAssets(&options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data aset terhapus"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RestoreAsset POST /api/assets/:id/restore
func (h *AssetHandler) RestoreAsset(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorNameStr, _ := actorName.(string)

	err := h.service.RestoreAsset(id, userID.(string), actorNameStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulihkan aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Asset restored successfully",
	})
}
