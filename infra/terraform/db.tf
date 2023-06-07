

# resource "azurerm_postgresql_server" "db_server" {
#   name                = "postgresql-server-1"
#   location            = azurerm_resource_group.rg.location
#   resource_group_name = "opre-api-acr"

#   sku_name = "Standard_B1ms"

#   storage_mb                   = 5120
#   backup_retention_days        = 7
#   geo_redundant_backup_enabled = false
#   auto_grow_enabled            = true

#   administrator_login          = "psqladmin"
#   administrator_login_password = "H@Sh1CoR3"
#   version                      = "14"
#   ssl_enforcement_enabled      = true
# }

# resource "azurerm_postgresql_database" "ops_db" {
#   name                = "ops"
#   resource_group_name = azurerm_resource_group.rg.name
#   server_name         = azurerm_postgresql_server.db_server.name
#   charset             = "UTF8"
#   collation           = "English_United States.1252"
# }
