terraform {
  required_version = "~> 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.92.0"
    }

    local = {
      source  = "hashicorp/local"
      version = "2.4.1"
    }
  }

  backend "azurerm" {
    resource_group_name  = "opre-ops-dev-eus-tf-rg"
    storage_account_name = "opreopsdeveustfst"
    container_name       = "opre-ops-dev-eus-tf-sc"
    key                  = "ops-fe-asa-deployment.tfstate"
  }
}
