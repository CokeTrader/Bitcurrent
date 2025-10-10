// BitCurrent Exchange - Authentication Handlers
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db         *database.PostgresDB
	jwtManager *auth.JWTManager
	logger     *zap.Logger
}

func NewAuthHandler(db *database.PostgresDB, jwtManager *auth.JWTManager, logger *zap.Logger) *AuthHandler {
	return &AuthHandler{
		db:         db,
		jwtManager: jwtManager,
		logger:     logger,
	}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token        string   `json:"token"`
	RefreshToken string   `json:"refresh_token"`
	User         UserInfo `json:"user"`
}

type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

type UserInfo struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	KYCLevel int    `json:"kyc_level"`
	Status   string `json:"status"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Query user
	var userID, accountID uuid.UUID
	var email, passwordHash, status string
	var kycLevel int

	query := `
		SELECT u.id, u.email, u.password_hash, u.kyc_level, u.status, a.id as account_id
		FROM users u
		LEFT JOIN accounts a ON u.id = a.user_id AND a.account_type = 'spot'
		WHERE u.email = $1 AND u.status = 'active'
		LIMIT 1
	`

	err := h.db.Pool.QueryRow(ctx, query, req.Email).Scan(
		&userID, &email, &passwordHash, &kycLevel, &status, &accountID,
	)
	if err != nil {
		h.logger.Warn("Login failed - user not found",
			zap.String("email", req.Email),
			zap.Error(err),
		)
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		h.logger.Warn("Login failed - invalid password", zap.String("email", req.Email))
		respondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate tokens
	token, err := h.jwtManager.GenerateToken(userID, accountID, email, "user", kycLevel)
	if err != nil {
		h.logger.Error("Failed to generate token", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	refreshToken, err := h.jwtManager.GenerateToken(userID, accountID, email, "user", kycLevel)
	if err != nil {
		h.logger.Error("Failed to generate refresh token", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	// Update last login
	updateQuery := `UPDATE users SET last_login_at = NOW() WHERE id = $1`
	if _, err := h.db.Pool.Exec(ctx, updateQuery, userID); err != nil {
		h.logger.Warn("Failed to update last login", zap.Error(err))
	}

	h.logger.Info("User logged in", zap.String("user_id", userID.String()))

	respondJSON(w, http.StatusOK, LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User: UserInfo{
			ID:       userID.String(),
			Email:    email,
			KYCLevel: kycLevel,
			Status:   status,
		},
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		respondError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	if len(req.Password) < 12 {
		respondError(w, http.StatusBadRequest, "Password must be at least 12 characters")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		h.logger.Error("Failed to hash password", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Begin transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to begin transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}
	defer tx.Rollback(ctx)

	// Insert user
	var userID uuid.UUID
	userQuery := `
		INSERT INTO users (email, password_hash, first_name, last_name, kyc_level, status)
		VALUES ($1, $2, $3, $4, 0, 'active')
		RETURNING id
	`
	err = tx.QueryRow(ctx, userQuery, req.Email, hashedPassword, req.FirstName, req.LastName).Scan(&userID)
	if err != nil {
		h.logger.Error("Failed to create user", zap.Error(err))
		respondError(w, http.StatusConflict, "Email already exists")
		return
	}

	// Create spot account
	var accountID uuid.UUID
	accountQuery := `
		INSERT INTO accounts (user_id, account_type, status)
		VALUES ($1, 'spot', 'active')
		RETURNING id
	`
	err = tx.QueryRow(ctx, accountQuery, userID).Scan(&accountID)
	if err != nil {
		h.logger.Error("Failed to create account", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create account")
		return
	}

	// Create initial wallets
	walletQuery := `
		INSERT INTO wallets (account_id, currency, wallet_type, balance, available_balance, reserved_balance)
		VALUES 
			($1, 'GBP', 'fiat', 0, 0, 0),
			($1, 'BTC', 'hot', 0, 0, 0),
			($1, 'ETH', 'hot', 0, 0, 0)
	`
	if _, err := tx.Exec(ctx, walletQuery, accountID); err != nil {
		h.logger.Error("Failed to create wallets", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create wallets")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	h.logger.Info("User registered", zap.String("user_id", userID.String()))

	// Generate token for immediate login
	token, _ := h.jwtManager.GenerateToken(userID, accountID, req.Email, "user", 0)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"token": token,
		"user": UserInfo{
			ID:       userID.String(),
			Email:    req.Email,
			KYCLevel: 0,
			Status:   "active",
		},
	})
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	newToken, err := h.jwtManager.RefreshToken(req.RefreshToken)
	if err != nil {
		respondError(w, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"token": newToken,
	})
}

func (h *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var profile struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		KYCLevel  int    `json:"kyc_level"`
		Status    string `json:"status"`
		CreatedAt string `json:"created_at"`
	}

	query := `
		SELECT id, email, first_name, last_name, kyc_level, status, created_at
		FROM users
		WHERE id = $1
	`

	err := h.db.Pool.QueryRow(ctx, query, claims.UserID).Scan(
		&profile.ID,
		&profile.Email,
		&profile.FirstName,
		&profile.LastName,
		&profile.KYCLevel,
		&profile.Status,
		&profile.CreatedAt,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	respondJSON(w, http.StatusOK, profile)
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		UPDATE users
		SET first_name = $1, last_name = $2, updated_at = NOW()
		WHERE id = $3
	`

	_, err := h.db.Pool.Exec(ctx, query, req.FirstName, req.LastName, claims.UserID)
	if err != nil {
		h.logger.Error("Failed to update profile", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Profile updated successfully",
	})
}
