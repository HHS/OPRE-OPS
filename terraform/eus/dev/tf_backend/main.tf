# Need to know the name of the workload and or project. 
# May need to preformat, pass to labelling module and create resources based on that. 

module "labels" {
  source      = "git@github.com:devops-chris/tf-azure-labels.git?ref=v0.1.0"
  owner       = "opre"
  project     = "ops"
  location    = "eastus"
  environment = "dev"
  workload    = "tf"
}

resource "azurerm_resource_group" "rg" {
  name     = module.labels.resourceNames["azurerm_resource_group"] //"opre-ops-dev-eus-tf-rg" //var.resource_group_name // <project>-<workload>-<env>-<location>-terraform ex. opre-ops-dev-use1-terraform
  location = var.location

  tags = module.labels.tags
}

resource "azurerm_storage_account" "sa" {
  name                     = module.labels.resourceNames["azurerm_storage_account"] //"opreopsdeveustfsa"//var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = module.labels.tags

}

resource "azurerm_storage_container" "sc" {
  name                 = module.labels.resourceNames["azurerm_storage_container"] //"opre-ops-dev-eus-tf-sc"//var.container_name
  storage_account_name = azurerm_storage_account.sa.name

}


