// BitCurrent Exchange - Reconciliation Handler
package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"go.uber.org/zap"
)

type ReconciliationHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewReconciliationHandler(db *database.PostgresDB, logger *zap.Logger) *ReconciliationHandler {
	return &ReconciliationHandler{
		db:     db,
		logger: logger,
	}
}

type ReconciliationReport struct {
	Timestamp     string                      `json:"timestamp"`
	TotalUsers    int                         `json:"total_users"`
	TotalBalance  map[string]string           `json:"total_balance"`
	Discrepancies []ReconciliationDiscrepancy `json:"discrepancies,omitempty"`
	Status        string                      `json:"status"`
}

type ReconciliationDiscrepancy struct {
	AccountID         string `json:"account_id"`
	Currency          string `json:"currency"`
	WalletBalance     string `json:"wallet_balance"`
	CalculatedBalance string `json:"calculated_balance"`
	Difference        string `json:"difference"`
}

func (h *ReconciliationHandler) RunReconciliation(w http.ResponseWriter, r *http.Request) {
	h.logger.Info("Starting reconciliation process")

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	// Calculate total balances by currency
	totalQuery := `
		SELECT currency, SUM(balance) as total_balance
		FROM wallets
		GROUP BY currency
		ORDER BY currency
	`

	rows, err := h.db.Pool.Query(ctx, totalQuery)
	if err != nil {
		h.logger.Error("Failed to calculate total balances", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Reconciliation failed")
		return
	}
	defer rows.Close()

	totalBalance := make(map[string]string)
	for rows.Next() {
		var currency, balance string
		if err := rows.Scan(&currency, &balance); err != nil {
			continue
		}
		totalBalance[currency] = balance
	}

	// Count users with balances
	var totalUsers int
	userQuery := `SELECT COUNT(DISTINCT account_id) FROM wallets WHERE balance > 0`
	if err := h.db.Pool.QueryRow(ctx, userQuery).Scan(&totalUsers); err != nil {
		h.logger.Error("Failed to count users", zap.Error(err))
	}

	// Check for discrepancies (wallet balance vs ledger sum)
	discrepancyQuery := `
		WITH wallet_balances AS (
			SELECT account_id, currency, balance as wallet_balance
			FROM wallets
		),
		ledger_balances AS (
			SELECT account_id, currency, SUM(amount) as ledger_balance
			FROM ledger_entries
			GROUP BY account_id, currency
		)
		SELECT 
			w.account_id,
			w.currency,
			w.wallet_balance,
			COALESCE(l.ledger_balance, 0) as ledger_balance,
			w.wallet_balance - COALESCE(l.ledger_balance, 0) as difference
		FROM wallet_balances w
		LEFT JOIN ledger_balances l ON w.account_id = l.account_id AND w.currency = l.currency
		WHERE ABS(w.wallet_balance - COALESCE(l.ledger_balance, 0)) > 0.00000001
		LIMIT 100
	`

	discRows, err := h.db.Pool.Query(ctx, discrepancyQuery)
	if err != nil {
		h.logger.Error("Failed to query discrepancies", zap.Error(err))
	}
	defer discRows.Close()

	var discrepancies []ReconciliationDiscrepancy
	if discRows != nil {
		for discRows.Next() {
			var disc ReconciliationDiscrepancy
			err := discRows.Scan(
				&disc.AccountID,
				&disc.Currency,
				&disc.WalletBalance,
				&disc.CalculatedBalance,
				&disc.Difference,
			)
			if err != nil {
				h.logger.Error("Failed to scan discrepancy", zap.Error(err))
				continue
			}
			discrepancies = append(discrepancies, disc)
		}
	}

	report := ReconciliationReport{
		Timestamp:     time.Now().Format(time.RFC3339),
		TotalUsers:    totalUsers,
		TotalBalance:  totalBalance,
		Discrepancies: discrepancies,
		Status:        "completed",
	}

	if len(discrepancies) > 0 {
		report.Status = "discrepancies_found"
		h.logger.Warn("Reconciliation found discrepancies",
			zap.Int("count", len(discrepancies)),
		)
	} else {
		h.logger.Info("Reconciliation completed successfully, no discrepancies")
	}

	respondJSON(w, http.StatusOK, report)
}

func (h *ReconciliationHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	// TODO: Store reconciliation reports in a table and retrieve the latest
	// For now, run a fresh reconciliation
	h.RunReconciliation(w, r)
}
