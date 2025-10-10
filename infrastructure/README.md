# BitCurrent Infrastructure

Infrastructure as Code (IaC) for BitCurrent Exchange deployment.

## Components

### Terraform
AWS infrastructure provisioning:
- VPC and networking
- EKS Kubernetes cluster
- RDS PostgreSQL
- ElastiCache Redis
- MSK (Managed Kafka)
- Route53 DNS
- CloudFront CDN
- S3 storage

### Kubernetes
Service deployments and configuration:
- Base manifests
- Environment overlays (dev, staging, prod)
- ConfigMaps and Secrets
- Service definitions
- Ingress rules

### Helm
Packaged Kubernetes applications:
- BitCurrent Exchange chart
- Environment-specific values
- Dependency management

### Monitoring
Observability stack:
- Prometheus configuration
- Grafana dashboards
- Alert rules

## Directory Structure

```
infrastructure/
├── terraform/
│   ├── modules/           # Reusable Terraform modules
│   │   ├── vpc/
│   │   ├── eks/
│   │   ├── rds/
│   │   └── ...
│   └── environments/      # Environment-specific configs
│       ├── dev/
│       ├── staging/
│       └── prod/
├── kubernetes/
│   ├── base/             # Base Kubernetes manifests
│   └── overlays/         # Kustomize overlays
│       ├── dev/
│       ├── staging/
│       └── prod/
├── helm/
│   └── bitcurrent/       # Helm chart
│       ├── templates/
│       ├── values.yaml
│       └── Chart.yaml
└── monitoring/
    ├── prometheus.yml
    └── grafana/
        ├── dashboards/
        └── datasources/
```

## Prerequisites

- AWS CLI configured
- Terraform >= 1.5.0
- kubectl >= 1.28
- Helm >= 3.13
- AWS account with appropriate permissions

## Getting Started

### 1. Initialize Terraform

```bash
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### 2. Configure kubectl

```bash
aws eks update-kubeconfig --region eu-west-2 --name bitcurrent-dev
kubectl get nodes
```

### 3. Deploy with Helm

```bash
cd infrastructure/helm
helm install bitcurrent ./bitcurrent -f values-dev.yaml
```

## Environments

### Development
- Single-AZ deployment
- Smaller instance sizes
- No high availability
- Cost-optimized

### Staging
- Multi-AZ deployment
- Production-like configuration
- Testing and validation

### Production
- Multi-AZ with auto-scaling
- High availability
- Disaster recovery
- Performance-optimized

## Deployment

See `MANUAL_SETUP_TASKS.md` in the root directory for required manual setup steps.

### Development Environment
```bash
make deploy-dev
```

### Production Environment
```bash
make deploy-prod
```

## Monitoring

Access monitoring dashboards:
- Grafana: https://grafana.bitcurrent.co.uk
- Prometheus: https://prometheus.bitcurrent.co.uk
- Jaeger: https://jaeger.bitcurrent.co.uk

## Backup & Disaster Recovery

- Automated daily backups to S3
- Cross-region replication
- Point-in-time recovery for databases
- Quarterly DR drills

## Security

- All infrastructure encrypted at rest
- TLS 1.3 for all connections
- VPC with private subnets
- Security groups with least privilege
- AWS Secrets Manager for credentials
- Regular security audits

## Cost Optimization

- Auto-scaling for variable workloads
- Spot instances where appropriate
- S3 lifecycle policies
- Reserved instances for predictable workloads
- Regular cost reviews

## Troubleshooting

See `docs/operations/troubleshooting.md` for common issues and solutions.



