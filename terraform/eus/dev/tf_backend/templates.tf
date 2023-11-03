
locals {
  backend_config = templatefile("${path.module}/templates/terraform.tf.tmpl", {
    resource_group_name  = module.labels.resourceNames["azurerm_resource_group"]
    storage_account_name = module.labels.resourceNames["azurerm_storage_account"]
    container_name       = module.labels.resourceNames["azurerm_storage_container"]
  })
  readme_content = templatefile("${path.module}/templates/readme.md.tmpl", {
    resource_group_name  = module.labels.resourceNames["azurerm_resource_group"]
    storage_account_name = module.labels.resourceNames["azurerm_storage_account"]
    container_name       = module.labels.resourceNames["azurerm_storage_container"]
  })
}

resource "local_file" "backend_conf" {
  content  = local.backend_config
  filename = "${path.module}/terraform.tf"
}

resource "local_file" "readme" {
  content  = local.readme_content
  filename = "${path.module}/README.md"
}
