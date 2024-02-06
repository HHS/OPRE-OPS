
output "resource_group_name" {
  value       = module.label[var.default_workload].resourceNames["azurerm_resource_group"]
  description = "This is the resource group name for the core (default) workload"
}

output "owner" {
  value       = var.owner
  description = "The owner of the project and resources"
}

output "project" {
  value       = var.project
  description = "The specific project name"
}

output "location" {
  value       = var.location
  description = "The location where these resources will be added / labelled"
}

output "environment" {
  value       = var.environment
  description = "The environment scope for the project resources."
}

output "labels" {
  value       = module.label
  description = "This is the map of all the labelling values and tags."
}
