package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole middleware ensures the user has one of the required roles
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized. Role not found in context."})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error. Invalid role type."})
			return
		}

		allowed := false
		for _, role := range roles {
			if roleStr == role {
				allowed = true
				break
			}
		}

		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden. Insufficient permissions."})
			return
		}

		c.Next()
	}
}
