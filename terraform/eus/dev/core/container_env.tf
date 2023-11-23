resource "azurerm_container_app_environment" "acae" {
  name                       = module.ctx.labels.core.resourceNames["azurerm_container_app_environment"]
  location                   = module.ctx.location
  resource_group_name        = module.ctx.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id
  tags                       = module.ctx.labels.core.tags
}
