module "frontend" {
  source            = "../../modules/container-app"
  containerAppName  = var.frontendName
  containerAppEnvId = data.azurerm_container_app_environment.aca_env.id
  resourceGroupName = var.resourceGroupName
  containerName     = var.frontendName
  containerImage    = "ghcr.io/hhs/opre-ops/ops-frontend"
  containerImageTag = var.containerImageTag
  containerPort     = 3000
  env = [
    {
      name  = "REACT_APP_BACKEND_DOMAIN"
      value = "https://${var.environment}.${var.dnsZoneName}" //"${var.backendName}.${data.azurerm_container_app_environment.aca_env.default_domain}"
    }
  ]
  secrets = []
  tags    = {}
}

data "azurerm_container_app_environment" "aca_env" {
  name                = var.containerAppEnvName
  resource_group_name = var.resourceGroupName
}
