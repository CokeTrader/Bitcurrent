# 🚀 Deployment Guide

Complete guide for deploying BitCurrent to production.

---

## 📋 Pre-Deployment Checklist

### Environment Preparation
- [ ] All environment variables configured
- [ ] Secrets rotated (JWT, API keys)
- [ ] Database backups enabled
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] Rate limiting configured
- [ ] CORS origins set correctly

### Security
- [ ] Security audit completed
- [ ] Dependencies updated (no critical vulnerabilities)
- [ ] Secret scanning passed
- [ ] 2FA enabled for admin accounts
- [ ] API keys secured
- [ ] No secrets in code

### Testing
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Manual testing completed
- [ ] Performance testing passed
- [ ] Load testing completed
- [ ] Health checks working

### Documentation
- [ ] API documentation up-to-date
- [ ] README updated
- [ ] Changelog updated
- [ ] Deployment guide reviewed

---

## 🎯 Frontend Deployment (Vercel)

### 1. Initial Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login
```

### 2. Configure Project

```bash
cd frontend
vercel
```

Follow prompts:
- **Scope:** Your account
- **Link to existing project:** No
- **Project name:** bitcurrent-frontend
- **Directory:** ./
- **Build command:** `npm run build`
- **Output directory:** `.next`

### 3. Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://api.bitcurrent.com
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
NEXT_PUBLIC_GA_ID=G-...
NODE_ENV=production
```

### 4. Custom Domain

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add domain: `bitcurrent.com`
3. Configure DNS (see DNS section below)
4. Wait for SSL certificate (automatic)

### 5. Deploy

```bash
# Deploy to production
vercel --prod
```

**Automatic Deployments:**
- Pushes to `main` deploy automatically
- Preview deployments for all branches
- Rollback available in dashboard

---

## 🗄️ Backend Deployment (Railway)

### 1. Initial Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login
```

### 2. Create Project

```bash
cd backend-broker
railway init
```

### 3. Add PostgreSQL Database

```bash
railway add postgresql
```

Railway automatically provides `DATABASE_URL`.

### 4. Environment Variables

In Railway Dashboard → Project → Variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
JWT_SECRET=<generate-new-64-char-secret>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ALPACA_KEY_ID=<your-alpaca-key>
ALPACA_SECRET_KEY=<your-alpaca-secret>
FRONTEND_URL=https://bitcurrent.com
PORT=4000
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Configure Build

Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 6. Run Migrations

```bash
railway run bash
node scripts/migration-manager.js up
exit
```

### 7. Deploy

```bash
railway up
```

**Custom Domain:**
1. Railway Dashboard → Project → Settings → Domains
2. Add custom domain: `api.bitcurrent.com`
3. Configure DNS (see below)

---

## 🌐 DNS Configuration

### For Vercel (Frontend)

**Hostinger DNS Settings:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 300 |
| CNAME | www | cname.vercel-dns.com | 300 |

**Verify:**
```bash
dig bitcurrent.com
dig www.bitcurrent.com
```

### For Railway (Backend)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | api | <your-railway-domain>.railway.app | 300 |

**Verify:**
```bash
dig api.bitcurrent.com
curl https://api.bitcurrent.com/health
```

---

## 🔐 Stripe Webhook Setup

### 1. Get Webhook Secret

```bash
# Stripe Dashboard → Developers → Webhooks → Add endpoint
# URL: https://api.bitcurrent.com/v1/deposits/webhook
# Events: checkout.session.completed
```

### 2. Test Webhook

```bash
stripe listen --forward-to https://api.bitcurrent.com/v1/deposits/webhook
```

### 3. Add Secret to Railway

```bash
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📊 Monitoring Setup

### Health Checks

**Vercel (Frontend):**
- Automatic monitoring
- Status page: https://vercel.com/status

**Railway (Backend):**
- Healthcheck endpoint: `/health`
- Configured in `railway.json`
- Automatic restart on failure

### Custom Monitoring

```bash
# Add UptimeRobot checks
# Frontend: https://bitcurrent.com
# Backend: https://api.bitcurrent.com/health
# Check interval: 5 minutes
```

### Logging

**Backend Logs:**
```bash
railway logs
```

**Frontend Logs:**
- Vercel Dashboard → Project → Deployments → Logs

---

## 🔄 CI/CD Pipeline

GitHub Actions automatically:
1. Run tests on push
2. Deploy to production on merge to `main`
3. Run post-deployment health checks
4. Notify on failures

**Configuration:** `.github/workflows/deploy-production.yml`

---

## 🚨 Rollback Procedures

### Frontend (Vercel)

1. Go to Vercel Dashboard → Project → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Backend (Railway)

1. Railway Dashboard → Project → Deployments
2. Find previous deployment
3. Click "Redeploy"

**Database Rollback:**
```bash
railway run bash
node scripts/migration-manager.js down
exit
```

---

## 🧪 Post-Deployment Validation

### 1. Health Checks

```bash
# Frontend
curl https://bitcurrent.com
# Should return HTML

# Backend
curl https://api.bitcurrent.com/health
# Should return {"status":"ok"}
```

### 2. Smoke Tests

```bash
cd frontend
npx playwright test --grep @smoke
```

### 3. Manual Testing

- [ ] Homepage loads
- [ ] User registration works
- [ ] Login works
- [ ] Trading page loads
- [ ] Deposit flow works (Stripe)
- [ ] Order placement works
- [ ] Portfolio displays correctly
- [ ] Logout works

### 4. Performance Checks

```bash
# Lighthouse score (aim for 90+)
npx lighthouse https://bitcurrent.com

# API response time (aim for < 500ms)
curl -w "@curl-format.txt" -o /dev/null -s https://api.bitcurrent.com/v1/markets
```

---

## 📈 Scaling Considerations

### When to Scale

**Frontend:**
- Automatic scaling by Vercel
- No action needed up to 100k requests/day

**Backend:**
- Monitor CPU/Memory in Railway dashboard
- Scale when CPU > 80% consistently
- Scale when response time > 1s

### How to Scale

**Railway Vertical Scaling:**
1. Dashboard → Project → Settings → Resources
2. Increase CPU/Memory allocation
3. Redeploy

**Database Scaling:**
1. Railway Dashboard → PostgreSQL → Settings
2. Upgrade plan as needed
3. Connection pooling (already configured)

---

## 🆘 Troubleshooting

### Frontend Not Loading

```bash
# Check deployment status
vercel ls

# Check logs
vercel logs

# Check DNS
dig bitcurrent.com
```

### Backend API Errors

```bash
# Check logs
railway logs

# Check environment variables
railway variables

# SSH into container
railway run bash
node scripts/health-check.js
```

### Database Connection Issues

```bash
railway run bash
psql $DATABASE_URL
\dt  # List tables
\q   # Quit
```

### SSL Certificate Issues

- Vercel: Automatic, wait 24h after DNS change
- Railway: Automatic, ensure CNAME is correct

---

## 📞 Support

- **Deployment Issues:** deploy@bitcurrent.com
- **Infrastructure:** infra@bitcurrent.com  
- **Emergency:** +44 (0) XXX XXXX (24/7)

---

**Deployment Status:** Production Ready ✅  
**Last Updated:** October 13, 2025

