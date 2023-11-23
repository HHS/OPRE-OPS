data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "vault" {
  name                = module.ctx.labels.core.resourceNames["azurerm_key_vault"]
  location            = module.ctx.location
  resource_group_name = module.ctx.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"
}

resource "azurerm_key_vault_access_policy" "keyvault_secrets_access" {
  for_each     = var.kv_access_group
  key_vault_id = azurerm_key_vault.vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = each.value

  secret_permissions = [
    "Set",
    "Get",
    "List",
    "Delete",
    "Purge",
    "Recover",
    "Backup",
    "Restore"
  ]
}
