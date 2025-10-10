# BitCurrent Exchange - Production Infrastructure
# Terraform configuration for AWS deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "s3" {
    bucket         = "bitcurrent-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "bitcurrent-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "production"
      Project     = "bitcurrent-exchange"
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local variables
locals {
  cluster_name = "bitcurrent-prod"
  domain_name  = "bitcurrent.co.uk"
  
  common_tags = {
    Environment = "production"
    Project     = "bitcurrent-exchange"
  }

  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# VPC Module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "${local.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  database_subnets = var.database_subnet_cidrs

  enable_nat_gateway   = true
  single_nat_gateway   = false # High availability
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPN Gateway for secure access
  enable_vpn_gateway = true

  # Tags for Kubernetes
  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
  }

  tags = local.common_tags
}

# EKS Cluster Module
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.16.0"

  cluster_name    = local.cluster_name
  cluster_version = "1.28"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  # Cluster endpoint access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # OIDC provider for service accounts
  enable_irsa = true

  # EKS Managed Node Groups
  eks_managed_node_groups = {
    # General purpose nodes
    general = {
      name           = "general"
      desired_size   = 3
      min_size       = 3
      max_size       = 10
      instance_types = ["c6i.2xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = "production"
        NodeType    = "general"
      }

      taints = []
    }

    # Matching engine nodes (CPU optimized)
    matching = {
      name           = "matching"
      desired_size   = 2
      min_size       = 2
      max_size       = 4
      instance_types = ["c6i.8xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = "production"
        NodeType    = "matching-engine"
      }

      taints = [
        {
          key    = "dedicated"
          value  = "matching"
          effect = "NO_SCHEDULE"
        }
      ]
    }

    # Database workloads (memory optimized)
    database = {
      name           = "database"
      desired_size   = 2
      min_size       = 2
      max_size       = 4
      instance_types = ["r6i.2xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = "production"
        NodeType    = "database"
      }
    }
  }

  tags = local.common_tags
}

# RDS PostgreSQL
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.3.0"

  identifier = "${local.cluster_name}-db"

  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.r6i.4xlarge"

  allocated_storage     = 500
  max_allocated_storage = 2000
  storage_encrypted     = true
  storage_type          = "gp3"
  iops                  = 12000

  db_name  = "bitcurrent"
  username = "bitcurrent_admin"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security_group_rds.security_group_id]

  maintenance_window              = "sun:03:00-sun:04:00"
  backup_window                   = "02:00-03:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  backup_retention_period = 30
  skip_final_snapshot     = false
  deletion_protection     = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  create_db_parameter_group = true
  parameter_group_name      = "${local.cluster_name}-postgres15"
  
  parameters = [
    {
      name  = "max_connections"
      value = "1000"
    },
    {
      name  = "shared_buffers"
      value = "{DBInstanceClassMemory/4096}"
    }
  ]

  tags = local.common_tags
}

# ElastiCache Redis Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.cluster_name}-redis-subnet"
  subnet_ids = module.vpc.private_subnets

  tags = local.common_tags
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.cluster_name}-redis"
  description          = "Redis cluster for BitCurrent Exchange"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.r7g.xlarge"
  num_cache_clusters   = 3
  parameter_group_name = "default.redis7"

  port = 6379

  multi_az_enabled           = true
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [module.security_group_redis.security_group_id]

  snapshot_retention_limit = 7
  snapshot_window          = "02:00-03:00"
  maintenance_window       = "sun:03:00-sun:04:00"

  tags = local.common_tags
}

# MSK (Managed Kafka)
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${local.cluster_name}-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type  = "kafka.m5.2xlarge"
    client_subnets = module.vpc.private_subnets

    storage_info {
      ebs_storage_info {
        volume_size = 1000

        provisioned_throughput {
          enabled           = true
          volume_throughput = 250
        }
      }
    }

    security_groups = [module.security_group_kafka.security_group_id]
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.kafka.arn

    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.kafka.arn
    revision = aws_msk_configuration.kafka.latest_revision
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.kafka.name
      }
    }
  }

  tags = local.common_tags
}

resource "aws_msk_configuration" "kafka" {
  name              = "${local.cluster_name}-kafka-config"
  kafka_versions    = ["3.5.1"]
  server_properties = <<PROPERTIES
auto.create.topics.enable=true
default.replication.factor=3
min.insync.replicas=2
num.partitions=3
log.retention.hours=168
PROPERTIES
}

# KMS Keys
resource "aws_kms_key" "kafka" {
  description             = "KMS key for Kafka encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-kafka-kms"
  })
}

resource "aws_kms_alias" "kafka" {
  name          = "alias/${local.cluster_name}-kafka"
  target_key_id = aws_kms_key.kafka.key_id
}

# CloudWatch Log Group for Kafka
resource "aws_cloudwatch_log_group" "kafka" {
  name              = "/aws/msk/${local.cluster_name}"
  retention_in_days = 7

  tags = local.common_tags
}

# Security Groups
module "security_group_rds" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name        = "${local.cluster_name}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 5432
      to_port                  = 5432
      protocol                 = "tcp"
      description              = "PostgreSQL from EKS"
      source_security_group_id = module.eks.cluster_security_group_id
    }
  ]

  egress_rules = ["all-all"]

  tags = local.common_tags
}

module "security_group_redis" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name        = "${local.cluster_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      description              = "Redis from EKS"
      source_security_group_id = module.eks.cluster_security_group_id
    }
  ]

  egress_rules = ["all-all"]

  tags = local.common_tags
}

module "security_group_kafka" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name        = "${local.cluster_name}-kafka-sg"
  description = "Security group for MSK Kafka"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 9092
      to_port                  = 9092
      protocol                 = "tcp"
      description              = "Kafka from EKS"
      source_security_group_id = module.eks.cluster_security_group_id
    },
    {
      from_port                = 9094
      to_port                  = 9094
      protocol                 = "tcp"
      description              = "Kafka TLS from EKS"
      source_security_group_id = module.eks.cluster_security_group_id
    }
  ]

  egress_rules = ["all-all"]

  tags = local.common_tags
}

# Outputs
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
  sensitive   = true
}

output "kafka_bootstrap_brokers" {
  description = "Kafka bootstrap brokers"
  value       = aws_msk_cluster.kafka.bootstrap_brokers_tls
  sensitive   = true
}


