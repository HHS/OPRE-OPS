module "ctx" {
  source          = "git::https://github.com/HHS/OPRE-OPS.git//terraform/global/context?ref=tf-global-context-v0.0.2"
  environment     = var.environment
  custom_workload = "be4s"

}

data "azurerm_storage_account" "static_fe" {
  name                = module.ctx.labels.sfe.resourceNames["azurerm_storage_account"]
  resource_group_name = module.ctx.resource_group_name

}
