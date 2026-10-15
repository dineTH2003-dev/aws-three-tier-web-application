terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket  = "tunnix-terraform-state-265283365424"
    key     = "three-tier-web/terraform.tfstate"
    region  = "ap-southeast-1"
    encrypt = true
  }
}
