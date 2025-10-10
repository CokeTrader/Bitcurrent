#!/bin/bash
# BitCurrent Exchange - Service Scaling Script

set -e

NAMESPACE=${1:-bitcurrent-prod}
ACTION=${2:-status}  # status, scale-up, scale-down, auto

echo "📊 BitCurrent Service Scaling"
echo "Namespace: $NAMESPACE"
echo "Action: $ACTION"
echo "========================================"

case $ACTION in
  "status")
    echo ""
    echo "Current Deployment Status:"
    echo "-------------------"
    kubectl get deployments -n $NAMESPACE -o custom-columns=\
NAME:.metadata.name,\
DESIRED:.spec.replicas,\
CURRENT:.status.replicas,\
READY:.status.readyReplicas,\
CPU:.spec.template.spec.containers[0].resources.requests.cpu,\
MEMORY:.spec.template.spec.containers[0].resources.requests.memory
    
    echo ""
    echo "Current HPA Status:"
    echo "-------------------"
    kubectl get hpa -n $NAMESPACE 2>/dev/null || echo "No HPA configured"
    
    echo ""
    echo "Current Resource Usage:"
    echo "-------------------"
    kubectl top pods -n $NAMESPACE 2>/dev/null || echo "Metrics server not available"
    ;;
    
  "scale-up")
    echo ""
    echo "Scaling UP services for high load..."
    
    kubectl scale deployment api-gateway --replicas=10 -n $NAMESPACE
    kubectl scale deployment ledger-service --replicas=5 -n $NAMESPACE
    kubectl scale deployment order-gateway --replicas=3 -n $NAMESPACE
    kubectl scale deployment settlement-service --replicas=3 -n $NAMESPACE
    kubectl scale deployment market-data-service --replicas=3 -n $NAMESPACE
    
    echo "✅ Services scaled up"
    echo "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=api-gateway -n $NAMESPACE --timeout=5m
    echo "✅ Scale-up completed"
    ;;
    
  "scale-down")
    echo ""
    echo "Scaling DOWN services for low load..."
    
    kubectl scale deployment api-gateway --replicas=3 -n $NAMESPACE
    kubectl scale deployment ledger-service --replicas=2 -n $NAMESPACE
    kubectl scale deployment order-gateway --replicas=1 -n $NAMESPACE
    kubectl scale deployment settlement-service --replicas=1 -n $NAMESPACE
    kubectl scale deployment market-data-service --replicas=1 -n $NAMESPACE
    
    echo "✅ Services scaled down"
    ;;
    
  "auto")
    echo ""
    echo "Enabling auto-scaling for all services..."
    
    # Apply HPA for each service
    cat <<EOF | kubectl apply -f -
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: $NAMESPACE
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
EOF

    echo "✅ Auto-scaling enabled"
    kubectl get hpa -n $NAMESPACE
    ;;
    
  *)
    echo "Unknown action: $ACTION"
    echo "Valid actions: status, scale-up, scale-down, auto"
    exit 1
    ;;
esac

echo ""
echo "Current state:"
kubectl get pods -n $NAMESPACE



