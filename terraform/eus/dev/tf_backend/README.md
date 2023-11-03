# Project Infrastructure

This project bootstrapped terraform state management resources into your environment. 

## Backend Configuration

Now that the backend has been created, you can copy the backend config below and update the key for other terraform configs in your project.

```hcl
terraform {
  backend "azurerm" {
    resource_group_name   = "opre-ops-dev-eus-tf-rg"
    storage_account_name  = "opreopsdeveustfst"
    container_name        = "opre-ops-dev-eus-tf-sc"
    key                   = "<unique_key_name_for_statefile>"
  }
}
