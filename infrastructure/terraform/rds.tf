resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-${var.environment}-db-subnets"
  subnet_ids  = aws_subnet.db[*].id
  description = "Private database subnets across two Availability Zones."
  tags        = { Name = "${var.project_name}-${var.environment}-db-subnets" }
}

resource "aws_db_instance" "postgres" {
  identifier                      = "${var.project_name}-${var.environment}-postgres"
  engine                          = "postgres"
  engine_version                  = "16"
  instance_class                  = var.db_instance_class
  allocated_storage               = var.db_allocated_storage
  storage_type                    = "gp3"
  storage_encrypted               = true
  db_name                         = var.db_name
  username                        = var.db_username
  password                        = var.db_password
  port                            = 5432
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.db.id]
  publicly_accessible             = false
  multi_az                        = var.db_multi_az
  backup_retention_period         = var.db_backup_retention_period
  auto_minor_version_upgrade      = true
  deletion_protection             = false
  skip_final_snapshot             = true
  apply_immediately               = false
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = { Name = "${var.project_name}-${var.environment}-postgres" }

  lifecycle {
    precondition {
      condition     = length(var.db_password) >= 12
      error_message = "db_password must be at least 12 characters."
    }
  }
}
