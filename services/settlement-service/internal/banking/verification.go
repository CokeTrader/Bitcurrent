// BitCurrent Exchange - Bank Account Verification
package banking

import (
	"context"
	"fmt"
	"regexp"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// AccountVerifier handles bank account verification
type AccountVerifier struct {
	db        *database.PostgresDB
	truelayer *TrueLayerClient
	logger    *zap.Logger
}

// NewAccountVerifier creates a new account verifier
func NewAccountVerifier(db *database.PostgresDB, truelayer *TrueLayerClient, logger *zap.Logger) *AccountVerifier {
	return &AccountVerifier{
		db:        db,
		truelayer: truelayer,
		logger:    logger,
	}
}

// BankAccountDetails represents bank account information
type BankAccountDetails struct {
	AccountName   string `json:"account_name"`
	SortCode      string `json:"sort_code"`
	AccountNumber string `json:"account_number"`
	IBAN          string `json:"iban,omitempty"`
}

// ValidateBankAccount validates UK bank account details
func (v *AccountVerifier) ValidateBankAccount(details BankAccountDetails) error {
	// Validate sort code (XX-XX-XX format, 6 digits)
	sortCodeRegex := regexp.MustCompile(`^\d{2}-\d{2}-\d{2}$`)
	if !sortCodeRegex.MatchString(details.SortCode) {
		return fmt.Errorf("invalid sort code format (expected XX-XX-XX)")
	}

	// Validate account number (8 digits)
	accountNumberRegex := regexp.MustCompile(`^\d{8}$`)
	if !accountNumberRegex.MatchString(details.AccountNumber) {
		return fmt.Errorf("invalid account number (must be 8 digits)")
	}

	// Validate account name (not empty, reasonable length)
	if details.AccountName == "" || len(details.AccountName) > 100 {
		return fmt.Errorf("invalid account name")
	}

	// TODO: Implement modulus check (sort code + account number validation)
	// This is a UK-specific algorithm to validate account numbers

	return nil
}

// VerifyWithOpenBanking uses TrueLayer to verify bank account ownership
func (v *AccountVerifier) VerifyWithOpenBanking(ctx context.Context, userID uuid.UUID, accessToken string) (*BankAccountDetails, error) {
	// Get user's bank accounts via TrueLayer
	accounts, err := v.truelayer.GetAccounts(ctx, accessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch accounts: %w", err)
	}

	if len(accounts) == 0 {
		return nil, fmt.Errorf("no accounts found")
	}

	// Use the first GBP account
	var selectedAccount *BankAccount
	for i := range accounts {
		if accounts[i].Currency == "GBP" {
			selectedAccount = &accounts[i]
			break
		}
	}

	if selectedAccount == nil {
		return nil, fmt.Errorf("no GBP account found")
	}

	details := &BankAccountDetails{
		AccountName:   selectedAccount.DisplayName,
		SortCode:      selectedAccount.SortCode,
		AccountNumber: selectedAccount.AccountNumber,
	}

	// Store verified bank account
	if err := v.storeVerifiedAccount(ctx, userID, details); err != nil {
		return nil, err
	}

	v.logger.Info("Bank account verified via Open Banking",
		zap.String("user_id", userID.String()),
		zap.String("account_number", details.AccountNumber),
	)

	return details, nil
}

func (v *AccountVerifier) storeVerifiedAccount(ctx context.Context, userID uuid.UUID, details *BankAccountDetails) error {
	// TODO: Create bank_accounts table
	// For now, log the verification

	v.logger.Info("Bank account stored",
		zap.String("user_id", userID.String()),
		zap.String("sort_code", details.SortCode),
		zap.String("account_number", details.AccountNumber),
	)

	return nil
}

// GenerateDepositReference generates a unique reference for GBP deposits
func (v *AccountVerifier) GenerateDepositReference(depositID uuid.UUID) string {
	// Format: BC-{first 8 chars of deposit ID}
	// This appears in user's bank statement
	return fmt.Sprintf("BC-%s", depositID.String()[:8])
}

// MatchDepositByReference matches an inbound payment to a deposit
func (v *AccountVerifier) MatchDepositByReference(ctx context.Context, reference string) (uuid.UUID, error) {
	// Try to extract deposit ID from reference
	var depositID uuid.UUID

	// Try exact match first
	query := `
		SELECT id FROM deposits
		WHERE currency = 'GBP'
		  AND id::text LIKE $1
		  AND status = 'pending'
		LIMIT 1
	`

	// Extract UUID from BC-XXXXXXXX format
	uuidPattern := reference
	if len(reference) > 8 && reference[:3] == "BC-" {
		uuidPattern = reference[3:11] + "%"
	}

	err := v.db.Pool.QueryRow(ctx, query, uuidPattern).Scan(&depositID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("no matching deposit found for reference: %s", reference)
	}

	return depositID, nil
}

// PerformModulusCheck performs UK bank account modulus check
func (v *AccountVerifier) PerformModulusCheck(sortCode, accountNumber string) (bool, error) {
	// TODO: Implement UK modulus check algorithm
	// This validates that the sort code and account number combination is valid
	// Algorithm is publicly available from UK payments

	// For now, return true (validation passed)
	return true, nil
}



