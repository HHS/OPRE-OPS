locals {
  workload_list = distinct(concat(var.workload_list, [var.default_workload, "tf", var.custom_workload]))
}

module "label" {
  for_each    = toset(local.workload_list)
  source      = "git@github.com:devops-chris/tf-azure-labels.git?ref=v0.1.3"
  owner       = var.owner
  project     = var.project
  location    = var.location
  environment = var.environment
  workload    = each.value
}
