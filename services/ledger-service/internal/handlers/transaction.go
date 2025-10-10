// BitCurrent Exchange - Transaction Handler
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type TransactionHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewTransactionHandler(db *database.PostgresDB, logger *zap.Logger) *TransactionHandler {
	return &TransactionHandler{
		db:     db,
		logger: logger,
	}
}

type Transaction struct {
	ID            string  `json:"id"`
	AccountID     string  `json:"account_id"`
	Currency      string  `json:"currency"`
	Amount        string  `json:"amount"`
	BalanceAfter  string  `json:"balance_after"`
	EntryType     string  `json:"entry_type"`
	ReferenceID   *string `json:"reference_id,omitempty"`
	ReferenceType *string `json:"reference_type,omitempty"`
	Description   string  `json:"description,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

type CreateTransactionRequest struct {
	AccountID     string  `json:"account_id"`
	Currency      string  `json:"currency"`
	Amount        string  `json:"amount"`
	EntryType     string  `json:"entry_type"`
	ReferenceID   *string `json:"reference_id,omitempty"`
	ReferenceType *string `json:"reference_type,omitempty"`
	Description   string  `json:"description,omitempty"`
}

func (h *TransactionHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	var req CreateTransactionRequest
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

	// Begin transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to begin transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}
	defer tx.Rollback(ctx)

	// Get current balance
	var currentBalance string
	balanceQuery := `SELECT balance FROM wallets WHERE account_id = $1 AND currency = $2 FOR UPDATE`
	err = tx.QueryRow(ctx, balanceQuery, req.AccountID, req.Currency).Scan(&currentBalance)
	if err != nil {
		respondError(w, http.StatusNotFound, "Wallet not found")
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
	var transactionID string
	ledgerQuery := `
		INSERT INTO ledger_entries (
			account_id, currency, amount, balance_after,
			entry_type, reference_id, reference_type, description
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id
	`

	err = tx.QueryRow(
		ctx, ledgerQuery,
		req.AccountID, req.Currency, req.Amount, newBalance,
		req.EntryType, req.ReferenceID, req.ReferenceType, req.Description,
	).Scan(&transactionID)

	if err != nil {
		h.logger.Error("Failed to create ledger entry", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to create transaction")
		return
	}

	h.logger.Info("Transaction created",
		zap.String("transaction_id", transactionID),
		zap.String("account_id", req.AccountID),
		zap.String("amount", req.Amount),
	)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"transaction_id": transactionID,
		"new_balance":    newBalance,
	})
}

func (h *TransactionHandler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	accountID := vars["account_id"]

	// Parse query parameters
	currency := r.URL.Query().Get("currency")
	entryType := r.URL.Query().Get("entry_type")
	limit := 50
	offset := 0

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, account_id, currency, amount, balance_after,
		       entry_type, reference_id, reference_type, description, created_at
		FROM ledger_entries
		WHERE account_id = $1
	`
	args := []interface{}{accountID}
	argCount := 1

	if currency != "" {
		argCount++
		query += fmt.Sprintf(" AND currency = $%d", argCount)
		args = append(args, currency)
	}

	if entryType != "" {
		argCount++
		query += fmt.Sprintf(" AND entry_type = $%d", argCount)
		args = append(args, entryType)
	}

	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount+1, argCount+2)
	args = append(args, limit, offset)

	rows, err := h.db.Pool.Query(ctx, query, args...)
	if err != nil {
		h.logger.Error("Failed to query transactions", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch transactions")
		return
	}
	defer rows.Close()

	var transactions []Transaction
	for rows.Next() {
		var tx Transaction
		var createdAt time.Time
		var description *string

		err := rows.Scan(
			&tx.ID, &tx.AccountID, &tx.Currency, &tx.Amount, &tx.BalanceAfter,
			&tx.EntryType, &tx.ReferenceID, &tx.ReferenceType, &description, &createdAt,
		)
		if err != nil {
			h.logger.Error("Failed to scan transaction", zap.Error(err))
			continue
		}

		if description != nil {
			tx.Description = *description
		}
		tx.CreatedAt = createdAt.Format(time.RFC3339)
		transactions = append(transactions, tx)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"transactions": transactions,
		"limit":        limit,
		"offset":       offset,
	})
}
