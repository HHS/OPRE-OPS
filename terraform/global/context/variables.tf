variable "default_workload" {
  type        = string
  description = "This is the default workload"
  default     = "core"
}

variable "workload_list" {
  type        = list(any)
  description = "This is a list of all the types of workloads in the project"
  default     = ["core", "db", "fe", "be", "sfe", "sbe", "tf", "dt"]
}

variable "custom_workload" {
  type        = string
  description = "This is an additional ad-hoc single workload to add to the project"
  default     = ""
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
