module "ctx" {
  source          = "../../../global/context"
  environment     = var.environment
  custom_workload = "be4s"
}

data "azurerm_storage_account" "static_fe" {
  name                = module.ctx.labels.sfe.resourceNames["azurerm_storage_account"]
  resource_group_name = module.ctx.resource_group_name

}

data "azurerm_container_app_environment" "aca_env" {
  name                = module.ctx.labels.core.resourceNames["azurerm_container_app_environment"]
  resource_group_name = module.ctx.resource_group_name
}

data "azurerm_postgresql_flexible_server" "ops_dbs" {
  name                = module.ctx.labels.db.resourceNames["azurerm_postgresql_flexible_server"]
  resource_group_name = module.ctx.resource_group_name
}

data "azurerm_key_vault" "vault" {
  name                = module.ctx.labels.core.resourceNames["azurerm_key_vault"]
  resource_group_name = module.ctx.resource_group_name
}

data "azurerm_key_vault_secret" "ops-pw" {
  name         = "ops-role-password"
  key_vault_id = data.azurerm_key_vault.vault.id
}

data "azurerm_key_vault_secret" "ops-jwt-private-key" {
  name         = "ops-jwt-private-key"
  key_vault_id = data.azurerm_key_vault.vault.id
}