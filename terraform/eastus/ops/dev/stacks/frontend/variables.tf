variable "frontendName" {}
variable "containerAppEnvName" {}
variable "resourceGroupName" {}
variable "environment" {}
variable "dnsZoneName" {}

variable "containerImageTag" {
  description = "Container image tag"
  type        = string
  default     = "1a1df030d7b1ceeb07936e06152ff32a52441a8c"
}
