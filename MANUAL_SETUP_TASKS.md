# BitCurrent Exchange - Manual Setup Tasks

This document contains all tasks that require manual action, account creation, or third-party service configuration that cannot be automated.

---

## 1. Crypto Market Data Providers

### 1.1 CoinGecko API (Primary Reference Data)
**Priority: HIGH** | **Timeline: Week 1**

**Steps:**
1. Visit https://www.coingecko.com/en/api
2. Click "Get Your API Key" or "Pricing"
3. Sign up for an account with business email
4. Select plan:
   - Demo tier: Free (30 calls/min) - for initial development
   - Analyst tier: $129/month (500 calls/min) - recommended for launch
5. Navigate to Dashboard → API Keys
6. Generate API key and copy to secure location
7. Add to `.env` file: `COINGECKO_API_KEY=your_key_here`
8. Review rate limits and caching strategy
9. Test API connection with sample request

**Cost:** $0 (free tier) or $129/month (Analyst tier)  
**Documentation:** https://docs.coingecko.com/reference/introduction

---

### 1.2 CoinAPI (Institutional-Grade Orderbook Data)
**Priority: HIGH** | **Timeline: Week 1**

**Steps:**
1. Visit https://www.coinapi.io/
2. Click "Get Free API Key" or "Pricing"
3. Create account and verify email
4. Select plan:
   - Free tier: 100 requests/day - for testing only
   - Startup: $79/month - recommended for development
   - Professional: $299/month - recommended for production
5. Access Dashboard → API Keys
6. Generate new API key
7. Add to `.env` file: `COINAPI_KEY=your_key_here`
8. Review WebSocket documentation for real-time feeds
9. Test orderbook endpoint for BTC/GBP, ETH/GBP

**Cost:** $0 (free tier) or $79-299/month  
**Documentation:** https://docs.coinapi.io/

---

### 1.3 CryptoCompare (Backup/Redundancy)
**Priority: MEDIUM** | **Timeline: Week 2**

**Steps:**
1. Visit https://www.cryptocompare.com/
2. Navigate to "API" section
3. Register for account
4. Select plan:
   - Free tier: Basic market data
   - Paid tiers: From $50/month
5. Get API key from dashboard
6. Add to `.env` file: `CRYPTOCOMPARE_API_KEY=your_key_here`
7. Test orderbook snapshot endpoints
8. Configure as fallback provider

**Cost:** $0 (free tier) or from $50/month  
**Documentation:** https://developers.cryptocompare.com/

---

### 1.4 Direct Exchange API Access

#### Binance API
**Priority: HIGH** | **Timeline: Week 2**

**Steps:**
1. Visit https://www.binance.com/
2. Create account (if you don't have one)
3. Complete KYC verification
4. Navigate to Profile → API Management
5. Create new API key (read-only for market data)
6. **IMPORTANT:** Whitelist IP addresses if required
7. Enable "Enable Reading" permission only
8. Add to `.env`: `BINANCE_API_KEY=your_key` and `BINANCE_SECRET_KEY=your_secret`
9. Test WebSocket connection for BTC/GBP market data
10. Review rate limits (1200 requests/minute for spot)

**Cost:** Free  
**Documentation:** https://binance-docs.github.io/apidocs/spot/en/

---

#### Coinbase Advanced Trade API
**Priority: HIGH** | **Timeline: Week 2**

**Steps:**
1. Visit https://www.coinbase.com/
2. Create/login to Coinbase account
3. Complete identity verification
4. Navigate to Settings → API
5. Create new API key with "View" permissions only
6. Download API key JSON file (keep secure!)
7. Add credentials to `.env` or secrets manager
8. Test REST API for BTC-GBP ticker
9. Setup WebSocket feed for real-time data

**Cost:** Free  
**Documentation:** https://docs.cloud.coinbase.com/

---

#### Kraken API
**Priority: MEDIUM** | **Timeline: Week 3**

**Steps:**
1. Visit https://www.kraken.com/
2. Create account and complete verification
3. Navigate to Settings → API
4. Generate new API key
5. Select "Query Funds", "Query Open Orders" permissions (read-only)
6. Add to `.env`: `KRAKEN_API_KEY=your_key` and `KRAKEN_PRIVATE_KEY=your_private_key`
7. Test REST API for GBP pairs
8. Review WebSocket documentation

**Cost:** Free  
**Documentation:** https://docs.kraken.com/rest/

---

## 2. Banking & Payment Providers

### 2.1 ClearBank (Primary GBP Rails)
**Priority: CRITICAL** | **Timeline: Week 3-4**

**Steps:**
1. Visit https://www.clear.bank/
2. Contact sales for account opening
3. Complete extensive due diligence:
   - Company incorporation documents
   - Directors' information
   - Business plan and projections
   - AML/KYC policies
   - FCA registration status
4. Legal review of terms
5. Safeguarding account setup
6. API credentials provisioning
7. Sandbox environment access
8. Integration testing
9. Production approval process (can take 4-8 weeks)

**Cost:** Variable - negotiate with ClearBank  
**Timeline:** 4-8 weeks for approval  
**Documentation:** https://institution-api-docs.clearbank.co.uk/

---

### 2.2 Modulr (Backup Payment Provider)
**Priority: HIGH** | **Timeline: Week 4**

**Steps:**
1. Visit https://www.modulrfinance.com/
2. Request demo/contact sales
3. Submit application with business documentation
4. Complete compliance checks
5. Sandbox API access
6. Integration development
7. Production onboarding

**Cost:** Variable based on volume  
**Timeline:** 3-6 weeks  
**Documentation:** https://modulr.readme.io/

---

### 2.3 TrueLayer (Open Banking)
**Priority: HIGH** | **Timeline: Week 4**

**Steps:**
1. Visit https://truelayer.com/
2. Sign up for developer account
3. Create application in console
4. Get client credentials (client_id, client_secret)
5. Configure redirect URIs
6. Test in sandbox with mock banks
7. Submit for production access
8. Complete security questionnaire

**Cost:** Free sandbox, paid production (volume-based)  
**Documentation:** https://docs.truelayer.com/

---

## 3. KYC/AML Providers

### 3.1 Onfido (Identity Verification)
**Priority: CRITICAL** | **Timeline: Week 5**

**Steps:**
1. Visit https://onfido.com/
2. Contact sales for demo
3. Sign agreement (requires legal review)
4. Sandbox API credentials
5. SDK integration (web & mobile)
6. Test document verification flow
7. Setup webhooks for verification results
8. Production credentials after compliance review

**Cost:** Pay-per-verification (typically £1-5 per check)  
**Documentation:** https://documentation.onfido.com/

---

### 3.2 Chainalysis (Transaction Monitoring)
**Priority: HIGH** | **Timeline: Week 6**

**Steps:**
1. Visit https://www.chainalysis.com/
2. Contact enterprise sales
3. Complete vendor assessment
4. Sign Master Service Agreement
5. Receive API credentials
6. Integration training
7. Configure monitoring rules
8. Setup alert webhooks

**Cost:** Enterprise pricing (typically $10k-50k+/year)  
**Documentation:** https://docs.chainalysis.com/

---

### 3.3 ComplyAdvantage (Sanctions Screening)
**Priority: HIGH** | **Timeline: Week 6**

**Steps:**
1. Visit https://complyadvantage.com/
2. Request demo
3. Commercial negotiation
4. Contract signing
5. API key provisioning
6. Integration setup
7. Configure screening policies
8. Test with sample data

**Cost:** Variable (based on searches)  
**Documentation:** https://developers.complyadvantage.com/

---

## 4. Custody & Wallet Infrastructure

### 4.1 Fireblocks (Institutional Custody)
**Priority: HIGH** | **Timeline: Week 7**

**Steps:**
1. Visit https://www.fireblocks.com/
2. Enterprise sales contact
3. Due diligence process
4. Security architecture review
5. Workspace setup
6. API key generation
7. Webhook configuration
8. Test environment setup
9. Production approval

**Cost:** Enterprise pricing (contact sales)  
**Documentation:** https://developers.fireblocks.com/

---

### 4.2 AWS KMS (Key Management)
**Priority: HIGH** | **Timeline: Week 2**

**Steps:**
1. Login to AWS Console
2. Navigate to Key Management Service (KMS)
3. Create customer managed keys:
   - Database encryption key
   - Application secrets encryption key
   - Backup encryption key
4. Configure key policies and IAM permissions
5. Enable key rotation
6. Setup CloudTrail logging for key usage
7. Add KMS key IDs to Terraform variables

**Cost:** $1/month per key + usage  
**Documentation:** https://docs.aws.amazon.com/kms/

---

## 5. Monitoring & Observability

### 5.1 Datadog (Optional - Premium Monitoring)
**Priority: LOW** | **Timeline: Week 8**

**Steps:**
1. Visit https://www.datadoghq.com/
2. Sign up for trial (14 days)
3. Install Datadog agent on infrastructure
4. Configure APM for services
5. Setup custom dashboards
6. Configure alerts
7. Evaluate vs Prometheus/Grafana stack

**Cost:** From $15/host/month  
**Alternative:** Use open-source Prometheus + Grafana (included in plan)

---

### 5.2 Sentry (Error Tracking)
**Priority: MEDIUM** | **Timeline: Week 3**

**Steps:**
1. Visit https://sentry.io/
2. Create organization account
3. Create projects (backend, frontend, matching-engine)
4. Get DSN keys for each project
5. Add to `.env` files
6. Configure error sampling rates
7. Setup Slack/email alerts
8. Invite team members

**Cost:** Free tier available, paid from $26/month  
**Documentation:** https://docs.sentry.io/

---

## 6. Infrastructure & Hosting

### 6.1 AWS Account Setup
**Priority: CRITICAL** | **Timeline: Week 1**

**Steps:**
1. Create AWS account at https://aws.amazon.com/
2. Enable MFA on root account
3. Create IAM users for team with appropriate permissions
4. Setup AWS Organizations (optional for multi-account)
5. Enable CloudTrail for audit logging
6. Configure billing alerts
7. Setup Cost Explorer
8. Create IAM role for Terraform
9. Configure AWS CLI locally

**Cost:** Variable based on usage  
**Estimated:** £2,000-5,000/month initially

---

### 6.2 Domain Configuration (bitcurrent.co.uk)
**Priority: HIGH** | **Timeline: Week 1**

**Steps:**
1. Login to your domain registrar (where you bought bitcurrent.co.uk)
2. Navigate to DNS settings
3. Option A - Transfer to Route53:
   - Create Route53 hosted zone in AWS
   - Note the 4 nameservers provided
   - Update nameservers at registrar
   - Wait for propagation (24-48 hours)
4. Option B - Point to Route53 without transfer:
   - Add NS records for subdomains
5. Create A record for root domain
6. Create CNAME for www
7. Add TXT record for domain verification
8. Configure CAA records for SSL

**Cost:** Route53 = $0.50/hosted zone/month + queries  
**Timeline:** DNS propagation can take 24-48 hours

---

### 6.3 SSL Certificate
**Priority: HIGH** | **Timeline: Week 2**

**Steps:**
1. AWS Certificate Manager (recommended):
   - Login to AWS Console
   - Navigate to Certificate Manager
   - Request certificate for:
     - bitcurrent.co.uk
     - *.bitcurrent.co.uk (wildcard)
   - Choose DNS validation
   - Add CNAME records to Route53
   - Wait for validation (5-30 minutes)
2. Alternative - Let's Encrypt:
   - Use certbot for certificate generation
   - Configure auto-renewal

**Cost:** AWS Certificate Manager is FREE  
**Let's Encrypt:** Free

---

## 7. Email Infrastructure

### 7.1 AWS SES (Simple Email Service)
**Priority: MEDIUM** | **Timeline: Week 4**

**Steps:**
1. Navigate to AWS SES Console
2. Verify domain (bitcurrent.co.uk)
3. Add required DNS records (DKIM, SPF, DMARC)
4. Request production access (starts in sandbox mode)
5. Create SMTP credentials
6. Configure email templates
7. Setup bounce/complaint handling
8. Test email sending

**Cost:** $0.10 per 1,000 emails  
**Documentation:** https://docs.aws.amazon.com/ses/

---

### 7.2 Twilio (SMS for 2FA)
**Priority: MEDIUM** | **Timeline: Week 5**

**Steps:**
1. Visit https://www.twilio.com/
2. Sign up and verify account
3. Purchase phone number (UK number recommended)
4. Get Account SID and Auth Token
5. Add to secrets manager
6. Test SMS sending
7. Configure messaging templates
8. Review compliance requirements

**Cost:** ~£1/month per number + £0.04 per SMS  
**Documentation:** https://www.twilio.com/docs/

---

## 8. Version Control & Collaboration

### 8.1 GitHub Organization
**Priority: HIGH** | **Timeline: Day 1**

**Steps:**
1. Create GitHub organization: bitcurrent-exchange
2. Setup repository: bitcurrent-exchange/platform
3. Configure branch protection rules:
   - Require PR reviews (minimum 2)
   - Require status checks
   - No force push to main
4. Setup team access levels
5. Enable GitHub Actions
6. Configure GitHub Secrets for CI/CD
7. Setup GitHub Container Registry

**Cost:** Free for public repos, $4/user/month for private  
**Recommended:** GitHub Team ($4/user/month)

---

## 9. Legal & Compliance

### 9.1 FCA Registration
**Priority: CRITICAL** | **Timeline: Month 1-3**

**Steps:**
1. Engage crypto-specialized law firm (Simmons & Simmons, etc.)
2. Prepare registration documentation:
   - Business plan
   - AML/CTF policies
   - Risk assessments
   - Compliance procedures
   - MLRO appointment
3. Submit application via FCA Connect
4. Pay application fee (£5,000)
5. Respond to FCA queries
6. Await approval (3-6 months typical)

**Cost:** £5,000 application + £10,000+ legal fees  
**Timeline:** 3-6 months minimum  
**Documentation:** https://www.fca.org.uk/firms/cryptoassets

---

### 9.2 Company Insurance
**Priority: HIGH** | **Timeline: Week 6**

**Steps:**
1. Contact specialist crypto insurance broker
2. Get quotes for:
   - Cyber liability insurance (minimum £10M)
   - Crime insurance (employee theft, fraud)
   - Professional indemnity
   - Directors & Officers insurance
3. Compare providers (Lloyd's of London, Aon, etc.)
4. Complete application and underwriting
5. Finalize coverage and payment

**Cost:** Typically 2-5% of coverage amount annually  
**Estimated:** £50,000-150,000/year for £10M coverage

---

## 10. Team Setup

### 10.1 Internal Communication
**Priority: HIGH** | **Timeline: Week 1**

**Steps:**
1. Setup Slack workspace: bitcurrent.slack.com
2. Create channels:
   - #general
   - #engineering
   - #devops
   - #security
   - #compliance
   - #alerts (for monitoring)
   - #deploys
3. Integrate GitHub, Sentry, monitoring alerts
4. Configure retention policies
5. Invite team members

**Cost:** Free tier available, Pro at $7.25/user/month  
**Recommended:** Slack Pro

---

### 10.2 Project Management
**Priority: MEDIUM** | **Timeline: Week 1**

**Steps:**
1. Setup project management tool:
   - Option A: Linear (https://linear.app/) - £8/user/month
   - Option B: Jira (https://www.atlassian.com/software/jira)
2. Create projects and workflows
3. Import issues from plan
4. Setup sprints/milestones
5. Integrate with GitHub
6. Invite team

**Cost:** £8-15/user/month

---

## Summary Checklist

### Week 1 Priority Tasks
- [ ] Setup AWS account with proper security
- [ ] Configure bitcurrent.co.uk domain in Route53
- [ ] Create GitHub organization and repository
- [ ] Sign up for CoinGecko API (free tier)
- [ ] Sign up for CoinAPI (free tier)
- [ ] Setup Slack workspace
- [ ] Setup Sentry for error tracking

### Week 2-3 Priority Tasks
- [ ] Apply for ClearBank/Modulr accounts
- [ ] Get Binance and Coinbase API keys
- [ ] Setup AWS KMS for secrets
- [ ] SSL certificate via AWS Certificate Manager
- [ ] Begin FCA registration preparation

### Week 4-6 Priority Tasks
- [ ] Onfido integration for KYC
- [ ] Chainalysis setup for AML
- [ ] AWS SES for transactional emails
- [ ] Twilio for SMS 2FA
- [ ] Upgrade to paid tiers for data providers

### Month 2-3 Tasks
- [ ] FCA registration submission
- [ ] Fireblocks custody integration
- [ ] Insurance policies finalized
- [ ] Banking partnerships confirmed

---

## Estimated Total Setup Costs

### One-Time Costs
- FCA Registration: £5,000
- Legal fees: £15,000-30,000
- Security audit: £20,000-50,000

### Monthly Recurring Costs (Year 1)
- AWS Infrastructure: £2,000-5,000
- Data APIs: £300-500
- KYC/AML: £500-2,000
- Banking/Payment: £500-1,000
- Monitoring/Tools: £200-500
- Insurance: £4,000-12,000
- Custody (Fireblocks): £1,000-5,000

**Total Monthly: £8,500-26,000**

---

## Notes

- All API keys should be stored in AWS Secrets Manager or HashiCorp Vault, NEVER in code
- Enable MFA on ALL critical accounts
- Use separate development/staging/production environments
- Document all API rate limits and implement appropriate caching
- Setup monitoring alerts for API failures and rate limit approaches
- Keep this document updated as services are integrated
- Schedule quarterly review of all service agreements and costs

---

Last Updated: October 2025



