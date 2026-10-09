# Three-tier AWS infrastructure (Terraform)

Target: AWS CLI profile `account2`, region `ap-south-1`.

## Architecture

- Public: Application Load Balancer across two Availability Zones; CloudFront distribution.
- Frontend: private S3 bucket with CloudFront Origin Access Control.
- Application: EC2 Auto Scaling Group in private subnets; inbound app traffic only from the ALB security group.
- Database: encrypted, non-public RDS PostgreSQL in private DB subnets; port 5432 allowed only from the app security group.
- IAM: EC2 instance profile with Systems Manager core permissions; IMDSv2 required.
- NAT Gateway is disabled by default to avoid its ongoing charges.

## Important prerequisites

1. The AMI must exist in `ap-south-1` and have Node.js plus your application already installed/configured. Private app subnets have no internet route by default, so user data intentionally does not install packages or fetch source code.
2. The app must listen on `0.0.0.0:3000` (or the configured port) and return HTTP 200 at `/health`.
3. This initial configuration exposes the ALB over HTTP only. CloudFront redirects frontend traffic to HTTPS, but the API ALB needs an ACM certificate and HTTPS listener before production use.
4. The DB password is a sensitive Terraform input. Terraform state can contain secrets; use a secure remote backend with encryption and restricted access before team/production use. Do not commit `terraform.tfvars`, state files, passwords, or keys.
5. This creates billable resources, including ALB, CloudFront, RDS, EC2, EBS, S3, and data transfer. NAT Gateway adds further cost if enabled. Check current Mumbai pricing and Free Tier eligibility first.

## Setup

From the repository root:

```bash
mkdir -p infrastructure/terraform
# Copy these files into infrastructure/terraform/

export AWS_PROFILE=account2
aws sts get-caller-identity
aws configure get region --profile account2

cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars and set a valid ami_id.
export TF_VAR_db_password='replace-with-a-long-unique-password'

terraform init
terraform fmt -check
terraform validate
terraform plan -out=tfplan
terraform show tfplan
```

Do **not** run `terraform apply` until you have reviewed the complete plan and explicitly approved creating the resources. Share the plan output for review first. Do not share passwords, access keys, or the binary `tfplan` file.

To see exactly which account is targeted:

```bash
aws sts get-caller-identity --profile account2
```

The AWS provider explicitly selects `account2` and `ap-south-1`, but verify the account ID before planning.

## Frontend deployment

After the infrastructure is approved and created, build the frontend and upload its build output to the bucket shown by `terraform output frontend_bucket_name`, for example:

```bash
aws s3 sync ./dist "s3://$(terraform output -raw frontend_bucket_name)/" --delete --profile account2
```

Invalidate CloudFront after deploying changed assets:

```bash
aws cloudfront create-invalidation \
  --distribution-id "$(terraform output -raw frontend_cloudfront_distribution_id)" \
  --paths "/*" \
  --profile account2
```

Note: add the `frontend_cloudfront_distribution_id` output if using this command.
