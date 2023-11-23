variable "environment" {
  description = "Environment tag for the resources"
  type        = string
  default     = "dev"
}

variable "kv_access_group" {
  description = "Map of users and sps with objectid"
  type        = map(any)
  default = {}
}
