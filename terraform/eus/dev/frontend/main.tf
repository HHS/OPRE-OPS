resource "azurerm_container_app" "frontend" {
  name                         = module.ctx.labels.fe.resourceNames["azurerm_container_app"]
  container_app_environment_id = data.azurerm_container_app_environment.aca_env.id
  resource_group_name = module.ctx.resource_group_name
  revision_mode                = "Multiple"

  template {
    revision_suffix = substr(var.container_tag, 0, 8)
    min_replicas = 1
    container {
      name   = var.container_name
      image  = "${var.container_image}:${var.container_tag}"
      cpu    = var.cpu
      memory = var.memory
     
      env {
        name = "REACT_APP_BACKEND_DOMAIN"
        value = "https://${module.ctx.labels.be.resourceNames["azurerm_container_app"]}.${data.azurerm_container_app_environment.aca_env.default_domain}"
      }
    }
  }

  ingress { 
    external_enabled = true
    target_port = var.port
    traffic_weight  {
        percentage = 100
        latest_revision = true
    }
  }
}

output "domain" {
  value = "https://${module.ctx.labels.fe.resourceNames["azurerm_container_app"]}.${data.azurerm_container_app_environment.aca_env.default_domain}"
}