# 🚀 BitCurrent Deployment Guide

**Target**: bitcurrent.co.uk  
**Status**: Ready to Deploy  
**Date**: October 11, 2025

---

## 🎯 WHAT WE'RE DEPLOYING

### Frontend (100% Complete)
- ✅ All 16 pages built
- ✅ Smart navigation
- ✅ Web3 integration
- ✅ Real-time trading
- ✅ Premium auth pages
- ✅ PWA ready
- ✅ Bundle: 86.8 KB

### Backend Enhancements
- ✅ Password reset API
- ✅ Email verification
- ✅ User preferences
- ✅ Login history
- ✅ Enhanced security
- ✅ Database migrations ready

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Database
- [x] Migrations created (`000005_add_password_reset.up.sql`)
- [x] Tables: password_reset_tokens, email_verification_tokens, user_preferences, login_history
- [x] Tested locally ✅
- [ ] Run on production database

### Frontend
- [x] Build successful (`npm run build`)
- [x] All routes working
- [x] Smart navigation implemented
- [x] Tests written
- [ ] Docker image built
- [ ] Pushed to ECR

### Backend
- [x] API Gateway enhanced
- [x] Password reset handler
- [x] User management handler
- [x] Go build successful
- [ ] Docker image built
- [ ] Pushed to ECR

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Run Database Migration on Production

```bash
# Connect to production PostgreSQL
export DB_HOST="your-rds-endpoint.amazonaws.com"
export DB_NAME="bitcurrent"
export DB_USER="bitcurrent"
export DB_PASSWORD="your-password"

# Run migration
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME" \
  < migrations/postgresql/000005_add_password_reset.up.sql

# Verify tables created
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME" \
  -c "\dt password_reset_tokens"
```

---

### Step 2: Deploy Frontend to bitcurrent.co.uk

```bash
# Navigate to frontend directory
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/frontend

# Build production bundle
npm run build

# Build Docker image (using Next.js standalone output)
docker build -t bitcurrent-frontend:latest -f Dockerfile .

# Tag for ECR (replace with your ECR URL)
export ECR_REGISTRY="<account-id>.dkr.ecr.eu-west-2.amazonaws.com"
docker tag bitcurrent-frontend:latest $ECR_REGISTRY/bitcurrent-frontend:latest

# Login to ECR
aws ecr get-login-password --region eu-west-2 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Push to ECR
docker push $ECR_REGISTRY/bitcurrent-frontend:latest

# Update Kubernetes deployment
kubectl set image deployment/frontend \
  frontend=$ECR_REGISTRY/bitcurrent-frontend:latest \
  -n bitcurrent

# Or restart to pull latest
kubectl rollout restart deployment/frontend -n bitcurrent

# Watch rollout
kubectl rollout status deployment/frontend -n bitcurrent

# Verify
curl https://bitcurrent.co.uk
```

---

### Step 3: Deploy Enhanced API Gateway

```bash
# Navigate to API Gateway
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/services/api-gateway

# Build Docker image
docker build -t bitcurrent-api-gateway:latest .

# Tag for ECR
docker tag bitcurrent-api-gateway:latest $ECR_REGISTRY/bitcurrent-api-gateway:latest

# Push to ECR
docker push $ECR_REGISTRY/bitcurrent-api-gateway:latest

# Update Kubernetes
kubectl set image deployment/api-gateway \
  api-gateway=$ECR_REGISTRY/bitcurrent-api-gateway:latest \
  -n bitcurrent

# Or restart
kubectl rollout restart deployment/api-gateway -n bitcurrent

# Verify
kubectl logs -f deployment/api-gateway -n bitcurrent
```

---

### Step 4: Verify Deployment

```bash
# Check frontend
curl https://bitcurrent.co.uk

# Check API health
curl https://bitcurrent.co.uk/api/v1/health

# Check specific features
curl https://bitcurrent.co.uk/api/v1/markets

# Test password reset endpoint
curl -X POST https://bitcurrent.co.uk/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🔧 SIMPLIFIED DEPLOYMENT (One Command)

Create `deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying BitCurrent..."

# Set variables
export ECR_REGISTRY="<your-ecr-url>"
export AWS_REGION="eu-west-2"

# Login to ECR
echo "📦 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and deploy frontend
echo "🎨 Building frontend..."
cd frontend
npm run build
docker build -t bitcurrent-frontend:latest .
docker tag bitcurrent-frontend:latest $ECR_REGISTRY/bitcurrent-frontend:latest
docker push $ECR_REGISTRY/bitcurrent-frontend:latest
kubectl rollout restart deployment/frontend -n bitcurrent

# Build and deploy API Gateway
echo "⚙️  Building API Gateway..."
cd ../services/api-gateway
docker build -t bitcurrent-api-gateway:latest .
docker tag bitcurrent-api-gateway:latest $ECR_REGISTRY/bitcurrent-api-gateway:latest
docker push $ECR_REGISTRY/bitcurrent-api-gateway:latest
kubectl rollout restart deployment/api-gateway -n bitcurrent

# Wait for rollouts
echo "⏳ Waiting for deployments..."
kubectl rollout status deployment/frontend -n bitcurrent
kubectl rollout status deployment/api-gateway -n bitcurrent

echo "✅ Deployment complete!"
echo "🌐 Visit: https://bitcurrent.co.uk"
```

---

## 🎯 WHAT WILL BE LIVE

After deployment, users on bitcurrent.co.uk will see:

### ✅ Frontend Updates
- Smart navigation (Sign In/Get Started visible!)
- Premium auth pages (glassmorphism)
- 3-step signup with password strength
- Real-time trading with WebSocket
- Web3 wallet connection
- Staking pools
- Mobile-optimized

### ✅ Backend Updates
- Password reset flow working
- Email verification ready
- User preferences API
- Login history tracking
- Enhanced security
- Better error handling

---

## ⚠️ IMPORTANT NOTES

### Before Deployment:

1. **Environment Variables**: Ensure production has:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
   NEXT_PUBLIC_COINGECKO_API_KEY=CG-zYnaYNPafFEBwVto94yj17Ey
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-secret-key
   ```

2. **Database Backup**: 
   ```bash
   # Backup before running migrations
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Monitoring**:
   ```bash
   # Watch logs during deployment
   kubectl logs -f deployment/frontend -n bitcurrent
   kubectl logs -f deployment/api-gateway -n bitcurrent
   ```

---

## 🔥 ROLLBACK PLAN

If something goes wrong:

```bash
# Rollback frontend
kubectl rollout undo deployment/frontend -n bitcurrent

# Rollback API Gateway
kubectl rollout undo deployment/api-gateway -n bitcurrent

# Rollback database migration
psql $DATABASE_URL < migrations/postgresql/000005_add_password_reset.down.sql
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Frontend Checks:
```bash
# Homepage loads
curl -I https://bitcurrent.co.uk

# Auth pages work
curl -I https://bitcurrent.co.uk/auth/login
curl -I https://bitcurrent.co.uk/auth/register

# Trading page loads
curl -I https://bitcurrent.co.uk/trade/BTC-GBP

# Markets page loads
curl -I https://bitcurrent.co.uk/markets
```

### Backend Checks:
```bash
# Health check
curl https://bitcurrent.co.uk/api/v1/health

# Markets API
curl https://bitcurrent.co.uk/api/v1/markets

# Test register (should return 201 or 409 if email exists)
curl -X POST https://bitcurrent.co.uk/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!",
    "first_name":"Test",
    "last_name":"User"
  }'

# Test password reset
curl -X POST https://bitcurrent.co.uk/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🎯 SUCCESS CRITERIA

Deployment is successful if:

- ✅ https://bitcurrent.co.uk loads (homepage)
- ✅ Smart navigation shows Sign In/Get Started
- ✅ /auth/register shows 3-step signup
- ✅ /auth/login works
- ✅ /markets shows 100+ coins with real prices
- ✅ /trade/BTC-GBP shows real-time trading
- ✅ Password reset flow works end-to-end
- ✅ Mobile menu only on mobile
- ✅ All APIs respond correctly

---

## 📊 WHAT'S READY TO DEPLOY

**Frontend** (100%):
- 18 routes
- 40+ components
- Smart navigation
- Premium design
- PWA manifest
- 86.8 KB bundle

**Backend** (Enhanced):
- 7 microservices
- Password reset API
- Email verification
- User preferences
- Login history
- Security improvements

**Database** (Enhanced):
- 20+ tables (4 new)
- Password reset support
- Email verification
- User preferences
- Login tracking

---

**Ready to deploy!** Let me know your ECR registry URL and I'll create the deployment script! 🚀



