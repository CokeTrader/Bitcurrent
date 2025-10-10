// BitCurrent Exchange - Market Data Service Main Entry Point
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bitcurrent-exchange/platform/services/market-data-service/internal/handlers"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/cache"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/config"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/logger"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	if err := config.Load("market-data-service"); err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Initialize logger
	log, err := logger.NewLogger(logger.Config{
		Level:       config.GetString("logger.level"),
		Environment: config.GetString("logger.environment"),
		OutputPaths: []string{"stdout"},
	})
	if err != nil {
		fmt.Printf("Failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer log.Sync()

	log.Info("Starting Market Data Service", zap.String("version", "0.1.0"))

	// Initialize database
	db, err := database.NewPostgresDB(database.Config{
		URL:             config.GetString("database.url"),
		MaxConns:        int32(config.GetInt("database.max_conns")),
		MinConns:        int32(config.GetInt("database.min_conns")),
		MaxConnLifetime: config.GetDuration("database.max_conn_lifetime"),
		MaxConnIdleTime: config.GetDuration("database.max_conn_idle_time"),
	}, log)
	if err != nil {
		log.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Initialize Redis cache
	redisCache, err := cache.NewRedisCache(cache.Config{
		URL:         config.GetString("redis.url"),
		PoolSize:    config.GetInt("redis.pool_size"),
		MinIdleConn: config.GetInt("redis.min_idle_conns"),
		MaxRetries:  config.GetInt("redis.max_retries"),
	}, log)
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisCache.Close()

	// Initialize handlers
	candleHandler := handlers.NewCandleHandler(db, redisCache, log)
	tickerHandler := handlers.NewTickerHandler(db, redisCache, log)

	// Setup router
	router := mux.NewRouter()

	// Health check
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "healthy"}`))
	}).Methods("GET")

	// Metrics
	router.Handle("/metrics", promhttp.Handler()).Methods("GET")

	// Public API routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Candle data
	api.HandleFunc("/candles/{symbol}", candleHandler.GetCandles).Methods("GET")
	
	// Ticker data
	api.HandleFunc("/ticker/{symbol}", tickerHandler.GetTicker).Methods("GET")
	api.HandleFunc("/tickers", tickerHandler.GetAllTickers).Methods("GET")

	// Start HTTP server
	addr := fmt.Sprintf("%s:%d",
		config.GetString("server.host"),
		config.GetInt("market_data.port"),
	)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// TODO: Start Kafka consumer for trade events in goroutine
	// TODO: Aggregate trades into candles
	// TODO: Update ticker data

	// Start server
	go func() {
		log.Info("Market Data Service listening", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down Market Data Service...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Market Data Service stopped")
}



