# BitCurrent Exchange - Terraform Variables (Production)

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2" # London
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "bitcurrent.co.uk"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6i.4xlarge"
}

variable "db_allocated_storage" {
  description = "Initial database storage in GB"
  type        = number
  default     = 500
}

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.r7g.xlarge"
}

variable "kafka_instance_type" {
  description = "MSK instance type"
  type        = string
  default     = "kafka.m5.2xlarge"
}

variable "eks_node_instance_type_general" {
  description = "Instance type for general EKS nodes"
  type        = string
  default     = "c6i.2xlarge"
}

variable "eks_node_instance_type_matching" {
  description = "Instance type for matching engine nodes"
  type        = string
  default     = "c6i.8xlarge"
}

variable "enable_monitoring" {
  description = "Enable enhanced monitoring"
  type        = bool
  default     = true
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}



