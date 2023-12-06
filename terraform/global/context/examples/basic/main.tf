##
# This example primarily uses the defaults, which are specific to OPRE-OPS

module "ctx" {
  source      = "../../"
  environment = "example" // Might typically be "dev", "stg", "prod"
}

output module_outputs {
    value = module.ctx
}
