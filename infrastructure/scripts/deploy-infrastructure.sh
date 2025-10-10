#!/bin/bash
# BitCurrent Exchange - Infrastructure Deployment Script

set -e

ENVIRONMENT=${1:-prod}
REGION="eu-west-2"

echo "🚀 Deploying BitCurrent Infrastructure to $ENVIRONMENT"
echo "=================================================="

# Check prerequisites
command -v terraform >/dev/null 2>&1 || { echo "❌ terraform is required"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "❌ helm is required"; exit 1; }

echo "✅ Prerequisites check passed"

# Step 1: Create S3 bucket for Terraform state (if not exists)
echo ""
echo "Step 1: Creating Terraform state bucket..."
aws s3api head-bucket --bucket bitcurrent-terraform-state 2>/dev/null || \
  aws s3api create-bucket \
    --bucket bitcurrent-terraform-state \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION

aws s3api put-bucket-versioning \
  --bucket bitcurrent-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb describe-table --table-name bitcurrent-terraform-locks 2>/dev/null || \
  aws dynamodb create-table \
    --table-name bitcurrent-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

echo "✅ Terraform backend configured"

# Step 2: Deploy infrastructure with Terraform
echo ""
echo "Step 2: Deploying AWS infrastructure with Terraform..."
cd infrastructure/terraform/environments/$ENVIRONMENT

terraform init
terraform plan -out=tfplan

echo ""
read -p "Review the plan above. Continue with apply? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Deployment cancelled"
  exit 1
fi

terraform apply tfplan
echo "✅ Infrastructure deployed"

# Step 3: Configure kubectl for EKS
echo ""
echo "Step 3: Configuring kubectl for EKS..."
CLUSTER_NAME=$(terraform output -raw cluster_name)
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

kubectl get nodes
echo "✅ kubectl configured"

# Step 4: Install ingress-nginx
echo ""
echo "Step 4: Installing ingress-nginx controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --wait

echo "✅ Ingress controller installed"

# Step 5: Install cert-manager for SSL
echo ""
echo "Step 5: Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --wait

echo "✅ Cert-manager installed"

# Step 6: Create Kubernetes secrets
echo ""
echo "Step 6: Creating Kubernetes secrets..."
echo "⚠️  WARNING: Update secrets.yaml with actual values before deploying!"
echo "Current file is a template with placeholder values."
echo ""
read -p "Have you updated secrets.yaml with real values? (yes/no): " secrets_ready
if [ "$secrets_ready" != "yes" ]; then
  echo "❌ Please update infrastructure/kubernetes/base/secrets.yaml with actual secrets"
  echo "Then run: kubectl apply -f infrastructure/kubernetes/base/secrets.yaml"
  exit 1
fi

# kubectl apply -f ../../../kubernetes/base/secrets.yaml
echo "⚠️  Skipped secrets creation - apply manually after configuration"

# Step 7: Deploy services with Helm
echo ""
echo "Step 7: Deploying BitCurrent services..."
cd ../../../../

helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent \
  --namespace bitcurrent-prod \
  --create-namespace \
  --values ./infrastructure/helm/values-$ENVIRONMENT.yaml \
  --wait

echo "✅ Services deployed"

# Step 8: Verify deployment
echo ""
echo "Step 8: Verifying deployment..."
kubectl get pods -n bitcurrent-prod
kubectl get services -n bitcurrent-prod
kubectl get ingress -n bitcurrent-prod

echo ""
echo "🎉 Infrastructure deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update DNS nameservers for bitcurrent.co.uk"
echo "2. Verify SSL certificates are issued"
echo "3. Run database migrations"
echo "4. Load seed data (if needed)"
echo "5. Configure monitoring alerts"
echo ""
echo "Access points (once DNS propagates):"
echo "  Frontend: https://bitcurrent.co.uk"
echo "  API:      https://api.bitcurrent.co.uk"
echo "  WebSocket: wss://ws.bitcurrent.co.uk"
echo "  Grafana:  https://grafana.bitcurrent.co.uk"
echo ""



