package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"saims-backend/internal/services"
)

type AssetImageHandler struct {
	imageService services.AssetImageService
}

func NewAssetImageHandler(imageService services.AssetImageService) *AssetImageHandler {
	return &AssetImageHandler{imageService: imageService}
}

func (h *AssetImageHandler) UploadImage(c *gin.Context) {
	assetID := c.Param("id")
	if assetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "asset ID is required"})
		return
	}

	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required"})
		return
	}

	isPrimaryStr := c.DefaultPostForm("is_primary", "false")
	isPrimary, _ := strconv.ParseBool(isPrimaryStr)

	// User ID from JWT context
	userID, _ := c.Get("userID")
	uploaderID := ""
	if userIDStr, ok := userID.(string); ok {
		uploaderID = userIDStr
	}

	img, err := h.imageService.UploadAssetImage(c.Request.Context(), assetID, file, uploaderID, isPrimary)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengunggah gambar aset"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Image uploaded successfully",
		"data":    img,
	})
}

func (h *AssetImageHandler) GetImages(c *gin.Context) {
	assetID := c.Param("id")
	if assetID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "asset ID is required"})
		return
	}

	images, err := h.imageService.GetImagesByAssetID(c.Request.Context(), assetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil gambar aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": images})
}

func (h *AssetImageHandler) DeleteImage(c *gin.Context) {
	imageID := c.Param("imageId")
	if imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "image ID is required"})
		return
	}

	err := h.imageService.DeleteImage(c.Request.Context(), imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus gambar aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted successfully"})
}

func (h *AssetImageHandler) SetPrimaryImage(c *gin.Context) {
	assetID := c.Param("id")
	imageID := c.Param("imageId")
	
	if assetID == "" || imageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "asset ID and image ID are required"})
		return
	}

	err := h.imageService.SetPrimaryImage(c.Request.Context(), assetID, imageID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengatur gambar utama aset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary image set successfully"})
}
