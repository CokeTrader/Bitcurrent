# Getting Started with BitCurrent Exchange

Welcome to BitCurrent Exchange! This guide will help you get up and running quickly.

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Docker Desktop with 16GB RAM minimum
- Git
- Terminal/Command Line

### Start Developing

```bash
# 1. Clone the repository (if not already done)
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# 2. Create environment file
# Note: .env.sample might be blocked by gitignore, so create .env manually
touch .env
# Copy the configuration from .env.sample template in documentation

# 3. Start all infrastructure services
make infra-up

# 4. Wait for services to be healthy (about 30 seconds)
# You can check status with:
make infra-status

# 5. Run database migrations
make migrate-up

# 6. Load demo data
make db-seed

# 7. Open development tools
# PostgreSQL Admin: http://localhost:5050 (admin@bitcurrent.local / admin)
# Kafka UI: http://localhost:8090
# Redis Commander: http://localhost:8091
# Grafana: http://localhost:3001 (admin / admin)
# Prometheus: http://localhost:9090
```

## 🎯 What You Have Now

### Infrastructure Running
- ✅ PostgreSQL 15 (Port 5432) - Main database
- ✅ TimescaleDB (Port 5433) - Market data
- ✅ Redis (Port 6379) - Caching
- ✅ Kafka (Port 9092) - Message queue
- ✅ Zookeeper (Port 2181) - Kafka coordination
- ✅ Prometheus (Port 9090) - Metrics
- ✅ Grafana (Port 3001) - Dashboards
- ✅ Jaeger (Port 16686) - Distributed tracing

### Development Tools
- ✅ pgAdmin - Database management
- ✅ Kafka UI - Message queue visualization
- ✅ Redis Commander - Cache inspection
- ✅ Monitoring dashboards

### Database Schema
- ✅ Users and accounts
- ✅ Wallets with balance tracking
- ✅ Orders and trades
- ✅ Double-entry ledger
- ✅ Deposits and withdrawals
- ✅ KYC documents
- ✅ Trading pairs configuration
- ✅ Market data tables (OHLCV, tickers, orderbook snapshots)

### Demo Data
- ✅ 3 demo users with balances
- ✅ Sample market data for BTC-GBP and ETH-GBP

## 📂 Project Structure

```
bitcurrent/
├── matching-engine/          # 🦀 Rust orderbook (Phase 2)
├── services/                 # 🐹 Go microservices (Phase 3)
│   ├── api-gateway/
│   ├── order-gateway/
│   ├── ledger-service/
│   ├── settlement-service/
│   ├── market-data-service/
│   └── compliance-service/
├── frontend/                 # ⚛️  Next.js React app (Phase 4)
├── infrastructure/           # 🏗️  IaC and configs
├── migrations/               # 📊 Database migrations
├── scripts/                  # 🛠️  Utility scripts
└── docs/                     # 📚 Documentation
```

## 🚀 Next Steps

### For Developers

1. **Read the architecture** - `README.md`
2. **Review the plan** - `plan.md` (attached in conversation)
3. **Check manual tasks** - `MANUAL_SETUP_TASKS.md`
4. **Start Phase 2** - Implement Rust matching engine

### For DevOps

1. **Review infrastructure** - `infrastructure/README.md`
2. **Setup AWS account** - See MANUAL_SETUP_TASKS.md
3. **Configure domain** - bitcurrent.co.uk DNS setup
4. **Prepare secrets** - AWS Secrets Manager

### For Product/Business

1. **Review scope** - `PHASE1_COMPLETE.md`
2. **Manual tasks** - `MANUAL_SETUP_TASKS.md`
3. **Cost estimates** - In MANUAL_SETUP_TASKS.md
4. **Regulatory prep** - FCA registration process

## 🔧 Common Commands

### Development
```bash
make dev              # Start complete dev environment
make clean            # Clean build artifacts
make reset            # Reset everything (DANGEROUS!)
```

### Infrastructure
```bash
make infra-up         # Start infrastructure services
make infra-down       # Stop infrastructure services
make infra-logs       # View logs
make infra-status     # Check service status
```

### Database
```bash
make migrate-up       # Run migrations
make migrate-down     # Rollback last migration
make db-seed          # Load demo data
make db-shell         # Open PostgreSQL shell
make db-backup        # Backup database
make db-restore       # Restore from backup
```

### Building
```bash
make build            # Build all services
make build-matching   # Build Rust matching engine
make build-services   # Build Go services
make build-frontend   # Build Next.js frontend
```

### Testing
```bash
make test             # Run all tests
make test-unit        # Unit tests only
make test-e2e         # End-to-end tests
make test-load        # Load tests with k6
make coverage         # Generate coverage reports
```

### Code Quality
```bash
make lint             # Run linters
make format           # Format code
make security-scan    # Security vulnerability scan
```

### Deployment
```bash
make deploy-dev       # Deploy to development
make deploy-staging   # Deploy to staging
make deploy-prod      # Deploy to production (requires confirmation)
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker ps

# Check Docker resources (need 16GB RAM)
docker info

# Reset everything
make docker-down
docker system prune -a
make infra-up
```

### Database migration fails
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Try migrating manually
docker exec -it bitcurrent-postgres psql -U bitcurrent -d bitcurrent
```

### Port conflicts
```bash
# Check what's using the port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9092  # Kafka

# Kill the process or change ports in docker-compose.yml
```

### Out of disk space
```bash
# Clean Docker resources
docker system prune -a --volumes

# Clean build artifacts
make clean
```

## 📊 Monitoring & Observability

### Grafana Dashboards
- URL: http://localhost:3001
- Login: admin / admin
- Dashboards: Will be populated as services are built

### Prometheus Metrics
- URL: http://localhost:9090
- Query examples:
  - `up` - Check service health
  - `process_cpu_seconds_total` - CPU usage
  - `process_resident_memory_bytes` - Memory usage

### Jaeger Tracing
- URL: http://localhost:16686
- Distributed tracing for request flows

### Logs
```bash
# All services
make logs

# Specific service
docker-compose logs -f postgres
docker-compose logs -f kafka
docker-compose logs -f redis
```

## 🔒 Security Notes

### Development Environment
- Default passwords are insecure (change in production!)
- No TLS configured (add for production)
- All services exposed (use VPN/firewall in production)
- Demo data has hardcoded IDs (never use in production)

### Production Checklist
- [ ] Change all default passwords
- [ ] Enable TLS/SSL everywhere
- [ ] Configure firewalls
- [ ] Use AWS Secrets Manager
- [ ] Enable encryption at rest
- [ ] Setup VPN access
- [ ] Configure monitoring alerts
- [ ] Implement rate limiting
- [ ] Enable audit logging
- [ ] Regular security scans

## 📚 Documentation

### Main Docs
- `README.md` - Project overview
- `PHASE1_COMPLETE.md` - Phase 1 completion summary
- `MANUAL_SETUP_TASKS.md` - Third-party service setup
- `plan.md` - Full implementation plan (15 phases)

### Service-Specific
- `matching-engine/README.md` - Rust matching engine
- `frontend/README.md` - React/Next.js frontend
- `infrastructure/README.md` - IaC and deployment

### API Documentation
- Will be available at `/api/docs` when API gateway is built
- OpenAPI 3.0 specification

## 💬 Getting Help

### Resources
- Main README: `README.md`
- Architecture docs: `docs/architecture/`
- API docs: `docs/api/`
- Operations runbook: `docs/operations/`

### Common Issues
- Port conflicts: Change ports in `docker-compose.yml`
- Memory issues: Increase Docker memory to 16GB+
- Permission errors: Check Docker group membership

### Support Channels
- Technical: engineering@bitcurrent.co.uk
- General: hello@bitcurrent.co.uk

## 🎉 You're Ready!

Your BitCurrent Exchange development environment is fully configured and ready for Phase 2 development.

**What's working:**
- ✅ Infrastructure (databases, queues, caching)
- ✅ Monitoring (metrics, dashboards, tracing)
- ✅ Database schema with sample data
- ✅ Development tools and automation
- ✅ CI/CD pipeline
- ✅ Documentation

**What's next:**
- 🚀 Phase 2: Build Rust matching engine
- 🚀 Phase 3: Build Go microservices
- 🚀 Phase 4: Build React frontend
- 🚀 Phase 5: Implement custody system

---

**Welcome to BitCurrent! Let's build the future of UK digital finance together. 🇬🇧💱**



