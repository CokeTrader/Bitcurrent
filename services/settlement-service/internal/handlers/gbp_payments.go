// BitCurrent Exchange - GBP Payment Handlers
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/settlement-service/internal/banking"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type GBPPaymentHandler struct {
	db        *database.PostgresDB
	clearbank *banking.ClearBankClient
	modulr    *banking.ModulrClient
	verifier  *banking.AccountVerifier
	logger    *zap.Logger
}

func NewGBPPaymentHandler(
	db *database.PostgresDB,
	clearbank *banking.ClearBankClient,
	modulr *banking.ModulrClient,
	verifier *banking.AccountVerifier,
	logger *zap.Logger,
) *GBPPaymentHandler {
	return &GBPPaymentHandler{
		db:        db,
		clearbank: clearbank,
		modulr:    modulr,
		verifier:  verifier,
		logger:    logger,
	}
}

type InitiateGBPDepositRequest struct {
	AccountID string  `json:"account_id"`
	Amount    float64 `json:"amount"`
}

type InitiateGBPDepositResponse struct {
	DepositID    string      `json:"deposit_id"`
	Reference    string      `json:"reference"`
	Amount       float64     `json:"amount"`
	BankDetails  BankDetails `json:"bank_details"`
	Instructions string      `json:"instructions"`
}

type BankDetails struct {
	AccountName   string `json:"account_name"`
	SortCode      string `json:"sort_code"`
	AccountNumber string `json:"account_number"`
	BankName      string `json:"bank_name"`
}

func (h *GBPPaymentHandler) InitiateGBPDeposit(w http.ResponseWriter, r *http.Request) {
	var req InitiateGBPDepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Amount <= 0 {
		respondError(w, http.StatusBadRequest, "Amount must be positive")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Create deposit record
	var depositID uuid.UUID
	amountStr := fmt.Sprintf("%.2f", req.Amount)
	query := `
		INSERT INTO deposits (account_id, currency, amount, status)
		VALUES ($1, 'GBP', $2, 'pending')
		RETURNING id
	`

	err := h.db.Pool.QueryRow(ctx, query, req.AccountID, amountStr).Scan(&depositID)
	if err != nil {
		h.logger.Error("Failed to create deposit", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to initiate deposit")
		return
	}

	// Generate payment reference
	reference := h.verifier.GenerateDepositReference(depositID)

	h.logger.Info("GBP deposit initiated",
		zap.String("deposit_id", depositID.String()),
		zap.String("reference", reference),
		zap.Float64("amount", req.Amount),
	)

	// Return bank details for transfer
	respondJSON(w, http.StatusCreated, InitiateGBPDepositResponse{
		DepositID: depositID.String(),
		Reference: reference,
		Amount:    req.Amount,
		BankDetails: BankDetails{
			AccountName:   "BitCurrent Exchange Ltd",
			SortCode:      "04-00-75", // ClearBank sort code
			AccountNumber: "12345678", // TODO: Use real safeguarding account
			BankName:      "ClearBank Limited",
		},
		Instructions: fmt.Sprintf("Transfer £%.2f to the account above using reference: %s", req.Amount, reference),
	})
}

type ProcessGBPWithdrawalRequest struct {
	WithdrawalID  string `json:"withdrawal_id"`
	SortCode      string `json:"sort_code"`
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
}

func (h *GBPPaymentHandler) ProcessGBPWithdrawal(w http.ResponseWriter, r *http.Request) {
	var req ProcessGBPWithdrawalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate bank account details
	bankDetails := banking.BankAccountDetails{
		AccountName:   req.AccountName,
		SortCode:      req.SortCode,
		AccountNumber: req.AccountNumber,
	}

	if err := h.verifier.ValidateBankAccount(bankDetails); err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	// Get withdrawal details
	var withdrawal struct {
		ID        uuid.UUID
		AccountID uuid.UUID
		Amount    string
		Status    string
	}

	query := `
		SELECT id, account_id, amount, status
		FROM withdrawals
		WHERE id = $1 AND currency = 'GBP'
	`

	err := h.db.Pool.QueryRow(ctx, query, req.WithdrawalID).Scan(
		&withdrawal.ID, &withdrawal.AccountID, &withdrawal.Amount, &withdrawal.Status,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "Withdrawal not found")
		return
	}

	if withdrawal.Status != "approved" {
		respondError(w, http.StatusBadRequest, "Withdrawal not approved")
		return
	}

	// Convert amount to float
	var amount float64
	fmt.Sscanf(withdrawal.Amount, "%f", &amount)

	// Send Faster Payment via ClearBank
	fpReq := banking.FasterPaymentRequest{
		EndToEndID:            withdrawal.ID.String(),
		Reference:             fmt.Sprintf("BitCurrent Withdrawal"),
		Amount:                amount,
		CreditorAccountName:   req.AccountName,
		CreditorSortCode:      req.SortCode,
		CreditorAccountNumber: req.AccountNumber,
	}

	fpResp, err := h.clearbank.SendFasterPayment(ctx, fpReq)
	if err != nil {
		h.logger.Error("Failed to send Faster Payment", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to process withdrawal")
		return
	}

	// Update withdrawal status
	updateQuery := `
		UPDATE withdrawals
		SET status = 'processing',
		    txid = $1,
		    processed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`

	_, err = h.db.Pool.Exec(ctx, updateQuery, fpResp.TransactionID, withdrawal.ID)
	if err != nil {
		h.logger.Error("Failed to update withdrawal", zap.Error(err))
	}

	h.logger.Info("GBP withdrawal processed",
		zap.String("withdrawal_id", withdrawal.ID.String()),
		zap.String("bank_tx_id", fpResp.TransactionID),
	)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":        true,
		"transaction_id": fpResp.TransactionID,
		"status":         fpResp.Status,
		"message":        "Withdrawal is being processed via Faster Payments",
	})
}

// InstantDepositRequest represents an instant deposit via Open Banking
type InstantDepositRequest struct {
	AccountID string  `json:"account_id"`
	Amount    float64 `json:"amount"`
}

func (h *GBPPaymentHandler) InitiateInstantDeposit(w http.ResponseWriter, r *http.Request) {
	var req InstantDepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Create deposit record
	var depositID uuid.UUID
	amountStr := fmt.Sprintf("%.2f", req.Amount)
	query := `
		INSERT INTO deposits (account_id, currency, amount, status)
		VALUES ($1, 'GBP', $2, 'pending')
		RETURNING id
	`

	err := h.db.Pool.QueryRow(ctx, query, req.AccountID, amountStr).Scan(&depositID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create deposit")
		return
	}

	// Generate reference
	reference := h.verifier.GenerateDepositReference(depositID)

	// Create TrueLayer payment request (requires user's access token)
	// This would redirect user to their bank to authorize the payment
	// For now, return deposit ID and instructions

	h.logger.Info("Instant deposit initiated",
		zap.String("deposit_id", depositID.String()),
		zap.Float64("amount", req.Amount),
	)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"deposit_id": depositID.String(),
		"reference":  reference,
		"amount":     req.Amount,
		"type":       "instant_deposit",
		"next_step":  "Redirect to Open Banking for authorization",
	})
}
