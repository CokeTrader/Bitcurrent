// BitCurrent Exchange - User Management Handler
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"go.uber.org/zap"
)

type UserHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewUserHandler(db *database.PostgresDB, logger *zap.Logger) *UserHandler {
	return &UserHandler{
		db:     db,
		logger: logger,
	}
}

type UserPreferences struct {
	Theme                string `json:"theme"`
	Language             string `json:"language"`
	Timezone             string `json:"timezone"`
	CurrencyDisplay      string `json:"currency_display"`
	NotificationsEmail   bool   `json:"notifications_email"`
	NotificationsPush    bool   `json:"notifications_push"`
	NotificationsSMS     bool   `json:"notifications_sms"`
	TradingConfirmations bool   `json:"trading_confirmations"`
	NewsletterSubscribed bool   `json:"newsletter_subscribed"`
}

// GetPreferences - Get user preferences
func (h *UserHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var prefs UserPreferences
	query := `
		SELECT 
			theme, language, timezone, currency_display,
			notifications_email, notifications_push, notifications_sms,
			trading_confirmations, newsletter_subscribed
		FROM user_preferences
		WHERE user_id = $1
	`

	err := h.db.Pool.QueryRow(ctx, query, claims.UserID).Scan(
		&prefs.Theme, &prefs.Language, &prefs.Timezone, &prefs.CurrencyDisplay,
		&prefs.NotificationsEmail, &prefs.NotificationsPush, &prefs.NotificationsSMS,
		&prefs.TradingConfirmations, &prefs.NewsletterSubscribed,
	)

	if err != nil {
		// Create default preferences if not exists
		insertQuery := `
			INSERT INTO user_preferences (user_id)
			VALUES ($1)
			ON CONFLICT (user_id) DO NOTHING
		`
		h.db.Pool.Exec(ctx, insertQuery, claims.UserID)

		// Return defaults
		prefs = UserPreferences{
			Theme:                "dark",
			Language:             "en-GB",
			Timezone:             "Europe/London",
			CurrencyDisplay:      "GBP",
			NotificationsEmail:   true,
			NotificationsPush:    true,
			NotificationsSMS:     false,
			TradingConfirmations: true,
			NewsletterSubscribed: false,
		}
	}

	respondJSON(w, http.StatusOK, prefs)
}

// UpdatePreferences - Update user preferences
func (h *UserHandler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var prefs UserPreferences
	if err := json.NewDecoder(r.Body).Decode(&prefs); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE user_preferences
		SET 
			theme = $1,
			language = $2,
			timezone = $3,
			currency_display = $4,
			notifications_email = $5,
			notifications_push = $6,
			notifications_sms = $7,
			trading_confirmations = $8,
			newsletter_subscribed = $9,
			updated_at = NOW()
		WHERE user_id = $10
	`

	_, err := h.db.Pool.Exec(ctx, query,
		prefs.Theme, prefs.Language, prefs.Timezone, prefs.CurrencyDisplay,
		prefs.NotificationsEmail, prefs.NotificationsPush, prefs.NotificationsSMS,
		prefs.TradingConfirmations, prefs.NewsletterSubscribed,
		claims.UserID,
	)

	if err != nil {
		h.logger.Error("Failed to update preferences", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to update preferences")
		return
	}

	h.logger.Info("User preferences updated", zap.String("user_id", claims.UserID.String()))

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Preferences updated successfully",
	})
}

// GetLoginHistory - Get user's login history
func (h *UserHandler) GetLoginHistory(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT 
			success, ip_address, user_agent, country_code, city, 
			device_type, failure_reason, created_at
		FROM login_history
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`

	rows, err := h.db.Pool.Query(ctx, query, claims.UserID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to fetch login history")
		return
	}
	defer rows.Close()

	var history []map[string]interface{}
	for rows.Next() {
		var success bool
		var ipAddress, userAgent, countryCode, city, deviceType, failureReason string
		var createdAt time.Time

		err := rows.Scan(&success, &ipAddress, &userAgent, &countryCode, &city, &deviceType, &failureReason, &createdAt)
		if err != nil {
			continue
		}

		history = append(history, map[string]interface{}{
			"success":        success,
			"ip_address":     ipAddress,
			"user_agent":     userAgent,
			"country_code":   countryCode,
			"city":           city,
			"device_type":    deviceType,
			"failure_reason": failureReason,
			"created_at":     createdAt,
		})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"history": history,
	})
}

// DeleteAccount handles account deletion
func (h *UserHandler) DeleteAccount(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Start transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to start transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to delete account")
		return
	}
	defer tx.Rollback(ctx)

	// Soft delete user account (mark as deleted)
	query := `
		UPDATE users 
		SET status = 'deleted', 
		    updated_at = NOW()
		WHERE id = $1
	`

	_, err = tx.Exec(ctx, query, claims.UserID)
	if err != nil {
		h.logger.Error("Failed to delete account", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to delete account")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to delete account")
		return
	}

	h.logger.Info("Account deleted", zap.String("user_id", claims.UserID.String()))

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Account successfully deleted",
	})
}
