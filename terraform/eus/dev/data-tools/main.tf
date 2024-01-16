resource "azurerm_container_app" "data-tools" {
  name                         = module.ctx.labels.dt.resourceNames["azurerm_container_app"]
  container_app_environment_id = data.azurerm_container_app_environment.aca_env.id
  resource_group_name          = module.ctx.resource_group_name
  revision_mode                = "Single"

  template {
    revision_suffix = substr(var.container_tag, 0, 8)
    min_replicas    = 0
    max_replicas    = 1
    container {
      name   = var.container_name
      image  = "${var.container_image}:${var.container_tag}"
      cpu    = var.cpu
      memory = var.memory
      env {
        name  = "ENV"
        value = "azure"
      }
      env {
        name  = "PGUSER"
        value = "ops" // data.azurerm_postgresql_flexible_server.ops_dbs.administrator_login
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
        value = "postgres" //"test-ops-db"
      }
      command = [
        "bash",
        "-c",
        "python ./data_tools/src/import_static_data/load_db.py && DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/vendor_and_contact_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/first_contract_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/workflow_data.json5 python ./data_tools/src/import_static_data/import_data.py"
        //"python ./data_tools/src/import_static_data/load_db.py && DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/team_leader_data.json5 python ./data_tools/src/import_static_data/import_data.py"
      ]
    }
  }

  secret {
    name  = "pgpassword"
    value = data.azurerm_key_vault_secret.ops-pw.value
  }
}
