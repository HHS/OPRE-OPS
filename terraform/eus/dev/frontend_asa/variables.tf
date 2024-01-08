variable "frontend_dir" {
  type        = string
  description = "Relative path to frontend app directory"
  default     = "../../../../frontend"
}

variable "environment" {
  description = "Environment tag for the resources"
  type        = string
  default     = "dev"
}
