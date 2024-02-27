output "helloWorldAppFQDN" {
  value = azurerm_container_app.container_app.latest_revision_fqdn
}