package handlers

import (
	"net/http"
	"saims-backend/internal/domain"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service domain.DashboardService
}

func NewDashboardHandler(service domain.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil statistik dashboard"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) GetLandingStats(c *gin.Context) {
	stats, err := h.service.GetLandingStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil statistik publik"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
