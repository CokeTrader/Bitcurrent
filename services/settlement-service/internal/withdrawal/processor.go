// BitCurrent Exchange - Withdrawal Processor
package withdrawal

import (
	"context"
	"fmt"
	"time"

	"github.com/bitcurrent-exchange/platform/services/settlement-service/internal/blockchain"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// Processor handles withdrawal processing and blockchain broadcasting
type Processor struct {
	db        *database.PostgresDB
	btcClient *blockchain.BitcoinClient
	ethClient *blockchain.EthereumClient
	logger    *zap.Logger
}

// NewProcessor creates a new withdrawal processor
func NewProcessor(
	db *database.PostgresDB,
	btcClient *blockchain.BitcoinClient,
	ethClient *blockchain.EthereumClient,
	logger *zap.Logger,
) *Processor {
	return &Processor{
		db:        db,
		btcClient: btcClient,
		ethClient: ethClient,
		logger:    logger,
	}
}

// ProcessPendingWithdrawals processes all approved withdrawals
func (p *Processor) ProcessPendingWithdrawals(ctx context.Context) error {
	query := `
		SELECT id, account_id, currency, amount, fee, address, network
		FROM withdrawals
		WHERE status = 'approved'
		ORDER BY created_at ASC
		LIMIT 100
	`
	
	rows, err := p.db.Pool.Query(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	for rows.Next() {
		var withdrawal struct {
			ID        uuid.UUID
			AccountID uuid.UUID
			Currency  string
			Amount    string
			Fee       string
			Address   string
			Network   string
		}
		
		err := rows.Scan(
			&withdrawal.ID,
			&withdrawal.AccountID,
			&withdrawal.Currency,
			&withdrawal.Amount,
			&withdrawal.Fee,
			&withdrawal.Address,
			&withdrawal.Network,
		)
		
		if err != nil {
			p.logger.Error("Failed to scan withdrawal", zap.Error(err))
			continue
		}
		
		// Process withdrawal
		if err := p.processWithdrawal(ctx, &withdrawal); err != nil {
			p.logger.Error("Failed to process withdrawal",
				zap.String("withdrawal_id", withdrawal.ID.String()),
				zap.Error(err),
			)
			p.markWithdrawalFailed(ctx, withdrawal.ID, err.Error())
			continue
		}
	}
	
	return nil
}

func (p *Processor) processWithdrawal(ctx context.Context, w interface{}) error {
	withdrawal := w.(*struct {
		ID        uuid.UUID
		AccountID uuid.UUID
		Currency  string
		Amount    string
		Fee       string
		Address   string
		Network   string
	})
	
	// Update status to processing
	updateQuery := `
		UPDATE withdrawals
		SET status = 'processing', processed_at = NOW()
		WHERE id = $1
	`
	
	if _, err := p.db.Pool.Exec(ctx, updateQuery, withdrawal.ID); err != nil {
		return err
	}
	
	// Broadcast transaction based on currency
	var txid string
	var err error
	
	switch withdrawal.Currency {
	case "BTC":
		txid, err = p.processBitcoinWithdrawal(withdrawal.Address, withdrawal.Amount)
	case "ETH":
		txid, err = p.processEthereumWithdrawal(withdrawal.Address, withdrawal.Amount)
	case "GBP":
		txid, err = p.processFiatWithdrawal(withdrawal)
	default:
		return fmt.Errorf("unsupported currency: %s", withdrawal.Currency)
	}
	
	if err != nil {
		return err
	}
	
	// Update withdrawal with txid
	updateTxQuery := `
		UPDATE withdrawals
		SET txid = $1, status = 'processing', updated_at = NOW()
		WHERE id = $2
	`
	
	if _, err := p.db.Pool.Exec(ctx, updateTxQuery, txid, withdrawal.ID); err != nil {
		return err
	}
	
	p.logger.Info("Withdrawal broadcasted",
		zap.String("withdrawal_id", withdrawal.ID.String()),
		zap.String("txid", txid),
		zap.String("currency", withdrawal.Currency),
	)
	
	// TODO: Monitor transaction for confirmations
	// TODO: Update status to 'completed' once confirmed
	
	return nil
}

func (p *Processor) processBitcoinWithdrawal(address, amount string) (string, error) {
	// Validate address
	valid, err := p.btcClient.ValidateAddress(address)
	if err != nil {
		return "", err
	}
	
	if !valid {
		return "", fmt.Errorf("invalid Bitcoin address")
	}
	
	// Convert amount to float64
	var amountFloat float64
	fmt.Sscanf(amount, "%f", &amountFloat)
	
	// Send transaction
	// TODO: This should use multi-sig wallet, not direct send
	txid, err := p.btcClient.SendToAddress(address, amountFloat)
	if err != nil {
		return "", err
	}
	
	return txid, nil
}

func (p *Processor) processEthereumWithdrawal(address, amount string) (string, error) {
	// Validate address
	if !p.ethClient.ValidateAddress(address) {
		return "", fmt.Errorf("invalid Ethereum address")
	}
	
	// TODO: Convert amount to big.Int (wei)
	// TODO: Get gas price
	// TODO: Send transaction with multi-sig
	
	// Mock transaction
	txHash := fmt.Sprintf("0x%s", generateMockHash(64))
	
	return txHash, nil
}

func (p *Processor) processFiatWithdrawal(w interface{}) (string, error) {
	// TODO: Integrate with ClearBank/Modulr for Faster Payments
	// 1. Validate bank account
	// 2. Call Faster Payments API
	// 3. Return payment reference
	
	reference := fmt.Sprintf("FP%s", generateMockHash(16))
	
	p.logger.Info("Fiat withdrawal processed (mock)",
		zap.String("reference", reference),
	)
	
	return reference, nil
}

func (p *Processor) markWithdrawalFailed(ctx context.Context, withdrawalID uuid.UUID, reason string) error {
	query := `
		UPDATE withdrawals
		SET status = 'failed',
		    failure_reason = $1,
		    failed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $2
	`
	
	_, err := p.db.Pool.Exec(ctx, query, reason, withdrawalID)
	if err != nil {
		p.logger.Error("Failed to mark withdrawal as failed", zap.Error(err))
		return err
	}
	
	// TODO: Release reserved balance back to available balance
	
	return nil
}

// ApproveWithdrawal approves a pending withdrawal
func (p *Processor) ApproveWithdrawal(ctx context.Context, withdrawalID uuid.UUID, approverID uuid.UUID) error {
	query := `
		UPDATE withdrawals
		SET status = 'approved',
		    approved_at = NOW(),
		    approved_by = $1,
		    updated_at = NOW()
		WHERE id = $2 AND status = 'pending'
	`
	
	result, err := p.db.Pool.Exec(ctx, query, approverID, withdrawalID)
	if err != nil {
		return err
	}
	
	if result.RowsAffected() == 0 {
		return fmt.Errorf("withdrawal not found or already processed")
	}
	
	p.logger.Info("Withdrawal approved",
		zap.String("withdrawal_id", withdrawalID.String()),
		zap.String("approver_id", approverID.String()),
	)
	
	return nil
}

func generateMockHash(length int) string {
	chars := "0123456789abcdef"
	result := ""
	for i := 0; i < length; i++ {
		result += string(chars[i%len(chars)])
	}
	return result
}



