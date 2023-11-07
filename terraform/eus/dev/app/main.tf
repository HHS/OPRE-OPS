module "labels" {
  source      = "git@github.com:devops-chris/tf-azure-labels.git?ref=v0.1.1"
  owner       = var.owner
  project     = var.project
  location    = var.location
  environment = var.environment
  workload    = "app"
}

resource "azurerm_resource_group" "rg" {
  name     = module.labels.resourceNames["azurerm_resource_group"]
  location = var.location

  tags = module.labels.tags
}

resource "azurerm_log_analytics_workspace" "law" {
  name                = module.labels.resourceNames["azurerm_log_analytics_workspace"]
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags = module.labels.tags
}

resource "azurerm_container_app_environment" "acae" {
  name                       = module.labels.resourceNames["azurerm_container_app_environment"]
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id
  tags = module.labels.tags
}

# resource "azurerm_container_app" "example" {
#   name                         = "test-ops-app"
#   container_app_environment_id = azurerm_container_app_environment.example.id
#   resource_group_name = azurerm_resource_group.rg.name
#   revision_mode                = "Single"

#   template {
#     container {
#       name   = "test-ops-container"
#       image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
#       cpu    = 0.25
#       memory = "0.5Gi"
#     }
#   }

#   ingress {
#     external_enabled = true
#     target_port = 80
#     traffic_weight  {
#         percentage = 100
#         latest_revision = true
#         revision_suffix = "v1.0"
#     }
#   }
# }

output "container_env" {
    value = azurerm_container_app_environment.acae.id
}

# output ip {
#     value = azurerm_container_app.example.outbound_ip_addresses
# }

# output domain {
#     value = azurerm_container_app.example.latest_revision_fqdn
# }