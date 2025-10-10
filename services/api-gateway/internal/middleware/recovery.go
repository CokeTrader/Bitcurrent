// BitCurrent Exchange - Recovery Middleware
package middleware

import (
	"net/http"
	"runtime/debug"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// RecoveryMiddleware recovers from panics and logs them
func RecoveryMiddleware(logger *zap.Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					// Log the panic
					logger.Error("Panic recovered",
						zap.Any("error", err),
						zap.String("method", r.Method),
						zap.String("path", r.URL.Path),
						zap.String("stack", string(debug.Stack())),
					)

					// Return 500 error
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					w.Write([]byte(`{"error": "Internal Server Error", "message": "An unexpected error occurred"}`))
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}



