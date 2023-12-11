variable "commit_hash" {
  type        = string
  description = "Git Commit Hash to which this is built to"
  default     = "noworky"
}

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
