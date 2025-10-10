// BitCurrent Exchange - Ticker Handler
package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/cache"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type TickerHandler struct {
	db     *database.PostgresDB
	cache  *cache.RedisCache
	logger *zap.Logger
}

func NewTickerHandler(db *database.PostgresDB, cache *cache.RedisCache, logger *zap.Logger) *TickerHandler {
	return &TickerHandler{
		db:     db,
		cache:  cache,
		logger: logger,
	}
}

type Ticker struct {
	Symbol              string `json:"symbol"`
	LastPrice           string `json:"last_price"`
	Volume24h           string `json:"volume_24h"`
	QuoteVolume24h      string `json:"quote_volume_24h,omitempty"`
	PriceChange24h      string `json:"price_change_24h,omitempty"`
	PriceChangePercent24h string `json:"price_change_percent_24h,omitempty"`
	High24h             string `json:"high_24h"`
	Low24h              string `json:"low_24h"`
	TradesCount24h      int    `json:"trades_count_24h"`
	Timestamp           string `json:"timestamp"`
}

func (h *TickerHandler) GetTicker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Try cache first
	cacheKey := fmt.Sprintf("ticker:%s", symbol)
	var ticker Ticker

	if err := h.cache.GetJSON(ctx, cacheKey, &ticker); err == nil {
		respondJSON(w, http.StatusOK, ticker)
		return
	}

	// Query from ticker_data table
	query := `
		SELECT 
			symbol, last_price, volume_24h, quote_volume_24h,
			price_change_24h, price_change_percent_24h,
			high_24h, low_24h, trades_count_24h, timestamp
		FROM ticker_data
		WHERE symbol = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var timestamp time.Time
	var quoteVolume, priceChange, priceChangePercent *string

	err := h.db.Pool.QueryRow(ctx, query, symbol).Scan(
		&ticker.Symbol,
		&ticker.LastPrice,
		&ticker.Volume24h,
		&quoteVolume,
		&priceChange,
		&priceChangePercent,
		&ticker.High24h,
		&ticker.Low24h,
		&ticker.TradesCount24h,
		&timestamp,
	)

	if err != nil {
		// Fallback: Calculate from trades
		ticker = h.calculateTickerFromTrades(ctx, symbol)
		if ticker.Symbol == "" {
			respondError(w, http.StatusNotFound, "Ticker data not available")
			return
		}
	} else {
		if quoteVolume != nil {
			ticker.QuoteVolume24h = *quoteVolume
		}
		if priceChange != nil {
			ticker.PriceChange24h = *priceChange
		}
		if priceChangePercent != nil {
			ticker.PriceChangePercent24h = *priceChangePercent
		}
		ticker.Timestamp = timestamp.Format(time.RFC3339)
	}

	// Cache for 5 seconds
	h.cache.SetJSON(ctx, cacheKey, ticker, 5*time.Second)

	respondJSON(w, http.StatusOK, ticker)
}

func (h *TickerHandler) GetAllTickers(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Get list of active trading pairs
	pairsQuery := `SELECT symbol FROM trading_pairs WHERE status = 'active'`
	rows, err := h.db.Pool.Query(ctx, pairsQuery)
	if err != nil {
		h.logger.Error("Failed to query trading pairs", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch tickers")
		return
	}
	defer rows.Close()

	var symbols []string
	for rows.Next() {
		var symbol string
		if err := rows.Scan(&symbol); err != nil {
			continue
		}
		symbols = append(symbols, symbol)
	}

	// Get ticker for each symbol
	var tickers []Ticker
	for _, symbol := range symbols {
		ticker := h.getTickerForSymbol(ctx, symbol)
		if ticker.Symbol != "" {
			tickers = append(tickers, ticker)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"tickers": tickers,
		"count":   len(tickers),
	})
}

func (h *TickerHandler) getTickerForSymbol(ctx context.Context, symbol string) Ticker {
	var ticker Ticker
	query := `
		SELECT 
			symbol, last_price, volume_24h, high_24h, low_24h,
			trades_count_24h, timestamp
		FROM ticker_data
		WHERE symbol = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var timestamp time.Time
	err := h.db.Pool.QueryRow(ctx, query, symbol).Scan(
		&ticker.Symbol,
		&ticker.LastPrice,
		&ticker.Volume24h,
		&ticker.High24h,
		&ticker.Low24h,
		&ticker.TradesCount24h,
		&timestamp,
	)

	if err != nil {
		return Ticker{}
	}

	ticker.Timestamp = timestamp.Format(time.RFC3339)
	return ticker
}

func (h *TickerHandler) calculateTickerFromTrades(ctx context.Context, symbol string) Ticker {
	query := `
		SELECT 
			COUNT(*) as trade_count,
			SUM(quantity) as volume,
			MAX(price) as high,
			MIN(price) as low,
			(SELECT price FROM trades WHERE symbol = $1 ORDER BY executed_at DESC LIMIT 1) as last_price
		FROM trades
		WHERE symbol = $1 AND executed_at > NOW() - INTERVAL '24 hours'
	`

	var ticker Ticker
	var tradeCount int
	var volume, high, low, lastPrice *string

	err := h.db.Pool.QueryRow(ctx, query, symbol).Scan(
		&tradeCount, &volume, &high, &low, &lastPrice,
	)

	if err != nil || lastPrice == nil {
		return Ticker{}
	}

	ticker.Symbol = symbol
	ticker.LastPrice = *lastPrice
	ticker.TradesCount24h = tradeCount
	ticker.Timestamp = time.Now().Format(time.RFC3339)

	if volume != nil {
		ticker.Volume24h = *volume
	}
	if high != nil {
		ticker.High24h = *high
	}
	if low != nil {
		ticker.Low24h = *low
	}

	return ticker
}



