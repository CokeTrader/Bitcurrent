# BitCurrent Exchange - Quick Start Deployment Guide

**Goal**: Get BitCurrent live at bitcurrent.co.uk this weekend  
**Time Required**: 4-6 hours  
**Cost**: ~£100-200 (can tear down after testing)

---

## ⚡ Absolute Minimum to Deploy

### What You Need (Can do in 1 day):

1. **AWS Account** - Create at https://aws.amazon.com (1 hour)
2. **Domain DNS** - Update nameservers at your registrar (30 min + propagation time)
3. **Secrets** - Generate random strings (30 min)

That's it! Everything else is optional for initial deployment.

---

## 🎯 Weekend Deployment Plan

### Friday Evening (2-3 hours)

**Task 1: AWS Account** (1 hour)
```
1. Go to https://aws.amazon.com → Create account
2. Use email: aws@bitcurrent.co.uk (or your email)
3. Enable MFA on root account (CRITICAL!)
4. Create IAM admin user
5. Install AWS CLI: brew install awscli
6. Configure: aws configure
   - Access Key: [from IAM user]
   - Secret Key: [from IAM user]
   - Region: eu-west-2
```

**Task 2: Generate Secrets** (30 min)
```bash
# In your terminal
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env.prod

# Generate encryption key
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env.prod

# Generate database password
echo "DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32)" >> .env.prod

# View generated secrets
cat .env.prod
```

**Task 3: Free API Keys** (30 min)
```
1. CoinGecko: https://www.coingecko.com/en/api → Sign up (FREE)
2. Infura (Ethereum): https://infura.io/ → Create project (FREE)
3. Binance: https://www.binance.com/ → API Management (FREE, read-only)

Save these keys in .env.prod
```

**Task 4: Deploy Infrastructure** (45 min)
```bash
# Make sure AWS CLI is configured
aws sts get-caller-identity

# Deploy!
./infrastructure/scripts/deploy-infrastructure.sh prod

# This will:
# - Create S3 bucket for Terraform state
# - Deploy VPC, EKS, RDS, Redis, Kafka (~30 min)
# - Configure kubectl automatically
# - Install ingress-nginx and cert-manager
# - Show you the Route53 nameservers

# Write down the 4 nameservers shown!
```

---

### Saturday Morning (2 hours + waiting)

**Task 5: Update Domain Nameservers** (15 min)
```
1. Login to where you bought bitcurrent.co.uk
   (Namecheap/GoDaddy/123-reg/etc.)

2. Find DNS settings for bitcurrent.co.uk

3. Change nameservers to the 4 AWS ones:
   ns-123.awsdns-12.com
   ns-456.awsdns-34.net
   ns-789.awsdns-56.org
   ns-012.awsdns-78.co.uk

4. Save changes
```

**Task 6: Create Kubernetes Secrets** (30 min)
```bash
# Copy template
cp infrastructure/kubernetes/base/secrets.yaml.example infrastructure/kubernetes/base/secrets.yaml

# Edit with real values
nano infrastructure/kubernetes/base/secrets.yaml

# Update these minimum fields:
# - database_url: (get from: cd infrastructure/terraform/environments/prod && terraform output rds_endpoint)
# - redis_url: (get from terraform output)
# - jwt_secret: (from .env.prod)
# - encryption_key: (from .env.prod)
# - coingecko_api_key: (from Friday)
# - ethereum_rpc_url: (Infura URL from Friday)

# Apply to Kubernetes
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml
```

**Task 7: Run Database Migrations** (15 min)
```bash
# Get DB endpoint
cd infrastructure/terraform/environments/prod
DB_HOST=$(terraform output -raw rds_endpoint)
DB_PASS=$(cat ~/.env.prod | grep DB_PASSWORD | cut -d= -f2)

# Run migrations
docker run --rm \
  -v $(pwd)/../../migrations/postgresql:/migrations \
  migrate/migrate \
  -path=/migrations \
  -database "postgres://bitcurrent_admin:$DB_PASS@$DB_HOST/bitcurrent?sslmode=require" \
  up

# Should see:
# 1/u init_schema (...)
# 2/u market_data_timescale (...)
# 3/u add_security_fields (...)
# 4/u add_banking_tables (...)
```

**Task 8: Deploy Services** (30 min)
```bash
# Deploy with Helm
helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent \
  -f ./infrastructure/helm/values-prod.yaml \
  --namespace bitcurrent-prod \
  --create-namespace \
  --wait

# Check deployment
kubectl get pods -n bitcurrent-prod

# Should see all pods running (may take 5-10 minutes)
```

**Task 9: Wait for DNS** (2-24 hours)
```bash
# Check every hour
dig bitcurrent.co.uk

# When it shows AWS IPs, continue to next step
```

---

### Saturday Afternoon (1 hour)

**Task 10: Build and Deploy Frontend** (30 min)
```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to S3
aws s3 sync out/ s3://bitcurrent-prod-frontend/ --delete

# Invalidate CloudFront cache
cd ../infrastructure/terraform/environments/prod
DIST_ID=$(terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"

# Wait 5-10 minutes for invalidation
```

**Task 11: Test Everything** (30 min)
```bash
# Run health checks
./infrastructure/scripts/health-check.sh bitcurrent-prod

# Test API
curl https://api.bitcurrent.co.uk/health
curl https://api.bitcurrent.co.uk/api/v1/markets

# Test frontend
open https://bitcurrent.co.uk

# Should see:
✅ Landing page loads
✅ Can click to registration
✅ Can create account
✅ Can login
✅ Can view markets
✅ Can see orderbook
```

---

## 🎉 Success Criteria

After completing the above, you should have:

✅ BitCurrent live at https://bitcurrent.co.uk  
✅ API accessible at https://api.bitcurrent.co.uk  
✅ All services running on AWS  
✅ SSL certificates valid  
✅ Can create accounts  
✅ Can login  
✅ Can view markets and orderbook  
✅ Monitoring dashboards accessible  

**Platform Status**: LIVE (testnet mode, no real money yet)

---

## ⚠️ Important Notes

### What Works Immediately:
- ✅ User registration/login
- ✅ Order placement (demo mode)
- ✅ Orderbook display
- ✅ Portfolio dashboard
- ✅ Complete UI/UX

### What Needs Real Integrations (for real money):
- ⬜ GBP deposits/withdrawals (need ClearBank)
- ⬜ KYC verification (need Onfido)
- ⬜ AML screening (need Chainalysis)
- ⬜ Real Bitcoin/Ethereum (need production RPC)

### What Needs Regulatory Approval:
- ⬜ Accept customer deposits (need FCA approval)
- ⬜ Public marketing (need FCA approval)
- ⬜ Handle real money (need FCA + insurance)

---

## 💡 Pro Tips

### Tip 1: Use AWS Free Tier
Some AWS services have free tier:
- CloudFront: 1TB data transfer free/month
- SES: 62,000 emails free/month (if from EC2)
- CloudWatch: 10 custom metrics free

### Tip 2: Start with Smaller Instances
Initially deploy with:
- Matching engine: c6i.4xlarge instead of c6i.8xlarge (half the cost)
- RDS: db.r6i.2xlarge instead of db.r6i.4xlarge
- Can upgrade later when needed

Edit in: `infrastructure/terraform/environments/prod/variables.tf`

**Saves**: ~40% on infrastructure cost

### Tip 3: Use Staging for Development
The staging environment costs ~£400-700/month vs £2,500-4,500 for production.

Use staging for:
- Development and testing
- Demo to investors
- Team training

Only run production when ready for real users.

---

## 📊 Deployment Verification Checklist

After deployment, verify:

```bash
# Services Running
⬜ kubectl get pods -n bitcurrent-prod (all Running)
⬜ kubectl get services -n bitcurrent-prod (all healthy)

# DNS Resolution
⬜ dig bitcurrent.co.uk (shows CloudFront IP)
⬜ dig api.bitcurrent.co.uk (shows ALB)
⬜ dig ws.bitcurrent.co.uk (shows NLB)

# SSL Certificates
⬜ https://bitcurrent.co.uk (green padlock, valid cert)
⬜ https://api.bitcurrent.co.uk (valid cert)

# Health Endpoints
⬜ curl https://api.bitcurrent.co.uk/health (returns {"status":"healthy"})
⬜ curl https://api.bitcurrent.co.uk/ready (returns {"ready":true})

# Frontend
⬜ Homepage loads (bitcurrent.co.uk)
⬜ Can navigate to /auth/login
⬜ Can navigate to /auth/register
⬜ Can navigate to /trade/BTC-GBP

# API Endpoints
⬜ GET /api/v1/markets (returns trading pairs)
⬜ POST /api/v1/auth/register (can create account)
⬜ POST /api/v1/auth/login (can login)

# Monitoring
⬜ Grafana accessible (https://grafana.bitcurrent.co.uk)
⬜ Prometheus accessible (internal only)
⬜ Alerts configured in Slack

# Database
⬜ All migrations applied (4 migrations)
⬜ Tables exist (26 tables total)
⬜ Can query from services
```

---

## 🆘 If Something Goes Wrong

### Deployment Failed?
```bash
# Check Terraform errors
cd infrastructure/terraform/environments/prod
terraform plan  # Review what would be created
terraform apply # Re-run if partial failure

# Check kubectl access
aws eks update-kubeconfig --region eu-west-2 --name bitcurrent-prod
kubectl get nodes  # Should show nodes

# Check logs
kubectl logs deployment/api-gateway -n bitcurrent-prod
```

### DNS Not Propagating?
```bash
# Check current nameservers
dig NS bitcurrent.co.uk +short

# Check from different DNS servers
dig @8.8.8.8 bitcurrent.co.uk  # Google DNS
dig @1.1.1.1 bitcurrent.co.uk  # Cloudflare DNS

# If still showing old nameservers, wait longer
# Can take 24-48 hours (usually 2-4 hours)
```

### Pods Not Starting?
```bash
# Check pod status
kubectl describe pod [pod-name] -n bitcurrent-prod

# Check logs
kubectl logs [pod-name] -n bitcurrent-prod

# Common issues:
# - Missing secrets (apply secrets.yaml)
# - Wrong image tag (check values.yaml)
# - Resource limits too low (edit resources)
```

---

## 📞 Getting Help

**For Deployment Issues**:
1. Check DEPLOYMENT_CHECKLIST.md (comprehensive guide)
2. Check docs/operations/RUNBOOK.md (troubleshooting)
3. Review Terraform/Kubernetes logs
4. Google the specific error message

**For AWS Issues**:
- AWS Support (if you have support plan)
- AWS Documentation: https://docs.aws.amazon.com/
- AWS re:Post (community forum)

**For Regulatory Questions**:
- Engage law firm immediately
- FCA website: https://www.fca.org.uk/
- Crypto-specialized solicitors

---

## ✅ Summary

**TO DEPLOY THIS WEEKEND**:
1. Create AWS account (1h)
2. Deploy infrastructure (1h)
3. Update DNS (30min + wait)
4. Configure secrets (1h)
5. Deploy services (30min)
6. Test (1h)

**TOTAL**: ~6 hours + DNS wait time

**TO LAUNCH WITH REAL MONEY** (later):
1. FCA approval (3-6 months)
2. ClearBank account (4-8 weeks)
3. Insurance (2-4 weeks)
4. KYC/AML services (1-2 weeks)

**You can deploy and test everything EXCEPT real money operations this weekend!**

---

**Ready to go? Follow DEPLOYMENT_CHECKLIST.md step by step!** 🚀

