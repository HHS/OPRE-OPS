variable "containerAppEnvName" {}
variable "resourceGroupName" {}

# variable "containerName" {
#   description = "Name of the container"
#   type        = string
# }

# variable "containerImage" {
#   description = "Container image"
#   type        = string
# }

variable "containerImageTag" {
  description = "Container image tag"
  type        = string
  default     = "unstable"
}

# variable "cpu" {
#   description = "CPU requirements. This has specific ration with memory... (beta)"
#   type        = number
#   default     = 0.25
# }

# variable "memory" {
#   description = "Memory requirements. This has specific ration with cpu... (beta)"
#   type        = string
#   default     = "0.5Gi"
# }

# variable "port" {
#   description = "Port for application"
#   type        = number
#   default     = 3000
# }

variable "postgresServerName" {}
variable "keyVaultName" {}