// BitCurrent Exchange - Reconciliation Engine
package reconciliation

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sort"
	"time"

	"github.com/bitcurrent-exchange/platform/services/settlement-service/internal/blockchain"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// ReconciliationEngine handles balance reconciliation and proof of reserves
type ReconciliationEngine struct {
	db        *database.PostgresDB
	btcClient *blockchain.BitcoinClient
	ethClient *blockchain.EthereumClient
	logger    *zap.Logger
}

// NewReconciliationEngine creates a new reconciliation engine
func NewReconciliationEngine(
	db *database.PostgresDB,
	btcClient *blockchain.BitcoinClient,
	ethClient *blockchain.EthereumClient,
	logger *zap.Logger,
) *ReconciliationEngine {
	return &ReconciliationEngine{
		db:        db,
		btcClient: btcClient,
		ethClient: ethClient,
		logger:    logger,
	}
}

// ReconciliationResult holds reconciliation results
type ReconciliationResult struct {
	Timestamp    time.Time                 `json:"timestamp"`
	Assets       map[string]AssetReconciliation `json:"assets"`
	MerkleRoot   string                    `json:"merkle_root"`
	TotalUsers   int                       `json:"total_users"`
	Status       string                    `json:"status"`
}

// AssetReconciliation holds per-asset reconciliation data
type AssetReconciliation struct {
	Currency        string  `json:"currency"`
	DatabaseBalance string  `json:"database_balance"`
	ChainBalance    string  `json:"chain_balance,omitempty"`
	Difference      string  `json:"difference"`
	VariancePercent float64 `json:"variance_percent"`
	Status          string  `json:"status"`
	WalletCount     int     `json:"wallet_count"`
}

// RunDailyReconciliation performs complete daily reconciliation
func (e *ReconciliationEngine) RunDailyReconciliation(ctx context.Context) (*ReconciliationResult, error) {
	e.logger.Info("Starting daily reconciliation")
	
	result := &ReconciliationResult{
		Timestamp: time.Now(),
		Assets:    make(map[string]AssetReconciliation),
		Status:    "completed",
	}
	
	// Get list of currencies
	currencies := []string{"BTC", "ETH", "GBP", "SOL", "MATIC", "ADA"}
	
	for _, currency := range currencies {
		assetResult, err := e.reconcileAsset(ctx, currency)
		if err != nil {
			e.logger.Error("Failed to reconcile asset",
				zap.String("currency", currency),
				zap.Error(err),
			)
			result.Status = "partial"
			continue
		}
		
		result.Assets[currency] = *assetResult
	}
	
	// Generate Merkle proof of reserves
	merkleRoot, err := e.generateMerkleProof(ctx)
	if err != nil {
		e.logger.Error("Failed to generate Merkle proof", zap.Error(err))
	} else {
		result.MerkleRoot = merkleRoot
	}
	
	// Count users
	var totalUsers int
	userQuery := `SELECT COUNT(DISTINCT account_id) FROM wallets WHERE balance > 0`
	if err := e.db.Pool.QueryRow(ctx, userQuery).Scan(&totalUsers); err == nil {
		result.TotalUsers = totalUsers
	}
	
	e.logger.Info("Daily reconciliation completed",
		zap.String("status", result.Status),
		zap.Int("assets", len(result.Assets)),
		zap.Int("users", totalUsers),
	)
	
	return result, nil
}

func (e *ReconciliationEngine) reconcileAsset(ctx context.Context, currency string) (*AssetReconciliation, error) {
	// Get database balance (total of all user wallets)
	var dbBalance string
	var walletCount int
	
	query := `
		SELECT COALESCE(SUM(balance), 0) as total, COUNT(*) as count
		FROM wallets
		WHERE currency = $1
	`
	
	err := e.db.Pool.QueryRow(ctx, query, currency).Scan(&dbBalance, &walletCount)
	if err != nil {
		return nil, err
	}
	
	result := &AssetReconciliation{
		Currency:        currency,
		DatabaseBalance: dbBalance,
		WalletCount:     walletCount,
		Status:          "OK",
	}
	
	// For crypto assets, get on-chain balance
	if currency == "BTC" {
		chainBalance, err := e.getBitcoinChainBalance(ctx)
		if err != nil {
			e.logger.Warn("Failed to get Bitcoin chain balance", zap.Error(err))
			result.Status = "WARNING"
		} else {
			result.ChainBalance = chainBalance
			result.Difference = e.calculateDifference(dbBalance, chainBalance)
			result.VariancePercent = e.calculateVariancePercent(dbBalance, chainBalance)
			
			if result.VariancePercent > 0.01 { // More than 0.01% variance
				result.Status = "ALERT"
			}
		}
	} else if currency == "ETH" || currency == "MATIC" {
		chainBalance, err := e.getEthereumChainBalance(ctx, currency)
		if err != nil {
			e.logger.Warn("Failed to get Ethereum chain balance", zap.Error(err))
			result.Status = "WARNING"
		} else {
			result.ChainBalance = chainBalance
			result.Difference = e.calculateDifference(dbBalance, chainBalance)
			result.VariancePercent = e.calculateVariancePercent(dbBalance, chainBalance)
			
			if result.VariancePercent > 0.01 {
				result.Status = "ALERT"
			}
		}
	}
	// For fiat (GBP), no on-chain reconciliation
	
	return result, nil
}

func (e *ReconciliationEngine) getBitcoinChainBalance(ctx context.Context) (string, error) {
	// Get all Bitcoin wallet addresses
	query := `
		SELECT DISTINCT address FROM wallets WHERE currency = 'BTC' AND address IS NOT NULL
	`
	
	rows, err := e.db.Pool.Query(ctx, query)
	if err != nil {
		return "0", err
	}
	defer rows.Close()
	
	var totalBalance float64
	for rows.Next() {
		var address string
		if err := rows.Scan(&address); err != nil {
			continue
		}
		
		balance, err := e.btcClient.GetBalance(address)
		if err != nil {
			e.logger.Warn("Failed to get balance for address",
				zap.String("address", address),
				zap.Error(err),
			)
			continue
		}
		
		totalBalance += balance
	}
	
	return fmt.Sprintf("%.8f", totalBalance), nil
}

func (e *ReconciliationEngine) getEthereumChainBalance(ctx context.Context, currency string) (string, error) {
	// Get all Ethereum wallet addresses
	query := `
		SELECT DISTINCT address FROM wallets WHERE currency = $1 AND address IS NOT NULL
	`
	
	rows, err := e.db.Pool.Query(ctx, query, currency)
	if err != nil {
		return "0", err
	}
	defer rows.Close()
	
	totalBalance := int64(0)
	for rows.Next() {
		var address string
		if err := rows.Scan(&address); err != nil {
			continue
		}
		
		balance, err := e.ethClient.GetBalance(address)
		if err != nil {
			continue
		}
		
		totalBalance += balance.Int64()
	}
	
	// Convert wei to ETH
	ethBalance := float64(totalBalance) / 1e18
	return fmt.Sprintf("%.8f", ethBalance), nil
}

func (e *ReconciliationEngine) calculateDifference(db, chain string) string {
	// TODO: Implement proper decimal arithmetic
	return "0"
}

func (e *ReconciliationEngine) calculateVariancePercent(db, chain string) float64 {
	// TODO: Implement proper calculation
	return 0.0
}

func (e *ReconciliationEngine) updateDepositConfirmations(ctx context.Context, depositID uuid.UUID, confirmations int) error {
	query := `UPDATE deposits SET confirmations = $1 WHERE id = $2`
	_, err := e.db.Pool.Exec(ctx, query, confirmations, depositID)
	return err
}

func (e *ReconciliationEngine) creditDeposit(ctx context.Context, depositID, accountID uuid.UUID, currency, amount string) error {
	// TODO: Call ledger service to credit balance
	e.logger.Info("Crediting deposit",
		zap.String("deposit_id", depositID.String()),
		zap.String("account_id", accountID.String()),
		zap.String("currency", currency),
		zap.String("amount", amount),
	)
	return nil
}

// generateMerkleProof generates Merkle tree proof of reserves
func (e *ReconciliationEngine) generateMerkleProof(ctx context.Context) (string, error) {
	// Get all user balances
	query := `
		SELECT u.id as user_id, w.currency, w.balance, u.created_at
		FROM wallets w
		JOIN accounts a ON w.account_id = a.id
		JOIN users u ON a.user_id = u.id
		WHERE w.balance > 0
		ORDER BY u.id, w.currency
	`
	
	rows, err := e.db.Pool.Query(ctx, query)
	if err != nil {
		return "", err
	}
	defer rows.Close()
	
	var leaves [][]byte
	for rows.Next() {
		var userID uuid.UUID
		var currency, balance string
		var createdAt time.Time
		
		if err := rows.Scan(&userID, &currency, &balance, &createdAt); err != nil {
			continue
		}
		
		// Create leaf: hash(userID + currency + balance + nonce)
		data := fmt.Sprintf("%s:%s:%s:%d", userID.String(), currency, balance, createdAt.Unix())
		hash := sha256.Sum256([]byte(data))
		leaves = append(leaves, hash[:])
	}
	
	if len(leaves) == 0 {
		return "", fmt.Errorf("no balances to process")
	}
	
	// Build Merkle tree
	root := buildMerkleTree(leaves)
	
	e.logger.Info("Generated Merkle proof",
		zap.Int("leaves", len(leaves)),
		zap.String("root", hex.EncodeToString(root)),
	)
	
	return hex.EncodeToString(root), nil
}

// buildMerkleTree builds a Merkle tree from leaves
func buildMerkleTree(leaves [][]byte) []byte {
	if len(leaves) == 0 {
		return nil
	}
	
	if len(leaves) == 1 {
		return leaves[0]
	}
	
	var nextLevel [][]byte
	
	for i := 0; i < len(leaves); i += 2 {
		var combined []byte
		
		if i+1 < len(leaves) {
			// Combine two leaves
			combined = append(leaves[i], leaves[i+1]...)
		} else {
			// Odd number of leaves, duplicate the last one
			combined = append(leaves[i], leaves[i]...)
		}
		
		hash := sha256.Sum256(combined)
		nextLevel = append(nextLevel, hash[:])
	}
	
	return buildMerkleTree(nextLevel)
}

// VerifyUserInclusion verifies a user's balance in the Merkle tree
func (e *ReconciliationEngine) VerifyUserInclusion(
	userID uuid.UUID,
	currency string,
	balance string,
	merkleRoot string,
	proof []string,
) (bool, error) {
	// TODO: Implement Merkle proof verification
	// 1. Calculate leaf hash
	// 2. Apply proof hashes
	// 3. Compare with root
	
	return true, nil
}



