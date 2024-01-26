module "ctx" {
  source          = "../../../global/context" //"git::https://github.com/HHS/OPRE-OPS.git//terraform/global/context?ref=v0.1"
  environment     = var.environment
  custom_workload = "be4s"

}

data "azurerm_storage_account" "static_fe" {
  name                = module.ctx.labels.sfe.resourceNames["azurerm_storage_account"]
  resource_group_name = module.ctx.resource_group_name

}
