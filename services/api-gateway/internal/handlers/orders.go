// BitCurrent Exchange - Order Handlers
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type OrderHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewOrderHandler(db *database.PostgresDB, logger *zap.Logger) *OrderHandler {
	return &OrderHandler{
		db:     db,
		logger: logger,
	}
}

type PlaceOrderRequest struct {
	Symbol      string  `json:"symbol"`
	Side        string  `json:"side"`
	OrderType   string  `json:"order_type"`
	Price       *string `json:"price,omitempty"`
	Quantity    string  `json:"quantity"`
	TimeInForce string  `json:"time_in_force,omitempty"`
	PostOnly    bool    `json:"post_only,omitempty"`
}

type OrderResponse struct {
	ID              string  `json:"id"`
	Symbol          string  `json:"symbol"`
	Side            string  `json:"side"`
	OrderType       string  `json:"order_type"`
	Price           *string `json:"price,omitempty"`
	Quantity        string  `json:"quantity"`
	FilledQuantity  string  `json:"filled_quantity"`
	Status          string  `json:"status"`
	TimeInForce     string  `json:"time_in_force"`
	CreatedAt       string  `json:"created_at"`
}

func (h *OrderHandler) PlaceOrder(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	
	var req PlaceOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate input
	if req.Symbol == "" || req.Side == "" || req.OrderType == "" || req.Quantity == "" {
		respondError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	if req.Side != "buy" && req.Side != "sell" {
		respondError(w, http.StatusBadRequest, "Invalid side")
		return
	}

	if req.OrderType == "limit" && req.Price == nil {
		respondError(w, http.StatusBadRequest, "Price required for limit orders")
		return
	}

	if req.TimeInForce == "" {
		req.TimeInForce = "GTC"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Begin transaction
	tx, err := h.db.Pool.Begin(ctx)
	if err != nil {
		h.logger.Error("Failed to begin transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to place order")
		return
	}
	defer tx.Rollback(ctx)

	// TODO: Check balance (for buy orders)
	// TODO: Call order-gateway service for risk checks
	// TODO: Forward to matching engine via gRPC

	// Insert order into database
	var orderID uuid.UUID
	query := `
		INSERT INTO orders (
			account_id, symbol, side, order_type, price, quantity,
			status, time_in_force, post_only
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`

	err = tx.QueryRow(
		ctx, query,
		claims.AccountID, req.Symbol, req.Side, req.OrderType,
		req.Price, req.Quantity, "new", req.TimeInForce, req.PostOnly,
	).Scan(&orderID)

	if err != nil {
		h.logger.Error("Failed to insert order", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to place order")
		return
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("Failed to commit transaction", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to place order")
		return
	}

	h.logger.Info("Order placed",
		zap.String("order_id", orderID.String()),
		zap.String("account_id", claims.AccountID.String()),
	)

	respondJSON(w, http.StatusCreated, OrderResponse{
		ID:             orderID.String(),
		Symbol:         req.Symbol,
		Side:           req.Side,
		OrderType:      req.OrderType,
		Price:          req.Price,
		Quantity:       req.Quantity,
		FilledQuantity: "0",
		Status:         "new",
		TimeInForce:    req.TimeInForce,
		CreatedAt:      time.Now().Format(time.RFC3339),
	})
}

func (h *OrderHandler) ListOrders(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	pagination := ParsePaginationParams(r)

	// Get query parameters
	symbol := r.URL.Query().Get("symbol")
	status := r.URL.Query().Get("status")

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Build query
	query := `
		SELECT id, symbol, side, order_type, price, quantity, filled_quantity,
		       status, time_in_force, created_at
		FROM orders
		WHERE account_id = $1
	`
	args := []interface{}{claims.AccountID}
	argCount := 1

	if symbol != "" {
		argCount++
		query += fmt.Sprintf(" AND symbol = $%d", argCount)
		args = append(args, symbol)
	}

	if status != "" {
		argCount++
		query += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, status)
	}

	query += " ORDER BY created_at DESC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount+1, argCount+2)
	args = append(args, pagination.Limit, pagination.Offset)

	rows, err := h.db.Pool.Query(ctx, query, args...)
	if err != nil {
		h.logger.Error("Failed to query orders", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}
	defer rows.Close()

	var orders []OrderResponse
	for rows.Next() {
		var order OrderResponse
		var price *string
		var createdAt time.Time

		err := rows.Scan(
			&order.ID, &order.Symbol, &order.Side, &order.OrderType,
			&price, &order.Quantity, &order.FilledQuantity,
			&order.Status, &order.TimeInForce, &createdAt,
		)
		if err != nil {
			h.logger.Error("Failed to scan order", zap.Error(err))
			continue
		}

		order.Price = price
		order.CreatedAt = createdAt.Format(time.RFC3339)
		orders = append(orders, order)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"orders": orders,
		"page":   pagination.Page,
		"limit":  pagination.Limit,
	})
}

func (h *OrderHandler) GetOrder(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	vars := mux.Vars(r)
	orderID := vars["id"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var order OrderResponse
	var price *string
	var createdAt time.Time
	var accountID uuid.UUID

	query := `
		SELECT id, account_id, symbol, side, order_type, price, quantity,
		       filled_quantity, status, time_in_force, created_at
		FROM orders
		WHERE id = $1
	`

	err := h.db.Pool.QueryRow(ctx, query, orderID).Scan(
		&order.ID, &accountID, &order.Symbol, &order.Side, &order.OrderType,
		&price, &order.Quantity, &order.FilledQuantity,
		&order.Status, &order.TimeInForce, &createdAt,
	)

	if err != nil {
		respondError(w, http.StatusNotFound, "Order not found")
		return
	}

	// Verify ownership
	if accountID != claims.AccountID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	order.Price = price
	order.CreatedAt = createdAt.Format(time.RFC3339)

	respondJSON(w, http.StatusOK, order)
}

func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value("claims").(*auth.Claims)
	vars := mux.Vars(r)
	orderID := vars["id"]

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Verify ownership and check if cancellable
	var accountID uuid.UUID
	var status string
	checkQuery := `SELECT account_id, status FROM orders WHERE id = $1`
	err := h.db.Pool.QueryRow(ctx, checkQuery, orderID).Scan(&accountID, &status)

	if err != nil {
		respondError(w, http.StatusNotFound, "Order not found")
		return
	}

	if accountID != claims.AccountID {
		respondError(w, http.StatusForbidden, "Access denied")
		return
	}

	if status != "new" && status != "partial" {
		respondError(w, http.StatusBadRequest, "Order cannot be cancelled")
		return
	}

	// TODO: Call matching engine to cancel order via gRPC

	// Update order status
	updateQuery := `
		UPDATE orders
		SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW()
		WHERE id = $1 AND account_id = $2
	`

	_, err = h.db.Pool.Exec(ctx, updateQuery, orderID, claims.AccountID)
	if err != nil {
		h.logger.Error("Failed to cancel order", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to cancel order")
		return
	}

	h.logger.Info("Order cancelled",
		zap.String("order_id", orderID),
		zap.String("account_id", claims.AccountID.String()),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "Order cancelled successfully",
	})
}

