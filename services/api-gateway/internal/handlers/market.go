// BitCurrent Exchange - Market Data Handlers
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

type MarketHandler struct {
	db     *database.PostgresDB
	cache  *cache.RedisCache
	logger *zap.Logger
}

func NewMarketHandler(db *database.PostgresDB, cache *cache.RedisCache, logger *zap.Logger) *MarketHandler {
	return &MarketHandler{
		db:     db,
		cache:  cache,
		logger: logger,
	}
}

type TradingPair struct {
	Symbol           string `json:"symbol"`
	BaseCurrency     string `json:"base_currency"`
	QuoteCurrency    string `json:"quote_currency"`
	MinOrderSize     string `json:"min_order_size"`
	MaxOrderSize     string `json:"max_order_size"`
	PricePrecision   int    `json:"price_precision"`
	QuantityPrecision int   `json:"quantity_precision"`
	MakerFeeBps      int    `json:"maker_fee_bps"`
	TakerFeeBps      int    `json:"taker_fee_bps"`
	Status           string `json:"status"`
}

type Ticker struct {
	Symbol              string `json:"symbol"`
	LastPrice           string `json:"last_price"`
	Volume24h           string `json:"volume_24h"`
	QuoteVolume24h      string `json:"quote_volume_24h"`
	PriceChange24h      string `json:"price_change_24h"`
	PriceChangePercent24h string `json:"price_change_percent_24h"`
	High24h             string `json:"high_24h"`
	Low24h              string `json:"low_24h"`
	TradesCount24h      int    `json:"trades_count_24h"`
	Timestamp           string `json:"timestamp"`
}

type OrderbookLevel struct {
	Price    string `json:"price"`
	Quantity string `json:"quantity"`
}

type Orderbook struct {
	Symbol    string           `json:"symbol"`
	Bids      []OrderbookLevel `json:"bids"`
	Asks      []OrderbookLevel `json:"asks"`
	Timestamp string           `json:"timestamp"`
}

func (h *MarketHandler) ListMarkets(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Try cache first
	var markets []TradingPair
	cacheKey := "markets:all"
	
	if err := h.cache.GetJSON(ctx, cacheKey, &markets); err == nil {
		h.logger.Debug("Markets served from cache")
		respondJSON(w, http.StatusOK, map[string]interface{}{
			"markets": markets,
		})
		return
	}

	// Query from database
	query := `
		SELECT symbol, base_currency, quote_currency, min_order_size,
		       max_order_size, price_precision, quantity_precision,
		       maker_fee_bps, taker_fee_bps, status
		FROM trading_pairs
		WHERE status = 'active'
		ORDER BY symbol
	`

	rows, err := h.db.Pool.Query(ctx, query)
	if err != nil {
		h.logger.Error("Failed to query markets", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch markets")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var market TradingPair
		var maxOrderSize *string

		err := rows.Scan(
			&market.Symbol, &market.BaseCurrency, &market.QuoteCurrency,
			&market.MinOrderSize, &maxOrderSize, &market.PricePrecision,
			&market.QuantityPrecision, &market.MakerFeeBps, &market.TakerFeeBps,
			&market.Status,
		)
		if err != nil {
			h.logger.Error("Failed to scan market", zap.Error(err))
			continue
		}

		if maxOrderSize != nil {
			market.MaxOrderSize = *maxOrderSize
		}

		markets = append(markets, market)
	}

	// Cache for 1 minute
	if err := h.cache.SetJSON(ctx, cacheKey, markets, time.Minute); err != nil {
		h.logger.Warn("Failed to cache markets", zap.Error(err))
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"markets": markets,
	})
}

func (h *MarketHandler) GetOrderbook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	depth := 20
	if d := r.URL.Query().Get("depth"); d != "" {
		if parsed, err := parseInt(d); err == nil && parsed > 0 && parsed <= 100 {
			depth = parsed
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Try cache first
	cacheKey := fmt.Sprintf("orderbook:%s:%d", symbol, depth)
	var orderbook Orderbook

	if err := h.cache.GetJSON(ctx, cacheKey, &orderbook); err == nil {
		h.logger.Debug("Orderbook served from cache", zap.String("symbol", symbol))
		respondJSON(w, http.StatusOK, orderbook)
		return
	}

	// TODO: Call matching engine gRPC GetOrderBook
	// For now, return mock data from database or empty orderbook

	orderbook = Orderbook{
		Symbol:    symbol,
		Bids:      []OrderbookLevel{},
		Asks:      []OrderbookLevel{},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	// Query open orders from database as fallback
	query := `
		SELECT price, SUM(quantity - filled_quantity) as total_qty, side
		FROM orders
		WHERE symbol = $1 AND status IN ('new', 'partial')
		GROUP BY price, side
		ORDER BY CASE WHEN side = 'buy' THEN price END DESC,
		         CASE WHEN side = 'sell' THEN price END ASC
		LIMIT $2
	`

	rows, err := h.db.Pool.Query(ctx, query, symbol, depth*2)
	if err != nil {
		h.logger.Error("Failed to query orderbook", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch orderbook")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var price, quantity, side string

		if err := rows.Scan(&price, &quantity, &side); err != nil {
			continue
		}

		level := OrderbookLevel{
			Price:    price,
			Quantity: quantity,
		}

		if side == "buy" {
			orderbook.Bids = append(orderbook.Bids, level)
		} else {
			orderbook.Asks = append(orderbook.Asks, level)
		}
	}

	// Cache for 5 seconds
	if err := h.cache.SetJSON(ctx, cacheKey, orderbook, 5*time.Second); err != nil {
		h.logger.Warn("Failed to cache orderbook", zap.Error(err))
	}

	respondJSON(w, http.StatusOK, orderbook)
}

func (h *MarketHandler) GetTicker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	symbol := vars["symbol"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Try cache first
	cacheKey := fmt.Sprintf("ticker:%s", symbol)
	var ticker Ticker

	if err := h.cache.GetJSON(ctx, cacheKey, &ticker); err == nil {
		h.logger.Debug("Ticker served from cache", zap.String("symbol", symbol))
		respondJSON(w, http.StatusOK, ticker)
		return
	}

	// Query from ticker_data table
	query := `
		SELECT symbol, last_price, volume_24h, quote_volume_24h,
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
		&ticker.Symbol, &ticker.LastPrice, &ticker.Volume24h, &quoteVolume,
		&priceChange, &priceChangePercent, &ticker.High24h, &ticker.Low24h,
		&ticker.TradesCount24h, &timestamp,
	)

	if err != nil {
		// If no ticker data, calculate from trades table
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
	if err := h.cache.SetJSON(ctx, cacheKey, ticker, 5*time.Second); err != nil {
		h.logger.Warn("Failed to cache ticker", zap.Error(err))
	}

	respondJSON(w, http.StatusOK, ticker)
}

func (h *MarketHandler) calculateTickerFromTrades(ctx context.Context, symbol string) Ticker {
	// Fallback: Calculate ticker from trades table
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
		return Ticker{} // Empty ticker
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

