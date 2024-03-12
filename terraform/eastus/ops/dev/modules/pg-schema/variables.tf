## variables
variable "dbName" {
  type        = string
  description = "The name of the db to add schema"
  default     = "postgres"
}

variable "schemaName" {
  type        = string
  description = "The name of the psql schema"
}

variable "roleName" {
  type        = string
  description = "The name of the role"
}

variable "rolePassword" {
  type        = string
  description = "The admin password"
  default     = ""
}

variable "privileges" {
  type        = list(any)
  description = "The privileges to assign to role"
  default     = ["ALL"]
}

variable "keyVaultId" {
  type        = string
  description = "ID of the vault for storing password"
}

variable "dbPort" {
  type        = number
  description = "The database port (Default: 5432)"
  default     = 5432
}

variable "dbServerName" {
  type        = string
  description = "The server name of the postgres database server"
}
