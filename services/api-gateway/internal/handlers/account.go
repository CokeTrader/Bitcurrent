// BitCurrent Exchange - Account Handlers
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type AccountHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewAccountHandler(db *database.PostgresDB, logger *zap.Logger) *AccountHandler {
	return &AccountHandler{
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

type Transaction struct {
	ID            string `json:"id"`
	Currency      string `json:"currency"`
	Amount        string `json:"amount"`
	BalanceAfter  string `json:"balance_after"`
	EntryType     string `json:"entry_type"`
	Description   string `json:"description,omitempty"`
	CreatedAt     string `json:"created_at"`
}

func (h *AccountHandler) GetBalances(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	vars := mux.Vars(r)
	accountID := vars["id"]

	// Verify ownership
	if accountID != claims.AccountID.String() {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT currency, balance, available_balance, reserved_balance
		FROM wallets
		WHERE account_id = $1
		ORDER BY currency
	`

	rows, err := h.db.Pool.Query(ctx, query, claims.AccountID)
	if err != nil {
		h.logger.Error("Failed to query balances", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch balances")
		return
	}
	defer rows.Close()

	var balances []Balance
	for rows.Next() {
		var balance Balance
		err := rows.Scan(
			&balance.Currency,
			&balance.Balance,
			&balance.AvailableBalance,
			&balance.ReservedBalance,
		)
		if err != nil {
			h.logger.Error("Failed to scan balance", zap.Error(err))
			continue
		}
		balances = append(balances, balance)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"balances": balances,
	})
}

func (h *AccountHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	vars := mux.Vars(r)
	accountID := vars["id"]

	// Verify ownership
	if accountID != claims.AccountID.String() {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	pagination := ParsePaginationParams(r)
	currency := r.URL.Query().Get("currency")

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	query := `
		SELECT id, currency, amount, balance_after, entry_type, description, created_at
		FROM ledger_entries
		WHERE account_id = $1
	`
	args := []interface{}{claims.AccountID}

	if currency != "" {
		query += " AND currency = $2"
		args = append(args, currency)
		query += " ORDER BY created_at DESC LIMIT $3 OFFSET $4"
		args = append(args, pagination.Limit, pagination.Offset)
	} else {
		query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3"
		args = append(args, pagination.Limit, pagination.Offset)
	}

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
			&tx.ID, &tx.Currency, &tx.Amount, &tx.BalanceAfter,
			&tx.EntryType, &description, &createdAt,
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
		"page":         pagination.Page,
		"limit":        pagination.Limit,
	})
}

type DepositRequest struct {
	Currency string `json:"currency"`
	Amount   string `json:"amount"`
}

func (h *AccountHandler) InitiateDeposit(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	var req DepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Currency == "" || req.Amount == "" {
		respondError(w, http.StatusBadRequest, "Currency and amount are required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// TODO: For crypto, generate deposit address via settlement service
	// TODO: For fiat (GBP), generate reference code and return bank details

	// Create deposit record
	var depositID string
	query := `
		INSERT INTO deposits (account_id, currency, amount, status)
		VALUES ($1, $2, $3, 'pending')
		RETURNING id
	`

	err := h.db.Pool.QueryRow(ctx, query, claims.AccountID, req.Currency, req.Amount).Scan(&depositID)
	if err != nil {
		h.logger.Error("Failed to create deposit", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to initiate deposit")
		return
	}

	h.logger.Info("Deposit initiated",
		zap.String("deposit_id", depositID),
		zap.String("account_id", claims.AccountID.String()),
		zap.String("currency", req.Currency),
	)

	response := map[string]interface{}{
		"deposit_id": depositID,
		"currency":   req.Currency,
		"amount":     req.Amount,
		"status":     "pending",
	}

	// Add currency-specific instructions
	if req.Currency == "GBP" {
		response["instructions"] = map[string]string{
			"account_number": "12345678",
			"sort_code":      "12-34-56",
			"reference":      depositID,
			"bank_name":      "ClearBank Ltd",
		}
	} else {
		// For crypto, would include deposit address
		response["address"] = "0x..." // TODO: Generate real address
	}

	respondJSON(w, http.StatusCreated, response)
}

type WithdrawalRequest struct {
	Currency string `json:"currency"`
	Amount   string `json:"amount"`
	Address  string `json:"address,omitempty"`
}

func (h *AccountHandler) RequestWithdrawal(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)

	var req WithdrawalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Currency == "" || req.Amount == "" {
		respondError(w, http.StatusBadRequest, "Currency and amount are required")
		return
	}

	// For crypto withdrawals, address is required
	if req.Currency != "GBP" && req.Address == "" {
		respondError(w, http.StatusBadRequest, "Address is required for crypto withdrawals")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// TODO: Check available balance
	// TODO: Call compliance service for AML checks
	// TODO: Apply daily/monthly withdrawal limits

	// Create withdrawal record
	var withdrawalID string
	query := `
		INSERT INTO withdrawals (account_id, currency, amount, address, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id
	`

	err := h.db.Pool.QueryRow(
		ctx, query,
		claims.AccountID, req.Currency, req.Amount, req.Address,
	).Scan(&withdrawalID)

	if err != nil {
		h.logger.Error("Failed to create withdrawal", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to request withdrawal")
		return
	}

	h.logger.Info("Withdrawal requested",
		zap.String("withdrawal_id", withdrawalID),
		zap.String("account_id", claims.AccountID.String()),
		zap.String("currency", req.Currency),
	)

	// TODO: Publish to Kafka for settlement service to process

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"withdrawal_id": withdrawalID,
		"currency":      req.Currency,
		"amount":        req.Amount,
		"status":        "pending",
		"message":       "Withdrawal request received and pending approval",
	})
}

func (h *AccountHandler) GetWithdrawal(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	vars := mux.Vars(r)
	withdrawalID := vars["id"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var withdrawal struct {
		ID        string  `json:"id"`
		Currency  string  `json:"currency"`
		Amount    string  `json:"amount"`
		Fee       string  `json:"fee"`
		Address   *string `json:"address,omitempty"`
		TxID      *string `json:"txid,omitempty"`
		Status    string  `json:"status"`
		CreatedAt string  `json:"created_at"`
	}
	var accountID string
	var createdAt time.Time

	query := `
		SELECT id, account_id, currency, amount, fee, address, txid, status, created_at
		FROM withdrawals
		WHERE id = $1
	`

	err := h.db.Pool.QueryRow(ctx, query, withdrawalID).Scan(
		&withdrawal.ID, &accountID, &withdrawal.Currency, &withdrawal.Amount,
		&withdrawal.Fee, &withdrawal.Address, &withdrawal.TxID,
		&withdrawal.Status, &createdAt,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "Withdrawal not found")
		return
	}

	// Verify ownership
	if accountID != claims.AccountID.String() {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	withdrawal.CreatedAt = createdAt.Format(time.RFC3339)

	respondJSON(w, http.StatusOK, withdrawal)
}



