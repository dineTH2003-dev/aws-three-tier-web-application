variable "aws_profile" {
  description = "AWS CLI profile used by Terraform."
  type        = string
  default     = "account2"
}

variable "aws_region" {
  description = "AWS region for all regional resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short project identifier used in resource names."
  type        = string
  default     = "three-tier-web"
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_app_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_db_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "instance_type" {
  description = "Choose an instance type supported by the selected AMI and your account."
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI with the application runtime and deployment prerequisites already installed. Required for private instances without NAT."
  type        = string
  default     = ""
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "health_check_path" {
  type    = string
  default = "/health"
}

variable "asg_min_size" {
  type    = number
  default = 1
}

variable "asg_desired_capacity" {
  type    = number
  default = 1
}

variable "asg_max_size" {
  type    = number
  default = 2
}

variable "create_nat_gateway" {
  description = "Creates one NAT Gateway for private app instances. Adds ongoing hourly and data processing charges. Keep false for the lowest-cost setup; supply an AMI that does not require internet bootstrap."
  type        = bool
  default     = false
}

variable "db_name" {
  type    = string
  default = "appdb"
}

variable "db_username" {
  type      = string
  default   = "appadmin"
  sensitive = true
}

variable "db_password" {
  description = "Use TF_VAR_db_password or a local ignored tfvars file. Never commit credentials."
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Confirm current regional pricing and eligibility before deployment."
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_backup_retention_period" {
  type    = number
  default = 1
}

variable "db_multi_az" {
  description = "Multi-AZ improves availability but increases cost."
  type        = bool
  default     = false
}

variable "jwt_secret" {
  description = "Secret key for signing JWT authentication tokens."
  type        = string
  sensitive   = true
  default     = "production-super-secret-jwt-signing-key-3tier-app"
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution. Defaults to false if account is pending CloudFront verification."
  type        = bool
  default     = false
}


