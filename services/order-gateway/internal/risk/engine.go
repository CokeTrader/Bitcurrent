// BitCurrent Exchange - Risk Engine
package risk

import (
	"context"
	"fmt"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// RiskViolation represents a risk check failure
type RiskViolation string

const (
	ViolationInsufficientBalance      RiskViolation = "insufficient_balance"
	ViolationPositionLimitExceeded    RiskViolation = "position_limit_exceeded"
	ViolationDailyVolumeLimitExceeded RiskViolation = "daily_volume_limit_exceeded"
	ViolationPriceDeviationExceeded   RiskViolation = "price_deviation_exceeded"
	ViolationAccountRestricted        RiskViolation = "account_restricted"
	ViolationOrderSizeTooSmall        RiskViolation = "order_size_too_small"
	ViolationOrderSizeTooLarge        RiskViolation = "order_size_too_large"
)

type Order struct {
	AccountID uuid.UUID
	Symbol    string
	Side      string
	OrderType string
	Price     *string
	Quantity  string
}

type RiskEngine struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewRiskEngine(db *database.PostgresDB, logger *zap.Logger) *RiskEngine {
	return &RiskEngine{
		db:     db,
		logger: logger,
	}
}

// CheckOrder performs all pre-trade risk checks
func (e *RiskEngine) CheckOrder(ctx context.Context, order *Order) error {
	// 1. Check account status
	if err := e.checkAccountStatus(ctx, order.AccountID); err != nil {
		return err
	}

	// 2. Check order size limits
	if err := e.checkOrderSize(ctx, order); err != nil {
		return err
	}

	// 3. Check balance for buy orders
	if order.Side == "buy" {
		if err := e.checkBalance(ctx, order); err != nil {
			return err
		}
	}

	// 4. Check position limits
	if err := e.checkPositionLimits(ctx, order); err != nil {
		return err
	}

	// 5. Check daily volume limits
	if err := e.checkDailyVolume(ctx, order); err != nil {
		return err
	}

	// 6. Fat finger protection (price deviation check)
	if order.Price != nil {
		if err := e.checkPriceDeviation(ctx, order); err != nil {
			return err
		}
	}

	return nil
}

func (e *RiskEngine) checkAccountStatus(ctx context.Context, accountID uuid.UUID) error {
	var status string
	query := `SELECT status FROM accounts WHERE id = $1`

	err := e.db.Pool.QueryRow(ctx, query, accountID).Scan(&status)
	if err != nil {
		return fmt.Errorf("%v: account not found", ViolationAccountRestricted)
	}

	if status != "active" {
		return fmt.Errorf("%v: account status is %s", ViolationAccountRestricted, status)
	}

	return nil
}

func (e *RiskEngine) checkOrderSize(ctx context.Context, order *Order) error {
	var minSize, maxSize *string
	query := `SELECT min_order_size, max_order_size FROM trading_pairs WHERE symbol = $1`

	err := e.db.Pool.QueryRow(ctx, query, order.Symbol).Scan(&minSize, &maxSize)
	if err != nil {
		return fmt.Errorf("invalid trading pair: %s", order.Symbol)
	}

	// TODO: Implement proper decimal comparison
	// For now, basic string checks

	return nil
}

func (e *RiskEngine) checkBalance(ctx context.Context, order *Order) error {
	// For buy orders, need to have enough quote currency
	// Extract quote currency from symbol (e.g., BTC-GBP -> GBP)
	quoteCurrency := "GBP" // Simplified - should parse from symbol

	var availableBalance string
	query := `SELECT available_balance FROM wallets WHERE account_id = $1 AND currency = $2`

	err := e.db.Pool.QueryRow(ctx, query, order.AccountID, quoteCurrency).Scan(&availableBalance)
	if err != nil {
		return fmt.Errorf("%v: wallet not found", ViolationInsufficientBalance)
	}

	// TODO: Calculate required balance (price * quantity + fees)
	// TODO: Compare with available balance using decimal arithmetic

	e.logger.Debug("Balance check passed",
		zap.String("account_id", order.AccountID.String()),
		zap.String("available", availableBalance),
	)

	return nil
}

func (e *RiskEngine) checkPositionLimits(ctx context.Context, order *Order) error {
	// TODO: Query current position for the symbol
	// TODO: Calculate new position after order
	// TODO: Check against position limits (from config or database)
	return nil
}

func (e *RiskEngine) checkDailyVolume(ctx context.Context, order *Order) error {
	// Query today's trading volume
	query := `
		SELECT COALESCE(SUM(quantity * price), 0) as volume
		FROM trades
		WHERE (buyer_account_id = $1 OR seller_account_id = $1)
		  AND executed_at > CURRENT_DATE
	`

	var dailyVolume string
	err := e.db.Pool.QueryRow(ctx, query, order.AccountID).Scan(&dailyVolume)
	if err != nil {
		e.logger.Error("Failed to query daily volume", zap.Error(err))
		return nil // Fail open on error
	}

	// TODO: Check against daily limit based on KYC tier
	// TODO: Calculate order notional value
	// TODO: Compare total volume

	return nil
}

func (e *RiskEngine) checkPriceDeviation(ctx context.Context, order *Order) error {
	// Get mid price from market
	var midPrice *string
	query := `
		SELECT (
			SELECT price FROM orders 
			WHERE symbol = $1 AND side = 'sell' AND status IN ('new', 'partial')
			ORDER BY price ASC LIMIT 1
		) as best_ask
	`

	err := e.db.Pool.QueryRow(ctx, query, order.Symbol).Scan(&midPrice)
	if err != nil || midPrice == nil {
		// No market price available, allow order
		return nil
	}

	// TODO: Calculate deviation percentage
	// TODO: Check if deviation > 10% threshold
	// const maxDeviationPercent = 0.10

	return nil
}
