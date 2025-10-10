// BitCurrent Exchange - Banking Reconciliation
package banking

import (
	"context"
	"fmt"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// PaymentReconciliationEngine handles bank payment reconciliation
type PaymentReconciliationEngine struct {
	db            *database.PostgresDB
	clearbank     *ClearBankClient
	modulr        *ModulrClient
	logger        *zap.Logger
}

// NewPaymentReconciliationEngine creates a new payment reconciliation engine
func NewPaymentReconciliationEngine(
	db *database.PostgresDB,
	clearbank *ClearBankClient,
	modulr *ModulrClient,
	logger *zap.Logger,
) *PaymentReconciliationEngine {
	return &PaymentReconciliationEngine{
		db:        db,
		clearbank: clearbank,
		modulr:    modulr,
		logger:    logger,
	}
}

// ReconcilePayments reconciles bank transactions with database records
func (r *PaymentReconciliationEngine) ReconcilePayments(ctx context.Context) (*ReconciliationReport, error) {
	r.logger.Info("Starting payment reconciliation")

	report := &ReconciliationReport{
		Timestamp: time.Now(),
		Status:    "completed",
		Matched:   0,
		Unmatched: 0,
		Issues:    []ReconciliationIssue{},
	}

	// Get today's transactions from ClearBank
	fromDate := time.Now().AddDate(0, 0, -1) // Yesterday
	toDate := time.Now()

	transactions, err := r.clearbank.GetTransactions(ctx, r.clearbank.institutionID, fromDate, toDate)
	if err != nil {
		r.logger.Error("Failed to fetch bank transactions", zap.Error(err))
		report.Status = "failed"
		return report, err
	}

	r.logger.Info("Fetched bank transactions", zap.Int("count", len(transactions)))

	// Reconcile each transaction
	for _, tx := range transactions {
		if err := r.reconcileTransaction(ctx, tx, report); err != nil {
			r.logger.Error("Failed to reconcile transaction",
				zap.String("tx_id", tx.ID),
				zap.Error(err),
			)
		}
	}

	// Check for unprocessed deposits in database
	r.checkUnprocessedDeposits(ctx, report)

	r.logger.Info("Payment reconciliation completed",
		zap.Int("matched", report.Matched),
		zap.Int("unmatched", report.Unmatched),
		zap.Int("issues", len(report.Issues)),
	)

	return report, nil
}

func (r *PaymentReconciliationEngine) reconcileTransaction(ctx context.Context, tx Transaction, report *ReconciliationReport) error {
	// For inbound transactions (deposits)
	if tx.Direction == "inbound" {
		// Try to match with deposit by reference
		var depositID uuid.UUID
		query := `
			SELECT id FROM deposits
			WHERE currency = 'GBP'
			  AND (id::text = $1 OR description LIKE $2)
			  AND status = 'pending'
			LIMIT 1
		`

		referencePattern := fmt.Sprintf("%%%s%%", tx.Reference)
		err := r.db.Pool.QueryRow(ctx, query, tx.Reference, referencePattern).Scan(&depositID)

		if err != nil {
			// No matching deposit found
			report.Unmatched++
			report.Issues = append(report.Issues, ReconciliationIssue{
				Type:        "unmatched_inbound",
				Reference:   tx.Reference,
				Amount:      tx.Amount,
				Description: "Bank transaction with no matching deposit record",
			})

			r.logger.Warn("Unmatched inbound transaction",
				zap.String("reference", tx.Reference),
				zap.Float64("amount", tx.Amount),
			)

			// TODO: Create deposit record automatically or flag for manual review
			return nil
		}

		// Credit the deposit
		if err := r.creditGBPDeposit(ctx, depositID, tx.ID, tx.Amount); err != nil {
			return err
		}

		report.Matched++
		return nil
	}

	// For outbound transactions (withdrawals)
	if tx.Direction == "outbound" {
		// Match with withdrawal by reference
		var withdrawalID uuid.UUID
		query := `
			SELECT id FROM withdrawals
			WHERE currency = 'GBP'
			  AND (id::text = $1 OR description LIKE $2)
			  AND status = 'processing'
			LIMIT 1
		`

		referencePattern := fmt.Sprintf("%%%s%%", tx.Reference)
		err := r.db.Pool.QueryRow(ctx, query, tx.Reference, referencePattern).Scan(&withdrawalID)

		if err != nil {
			report.Unmatched++
			report.Issues = append(report.Issues, ReconciliationIssue{
				Type:        "unmatched_outbound",
				Reference:   tx.Reference,
				Amount:      tx.Amount,
				Description: "Bank transaction with no matching withdrawal record",
			})
			return nil
		}

		// Mark withdrawal as completed
		if err := r.completeGBPWithdrawal(ctx, withdrawalID, tx.ID); err != nil {
			return err
		}

		report.Matched++
		return nil
	}

	return nil
}

func (r *PaymentReconciliationEngine) creditGBPDeposit(ctx context.Context, depositID uuid.UUID, bankTxID string, amount float64) error {
	// Begin transaction
	tx, err := r.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get deposit details
	var accountID uuid.UUID
	var expectedAmount string
	query := `
		SELECT account_id, amount FROM deposits WHERE id = $1
	`
	err = tx.QueryRow(ctx, query, depositID).Scan(&accountID, &expectedAmount)
	if err != nil {
		return err
	}

	// Verify amount matches (TODO: use decimal comparison)
	// For now, just log

	// Update deposit status
	updateDepositQuery := `
		UPDATE deposits
		SET status = 'credited',
		    txid = $1,
		    credited_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`

	_, err = tx.Exec(ctx, updateDepositQuery, bankTxID, depositID)
	if err != nil {
		return err
	}

	// Credit wallet
	amountStr := fmt.Sprintf("%.2f", amount)
	updateWalletQuery := `
		UPDATE wallets
		SET balance = balance + $1,
		    available_balance = available_balance + $1,
		    updated_at = NOW()
		WHERE account_id = $2 AND currency = 'GBP'
		RETURNING balance
	`

	var newBalance string
	err = tx.QueryRow(ctx, updateWalletQuery, amountStr, accountID).Scan(&newBalance)
	if err != nil {
		return err
	}

	// Create ledger entry
	ledgerQuery := `
		INSERT INTO ledger_entries (
			account_id, currency, amount, balance_after,
			entry_type, reference_id, reference_type, description
		) VALUES ($1, 'GBP', $2, $3, 'deposit', $4, 'deposit', 'GBP deposit via Faster Payments')
	`

	_, err = tx.Exec(ctx, ledgerQuery, accountID, amountStr, newBalance, depositID)
	if err != nil {
		return err
	}

	// Commit
	if err := tx.Commit(ctx); err != nil {
		return err
	}

	r.logger.Info("GBP deposit credited",
		zap.String("deposit_id", depositID.String()),
		zap.String("bank_tx_id", bankTxID),
		zap.Float64("amount", amount),
	)

	return nil
}

func (r *PaymentReconciliationEngine) completeGBPWithdrawal(ctx context.Context, withdrawalID uuid.UUID, bankTxID string) error {
	query := `
		UPDATE withdrawals
		SET status = 'completed',
		    txid = $1,
		    completed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`

	_, err := r.db.Pool.Exec(ctx, query, bankTxID, withdrawalID)
	if err != nil {
		return err
	}

	r.logger.Info("GBP withdrawal completed",
		zap.String("withdrawal_id", withdrawalID.String()),
		zap.String("bank_tx_id", bankTxID),
	)

	return nil
}

func (r *PaymentReconciliationEngine) checkUnprocessedDeposits(ctx context.Context, report *ReconciliationReport) {
	// Find deposits older than 1 hour still pending
	query := `
		SELECT id, account_id, amount, created_at
		FROM deposits
		WHERE currency = 'GBP'
		  AND status = 'pending'
		  AND created_at < NOW() - INTERVAL '1 hour'
	`

	rows, err := r.db.Pool.Query(ctx, query)
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id uuid.UUID
		var accountID uuid.UUID
		var amount string
		var createdAt time.Time

		if err := rows.Scan(&id, &accountID, &amount, &createdAt); err != nil {
			continue
		}

		report.Issues = append(report.Issues, ReconciliationIssue{
			Type:        "delayed_deposit",
			Reference:   id.String(),
			Amount:      0, // Parse from string
			Description: fmt.Sprintf("Deposit pending for %v", time.Since(createdAt)),
		})
	}
}

// ReconciliationReport represents a reconciliation report
type ReconciliationReport struct {
	Timestamp time.Time              `json:"timestamp"`
	Status    string                 `json:"status"`
	Matched   int                    `json:"matched"`
	Unmatched int                    `json:"unmatched"`
	Issues    []ReconciliationIssue  `json:"issues"`
}

// ReconciliationIssue represents a reconciliation discrepancy
type ReconciliationIssue struct {
	Type        string  `json:"type"`
	Reference   string  `json:"reference"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}



