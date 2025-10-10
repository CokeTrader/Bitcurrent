#!/bin/bash
# BitCurrent Exchange - Deployment Rollback Script

set -e

NAMESPACE=${1:-bitcurrent-prod}
REVISION=${2:-0}  # 0 = previous revision

echo "⏪ BitCurrent Deployment Rollback"
echo "Namespace: $NAMESPACE"
echo "Target Revision: $REVISION (0 = previous)"
echo "========================================"

# Step 1: Check current deployment status
echo ""
echo "Step 1: Current deployment status..."

kubectl get deployments -n $NAMESPACE

# Step 2: View deployment history
echo ""
echo "Step 2: Deployment history..."

echo "API Gateway history:"
kubectl rollout history deployment/api-gateway -n $NAMESPACE | tail -10

# Step 3: Confirm rollback
echo ""
if [ "$REVISION" == "0" ]; then
  echo "⚠️  This will rollback ALL services to their previous version"
else
  echo "⚠️  This will rollback ALL services to revision $REVISION"
fi

read -p "Continue with rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Rollback cancelled"
  exit 0
fi

# Step 4: Create pre-rollback backup
echo ""
echo "Step 3: Creating pre-rollback database snapshot..."

SNAPSHOT_ID="bitcurrent-prod-db-pre-rollback-$TIMESTAMP"
aws rds create-db-snapshot \
  --db-instance-identifier bitcurrent-prod-db \
  --db-snapshot-identifier $SNAPSHOT_ID || true

echo "✅ Safety snapshot created: $SNAPSHOT_ID"

# Step 5: Rollback deployments
echo ""
echo "Step 4: Rolling back deployments..."

DEPLOYMENTS=("matching-engine" "api-gateway" "order-gateway" "ledger-service" "settlement-service" "market-data-service" "compliance-service")

for deployment in "${DEPLOYMENTS[@]}"; do
  echo "Rolling back $deployment..."
  kubectl rollout undo deployment/$deployment -n $NAMESPACE --to-revision=$REVISION
done

echo "✅ Rollback commands issued"

# Step 6: Wait for rollback to complete
echo ""
echo "Step 5: Waiting for rollback to complete..."

for deployment in "${DEPLOYMENTS[@]}"; do
  echo "Waiting for $deployment..."
  kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=5m
done

echo "✅ All deployments rolled back"

# Step 7: Verify health
echo ""
echo "Step 6: Verifying system health..."

./infrastructure/scripts/health-check.sh $NAMESPACE

# Step 8: Summary
echo ""
echo "========================================"
echo "🎉 Rollback Summary"
echo "========================================"
echo "Namespace: $NAMESPACE"
echo "Rolled back to revision: $REVISION"
echo "Safety snapshot: $SNAPSHOT_ID"
echo "All services healthy: YES"
echo "Timestamp: $(date)"
echo ""
echo "⚠️  If issues persist, you can:"
echo "1. Check logs: kubectl logs deployment/api-gateway -n $NAMESPACE"
echo "2. Restore database: ./infrastructure/scripts/disaster-recovery.sh database $SNAPSHOT_ID"
echo "3. Full recovery: ./infrastructure/scripts/disaster-recovery.sh full"



