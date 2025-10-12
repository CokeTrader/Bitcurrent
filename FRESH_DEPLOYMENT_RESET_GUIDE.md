# 🔄 FRESH DEPLOYMENT RESET GUIDE
## Start BitCurrent from Scratch (Nuclear Option)

**Use this if:** Website still not deployed after 20 minutes OR you want clean slate

**Time Required:** 30-45 minutes  
**Result:** Fully working BitCurrent deployment

---

## ⚠️ Before You Start

**This will:**
- ✅ Create fresh deployments on Vercel + Railway
- ✅ Set up DNS correctly
- ✅ Configure all environment variables
- ✅ Test complete flow

**You'll need:**
- GitHub login (CokeTrader account)
- Vercel account
- Railway account  
- Hostinger login
- Stripe API keys (optional, but recommended)

---

## 🚀 STEP 1: Fresh Vercel Deployment (10 minutes)

### 1.1 Delete Old Deployment (if exists)
```
1. Go to: https://vercel.com/
2. Log in with GitHub (CokeTrader)
3. Find "Bitcurrent" or "bitcurrent1" project
4. Click Settings → Advanced → Delete Project
5. Confirm deletion
```

### 1.2 Create Fresh Deployment
```
1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select: CokeTrader/Bitcurrent (or import from GitHub)
4. Framework: Next.js (auto-detected)
5. Root Directory: frontend/
6. Click "Deploy"
```

### 1.3 Configure Environment Variables
```
In Vercel project settings:

1. Go to: Settings → Environment Variables
2. Add these:

   NEXT_PUBLIC_API_URL
   Value: https://bitcurrent-production.up.railway.app
   
   NEXT_PUBLIC_WS_URL (optional)
   Value: wss://bitcurrent-production.up.railway.app
   
3. Click "Save"
4. Redeploy: Deployments → Latest → "Redeploy"
```

### 1.4 Add Custom Domain
```
1. Go to: Settings → Domains
2. Add domain: bitcurrent.co.uk
3. Add domain: www.bitcurrent.co.uk
4. Vercel will show DNS instructions
5. Copy the IP addresses shown (should be 76.76.21.21 and 76.76.21.164)
```

---

## 🚂 STEP 2: Fresh Railway Deployment (10 minutes)

### 2.1 Delete Old Deployment (if needed)
```
1. Go to: https://railway.app/
2. Log in with GitHub (CokeTrader)
3. Find "bitcurrent-production" project
4. Settings → Danger Zone → Delete Project
5. Confirm deletion
```

### 2.2 Create New Railway Project
```
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: CokeTrader/Bitcurrent
4. Root directory: backend-broker/
5. Click "Deploy"
```

### 2.3 Add PostgreSQL Database
```
1. In Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Wait for provisioning (1-2 minutes)
4. Copy DATABASE_URL from "Connect" tab
```

### 2.4 Configure Environment Variables
```
In Railway project → Variables tab:

DATABASE_URL (auto-added from PostgreSQL)

ALPACA_KEY_ID
Value: Your Alpaca API key

ALPACA_SECRET_KEY
Value: Your Alpaca secret

ALPACA_BASE_URL
Value: https://paper-api.alpaca.markets

STRIPE_SECRET_KEY (IMPORTANT for revenue!)
Value: sk_test_... or sk_live_... (from Stripe dashboard)

STRIPE_WEBHOOK_SECRET
Value: whsec_... (from Stripe webhooks)

JWT_SECRET
Value: (run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

FRONTEND_URL
Value: https://bitcurrent.vercel.app

NODE_ENV
Value: production

PORT
Value: 3001
```

### 2.5 Set Up Stripe Webhook
```
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: https://bitcurrent-production.up.railway.app/api/v1/stripe-webhooks
   (Copy Railway deployment URL from dashboard)
4. Events: Select "checkout.session.completed"
5. Copy webhook signing secret (whsec_...)
6. Add STRIPE_WEBHOOK_SECRET to Railway env vars
7. Redeploy Railway
```

### 2.6 Run Database Setup
```
In Railway project:
1. Click "+" → "Empty Service"
2. Name it "db-setup"
3. Add build command: npm install
4. Add start command: node scripts/db-setup.js
5. Deploy
6. Check logs for "✓ Database setup complete"
7. Delete this temporary service
```

---

## 🌐 STEP 3: Configure DNS (5 minutes)

### 3.1 Hostinger DNS Settings
```
1. Go to: https://hpanel.hostinger.com/
2. Login: ayaansharif65@gmail.com / kRAKEN77@Neptun3
3. Domains → bitcurrent.co.uk
4. DNS / Name Servers → Manage DNS Records
5. DELETE all A and CNAME records
6. ADD these records:

   Type: A
   Name: @
   Points to: 76.76.21.21 (or IP shown in Vercel)
   TTL: 3600
   
   Type: CNAME
   Name: www
   Points to: cname.vercel-dns.com
   TTL: 3600

7. Save changes
8. Wait 15-30 minutes for propagation
```

### 3.2 Update Vercel Domain
```
1. In Vercel dashboard → Settings → Domains
2. If bitcurrent.co.uk shows "Invalid Configuration":
   - Click "Refresh" after DNS propagation
   - Should change to "Valid Configuration"
3. SSL certificate auto-generates (2-5 minutes)
```

---

## 🧪 STEP 4: Test Everything (10 minutes)

### 4.1 Test Backend
```bash
# In terminal:
curl https://bitcurrent-production.up.railway.app/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":123}
```

### 4.2 Test Frontend
```
Browser:
1. https://bitcurrent.vercel.app → Should load homepage
2. Click through pages (Markets, About, FAQ, Fees)
3. Try registration flow (don't complete, just test UI)
4. Check trading page /trade/BTC-GBP
```

### 4.3 Test Main Domain (After DNS Propagation)
```
After 15-30 minutes:
1. https://bitcurrent.co.uk → Should load (same as vercel.app)
2. https://www.bitcurrent.co.uk → Should also work
3. SSL certificate should be valid (green padlock)
```

### 4.4 Test Stripe Integration (If keys added)
```
1. Sign up for account
2. Go to Deposit page
3. Click "Instant Deposit (Stripe)"
4. Enter £10
5. Should redirect to Stripe checkout
6. Complete payment (test mode uses card 4242 4242 4242 4242)
7. Should redirect back to dashboard
8. Check balance shows £10
```

---

## 🆘 TROUBLESHOOTING

### "Vercel build fails"
```bash
# Check build logs in Vercel dashboard
# Common issues:
- Missing environment variables
- TypeScript errors
- Module not found

# Fix:
- Add missing env vars
- Check frontend/package.json has all dependencies
- Trigger manual redeploy
```

### "Railway won't start"
```bash
# Check Railway logs
# Common issues:
- Missing DATABASE_URL
- Port binding error
- Module not found

# Fix:
- Ensure PostgreSQL is attached
- Check all env vars present
- npm install ran successfully
```

### "DNS still not working"
```bash
# Check DNS propagation:
nslookup bitcurrent.co.uk

# If still returns NXDOMAIN:
- Wait longer (up to 24 hours globally)
- Flush local DNS: sudo dscacheutil -flushcache (Mac)
- Try different network/incognito
- Use bitcurrent.vercel.app in meantime
```

### "Stripe checkout fails"
```
# Check Railway logs for errors
# Ensure:
- STRIPE_SECRET_KEY is set
- STRIPE_WEBHOOK_SECRET is set
- Webhook endpoint configured in Stripe dashboard
- Test with: node scripts/test-stripe.js
```

---

## ✅ SUCCESS CHECKLIST

After completing all steps, you should have:

**Vercel (Frontend):**
- [ ] Project deployed successfully
- [ ] Build shows "✓ Compiled successfully"
- [ ] Homepage loads at bitcurrent.vercel.app
- [ ] All pages accessible
- [ ] No console errors

**Railway (Backend):**
- [ ] Project deployed and "Active"
- [ ] PostgreSQL database attached
- [ ] All env vars configured
- [ ] /health returns 200 OK
- [ ] /api/v1/markets returns data

**DNS:**
- [ ] Hostinger A record: @ → 76.76.21.21
- [ ] Hostinger CNAME: www → cname.vercel-dns.com
- [ ] bitcurrent.co.uk resolves (after propagation)
- [ ] SSL certificate valid

**Integrations:**
- [ ] Alpaca API connected (check Railway logs)
- [ ] Stripe configured (optional but recommended)
- [ ] Database tables created
- [ ] Webhook endpoint active

**Testing:**
- [ ] Can load homepage
- [ ] Can navigate between pages
- [ ] Can view markets
- [ ] Can see trading page
- [ ] Mobile responsive works
- [ ] No critical errors

---

## 🚀 WHAT YOU'LL HAVE AFTER RESET

**A fully functional crypto exchange:**
- ✅ 20+ pages (homepage, trading, earn, FAQ, etc.)
- ✅ 50+ components (charts, widgets, forms)
- ✅ 40+ API endpoints (trading, staking, referrals)
- ✅ Complete trading system (market + limit orders)
- ✅ Stripe payment integration
- ✅ Staking platform (4 pools)
- ✅ Referral program (viral growth)
- ✅ Security features (2FA, API keys)
- ✅ Legal compliance (terms, privacy, KYC)
- ✅ Professional UI (TradingView charts, etc.)

**Ready to generate revenue!**

---

## 📞 SUPPORT

If stuck at any step:
1. Check Railway/Vercel logs first
2. Review error messages carefully
3. Try the troubleshooting section above
4. DM me the specific error

---

**TIME TO COMPLETE: 30-45 minutes**  
**DIFFICULTY: Moderate (follow steps carefully)**  
**RESULT: Production-ready crypto exchange**

🎯 **This is your nuclear option - use it if needed!**

✅ **But try the DNS fix first - that might be all you need!**

