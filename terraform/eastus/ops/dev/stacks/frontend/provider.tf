# Example of azurerm provider
terraform {
  required_providers {
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "1.21.1-beta.1"
    }
    twingate = {
      source  = "Twingate/twingate"
      version = "2.0.1"
    }
    acme = {
      source  = "vancluever/acme"
      version = "2.20.0"
    }
  }
}
provider "azurerm" {
  features {} # required
}
