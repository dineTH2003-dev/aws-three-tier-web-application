# ==============================================================================
# Centralized Secrets Management & Encrypted Configuration
# ==============================================================================

# 1. Encrypted S3 Configuration Store (Accessible via Zero-Cost S3 Gateway Endpoint)
resource "aws_s3_object" "app_config" {
  bucket                 = aws_s3_bucket.artifacts.bucket
  key                    = "config/env.json"
  server_side_encryption = "AES256"

  content = jsonencode({
    NODE_ENV       = "production"
    PORT           = var.app_port
    DB_HOST        = aws_db_instance.postgres.address
    DB_PORT        = aws_db_instance.postgres.port
    DB_NAME        = var.db_name
    DB_USER        = var.db_username
    DB_PASSWORD    = var.db_password
    DB_SSL         = "true"
    JWT_SECRET     = var.jwt_secret
    JWT_EXPIRES_IN = "24h"
    LOG_LEVEL      = "info"
    CORS_ORIGIN    = "*"
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-config"
    Component   = "secrets"
    Environment = var.environment
  }
}

# 2. AWS Systems Manager (SSM) Parameter Store (Encrypted with KMS SecureString)
resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.project_name}/${var.environment}/db_password"
  description = "RDS PostgreSQL master database password"
  type        = "SecureString"
  value       = var.db_password
  overwrite   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-password"
    Component   = "secrets"
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/${var.project_name}/${var.environment}/jwt_secret"
  description = "JWT authentication token signing key"
  type        = "SecureString"
  value       = var.jwt_secret
  overwrite   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-jwt-secret"
    Component   = "secrets"
    Environment = var.environment
  }
}
