// BitCurrent Exchange - Order Gateway Handler
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/order-gateway/internal/risk"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

type OrderHandler struct {
	db         *database.PostgresDB
	riskEngine *risk.RiskEngine
	logger     *zap.Logger
}

func NewOrderHandler(db *database.PostgresDB, riskEngine *risk.RiskEngine, logger *zap.Logger) *OrderHandler {
	return &OrderHandler{
		db:         db,
		riskEngine: riskEngine,
		logger:     logger,
	}
}

type ValidateOrderRequest struct {
	AccountID   string  `json:"account_id"`
	Symbol      string  `json:"symbol"`
	Side        string  `json:"side"`
	OrderType   string  `json:"order_type"`
	Price       *string `json:"price,omitempty"`
	Quantity    string  `json:"quantity"`
	TimeInForce string  `json:"time_in_force,omitempty"`
	PostOnly    bool    `json:"post_only,omitempty"`
}

type ValidateOrderResponse struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message,omitempty"`
}

func (h *OrderHandler) ValidateOrder(w http.ResponseWriter, r *http.Request) {
	var req ValidateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Parse account ID
	accountID, err := uuid.Parse(req.AccountID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	// Create order object for risk checks
	order := &risk.Order{
		AccountID: accountID,
		Symbol:    req.Symbol,
		Side:      req.Side,
		OrderType: req.OrderType,
		Price:     req.Price,
		Quantity:  req.Quantity,
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Run risk checks
	if err := h.riskEngine.CheckOrder(ctx, order); err != nil {
		h.logger.Warn("Order validation failed",
			zap.String("account_id", req.AccountID),
			zap.Error(err),
		)
		respondJSON(w, http.StatusOK, ValidateOrderResponse{
			Valid:   false,
			Message: err.Error(),
		})
		return
	}

	respondJSON(w, http.StatusOK, ValidateOrderResponse{
		Valid:   true,
		Message: "Order validation passed",
	})
}

type SubmitOrderRequest struct {
	AccountID   string  `json:"account_id"`
	Symbol      string  `json:"symbol"`
	Side        string  `json:"side"`
	OrderType   string  `json:"order_type"`
	Price       *string `json:"price,omitempty"`
	Quantity    string  `json:"quantity"`
	TimeInForce string  `json:"time_in_force,omitempty"`
	PostOnly    bool    `json:"post_only,omitempty"`
}

type SubmitOrderResponse struct {
	Success bool   `json:"success"`
	OrderID string `json:"order_id,omitempty"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

func (h *OrderHandler) SubmitOrder(w http.ResponseWriter, r *http.Request) {
	var req SubmitOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Parse account ID
	accountID, err := uuid.Parse(req.AccountID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid account ID")
		return
	}

	// Create order object for risk checks
	order := &risk.Order{
		AccountID: accountID,
		Symbol:    req.Symbol,
		Side:      req.Side,
		OrderType: req.OrderType,
		Price:     req.Price,
		Quantity:  req.Quantity,
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Run risk checks
	if err := h.riskEngine.CheckOrder(ctx, order); err != nil {
		h.logger.Warn("Order failed risk checks",
			zap.String("account_id", req.AccountID),
			zap.Error(err),
		)
		respondJSON(w, http.StatusOK, SubmitOrderResponse{
			Success: false,
			Status:  "rejected",
			Message: err.Error(),
		})
		return
	}

	// TODO: Reserve balance for buy orders

	// TODO: Forward to matching engine via gRPC
	// For now, just log and return success
	h.logger.Info("Order passed risk checks, would forward to matching engine",
		zap.String("account_id", req.AccountID),
		zap.String("symbol", req.Symbol),
		zap.String("side", req.Side),
	)

	// Mock order ID
	orderID := uuid.New().String()

	respondJSON(w, http.StatusOK, SubmitOrderResponse{
		Success: true,
		OrderID: orderID,
		Status:  "accepted",
		Message: "Order submitted to matching engine",
	})
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error":   http.StatusText(status),
		"message": message,
	})
}



