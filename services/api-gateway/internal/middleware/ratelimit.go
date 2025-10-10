// BitCurrent Exchange - Rate Limiting Middleware
package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/cache"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// RateLimitMiddleware implements token bucket rate limiting
func RateLimitMiddleware(redisCache *cache.RedisCache, logger *zap.Logger) mux.MiddlewareFunc {
	limiter := cache.NewRateLimiter(redisCache, logger)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get user ID from context (if authenticated)
			var rateLimitKey string
			if userID := r.Context().Value("user_id"); userID != nil {
				rateLimitKey = "ratelimit:user:" + userID.(string)
			} else {
				// Use IP address for unauthenticated requests
				rateLimitKey = "ratelimit:ip:" + getIPAddress(r)
			}

			// Check rate limit: 100 requests per minute
			ctx, cancel := context.WithTimeout(r.Context(), 1*time.Second)
			defer cancel()

			allowed, err := limiter.Allow(ctx, rateLimitKey, 100, time.Minute)
			if err != nil {
				logger.Error("Rate limit check failed", zap.Error(err))
				// Allow request on error (fail open)
				next.ServeHTTP(w, r)
				return
			}

			if !allowed {
				logger.Warn("Rate limit exceeded",
					zap.String("key", rateLimitKey),
					zap.String("path", r.URL.Path),
				)
				respondRateLimited(w)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func getIPAddress(r *http.Request) string {
	// Check X-Forwarded-For header first
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}

	// Check X-Real-IP header
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}

func respondRateLimited(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Retry-After", "60")
	w.WriteHeader(http.StatusTooManyRequests)
	w.Write([]byte(`{"error": "Rate Limit Exceeded", "message": "Too many requests, please try again later"}`))
}



