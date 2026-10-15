# ==============================================================================
# Production Observability, Alerting & CloudWatch Monitoring
# ==============================================================================

# Central SNS Topic for Operational Alerts
resource "aws_sns_topic" "alerts" {
  name         = "${var.project_name}-${var.environment}-alerts"
  display_name = "${var.project_name} Operational Alerts"

  tags = {
    Name        = "${var.project_name}-${var.environment}-alerts"
    Component   = "monitoring"
    Environment = var.environment
  }
}

# Managed CloudWatch Log Group for Application & EC2 Systemd Logs
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ec2/${var.project_name}-${var.environment}/app"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-logs"
    Component   = "monitoring"
    Environment = var.environment
  }
}

# 1. ALB 5XX Error Spike Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-high-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Triggered when backend returns 5 or more HTTP 5XX server errors in 2 consecutive minutes."
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# 2. ALB High Latency / Target Response Time Alarm
resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1.5
  alarm_description   = "Triggered when average backend response time exceeds 1.5 seconds over 2 consecutive minutes."
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.app.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# 3. ALB Unhealthy Backend Host Count Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "${var.project_name}-${var.environment}-unhealthy-hosts"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 1
  alarm_description   = "Triggered when one or more EC2 backend instances fail ALB health checks."
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.app.arn_suffix
    LoadBalancer = aws_lb.app.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# 4. EC2 Auto Scaling Group High CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "asg_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-asg-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when average EC2 ASG CPU utilization exceeds 80% for 4 minutes."
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# 5. RDS PostgreSQL High CPU Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when RDS PostgreSQL database CPU utilization exceeds 80%."
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# 6. RDS Low Free Storage Space Alarm (< 2 GB)
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-low-storage"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648 # 2 GB
  alarm_description   = "Triggered when RDS PostgreSQL free storage space falls below 2 GB."
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.identifier
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# 7. Unified CloudWatch Executive & Operations Dashboard
resource "aws_cloudwatch_dashboard" "overview" {
  dashboard_name = "${var.project_name}-${var.environment}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ALB Request Count & HTTP Errors"
          region  = var.aws_region
          stacked = false
          view    = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Sum", period = 60, color = "#1f77b4" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Sum", period = 60, color = "#2ca02c" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Sum", period = 60, color = "#ff7f0e" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Sum", period = 60, color = "#d62728" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ALB Target Latency (Seconds)"
          region  = var.aws_region
          stacked = false
          view    = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Average", period = 60, label = "Average Latency" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "p95", period = 60, label = "p95 Latency", color = "#e377c2" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "EC2 ASG CPU Utilization & Healthy Hosts"
          region  = var.aws_region
          stacked = false
          view    = "timeSeries"
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app.name, { stat = "Average", period = 60, color = "#17becf" }],
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", aws_lb_target_group.app.arn_suffix, "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Maximum", period = 60, color = "#2ca02c" }],
            ["AWS/ApplicationELB", "UnHealthyHostCount", "TargetGroup", aws_lb_target_group.app.arn_suffix, "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Maximum", period = 60, color = "#d62728" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "RDS Database Connections & CPU"
          region  = var.aws_region
          stacked = false
          view    = "timeSeries"
          metrics = [
            ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", aws_db_instance.postgres.identifier, { stat = "Average", period = 60, color = "#9467bd" }],
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", aws_db_instance.postgres.identifier, { stat = "Average", period = 60, color = "#8c564b" }]
          ]
        }
      }
    ]
  })
}
