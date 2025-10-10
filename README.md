# BitCurrent Exchange

**Elite Cryptocurrency Trading Platform for UK & Global Markets**

![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Development-yellow)

---

## 🚀 Overview

BitCurrent Exchange is a next-generation cryptocurrency trading platform built with institutional-grade infrastructure, UK regulatory compliance, and seamless GBP integration. Our platform combines:

- **Ultra-low latency matching** (sub-2ms P99) via Rust-based orderbook
- **Native GBP rails** through UK banking partnerships
- **Hybrid custody model** balancing security with capital efficiency
- **Comprehensive compliance** with FCA regulations

## 🏗️ Architecture

### Technology Stack

- **Matching Engine**: Rust (ultra-low latency, lock-free orderbook)
- **Microservices**: Go 1.21+ (api-gateway, ledger, settlement, market-data, compliance)
- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, shadcn/ui
- **Databases**: PostgreSQL 15 (primary), TimescaleDB (market data), Redis (caching)
- **Message Queue**: Apache Kafka / Redpanda
- **Infrastructure**: Kubernetes on AWS EKS
- **IaC**: Terraform for infrastructure provisioning

### Repository Structure

```
bitcurrent/
├── matching-engine/          # Rust orderbook & matching logic
│   ├── src/
│   │   ├── orderbook.rs
│   │   ├── matching.rs
│   │   └── main.rs
│   ├── Cargo.toml
│   └── Cargo.lock
├── services/                 # Go microservices
│   ├── api-gateway/
│   ├── order-gateway/
│   ├── ledger-service/
│   ├── settlement-service/
│   ├── market-data-service/
│   ├── compliance-service/
│   └── shared/              # Shared libraries
├── frontend/                # React/Next.js application
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
├── infrastructure/          # Kubernetes & Terraform
│   ├── terraform/
│   │   ├── modules/
│   │   └── environments/
│   ├── kubernetes/
│   │   ├── base/
│   │   └── overlays/
│   └── helm/
├── migrations/              # Database migrations
│   └── postgresql/
├── scripts/                 # Utility scripts
│   ├── deploy.sh
│   ├── backup.sh
│   └── seed-data.sh
├── docs/                    # Documentation
│   ├── api/
│   ├── architecture/
│   └── operations/
├── tests/                   # End-to-end tests
│   └── e2e/
├── docker-compose.yml       # Local development
├── Makefile                 # Common operations
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- **Docker Desktop** 4.0+ (with 16GB RAM minimum)
- **Go** 1.21+
- **Rust** 1.70+ (with cargo)
- **Node.js** 20+ with npm/yarn
- **PostgreSQL** 15+ client tools
- **kubectl** (for Kubernetes)
- **Terraform** 1.5+ (for infrastructure)

### Quick Start - Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/bitcurrent-exchange/platform.git
   cd platform
   ```

2. **Setup environment variables**
   ```bash
   cp .env.sample .env
   # Edit .env with your local configuration
   ```

3. **Start infrastructure services**
   ```bash
   make infra-up
   # This starts PostgreSQL, Redis, Kafka, Zookeeper
   ```

4. **Run database migrations**
   ```bash
   make migrate-up
   ```

5. **Build and run services**
   
   **Terminal 1 - Matching Engine:**
   ```bash
   cd matching-engine
   cargo run --release
   ```
   
   **Terminal 2 - API Gateway:**
   ```bash
   cd services/api-gateway
   go run main.go
   ```
   
   **Terminal 3 - Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Access the platform**
   - Frontend: http://localhost:3000
   - API: http://localhost:8080
   - API Docs: http://localhost:8080/swagger

### Using Docker Compose (Recommended)

```bash
# Start all services
make docker-up

# View logs
make logs

# Stop all services
make docker-down
```

## 📚 Documentation

- **[API Documentation](./docs/api/README.md)** - REST & WebSocket API reference
- **[Architecture Guide](./docs/architecture/README.md)** - System design and components
- **[Developer Guide](./docs/development/README.md)** - Contributing and development workflow
- **[Operations Runbook](./docs/operations/README.md)** - Deployment and maintenance
- **[Manual Setup Tasks](./MANUAL_SETUP_TASKS.md)** - Third-party services configuration

## 🧪 Testing

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run integration tests
make test-integration

# Run E2E tests
make test-e2e

# Run load tests
make test-load

# Check code coverage
make coverage
```

## 🚢 Deployment

### Development Environment
```bash
make deploy-dev
```

### Staging Environment
```bash
make deploy-staging
```

### Production Environment
```bash
# Requires approval and proper credentials
make deploy-prod
```

## 🔒 Security

- **Authentication**: JWT with refresh tokens, OAuth2 support
- **Authorization**: Role-Based Access Control (RBAC)
- **Encryption**: AES-256-GCM at rest, TLS 1.3 in transit
- **Secrets Management**: HashiCorp Vault / AWS Secrets Manager
- **2FA**: TOTP, SMS, Hardware keys (WebAuthn/FIDO2)
- **Rate Limiting**: Redis-based token bucket
- **Audit Logging**: Comprehensive immutable audit trails

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Order Latency P99 | < 5ms | 🟡 In Development |
| Matching Throughput | 5,000 orders/sec/pair | 🟡 In Development |
| WebSocket Connections | 100,000 concurrent | 🟡 In Development |
| API Request Rate | 10,000 req/sec | 🟡 In Development |
| Uptime SLA | 99.95% | 🟡 In Development |

## 🌍 Compliance

- **UK FCA Registration**: In Progress
- **GDPR Compliant**: Yes
- **AML/KYC**: Onfido integration
- **Transaction Monitoring**: Chainalysis
- **Proof of Reserves**: Monthly Merkle tree publication

## 📈 Roadmap

### Q4 2024 - Foundation
- [x] Technical architecture finalization
- [x] Initial team assembly
- [ ] FCA registration submission
- [ ] Core matching engine development

### Q1 2025 - Build
- [ ] Custody solution implementation
- [ ] KYC/AML integration
- [ ] Beta launch (closed, 100 users)
- [ ] GBP payment rails live

### Q2 2025 - Launch
- [ ] Mobile app release
- [ ] Market making partnerships
- [ ] Full public launch
- [ ] Institutional API release

### Q3 2025 - Scale
- [ ] EU expansion (MiCA compliance)
- [ ] Derivatives trading launch
- [ ] 50,000 users milestone
- [ ] Series B fundraising

## 👥 Team

- **Founders**: [To be announced]
- **Engineering**: [Hiring - see careers page]
- **Compliance**: [Hiring - see careers page]

## 📞 Contact

- **Website**: https://www.bitcurrent.co.uk
- **Email**: hello@bitcurrent.co.uk
- **Technical Support**: support@bitcurrent.co.uk
- **Investment Inquiries**: investors@bitcurrent.co.uk

## 📄 License

Copyright © 2025 BitCurrent Holdings Ltd. All rights reserved.

This is proprietary software. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🎯 Quick Commands

```bash
# Development
make dev              # Start local development environment
make build            # Build all services
make test             # Run all tests
make lint             # Run linters
make format           # Format code

# Infrastructure
make infra-up         # Start local infrastructure (DB, Redis, Kafka)
make infra-down       # Stop local infrastructure
make migrate-up       # Run database migrations
make migrate-down     # Rollback migrations

# Docker
make docker-build     # Build all Docker images
make docker-up        # Start all services in Docker
make docker-down      # Stop all Docker services
make logs             # View logs from all services

# Deployment
make deploy-dev       # Deploy to development
make deploy-staging   # Deploy to staging
make deploy-prod      # Deploy to production

# Utilities
make clean            # Clean build artifacts
make reset            # Reset local environment (dangerous!)
make seed-data        # Load demo data
```

---

**Built with ❤️ in London for the future of digital finance**



