variable "owner" {
  description = "Name of the owner of the workload and resources"
  type        = string
  default     = "OPRE"
}

variable "project" {
  description = "Project name that resources fall under"
  type        = string
  default     = "ops"
}

variable "environment" {
  description = "Environment tag for the resources"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure location for the resources"
  type        = string
  default     = "eastus"
}