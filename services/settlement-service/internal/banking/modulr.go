// BitCurrent Exchange - Modulr Integration (Backup Payment Provider)
package banking

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// ModulrClient handles Modulr API operations
type ModulrClient struct {
	baseURL    string
	apiKey     string
	apiSecret  string
	httpClient *http.Client
	logger     *zap.Logger
}

// ModulrConfig holds Modulr configuration
type ModulrConfig struct {
	BaseURL   string
	APIKey    string
	APISecret string
}

// NewModulrClient creates a new Modulr client
func NewModulrClient(config ModulrConfig, logger *zap.Logger) *ModulrClient {
	return &ModulrClient{
		baseURL:   config.BaseURL,
		apiKey:    config.APIKey,
		apiSecret: config.APISecret,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

// CreatePayment creates a payment via Modulr
func (m *ModulrClient) CreatePayment(ctx context.Context, payment PaymentRequest) (*PaymentResponse, error) {
	url := fmt.Sprintf("%s/payments", m.baseURL)

	jsonData, err := json.Marshal(payment)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", m.apiKey))

	m.logger.Info("Creating Modulr payment",
		zap.String("reference", payment.Reference),
		zap.Float64("amount", payment.Amount),
	)

	resp, err := m.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var response PaymentResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// PaymentRequest represents a payment request
type PaymentRequest struct {
	Reference     string  `json:"reference"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	SortCode      string  `json:"sortCode"`
	AccountNumber string  `json:"accountNumber"`
	AccountName   string  `json:"accountName"`
}

// PaymentResponse represents a payment response
type PaymentResponse struct {
	ID        string  `json:"id"`
	Status    string  `json:"status"`
	Reference string  `json:"reference"`
	CreatedAt string  `json:"createdAt"`
}

// GetPaymentStatus retrieves the status of a payment
func (m *ModulrClient) GetPaymentStatus(ctx context.Context, paymentID string) (string, error) {
	url := fmt.Sprintf("%s/payments/%s", m.baseURL, paymentID)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", m.apiKey))

	resp, err := m.httpClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var payment struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&payment); err != nil {
		return "", err
	}

	return payment.Status, nil
}



