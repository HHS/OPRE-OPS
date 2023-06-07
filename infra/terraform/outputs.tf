output "container_ipv4_address" {
  value = azurerm_container_group.api.ip_address
}

output "spa_endpoint" {
  description = "The endpoint of the static website"
  value       = azurerm_storage_account.sa.primary_web_endpoint
}
