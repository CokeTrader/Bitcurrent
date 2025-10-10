// BitCurrent Exchange - Logging Middleware
package middleware

import (
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	written    int
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.written += n
	return n, err
}

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware(logger *zap.Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Wrap response writer
			wrapped := newResponseWriter(w)

			// Process request
			next.ServeHTTP(wrapped, r)

			// Log request
			duration := time.Since(start)

			fields := []zap.Field{
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.String("query", r.URL.RawQuery),
				zap.Int("status", wrapped.statusCode),
				zap.Int("bytes", wrapped.written),
				zap.Duration("duration", duration),
				zap.String("ip", getIPAddress(r)),
				zap.String("user_agent", r.UserAgent()),
			}

			// Add user ID if authenticated
			if userID := r.Context().Value("user_id"); userID != nil {
				fields = append(fields, zap.String("user_id", userID.(string)))
			}

			// Log with appropriate level
			if wrapped.statusCode >= 500 {
				logger.Error("HTTP request completed", fields...)
			} else if wrapped.statusCode >= 400 {
				logger.Warn("HTTP request completed", fields...)
			} else {
				logger.Info("HTTP request completed", fields...)
			}
		})
	}
}



