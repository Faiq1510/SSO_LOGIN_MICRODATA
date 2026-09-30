package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"saims-backend/internal/domain"
)

type BorrowingHandler struct {
	borrowingService domain.BorrowingService
}

func NewBorrowingHandler(borrowingService domain.BorrowingService) *BorrowingHandler {
	return &BorrowingHandler{borrowingService}
}

func (h *BorrowingHandler) CreateBorrowing(c *gin.Context) {
	// Get userID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input domain.CreateBorrowingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userName, _ := c.Get("userName")
	userNameStr, _ := userName.(string)

	borrowings, err := h.borrowingService.CreateBorrowing(userID.(string), userNameStr, &input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Borrowing requests created successfully",
		"data":    borrowings,
	})
}

func (h *BorrowingHandler) GetBorrowings(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	status := c.Query("status")

	options := &domain.BorrowingQueryOptions{
		Page:   page,
		Limit:  limit,
		Search: search,
		Status: status,
	}

	userRole, exists := c.Get("role")
	if exists && userRole.(string) == "Staff" {
		userID, userExists := c.Get("userID")
		if userExists {
			options.UserID = userID.(string)
		}
	}

	response, err := h.borrowingService.GetBorrowings(options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data peminjaman"})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *BorrowingHandler) UpdateBorrowingStatus(c *gin.Context) { // h adalah borrowingHandler dan borrowingService adalah service yang akan digunakan untuk update borrowing status
	id := c.Param("id") //c itu adalah context atau wadah untuk menampung data
	// 'role' key is set by RequireAuth middleware from JWT claims
	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var input domain.UpdateBorrowingStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	actorID, _ := c.Get("userID")
	actorName, _ := c.Get("userName")
	actorIDStr, _ := actorID.(string)
	actorNameStr, _ := actorName.(string)

	borrowing, err := h.borrowingService.UpdateBorrowingStatus(id, &input, userRole.(string), actorIDStr, actorNameStr)
	if err != nil {
		if err.Error() == "unauthorized role for this action" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Borrowing status updated successfully",
		"data":    borrowing,
	})
}

func (h *BorrowingHandler) DeleteBorrowing(c *gin.Context) {
	id := c.Param("id")

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userRole, _ := c.Get("role") // changed from userRole to role to match auth middleware
	actorName, _ := c.Get("userName")
	actorNameStr, _ := actorName.(string)

	err := h.borrowingService.DeleteBorrowing(id, userRole.(string), userID.(string), actorNameStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Borrowing request deleted successfully",
	})
}
