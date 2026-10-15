# GitHub Actions OIDC Role for Secure CI/CD Automation
locals {
  github_repo     = "dineTH2003-dev/aws-three-tier-web-application"
  github_oidc_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${local.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-${var.environment}-github-actions-role"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json
  description        = "IAM role assumed via GitHub Actions OIDC for deploying three-tier application."

  tags = {
    Name        = "${var.project_name}-${var.environment}-github-actions-role"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_iam_policy_document" "github_actions_deployment" {
  # S3 Deployments (Artifacts & Frontend)
  statement {
    sid    = "AllowS3Deployments"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ]
    resources = [
      aws_s3_bucket.artifacts.arn,
      "${aws_s3_bucket.artifacts.arn}/*",
      aws_s3_bucket.frontend.arn,
      "${aws_s3_bucket.frontend.arn}/*"
    ]
  }

  # ECR Auth & Push
  statement {
    sid    = "AllowECRAuth"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AllowECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:GetRepositoryPolicy",
      "ecr:DescribeRepositories",
      "ecr:ListImages",
      "ecr:DescribeImages",
      "ecr:BatchGetImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage"
    ]
    resources = [
      aws_ecr_repository.backend.arn,
      aws_ecr_repository.frontend.arn
    ]
  }

  # ASG Rolling Instance Refresh
  statement {
    sid    = "AllowASGRefresh"
    effect = "Allow"
    actions = [
      "autoscaling:StartInstanceRefresh",
      "autoscaling:CancelInstanceRefresh",
      "autoscaling:DescribeInstanceRefreshes",
      "autoscaling:DescribeAutoScalingGroups"
    ]
    resources = [
      aws_autoscaling_group.app.arn
    ]
  }

  # CloudFront Invalidation
  statement {
    sid    = "AllowCloudFrontInvalidation"
    effect = "Allow"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation",
      "cloudfront:ListDistributions"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "github_actions_deployment" {
  name        = "${var.project_name}-${var.environment}-github-actions-policy"
  description = "Permissions for GitHub Actions to build, publish containers and deploy application."
  policy      = data.aws_iam_policy_document.github_actions_deployment.json
}

resource "aws_iam_role_policy_attachment" "github_actions_deployment" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions_deployment.arn
}
