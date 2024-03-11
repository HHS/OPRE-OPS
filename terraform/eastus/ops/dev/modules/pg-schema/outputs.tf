# Output the secret name and location
output "key_vault_secret" {
  value = {
    name   = azurerm_key_vault_secret.role_password.name
    url    = azurerm_key_vault_secret.role_password.id
    raw_pw = local.password
  }
}