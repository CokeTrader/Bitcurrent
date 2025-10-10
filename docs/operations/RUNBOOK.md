# BitCurrent Exchange - Operations Runbook

**Version**: 1.0  
**Last Updated**: October 10, 2025  
**On-Call Team**: DevOps, Engineering, Security

---

## Emergency Contacts

| Role | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| **On-Call Engineer** | +44 XXXX XXXXXX | +44 XXXX XXXXXX | CTO |
| **Security Team** | security@bitcurrent.co.uk | - | CISO |
| **Compliance Team** | compliance@bitcurrent.co.uk | - | CCO |
| **Management** | cto@bitcurrent.co.uk | - | CEO |

**PagerDuty**: https://bitcurrent.pagerduty.com  
**Slack**: #incidents channel  
**Status Page**: https://status.bitcurrent.co.uk

---

## Critical Alert Responses

### 🚨 CRITICAL: Matching Engine Down

**Alert**: `MatchingEngineDown`  
**Impact**: Trading halted, users cannot place orders  
**SLA**: Restore within 5 minutes

**Immediate Actions**:
```bash
# 1. Check matching engine status
kubectl get pods -n bitcurrent-prod | grep matching-engine

# 2. Check logs
kubectl logs -f deployment/matching-engine -n bitcurrent-prod --tail=100

# 3. Check metrics
curl http://matching-engine:9091/metrics

# 4. Restart if crashed
kubectl rollout restart deployment/matching-engine -n bitcurrent-prod

# 5. Restore from snapshot if needed
kubectl exec matching-engine-pod -- ls /data/snapshots
```

**Root Cause Investigation**:
- Check Prometheus for latency spikes before crash
- Review error logs in last 30 minutes
- Check resource usage (CPU, memory)
- Verify database connectivity
- Check Kafka connectivity

**Prevention**:
- Implement automatic restart on failure
- Add circuit breaker for database
- Increase resource limits if OOM
- Review and optimize matching logic

---

### 🚨 CRITICAL: PostgreSQL Down

**Alert**: `PostgreSQLDown`  
**Impact**: All services affected, platform unavailable  
**SLA**: Restore within 10 minutes

**Immediate Actions**:
```bash
# 1. Check database pod
kubectl get pods -n bitcurrent-prod | grep postgres

# 2. Check replica status
kubectl exec postgres-primary -- psql -U bitcurrent -c "SELECT * FROM pg_stat_replication;"

# 3. Check disk space
kubectl exec postgres-primary -- df -h

# 4. Promote replica if primary failed
kubectl exec postgres-replica-1 -- /scripts/promote.sh

# 5. Update DNS/service endpoint
kubectl patch service postgres-primary -p '{"spec":{"selector":{"role":"replica-1"}}}'
```

**Recovery Steps**:
1. Identify failure cause (disk, memory, corruption)
2. If disk full: Expand volume or clean up
3. If corrupted: Restore from backup
4. If hardware: Failover to replica
5. Run integrity check after restore

**Post-Incident**:
- Review backup strategy
- Test failover procedure
- Update monitoring thresholds
- Document lessons learned

---

### ⚠️  WARNING: Low Hot Wallet Balance

**Alert**: `LowHotWalletBalance`  
**Impact**: Withdrawals may fail, user experience degraded  
**SLA**: Rebalance within 1 hour

**Actions**:
```bash
# 1. Check current balance
curl http://settlement-service:8083/internal/v1/wallets/hot/balance

# 2. Check pending withdrawals
psql -U bitcurrent -d bitcurrent -c "SELECT COUNT(*), SUM(amount) FROM withdrawals WHERE status = 'pending' AND currency = 'BTC';"

# 3. Calculate required balance
# pending_withdrawals + 24h_buffer

# 4. Initiate cold → hot transfer
# This requires multi-sig approval (5-of-9)
./scripts/initiate-rebalancing.sh --from=cold --to=hot --amount=2.0 --currency=BTC

# 5. Collect signatures (5 of 9 required)
./scripts/sign-rebalancing.sh --tx-id={tx_id} --signer=1

# 6. Broadcast once threshold met
./scripts/broadcast-rebalancing.sh --tx-id={tx_id}

# 7. Monitor confirmation
./scripts/monitor-rebalancing.sh --tx-id={tx_id}
```

**Prevention**:
- Automated daily rebalancing
- Increase hot wallet threshold
- Predictive analytics for withdrawal patterns

---

### ⚠️  WARNING: High Failed Login Rate

**Alert**: `HighFailedLoginRate`  
**Impact**: Possible brute force attack  
**SLA**: Investigate within 15 minutes

**Actions**:
```bash
# 1. Check failed login attempts by IP
psql -U bitcurrent -d bitcurrent -c "
  SELECT ip_address, COUNT(*), MAX(created_at)
  FROM security_events
  WHERE event_type = 'login_failed'
    AND created_at > NOW() - INTERVAL '15 minutes'
  GROUP BY ip_address
  ORDER BY COUNT(*) DESC
  LIMIT 20;
"

# 2. Check if specific users targeted
psql -U bitcurrent -d bitcurrent -c "
  SELECT user_id, email, COUNT(*)
  FROM security_events se
  JOIN users u ON se.user_id = u.id
  WHERE event_type = 'login_failed'
    AND created_at > NOW() - INTERVAL '15 minutes'
  GROUP BY user_id, email
  ORDER BY COUNT(*) DESC
  LIMIT 10;
"

# 3. Block attacking IPs (if confirmed attack)
redis-cli SADD blocked_ips "192.168.1.100"

# 4. Enable rate limiting if not already active
kubectl set env deployment/api-gateway RATE_LIMIT_ENABLED=true

# 5. Notify affected users (if targeted)
./scripts/send-security-alert.sh --user-id={user_id}
```

**Investigation**:
- Analyze attack pattern
- Check if credentials leaked
- Review WAF logs (Cloudflare)
- Coordinate with security team

---

### ⚠️  WARNING: Reconciliation Discrepancy

**Alert**: `ReconciliationDiscrepancy`  
**Impact**: Potential accounting error  
**SLA**: Investigate immediately, resolve within 4 hours

**Actions**:
```bash
# 1. Run manual reconciliation
curl -X POST http://settlement-service:8083/internal/v1/reconciliation/run

# 2. Review discrepancy details
psql -U bitcurrent -d bitcurrent -c "
  WITH wallet_balances AS (
    SELECT currency, SUM(balance) as total
    FROM wallets
    GROUP BY currency
  ),
  ledger_balances AS (
    SELECT currency, SUM(amount) as total
    FROM ledger_entries
    GROUP BY currency
  )
  SELECT w.currency, w.total as wallet, l.total as ledger, (w.total - l.total) as difference
  FROM wallet_balances w
  LEFT JOIN ledger_balances l ON w.currency = l.currency;
"

# 3. Check for missing ledger entries
psql -U bitcurrent -d bitcurrent -c "
  SELECT * FROM deposits
  WHERE status = 'credited'
    AND id NOT IN (SELECT reference_id FROM ledger_entries WHERE reference_type = 'deposit');
"

# 4. Fix discrepancies (with approval)
# Document all corrections
# Create manual ledger entries if needed
# Get approval from CFO/COO

# 5. Re-run reconciliation
curl -X POST http://settlement-service:8083/internal/v1/reconciliation/run
```

**Post-Resolution**:
- Document root cause
- Create ticket for permanent fix
- Update reconciliation logic if needed
- Review with finance team

---

## Common Operations

### Start Services

```bash
# Local development
make infra-up
make migrate-up
make db-seed

# Production
kubectl apply -f infrastructure/kubernetes/prod/
helm upgrade bitcurrent ./infrastructure/helm/bitcurrent -f values-prod.yaml
```

### Deploy New Version

```bash
# Staging
make deploy-staging

# Production (requires approval)
make deploy-prod

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n bitcurrent-prod
```

### Database Operations

```bash
# Backup
make db-backup

# Restore
make db-restore

# Run migrations
make migrate-up

# Rollback migration
make migrate-down

# Connect to database
make db-shell
```

### View Logs

```bash
# All services
make logs

# Specific service
kubectl logs -f deployment/api-gateway -n bitcurrent-prod

# Search logs
kubectl logs deployment/api-gateway -n bitcurrent-prod | grep ERROR

# Last 100 lines
kubectl logs deployment/api-gateway -n bitcurrent-prod --tail=100
```

### Metrics and Monitoring

```bash
# Check service health
curl http://api-gateway:8080/health

# View Prometheus targets
open http://prometheus:9090/targets

# View Grafana dashboards
open http://grafana:3001

# Query metrics directly
curl http://matching-engine:9091/metrics
```

---

## Maintenance Procedures

### Daily Tasks (Automated)
- [ ] Database backup (3 AM UTC)
- [ ] Reconciliation (3 AM UTC)
- [ ] Log rotation
- [ ] Cleanup old sessions
- [ ] Update market data aggregates

### Weekly Tasks
- [ ] Review monitoring alerts
- [ ] Check error rates
- [ ] Review pending compliance cases
- [ ] Backup verification
- [ ] Performance review

### Monthly Tasks
- [ ] Security review
- [ ] Dependency updates
- [ ] Cost optimization review
- [ ] Disaster recovery drill
- [ ] Proof of reserves publication

### Quarterly Tasks
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Compliance audit
- [ ] Infrastructure review
- [ ] Team training

---

## Troubleshooting Guide

### Service Won't Start

**Symptoms**: Pod in CrashLoopBackOff  
**Common Causes**:
1. Configuration error
2. Database connection failed
3. Missing environment variables
4. Port conflict

**Debug**:
```bash
kubectl describe pod {pod-name}
kubectl logs {pod-name} --previous
kubectl get events --sort-by='.lastTimestamp'
```

### High Latency

**Symptoms**: Slow API responses  
**Common Causes**:
1. Database slow queries
2. Redis connection issues
3. High CPU usage
4. Network latency

**Debug**:
```bash
# Check slow queries
psql -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check Redis
redis-cli --latency

# Check service resources
kubectl top pods
```

### Memory Leak

**Symptoms**: OOMKilled, increasing memory usage  
**Debug**:
```bash
# Get memory profile
curl http://service:6060/debug/pprof/heap > heap.prof
go tool pprof heap.prof

# Check for goroutine leak
curl http://service:6060/debug/pprof/goroutine
```

---

## Disaster Recovery

### Scenario: Complete Infrastructure Failure

**Recovery Time Objective (RTO)**: 2 hours  
**Recovery Point Objective (RPO)**: 15 minutes

**Steps**:
1. Activate DR environment
2. Restore database from latest backup
3. Deploy services to DR cluster
4. Update DNS to DR environment
5. Verify all services healthy
6. Resume trading

**Checklist**:
- [ ] DR environment exists and ready
- [ ] Latest backup available (< 15 min old)
- [ ] DNS TTL set to 5 minutes
- [ ] Team trained on DR procedure
- [ ] DR drill conducted quarterly

---

## Monitoring Dashboards

### Grafana Dashboards

1. **Trading Overview** - http://grafana:3001/d/trading-overview
   - Trading volume, latency, orderbook depth
   - Active orders, trade distribution
   - Buy/sell balance

2. **System Health** - http://grafana:3001/d/system-health
   - Service uptime, CPU, memory
   - Database connections, Redis usage
   - Kafka lag, error rates

3. **Business Metrics** - http://grafana:3001/d/business-metrics
   - User growth, active traders
   - Revenue, trading volume
   - KYC status, deposit/withdrawal activity

4. **Security Dashboard** - http://grafana:3001/d/security
   - Failed logins, security events
   - 2FA adoption, API key usage
   - Suspicious activity

### Prometheus Queries

**Check service health**:
```promql
up{job="api-gateway"}
```

**Trading volume last hour**:
```promql
sum(increase(matching_engine_trades_executed_total[1h]))
```

**P99 latency**:
```promql
histogram_quantile(0.99, matching_engine_order_latency_seconds_bucket)
```

**Active users**:
```promql
count(count by (user_id) (rate(http_requests_total[24h]) > 0))
```

---

## Escalation Procedures

### Severity Levels

**P0 - Critical** (Immediate response):
- Platform down
- Matching engine failure
- Database failure
- Security breach
- **Response Time**: 5 minutes
- **Resolution Time**: 1 hour

**P1 - High** (Urgent):
- Service degradation
- High error rates
- Payment processing issues
- **Response Time**: 15 minutes
- **Resolution Time**: 4 hours

**P2 - Medium**:
- Performance issues
- Non-critical bugs
- **Response Time**: 1 hour
- **Resolution Time**: 24 hours

**P3 - Low**:
- Minor issues
- Feature requests
- **Response Time**: 24 hours
- **Resolution Time**: 1 week

### Escalation Path

```
1. On-Call Engineer (first responder)
   ↓ (if unresolved in 30 min)
2. Engineering Lead
   ↓ (if unresolved in 1 hour)
3. CTO
   ↓ (if business impact)
4. CEO
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-10 | 1.0 | Initial runbook creation |

---

**Note**: This runbook should be reviewed and updated monthly.



