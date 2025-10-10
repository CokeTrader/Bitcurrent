# BitCurrent Exchange - Staging Environment
# Cost-optimized configuration for testing

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "bitcurrent-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "bitcurrent-terraform-locks"
  }
}

provider "aws" {
  region = "eu-west-2"

  default_tags {
    tags = {
      Environment = "staging"
      Project     = "bitcurrent-exchange"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  cluster_name = "bitcurrent-staging"
  domain_name  = "staging.bitcurrent.co.uk"
}

# VPC Module (smaller for staging)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "${local.cluster_name}-vpc"
  cidr = "10.1.0.0/16"

  azs             = ["eu-west-2a", "eu-west-2b"]  # Only 2 AZs
  private_subnets = ["10.1.1.0/24", "10.1.2.0/24"]
  public_subnets  = ["10.1.101.0/24", "10.1.102.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true  # Cost optimization
  enable_dns_hostnames = true
}

# EKS Cluster (smaller for staging)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.16.0"

  cluster_name    = local.cluster_name
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size   = 2
      min_size       = 2
      max_size       = 5
      instance_types = ["c6i.large"]  # Smaller instances
    }
  }
}

# RDS PostgreSQL (smaller for staging)
module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.3.0"

  identifier = "${local.cluster_name}-db"

  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.large"  # Cost-optimized

  allocated_storage = 100
  storage_encrypted = true

  db_name  = "bitcurrent_staging"
  username = "bitcurrent_admin"

  multi_az = false  # Single AZ for staging

  backup_retention_period = 7  # Shorter retention
  skip_final_snapshot     = true  # Allow easy teardown

  vpc_security_group_ids = [module.security_group_rds.security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name
}

# ElastiCache Redis (smaller for staging)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${local.cluster_name}-redis"
  replication_group_description = "Redis for staging"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = "cache.t3.micro"  # Smallest instance

  num_cache_clusters = 1  # Single node (no cluster)

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [module.security_group_redis.security_group_id]
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.cluster_name}-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

# Security Groups (same pattern as prod)
module "security_group_rds" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name   = "${local.cluster_name}-rds-sg"
  vpc_id = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 5432
      to_port                  = 5432
      protocol                 = "tcp"
      source_security_group_id = module.eks.cluster_security_group_id
    }
  ]

  egress_rules = ["all-all"]
}

module "security_group_redis" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.1.0"

  name   = "${local.cluster_name}-redis-sg"
  vpc_id = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      source_security_group_id = module.eks.cluster_security_group_id
    }
  ]

  egress_rules = ["all-all"]
}

# Outputs
output "cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value     = module.rds.db_instance_endpoint
  sensitive = true
}

output "redis_endpoint" {
  value     = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive = true
}



