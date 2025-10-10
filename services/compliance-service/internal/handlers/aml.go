// BitCurrent Exchange - AML Handler
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"go.uber.org/zap"
)

type AMLHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewAMLHandler(db *database.PostgresDB, logger *zap.Logger) *AMLHandler {
	return &AMLHandler{
		db:     db,
		logger: logger,
	}
}

type CheckTransactionRequest struct {
	UserID          string `json:"user_id"`
	AccountID       string `json:"account_id"`
	TransactionType string `json:"transaction_type"`
	Currency        string `json:"currency"`
	Amount          string `json:"amount"`
	Address         string `json:"address,omitempty"`
}

type CheckTransactionResponse struct {
	Approved  bool     `json:"approved"`
	Flags     []string `json:"flags,omitempty"`
	RiskScore int      `json:"risk_score"`
	Message   string   `json:"message"`
}

func (h *AMLHandler) CheckTransaction(w http.ResponseWriter, r *http.Request) {
	var req CheckTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Initialize response
	response := CheckTransactionResponse{
		Approved:  true,
		RiskScore: 0,
		Flags:     []string{},
	}

	// TODO: Integrate with Chainalysis API for address screening

	// Check daily transaction volume
	dailyVolume, err := h.getDailyVolume(ctx, req.AccountID)
	if err != nil {
		h.logger.Error("Failed to get daily volume", zap.Error(err))
	}

	// Simple rule: Flag high-value transactions for manual review
	// TODO: Use dailyVolume for velocity checks
	_ = dailyVolume // Placeholder until velocity checks implemented
	// TODO: Implement proper decimal comparison
	const highValueThreshold = "10000" // £10,000

	if req.Amount > highValueThreshold {
		response.Flags = append(response.Flags, "high_value_transaction")
		response.RiskScore += 30
	}

	// Check for rapid succession of transactions (structuring)
	recentCount, err := h.getRecentTransactionCount(ctx, req.AccountID)
	if err != nil {
		h.logger.Error("Failed to get recent transaction count", zap.Error(err))
	}

	if recentCount > 5 {
		response.Flags = append(response.Flags, "rapid_transactions")
		response.RiskScore += 20
	}

	// Risk score threshold
	if response.RiskScore >= 50 {
		response.Approved = false
		response.Message = "Transaction flagged for manual review"

		h.logger.Warn("Transaction flagged",
			zap.String("user_id", req.UserID),
			zap.Int("risk_score", response.RiskScore),
			zap.Strings("flags", response.Flags),
		)
	} else {
		response.Message = "Transaction approved"
	}

	h.logger.Info("AML check completed",
		zap.String("user_id", req.UserID),
		zap.Bool("approved", response.Approved),
		zap.Int("risk_score", response.RiskScore),
	)

	respondJSON(w, http.StatusOK, response)
}

func (h *AMLHandler) GetAlerts(w http.ResponseWriter, r *http.Request) {
	// TODO: Query AML alerts from database
	// For now, return empty list

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"alerts": []interface{}{},
		"count":  0,
	})
}

func (h *AMLHandler) getDailyVolume(ctx context.Context, accountID string) (string, error) {
	var volume string
	query := `
		SELECT COALESCE(SUM(quantity * price), 0)
		FROM trades
		WHERE (buyer_account_id = $1 OR seller_account_id = $1)
		  AND executed_at > CURRENT_DATE
	`

	err := h.db.Pool.QueryRow(ctx, query, accountID).Scan(&volume)
	return volume, err
}

func (h *AMLHandler) getRecentTransactionCount(ctx context.Context, accountID string) (int, error) {
	var count int
	query := `
		SELECT COUNT(*)
		FROM ledger_entries
		WHERE account_id = $1
		  AND created_at > NOW() - INTERVAL '1 hour'
	`

	err := h.db.Pool.QueryRow(ctx, query, accountID).Scan(&count)
	return count, err
}
