variable "backendName" {}
variable "containerAppEnvName" {}
variable "resourceGroupName" {}
variable "environment" {}
variable "dnsZoneName" {}

variable "containerImageTag" {
  description = "Container image tag"
  type        = string
  default     = "7f2790a9b3770ad2ac34e59d0b81cb01227f2dd0"
}

variable "postgresServerName" {}
variable "keyVaultName" {}