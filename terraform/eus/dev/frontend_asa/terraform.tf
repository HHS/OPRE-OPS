terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.79.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "opre-ops-dev-eus-tf-rg"
    storage_account_name = "opreopsdeveustfst"
    container_name       = "opre-ops-dev-eus-tf-sc"
    key                  = "ops-fe-asa-deployment.tfstate"
  }
}
