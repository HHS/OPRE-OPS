locals {
  content_types = {
    ".json"  = "application/json",
    ".ico"   = "image/x-icon",
    ".html"  = "text/html",
    ".png"   = "image/png",
    ".jpg"   = "image/jpeg",
    ".txt"   = "text/plain",
    ".js"    = "application/javascript",
    ".css"   = "text/css",
    ".map"   = "application/json",
    ".woff2" = "font/woff2",
    ".svg"   = "image/svg+xml",
    # Add more extensions and content types as needed
  }
}

## Build the react app
resource "null_resource" "build" {
  triggers = {
    backend_domain = "https://${module.ctx.labels.sbe.resourceNames["azurerm_container_app"]}.${data.azurerm_container_app_environment.aca_env.default_domain}"
    commit         = var.commit_hash
  }

  provisioner "local-exec" {

    working_dir = var.frontend_dir
    command     = "yarn build:terraform"

    environment = {
      REACT_APP_BACKEND_DOMAIN = self.triggers.backend_domain
    }
  }
}

## Use terraform data source for files to get hashes
data "local_file" "fileset_hash" {
  for_each = fileset("${var.frontend_dir}/build", "**/*.*")

  filename   = "${var.frontend_dir}/build/${each.value}"
  depends_on = [null_resource.build]
}

## "Deploy"
resource "azurerm_storage_blob" "site" {
  for_each               = data.local_file.fileset_hash
  name                   = trimprefix(each.value.filename, "${var.frontend_dir}/build/")
  storage_account_name   = module.ctx.labels.sfe.resourceNames["azurerm_storage_account"]
  storage_container_name = "$web"
  type                   = "Block"
  source                 = each.value.filename #"../../../../frontend/build/${each.value}"
  content_type           = local.content_types[lower(regex("\\.[^.]+$", basename(each.value.filename)))]
  content_md5            = each.value.content_md5
}
