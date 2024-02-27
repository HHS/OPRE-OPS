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
  default     = "902c0296d292a73ab6d66d39c2cc9a7fdfd387d0"
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