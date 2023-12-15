

resource "azurerm_container_app" "backend" {
  name                         = module.ctx.labels.sbe.resourceNames["azurerm_container_app"]
  container_app_environment_id = data.azurerm_container_app_environment.aca_env.id
  resource_group_name          = module.ctx.resource_group_name
  revision_mode                = "Multiple"

  template {
    revision_suffix = substr(var.container_tag, 0, 8)
    min_replicas    = 1
    container {
      name   = var.container_name
      image  = "${var.container_image}:${var.container_tag}"
      cpu    = var.cpu
      memory = var.memory
      env {
        name  = "OPS_CONFIG"
        value = "environment/azure/dev.py"
      }
      env {
        name  = "PGUSER"
        value = "ops" 
      }
      env {
        name        = "PGPASSWORD"
        secret_name = "pgpassword"
      }
      env {
        name  = "PGHOST"
        value = data.azurerm_postgresql_flexible_server.ops_dbs.fqdn
      }
      env {
        name  = "PGPORT"
        value = 5432
      }
      env {
        name  = "PGDATABASE"
        value = "postgres"
      }
      env {
        name        = "JWT_PRIVATE_KEY"
        secret_name = "jwt-private-key"
      }
      env {
        name  = "OPS_FRONTEND_URL"
        value = trimsuffix(data.azurerm_storage_account.static_fe.primary_web_endpoint, "/")
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = var.port
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
  secret {
    name  = "pgpassword"
    value = data.azurerm_key_vault_secret.ops-pw.value
  }
  secret {
    name  = "jwt-private-key"
    value = data.azurerm_key_vault_secret.ops-jwt-private-key.value
  }
}

output "fe_domain" {
  value = trimsuffix(data.azurerm_storage_account.static_fe.primary_web_endpoint, "/")
}

output "be_domain" {
  value = trimsuffix(azurerm_container_app.backend.latest_revision_fqdn, "/")
}
