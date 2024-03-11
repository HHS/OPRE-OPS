

resource "azurerm_container_app" "container_app" {
  name                         = var.containerAppName
  container_app_environment_id = var.containerAppEnvId
  resource_group_name          = var.resourceGroupName
  revision_mode                = "Single" // Until we determine if revision traffic is needed

  template {
    revision_suffix = substr(var.containerImageTag, 0, 8)
    min_replicas    = var.minReplicas
    max_replicas    = var.maxReplicas
    container {
      name   = var.containerName
      image  = "${var.containerImage}:${var.containerImageTag}"
      cpu    = var.containerCpu
      memory = var.containerMem

      dynamic "env" {
        for_each = var.env
        content {
          name        = env.value.name
          value       = env.value.value
          secret_name = env.value.secret_name
        }
      }
      command = var.containerCommand
    }
  }

  dynamic "ingress" {
    for_each = var.enableIngress == true ? [1] : []
    content {
      external_enabled = true
      target_port      = var.containerPort
      traffic_weight {
        percentage      = 100
        latest_revision = true
      }
    }
  }

  dynamic "secret" {
    for_each = var.secrets
    content {
      name  = secret.value.name
      value = secret.value.value

    }
  }

  tags = var.tags
}
