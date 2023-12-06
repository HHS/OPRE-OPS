# Terraform Module: Global Context

## Introduction
This is a module intended to be shared across a project that provides some standard naming, labelling, and context when imported.

## Usage
While this module can be customized and used in other projects, it is intended to support the OPRE OPS Project and has opinionated default values designed to lessen the need to bring your own context into each component of the Terraform project. There are more examples in the [examples](./examples) directory.

## Basic Example Usage 

```hcl
module "ctx" {
  source      = "./" # Location where this module lives. 
  environment = "dev"
}

resource "azurerm_storage_account" "example" {
  name                     = module.ctx.labels.core.resourceNames["azurerm_storage_account"]
  resource_group_name      = module.ctx.resource_group_name
  location                 = module.ctx.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

## Example Output
Below is an example of the output that this module might generate:

```hcl
labels = {
    environment         = "example"
    labels              = {
        ""   = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-cae"
                azurerm_container_registry         = "opre-ops-example-eus-acr"
                azurerm_function_app               = "opre-ops-example-eus-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-law"
                azurerm_logic_app                  = "opre-ops-example-eus-la"
                azurerm_monitor                    = "opre-ops-example-eus-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-pe"
                azurerm_resource_group             = "opre-ops-example-eus-rg"
                azurerm_storage_account            = "opreopsexampleeusst"
                azurerm_storage_container          = "opre-ops-example-eus-sc"
                azurerm_subnet                     = "opre-ops-example-eus-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "Unknown"
            }
        }
        be   = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-be-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-be-cae"
                azurerm_container_registry         = "opre-ops-example-eus-be-acr"
                azurerm_function_app               = "opre-ops-example-eus-be-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-be-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-be-law"
                azurerm_logic_app                  = "opre-ops-example-eus-be-la"
                azurerm_monitor                    = "opre-ops-example-eus-be-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-be-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-be-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-be-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-be-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-be-pe"
                azurerm_resource_group             = "opre-ops-example-eus-be-rg"
                azurerm_storage_account            = "opreopsexampleeusbest"
                azurerm_storage_container          = "opre-ops-example-eus-be-sc"
                azurerm_subnet                     = "opre-ops-example-eus-be-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-be-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "be"
            }
        }
        core = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-core-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-core-cae"
                azurerm_container_registry         = "opre-ops-example-eus-core-acr"
                azurerm_function_app               = "opre-ops-example-eus-core-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-core-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-core-law"
                azurerm_logic_app                  = "opre-ops-example-eus-core-la"
                azurerm_monitor                    = "opre-ops-example-eus-core-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-core-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-core-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-core-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-core-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-core-pe"
                azurerm_resource_group             = "opre-ops-example-eus-core-rg"
                azurerm_storage_account            = "opreopsexampleeuscorest"
                azurerm_storage_container          = "opre-ops-example-eus-core-sc"
                azurerm_subnet                     = "opre-ops-example-eus-core-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-core-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "core"
            }
        }
        db   = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-db-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-db-cae"
                azurerm_container_registry         = "opre-ops-example-eus-db-acr"
                azurerm_function_app               = "opre-ops-example-eus-db-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-db-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-db-law"
                azurerm_logic_app                  = "opre-ops-example-eus-db-la"
                azurerm_monitor                    = "opre-ops-example-eus-db-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-db-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-db-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-db-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-db-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-db-pe"
                azurerm_resource_group             = "opre-ops-example-eus-db-rg"
                azurerm_storage_account            = "opreopsexampleeusdbst"
                azurerm_storage_container          = "opre-ops-example-eus-db-sc"
                azurerm_subnet                     = "opre-ops-example-eus-db-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-db-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "db"
            }
        }
        dt   = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-dt-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-dt-cae"
                azurerm_container_registry         = "opre-ops-example-eus-dt-acr"
                azurerm_function_app               = "opre-ops-example-eus-dt-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-dt-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-dt-law"
                azurerm_logic_app                  = "opre-ops-example-eus-dt-la"
                azurerm_monitor                    = "opre-ops-example-eus-dt-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-dt-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-dt-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-dt-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-dt-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-dt-pe"
                azurerm_resource_group             = "opre-ops-example-eus-dt-rg"
                azurerm_storage_account            = "opreopsexampleeusdtst"
                azurerm_storage_container          = "opre-ops-example-eus-dt-sc"
                azurerm_subnet                     = "opre-ops-example-eus-dt-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-dt-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "dt"
            }
        }
        fe   = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-fe-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-fe-cae"
                azurerm_container_registry         = "opre-ops-example-eus-fe-acr"
                azurerm_function_app               = "opre-ops-example-eus-fe-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-fe-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-fe-law"
                azurerm_logic_app                  = "opre-ops-example-eus-fe-la"
                azurerm_monitor                    = "opre-ops-example-eus-fe-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-fe-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-fe-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-fe-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-fe-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-fe-pe"
                azurerm_resource_group             = "opre-ops-example-eus-fe-rg"
                azurerm_storage_account            = "opreopsexampleeusfest"
                azurerm_storage_container          = "opre-ops-example-eus-fe-sc"
                azurerm_subnet                     = "opre-ops-example-eus-fe-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-fe-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "fe"
            }
        }
        sbe  = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-sbe-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-sbe-cae"
                azurerm_container_registry         = "opre-ops-example-eus-sbe-acr"
                azurerm_function_app               = "opre-ops-example-eus-sbe-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-sbe-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-sbe-law"
                azurerm_logic_app                  = "opre-ops-example-eus-sbe-la"
                azurerm_monitor                    = "opre-ops-example-eus-sbe-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-sbe-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-sbe-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-sbe-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-sbe-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-sbe-pe"
                azurerm_resource_group             = "opre-ops-example-eus-sbe-rg"
                azurerm_storage_account            = "opreopsexampleeussbest"
                azurerm_storage_container          = "opre-ops-example-eus-sbe-sc"
                azurerm_subnet                     = "opre-ops-example-eus-sbe-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-sbe-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "sbe"
            }
        }
        sfe  = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-sfe-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-sfe-cae"
                azurerm_container_registry         = "opre-ops-example-eus-sfe-acr"
                azurerm_function_app               = "opre-ops-example-eus-sfe-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-sfe-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-sfe-law"
                azurerm_logic_app                  = "opre-ops-example-eus-sfe-la"
                azurerm_monitor                    = "opre-ops-example-eus-sfe-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-sfe-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-sfe-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-sfe-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-sfe-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-sfe-pe"
                azurerm_resource_group             = "opre-ops-example-eus-sfe-rg"
                azurerm_storage_account            = "opreopsexampleeussfest"
                azurerm_storage_container          = "opre-ops-example-eus-sfe-sc"
                azurerm_subnet                     = "opre-ops-example-eus-sfe-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-sfe-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "sfe"
            }
        }
        tf   = {
            resourceNames = {
                azurerm_container_app              = "opre-ops-example-eus-tf-ca"
                azurerm_container_app_environment  = "opre-ops-example-eus-tf-cae"
                azurerm_container_registry         = "opre-ops-example-eus-tf-acr"
                azurerm_function_app               = "opre-ops-example-eus-tf-fa"
                azurerm_key_vault                  = "opre-ops-example-eus-tf-kv"
                azurerm_log_analytics_workspace    = "opre-ops-example-eus-tf-law"
                azurerm_logic_app                  = "opre-ops-example-eus-tf-la"
                azurerm_monitor                    = "opre-ops-example-eus-tf-mon"
                azurerm_network_security_group     = "opre-ops-example-eus-tf-nsg"
                azurerm_postgresql_flexible_server = "opre-ops-example-eus-tf-psql"
                azurerm_postgresql_server          = "opre-ops-example-eus-tf-psql"
                azurerm_private_dns_zone           = "opre-ops-example-eus-tf-pdz"
                azurerm_private_endpoint           = "opre-ops-example-eus-tf-pe"
                azurerm_resource_group             = "opre-ops-example-eus-tf-rg"
                azurerm_storage_account            = "opreopsexampleeustfst"
                azurerm_storage_container          = "opre-ops-example-eus-tf-sc"
                azurerm_subnet                     = "opre-ops-example-eus-tf-sn"
                azurerm_virtual_network            = "opre-ops-example-eus-tf-vnet"
            }
            tags          = {
                Environment = "example"
                Owner       = "opre"
                Project     = "ops"
                Workload    = "tf"
            }
        }
    }
    location            = "eastus"
    owner               = "opre"
    project             = "ops"
    resource_group_name = "opre-ops-example-eus-core-rg"
``````
