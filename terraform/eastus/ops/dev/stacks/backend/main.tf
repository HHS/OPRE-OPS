module "backend" {
  source            = "../../modules/container-app"
  containerAppName  = var.backendName
  containerAppEnvId = data.azurerm_container_app_environment.aca_env.id
  resourceGroupName = var.resourceGroupName
  containerName     = var.backendName
  containerImage    = "ghcr.io/hhs/opre-ops/ops-backend"
  containerImageTag = var.containerImageTag
  containerPort     = 8080
  env = [
    {
      name  = "OPS_CONFIG"
      value = "environment/azure/${var.environment}.py"
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
    {
      name        = "JWT_PRIVATE_KEY"
      secret_name = "jwt-private-key"
    },
    {
      name  = "OPS_FRONTEND_URL"
      value = "https://${var.environment}.${var.dnsZoneName}"  //"${var.frontendName}.${data.azurerm_container_app_environment.aca_env.default_domain}"
    }
  ]
  secrets = [

    {
      name  = "pgpassword"
      value = data.azurerm_key_vault_secret.ops-pw.value
    },
    {
      name  = "jwt-private-key"
      value = data.azurerm_key_vault_secret.ops-jwt-private-key.value
    },
  ]
  tags = {}
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

data "azurerm_key_vault_secret" "ops-pw" {
  name         = "ops-role-password"
  key_vault_id = data.azurerm_key_vault.vault.id
}

data "azurerm_key_vault_secret" "ops-jwt-private-key" {
  name         = "ops-jwt-private-key"
  key_vault_id = data.azurerm_key_vault.vault.id
}
