# 🚀 Railway.app Deployment Guide

Complete step-by-step guide to deploy BitCurrent backend to Railway.app for £15/month.

## Why Railway?

✅ **All-in-one**: Backend + Database + Redis in one platform
✅ **£15/month**: Hobby plan includes everything you need
✅ **Easy deployment**: Push to GitHub, auto-deploy
✅ **Free SSL**: HTTPS included
✅ **Monitoring**: Built-in logs and metrics
✅ **No credit card**: Free trial to test

---

## Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

**Cost**: Free for 7 days, then £15/month

---

## Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Click "Configure GitHub App"
4. Select your repository: `Bitcurrent1`
5. Click "Deploy Now"

Railway will auto-detect the backend and start deploying.

---

## Step 3: Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will provision a database (takes 30 seconds)

**Important**: Railway automatically creates `DATABASE_URL` environment variable and injects it into your backend.

---

## Step 4: Run Database Migration

### Option A: Via Railway CLI (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
cd backend-broker
railway link
```

4. Run migration:
```bash
railway run psql $DATABASE_URL < database/schema.sql
```

### Option B: Manual via Web Console

1. In Railway dashboard, click on PostgreSQL service
2. Click "Data" tab
3. Click "Query"
4. Copy contents of `backend-broker/database/schema.sql`
5. Paste and run

---

## Step 5: Configure Environment Variables

1. In Railway dashboard, click on your backend service
2. Click "Variables" tab
3. Add the following variables:

```env
NODE_ENV=production
PORT=8080
JWT_SECRET=<generate-random-32-char-string>
BINANCE_API_KEY=<your-binance-key>
BINANCE_API_SECRET=<your-binance-secret>
BINANCE_TESTNET=false
ADMIN_EMAIL=<your-email>
FRONTEND_URL=https://bitcurrent.co.uk
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate JWT_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Note**: `DATABASE_URL` is automatically set by Railway.

---

## Step 6: Deploy Backend

1. Railway auto-deploys on git push
2. Or click "Deploy" manually in Railway dashboard
3. Wait for deployment (2-3 minutes)
4. Check logs for errors

You'll see:
```
✅ Database connected
✅ Binance API connected
🚀 BitCurrent Backend Started
📡 Server running on port 8080
```

---

## Step 7: Get Your Backend URL

1. In Railway dashboard, click on backend service
2. Click "Settings" tab
3. Scroll to "Domains"
4. Click "Generate Domain"
5. You'll get a URL like: `bitcurrent-production.up.railway.app`

**Your API URL**: `https://bitcurrent-production.up.railway.app/api/v1`

---

## Step 8: Test Your Backend

### Test Health Check:
```bash
curl https://your-railway-url.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Test Registration:
```bash
curl -X POST https://your-railway-url.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {...},
  "token": "..."
}
```

---

## Step 9: Update Frontend API URL

### Update `frontend/next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/v1/:path*',
      destination: 'https://your-railway-url.railway.app/api/v1/:path*',
    },
  ]
}
```

### Or update `frontend/lib/api/client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-railway-url.railway.app';
```

---

## Step 10: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Select `Bitcurrent1` repository
5. Set Root Directory: `frontend`
6. Add environment variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-railway-url.railway.app`
7. Click "Deploy"

Vercel will auto-detect Next.js and deploy in 2-3 minutes.

---

## Step 11: Custom Domain (Optional)

### For Backend (Railway):
1. In Railway, click backend service
2. Go to Settings → Domains
3. Click "Custom Domain"
4. Enter: `api.bitcurrent.co.uk`
5. Add CNAME record in Hostinger:
   - Type: CNAME
   - Name: api
   - Value: your-railway-url.railway.app

### For Frontend (Vercel):
1. In Vercel project settings
2. Go to Domains
3. Add `bitcurrent.co.uk`
4. Follow Vercel's DNS instructions

---

## Step 12: Monitor Your Deployment

### Railway Dashboard:
- **Logs**: Real-time logs for debugging
- **Metrics**: CPU, memory, network usage
- **Deployments**: History of all deployments

### Check Logs:
```bash
# Via CLI
railway logs

# Or in Railway dashboard → Deployments → View Logs
```

### Common Issues:

**Database connection failed**:
- Check DATABASE_URL is set
- Verify database is running

**Binance API error**:
- Check API keys are correct
- Verify BINANCE_TESTNET setting

**Port already in use**:
- Railway auto-assigns port via $PORT
- Make sure server.js uses process.env.PORT

---

## Cost Breakdown

| Service | Cost | What's Included |
|---------|------|-----------------|
| Railway Hobby Plan | £15/month | Backend + PostgreSQL + 8GB RAM + 500GB bandwidth |
| Vercel (Frontend) | £0/month | Free tier (100GB bandwidth) |
| **Total** | **£15/month** | ✅ |

---

## Scaling Later (When Profitable)

### Upgrade Railway Plan:
- **Pro**: £18/month (16GB RAM, priority support)
- **Team**: Custom pricing

### Add Redis (Optional):
- In Railway, click "+ New" → Database → Redis
- Cost: Included in £15/month plan

### Add Monitoring:
- Sentry (free tier): https://sentry.io
- Logs: Railway built-in
- Uptime: UptimeRobot (free)

---

## Automatic Deployments

Railway auto-deploys on:
1. Push to `main` branch
2. You can also trigger manually

To deploy:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

Railway will automatically:
1. Detect changes
2. Build new image
3. Run tests (if configured)
4. Deploy to production
5. Zero-downtime rollout

---

## Rollback (If Needed)

1. In Railway dashboard
2. Click "Deployments"
3. Find previous successful deployment
4. Click "Redeploy"

---

## Next Steps

✅ Backend deployed to Railway
✅ Database provisioned and migrated
✅ Frontend deployed to Vercel
✅ Environment variables configured

**Now**:
1. Test the full flow (register → deposit → trade)
2. Invite 5-10 beta testers
3. Monitor logs for errors
4. Start marketing!

---

## Support

**Railway**: https://docs.railway.app
**Vercel**: https://vercel.com/docs
**Binance API**: https://binance-docs.github.io/apidocs/spot/en

**Questions**: support@bitcurrent.co.uk

