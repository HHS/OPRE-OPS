module "ctx" {
  source          = "../../../global/context"
  environment     = var.environment
  custom_workload = "be4s"

}

data "azurerm_container_app_environment" "aca_env" {
  name                = module.ctx.labels.core.resourceNames["azurerm_container_app_environment"]
  resource_group_name = module.ctx.resource_group_name
}
