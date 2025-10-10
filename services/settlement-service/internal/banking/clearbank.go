// BitCurrent Exchange - ClearBank Integration
package banking

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// ClearBankClient handles ClearBank API operations
type ClearBankClient struct {
	baseURL       string
	apiKey        string
	institutionID string
	httpClient    *http.Client
	logger        *zap.Logger
}

// ClearBankConfig holds ClearBank configuration
type ClearBankConfig struct {
	BaseURL       string
	APIKey        string
	InstitutionID string
	CertPath      string
	KeyPath       string
}

// NewClearBankClient creates a new ClearBank client
func NewClearBankClient(config ClearBankConfig, logger *zap.Logger) (*ClearBankClient, error) {
	// Load client certificate for mutual TLS
	var tlsConfig *tls.Config
	if config.CertPath != "" && config.KeyPath != "" {
		cert, err := tls.LoadX509KeyPair(config.CertPath, config.KeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to load client certificate: %w", err)
		}
		tlsConfig = &tls.Config{
			Certificates: []tls.Certificate{cert},
			MinVersion:   tls.VersionTLS13,
		}
	}

	httpClient := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
	}

	return &ClearBankClient{
		baseURL:       config.BaseURL,
		apiKey:        config.APIKey,
		institutionID: config.InstitutionID,
		httpClient:    httpClient,
		logger:        logger,
	}, nil
}

// FasterPaymentRequest represents a Faster Payments outbound request
type FasterPaymentRequest struct {
	EndToEndID          string  `json:"endToEndId"`
	Reference           string  `json:"reference"`
	Amount              float64 `json:"amount"`
	CreditorAccountName string  `json:"creditorAccount.name"`
	CreditorSortCode    string  `json:"creditorAccount.sortCode"`
	CreditorAccountNumber string `json:"creditorAccount.accountNumber"`
}

// FasterPaymentResponse represents the API response
type FasterPaymentResponse struct {
	TransactionID string `json:"transactionId"`
	Status        string `json:"status"`
	Timestamp     string `json:"timestamp"`
}

// SendFasterPayment sends a Faster Payment
func (c *ClearBankClient) SendFasterPayment(ctx context.Context, req FasterPaymentRequest) (*FasterPaymentResponse, error) {
	url := fmt.Sprintf("%s/v1/payments/outbound", c.baseURL)

	// Add institution ID to request
	requestBody := map[string]interface{}{
		"endToEndId": req.EndToEndID,
		"reference":  req.Reference,
		"amount":     req.Amount,
		"creditorAccount": map[string]string{
			"name":          req.CreditorAccountName,
			"sortCode":      req.CreditorSortCode,
			"accountNumber": req.CreditorAccountNumber,
		},
		"debtorAccount": map[string]string{
			"institutionId": c.institutionID,
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	httpReq.Header.Set("X-Request-Id", req.EndToEndID)

	c.logger.Info("Sending Faster Payment",
		zap.String("end_to_end_id", req.EndToEndID),
		zap.Float64("amount", req.Amount),
	)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var response FasterPaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	c.logger.Info("Faster Payment sent successfully",
		zap.String("transaction_id", response.TransactionID),
		zap.String("status", response.Status),
	)

	return &response, nil
}

// GetAccountBalance gets the current account balance
func (c *ClearBankClient) GetAccountBalance(ctx context.Context, accountID string) (float64, error) {
	url := fmt.Sprintf("%s/v1/accounts/%s", c.baseURL, accountID)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, err
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("API error: status %d", resp.StatusCode)
	}

	var account struct {
		Balance float64 `json:"balance"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&account); err != nil {
		return 0, err
	}

	return account.Balance, nil
}

// GetTransactions retrieves transaction history
func (c *ClearBankClient) GetTransactions(ctx context.Context, accountID string, fromDate, toDate time.Time) ([]Transaction, error) {
	url := fmt.Sprintf("%s/v1/accounts/%s/transactions?from=%s&to=%s",
		c.baseURL,
		accountID,
		fromDate.Format("2006-01-02"),
		toDate.Format("2006-01-02"),
	)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var transactions []Transaction
	if err := json.NewDecoder(resp.Body).Decode(&transactions); err != nil {
		return nil, err
	}

	return transactions, nil
}

// Transaction represents a bank transaction
type Transaction struct {
	ID            string    `json:"id"`
	Amount        float64   `json:"amount"`
	Reference     string    `json:"reference"`
	Direction     string    `json:"direction"` // "inbound", "outbound"
	Status        string    `json:"status"`
	Timestamp     time.Time `json:"timestamp"`
	CounterParty  string    `json:"counterParty"`
}

// ValidateWebhook validates a webhook signature from ClearBank
func (c *ClearBankClient) ValidateWebhook(payload []byte, signature string) bool {
	// TODO: Implement webhook signature validation
	// ClearBank uses HMAC-SHA256 for webhook signatures
	return true
}



