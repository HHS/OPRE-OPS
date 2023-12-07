##
# This example primarily uses the defaults, which are specific to OPRE-OPS

module "ctx" {
  source      = "git::https://github.com/HHS/OPRE-OPS.git//terraform/global/context?ref=tf-global-context-v0.0.1"
  environment = "example" // Might typically be "dev", "stg", "prod"
}

output module_outputs {
    value = module.ctx
}
