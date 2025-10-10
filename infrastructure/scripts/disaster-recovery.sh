#!/bin/bash
# BitCurrent Exchange - Disaster Recovery Script

set -e

RECOVERY_TYPE=${1:-full}  # full, database, services
REGION="eu-west-2"

echo "🚨 BitCurrent Disaster Recovery"
echo "Recovery Type: $RECOVERY_TYPE"
echo "========================================"

case $RECOVERY_TYPE in
  "full")
    echo "Full infrastructure recovery initiated..."
    
    # Step 1: Verify AWS access
    echo "Step 1: Verifying AWS access..."
    aws sts get-caller-identity || { echo "❌ AWS access failed"; exit 1; }
    echo "✅ AWS access verified"
    
    # Step 2: Restore Terraform infrastructure
    echo ""
    echo "Step 2: Restoring infrastructure with Terraform..."
    cd infrastructure/terraform/environments/prod
    terraform init
    terraform apply -auto-approve
    echo "✅ Infrastructure restored"
    
    # Step 3: Restore database
    echo ""
    echo "Step 3: Restoring database from latest backup..."
    
    LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
      --db-instance-identifier bitcurrent-prod-db \
      --query 'reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[0].DBSnapshotIdentifier' \
      --output text)
    
    echo "Latest snapshot: $LATEST_SNAPSHOT"
    
    aws rds restore-db-instance-from-db-snapshot \
      --db-instance-identifier bitcurrent-prod-db \
      --db-snapshot-identifier $LATEST_SNAPSHOT \
      --db-instance-class db.r6i.4xlarge \
      --multi-az \
      --publicly-accessible false
    
    echo "⏳ Waiting for database to be available..."
    aws rds wait db-instance-available --db-instance-identifier bitcurrent-prod-db
    echo "✅ Database restored"
    
    # Step 4: Configure kubectl
    echo ""
    echo "Step 4: Configuring kubectl..."
    aws eks update-kubeconfig --region $REGION --name bitcurrent-prod
    echo "✅ kubectl configured"
    
    # Step 5: Deploy services
    echo ""
    echo "Step 5: Deploying services with Helm..."
    helm upgrade --install bitcurrent ./infrastructure/helm/bitcurrent \
      -f ./infrastructure/helm/values-prod.yaml \
      --namespace bitcurrent-prod \
      --create-namespace \
      --wait \
      --timeout 15m
    echo "✅ Services deployed"
    
    # Step 6: Verify health
    echo ""
    echo "Step 6: Verifying system health..."
    ./infrastructure/scripts/health-check.sh
    
    echo ""
    echo "🎉 Full disaster recovery completed!"
    ;;
    
  "database")
    echo "Database-only recovery initiated..."
    
    # List available snapshots
    echo "Available snapshots:"
    aws rds describe-db-snapshots \
      --db-instance-identifier bitcurrent-prod-db \
      --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
      --output table | head -20
    
    echo ""
    read -p "Enter snapshot identifier to restore: " SNAPSHOT_ID
    
    if [ -z "$SNAPSHOT_ID" ]; then
      echo "❌ No snapshot selected"
      exit 1
    fi
    
    echo "⚠️  This will replace the current database!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
      echo "Cancelled"
      exit 1
    fi
    
    # Create final backup before restore
    echo "Creating safety backup..."
    aws rds create-db-snapshot \
      --db-instance-identifier bitcurrent-prod-db \
      --db-snapshot-identifier bitcurrent-prod-db-pre-restore-$(date +%Y%m%d-%H%M%S)
    
    # Restore
    echo "Restoring database..."
    aws rds restore-db-instance-from-db-snapshot \
      --db-instance-identifier bitcurrent-prod-db-restored \
      --db-snapshot-identifier $SNAPSHOT_ID
    
    echo "⏳ Waiting for restore to complete..."
    aws rds wait db-instance-available --db-instance-identifier bitcurrent-prod-db-restored
    
    echo "✅ Database restored to new instance: bitcurrent-prod-db-restored"
    echo ""
    echo "Next steps:"
    echo "1. Verify data integrity"
    echo "2. Point services to new endpoint"
    echo "3. Delete old database instance"
    ;;
    
  "services")
    echo "Services-only recovery initiated..."
    
    # Re-deploy all services
    echo "Redeploying all services..."
    helm upgrade bitcurrent ./infrastructure/helm/bitcurrent \
      -f ./infrastructure/helm/values-prod.yaml \
      --namespace bitcurrent-prod \
      --wait \
      --timeout 15m
    
    echo "✅ Services redeployed"
    
    # Restart all pods
    echo "Restarting all pods..."
    kubectl rollout restart deployment -n bitcurrent-prod
    
    echo "✅ All pods restarted"
    ;;
    
  *)
    echo "Unknown recovery type: $RECOVERY_TYPE"
    echo "Valid options: full, database, services"
    exit 1
    ;;
esac

echo ""
echo "Recovery Type: $RECOVERY_TYPE - COMPLETED"
echo "Timestamp: $(date)"



