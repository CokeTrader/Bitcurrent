# BitCurrent Deployment - Step-by-Step Walkthrough

**Goal**: Get from zero to deployed in AWS  
**Time**: 2-3 hours  
**Difficulty**: Easy (just follow exactly)

---

## ✅ Pre-Check: What You Need

Before starting, make sure you have:
- [ ] MacBook with terminal access
- [ ] Credit card (for AWS billing)
- [ ] Email address (for AWS account)
- [ ] Phone number (for AWS verification)
- [ ] Access to bitcurrent.co.uk domain registrar

---

## 📋 Step-by-Step Process

### STEP 1: AWS Account Creation (20 minutes)

**1.1 Open AWS Signup**
```bash
# Open in browser
open https://aws.amazon.com/
```
- Click "Create an AWS Account" (orange button, top right)

**1.2 Fill Account Details**
```
Email: [Your email - remember this!]
Password: [Strong password - save in password manager!]
AWS Account Name: BitCurrent Exchange
```
- Click "Continue"

**1.3 Contact Information**
```
Account type: Professional
Full name: [Your name or company name]
Phone: [Your UK mobile]
Address: [Your UK address]
```
- Agree to terms → Click "Continue"

**1.4 Payment Information**
- Enter credit card details (required, but won't charge yet)
- Click "Verify and Continue"

**1.5 Identity Verification**
- Choose phone verification
- Enter phone number
- Wait for call/SMS with PIN
- Enter PIN
- Click "Continue"

**1.6 Select Support Plan**
- Choose "Basic support - Free"
- Click "Complete sign up"

**✅ Account Created!** You'll see "Welcome to Amazon Web Services"

---

### STEP 2: Secure Your Account (10 minutes)

**2.1 Enable MFA on Root Account** (CRITICAL!)

```bash
# In AWS Console
1. Click your account name (top right) → "Security Credentials"
2. Scroll to "Multi-factor authentication (MFA)"
3. Click "Assign MFA device"
4. Choose:
   - "Authenticator app" (easiest - use Google Authenticator, Authy, or 1Password)
   OR
   - "Security key" (if you have YubiKey)
5. Scan QR code with your app
6. Enter two consecutive MFA codes
7. Click "Assign MFA"
```

**✅ Root account is now secure!**

---

### STEP 3: Create IAM Admin User (15 minutes)

**3.1 Go to IAM**
```bash
# In AWS Console
1. Search bar (top) → Type "IAM" → Click "IAM"
2. Left menu → Click "Users"
3. Click "Create user" (blue button)
```

**3.2 User Details**
```
User name: bitcurrent-admin
Click "Next"
```

**3.3 Permissions**
```
1. Select "Attach policies directly"
2. Search: AdministratorAccess
3. Check the box next to "AdministratorAccess"
4. Click "Next"
```

**3.4 Review and Create**
```
Click "Create user"
```

**3.5 Create Access Keys**
```
1. Click on the user you just created (bitcurrent-admin)
2. Click "Security credentials" tab
3. Scroll to "Access keys"
4. Click "Create access key"
5. Choose use case: "Command Line Interface (CLI)"
6. Check "I understand..." → Click "Next"
7. Description: "Local development" → Click "Create access key"
8. ⚠️ IMPORTANT: Click "Download .csv file" and save it!
9. Click "Done"
```

**✅ You now have:**
- Access Key ID (starts with AKIA...)
- Secret Access Key (long random string)

**SAVE THESE SECURELY!** (Password manager or encrypted file)

---

### STEP 4: Install AWS CLI (5 minutes)

**4.1 Check if Already Installed**
```bash
aws --version
```

If you see version number (e.g., "aws-cli/2.x.x"), skip to step 4.3.

**4.2 Install AWS CLI**
```bash
# For macOS
brew install awscli

# Verify installation
aws --version
```

Should show: `aws-cli/2.x.x Python/3.x.x Darwin/...`

**4.3 Configure AWS CLI**
```bash
aws configure
```

You'll be prompted for 4 values:
```
AWS Access Key ID [None]: [Paste from downloaded CSV - column "Access key ID"]
AWS Secret Access Key [None]: [Paste from downloaded CSV - column "Secret access key"]
Default region name [None]: eu-west-2
Default output format [None]: json
```

**4.4 Verify Configuration Works**
```bash
aws sts get-caller-identity
```

Should show something like:
```json
{
    "UserId": "AIDAXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/bitcurrent-admin"
}
```

**✅ AWS CLI is configured!**

---

### STEP 5: Generate Application Secrets (5 minutes)

**5.1 Create Environment File**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Create production environment file
touch .env.prod
```

**5.2 Generate Secrets**
```bash
# Generate JWT secret (for user sessions)
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env.prod

# Generate encryption key (for sensitive data)
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env.prod

# Generate database password
echo "DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32)" >> .env.prod

# Generate session secret
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env.prod
```

**5.3 View Generated Secrets**
```bash
cat .env.prod
```

Should see 4 lines with random strings.

**✅ Secrets generated!** (Keep this file safe, never commit to git)

---

### STEP 6: Get Free API Keys (15 minutes)

**6.1 CoinGecko (Market Data)**
```bash
# Open in browser
open https://www.coingecko.com/en/api
```
1. Click "Get Your API Key"
2. Sign up (use: api-keys@bitcurrent.co.uk or your email)
3. Select "Demo" plan (FREE)
4. Copy your API key
5. Add to .env.prod:
```bash
echo "COINGECKO_API_KEY=CG-YOUR-KEY-HERE" >> .env.prod
```

**6.2 Infura (Ethereum RPC)**
```bash
# Open in browser
open https://infura.io/
```
1. Sign up
2. Create project: "BitCurrent Exchange"
3. Copy "Project ID"
4. Add to .env.prod:
```bash
echo "INFURA_PROJECT_ID=your-project-id-here" >> .env.prod
echo "ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id-here" >> .env.prod
```

**6.3 Binance (Optional - Market Data)**
```bash
# Open in browser
open https://www.binance.com/en/my/settings/api-management
```
1. Login or create account
2. Create API key
3. Enable only "Reading" permission
4. Copy API Key and Secret
5. Add to .env.prod:
```bash
echo "BINANCE_API_KEY=your-key" >> .env.prod
echo "BINANCE_SECRET_KEY=your-secret" >> .env.prod
```

**✅ API keys configured!**

---

### STEP 7: Deploy Infrastructure to AWS (30-45 minutes)

This is the big one! It will create everything in AWS.

**7.1 Make Deployment Script Executable**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1
chmod +x infrastructure/scripts/*.sh
```

**7.2 Review What Will Be Created**
The script will create:
- VPC (Virtual Private Cloud)
- EKS (Kubernetes cluster)
- RDS (PostgreSQL database)
- ElastiCache (Redis)
- MSK (Kafka)
- S3 buckets
- Load balancers
- Route53 DNS
- SSL certificates

**7.3 Run Deployment Script**
```bash
./infrastructure/scripts/deploy-infrastructure.sh prod
```

**What happens:**
1. Creates S3 bucket for Terraform state
2. Initializes Terraform
3. Shows you the plan (what will be created)
4. Asks for confirmation (type "yes")
5. Creates all infrastructure (~30 minutes)
6. Configures kubectl
7. Shows you Route53 nameservers

**⏱️ This takes 30-45 minutes - grab coffee!**

**Possible Errors and Fixes:**

**Error: "region must be set"**
```bash
# Run this first
export AWS_DEFAULT_REGION=eu-west-2
# Then retry deployment
```

**Error: "credentials not found"**
```bash
# Reconfigure AWS CLI
aws configure
# Verify
aws sts get-caller-identity
# Then retry
```

**Error: "resource limit exceeded"**
```bash
# Your AWS account might have limits
# Go to: https://console.aws.amazon.com/servicequotas/
# Request increase for:
# - VPCs per region (need 2)
# - Elastic IPs (need 3)
# Wait for approval (usually instant), then retry
```

**7.4 Save the Output**

At the end, you'll see output like:
```
Apply complete! Resources: 87 added, 0 changed, 0 destroyed.

Outputs:
rds_endpoint = "bitcurrent-prod-db.xxxxx.eu-west-2.rds.amazonaws.com"
redis_endpoint = "bitcurrent-prod-redis.xxxxx.cache.amazonaws.com"
route53_nameservers = [
  "ns-123.awsdns-12.com",
  "ns-456.awsdns-34.net",
  "ns-789.awsdns-56.org",
  "ns-012.awsdns-78.co.uk"
]
```

**⚠️ WRITE DOWN THE 4 NAMESERVERS!** You'll need them next.

**✅ Infrastructure deployed!**

---

### STEP 8: Update Domain DNS (5 minutes + wait)

**8.1 Find Your Domain Registrar**

Where did you buy bitcurrent.co.uk? Common options:
- Namecheap
- GoDaddy
- 123-reg
- Google Domains
- Cloudflare

**8.2 Update Nameservers**

**If Namecheap:**
```
1. Login to Namecheap.com
2. Click "Domain List" → "Manage" next to bitcurrent.co.uk
3. Go to "Nameservers" section
4. Select "Custom DNS"
5. Enter the 4 AWS nameservers (from step 7.4)
6. Click the checkmark to save
```

**If GoDaddy:**
```
1. Login to GoDaddy.com
2. My Products → Domains
3. Click bitcurrent.co.uk → Manage DNS
4. Scroll to "Nameservers"
5. Click "Change"
6. Select "I'll use my own nameservers"
7. Enter the 4 AWS nameservers
8. Click "Save"
```

**If 123-reg:**
```
1. Login to 123-reg.co.uk
2. Manage domain → bitcurrent.co.uk
3. Manage → Nameservers
4. Enter the 4 AWS nameservers
5. Click "Update"
```

**8.3 Wait for DNS Propagation**

DNS changes take time to propagate globally.

**Check propagation:**
```bash
# Check current nameservers
dig NS bitcurrent.co.uk +short

# Once it shows AWS nameservers, you're good!
```

**Typical timing:**
- 15 minutes: Minimum
- 2-4 hours: Common
- 24-48 hours: Maximum

**Continue to next steps while waiting!**

---

### STEP 9: Configure Kubernetes Secrets (15 minutes)

**9.1 Get Database Connection String**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/infrastructure/terraform/environments/prod

# Get database endpoint
terraform output rds_endpoint
# Example output: bitcurrent-prod-db.xxxxx.eu-west-2.rds.amazonaws.com

# Get Redis endpoint
terraform output redis_endpoint
# Example output: bitcurrent-prod-redis.xxxxx.cache.amazonaws.com
```

**9.2 Create Secrets File**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Copy template
cp infrastructure/kubernetes/base/secrets.yaml.example infrastructure/kubernetes/base/secrets.yaml
```

**9.3 Edit Secrets File**
```bash
# Open in your editor
nano infrastructure/kubernetes/base/secrets.yaml

# Or use VS Code/Cursor
code infrastructure/kubernetes/base/secrets.yaml
```

**9.4 Fill in Values**

Replace these placeholders with real values:

```yaml
# Get database password from
cat .env.prod | grep DB_PASSWORD

# Build database URL:
database_url: "postgres://bitcurrent_admin:YOUR_DB_PASSWORD@RDS_ENDPOINT:5432/bitcurrent?sslmode=require"

# Example:
database_url: "postgres://bitcurrent_admin:Kj9mP2xL5nR8qW3vY7zT4bN6cM@bitcurrent-prod-db.xxxxx.eu-west-2.rds.amazonaws.com:5432/bitcurrent?sslmode=require"

# Redis URL:
redis_url: "rediss://REDIS_ENDPOINT:6379"

# Example:
redis_url: "rediss://bitcurrent-prod-redis.xxxxx.cache.amazonaws.com:6379"

# Copy from .env.prod:
jwt_secret: [From .env.prod]
encryption_key: [From .env.prod]
coingecko_api_key: [From .env.prod]
ethereum_rpc_url: [From .env.prod]
```

**9.5 Apply Secrets to Kubernetes**
```bash
# Make sure kubectl is configured
kubectl get nodes

# Apply secrets
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml

# Verify
kubectl get secrets -n bitcurrent-prod
```

**✅ Secrets configured!**

---

### STEP 10: Run Database Migrations (10 minutes)

**10.1 Get Database Details**
```bash
# From .env.prod
DB_PASS=$(cat .env.prod | grep DB_PASSWORD | cut -d= -f2)

# From Terraform output
cd infrastructure/terraform/environments/prod
DB_HOST=$(terraform output -raw rds_endpoint)

echo "Database: $DB_HOST"
echo "Password: $DB_PASS"
```

**10.2 Run Migrations**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Run migrations using Docker
docker run --rm \
  -v $(pwd)/infrastructure/migrations/postgresql:/migrations \
  migrate/migrate \
  -path=/migrations \
  -database "postgres://bitcurrent_admin:$DB_PASS@$DB_HOST:5432/bitcurrent?sslmode=require" \
  up

# Should see:
# 1/u init_schema (5.2s)
# 2/u market_data_timescale (1.1s)
# 3/u add_security_fields (0.3s)
# 4/u add_banking_tables (0.4s)
```

**If you get connection error:**
```bash
# The database might not be accessible from your local machine (security group)
# Alternative: Run migrations from a pod in Kubernetes

kubectl run -i --tty --rm debug --image=migrate/migrate --restart=Never -- \
  -path=/migrations \
  -database "postgres://bitcurrent_admin:$DB_PASS@$DB_HOST:5432/bitcurrent?sslmode=require" \
  up
```

**✅ Database initialized!**

---

### STEP 11: Deploy Application Services (15 minutes)

**11.1 Verify EKS Cluster**
```bash
kubectl get nodes

# Should show 3-6 nodes in Ready state
```

**11.2 Deploy with Helm**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Deploy BitCurrent platform
helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent \
  -f ./infrastructure/helm/values-prod.yaml \
  --namespace bitcurrent-prod \
  --create-namespace \
  --wait \
  --timeout 10m

# This will:
# - Create namespace
# - Deploy all services
# - Wait for them to be ready
```

**11.3 Monitor Deployment**
```bash
# Watch pods come online
kubectl get pods -n bitcurrent-prod -w

# Press Ctrl+C to stop watching when all are Running

# Check status
kubectl get all -n bitcurrent-prod
```

**You should see:**
- matching-engine: 2 pods Running
- api-gateway: 3 pods Running
- order-gateway: 2 pods Running
- ledger-service: 2 pods Running
- settlement-service: 2 pods Running
- market-data-service: 2 pods Running
- compliance-service: 2 pods Running

**✅ Services deployed!**

---

### STEP 12: Build and Deploy Frontend (15 minutes)

**12.1 Install Dependencies**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1/frontend

# Install packages
npm ci
```

**12.2 Build for Production**
```bash
# Build static site
npm run build

# Should create 'out' directory
ls -la out/
```

**12.3 Deploy to S3**
```bash
# Get S3 bucket name
cd ../infrastructure/terraform/environments/prod
S3_BUCKET=$(terraform output -raw frontend_s3_bucket)

echo "Deploying to: $S3_BUCKET"

# Sync to S3
aws s3 sync ../../../frontend/out/ s3://$S3_BUCKET/ --delete

# Set correct content types
aws s3 cp s3://$S3_BUCKET/ s3://$S3_BUCKET/ \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --metadata-directive REPLACE \
  --recursive
```

**12.4 Invalidate CloudFront Cache**
```bash
# Get CloudFront distribution ID
DIST_ID=$(terraform output -raw cloudfront_distribution_id)

echo "Invalidating CloudFront: $DIST_ID"

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*"

# Wait 5-10 minutes for invalidation to complete
```

**✅ Frontend deployed!**

---

### STEP 13: Verify Everything Works! (15 minutes)

**13.1 Check DNS (if propagated)**
```bash
# Check if DNS is working
dig bitcurrent.co.uk
dig api.bitcurrent.co.uk
dig www.bitcurrent.co.uk

# All should show AWS IPs
```

**13.2 Run Health Checks**
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Run automated health check
./infrastructure/scripts/health-check.sh bitcurrent-prod
```

**13.3 Test API Endpoints**
```bash
# Health check
curl https://api.bitcurrent.co.uk/health

# Should return: {"status":"healthy"}

# Markets endpoint
curl https://api.bitcurrent.co.uk/api/v1/markets

# Should return JSON with trading pairs
```

**13.4 Test Frontend**
```bash
# Open in browser
open https://bitcurrent.co.uk
```

**You should see:**
- ✅ BitCurrent homepage loads
- ✅ Can click "Sign Up"
- ✅ Can navigate to "/trade/BTC-GBP"
- ✅ Can see orderbook and chart
- ✅ SSL certificate is valid (green padlock)

---

## 🎉 SUCCESS!

**You now have BitCurrent Exchange live at:**
- 🌐 Frontend: https://bitcurrent.co.uk
- 🔌 API: https://api.bitcurrent.co.uk
- 📊 WebSocket: wss://ws.bitcurrent.co.uk

**Running on:**
- AWS EKS (Kubernetes)
- RDS PostgreSQL
- ElastiCache Redis
- MSK Kafka
- CloudFront CDN
- Route53 DNS

---

## 📊 What to Do Next

### Immediate:
1. **Test all user flows**
   - Create account
   - Login
   - View markets
   - Place test order

2. **Check monitoring**
   ```bash
   # Port-forward to Grafana
   kubectl port-forward -n bitcurrent-prod svc/grafana 3000:3000
   
   # Open: http://localhost:3000
   # Login: admin / prom-operator (default)
   ```

3. **Review logs**
   ```bash
   # Check service logs
   kubectl logs -n bitcurrent-prod deployment/api-gateway
   kubectl logs -n bitcurrent-prod deployment/matching-engine
   ```

### This Week:
1. Enable monitoring alerts (Slack webhooks)
2. Setup automated backups
3. Test disaster recovery procedure
4. Create operational runbook

### This Month:
1. Begin FCA application process
2. Contact ClearBank
3. Integrate Onfido (KYC)
4. Setup Chainalysis (AML)

---

## ❓ Troubleshooting

### "kubectl: command not found"
```bash
# Install kubectl
brew install kubectl
```

### "error: You must be logged in to the server"
```bash
# Reconfigure kubectl
aws eks update-kubeconfig --region eu-west-2 --name bitcurrent-prod
```

### "Pods stuck in Pending"
```bash
# Check pod events
kubectl describe pod [pod-name] -n bitcurrent-prod

# Common issues:
# - Insufficient resources (scale cluster)
# - Missing secrets (apply secrets.yaml)
```

### "Website not loading"
```bash
# Check if DNS propagated
dig bitcurrent.co.uk

# If not showing AWS IPs, wait longer (can take 24h)

# Check CloudFront distribution
aws cloudfront get-distribution --id [DIST_ID]
```

### "API returning 502 Bad Gateway"
```bash
# Check backend pods
kubectl get pods -n bitcurrent-prod

# Check logs
kubectl logs -n bitcurrent-prod deployment/api-gateway --tail=50
```

---

## 💰 Current Running Costs

After deployment, you're now paying:
```
EKS cluster: £70/month (control plane)
EC2 nodes: £300-800/month (3-6 nodes)
RDS PostgreSQL: £500-1,200/month
ElastiCache Redis: £150-300/month
MSK Kafka: £500-800/month
Load Balancers: £60/month
Data transfer: £50-200/month
──────────────────────────────────
TOTAL: £1,630-3,430/month (~£54-114/day)
```

**Cost optimization tips:**
1. Use Reserved Instances (save 40%)
2. Turn off staging when not needed
3. Right-size instances based on actual usage
4. Enable S3 lifecycle policies

---

## ✅ Checklist

Use this to track your progress:

- [ ] AWS account created
- [ ] MFA enabled on root account
- [ ] IAM admin user created
- [ ] AWS CLI installed and configured
- [ ] Application secrets generated
- [ ] Free API keys obtained
- [ ] Infrastructure deployed to AWS
- [ ] Domain nameservers updated
- [ ] DNS propagated
- [ ] Kubernetes secrets configured
- [ ] Database migrations completed
- [ ] Application services deployed
- [ ] Frontend built and deployed
- [ ] Health checks passing
- [ ] Can access https://bitcurrent.co.uk
- [ ] Can access https://api.bitcurrent.co.uk
- [ ] Can create account and login
- [ ] Monitoring dashboards accessible

---

**You did it! BitCurrent Exchange is LIVE! 🚀**


