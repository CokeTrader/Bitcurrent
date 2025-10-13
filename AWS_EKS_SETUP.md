# ☁️ AWS EKS Deployment Guide (Alternative to Railway)

**Note:** BitCurrent currently runs on Railway. Use this guide if scaling to Kubernetes.

---

## 🔧 Fix Outbound Traffic Issue

### Current Problem
**Cluster:** bc-starter-cluster  
**Security Group:** sg-0b64e04d54ea52f68  
**Issue:** Pods can't reach internet (no outbound rules)

### Solution

**1. Navigate to Security Group:**
```
AWS Console → VPC → Security Groups
Search: sg-0b64e04d54ea52f68
Click: bc-starter-cluster security group
```

**2. Add Outbound Rule:**
```
Tab: Outbound rules
Click: Edit outbound rules
Click: Add rule

Configuration:
- Type: All traffic
- Protocol: All
- Port range: All
- Destination: 0.0.0.0/0 (anywhere)
- Description: Allow all outbound traffic for cluster pods
```

**3. Save Rules:**
- Click: Save rules
- Wait: 1-2 minutes for propagation
- Test: Check pod connectivity

---

## 🚀 Full EKS Deployment (If Migrating from Railway)

### Prerequisites
- AWS CLI installed
- kubectl installed
- eksctl installed
- AWS credentials configured

### Step 1: Create EKS Cluster
```bash
eksctl create cluster \
  --name bitcurrent-production \
  --region eu-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed
```

### Step 2: Configure kubectl
```bash
aws eks update-kubeconfig \
  --region eu-west-2 \
  --name bitcurrent-production
```

### Step 3: Deploy Backend
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bitcurrent-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bitcurrent-backend
  template:
    metadata:
      labels:
        app: bitcurrent-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/coketrader/bitcurrent-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bitcurrent-secrets
              key: database-url
        - name: ALPACA_KEY_ID
          valueFrom:
            secretKeyRef:
              name: bitcurrent-secrets
              key: alpaca-key
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: bitcurrent-secrets
              key: stripe-key
```

### Step 4: Apply Deployment
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Step 5: Configure Secrets
```bash
kubectl create secret generic bitcurrent-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=alpaca-key=$ALPACA_KEY_ID \
  --from-literal=stripe-key=$STRIPE_SECRET_KEY
```

---

## 📊 Cost Comparison

### Railway (Current):
- **Cost:** ~$20-50/month
- **Pros:** Zero config, auto-deploy, simple
- **Cons:** Limited scaling, higher per-user cost at scale

### AWS EKS:
- **Cost:** ~$72/month (cluster) + ~$30-100/month (nodes)
- **Pros:** Unlimited scaling, full control, cheaper at scale
- **Cons:** Complex setup, requires DevOps knowledge

### Recommendation:
- **0-1000 users:** Stay on Railway (simpler)
- **1000-10000 users:** Consider EKS (cost-effective)
- **10000+ users:** Definitely EKS (necessary for scale)

---

## 🔐 Security Group Configuration

### Required Rules for BitCurrent:

**Inbound:**
```
Port 443 (HTTPS): 0.0.0.0/0 → For web traffic
Port 80 (HTTP): 0.0.0.0/0 → Redirect to HTTPS
Port 3001 (Backend API): VPC only → Internal only
Port 5432 (PostgreSQL): VPC only → Database access
```

**Outbound:**
```
All traffic: 0.0.0.0/0 → Required for:
  - Alpaca API calls
  - Stripe API calls
  - External services
  - Package downloads
  - DNS resolution
```

---

## 🎯 Migration Checklist (When Scaling)

- [ ] Create EKS cluster
- [ ] Configure security groups (with outbound rules!)
- [ ] Set up RDS for PostgreSQL
- [ ] Deploy backend to EKS
- [ ] Set up load balancer
- [ ] Configure autoscaling
- [ ] Set up CloudWatch monitoring
- [ ] Configure backups
- [ ] Update DNS to point to EKS load balancer
- [ ] Test complete flow
- [ ] Monitor for 24 hours
- [ ] Decommission Railway

---

**Current Status:** Not urgent (Railway working fine)  
**When Needed:** Scale plan ready for 1000+ users  
**Priority:** Document now, implement when needed

✅ **Security group fix documented - ready when you need EKS!**


