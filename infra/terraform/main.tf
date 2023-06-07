resource "random_pet" "rg_name" {
  prefix = var.resource_group_name_prefix
}

resource "azurerm_resource_group" "rg" {
  name     = random_pet.rg_name.id
  location = var.resource_group_location
}

resource "random_string" "container_name" {
  length  = 8
  lower   = true
  upper   = false
  special = false
}

resource "azurerm_container_group" "api" {
  name                = "${var.container_group_name_prefix}-api-${random_string.container_name.result}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = "opre-api-acr"
  ip_address_type     = "Public"
  os_type             = "Linux"
  restart_policy      = var.restart_policy

  container {
    name   = "${var.container_name_prefix}-${random_string.container_name.result}"
    image  = var.api_image
    cpu    = var.cpu_cores
    memory = var.memory_in_gb
    environment_variables = var.api_env
    commands = [
        "bash",
        "-c",
        "python -m flask run --debug --host=0.0.0.0 --port=8080"
    ]

    ports {
      port     = var.port
      protocol = "TCP"
    }
  }
}

resource "azurerm_container_group" "data_import" {
  name                = "${var.container_group_name_prefix}-data-import-${random_string.container_name.result}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = "opre-api-acr"
  ip_address_type     = "Public"
  os_type             = "Linux"
  restart_policy      = "Never"

  container {
    name   = "${var.container_name_prefix}-${random_string.container_name.result}"
    image  = var.import_image
    cpu    = var.cpu_cores
    memory = var.memory_in_gb
    environment_variables = var.import_env
    commands = [
        "bash",
        "-c",
        "python ./data_tools/src/import_static_data/load_db.py && DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py && DATA=./data_tools/data/team_leader_data.json5 python ./data_tools/src/import_static_data/import_data.py"
    ]

    ports {
      port     = "8089"
      protocol = "TCP"
    }
  }
}

// Create a storage account
resource "azurerm_storage_account" "sa" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_account_replication_type

  static_website {
    index_document = "index.html"
    error_404_document = "404.html"
  }
}

// Create a blob container
resource "azurerm_storage_container" "sc" {
  name                  = var.container_name
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "blob"
}
