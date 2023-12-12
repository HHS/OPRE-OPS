module "ctx" {
  source          = "git::https://github.com/HHS/OPRE-OPS.git//terraform/global/context?ref=tf-global-context-v0.0.2"
  environment     = var.environment
  custom_workload = "be4s"

}

data "azurerm_container_app_environment" "aca_env" {
  name                = module.ctx.labels.core.resourceNames["azurerm_container_app_environment"]
  resource_group_name = module.ctx.resource_group_name
}
