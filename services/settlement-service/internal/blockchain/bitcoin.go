// BitCurrent Exchange - Bitcoin Blockchain Integration
package blockchain

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// BitcoinClient handles Bitcoin blockchain operations
type BitcoinClient struct {
	rpcURL    string
	rpcUser   string
	rpcPass   string
	network   string // "mainnet", "testnet"
	logger    *zap.Logger
	httpClient *http.Client
}

// BitcoinConfig holds Bitcoin RPC configuration
type BitcoinConfig struct {
	RPCURL  string
	RPCUser string
	RPCPass string
	Network string
}

// NewBitcoinClient creates a new Bitcoin RPC client
func NewBitcoinClient(config BitcoinConfig, logger *zap.Logger) *BitcoinClient {
	return &BitcoinClient{
		rpcURL:  config.RPCURL,
		rpcUser: config.RPCUser,
		rpcPass: config.RPCPass,
		network: config.Network,
		logger:  logger,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// RPCRequest represents a Bitcoin RPC request
type RPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      string        `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

// RPCResponse represents a Bitcoin RPC response
type RPCResponse struct {
	Result interface{} `json:"result"`
	Error  *RPCError   `json:"error"`
	ID     string      `json:"id"`
}

// RPCError represents an RPC error
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// callRPC makes an RPC call to Bitcoin Core
func (c *BitcoinClient) callRPC(method string, params []interface{}) (interface{}, error) {
	request := RPCRequest{
		JSONRPC: "1.0",
		ID:      fmt.Sprintf("%d", time.Now().Unix()),
		Method:  method,
		Params:  params,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.rpcURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(c.rpcUser, c.rpcPass)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("RPC call failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var rpcResp RPCResponse
	if err := json.Unmarshal(body, &rpcResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC error: %s (code: %d)", rpcResp.Error.Message, rpcResp.Error.Code)
	}

	return rpcResp.Result, nil
}

// GetBlockHeight returns the current block height
func (c *BitcoinClient) GetBlockHeight() (int64, error) {
	result, err := c.callRPC("getblockcount", []interface{}{})
	if err != nil {
		return 0, err
	}

	height, ok := result.(float64)
	if !ok {
		return 0, fmt.Errorf("unexpected response type")
	}

	return int64(height), nil
}

// GetBalance returns the balance for an address
func (c *BitcoinClient) GetBalance(address string) (float64, error) {
	// Use listunspent to get balance for address
	result, err := c.callRPC("listunspent", []interface{}{0, 9999999, []string{address}})
	if err != nil {
		return 0, err
	}

	unspent, ok := result.([]interface{})
	if !ok {
		return 0, fmt.Errorf("unexpected response type")
	}

	var totalBalance float64
	for _, utxo := range unspent {
		utxoMap, ok := utxo.(map[string]interface{})
		if !ok {
			continue
		}
		if amount, ok := utxoMap["amount"].(float64); ok {
			totalBalance += amount
		}
	}

	return totalBalance, nil
}

// GetTransaction gets transaction details
func (c *BitcoinClient) GetTransaction(txid string) (map[string]interface{}, error) {
	result, err := c.callRPC("gettransaction", []interface{}{txid})
	if err != nil {
		return nil, err
	}

	tx, ok := result.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response type")
	}

	return tx, nil
}

// GetConfirmations returns the number of confirmations for a transaction
func (c *BitcoinClient) GetConfirmations(txid string) (int, error) {
	tx, err := c.GetTransaction(txid)
	if err != nil {
		return 0, err
	}

	confirmations, ok := tx["confirmations"].(float64)
	if !ok {
		return 0, nil
	}

	return int(confirmations), nil
}

// SendToAddress sends BTC to an address
func (c *BitcoinClient) SendToAddress(address string, amount float64) (string, error) {
	result, err := c.callRPC("sendtoaddress", []interface{}{address, amount})
	if err != nil {
		return "", err
	}

	txid, ok := result.(string)
	if !ok {
		return "", fmt.Errorf("unexpected response type")
	}

	c.logger.Info("Bitcoin transaction sent",
		zap.String("txid", txid),
		zap.String("address", address),
		zap.Float64("amount", amount),
	)

	return txid, nil
}

// ValidateAddress validates a Bitcoin address
func (c *BitcoinClient) ValidateAddress(address string) (bool, error) {
	result, err := c.callRPC("validateaddress", []interface{}{address})
	if err != nil {
		return false, err
	}

	validation, ok := result.(map[string]interface{})
	if !ok {
		return false, fmt.Errorf("unexpected response type")
	}

	isValid, ok := validation["isvalid"].(bool)
	if !ok {
		return false, nil
	}

	return isValid, nil
}

// EstimateFee estimates transaction fee
func (c *BitcoinClient) EstimateFee(blocks int) (float64, error) {
	result, err := c.callRPC("estimatesmartfee", []interface{}{blocks})
	if err != nil {
		return 0, err
	}

	estimate, ok := result.(map[string]interface{})
	if !ok {
		return 0, fmt.Errorf("unexpected response type")
	}

	feeRate, ok := estimate["feerate"].(float64)
	if !ok {
		// Return default fee if estimation fails
		return 0.00001, nil // 1 sat/vB
	}

	return feeRate, nil
}



