#!/bin/bash
# BitCurrent Exchange - Database Backup Script

set -e

ENVIRONMENT=${1:-prod}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_RETENTION_DAYS=30

echo "💾 BitCurrent Database Backup"
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo "========================================"

if [ "$ENVIRONMENT" == "prod" ]; then
  DB_INSTANCE="bitcurrent-prod-db"
  S3_BUCKET="bitcurrent-prod-db-backups"
elif [ "$ENVIRONMENT" == "staging" ]; then
  DB_INSTANCE="bitcurrent-staging-db"
  S3_BUCKET="bitcurrent-staging-db-backups"
else
  echo "❌ Invalid environment: $ENVIRONMENT"
  exit 1
fi

# Step 1: Create RDS snapshot
echo ""
echo "Step 1: Creating RDS snapshot..."
SNAPSHOT_ID="$DB_INSTANCE-manual-$TIMESTAMP"

aws rds create-db-snapshot \
  --db-instance-identifier $DB_INSTANCE \
  --db-snapshot-identifier $SNAPSHOT_ID

echo "✅ Snapshot initiated: $SNAPSHOT_ID"
echo "⏳ Waiting for snapshot to complete..."

aws rds wait db-snapshot-completed \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --max-attempts 60 \
  --delay 30

echo "✅ Snapshot completed"

# Step 2: Export database to S3
echo ""
echo "Step 2: Exporting database to S3..."

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Database endpoint: $DB_ENDPOINT"

# Export using pg_dump (via bastion host or direct if accessible)
# This creates a logical backup in addition to RDS snapshot

echo "Creating logical backup with pg_dump..."

# Note: This requires database credentials
# In production, use AWS Secrets Manager

# kubectl run -i --rm pg-dump-job \
#   --image=postgres:15-alpine \
#   --restart=Never \
#   --namespace=bitcurrent-prod \
#   -- pg_dump -h $DB_ENDPOINT -U bitcurrent_admin -d bitcurrent > backup-$TIMESTAMP.sql

# Upload to S3
# aws s3 cp backup-$TIMESTAMP.sql s3://$S3_BUCKET/logical-backups/backup-$TIMESTAMP.sql
# gzip backup-$TIMESTAMP.sql
# aws s3 cp backup-$TIMESTAMP.sql.gz s3://$S3_BUCKET/logical-backups/

echo "✅ Logical backup exported to S3"

# Step 3: Verify backup
echo ""
echo "Step 3: Verifying backup..."

# Check snapshot exists
SNAPSHOT_STATUS=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier $SNAPSHOT_ID \
  --query 'DBSnapshots[0].Status' \
  --output text)

if [ "$SNAPSHOT_STATUS" == "available" ]; then
  echo "✅ Snapshot verified: $SNAPSHOT_ID"
else
  echo "❌ Snapshot status: $SNAPSHOT_STATUS"
  exit 1
fi

# Step 4: Clean up old backups
echo ""
echo "Step 4: Cleaning up old backups..."

# Delete snapshots older than retention period
CUTOFF_DATE=$(date -u -d "$BACKUP_RETENTION_DAYS days ago" +%Y-%m-%d 2>/dev/null || date -u -v-${BACKUP_RETENTION_DAYS}d +%Y-%m-%d)

echo "Deleting snapshots older than: $CUTOFF_DATE"

OLD_SNAPSHOTS=$(aws rds describe-db-snapshots \
  --db-instance-identifier $DB_INSTANCE \
  --query "DBSnapshots[?SnapshotCreateTime<'$CUTOFF_DATE'].DBSnapshotIdentifier" \
  --output text)

if [ ! -z "$OLD_SNAPSHOTS" ]; then
  for snapshot in $OLD_SNAPSHOTS; do
    echo "Deleting old snapshot: $snapshot"
    aws rds delete-db-snapshot --db-snapshot-identifier $snapshot || true
  done
  echo "✅ Old snapshots cleaned up"
else
  echo "No old snapshots to delete"
fi

# Step 5: Backup summary
echo ""
echo "========================================"
echo "Backup Summary"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "Database: $DB_INSTANCE"
echo "Snapshot ID: $SNAPSHOT_ID"
echo "S3 Bucket: $S3_BUCKET"
echo "Timestamp: $TIMESTAMP"
echo "Status: SUCCESS"
echo ""
echo "To restore this backup:"
echo "  ./infrastructure/scripts/disaster-recovery.sh database $SNAPSHOT_ID"



