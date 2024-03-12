variable "resourceGroupName" {}

variable "containerAppName" {}

variable "containerAppEnvId" {}

variable "containerName" {}

variable "tags" {}

variable "containerImage" {}

variable "containerImageTag" {}

variable "containerPort" {
  default = null
}

variable "containerCpu" {
  type    = string
  default = "0.25"
}

variable "containerMem" {
  type    = string
  default = "0.5Gi"
}

variable "env" {
  type = list(object({
    name        = string
    value       = optional(string)
    secret_name = optional(string)
  }))
}

variable "secrets" {}

variable "minReplicas" {
  type    = number
  default = 1
}

variable "maxReplicas" {
  type    = number
  default = 10
}

variable "containerCommand" {
  default = null
}

variable "enableIngress" {
  default = true
}