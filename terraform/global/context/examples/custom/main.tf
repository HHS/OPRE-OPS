##
# This example shows that you can use for any project if wanted, or customize for one-off and temporary labels
# Typically you would not do customization unless for temp and testing purposes. 

module "ctx" {
  source      = "git::https://github.com/HHS/OPRE-OPS.git//terraform/global/context?ref=tf-global-context-v0.0.1"
  environment = "custom" // Might typically be "dev", "stg", "prod"
  default_workload = "app" // This is usually core, but can be set. 
  workload_list = ["custom", "temp", "etc"] // Used to define new workloads or to make context output specific to what you need
  custom_workload = "new" // This can be used if you don't want to modify the workload_list but would like to add a specifc workload
  owner = "Flexion"
  project = "example"
  location = "westus"
}

output module_outputs {
    value = module.ctx
}
