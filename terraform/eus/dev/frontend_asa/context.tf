module "ctx" {
  source          = "git::https://github.com/HHS/OPRE-OPS.git//terraform/global/context?ref=tf-global-context-v0.0.2"
  environment     = var.environment
  custom_workload = "be4s"

}
