// BitCurrent Exchange - Balance Handler
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

type BalanceHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewBalanceHandler(db *database.PostgresDB, logger *zap.Logger) *BalanceHandler {
	return &BalanceHandler{
		db:     db,
		logger: logger,
	}
}

type Balance struct {
	Currency         string `json:"currency"`
	Balance          string `json:"balance"`
	AvailableBalance string `json:"available_balance"`
	ReservedBalance  string `json:"reserved_balance"`
}

func (h *BalanceHandler) GetBalances(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	accountID := vars["account_id"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT currency, balance, available_balance, reserved_balance
		FROM wallets
		WHERE account_id = $1
		ORDER BY currency
	`

	rows, err := h.db.Pool.Query(ctx, query, accountID)
	if err != nil {
		h.logger.Error("Failed to query balances", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch balances")
		return
	}
	defer rows.Close()

	var balances []Balance
	for rows.Next() {
		var balance Balance
		if err := rows.Scan(&balance.Currency, &balance.Balance, &balance.AvailableBalance, &balance.ReservedBalance); err != nil {
			h.logger.Error("Failed to scan balance", zap.Error(err))
			continue
		}
		balances = append(balances, balance)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"balances": balances,
	})
}

func (h *BalanceHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	accountID := vars["account_id"]
	currency := vars["currency"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var balance Balance
	query := `
		SELECT currency, balance, available_balance, reserved_balance
		FROM wallets
		WHERE account_id = $1 AND currency = $2
	`

	err := h.db.Pool.QueryRow(ctx, query, accountID, currency).Scan(
		&balance.Currency,
		&balance.Balance,
		&balance.AvailableBalance,
		&balance.ReservedBalance,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusNotFound, "Wallet not found")
		} else {
			h.logger.Error("Failed to query balance", zap.Error(err))
			respondError(w, http.StatusInternalServerError, "Failed to fetch balance")
		}
		return
	}

	respondJSON(w, http.StatusOK, balance)
}

type ReserveBalanceRequest struct {
	AccountID string `json:"account_id"`
	Currency  string `json:"currency"`
	Amount    string `json:"amount"`
	Reference string `json:"reference"`
}

func (h *BalanceHandler) ReserveBalance(w http.ResponseWriter, r *http.Request) {
	var req ReserveBalanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AccountID == "" || req.Currency == "" || req.Amount == "" {
		respondError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Begin transaction for atomic balance update
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to begin transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reserve balance")
		return
	}
	defer tx.Rollback(ctx)

	// Lock wallet row for update
	var availableBalance string
	lockQuery := `
		SELECT available_balance
		FROM wallets
		WHERE account_id = $1 AND currency = $2
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, lockQuery, req.AccountID, req.Currency).Scan(&availableBalance)
	if err != nil {
		respondError(w, http.StatusNotFound, "Wallet not found")
		return
	}

	// TODO: Check if available_balance >= amount (requires decimal comparison)

	// Update balances (move from available to reserved)
	updateQuery := `
		UPDATE wallets
		SET available_balance = available_balance - $1,
		    reserved_balance = reserved_balance + $1,
		    updated_at = NOW()
		WHERE account_id = $2 AND currency = $3
	`

	_, err = tx.Exec(ctx, updateQuery, req.Amount, req.AccountID, req.Currency)
	if err != nil {
		h.logger.Error("Failed to update balances", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reserve balance")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reserve balance")
		return
	}

	h.logger.Info("Balance reserved",
		zap.String("account_id", req.AccountID),
		zap.String("currency", req.Currency),
		zap.String("amount", req.Amount),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Balance reserved successfully",
	})
}

type ReleaseBalanceRequest struct {
	AccountID string `json:"account_id"`
	Currency  string `json:"currency"`
	Amount    string `json:"amount"`
	Reference string `json:"reference"`
}

func (h *BalanceHandler) ReleaseBalance(w http.ResponseWriter, r *http.Request) {
	var req ReleaseBalanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Begin transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to begin transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to release balance")
		return
	}
	defer tx.Rollback(ctx)

	// Update balances (move from reserved to available)
	updateQuery := `
		UPDATE wallets
		SET reserved_balance = reserved_balance - $1,
		    available_balance = available_balance + $1,
		    updated_at = NOW()
		WHERE account_id = $2 AND currency = $3
	`

	_, err = tx.Exec(ctx, updateQuery, req.Amount, req.AccountID, req.Currency)
	if err != nil {
		h.logger.Error("Failed to update balances", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to release balance")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to release balance")
		return
	}

	h.logger.Info("Balance released",
		zap.String("account_id", req.AccountID),
		zap.String("currency", req.Currency),
		zap.String("amount", req.Amount),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Balance released successfully",
	})
}

type UpdateBalanceRequest struct {
	AccountID     string  `json:"account_id"`
	Currency      string  `json:"currency"`
	Amount        string  `json:"amount"`
	EntryType     string  `json:"entry_type"`
	ReferenceID   *string `json:"reference_id,omitempty"`
	ReferenceType *string `json:"reference_type,omitempty"`
	Description   string  `json:"description,omitempty"`
}

func (h *BalanceHandler) UpdateBalance(w http.ResponseWriter, r *http.Request) {
	var req UpdateBalanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AccountID == "" || req.Currency == "" || req.Amount == "" || req.EntryType == "" {
		respondError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Begin transaction for double-entry accounting
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to begin transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to update balance")
		return
	}
	defer tx.Rollback(ctx)

	// Lock wallet row
	var currentBalance string
	lockQuery := `SELECT balance FROM wallets WHERE account_id = $1 AND currency = $2 FOR UPDATE`
	err = tx.QueryRow(ctx, lockQuery, req.AccountID, req.Currency).Scan(&currentBalance)
	if err != nil {
		if err == pgx.ErrNoRows {
			respondError(w, http.StatusNotFound, "Wallet not found")
		} else {
			h.logger.Error("Failed to lock wallet", zap.Error(err))
			respondError(w, http.StatusInternalServerError, "Failed to update balance")
		}
		return
	}

	// Update wallet balance
	updateQuery := `
		UPDATE wallets
		SET balance = balance + $1,
		    available_balance = available_balance + $1,
		    updated_at = NOW()
		WHERE account_id = $2 AND currency = $3
		RETURNING balance
	`

	var newBalance string
	err = tx.QueryRow(ctx, updateQuery, req.Amount, req.AccountID, req.Currency).Scan(&newBalance)
	if err != nil {
		h.logger.Error("Failed to update balance", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to update balance")
		return
	}

	// Create ledger entry
	ledgerQuery := `
		INSERT INTO ledger_entries (
			account_id, currency, amount, balance_after,
			entry_type, reference_id, reference_type, description
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	var ledgerID uuid.UUID
	err = tx.QueryRow(
		ctx, ledgerQuery,
		req.AccountID, req.Currency, req.Amount, newBalance,
		req.EntryType, req.ReferenceID, req.ReferenceType, req.Description,
	).Scan(&ledgerID)

	if err != nil {
		h.logger.Error("Failed to create ledger entry", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create ledger entry")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to update balance")
		return
	}

	h.logger.Info("Balance updated",
		zap.String("account_id", req.AccountID),
		zap.String("currency", req.Currency),
		zap.String("amount", req.Amount),
		zap.String("new_balance", newBalance),
		zap.String("ledger_id", ledgerID.String()),
	)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "Balance updated successfully",
		"new_balance": newBalance,
		"ledger_id":   ledgerID.String(),
	})
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error":   http.StatusText(status),
		"message": message,
	})
}
