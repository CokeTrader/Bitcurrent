# ✅ BitCurrent Launch Checklist

Complete checklist to launch your broker model exchange with £1,000 budget.

---

## Phase 1: Pre-Launch Setup (Week 1)

### Backend Deployment

- [ ] Sign up for Railway.app (https://railway.app)
- [ ] Create new project and connect GitHub
- [ ] Add PostgreSQL database
- [ ] Run database migrations
- [ ] Configure environment variables:
  - [ ] `JWT_SECRET`
  - [ ] `BINANCE_API_KEY`
  - [ ] `BINANCE_API_SECRET`
  - [ ] `ADMIN_EMAIL`
  - [ ] `FRONTEND_URL`
- [ ] Deploy backend to Railway
- [ ] Test health endpoint
- [ ] Verify database connection
- [ ] Test Binance API connection

### Frontend Deployment

- [ ] Sign up for Vercel (https://vercel.com)
- [ ] Create new project from GitHub
- [ ] Set root directory to `frontend`
- [ ] Add environment variable `NEXT_PUBLIC_API_URL`
- [ ] Deploy to Vercel
- [ ] Test frontend loads correctly
- [ ] Verify API proxy works

### Binance Setup

- [ ] Sign up for Binance account (if not already)
- [ ] Complete KYC verification
- [ ] Apply for Binance Broker program (https://www.binance.com/en/broker)
- [ ] Generate API keys with trading permissions
- [ ] Test API keys on testnet first
- [ ] Switch to live API after testing

### Domain & DNS

- [ ] Update DNS A record to point to Vercel IP
- [ ] Add CNAME for `api.bitcurrent.co.uk` → Railway
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify HTTPS works
- [ ] Test domain loads correctly

---

## Phase 2: Testing (Week 2)

### Backend API Tests

- [ ] Test user registration
  ```bash
  curl -X POST https://api.bitcurrent.co.uk/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123456"}'
  ```

- [ ] Test user login
  ```bash
  curl -X POST https://api.bitcurrent.co.uk/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123456"}'
  ```

- [ ] Test get balances (with token)
- [ ] Test create deposit request
- [ ] Test admin approve deposit
- [ ] Test get quote
- [ ] Test place market order
- [ ] Test create withdrawal request
- [ ] Test admin approve/complete withdrawal

### Frontend Tests

- [ ] Test homepage loads
- [ ] Test registration form
- [ ] Test login form
- [ ] Test dashboard shows after login
- [ ] Test markets page shows prices
- [ ] Test trading page loads
- [ ] Test deposit flow
- [ ] Test withdrawal flow
- [ ] Test transaction history
- [ ] Test logout

### Integration Tests

- [ ] Register new user via frontend
- [ ] Create deposit request (£100)
- [ ] Manually approve deposit via admin API
- [ ] Verify balance shows £100 GBP
- [ ] Place market order (Buy £50 BTC)
- [ ] Verify order executes on Binance
- [ ] Verify BTC balance credited
- [ ] Verify GBP balance debited
- [ ] Request withdrawal (£40 GBP)
- [ ] Manually approve and process withdrawal
- [ ] Verify balance updated

### Security Tests

- [ ] Test rate limiting (100+ requests)
- [ ] Test SQL injection attempts
- [ ] Test XSS attacks
- [ ] Test CSRF protection
- [ ] Test password hashing (check database)
- [ ] Test JWT expiration
- [ ] Test admin authorization (non-admin can't access)

---

## Phase 3: Legal & Compliance (Week 2-3)

### Company Registration

- [ ] Register UK limited company (https://www.gov.uk/limited-company-formation)
  - Cost: £12
- [ ] Get Certificate of Incorporation
- [ ] Open business bank account
- [ ] Set up accounting software (Wave, FreeAgent)

### Legal Documents

- [ ] Write Terms of Service (or copy from Kraken/modify)
- [ ] Write Privacy Policy (use generator, customize)
- [ ] Write Risk Disclosure
- [ ] Add Cookie Policy
- [ ] Add AML/KYC Policy

### FCA Registration

- [ ] Start FCA cryptoasset registration application
  - URL: https://www.fca.org.uk/firms/cryptoasset-registration
  - Cost: £2,000-5,000 (save from first revenues)
  - Timeline: 6-12 months
- [ ] Note: You CAN operate while application is pending

### Banking

- [ ] Open business bank account (Monzo, Tide, Starling)
- [ ] Set up sort code & account number for deposits
- [ ] Update deposit instructions in backend

---

## Phase 4: Beta Launch (Week 3-4)

### Beta Testers

- [ ] Invite 10 friends/family to beta test
- [ ] Create promo code for 0% fees first month
- [ ] Send beta invite emails
- [ ] Create support@ email alias
- [ ] Set up Discord/Telegram for beta feedback

### Monitoring

- [ ] Set up Sentry for error tracking (free tier)
- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Create admin dashboard bookmark
- [ ] Set up email alerts for:
  - [ ] New deposits
  - [ ] New withdrawals
  - [ ] Failed orders
  - [ ] Server errors

### Daily Operations

- [ ] Check bank account for deposits (2x per day)
- [ ] Process pending deposits within 2 hours
- [ ] Process pending withdrawals within 4 hours
- [ ] Respond to support emails within 24 hours
- [ ] Monitor server logs for errors

---

## Phase 5: Public Launch (Week 4)

### Marketing

- [ ] Create Reddit account
- [ ] Post on r/BitcoinUK with launch offer
- [ ] Post on r/UKPersonalFinance (if allowed)
- [ ] Create Twitter/X account and announce
- [ ] Email friends/family about launch
- [ ] Post in crypto Discord/Telegram groups
- [ ] Consider £50-100 Reddit ads

### Launch Offer

- [ ] 0% trading fees for first month
- [ ] £10 signup bonus (after £100 deposit)
- [ ] Referral program (£10 for referrer + referee)

### Content Marketing

- [ ] Publish 3 blog posts:
  - [ ] "How to Buy Bitcoin in UK (2025 Guide)"
  - [ ] "BitCurrent vs Coinbase: Fee Comparison"
  - [ ] "Is BitCurrent Safe? Our Security Measures"
- [ ] Share on social media
- [ ] Submit to crypto directories

---

## Phase 6: First Week Monitoring

### Daily Checks

- [ ] Check Railway logs for errors
- [ ] Check Sentry for exceptions
- [ ] Process deposits within 2 hours
- [ ] Process withdrawals within 4 hours
- [ ] Respond to support emails
- [ ] Monitor trading volume
- [ ] Check Binance balance

### Metrics to Track

- [ ] Total signups
- [ ] Active users (logged in last 7 days)
- [ ] Total deposits (GBP)
- [ ] Total trading volume (GBP)
- [ ] Total withdrawals (GBP)
- [ ] Revenue (0.1% of volume)
- [ ] Support tickets

### Target Metrics (Month 1)

- [ ] 10-50 signups
- [ ] 5-20 active traders
- [ ] £10,000-50,000 trading volume
- [ ] £10-50 revenue

---

## Phase 7: Growth (Month 2-3)

### Automation

- [ ] Integrate Sumsub for automated KYC (when affordable)
- [ ] Integrate Transak for card deposits
- [ ] Add automated email notifications
- [ ] Implement 2FA for withdrawals

### Features

- [ ] Add limit orders
- [ ] Add more trading pairs (ETH-GBP, SOL-GBP)
- [ ] Add price alerts
- [ ] Add mobile app (or PWA)

### Scale Infrastructure

- [ ] Upgrade Railway to Pro plan (if needed)
- [ ] Add Redis for caching
- [ ] Add database backups
- [ ] Set up monitoring dashboard

---

## Emergency Contacts

### Technical Issues
- Railway Support: https://railway.app/help
- Vercel Support: https://vercel.com/support
- Binance Support: https://www.binance.com/en/support

### Payments
- Your bank support: [Your bank number]
- Binance withdrawals: Via Binance dashboard

### Legal
- FCA: 0800 111 6768
- Solicitor: [If hired]

---

## Budget Tracking

### Initial Costs (£1,000 budget)

| Item | Estimated Cost | Actual Cost | Notes |
|------|----------------|-------------|-------|
| Company registration | £112 | | |
| Railway (3 months) | £45 | | |
| Domain (1 year) | £12 | | Already paid ✅ |
| Legal docs | £0-200 | | DIY or lawyer |
| KYC (first 50 users) | £75 | | £1.50 each |
| Marketing | £100 | | Reddit ads |
| **Subtotal** | **£344-544** | | |
| **Reserve** | **£456-656** | | Emergency fund |

### Monthly Costs (Ongoing)

| Item | Cost | Notes |
|------|------|-------|
| Railway hosting | £15 | Backend + DB |
| Vercel hosting | £0 | Free tier |
| Email (SendGrid) | £0 | Free tier |
| Monitoring | £0 | Free tiers |
| **Total** | **£15/month** | ✅ |

---

## Success Criteria

### Week 1 (Post-Launch)
✅ 10+ signups
✅ 3+ active traders
✅ £5,000+ volume
✅ Zero downtime

### Month 1
✅ 50+ signups
✅ 20+ active traders
✅ £50,000+ volume
✅ £50+ revenue

### Month 3
✅ 200+ signups
✅ 100+ active traders
✅ £200,000+ volume
✅ £200+ revenue
✅ Break even on costs

### Month 6
✅ 1,000+ signups
✅ 500+ active traders
✅ £1,000,000+ volume
✅ £1,000+ revenue
✅ Profitable (£500+/month profit)

---

## Common Issues & Solutions

### Issue: User can't deposit
**Solution**: Check bank details are correct, user used correct reference code

### Issue: Order fails on Binance
**Solution**: Check Binance API keys, check balance, check Binance status

### Issue: Frontend can't reach backend
**Solution**: Check CORS settings, check API URL in frontend config

### Issue: Database connection fails
**Solution**: Check Railway DATABASE_URL, restart service

### Issue: Out of money
**Solution**: Freelance on side, keep costs low, focus on growth

---

## Next Steps After Launch

Once you have 50+ active users and are profitable:

1. **Automate KYC**: Integrate Sumsub (£1.50 per check)
2. **Add card payments**: Transak or Stripe
3. **Hire support**: Part-time VA for customer service
4. **Complete FCA registration**: £2,000-5,000
5. **Add more features**: Limit orders, more pairs, staking
6. **Scale infrastructure**: Upgrade hosting, add redundancy
7. **Marketing**: Paid ads, partnerships, influencers

---

## Final Pre-Launch Checklist

- [ ] Backend deployed and tested ✅
- [ ] Frontend deployed and tested ✅
- [ ] Domain working with HTTPS ✅
- [ ] Binance API connected ✅
- [ ] Database migrated ✅
- [ ] Admin account created ✅
- [ ] Bank account ready for deposits ✅
- [ ] Terms & Privacy published ✅
- [ ] Support email set up ✅
- [ ] Marketing post ready ✅

**READY TO LAUNCH!** 🚀

---

## Launch Day Checklist

### Morning
- [ ] Final test of all flows
- [ ] Check server status (Railway, Vercel)
- [ ] Check bank account login
- [ ] Prepare for support requests

### Launch (12pm)
- [ ] Post on Reddit r/BitcoinUK
- [ ] Tweet launch announcement
- [ ] Email friends/family
- [ ] Monitor server logs in real-time

### Evening
- [ ] Process any deposits
- [ ] Respond to questions
- [ ] Check for errors
- [ ] Celebrate! 🎉

---

**You've got this!** With £1,000, focus, and this plan, you can launch a real crypto exchange in 4 weeks. 💪

Questions? support@bitcurrent.co.uk

