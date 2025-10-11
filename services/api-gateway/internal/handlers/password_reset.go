// BitCurrent Exchange - Password Reset Handler
package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type PasswordResetHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewPasswordResetHandler(db *database.PostgresDB, logger *zap.Logger) *PasswordResetHandler {
	return &PasswordResetHandler{
		db:     db,
		logger: logger,
	}
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

// RequestPasswordReset - Step 1: User requests reset link
func (h *PasswordResetHandler) RequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" {
		respondError(w, http.StatusBadRequest, "Email is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Check if user exists
	var userID uuid.UUID
	var email string
	query := `SELECT id, email FROM users WHERE email = $1 AND status = 'active'`

	err := h.db.Pool.QueryRow(ctx, query, req.Email).Scan(&userID, &email)
	if err != nil {
		// Don't reveal if email exists (security best practice)
		h.logger.Warn("Password reset requested for non-existent email",
			zap.String("email", req.Email))
		respondJSON(w, http.StatusOK, map[string]string{
			"message": "If an account exists with this email, a reset link has been sent",
		})
		return
	}

	// Generate secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		h.logger.Error("Failed to generate reset token", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to generate reset token")
		return
	}
	token := base64.URLEncoding.EncodeToString(tokenBytes)

	// Store token in database (expires in 1 hour)
	insertQuery := `
		INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5)
	`
	expiresAt := time.Now().Add(1 * time.Hour)
	ipAddress := r.RemoteAddr
	userAgent := r.UserAgent()

	_, err = h.db.Pool.Exec(ctx, insertQuery, userID, token, expiresAt, ipAddress, userAgent)
	if err != nil {
		h.logger.Error("Failed to store reset token", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to process reset request")
		return
	}

	// Update user record
	updateQuery := `UPDATE users SET password_reset_sent_at = NOW() WHERE id = $1`
	h.db.Pool.Exec(ctx, updateQuery, userID)

	// TODO: Send email with reset link
	// resetLink := fmt.Sprintf("https://bitcurrent.co.uk/auth/reset-password?token=%s", token)
	// sendEmail(email, "Password Reset", resetLink)

	h.logger.Info("Password reset requested",
		zap.String("user_id", userID.String()),
		zap.String("email", email),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset link sent to your email",
		"token":   token, // TODO: Remove in production, only send via email
	})
}

// ResetPassword - Step 2: User resets password with token
func (h *PasswordResetHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Token == "" || req.NewPassword == "" {
		respondError(w, http.StatusBadRequest, "Token and new password are required")
		return
	}

	if len(req.NewPassword) < 12 {
		respondError(w, http.StatusBadRequest, "Password must be at least 12 characters")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Verify token
	var tokenID, userID uuid.UUID
	var expiresAt time.Time
	var isUsed bool

	tokenQuery := `
		SELECT id, user_id, expires_at, is_used
		FROM password_reset_tokens
		WHERE token = $1
	`

	err := h.db.Pool.QueryRow(ctx, tokenQuery, req.Token).Scan(&tokenID, &userID, &expiresAt, &isUsed)
	if err != nil {
		h.logger.Warn("Invalid reset token", zap.String("token", req.Token[:10]+"..."))
		respondError(w, http.StatusUnauthorized, "Invalid or expired reset token")
		return
	}

	// Check if token is used
	if isUsed {
		respondError(w, http.StatusUnauthorized, "Reset token has already been used")
		return
	}

	// Check if token is expired
	if time.Now().After(expiresAt) {
		respondError(w, http.StatusUnauthorized, "Reset token has expired")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		h.logger.Error("Failed to hash password", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Begin transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}
	defer tx.Rollback(ctx)

	// Update password
	updateQuery := `
		UPDATE users
		SET password_hash = $1, updated_at = NOW(), failed_login_attempts = 0
		WHERE id = $2
	`
	_, err = tx.Exec(ctx, updateQuery, hashedPassword, userID)
	if err != nil {
		h.logger.Error("Failed to update password", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Mark token as used
	markUsedQuery := `
		UPDATE password_reset_tokens
		SET is_used = TRUE, used_at = NOW()
		WHERE id = $1
	`
	_, err = tx.Exec(ctx, markUsedQuery, tokenID)
	if err != nil {
		h.logger.Error("Failed to mark token as used", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Invalidate all existing sessions for security
	invalidateSessionsQuery := `
		UPDATE user_sessions
		SET is_active = FALSE
		WHERE user_id = $1
	`
	tx.Exec(ctx, invalidateSessionsQuery, userID)

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	h.logger.Info("Password reset successful",
		zap.String("user_id", userID.String()),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Password reset successfully",
	})
}

// VerifyEmail - Verify user's email address
func (h *PasswordResetHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		respondError(w, http.StatusBadRequest, "Verification token is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Verify token
	var tokenID, userID uuid.UUID
	var email string
	var expiresAt time.Time
	var isVerified bool

	tokenQuery := `
		SELECT id, user_id, email, expires_at, is_verified
		FROM email_verification_tokens
		WHERE token = $1
	`

	err := h.db.Pool.QueryRow(ctx, tokenQuery, token).Scan(&tokenID, &userID, &email, &expiresAt, &isVerified)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid verification token")
		return
	}

	if isVerified {
		respondError(w, http.StatusConflict, "Email already verified")
		return
	}

	if time.Now().After(expiresAt) {
		respondError(w, http.StatusUnauthorized, "Verification token has expired")
		return
	}

	// Begin transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Verification failed")
		return
	}
	defer tx.Rollback(ctx)

	// Mark user as verified
	updateUserQuery := `
		UPDATE users
		SET email_verified = TRUE, updated_at = NOW()
		WHERE id = $1
	`
	_, err = tx.Exec(ctx, updateUserQuery, userID)
	if err != nil {
		h.logger.Error("Failed to update user", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Verification failed")
		return
	}

	// Mark token as verified
	updateTokenQuery := `
		UPDATE email_verification_tokens
		SET is_verified = TRUE, verified_at = NOW()
		WHERE id = $1
	`
	_, err = tx.Exec(ctx, updateTokenQuery, tokenID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Verification failed")
		return
	}

	// Commit
	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, "Verification failed")
		return
	}

	h.logger.Info("Email verified",
		zap.String("user_id", userID.String()),
		zap.String("email", email),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Email verified successfully",
	})
}

// SendVerificationEmail - Resend verification email
func (h *PasswordResetHandler) SendVerificationEmail(w http.ResponseWriter, r *http.Request) {
	// Get user from JWT claims
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Get user email
	var email string
	var emailVerified bool
	query := `SELECT email, email_verified FROM users WHERE id = $1`

	err := h.db.Pool.QueryRow(ctx, query, claims.UserID).Scan(&email, &emailVerified)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	if emailVerified {
		respondError(w, http.StatusConflict, "Email already verified")
		return
	}

	// Generate token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}
	token := base64.URLEncoding.EncodeToString(tokenBytes)

	// Store token
	insertQuery := `
		INSERT INTO email_verification_tokens (user_id, token, email, expires_at, ip_address)
		VALUES ($1, $2, $3, $4, $5)
	`
	expiresAt := time.Now().Add(24 * time.Hour)
	_, err = h.db.Pool.Exec(ctx, insertQuery, claims.UserID, token, email, expiresAt, r.RemoteAddr)
	if err != nil {
		h.logger.Error("Failed to store verification token", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to send verification email")
		return
	}

	// Update user record
	h.db.Pool.Exec(ctx, `UPDATE users SET email_verification_sent_at = NOW() WHERE id = $1`, claims.UserID)

	// TODO: Send email
	// verifyLink := fmt.Sprintf("https://bitcurrent.co.uk/auth/verify-email?token=%s", token)
	// sendEmail(email, "Verify Your Email", verifyLink)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Verification email sent",
	})
}
