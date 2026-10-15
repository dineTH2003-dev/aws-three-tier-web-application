output "aws_account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "AWS account Terraform is using."
}

output "region" {
  value = var.aws_region
}

output "alb_dns_name" {
  value       = aws_lb.app.dns_name
  description = "HTTP endpoint for the API load balancer. Add HTTPS/ACM before production."
}

output "frontend_cloudfront_domain" {
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].domain_name : null
  description = "CloudFront domain for the React frontend."
}

output "frontend_website_url" {
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
  description = "S3 website URL for the React frontend (used when CloudFront is disabled)."
}

output "frontend_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "Upload the built frontend files to this bucket."
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "Private RDS endpoint; reachable only from the application tier."
}

output "rds_port" {
  value = aws_db_instance.postgres.port
}

output "frontend_cloudfront_distribution_id" {
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.frontend[0].id : null
  description = "CloudFront distribution ID for cache invalidations."
}

output "artifact_bucket_name" {
  value       = aws_s3_bucket.artifacts.bucket
  description = "Upload application deployment bundles (app-bundle.tar.gz) to this bucket."
}

output "ecr_backend_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "Amazon ECR URL for backend container images."
}

output "ecr_frontend_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "Amazon ECR URL for frontend container images."
}

output "sns_alerts_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "Amazon SNS Topic ARN for operational and reliability alerts."
}

output "cloudwatch_dashboard_name" {
  value       = aws_cloudwatch_dashboard.overview.dashboard_name
  description = "CloudWatch Dashboard name for application and infrastructure health monitoring."
}

output "cloudwatch_log_group_name" {
  value       = aws_cloudwatch_log_group.app.name
  description = "CloudWatch Log Group name for centralized application and systemd logs."
}

output "github_actions_role_arn" {
  value       = aws_iam_role.github_actions.arn
  description = "IAM Role ARN for GitHub Actions OIDC assumed authentication."
}
