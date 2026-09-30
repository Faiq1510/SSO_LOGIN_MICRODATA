package middleware

import (
	"bytes"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type idempotencyEntry struct {
	StatusCode int
	Body       []byte
	Headers    http.Header
	ExpiresAt  time.Time
}

var idempotencyCache sync.Map

// Idempotency middleware ensures that POST/PUT requests with the same Idempotency-Key
// are not processed multiple times.
func Idempotency() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only check POST, PUT, PATCH methods
		if c.Request.Method != http.MethodPost && c.Request.Method != http.MethodPut && c.Request.Method != http.MethodPatch {
			c.Next()
			return
		}

		key := c.GetHeader("Idempotency-Key")
		if key == "" {
			c.Next()
			return
		}

		// Cleanup expired entries periodically or on-the-fly (simplified on-the-fly approach)
		if entry, exists := idempotencyCache.Load(key); exists {
			cached := entry.(idempotencyEntry)
			if time.Now().Before(cached.ExpiresAt) {
				for k, v := range cached.Headers {
					for _, val := range v {
						c.Writer.Header().Add(k, val)
					}
				}
				c.Data(cached.StatusCode, c.Writer.Header().Get("Content-Type"), cached.Body)
				c.Abort()
				return
			}
			idempotencyCache.Delete(key)
		}

		// Intercept the response
		w := &responseBodyWriter{body: bytes.NewBufferString(""), ResponseWriter: c.Writer}
		c.Writer = w

		c.Next()

		// Cache the response if it was successful (2xx)
		if c.Writer.Status() >= 200 && c.Writer.Status() < 300 {
			idempotencyCache.Store(key, idempotencyEntry{
				StatusCode: c.Writer.Status(),
				Body:       w.body.Bytes(),
				Headers:    w.Header().Clone(),
				ExpiresAt:  time.Now().Add(24 * time.Hour), // Keep idempotency key for 24h
			})
		}
	}
}

type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (r *responseBodyWriter) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}
