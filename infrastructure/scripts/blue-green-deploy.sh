#!/bin/bash
# BitCurrent Exchange - Blue-Green Deployment Script

set -e

VERSION=${1}
NAMESPACE="bitcurrent-prod"
TIMEOUT="10m"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 v1.0.1"
  exit 1
fi

echo "🔵🟢 Starting Blue-Green Deployment"
echo "Version: $VERSION"
echo "Namespace: $NAMESPACE"
echo "========================================"

# Step 1: Deploy green environment
echo ""
echo "Step 1: Deploying GREEN environment..."

# Create green namespace if it doesn't exist
kubectl create namespace ${NAMESPACE}-green --dry-run=client -o yaml | kubectl apply -f -

# Deploy to green with new version
helm upgrade --install bitcurrent-green ./infrastructure/helm/bitcurrent \
  -f ./infrastructure/helm/values-prod.yaml \
  --set image.tag=$VERSION \
  --set nameOverride="green" \
  --namespace ${NAMESPACE}-green \
  --wait \
  --timeout $TIMEOUT

echo "✅ GREEN environment deployed"

# Step 2: Run smoke tests on green
echo ""
echo "Step 2: Running smoke tests on GREEN environment..."

GREEN_API_POD=$(kubectl get pods -n ${NAMESPACE}-green -l app=api-gateway -o jsonpath='{.items[0].metadata.name}')

# Port forward to green API for testing
kubectl port-forward -n ${NAMESPACE}-green pod/$GREEN_API_POD 9999:8080 &
PF_PID=$!
sleep 5

# Run smoke tests
if curl -f http://localhost:9999/health > /dev/null 2>&1; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed"
  kill $PF_PID 2>/dev/null
  exit 1
fi

if curl -f http://localhost:9999/api/v1/markets > /dev/null 2>&1; then
  echo "✅ Markets API passed"
else
  echo "❌ Markets API failed"
  kill $PF_PID 2>/dev/null
  exit 1
fi

kill $PF_PID 2>/dev/null
echo "✅ All smoke tests passed on GREEN"

# Step 3: Switch traffic to green
echo ""
echo "Step 3: Switching traffic from BLUE to GREEN..."
read -p "Continue with traffic switch? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Deployment cancelled. GREEN environment still running for manual testing."
  echo "To delete: kubectl delete namespace ${NAMESPACE}-green"
  exit 1
fi

# Update service selectors to point to green
kubectl patch service api-gateway -n $NAMESPACE \
  -p '{"spec":{"selector":{"deployment":"green"}}}'

echo "✅ Traffic switched to GREEN environment"

# Step 4: Monitor for 5 minutes
echo ""
echo "Step 4: Monitoring GREEN environment for 5 minutes..."
echo "Watching for errors or issues..."

for i in {1..10}; do
  echo "Check $i/10..."
  
  # Check pod health
  UNHEALTHY=$(kubectl get pods -n ${NAMESPACE}-green -o json | jq -r '.items[] | select(.status.phase != "Running") | .metadata.name')
  
  if [ ! -z "$UNHEALTHY" ]; then
    echo "❌ Unhealthy pods detected: $UNHEALTHY"
    echo "Rolling back..."
    
    # Switch back to blue
    kubectl patch service api-gateway -n $NAMESPACE \
      -p '{"spec":{"selector":{"deployment":"blue"}}}'
    
    echo "⚠️  Rolled back to BLUE environment"
    exit 1
  fi
  
  sleep 30
done

echo "✅ GREEN environment stable"

# Step 5: Promote green to blue
echo ""
echo "Step 5: Promoting GREEN to BLUE..."

# Delete old blue environment
kubectl delete namespace ${NAMESPACE}-blue --ignore-not-found=true

# Rename current prod to blue
kubectl label namespace $NAMESPACE deployment=blue --overwrite

# Rename green to prod
kubectl label namespace ${NAMESPACE}-green deployment=prod --overwrite

# Update main deployment
helm upgrade bitcurrent ./infrastructure/helm/bitcurrent \
  -f ./infrastructure/helm/values-prod.yaml \
  --set image.tag=$VERSION \
  --namespace $NAMESPACE \
  --wait

echo "✅ GREEN promoted to production"
echo "✅ Old BLUE environment deleted"

# Step 6: Cleanup
echo ""
echo "Step 6: Cleanup..."
kubectl delete namespace ${NAMESPACE}-green

echo ""
echo "🎉 Blue-Green deployment completed successfully!"
echo "Version $VERSION is now live in production"



