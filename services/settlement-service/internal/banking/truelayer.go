// BitCurrent Exchange - TrueLayer Open Banking Integration
package banking

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"go.uber.org/zap"
)

// TrueLayerClient handles TrueLayer Open Banking operations
type TrueLayerClient struct {
	baseURL      string
	clientID     string
	clientSecret string
	redirectURI  string
	httpClient   *http.Client
	logger       *zap.Logger
}

// TrueLayerConfig holds TrueLayer configuration
type TrueLayerConfig struct {
	BaseURL      string
	ClientID     string
	ClientSecret string
	RedirectURI  string
}

// NewTrueLayerClient creates a new TrueLayer client
func NewTrueLayerClient(config TrueLayerConfig, logger *zap.Logger) *TrueLayerClient {
	return &TrueLayerClient{
		baseURL:      config.BaseURL,
		clientID:     config.ClientID,
		clientSecret: config.ClientSecret,
		redirectURI:  config.RedirectURI,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

// GetAuthorizationURL generates OAuth2 authorization URL for user
func (t *TrueLayerClient) GetAuthorizationURL(state string) string {
	params := url.Values{}
	params.Add("response_type", "code")
	params.Add("client_id", t.clientID)
	params.Add("redirect_uri", t.redirectURI)
	params.Add("scope", "info accounts balance transactions offline_access")
	params.Add("state", state)
	params.Add("providers", "uk-ob-all uk-oauth-all")

	authURL := fmt.Sprintf("%s/connect/token?%s", t.baseURL, params.Encode())

	t.logger.Debug("Generated TrueLayer auth URL")

	return authURL
}

// ExchangeCodeForToken exchanges authorization code for access token
func (t *TrueLayerClient) ExchangeCodeForToken(ctx context.Context, code string) (*TokenResponse, error) {
	endpoint := fmt.Sprintf("%s/connect/token", t.baseURL)

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("client_id", t.clientID)
	data.Set("client_secret", t.clientSecret)
	data.Set("redirect_uri", t.redirectURI)
	data.Set("code", code)

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBufferString(data.Encode()))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := t.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}

	t.logger.Info("Token exchanged successfully")

	return &tokenResp, nil
}

// TokenResponse represents OAuth2 token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// GetAccounts retrieves user's bank accounts
func (t *TrueLayerClient) GetAccounts(ctx context.Context, accessToken string) ([]BankAccount, error) {
	endpoint := fmt.Sprintf("%s/data/v1/accounts", t.baseURL)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := t.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var accountsResp struct {
		Results []BankAccount `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&accountsResp); err != nil {
		return nil, err
	}

	return accountsResp.Results, nil
}

// BankAccount represents a user's bank account
type BankAccount struct {
	AccountID     string  `json:"account_id"`
	AccountNumber string  `json:"account_number"`
	SortCode      string  `json:"sort_code"`
	AccountType   string  `json:"account_type"`
	DisplayName   string  `json:"display_name"`
	Currency      string  `json:"currency"`
	Balance       float64 `json:"balance"`
}

// GetBalance retrieves account balance
func (t *TrueLayerClient) GetBalance(ctx context.Context, accessToken, accountID string) (float64, error) {
	endpoint := fmt.Sprintf("%s/data/v1/accounts/%s/balance", t.baseURL, accountID)

	httpReq, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return 0, err
	}

	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := t.httpClient.Do(httpReq)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var balanceResp struct {
		Results []struct {
			Current float64 `json:"current"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&balanceResp); err != nil {
		return 0, err
	}

	if len(balanceResp.Results) == 0 {
		return 0, fmt.Errorf("no balance data")
	}

	return balanceResp.Results[0].Current, nil
}

// CreatePaymentRequest creates a payment request for instant deposit
func (t *TrueLayerClient) CreatePaymentRequest(ctx context.Context, accessToken string, amount float64, reference string) (string, error) {
	endpoint := fmt.Sprintf("%s/payments", t.baseURL)

	paymentReq := map[string]interface{}{
		"amount_in_minor": int(amount * 100), // Convert to pence
		"currency":        "GBP",
		"payment_method": map[string]interface{}{
			"type": "bank_transfer",
			"provider_selection": map[string]interface{}{
				"type": "user_selected",
			},
			"beneficiary": map[string]interface{}{
				"type":                "merchant_account",
				"merchant_account_id": "bitcurrent_account",
				"reference":           reference,
			},
		},
		"user": map[string]interface{}{
			"id": "user_id",
		},
	}

	jsonData, err := json.Marshal(paymentReq)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := t.httpClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var paymentResp struct {
		ID                   string `json:"id"`
		AuthorizationFlowURI string `json:"authorization_flow.actions.next.uri"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&paymentResp); err != nil {
		return "", err
	}

	t.logger.Info("Payment request created",
		zap.String("payment_id", paymentResp.ID),
	)

	return paymentResp.AuthorizationFlowURI, nil
}
