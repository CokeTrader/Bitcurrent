// BitCurrent Exchange - API Gateway Main Entry Point
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bitcurrent-exchange/platform/services/api-gateway/internal/handlers"
	"github.com/bitcurrent-exchange/platform/services/api-gateway/internal/middleware"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
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
	if err := config.Load("api-gateway"); err != nil {
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

	log.Info("Starting API Gateway",
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

	// Initialize Redis cache
	redisCache, err := cache.NewRedisCache(cache.Config{
		URL:         config.GetString("redis.url"),
		Password:    config.GetString("redis.password"),
		PoolSize:    config.GetInt("redis.pool_size"),
		MinIdleConn: config.GetInt("redis.min_idle_conns"),
		MaxRetries:  config.GetInt("redis.max_retries"),
	}, log)
	if err != nil {
		log.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redisCache.Close()

	// Initialize JWT manager
	jwtManager := auth.NewJWTManager(
		config.GetString("jwt.secret"),
		config.GetString("jwt.issuer"),
		config.GetDuration("jwt.expiry"),
	)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, jwtManager, log)
	orderHandler := handlers.NewOrderHandler(db, log)
	accountHandler := handlers.NewAccountHandler(db, log)
	marketHandler := handlers.NewMarketHandler(db, redisCache, log)

	// Setup router
	router := mux.NewRouter()

	// Middleware
	router.Use(middleware.LoggingMiddleware(log))
	router.Use(middleware.RecoveryMiddleware(log))
	router.Use(middleware.CORSMiddleware())

	// Health check
	router.HandleFunc("/health", handlers.HealthCheckHandler(db, redisCache)).Methods("GET")
	router.HandleFunc("/ready", handlers.ReadinessHandler(db, redisCache)).Methods("GET")

	// Metrics
	router.Handle("/metrics", promhttp.Handler()).Methods("GET")

	// API v1 routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Public routes (no auth required)
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	api.HandleFunc("/auth/refresh", authHandler.RefreshToken).Methods("POST")
	api.HandleFunc("/markets", marketHandler.ListMarkets).Methods("GET")
	api.HandleFunc("/orderbook/{symbol}", marketHandler.GetOrderbook).Methods("GET")
	api.HandleFunc("/ticker/{symbol}", marketHandler.GetTicker).Methods("GET")

	// Handle CORS preflight requests for all API routes
	api.Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	// Protected routes (auth required)
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware(jwtManager, log))
	protected.Use(middleware.RateLimitMiddleware(redisCache, log))

	// Order management
	protected.HandleFunc("/orders", orderHandler.PlaceOrder).Methods("POST")
	protected.HandleFunc("/orders", orderHandler.ListOrders).Methods("GET")
	protected.HandleFunc("/orders/{id}", orderHandler.GetOrder).Methods("GET")
	protected.HandleFunc("/orders/{id}", orderHandler.CancelOrder).Methods("DELETE")

	// Account management
	protected.HandleFunc("/accounts/{id}/balances", accountHandler.GetBalances).Methods("GET")
	protected.HandleFunc("/accounts/{id}/transactions", accountHandler.GetTransactions).Methods("GET")

	// Deposits and withdrawals
	protected.HandleFunc("/deposits", accountHandler.InitiateDeposit).Methods("POST")
	protected.HandleFunc("/withdrawals", accountHandler.RequestWithdrawal).Methods("POST")
	protected.HandleFunc("/withdrawals/{id}", accountHandler.GetWithdrawal).Methods("GET")

	// User profile
	protected.HandleFunc("/profile", authHandler.GetProfile).Methods("GET")
	protected.HandleFunc("/profile", authHandler.UpdateProfile).Methods("PUT")

	// WebSocket endpoint
	router.HandleFunc("/ws", handlers.WebSocketHandler(log))

	// Start HTTP server
	addr := fmt.Sprintf("%s:%d",
		config.GetString("server.host"),
		config.GetInt("server.port"),
	)

	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  config.GetDuration("server.read_timeout"),
		WriteTimeout: config.GetDuration("server.write_timeout"),
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Info("API Gateway listening", zap.String("addr", addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server failed to start", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("Shutting down API Gateway...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("Server forced to shutdown", zap.Error(err))
	}

	log.Info("API Gateway stopped")
}
