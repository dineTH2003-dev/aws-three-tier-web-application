data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "${var.project_name}-${var.environment}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project_name}-${var.environment}-instance-profile"
  role = aws_iam_role.app.name
}

data "aws_iam_policy_document" "artifacts_read" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.artifacts.arn,
      "${aws_s3_bucket.artifacts.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "artifacts_read" {
  name        = "${var.project_name}-${var.environment}-artifacts-read"
  description = "Allows EC2 instances to read deployment packages from the artifacts bucket."
  policy      = data.aws_iam_policy_document.artifacts_read.json
}

resource "aws_iam_role_policy_attachment" "artifacts_read" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.artifacts_read.arn
}

