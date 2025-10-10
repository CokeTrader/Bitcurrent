# BitCurrent Exchange - Starter Environment Variables

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "database_password" {
  description = "RDS PostgreSQL password"
  type        = string
  sensitive   = true
}


