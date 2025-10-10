.PHONY: help
.DEFAULT_GOAL := help

# BitCurrent Exchange - Makefile
# Common development and deployment commands

##@ Help

help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

dev: ## Start complete local development environment
	@echo "🚀 Starting BitCurrent development environment..."
	@make infra-up
	@sleep 10
	@make migrate-up
	@echo "✅ Development environment ready!"

setup: ## Initial project setup
	@echo "⚙️  Setting up BitCurrent Exchange..."
	@cp -n .env.sample .env || true
	@echo "✅ Created .env file (edit as needed)"
	@echo "📦 Installing dependencies..."
	@cd frontend && npm install
	@echo "✅ Setup complete! Run 'make dev' to start."

clean: ## Clean build artifacts and caches
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf matching-engine/target
	@rm -rf services/*/bin
	@cd frontend && rm -rf .next node_modules/.cache
	@echo "✅ Clean complete"

reset: ## Reset entire local environment (DANGEROUS - deletes all data!)
	@echo "⚠️  WARNING: This will delete all local data!"
	@read -p "Are you sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@make docker-down
	@docker volume rm -f bitcurrent-postgres-data bitcurrent-redis-data bitcurrent-kafka-data bitcurrent-zookeeper-data bitcurrent-timescale-data || true
	@echo "✅ Environment reset complete"

##@ Infrastructure

infra-up: ## Start infrastructure services (PostgreSQL, Redis, Kafka)
	@echo "🏗️  Starting infrastructure services..."
	@docker-compose up -d postgres redis zookeeper kafka timescaledb
	@echo "⏳ Waiting for services to be healthy..."
	@sleep 5
	@echo "✅ Infrastructure services running"

infra-down: ## Stop infrastructure services
	@echo "🛑 Stopping infrastructure services..."
	@docker-compose down
	@echo "✅ Infrastructure services stopped"

infra-logs: ## View infrastructure logs
	@docker-compose logs -f postgres redis kafka

infra-status: ## Check infrastructure service status
	@docker-compose ps

##@ Database

migrate-up: ## Run database migrations
	@echo "📊 Running database migrations..."
	@cd migrations && \
	  docker run --rm --network host -v $(PWD)/migrations/postgresql:/migrations \
	  migrate/migrate -path=/migrations -database "postgres://bitcurrent:localdev@localhost:5432/bitcurrent?sslmode=disable" up
	@echo "✅ Migrations complete"

migrate-down: ## Rollback last database migration
	@echo "⏪ Rolling back last migration..."
	@cd migrations && \
	  docker run --rm --network host -v $(PWD)/migrations/postgresql:/migrations \
	  migrate/migrate -path=/migrations -database "postgres://bitcurrent:localdev@localhost:5432/bitcurrent?sslmode=disable" down 1
	@echo "✅ Rollback complete"

migrate-create: ## Create new migration (usage: make migrate-create NAME=add_users_table)
	@if [ -z "$(NAME)" ]; then echo "❌ Error: NAME is required. Usage: make migrate-create NAME=add_users_table"; exit 1; fi
	@mkdir -p migrations/postgresql
	@cd migrations/postgresql && \
	  docker run --rm -v $(PWD)/migrations/postgresql:/migrations \
	  migrate/migrate create -ext sql -dir /migrations -seq $(NAME)
	@echo "✅ Migration files created in migrations/postgresql/"

db-seed: ## Load seed/demo data
	@echo "🌱 Loading seed data..."
	@docker exec -i bitcurrent-postgres psql -U bitcurrent -d bitcurrent < scripts/seed-data.sql
	@echo "✅ Seed data loaded"

db-shell: ## Open PostgreSQL shell
	@docker exec -it bitcurrent-postgres psql -U bitcurrent -d bitcurrent

db-backup: ## Backup database to file
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@docker exec bitcurrent-postgres pg_dump -U bitcurrent bitcurrent > backups/bitcurrent-$(shell date +%Y%m%d-%H%M%S).sql
	@echo "✅ Backup saved to backups/"

db-restore: ## Restore database from latest backup
	@echo "📥 Restoring database from latest backup..."
	@docker exec -i bitcurrent-postgres psql -U bitcurrent bitcurrent < $(shell ls -t backups/*.sql | head -1)
	@echo "✅ Database restored"

##@ Build

build: ## Build all services
	@echo "🔨 Building all services..."
	@make build-matching
	@make build-services
	@make build-frontend
	@echo "✅ All services built"

build-matching: ## Build Rust matching engine
	@echo "🦀 Building matching engine (Rust)..."
	@cd matching-engine && cargo build --release
	@echo "✅ Matching engine built"

build-services: ## Build Go microservices
	@echo "🐹 Building Go services..."
	@cd services/api-gateway && go build -o bin/api-gateway ./cmd/main.go
	@cd services/order-gateway && go build -o bin/order-gateway ./cmd/main.go
	@cd services/ledger-service && go build -o bin/ledger-service ./cmd/main.go
	@cd services/settlement-service && go build -o bin/settlement-service ./cmd/main.go
	@cd services/market-data-service && go build -o bin/market-data-service ./cmd/main.go
	@cd services/compliance-service && go build -o bin/compliance-service ./cmd/main.go
	@echo "✅ Go services built"

build-frontend: ## Build Next.js frontend
	@echo "⚛️  Building frontend..."
	@cd frontend && npm run build
	@echo "✅ Frontend built"

##@ Testing

test: ## Run all tests
	@echo "🧪 Running all tests..."
	@make test-unit
	@make test-integration
	@echo "✅ All tests passed"

test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	@cd matching-engine && cargo test
	@cd services && go test -v -race -cover ./...
	@cd frontend && npm run test
	@echo "✅ Unit tests passed"

test-integration: ## Run integration tests
	@echo "🧪 Running integration tests..."
	@cd services && go test -v -tags=integration ./...
	@echo "✅ Integration tests passed"

test-e2e: ## Run end-to-end tests with Playwright
	@echo "🧪 Running E2E tests..."
	@cd frontend && npm run test:e2e
	@echo "✅ E2E tests passed"

test-load: ## Run load tests with k6
	@echo "🧪 Running load tests..."
	@k6 run tests/load/exchange-load-test.js
	@echo "✅ Load tests complete"

coverage: ## Generate test coverage reports
	@echo "📊 Generating coverage reports..."
	@cd matching-engine && cargo tarpaulin --out Html
	@cd services && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out -o coverage.html
	@cd frontend && npm run test:coverage
	@echo "✅ Coverage reports generated"

##@ Code Quality

lint: ## Run linters on all code
	@echo "🔍 Running linters..."
	@cd matching-engine && cargo clippy -- -D warnings
	@cd services && golangci-lint run ./...
	@cd frontend && npm run lint
	@echo "✅ Linting complete"

format: ## Format all code
	@echo "✨ Formatting code..."
	@cd matching-engine && cargo fmt
	@cd services && gofmt -w .
	@cd frontend && npm run format
	@echo "✅ Code formatted"

security-scan: ## Run security vulnerability scans
	@echo "🔒 Running security scans..."
	@cd matching-engine && cargo audit
	@cd services && gosec ./...
	@cd frontend && npm audit
	@echo "✅ Security scans complete"

##@ Docker

docker-build: ## Build all Docker images
	@echo "🐳 Building Docker images..."
	@docker-compose build
	@echo "✅ Docker images built"

docker-up: ## Start all services in Docker
	@echo "🐳 Starting all services in Docker..."
	@docker-compose up -d
	@echo "✅ All services running. Access:"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - API: http://localhost:8080"
	@echo "  - Grafana: http://localhost:3001"
	@echo "  - Kafka UI: http://localhost:8090"

docker-down: ## Stop all Docker services
	@echo "🛑 Stopping Docker services..."
	@docker-compose down
	@echo "✅ Docker services stopped"

docker-logs: ## View logs from all Docker services
	@docker-compose logs -f

docker-ps: ## List running Docker containers
	@docker-compose ps

docker-clean: ## Remove all Docker images and volumes
	@echo "🧹 Cleaning Docker resources..."
	@docker-compose down -v --rmi all
	@echo "✅ Docker resources cleaned"

##@ Deployment

deploy-dev: ## Deploy to development environment
	@echo "🚀 Deploying to development..."
	@kubectl config use-context bitcurrent-dev
	@helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent -f ./infrastructure/helm/values-dev.yaml
	@echo "✅ Deployed to development"

deploy-staging: ## Deploy to staging environment
	@echo "🚀 Deploying to staging..."
	@kubectl config use-context bitcurrent-staging
	@helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent -f ./infrastructure/helm/values-staging.yaml
	@echo "✅ Deployed to staging"

deploy-prod: ## Deploy to production (requires confirmation)
	@echo "⚠️  Deploying to PRODUCTION..."
	@read -p "Are you absolutely sure? (yes/no): " confirm && [ "$$confirm" = "yes" ] || exit 1
	@kubectl config use-context bitcurrent-prod
	@helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent -f ./infrastructure/helm/values-prod.yaml
	@echo "✅ Deployed to production"

##@ Monitoring

logs: ## View logs from all services
	@docker-compose logs -f

logs-api: ## View API gateway logs
	@docker-compose logs -f api-gateway

logs-matching: ## View matching engine logs
	@docker-compose logs -f matching-engine

logs-frontend: ## View frontend logs
	@cd frontend && npm run logs

metrics: ## Open Prometheus metrics dashboard
	@open http://localhost:9090

dashboard: ## Open Grafana dashboard
	@open http://localhost:3001

tracing: ## Open Jaeger tracing UI
	@open http://localhost:16686

##@ Utilities

shell-postgres: ## Open PostgreSQL shell
	@docker exec -it bitcurrent-postgres psql -U bitcurrent bitcurrent

shell-redis: ## Open Redis CLI
	@docker exec -it bitcurrent-redis redis-cli

shell-api: ## Shell into API gateway container
	@docker exec -it bitcurrent-api-gateway sh

seed-data: ## Load demo/seed data
	@echo "🌱 Loading demo data..."
	@docker exec -i bitcurrent-postgres psql -U bitcurrent bitcurrent < scripts/seed-data.sql
	@echo "✅ Demo data loaded"

benchmark: ## Run performance benchmarks
	@echo "📊 Running benchmarks..."
	@cd matching-engine && cargo bench
	@cd services && go test -bench=. -benchmem ./...
	@echo "✅ Benchmarks complete"

docs-serve: ## Serve API documentation locally
	@echo "📚 Serving API documentation..."
	@cd docs && python3 -m http.server 8000

generate-api-docs: ## Generate API documentation from OpenAPI spec
	@echo "📚 Generating API documentation..."
	@docker run --rm -v $(PWD):/local openapitools/openapi-generator-cli generate \
	  -i /local/docs/api/openapi.yaml \
	  -g html2 \
	  -o /local/docs/api/generated
	@echo "✅ API documentation generated in docs/api/generated/"

check-env: ## Verify environment configuration
	@echo "🔍 Checking environment configuration..."
	@if [ ! -f .env ]; then echo "❌ .env file not found. Run 'make setup'"; exit 1; fi
	@echo "✅ Environment configuration OK"

version: ## Display version information
	@echo "BitCurrent Exchange"
	@echo "===================="
	@echo "Matching Engine: $(shell cd matching-engine && cargo pkgid | cut -d# -f2)"
	@echo "API Gateway: $(shell cd services/api-gateway && go list -m)"
	@echo "Frontend: $(shell cd frontend && node -p "require('./package.json').version")"

##@ CI/CD

ci-test: ## Run CI test pipeline
	@echo "🤖 Running CI tests..."
	@make lint
	@make test
	@make security-scan
	@echo "✅ CI tests passed"

ci-build: ## Run CI build pipeline
	@echo "🤖 Running CI build..."
	@make build
	@make docker-build
	@echo "✅ CI build complete"

ci-deploy: ## Run CI deployment pipeline
	@echo "🤖 Running CI deployment..."
	@make deploy-staging
	@echo "✅ CI deployment complete"



