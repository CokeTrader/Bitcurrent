# BitCurrent Exchange - Starter/Dev Environment
# Cost-optimized configuration: ~£50-100/month vs £2,500-3,500/month production

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "bitcurrent-terraform-state"
    key            = "starter/terraform.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "bitcurrent-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "bitcurrent-exchange"
      Environment = "starter"
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront requires ACM certificates in us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "bitcurrent-exchange"
      Environment = "starter"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  cluster_name = "bc-starter"  # Shorter name to fit AWS IAM limits
  common_tags = {
    Project     = "bitcurrent-exchange"
    Environment = "starter"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC - Single NAT Gateway (vs 3 in production)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = local.cluster_name
  cidr = "10.1.0.0/16"

  azs              = slice(data.aws_availability_zones.available.names, 0, 2) # Only 2 AZs
  private_subnets  = ["10.1.1.0/24", "10.1.2.0/24"]
  public_subnets   = ["10.1.11.0/24", "10.1.12.0/24"]
  database_subnets = ["10.1.21.0/24", "10.1.22.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true  # COST SAVER: Only 1 NAT gateway (~£32/month)
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
}

# EKS Cluster - Minimal configuration
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = local.cluster_name
  cluster_version = "1.28"

  vpc_id                   = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  # Cheaper cluster addons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  # COST OPTIMIZED: Smaller, fewer nodes
  eks_managed_node_groups = {
    general = {
      name           = "${local.cluster_name}-general"
      instance_types = ["t3.small"]  # Smallest paid tier - £0.02/hr
      
      min_size     = 2  # vs 3 in prod
      max_size     = 4  # vs 10 in prod
      desired_size = 2  # vs 3 in prod

      disk_size = 50  # vs 100 in prod

      labels = {
        role = "general"
      }
    }
  }

  tags = local.common_tags
}

# RDS PostgreSQL - Smaller, Single-AZ
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${local.cluster_name}-db"

  engine               = "postgres"
  engine_version       = "15"  # Let AWS pick the latest 15.x version
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t3.micro"  # vs db.r6i.4xlarge (~£0.02/hr vs £2.50/hr!)

  allocated_storage     = 20    # vs 500 in prod
  max_allocated_storage = 100   # vs 2000 in prod

  db_name  = "bitcurrent"
  username = "bitcurrent_admin"
  password = var.database_password  # Set via variable
  port     = 5432

  multi_az               = false  # COST SAVER: Single AZ (~50% savings)
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security_group_rds.security_group_id]

  maintenance_window              = "sun:03:00-sun:04:00"
  backup_window                   = "02:00-03:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  backup_retention_period = 7  # vs 30 in prod
  skip_final_snapshot     = true
  deletion_protection     = false  # Can delete easily for testing

  performance_insights_enabled = false  # COST SAVER: Disable

  tags = local.common_tags
}

# ElastiCache Redis - Minimal
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.cluster_name}-redis-subnet"
  subnet_ids = module.vpc.private_subnets

  tags = local.common_tags
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.cluster_name}-redis"
  description          = "Redis cluster for BitCurrent Exchange (starter)"

  engine               = "redis"
  engine_version       = "7.1"
  node_type            = "cache.t3.micro"  # vs cache.r7g.xlarge (~£0.02/hr vs £0.30/hr!)
  num_cache_clusters   = 1  # vs 3 in prod (no replication)
  parameter_group_name = "default.redis7"

  port = 6379

  multi_az_enabled           = false  # COST SAVER
  automatic_failover_enabled = false  # Requires multi-AZ
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [module.security_group_redis.security_group_id]

  snapshot_retention_limit = 1  # vs 7 in prod
  snapshot_window          = "02:00-03:00"
  maintenance_window       = "sun:03:00-sun:04:00"

  tags = local.common_tags
}

# MSK Kafka - Minimal (most expensive, but necessary)
resource "aws_msk_cluster" "kafka" {
  cluster_name           = "${local.cluster_name}-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 2  # vs 3 in prod (minimum for MSK)

  broker_node_group_info {
    instance_type  = "kafka.t3.small"  # vs kafka.m5.2xlarge (~£0.07/hr vs £0.40/hr!)
    client_subnets = slice(module.vpc.private_subnets, 0, 2)

    storage_info {
      ebs_storage_info {
        volume_size = 100  # vs 1000 in prod
      }
    }

    security_groups = [module.security_group_kafka.security_group_id]
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
    encryption_at_rest_kms_key_arn = aws_kms_key.kafka.arn
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

resource "aws_kms_key" "kafka" {
  description             = "KMS key for MSK cluster encryption"
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

resource "aws_cloudwatch_log_group" "kafka" {
  name              = "/aws/msk/${local.cluster_name}"
  retention_in_days = 7  # vs 30 in prod

  tags = local.common_tags
}

# Security Groups
module "security_group_rds" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

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
  version = "~> 5.0"

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
  version = "~> 5.0"

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
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "kafka_bootstrap_brokers" {
  description = "Kafka bootstrap brokers"
  value       = aws_msk_cluster.kafka.bootstrap_brokers_tls
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "cost_estimate" {
  description = "Estimated monthly cost in GBP"
  value       = "£50-100/month (vs £2,500-3,500 for production)"
}

