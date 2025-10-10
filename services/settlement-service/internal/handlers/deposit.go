// BitCurrent Exchange - Deposit Handler
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

type DepositHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewDepositHandler(db *database.PostgresDB, logger *zap.Logger) *DepositHandler {
	return &DepositHandler{
		db:     db,
		logger: logger,
	}
}

type GenerateAddressRequest struct {
	AccountID string `json:"account_id"`
	Currency  string `json:"currency"`
	Network   string `json:"network,omitempty"`
}

type GenerateAddressResponse struct {
	Address string `json:"address"`
	Network string `json:"network"`
	Message string `json:"message"`
}

func (h *DepositHandler) GenerateAddress(w http.ResponseWriter, r *http.Request) {
	var req GenerateAddressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.AccountID == "" || req.Currency == "" {
		respondError(w, http.StatusBadRequest, "Account ID and currency are required")
		return
	}

	// TODO: Generate actual deposit address based on currency
	// For BTC: Use Bitcoin Core RPC or HD wallet derivation
	// For ETH: Use go-ethereum to derive address
	// For now, generate a mock address

	var address string
	switch req.Currency {
	case "BTC":
		address = fmt.Sprintf("bc1q%s", generateMockHash(28))
		if req.Network == "" {
			req.Network = "bitcoin"
		}
	case "ETH", "MATIC":
		address = fmt.Sprintf("0x%s", generateMockHash(40))
		if req.Network == "" {
			req.Network = "ethereum"
		}
	default:
		respondError(w, http.StatusBadRequest, "Unsupported currency")
		return
	}

	h.logger.Info("Deposit address generated",
		zap.String("account_id", req.AccountID),
		zap.String("currency", req.Currency),
		zap.String("address", address),
	)

	respondJSON(w, http.StatusOK, GenerateAddressResponse{
		Address: address,
		Network: req.Network,
		Message: "Deposit address generated successfully",
	})
}

type ProcessDepositRequest struct {
	AccountID     string `json:"account_id"`
	Currency      string `json:"currency"`
	Amount        string `json:"amount"`
	TxID          string `json:"txid"`
	Address       string `json:"address"`
	Network       string `json:"network"`
	Confirmations int    `json:"confirmations"`
}

func (h *DepositHandler) ProcessDeposit(w http.ResponseWriter, r *http.Request) {
	var req ProcessDepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Check required confirmations
	requiredConf := 6 // Default for BTC
	if req.Currency == "ETH" {
		requiredConf = 12
	}

	status := "pending"
	if req.Confirmations >= requiredConf {
		status = "confirmed"
	}

	// Insert or update deposit record
	var depositID uuid.UUID
	query := `
		INSERT INTO deposits (
			account_id, currency, amount, address, txid, network,
			confirmations, required_confirmations, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (txid) DO UPDATE
		SET confirmations = $7, status = $9, updated_at = NOW()
		RETURNING id
	`

	err := h.db.Pool.QueryRow(
		ctx, query,
		req.AccountID, req.Currency, req.Amount, req.Address, req.TxID,
		req.Network, req.Confirmations, requiredConf, status,
	).Scan(&depositID)

	if err != nil {
		h.logger.Error("Failed to process deposit", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to process deposit")
		return
	}

	// If confirmed, credit the account
	if status == "confirmed" {
		// TODO: Call ledger service to credit balance
		// TODO: Update deposit status to 'credited'
		h.logger.Info("Deposit confirmed and credited",
			zap.String("deposit_id", depositID.String()),
			zap.String("account_id", req.AccountID),
			zap.String("amount", req.Amount),
		)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"deposit_id":    depositID.String(),
		"status":        status,
		"confirmations": req.Confirmations,
		"required":      requiredConf,
	})
}

func (h *DepositHandler) GetDeposit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	depositID := vars["id"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var deposit struct {
		ID            string `json:"id"`
		AccountID     string `json:"account_id"`
		Currency      string `json:"currency"`
		Amount        string `json:"amount"`
		TxID          string `json:"txid"`
		Confirmations int    `json:"confirmations"`
		Required      int    `json:"required_confirmations"`
		Status        string `json:"status"`
		CreatedAt     string `json:"created_at"`
	}
	var createdAt time.Time

	query := `
		SELECT id, account_id, currency, amount, txid, confirmations,
		       required_confirmations, status, created_at
		FROM deposits
		WHERE id = $1
	`

	err := h.db.Pool.QueryRow(ctx, query, depositID).Scan(
		&deposit.ID, &deposit.AccountID, &deposit.Currency, &deposit.Amount,
		&deposit.TxID, &deposit.Confirmations, &deposit.Required,
		&deposit.Status, &createdAt,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "Deposit not found")
		return
	}

	deposit.CreatedAt = createdAt.Format(time.RFC3339)

	respondJSON(w, http.StatusOK, deposit)
}

// Helper function to generate mock hash
func generateMockHash(length int) string {
	chars := "0123456789abcdef"
	result := ""
	for i := 0; i < length; i++ {
		result += string(chars[i%len(chars)])
	}
	return result
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
