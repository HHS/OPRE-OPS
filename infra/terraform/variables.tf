variable "resource_group_location" {
  type        = string
  default     = "eastus"
  description = "Location for all resources."
}

variable "resource_group_name_prefix" {
  type        = string
  default     = "rg-ops"
  description = "Prefix of the resource group name that's combined with a random value so name is unique in your Azure subscription."
}

variable "container_group_name_prefix" {
  type        = string
  description = "Prefix of the container group name that's combined with a random value so name is unique in your Azure subscription."
  default     = "acigroup-ops"
}

variable "container_name_prefix" {
  type        = string
  description = "Prefix of the container name that's combined with a random value so name is unique in your Azure subscription."
  default     = "aci-ops"
}

variable "api_image" {
  type        = string
  description = "Container image to deploy. Should be of the form repoName/imagename:tag for images stored in public Docker Hub, or a fully qualified URI for other registries. Images from private registries require additional registry credentials."
  // default     = "mcr.microsoft.com/azuredocs/aci-helloworld"
  default     = "ghcr.io/hhs/opre-ops/ops-backend:v0.0.11"
}

variable "api_env" {
    type = map
    description = "(optional) describe your variable"
    default = {"OPS_CONFIG" = "environment/cloud/azure.py"}
}

variable "import_image" {
    type = string
    description = "(optional) describe your variable"
    default = "ghcr.io/hhs/opre-ops/ops-data-tools:v0.0.7"
}

variable "import_env" {
    type = map
    description = "(optional) describe your variable"
    default = { "ENV" = "azure" }
}

variable "port" {
  type        = number
  description = "Port to open on the container and the public IP address."
  default     = 8080
}

variable "cpu_cores" {
  type        = number
  description = "The number of CPU cores to allocate to the container."
  default     = 1
}

variable "memory_in_gb" {
  type        = number
  description = "The amount of memory to allocate to the container in gigabytes."
  default     = 1
}

variable "restart_policy" {
  type        = string
  description = "The behavior of Azure runtime if container has stopped."
  default     = "Always"
  validation {
    condition     = contains(["Always", "Never", "OnFailure"], var.restart_policy)
    error_message = "The restart_policy must be one of the following: Always, Never, OnFailure."
  }
}

variable "storage_account_name" {
  type        = string
  description = "The name of the storage account."
  default     = "opsspa"
}

variable "storage_account_tier" {
  type        = string
  description = "The storage account tier."
  default     = "Standard"
  validation {
    condition     = contains(["Standard", "Premium"], var.storage_account_tier)
    error_message = "The storage_account_tier must be one of the following: Standard, Premium."
  }
}

variable "storage_account_replication_type" {
  type        = string
  description = "The storage account replication type."
  default     = "LRS"
  validation {
    condition     = contains(["LRS", "GRS", "RAGRS", "ZRS"], var.storage_account_replication_type)
    error_message = "The storage_account_replication_type must be one of the following: LRS, GRS, RAGRS, ZRS."
  }
}

variable "container_name" {
  type        = string
  description = "The name of the container."
  default     = "opsspa-container"
}

variable "source_dir" {
  type        = string
  description = "The source directory of the static website."
  default     = "../../frontend/build"
}
