## Build the react app
resource "null_resource" "build" {
  triggers = {
    backend_domain = "https://${module.ctx.labels.sbe.resourceNames["azurerm_container_app"]}.${data.azurerm_container_app_environment.aca_env.default_domain}"
    commit         = var.commit_hash
    always_build   = timestamp()
  }

  provisioner "local-exec" {

    working_dir = var.frontend_dir
    command     = "bun run build"

    environment = {
      REACT_APP_BACKEND_DOMAIN = self.triggers.backend_domain
      VITE_BACKEND_DOMAIN = self.triggers.backend_domain
    }
  }
}
