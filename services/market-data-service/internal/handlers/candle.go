// BitCurrent Exchange - Candle Handler
package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/cache"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type CandleHandler struct {
	db     *database.PostgresDB
	cache  *cache.RedisCache
	logger *zap.Logger
}

func NewCandleHandler(db *database.PostgresDB, cache *cache.RedisCache, logger *zap.Logger) *CandleHandler {
	return &CandleHandler{
		db:     db,
		cache:  cache,
		logger: logger,
	}
}

type Candle struct {
	Timestamp  string `json:"timestamp"`
	Open       string `json:"open"`
	High       string `json:"high"`
	Low        string `json:"low"`
	Close      string `json:"close"`
	Volume     string `json:"volume"`
	TradeCount int    `json:"trade_count"`
}

func (h *CandleHandler) GetCandles(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	// Parse query parameters
	interval := r.URL.Query().Get("interval")
	if interval == "" {
		interval = "1h"
	}

	limit := 100
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := parseInt(l); err == nil && parsed > 0 && parsed <= 1000 {
			limit = parsed
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Map interval to materialized view
	var viewName string
	switch interval {
	case "1m":
		viewName = "market_data_1m"
	case "5m":
		viewName = "market_data_5m"
	case "1h":
		viewName = "market_data_1h"
	case "1d":
		viewName = "market_data_1d"
	default:
		respondError(w, http.StatusBadRequest, "Invalid interval. Supported: 1m, 5m, 1h, 1d")
		return
	}

	// Query candles from TimescaleDB continuous aggregate
	query := fmt.Sprintf(`
		SELECT bucket, open, high, low, close, volume, trade_count
		FROM %s
		WHERE symbol = $1
		ORDER BY bucket DESC
		LIMIT $2
	`, viewName)

	rows, err := h.db.Pool.Query(ctx, query, symbol, limit)
	if err != nil {
		h.logger.Error("Failed to query candles", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch candles")
		return
	}
	defer rows.Close()

	var candles []Candle
	for rows.Next() {
		var candle Candle
		var timestamp time.Time

		err := rows.Scan(
			&timestamp,
			&candle.Open,
			&candle.High,
			&candle.Low,
			&candle.Close,
			&candle.Volume,
			&candle.TradeCount,
		)
		if err != nil {
			h.logger.Error("Failed to scan candle", zap.Error(err))
			continue
		}

		candle.Timestamp = timestamp.Format(time.RFC3339)
		candles = append(candles, candle)
	}

	// Reverse to get chronological order
	for i, j := 0, len(candles)-1; i < j; i, j = i+1, j-1 {
		candles[i], candles[j] = candles[j], candles[i]
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"symbol":   symbol,
		"interval": interval,
		"candles":  candles,
	})
}

func parseInt(s string) (int, error) {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	return i, err
}

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

