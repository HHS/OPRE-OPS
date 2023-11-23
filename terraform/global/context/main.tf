locals {
  workload_list = distinct(concat(var.workload_list, [var.default_workload, "tf"]))
}

variable "default_workload" {
  type        = string
  description = "This is the default workload"
  default     = "core"
}

variable "workload_list" {
  type        = list(any)
  description = "This is a list of all the types of workloads in the project"
  default     = ["core", "db", "fe", "be", "tf"]
}

variable "owner" {
  type        = string
  description = "This is the owner of the project."
  default     = "opre"
}

variable "project" {
  type        = string
  description = "This is the project name."
  default     = "ops"
}

variable "location" {
  type        = string
  description = "This is the location that the resources will be in Azure"
  default     = "eastus"
}

variable "environment" {
  type        = string
  description = "This is the environment that the resources will be a part of."
  default     = "dev"
}

module "label" {
  for_each    = toset(local.workload_list)
  source      = "git@github.com:devops-chris/tf-azure-labels.git?ref=v0.1.3"
  owner       = var.owner
  project     = var.project
  location    = var.location
  environment = var.environment
  workload    = each.value
}

output "resource_group_name" {
  value = module.label[var.default_workload].resourceNames["azurerm_resource_group"]
}

output "owner" {
  value = var.owner
}

output "project" {
  value = var.project
}

output "location" {
  value = var.location
}

output "environment" {
  value = var.environment
}

output "labels" {
  value = module.label
}
