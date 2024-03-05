variable "frontendName" {}
variable "containerAppEnvName" {}
variable "resourceGroupName" {}
variable "environment" {}
variable "dnsZoneName" {}

variable "containerImageTag" {
  description = "Container image tag"
  type        = string
  default     = "unstable"
}
