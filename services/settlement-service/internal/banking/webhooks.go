// BitCurrent Exchange - Banking Webhooks Handler
package banking

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// WebhookHandler handles incoming webhooks from banking providers
type WebhookHandler struct {
	db             *database.PostgresDB
	clearbank      *ClearBankClient
	modulr         *ModulrClient
	reconciliation *PaymentReconciliationEngine
	logger         *zap.Logger
}

// NewWebhookHandler creates a new webhook handler
func NewWebhookHandler(
	db *database.PostgresDB,
	clearbank *ClearBankClient,
	modulr *ModulrClient,
	reconciliation *PaymentReconciliationEngine,
	logger *zap.Logger,
) *WebhookHandler {
	return &WebhookHandler{
		db:             db,
		clearbank:      clearbank,
		modulr:         modulr,
		reconciliation: reconciliation,
		logger:         logger,
	}
}

// ClearBankWebhookPayload represents a ClearBank webhook
type ClearBankWebhookPayload struct {
	Type          string    `json:"Type"`
	Nonce         string    `json:"Nonce"`
	Version       int       `json:"Version"`
	Timestamp     time.Time `json:"Timestamp"`
	TransactionID string    `json:"TransactionId"`
	Amount        float64   `json:"Amount"`
	Reference     string    `json:"Reference"`
	Direction     string    `json:"Direction"`
	Status        string    `json:"Status"`
}

// HandleClearBankWebhook processes ClearBank webhooks
func (h *WebhookHandler) HandleClearBankWebhook(w http.ResponseWriter, r *http.Request) {
	// Read body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		h.logger.Error("Failed to read webhook body", zap.Error(err))
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Validate signature
	signature := r.Header.Get("X-Clear-Signature")
	if !h.clearbank.ValidateWebhook(body, signature) {
		h.logger.Warn("Invalid webhook signature")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse payload
	var payload ClearBankWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		h.logger.Error("Failed to parse webhook", zap.Error(err))
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	h.logger.Info("Received ClearBank webhook",
		zap.String("type", payload.Type),
		zap.String("tx_id", payload.TransactionID),
		zap.String("direction", payload.Direction),
	)

	ctx := context.Background()

	// Process based on type
	switch payload.Type {
	case "Transaction.Created":
		if payload.Direction == "credit" {
			// Inbound payment (deposit)
			h.processInboundPayment(ctx, payload)
		} else if payload.Direction == "debit" {
			// Outbound payment (withdrawal confirmation)
			h.processOutboundPayment(ctx, payload)
		}

	case "Transaction.Settled":
		h.processSettledPayment(ctx, payload)

	default:
		h.logger.Info("Unhandled webhook type", zap.String("type", payload.Type))
	}

	// Return 200 OK
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "received"}`))
}

func (h *WebhookHandler) processInboundPayment(ctx context.Context, payload ClearBankWebhookPayload) {
	// Try to match with existing deposit by reference
	query := `
		SELECT id, account_id FROM deposits
		WHERE currency = 'GBP'
		  AND id::text = $1
		  AND status = 'pending'
		LIMIT 1
	`

	var depositID, accountID string
	err := h.db.Pool.QueryRow(ctx, query, payload.Reference).Scan(&depositID, &accountID)

	if err != nil {
		// No matching deposit, create one
		h.logger.Warn("Received payment with no matching deposit",
			zap.String("reference", payload.Reference),
			zap.Float64("amount", payload.Amount),
		)

		// TODO: Create deposit record or flag for manual review
		return
	}

	// Credit the deposit
	if err := h.reconciliation.creditGBPDeposit(ctx, uuid.MustParse(depositID), payload.TransactionID, payload.Amount); err != nil {
		h.logger.Error("Failed to credit deposit", zap.Error(err))
		return
	}

	h.logger.Info("Inbound payment processed",
		zap.String("deposit_id", depositID),
		zap.Float64("amount", payload.Amount),
	)
}

func (h *WebhookHandler) processOutboundPayment(ctx context.Context, payload ClearBankWebhookPayload) {
	// Match with withdrawal
	query := `
		SELECT id FROM withdrawals
		WHERE currency = 'GBP'
		  AND id::text = $1
		  AND status = 'processing'
		LIMIT 1
	`

	var withdrawalID string
	err := h.db.Pool.QueryRow(ctx, query, payload.Reference).Scan(&withdrawalID)

	if err != nil {
		h.logger.Warn("Received outbound payment with no matching withdrawal",
			zap.String("reference", payload.Reference),
		)
		return
	}

	// Complete withdrawal
	if err := h.reconciliation.completeGBPWithdrawal(ctx, uuid.MustParse(withdrawalID), payload.TransactionID); err != nil {
		h.logger.Error("Failed to complete withdrawal", zap.Error(err))
		return
	}

	h.logger.Info("Outbound payment processed",
		zap.String("withdrawal_id", withdrawalID),
	)
}

func (h *WebhookHandler) processSettledPayment(ctx context.Context, payload ClearBankWebhookPayload) {
	// Update transaction status to settled
	h.logger.Info("Payment settled",
		zap.String("tx_id", payload.TransactionID),
		zap.String("status", payload.Status),
	)

	// TODO: Update status in database if needed
}

// ModulrWebhookPayload represents a Modulr webhook
type ModulrWebhookPayload struct {
	Type      string    `json:"type"`
	ID        string    `json:"id"`
	Amount    float64   `json:"amount"`
	Reference string    `json:"reference"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// HandleModulrWebhook processes Modulr webhooks
func (h *WebhookHandler) HandleModulrWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// TODO: Validate webhook signature

	var payload ModulrWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	h.logger.Info("Received Modulr webhook",
		zap.String("type", payload.Type),
		zap.String("id", payload.ID),
	)

	// Process similar to ClearBank
	// ctx := context.Background() // TODO: Use context for database operations

	switch payload.Type {
	case "payment.inbound":
		// Process deposit
		h.logger.Info("Processing Modulr inbound payment")
		// TODO: Implement similar to ClearBank

	case "payment.outbound":
		// Process withdrawal confirmation
		h.logger.Info("Processing Modulr outbound payment")
		// TODO: Implement similar to ClearBank
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "received"}`))
}

// TrueLayerWebhookPayload represents a TrueLayer webhook
type TrueLayerWebhookPayload struct {
	Type      string `json:"type"`
	PaymentID string `json:"payment_id"`
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

// HandleTrueLayerWebhook processes TrueLayer webhooks
func (h *WebhookHandler) HandleTrueLayerWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	var payload TrueLayerWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	h.logger.Info("Received TrueLayer webhook",
		zap.String("type", payload.Type),
		zap.String("payment_id", payload.PaymentID),
		zap.String("status", payload.Status),
	)

	// Handle payment status updates
	switch payload.Status {
	case "executed":
		// Payment successful, credit account
		h.logger.Info("TrueLayer payment executed")
		// TODO: Match with deposit and credit

	case "failed":
		// Payment failed
		h.logger.Warn("TrueLayer payment failed", zap.String("payment_id", payload.PaymentID))
		// TODO: Update deposit status
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "received"}`))
}
