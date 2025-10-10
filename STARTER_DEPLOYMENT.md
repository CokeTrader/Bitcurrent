# BitCurrent Starter Environment - Quick Deploy

**Cost**: £50-100/month (95% cheaper than production!)  
**Time to Deploy**: 20-30 minutes  
**Purpose**: Testing, development, demos, investor presentations

---

## 💰 Cost Comparison

| Resource | Production | Starter | Monthly Savings |
|----------|-----------|---------|-----------------|
| **EKS Nodes** | 3-10x c6i.2xlarge | 2x t3.medium | £450 → £50 |
| **RDS** | db.r6i.4xlarge multi-AZ | db.t3.micro single-AZ | £1,800 → £15 |
| **Redis** | 3x cache.r7g.xlarge | 1x cache.t3.micro | £450 → £10 |
| **Kafka** | 3x kafka.m5.2xlarge | 2x kafka.t3.small | £900 → £50 |
| **NAT Gateway** | 3x NAT | 1x NAT | £90 → £30 |
| **Total** | **~£2,500-3,500/mo** | **~£50-100/mo** | **Save £2,400+!** |

---

## ✨ What's Included (Same as Production!)

✅ Full Kubernetes cluster (EKS)  
✅ PostgreSQL database (RDS)  
✅ Redis cache (ElastiCache)  
✅ Kafka messaging (MSK)  
✅ All microservices can run  
✅ Complete trading platform  
✅ Real-time WebSocket  
✅ Monitoring & logs  

**The only difference**: Smaller instances, fewer replicas, single availability zone

---

## 🚀 Deploy Starter Environment

### Step 1: Generate Database Password
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Generate strong password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "Database Password: $DB_PASSWORD"

# Save it!
echo "STARTER_DB_PASSWORD=$DB_PASSWORD" >> .env.starter
```

### Step 2: Initialize Terraform
```bash
cd infrastructure/terraform/environments/starter

# Initialize
terraform init

# Should see: "Terraform has been successfully initialized!"
```

### Step 3: Review What Will Be Created
```bash
# Create tfvars file
cat > terraform.tfvars <<EOF
aws_region        = "eu-west-2"
database_password = "$DB_PASSWORD"
EOF

# Review plan
terraform plan

# Should see: Plan: ~90-100 resources to add
```

### Step 4: Deploy!
```bash
# Deploy (takes 20-30 minutes)
terraform apply

# Type: yes

# ☕ Grab coffee while AWS creates everything
```

### Step 5: Configure kubectl
```bash
# After apply completes, configure kubectl
aws eks update-kubeconfig --region eu-west-2 --name bitcurrent-starter

# Verify
kubectl get nodes

# Should see 2 nodes in Ready state
```

---

## 📊 What You Get

After deployment:

```
✅ EKS Cluster: bitcurrent-starter
✅ 2 Kubernetes nodes (t3.medium)
✅ PostgreSQL: db.t3.micro
✅ Redis: cache.t3.micro
✅ Kafka: 2x kafka.t3.small
✅ VPC with public/private subnets
✅ Security groups configured
```

---

## 🎯 Next Steps After Deployment

### 1. Deploy Application Services
```bash
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1

# Get database endpoint
cd infrastructure/terraform/environments/starter
DB_ENDPOINT=$(terraform output -raw rds_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)

# Create secrets
kubectl create namespace bitcurrent-starter

# Copy and edit secrets
cp infrastructure/kubernetes/base/secrets.yaml.example /tmp/secrets-starter.yaml

# Edit with starter endpoints
# Then apply:
kubectl apply -f /tmp/secrets-starter.yaml -n bitcurrent-starter
```

### 2. Run Database Migrations
```bash
DB_PASS=$(cat ../../.env.starter | grep STARTER_DB_PASSWORD | cut -d= -f2)

docker run --rm \
  -v $(pwd)/../../migrations/postgresql:/migrations \
  migrate/migrate \
  -path=/migrations \
  -database "postgres://bitcurrent_admin:$DB_PASS@$DB_ENDPOINT:5432/bitcurrent?sslmode=require" \
  up
```

### 3. Deploy Services with Helm
```bash
# Create starter values file
cat > infrastructure/helm/values-starter.yaml <<'EOF'
replicaCount:
  matchingEngine: 1
  apiGateway: 1
  orderGateway: 1
  ledgerService: 1
  settlementService: 1
  marketDataService: 1
  complianceService: 1

resources:
  matchingEngine:
    requests:
      memory: "256Mi"
      cpu: "250m"
  apiGateway:
    requests:
      memory: "128Mi"
      cpu: "100m"

image:
  tag: "latest"

environment: starter
EOF

# Deploy
helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent \
  -f ./infrastructure/helm/values-starter.yaml \
  --namespace bitcurrent-starter \
  --create-namespace \
  --wait
```

---

## 🔍 Performance Expectations

### Starter Environment:
- **Matching Engine**: ~10-50ms latency (vs <5ms in prod)
- **API Response**: ~50-200ms (vs <50ms in prod)
- **Concurrent Users**: ~50-100 (vs 10,000+ in prod)
- **Orders/sec**: ~100 (vs 50,000+ in prod)

**Perfect for**: Testing, development, demos, MVP validation

**NOT suitable for**: Production trading with real users/money

---

## 💡 Tips

### Reduce Costs Further:
```bash
# Stop when not in use (saves ~70%)
# Scale nodes to 0
kubectl scale deployment --all --replicas=0 -n bitcurrent-starter

# Stop RDS (billing pauses after 7 days)
aws rds stop-db-instance --db-instance-identifier bitcurrent-starter-db

# Restart when needed
aws rds start-db-instance --db-instance-identifier bitcurrent-starter-db
kubectl scale deployment --all --replicas=1 -n bitcurrent-starter
```

### Upgrade to Production Later:
```bash
# When ready for production:
# 1. Deploy production environment
# 2. Migrate data from starter to prod
# 3. Test production
# 4. Destroy starter environment
terraform destroy  # in starter directory
```

---

## ⚠️ Limitations (vs Production)

| Feature | Starter | Production |
|---------|---------|------------|
| High Availability | ❌ Single-AZ | ✅ Multi-AZ |
| Auto-failover | ❌ No | ✅ Yes |
| Performance | 🟡 Moderate | ✅ Excellent |
| Scalability | 🟡 Limited | ✅ Unlimited |
| Backup Retention | 7 days | 30 days |
| Monitoring | Basic | Advanced |

---

## 🎉 Success Checklist

After deployment, you should have:

- [ ] EKS cluster running (2 nodes)
- [ ] RDS database accessible
- [ ] Redis cache accessible  
- [ ] Kafka cluster running
- [ ] kubectl configured
- [ ] Can deploy applications
- [ ] Total cost: £50-100/month

---

## 📞 Troubleshooting

### "Not enough resources to schedule pods"
```bash
# Reduce resource requests in values-starter.yaml
# Or add one more node temporarily
```

### "Database connection refused"
```bash
# Check security group allows EKS → RDS
# Verify database is running
aws rds describe-db-instances --db-instance-identifier bitcurrent-starter-db
```

### "Kafka connection issues"
```bash
# MSK takes 15-20 minutes to fully initialize
# Wait longer and retry
```

---

## 🚀 Ready to Deploy!

Run these commands now:

```bash
# 1. Generate password
cd /Users/poseidon/Monivo/Bitcurrent/Bitcurrent1
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
echo "STARTER_DB_PASSWORD=$DB_PASSWORD" >> .env.starter

# 2. Deploy
cd infrastructure/terraform/environments/starter
terraform init

# 3. Create tfvars
echo "database_password = \"$DB_PASSWORD\"" > terraform.tfvars

# 4. Apply!
terraform apply
```

**Total time**: 30 minutes  
**Total cost**: £50-100/month  
**Result**: Full BitCurrent Exchange running! 🎉


