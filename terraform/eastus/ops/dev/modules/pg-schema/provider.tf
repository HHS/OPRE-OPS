terraform {
  required_providers {
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "1.21.1-beta.1"
    }
  }
}

provider "postgresql" {
  host            = data.azurerm_key_vault_secret.db_host_address.value
  port            = var.dbPort
  database        = var.dbName // "postgres"
  username        = data.azurerm_key_vault_secret.admin_user.value
  password        = data.azurerm_key_vault_secret.admin_pw.value
  superuser       = false
  sslmode         = "require"
  connect_timeout = 15
}

data "azurerm_key_vault_secret" "admin_user" {
  name         = "${var.dbServerName}-admin-username"
  key_vault_id = var.keyVaultId
}

data "azurerm_key_vault_secret" "admin_pw" {
  name         = "${var.dbServerName}-admin-password"
  key_vault_id = var.keyVaultId
}

data "azurerm_key_vault_secret" "db_host_address" {
  name         = "${var.dbServerName}-host-address"
  key_vault_id = var.keyVaultId
}
