output "resource_group_name" {
  value = module.labels.resourceNames["azurerm_resource_group"]
}

output "storage_account_name" {
  value = module.labels.resourceNames["azurerm_storage_account"]
}

output "container_name" {
  value = module.labels.resourceNames["azurerm_storage_container"]
}