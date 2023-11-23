resource "azurerm_resource_group" "rg" {
  name     = module.ctx.resource_group_name
  location = module.ctx.location
  tags     = module.ctx.labels.core.tags
}
