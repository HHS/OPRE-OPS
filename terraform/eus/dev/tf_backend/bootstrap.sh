#!/bin/bash

echo "Enter the owner:"
read owner

echo "Enter the project:"
read project

# echo "Enter the workload (optional):"
# read workload

echo "Enter the Azure location for the resources (default is 'eastus'):"
read location

echo "Enter the environment tag for the resources (default is 'dev'):"
read environment

location=${location:-eastus}
environment=${environment:-dev}
workload=${workload:-tf}

# Write the values to the default terraform.tfvars file
cat <<EOF > terraform.tfvars
owner = "$owner"
project = "$project"
location = "$location"
environment = "$environment"
workload = "$workload"
EOF

# Initialize Terraform
terraform init

# Apply Terraform configuration
terraform apply --auto-approve

terraform fmt

# Re-initialize Terraform with the backend configuration
terraform init -migrate-state --auto-approve

echo "Bootstrap is complete... check the newly generated README.md for next steps."
