package handlers

import (
	"net/http"
	"saims-backend/internal/services"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationService services.NotificationService
}

func NewNotificationHandler(s services.NotificationService) *NotificationHandler {
	return &NotificationHandler{s}
}

func (h *NotificationHandler) GetMyNotifications(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	notifs, err := h.notificationService.GetUserNotifications(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil notifikasi pengguna"})
		return
	}

	unreadCount, _ := h.notificationService.GetUnreadCount(userID.(string))

	c.JSON(http.StatusOK, gin.H{
		"data":         notifs,
		"unread_count": unreadCount,
	})
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	notifID := c.Param("id")

	if err := h.notificationService.MarkAsRead(notifID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui notifikasi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")

	if err := h.notificationService.MarkAllAsRead(userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui seluruh notifikasi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}
