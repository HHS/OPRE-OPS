module "data-tools" {
  source            = "../../modules/container-app"
  containerAppName  = "opre-ops-data-tools"
  containerAppEnvId = data.azurerm_container_app_environment.aca_env.id
  resourceGroupName = var.resourceGroupName
  containerName     = "opre-ops-data-tools"
  containerImage    = "ghcr.io/hhs/opre-ops/ops-data-tools"
  containerImageTag = var.containerImageTag
  enableIngress     = false
  minReplicas       = 0
  maxReplicas       = 1
  # containerCommand = [
  #   "bash",
  #   "-c",
  #   "python ./data_tools/src/import_static_data/load_db.py && DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/vendor_and_contact_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/first_contract_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/workflow_data.json5 python ./data_tools/src/import_static_data/import_data.py"
  #   //"python ./data_tools/src/import_static_data/load_db.py && DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/team_leader_data.json5 python ./data_tools/src/import_static_data/import_data.py"
  # ]
  env = [
    {
      name  = "ENV"
      value = "azure"
    },
    {
      name  = "PGUSER"
      value = "ops"
    },
    {
      name        = "PGPASSWORD"
      secret_name = "pgpassword"
    },
    {
      name  = "PGHOST"
      value = data.azurerm_postgresql_flexible_server.ops_dbs.fqdn
    },
    {
      name  = "PGPORT"
      value = 5432
    },
    {
      name  = "PGDATABASE"
      value = "postgres"
    },
  ]
  secrets = [

    {
      name  = "pgpassword"
      value = module.ops_schema.key_vault_secret.raw_pw
    },
  ]
  tags = {}
  # depends_on = [module.ops_schema]
}

data "azurerm_container_app_environment" "aca_env" {
  name                = var.containerAppEnvName
  resource_group_name = var.resourceGroupName
}

data "azurerm_postgresql_flexible_server" "ops_dbs" {
  name                = var.postgresServerName
  resource_group_name = var.resourceGroupName
}

data "azurerm_key_vault" "vault" {
  name                = var.keyVaultName
  resource_group_name = var.resourceGroupName
}

# data "azurerm_key_vault_secret" "ops-pw" {
#   name         = "ops-role-password"
#   key_vault_id = data.azurerm_key_vault.vault.id
#   depends_on = [module.ops_schema]
# }

# data "azurerm_key_vault_secret" "ops-jwt-private-key" {
#   name         = "ops-jwt-private-key"
#   key_vault_id = data.azurerm_key_vault.vault.id
# }


# module "ops_schema" {
#   source       = "../../modules/pg-schema"
#   schemaName   = "ops"
#   roleName     = "ops"
#   keyVaultId   = data.azurerm_key_vault.vault.id
#   dbServerName = var.postgresServerName
#   # lifecycle {
#   #   replace_triggered_by = [
#   #     module.data-tools
#   #   ]
#   # }
# }
