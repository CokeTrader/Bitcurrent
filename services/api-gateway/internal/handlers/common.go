// BitCurrent Exchange - Common Handler Utilities
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/cache"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
)

// ErrorResponse represents an API error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// SuccessResponse represents a successful API response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
}

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError sends an error JSON response
func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, ErrorResponse{
		Error:   http.StatusText(status),
		Message: message,
		Code:    status,
	})
}

// respondSuccess sends a success JSON response
func respondSuccess(w http.ResponseWriter, data interface{}, message string) {
	respondJSON(w, http.StatusOK, SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// HealthCheckHandler returns the health check handler
func HealthCheckHandler(db *database.PostgresDB, cache *cache.RedisCache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		health := map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"checks":    map[string]string{},
		}

		// Check database
		if err := db.Health(ctx); err != nil {
			health["status"] = "unhealthy"
			health["checks"].(map[string]string)["database"] = "down"
		} else {
			health["checks"].(map[string]string)["database"] = "up"
		}

		// Check Redis
		if err := cache.Health(ctx); err != nil {
			health["status"] = "unhealthy"
			health["checks"].(map[string]string)["redis"] = "down"
		} else {
			health["checks"].(map[string]string)["redis"] = "up"
		}

		status := http.StatusOK
		if health["status"] == "unhealthy" {
			status = http.StatusServiceUnavailable
		}

		respondJSON(w, status, health)
	}
}

// ReadinessHandler returns the readiness check handler
func ReadinessHandler(db *database.PostgresDB, cache *cache.RedisCache) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		// Quick checks for readiness
		ready := true
		checks := map[string]bool{
			"database": db.Health(ctx) == nil,
			"redis":    cache.Health(ctx) == nil,
		}

		for _, status := range checks {
			if !status {
				ready = false
				break
			}
		}

		response := map[string]interface{}{
			"ready":  ready,
			"checks": checks,
		}

		status := http.StatusOK
		if !ready {
			status = http.StatusServiceUnavailable
		}

		respondJSON(w, status, response)
	}
}

// PaginationParams represents pagination parameters
type PaginationParams struct {
	Limit  int
	Offset int
	Page   int
}

// ParsePaginationParams parses pagination from query parameters
func ParsePaginationParams(r *http.Request) PaginationParams {
	query := r.URL.Query()
	
	limit := 50
	if l := query.Get("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}

	page := 1
	if p := query.Get("page"); p != "" {
		if parsed, err := parseInt(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	offset := (page - 1) * limit

	return PaginationParams{
		Limit:  limit,
		Offset: offset,
		Page:   page,
	}
}

// parseInt safely parses a string to int
func parseInt(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}

