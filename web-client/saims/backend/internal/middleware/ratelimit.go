package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// IPRateLimiter struct
type IPRateLimiter struct {
	ips map[string]*rate.Limiter
	mu  *sync.RWMutex
	r   rate.Limit
	b   int
}

// NewIPRateLimiter creates a new rate limiter
func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
	i := &IPRateLimiter{
		ips: make(map[string]*rate.Limiter),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}

	go i.cleanupRoutines()
	return i
}

// AddIP adds a new IP to the map
func (i *IPRateLimiter) AddIP(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	limiter := rate.NewLimiter(i.r, i.b)
	i.ips[ip] = limiter
	return limiter
}

// GetLimiter gets the rate limiter for a specific IP
func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.RLock()
	limiter, exists := i.ips[ip]

	if !exists {
		i.mu.RUnlock()
		return i.AddIP(ip)
	}

	i.mu.RUnlock()
	return limiter
}

// cleanupRoutines runs periodically to clean up the map (prevent memory leak)
func (i *IPRateLimiter) cleanupRoutines() {
	for {
		time.Sleep(time.Minute * 10)
		i.mu.Lock()
		i.ips = make(map[string]*rate.Limiter)
		i.mu.Unlock()
	}
}

// Global Limiter Instance (0.5 requests per second = 30 per min, burst 30)
var globalLimiter = NewIPRateLimiter(rate.Limit(0.5), 30)

// RateLimit middleware limits requests by IP
func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := globalLimiter.GetLimiter(ip)

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Terlalu banyak request. Silakan coba lagi beberapa saat.",
			})
			return
		}
		c.Next()
	}
}
