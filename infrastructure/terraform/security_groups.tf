resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Public HTTP ingress to the load balancer."
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP; use an HTTPS listener and ACM certificate before production."
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS ingress to load balancer."
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow outbound traffic from ALB to targets."
  }

  tags = { Name = "${var.project_name}-${var.environment}-alb-sg" }
}

resource "aws_security_group" "app" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Application ingress only from the ALB security group."
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Application traffic from ALB only."
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound traffic; private subnets have no internet route unless NAT is enabled."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-${var.environment}-app-sg" }
}

resource "aws_security_group" "db" {
  name        = "${var.project_name}-${var.environment}-db-sg"
  description = "PostgreSQL ingress only from application instances."
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from application tier only."
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  # Zero outbound egress: RDS in private subnets never initiates external outbound connections

  tags = { Name = "${var.project_name}-${var.environment}-db-sg" }
}
