#!/bin/bash

# BitCurrent Production Deployment Script
# This script deploys frontend and backend to bitcurrent.co.uk

set -e  # Exit on error

echo "🚀 BitCurrent Production Deployment"
echo "===================================="
echo ""

# Configuration
ECR_REGISTRY="${ECR_REGISTRY:-YOUR_ECR_URL}"
AWS_REGION="${AWS_REGION:-eu-west-2}"
NAMESPACE="bitcurrent"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}➜${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI."
    exit 1
fi

print_success "All prerequisites met"

# Step 2: Login to ECR
print_step "Logging into AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_REGISTRY
print_success "Logged into ECR"

# Step 3: Build and deploy frontend
print_step "Building frontend..."
cd frontend

# Build Next.js app
npm run build
print_success "Frontend built"

# Build Docker image
print_step "Building frontend Docker image..."
docker build -t bitcurrent-frontend:latest .
docker tag bitcurrent-frontend:latest $ECR_REGISTRY/bitcurrent-frontend:latest
print_success "Frontend Docker image built"

# Push to ECR
print_step "Pushing frontend to ECR..."
docker push $ECR_REGISTRY/bitcurrent-frontend:latest
print_success "Frontend pushed to ECR"

# Update Kubernetes
print_step "Deploying frontend to Kubernetes..."
kubectl rollout restart deployment/frontend -n $NAMESPACE
kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=5m
print_success "Frontend deployed"

cd ..

# Step 4: Build and deploy API Gateway
print_step "Building API Gateway..."
cd services/api-gateway

# Build Go binary
go build -o main ./cmd
print_success "API Gateway built"

# Build Docker image
print_step "Building API Gateway Docker image..."
docker build -t bitcurrent-api-gateway:latest .
docker tag bitcurrent-api-gateway:latest $ECR_REGISTRY/bitcurrent-api-gateway:latest
print_success "API Gateway Docker image built"

# Push to ECR
print_step "Pushing API Gateway to ECR..."
docker push $ECR_REGISTRY/bitcurrent-api-gateway:latest
print_success "API Gateway pushed to ECR"

# Update Kubernetes
print_step "Deploying API Gateway to Kubernetes..."
kubectl rollout restart deployment/api-gateway -n $NAMESPACE
kubectl rollout status deployment/api-gateway -n $NAMESPACE --timeout=5m
print_success "API Gateway deployed"

cd ../..

# Step 5: Run database migrations
print_step "Running database migrations..."
print_warning "Make sure you've backed up your database!"
read -p "Run migration on production DB? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Note: Update with your actual production DB credentials
    print_step "Running migration 000005_add_password_reset..."
    # psql $PRODUCTION_DATABASE_URL < migrations/postgresql/000005_add_password_reset.up.sql
    print_warning "Migration skipped - run manually with production DB credentials"
else
    print_warning "Migration skipped"
fi

# Step 6: Verification
echo ""
print_step "Verifying deployment..."

echo "Checking frontend..."
if curl -s -o /dev/null -w "%{http_code}" https://bitcurrent.co.uk | grep -q "200"; then
    print_success "Frontend is live!"
else
    print_warning "Frontend may still be deploying..."
fi

echo "Checking API..."
if curl -s -o /dev/null -w "%{http_code}" https://bitcurrent.co.uk/api/v1/health | grep -q "200"; then
    print_success "API is healthy!"
else
    print_warning "API may still be deploying..."
fi

# Final summary
echo ""
echo "===================================="
echo "🎉 Deployment Complete!"
echo "===================================="
echo ""
echo "Frontend: https://bitcurrent.co.uk"
echo "API:      https://bitcurrent.co.uk/api/v1"
echo "Health:   https://bitcurrent.co.uk/api/v1/health"
echo ""
echo "Monitor with:"
echo "  kubectl logs -f deployment/frontend -n $NAMESPACE"
echo "  kubectl logs -f deployment/api-gateway -n $NAMESPACE"
echo ""
print_success "All done! 🚀"









