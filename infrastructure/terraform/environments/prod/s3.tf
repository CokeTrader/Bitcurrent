# BitCurrent Exchange - S3 Buckets Configuration

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.cluster_name}-alb-logs"

  tags = merge(local.common_tags, {
    Name = "bitcurrent-alb-logs"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 bucket for database backups
resource "aws_s3_bucket" "db_backups" {
  bucket = "${local.cluster_name}-db-backups"

  tags = merge(local.common_tags, {
    Name = "bitcurrent-db-backups"
  })
}

resource "aws_s3_bucket_versioning" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "db_backups" {
  bucket = aws_s3_bucket.db_backups.id

  rule {
    id     = "archive-old-backups"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years (regulatory requirement)
    }
  }
}

# S3 bucket for application logs
resource "aws_s3_bucket" "app_logs" {
  bucket = "${local.cluster_name}-app-logs"

  tags = merge(local.common_tags, {
    Name = "bitcurrent-app-logs"
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "app_logs" {
  bucket = aws_s3_bucket.app_logs.id

  rule {
    id     = "transition-logs"
    status = "Enabled"

    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years
    }
  }
}

# S3 bucket for KYC documents
resource "aws_s3_bucket" "kyc_documents" {
  bucket = "${local.cluster_name}-kyc-documents"

  tags = merge(local.common_tags, {
    Name = "bitcurrent-kyc-documents"
  })
}

resource "aws_s3_bucket_versioning" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

# Block public access for KYC documents
resource "aws_s3_bucket_public_access_block" "kyc_documents" {
  bucket = aws_s3_bucket.kyc_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for frontend static assets is defined in cloudfront.tf

# S3 bucket for Terraform state (created manually first)
# Already exists: bitcurrent-terraform-state

# KMS key for S3 encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.cluster_name}-s3-kms"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.cluster_name}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# Outputs
output "frontend_bucket" {
  description = "Frontend S3 bucket name"
  value       = aws_s3_bucket.frontend.id
}

output "db_backup_bucket" {
  description = "Database backup S3 bucket name"
  value       = aws_s3_bucket.db_backups.id
}


