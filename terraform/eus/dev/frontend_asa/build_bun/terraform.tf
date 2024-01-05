terraform {
  required_version = "~> 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.79.0"
    }

    null = {
      source  = "hashicorp/null"
      version = "3.2.2"
    }
  }

  backend "azurerm" {
    resource_group_name  = "opre-ops-dev-eus-tf-rg"
    storage_account_name = "opreopsdeveustfst"
    container_name       = "opre-ops-dev-eus-tf-sc"
    key                  = "ops-fe-bun-build-deployment.tfstate"
  }
}
