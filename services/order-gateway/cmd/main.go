// BitCurrent Exchange - Order Gateway Main Entry Point
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bitcurrent-exchange/platform/services/order-gateway/internal/handlers"
	"github.com/bitcurrent-exchange/platform/services/order-gateway/internal/risk"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/config"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/logger"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	if err := config.Load("order-gateway"); err != nil {
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

	log.Info("Starting Order Gateway",
		zap.String("version", "0.1.0"),
		zap.String("environment", config.GetString("logger.environment")),
	)

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

	// Initialize risk engine
	riskEngine := risk.NewRiskEngine(db, log)

	// Initialize handlers
	orderHandler := handlers.NewOrderHandler(db, riskEngine, log)

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

	// Internal API routes
	internal := router.PathPrefix("/internal/v1").Subrouter()
	internal.HandleFunc("/orders/validate", orderHandler.ValidateOrder).Methods("POST")
	internal.HandleFunc("/orders/submit", orderHandler.SubmitOrder).Methods("POST")

	// Start HTTP server
	addr := fmt.Sprintf("%s:%d",
		config.GetString("server.host"),
		config.GetInt("order_gateway.port"),
	)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Info("Order Gateway listening", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down Order Gateway...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("Server forced to shutdown", zap.Error(err))
	}

	log.Info("Order Gateway stopped")
}



