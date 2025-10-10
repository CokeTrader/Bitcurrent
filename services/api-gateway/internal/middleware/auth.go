// BitCurrent Exchange - Authentication Middleware
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware(jwtManager *auth.JWTManager, logger *zap.Logger) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				respondUnauthorized(w, "Missing authorization header")
				return
			}

			// Check Bearer token format
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				respondUnauthorized(w, "Invalid authorization header format")
				return
			}

			tokenString := parts[1]

			// Validate token
			claims, err := jwtManager.ValidateToken(tokenString)
			if err != nil {
				logger.Warn("Token validation failed",
					zap.Error(err),
					zap.String("remote_addr", r.RemoteAddr),
				)
				respondUnauthorized(w, "Invalid or expired token")
				return
			}

			// Add claims to context
			ctx := context.WithValue(r.Context(), "claims", claims)
			ctx = context.WithValue(ctx, "user_id", claims.UserID.String())
			ctx = context.WithValue(ctx, "account_id", claims.AccountID.String())

			logger.Debug("Request authenticated",
				zap.String("user_id", claims.UserID.String()),
				zap.String("path", r.URL.Path),
			)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func respondUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error": "Unauthorized", "message": "` + message + `"}`))
}



