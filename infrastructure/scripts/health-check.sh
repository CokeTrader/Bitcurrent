#!/bin/bash
# BitCurrent Exchange - Health Check Script

set -e

NAMESPACE=${1:-bitcurrent-prod}
TIMEOUT=300  # 5 minutes

echo "🏥 BitCurrent Health Check"
echo "Namespace: $NAMESPACE"
echo "========================================"

# Check kubectl connectivity
kubectl cluster-info || { echo "❌ kubectl not configured"; exit 1; }

echo ""
echo "1. Checking Pods..."
echo "-------------------"

TOTAL_PODS=$(kubectl get pods -n $NAMESPACE --no-headers | wc -l | tr -d ' ')
RUNNING_PODS=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase=Running --no-headers | wc -l | tr -d ' ')

echo "Pods: $RUNNING_PODS/$TOTAL_PODS running"

if [ "$RUNNING_PODS" != "$TOTAL_PODS" ]; then
  echo "⚠️  Not all pods are running:"
  kubectl get pods -n $NAMESPACE
  exit 1
fi

echo "✅ All pods running"

# Check specific deployments
DEPLOYMENTS=("matching-engine" "api-gateway" "ledger-service" "settlement-service")

for deployment in "${DEPLOYMENTS[@]}"; do
  READY=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  DESIRED=$(kubectl get deployment $deployment -n $NAMESPACE -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")
  
  if [ "$READY" == "$DESIRED" ] && [ "$READY" != "0" ]; then
    echo "✅ $deployment: $READY/$DESIRED ready"
  else
    echo "❌ $deployment: $READY/$DESIRED ready"
    exit 1
  fi
done

echo ""
echo "2. Checking Services..."
echo "-------------------"

SERVICES=$(kubectl get services -n $NAMESPACE --no-headers | wc -l | tr -d ' ')
echo "Services: $SERVICES configured"

# Check API Gateway service
API_ENDPOINT=$(kubectl get service api-gateway -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -z "$API_ENDPOINT" ]; then
  echo "⚠️  API Gateway LoadBalancer not ready"
else
  echo "✅ API Gateway endpoint: $API_ENDPOINT"
fi

echo ""
echo "3. Checking Health Endpoints..."
echo "-------------------"

# Port forward to API Gateway
API_POD=$(kubectl get pods -n $NAMESPACE -l app=api-gateway -o jsonpath='{.items[0].metadata.name}')

if [ -z "$API_POD" ]; then
  echo "❌ No API Gateway pod found"
  exit 1
fi

echo "Using pod: $API_POD"

kubectl port-forward -n $NAMESPACE pod/$API_POD 8888:8080 > /dev/null 2>&1 &
PF_PID=$!
sleep 5

# Health check
if curl -f http://localhost:8888/health > /dev/null 2>&1; then
  HEALTH_STATUS=$(curl -s http://localhost:8888/health | jq -r '.status' 2>/dev/null || echo "unknown")
  echo "✅ Health check: $HEALTH_STATUS"
else
  echo "❌ Health check failed"
  kill $PF_PID 2>/dev/null
  exit 1
fi

# Readiness check
if curl -f http://localhost:8888/ready > /dev/null 2>&1; then
  echo "✅ Readiness check passed"
else
  echo "❌ Readiness check failed"
  kill $PF_PID 2>/dev/null
  exit 1
fi

# Metrics check
if curl -f http://localhost:8888/metrics > /dev/null 2>&1; then
  echo "✅ Metrics endpoint accessible"
else
  echo "⚠️  Metrics endpoint not accessible"
fi

kill $PF_PID 2>/dev/null

echo ""
echo "4. Checking Database Connectivity..."
echo "-------------------"

# Test database connection through API
DB_CHECK=$(kubectl exec -n $NAMESPACE $API_POD -- wget -q -O- http://localhost:8080/ready 2>/dev/null || echo "")

if echo "$DB_CHECK" | grep -q "database.*up"; then
  echo "✅ Database connection verified"
else
  echo "⚠️  Database connection could not be verified"
fi

echo ""
echo "5. Checking Persistent Volumes..."
echo "-------------------"

PVC_COUNT=$(kubectl get pvc -n $NAMESPACE --no-headers | wc -l | tr -d ' ')
PVC_BOUND=$(kubectl get pvc -n $NAMESPACE --field-selector=status.phase=Bound --no-headers | wc -l | tr -d ' ')

echo "PVCs: $PVC_BOUND/$PVC_COUNT bound"

if [ "$PVC_BOUND" == "$PVC_COUNT" ]; then
  echo "✅ All persistent volumes bound"
else
  echo "⚠️  Some persistent volumes not bound"
fi

echo ""
echo "6. Checking Ingress..."
echo "-------------------"

INGRESS_COUNT=$(kubectl get ingress -n $NAMESPACE --no-headers | wc -l | tr -d ' ')
echo "Ingress resources: $INGRESS_COUNT"

if [ "$INGRESS_COUNT" -gt 0 ]; then
  kubectl get ingress -n $NAMESPACE
  echo "✅ Ingress configured"
fi

echo ""
echo "========================================"
echo "🎉 Health Check Summary"
echo "========================================"
echo "✅ All critical checks passed"
echo "✅ Platform is healthy and ready"
echo ""
echo "Status: HEALTHY"
echo "Timestamp: $(date)"



