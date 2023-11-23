resource "azurerm_log_analytics_workspace" "law" {
  name                = module.ctx.labels.core.resourceNames["azurerm_log_analytics_workspace"]
  location            = module.ctx.location
  resource_group_name = module.ctx.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = module.ctx.labels.core.tags
}
