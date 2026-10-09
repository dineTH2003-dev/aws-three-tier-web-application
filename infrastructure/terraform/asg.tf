resource "aws_launch_template" "app" {
  name_prefix            = "${var.project_name}-${var.environment}-"
  image_id               = var.ami_id
  instance_type          = var.instance_type
  update_default_version = true

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "disabled"
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh.tftpl", {
    artifact_bucket   = aws_s3_bucket.artifacts.bucket
    artifact_key      = "app-bundle.tar.gz"
    aws_region        = var.aws_region
    app_port          = var.app_port
    health_check_path = var.health_check_path
    db_host           = aws_db_instance.postgres.address
    db_port           = aws_db_instance.postgres.port
    db_name           = var.db_name
    db_user           = var.db_username
    db_password       = var.db_password
    jwt_secret        = var.jwt_secret
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-${var.environment}-app"
      Tier = "application"
    }
  }

  lifecycle {
    precondition {
      condition     = trimspace(var.ami_id) != ""
      error_message = "Set ami_id to an AMI that already has your Node.js app/runtime prerequisites. Private instances have no internet access by default."
    }
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${var.project_name}-${var.environment}-asg"
  min_size                  = var.asg_min_size
  desired_capacity          = var.asg_desired_capacity
  max_size                  = var.asg_max_size
  vpc_zone_identifier       = aws_subnet.app[*].id
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 180
  force_delete              = false

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-app"
    propagate_at_launch = true
  }

  depends_on = [aws_lb_listener.http]
}
