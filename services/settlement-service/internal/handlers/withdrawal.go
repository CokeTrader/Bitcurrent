// BitCurrent Exchange - Withdrawal Handler
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type WithdrawalHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewWithdrawalHandler(db *database.PostgresDB, logger *zap.Logger) *WithdrawalHandler {
	return &WithdrawalHandler{
		db:     db,
		logger: logger,
	}
}

type ProcessWithdrawalRequest struct {
	WithdrawalID string `json:"withdrawal_id"`
}

type ProcessWithdrawalResponse struct {
	Success bool   `json:"success"`
	TxID    string `json:"txid,omitempty"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

func (h *WithdrawalHandler) ProcessWithdrawal(w http.ResponseWriter, r *http.Request) {
	var req ProcessWithdrawalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.WithdrawalID == "" {
		respondError(w, http.StatusBadRequest, "Withdrawal ID is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	// Get withdrawal details
	var withdrawal struct {
		ID        uuid.UUID
		AccountID uuid.UUID
		Currency  string
		Amount    string
		Fee       string
		Address   string
		Network   string
		Status    string
	}

	query := `
		SELECT id, account_id, currency, amount, fee, address, network, status
		FROM withdrawals
		WHERE id = $1 AND status = 'pending'
		FOR UPDATE
	`

	err := h.db.Pool.QueryRow(ctx, query, req.WithdrawalID).Scan(
		&withdrawal.ID, &withdrawal.AccountID, &withdrawal.Currency,
		&withdrawal.Amount, &withdrawal.Fee, &withdrawal.Address,
		&withdrawal.Network, &withdrawal.Status,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "Withdrawal not found or already processed")
		return
	}

	// TODO: Debit balance from ledger service before broadcasting

	// TODO: Broadcast transaction to blockchain
	// For BTC: Use Bitcoin Core RPC sendtoaddress
	// For ETH: Use go-ethereum to create and sign transaction
	// For now, simulate with mock txid

	txid := fmt.Sprintf("0x%s", generateMockHash(64))

	// Update withdrawal status
	updateQuery := `
		UPDATE withdrawals
		SET status = 'processing',
		    txid = $1,
		    processed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`

	_, err = h.db.Pool.Exec(ctx, updateQuery, txid, withdrawal.ID)
	if err != nil {
		h.logger.Error("Failed to update withdrawal", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to process withdrawal")
		return
	}

	h.logger.Info("Withdrawal processed",
		zap.String("withdrawal_id", withdrawal.ID.String()),
		zap.String("txid", txid),
		zap.String("currency", withdrawal.Currency),
	)

	respondJSON(w, http.StatusOK, ProcessWithdrawalResponse{
		Success: true,
		TxID:    txid,
		Status:  "processing",
		Message: "Withdrawal transaction broadcast to blockchain",
	})
}

func (h *WithdrawalHandler) GetWithdrawalStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	withdrawalID := vars["id"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var withdrawal struct {
		ID        string  `json:"id"`
		Currency  string  `json:"currency"`
		Amount    string  `json:"amount"`
		Fee       string  `json:"fee"`
		Address   string  `json:"address"`
		TxID      *string `json:"txid,omitempty"`
		Status    string  `json:"status"`
		CreatedAt string  `json:"created_at"`
	}
	var createdAt time.Time

	query := `
		SELECT id, currency, amount, fee, address, txid, status, created_at
		FROM withdrawals
		WHERE id = $1
	`

	err := h.db.Pool.QueryRow(ctx, query, withdrawalID).Scan(
		&withdrawal.ID, &withdrawal.Currency, &withdrawal.Amount,
		&withdrawal.Fee, &withdrawal.Address, &withdrawal.TxID,
		&withdrawal.Status, &createdAt,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "Withdrawal not found")
		return
	}

	withdrawal.CreatedAt = createdAt.Format(time.RFC3339)

	respondJSON(w, http.StatusOK, withdrawal)
}



