# 📝 Changelog

All notable changes to BitCurrent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Performance monitoring utility for API requests
- Comprehensive health check script
- CI/CD pipeline for automated deployments
- Trade history table with CSV export
- Performance metrics dashboard component
- E2E test suite with Playwright
- Frontend security checks (client-side secret detection)
- Migration rollback system
- Deposit & withdrawal service layer refactoring
- Advanced authentication middleware
- CSRF protection
- Input sanitization
- SQL injection prevention
- Secret rotation automation
- Dependabot configuration
- Security scanning workflows

### Changed
- Refactored monolithic routes into modular services
- Updated README with comprehensive documentation
- Enhanced API documentation
- Improved error handling across backend
- Better logging with Winston

### Security
- Automated secret scanning (TruffleHog)
- Dependency vulnerability scanning (Snyk)
- Docker container scanning (Trivy)
- Rate limiting improvements
- 2FA enforcement for sensitive operations

---

## [1.0.0-beta] - 2025-10-13

### Added
- Initial release
- Core trading functionality (market & limit orders)
- Stripe integration for deposits
- Portfolio analytics dashboard
- Referral program
- Staking pools
- KYC verification flow
- 2FA security
- API key management for trading bots
- WebSocket real-time prices
- Mobile-responsive design
- Dark mode support

### Features
- **Trading:**
  - 0.25% trading fees
  - Market orders
  - Limit orders
  - Stop-loss & take-profit
  - Order history
  - Real-time price updates

- **Deposits & Withdrawals:**
  - Stripe card deposits (instant)
  - Bank transfer deposits
  - Fast GBP withdrawals
  - £10 signup bonus

- **Security:**
  - JWT authentication
  - 2FA (TOTP)
  - Email verification
  - KYC verification
  - Session management
  - Activity logging

- **Dashboard:**
  - Portfolio overview
  - Holdings list
  - Performance charts
  - Quick stats
  - Recent activity feed

- **API:**
  - REST API for trading
  - WebSocket for real-time data
  - API keys for bots
  - Comprehensive documentation
  - Rate limiting

### Infrastructure
- Vercel deployment (frontend)
- Railway deployment (backend)
- PostgreSQL database
- GitHub Actions CI/CD
- Automated testing
- Health check endpoints

---

## [0.9.0-alpha] - 2025-10-01

### Added
- Alpha testing release
- Basic trading functionality
- User registration & authentication
- Database schema
- Alpaca API integration
- Initial UI design

### Known Issues
- Performance optimizations needed
- Some edge cases in trading logic
- Limited mobile optimization

---

## Version History

- `1.0.0-beta` - Public beta release (current)
- `0.9.0-alpha` - Alpha testing
- `0.1.0-dev` - Initial development

---

## Upgrade Guide

### From 0.9.0-alpha to 1.0.0-beta

**Database Migrations:**
```bash
node backend-broker/scripts/migration-manager.js up
```

**Environment Variables:**
Add new required variables:
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`
- `JWT_SECRET` (rotate if upgrading)

**Breaking Changes:**
- API endpoint `/orders` response format changed
- Authentication now requires email verification
- Minimum deposit increased to £10

---

## Roadmap

### Q4 2025
- [ ] iOS/Android mobile apps
- [ ] Advanced charting (TradingView integration)
- [ ] Institutional accounts
- [ ] Fiat on/off ramps (GBP)
- [ ] Copy trading feature

### Q1 2026
- [ ] Margin trading
- [ ] Futures contracts
- [ ] Options trading
- [ ] Lending/borrowing
- [ ] Staking rewards increase

### Q2 2026
- [ ] NFT marketplace
- [ ] DeFi integration
- [ ] Cross-chain swaps
- [ ] Governance token

---

## Support

- Report bugs: https://github.com/CokeTrader/Bitcurrent/issues
- Feature requests: https://github.com/CokeTrader/Bitcurrent/issues
- Email: support@bitcurrent.com
- Discord: https://discord.gg/bitcurrent

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

