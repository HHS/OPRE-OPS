locals {
  password = var.rolePassword == "" ? random_password.role_password.0.result : var.rolePassword
  privilegesMap = {
    "ALL" = [
      "CREATE",
      "USAGE"
    ]
  }
  privileges = flatten([
    for priv in var.privileges :
    local.privilegesMap[priv] != null ? local.privilegesMap[priv] : [priv]
  ])
}

## Trigger Hack
resource "null_resource" "trigger" {
  # This resource does nothing but create a trigger
  triggers = {
    always_run = timestamp()
  }
}


## Create Schema
resource "postgresql_schema" "schema" {
  name         = var.schemaName
  drop_cascade = true
  lifecycle {
    replace_triggered_by = [
      null_resource.trigger
    ]
  }
}

## Create Role
resource "postgresql_role" "role" {
  name     = var.roleName
  login    = true
  password = local.password
}

## Grant Role privileges on schema
resource "postgresql_grant" "grant" {
  database    = var.dbName
  role        = postgresql_role.role.name
  schema      = postgresql_schema.schema.name
  object_type = "schema"
  privileges  = local.privileges
  lifecycle {
    replace_triggered_by = [
      postgresql_schema.schema
    ]
  }
}

## Create Admin Password
resource "random_password" "role_password" {
  count            = var.rolePassword == "" ? 1 : 0
  length           = 22
  min_numeric      = 1
  override_special = "_!$.-^"
}

## Create Vault Secret
resource "azurerm_key_vault_secret" "role_password" {
  name         = "${var.roleName}-role-password"
  value        = local.password
  key_vault_id = var.keyVaultId
  content_type = "password"
}
