// BitCurrent Exchange - Two-Factor Authentication Handlers
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

type TwoFactorHandler struct {
	db          *database.PostgresDB
	totpManager *auth.TOTPManager
	logger      *zap.Logger
}

func NewTwoFactorHandler(db *database.PostgresDB, totpManager *auth.TOTPManager, logger *zap.Logger) *TwoFactorHandler {
	return &TwoFactorHandler{
		db:          db,
		totpManager: totpManager,
		logger:      logger,
	}
}

type Enable2FAResponse struct {
	Secret      string   `json:"secret"`
	QRCodeURL   string   `json:"qr_code_url"`
	BackupCodes []string `json:"backup_codes"`
}

func (h *TwoFactorHandler) Enable2FA(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	// Generate TOTP secret
	secret, err := h.totpManager.GenerateSecret()
	if err != nil {
		h.logger.Error("Failed to generate TOTP secret", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to enable 2FA")
		return
	}

	// Generate QR code URL
	qrURL := h.totpManager.GenerateQRCodeURL(claims.Email, secret)

	// Generate backup codes
	backupCodes, err := h.totpManager.GenerateBackupCodes(10)
	if err != nil {
		h.logger.Error("Failed to generate backup codes", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to generate backup codes")
		return
	}

	// Store secret in database (encrypted)
	// TODO: Encrypt secret before storing
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE users
		SET totp_secret = $1, totp_enabled = false, updated_at = NOW()
		WHERE id = $2
	`

	_, err = h.db.Pool.Exec(ctx, query, secret, claims.UserID)
	if err != nil {
		h.logger.Error("Failed to store TOTP secret", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to enable 2FA")
		return
	}

	// TODO: Store backup codes (hashed)

	h.logger.Info("2FA enrollment initiated",
		zap.String("user_id", claims.UserID.String()),
	)

	respondJSON(w, http.StatusOK, Enable2FAResponse{
		Secret:      secret,
		QRCodeURL:   qrURL,
		BackupCodes: backupCodes,
	})
}

type Verify2FARequest struct {
	Code string `json:"code"`
}

func (h *TwoFactorHandler) Verify2FA(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	var req Verify2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Code == "" {
		respondError(w, http.StatusBadRequest, "Code is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Get TOTP secret from database
	var totpSecret string
	var totpEnabled bool
	query := `SELECT totp_secret, totp_enabled FROM users WHERE id = $1`

	err := h.db.Pool.QueryRow(ctx, query, claims.UserID).Scan(&totpSecret, &totpEnabled)
	if err != nil || totpSecret == "" {
		respondError(w, http.StatusBadRequest, "2FA not set up")
		return
	}

	// Validate code
	valid, err := h.totpManager.ValidateCode(totpSecret, req.Code)
	if err != nil {
		h.logger.Error("Failed to validate TOTP code", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to verify code")
		return
	}

	if !valid {
		h.logger.Warn("Invalid 2FA code",
			zap.String("user_id", claims.UserID.String()),
		)
		respondError(w, http.StatusUnauthorized, "Invalid code")
		return
	}

	// Enable 2FA if this is the first verification
	if !totpEnabled {
		updateQuery := `UPDATE users SET totp_enabled = true, updated_at = NOW() WHERE id = $1`
		_, err = h.db.Pool.Exec(ctx, updateQuery, claims.UserID)
		if err != nil {
			h.logger.Error("Failed to enable 2FA", zap.Error(err))
			respondError(w, http.StatusInternalServerError, "Failed to enable 2FA")
			return
		}

		h.logger.Info("2FA enabled",
			zap.String("user_id", claims.UserID.String()),
		)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "2FA verified successfully",
		"enabled": true,
	})
}

func (h *TwoFactorHandler) Disable2FA(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	var req Verify2FARequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Get TOTP secret
	var totpSecret string
	query := `SELECT totp_secret FROM users WHERE id = $1`

	err := h.db.Pool.QueryRow(ctx, query, claims.UserID).Scan(&totpSecret)
	if err != nil || totpSecret == "" {
		respondError(w, http.StatusBadRequest, "2FA not enabled")
		return
	}

	// Validate code before disabling
	valid, err := h.totpManager.ValidateCode(totpSecret, req.Code)
	if err != nil || !valid {
		respondError(w, http.StatusUnauthorized, "Invalid code")
		return
	}

	// Disable 2FA
	updateQuery := `
		UPDATE users
		SET totp_enabled = false, totp_secret = NULL, updated_at = NOW()
		WHERE id = $1
	`

	_, err = h.db.Pool.Exec(ctx, updateQuery, claims.UserID)
	if err != nil {
		h.logger.Error("Failed to disable 2FA", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to disable 2FA")
		return
	}

	h.logger.Info("2FA disabled",
		zap.String("user_id", claims.UserID.String()),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "2FA disabled successfully",
	})
}

func (h *TwoFactorHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var totpEnabled bool
	query := `SELECT totp_enabled FROM users WHERE id = $1`

	err := h.db.Pool.QueryRow(ctx, query, claims.UserID).Scan(&totpEnabled)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get 2FA status")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"enabled": totpEnabled,
	})
}
