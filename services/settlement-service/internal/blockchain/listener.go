// BitCurrent Exchange - Blockchain Deposit Listener
package blockchain

import (
	"context"
	"fmt"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// DepositListener monitors blockchain for incoming deposits
type DepositListener struct {
	btcClient *BitcoinClient
	ethClient *EthereumClient
	db        *database.PostgresDB
	logger    *zap.Logger
}

// NewDepositListener creates a new deposit listener
func NewDepositListener(
	btcClient *BitcoinClient,
	ethClient *EthereumClient,
	db *database.PostgresDB,
	logger *zap.Logger,
) *DepositListener {
	return &DepositListener{
		btcClient: btcClient,
		ethClient: ethClient,
		db:        db,
		logger:    logger,
	}
}

// StartBitcoinListener starts monitoring Bitcoin deposits
func (l *DepositListener) StartBitcoinListener(ctx context.Context) error {
	l.logger.Info("Starting Bitcoin deposit listener")
	
	ticker := time.NewTicker(60 * time.Second) // Check every minute
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			l.logger.Info("Bitcoin listener stopped")
			return ctx.Err()
			
		case <-ticker.C:
			if err := l.checkBitcoinDeposits(ctx); err != nil {
				l.logger.Error("Failed to check Bitcoin deposits", zap.Error(err))
			}
		}
	}
}

// StartEthereumListener starts monitoring Ethereum deposits
func (l *DepositListener) StartEthereumListener(ctx context.Context) error {
	l.logger.Info("Starting Ethereum deposit listener")
	
	ticker := time.NewTicker(15 * time.Second) // Check every 15 seconds (block time)
	defer ticker.Stop()
	
	for {
		select {
		case <-ctx.Done():
			l.logger.Info("Ethereum listener stopped")
			return ctx.Err()
			
		case <-ticker.C:
			if err := l.checkEthereumDeposits(ctx); err != nil {
				l.logger.Error("Failed to check Ethereum deposits", zap.Error(err))
			}
		}
	}
}

func (l *DepositListener) checkBitcoinDeposits(ctx context.Context) error {
	// Query all pending Bitcoin deposits
	query := `
		SELECT id, account_id, address, amount, txid, confirmations
		FROM deposits
		WHERE currency = 'BTC' 
		  AND status IN ('pending', 'confirmed')
		  AND confirmations < required_confirmations
	`
	
	rows, err := l.db.Pool.Query(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	for rows.Next() {
		var depositID uuid.UUID
		var accountID uuid.UUID
		var address, amount string
		var txid *string
		var currentConfirmations int
		
		if err := rows.Scan(&depositID, &accountID, &address, &amount, &txid, &currentConfirmations); err != nil {
			l.logger.Error("Failed to scan deposit", zap.Error(err))
			continue
		}
		
		// If we have a txid, check confirmations
		if txid != nil {
			confirmations, err := l.btcClient.GetConfirmations(*txid)
			if err != nil {
				l.logger.Error("Failed to get confirmations", zap.String("txid", *txid), zap.Error(err))
				continue
			}
			
			// Update confirmations in database
			if confirmations != currentConfirmations {
				l.updateDepositConfirmations(ctx, depositID, confirmations)
			}
			
			// Credit account if confirmed
			if confirmations >= 6 { // Bitcoin requires 6 confirmations
				l.creditDeposit(ctx, depositID, accountID, "BTC", amount)
			}
		} else {
			// No txid yet, check address balance
			// TODO: Implement address monitoring
		}
	}
	
	return nil
}

func (l *DepositListener) checkEthereumDeposits(ctx context.Context) error {
	// Query all pending Ethereum deposits
	query := `
		SELECT id, account_id, address, amount, txid, confirmations
		FROM deposits
		WHERE currency IN ('ETH', 'MATIC')
		  AND status IN ('pending', 'confirmed')
		  AND confirmations < required_confirmations
	`
	
	rows, err := l.db.Pool.Query(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	for rows.Next() {
		var depositID uuid.UUID
		var accountID uuid.UUID
		var address, amount string
		var txid *string
		var currentConfirmations int
		
		if err := rows.Scan(&depositID, &accountID, &address, &amount, &txid, &currentConfirmations); err != nil {
			continue
		}
		
		// If we have a txid, check confirmations
		if txid != nil {
			confirmations, err := l.ethClient.GetConfirmations(*txid)
			if err != nil {
				l.logger.Error("Failed to get confirmations", zap.String("txid", *txid), zap.Error(err))
				continue
			}
			
			// Update confirmations
			if confirmations != currentConfirmations {
				l.updateDepositConfirmations(ctx, depositID, confirmations)
			}
			
			// Credit account if confirmed (ETH requires 12 confirmations)
			if confirmations >= 12 {
				l.creditDeposit(ctx, depositID, accountID, "ETH", amount)
			}
		}
	}
	
	return nil
}

func (l *DepositListener) updateDepositConfirmations(ctx context.Context, depositID uuid.UUID, confirmations int) error {
	query := `
		UPDATE deposits
		SET confirmations = $1, updated_at = NOW()
		WHERE id = $2
	`
	
	_, err := l.db.Pool.Exec(ctx, query, confirmations, depositID)
	if err != nil {
		l.logger.Error("Failed to update confirmations", zap.Error(err))
		return err
	}
	
	l.logger.Info("Updated deposit confirmations",
		zap.String("deposit_id", depositID.String()),
		zap.Int("confirmations", confirmations),
	)
	
	return nil
}

func (l *DepositListener) creditDeposit(ctx context.Context, depositID, accountID uuid.UUID, currency, amount string) error {
	// Begin transaction
	tx, err := l.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	
	// Update deposit status
	updateDepositQuery := `
		UPDATE deposits
		SET status = 'credited', credited_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status != 'credited'
	`
	
	result, err := tx.Exec(ctx, updateDepositQuery, depositID)
	if err != nil {
		return err
	}
	
	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		// Already credited
		return nil
	}
	
	// Update wallet balance
	updateWalletQuery := `
		UPDATE wallets
		SET balance = balance + $1,
		    available_balance = available_balance + $1,
		    updated_at = NOW()
		WHERE account_id = $2 AND currency = $3
		RETURNING balance
	`
	
	var newBalance string
	err = tx.QueryRow(ctx, updateWalletQuery, amount, accountID, currency).Scan(&newBalance)
	if err != nil {
		return err
	}
	
	// Create ledger entry
	ledgerQuery := `
		INSERT INTO ledger_entries (
			account_id, currency, amount, balance_after,
			entry_type, reference_id, reference_type, description
		) VALUES ($1, $2, $3, $4, 'deposit', $5, 'deposit', 'Cryptocurrency deposit')
	`
	
	_, err = tx.Exec(ctx, ledgerQuery, accountID, currency, amount, newBalance, depositID)
	if err != nil {
		return err
	}
	
	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	
	l.logger.Info("Deposit credited",
		zap.String("deposit_id", depositID.String()),
		zap.String("account_id", accountID.String()),
		zap.String("currency", currency),
		zap.String("amount", amount),
		zap.String("new_balance", newBalance),
	)
	
	return nil
}



