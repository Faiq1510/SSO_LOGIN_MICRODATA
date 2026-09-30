// Fungsi dari file ini adalah untuk mengecek apakah user sudah login atau belum
// dan juga untuk mengecek apakah user memiliki role yang sesuai dengan role yang dibutuhkan
// jika tidak memiliki role yang sesuai maka akan dikembalikan error

package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"saims-backend/internal/repositories"
	"saims-backend/pkg/utils"
)

// RequireAuth middleware ensures the request has a valid JWT token
func RequireAuth(blacklistRepo repositories.JWTBlacklistRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("access_token")
		if err != nil || tokenString == "" {
			// Fallback to Authorization header if cookie is missing (e.g. for Swagger/API clients)
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString = parts[1]
				}
			}
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is required"})
			return
		}

		// Check if token is blacklisted
		if blacklistRepo != nil && blacklistRepo.IsBlacklisted(tokenString) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is blacklisted"})
			return
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Check token type
		if tokenType, ok := claims["type"].(string); !ok || tokenType != "access" {
			// Older tokens might not have type, so we only strictly block if type exists and is not access
			if ok {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
				return
			}
		}

		// Set claims in context
		if userID, ok := claims["user_id"].(string); ok {
			c.Set("userID", userID)
		}
		if role, ok := claims["role"].(string); ok {
			c.Set("role", role)
		}
		if name, ok := claims["name"].(string); ok {
			c.Set("userName", name)
		}

		c.Next()
	}
}
