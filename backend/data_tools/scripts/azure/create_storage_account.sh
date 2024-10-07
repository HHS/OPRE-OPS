#!/bin/bash

# Standard_LRS is used to save costs - in production, you will probably want to use Standard_ZRS

RESOURCE_GROUP_NAME=$1
STORAGE_ACCOUNT_NAME=$2
ROLE_EMAIL=$3
SUBSCRIPTION_ID=$4
MI_ID=$5

# Create a resource group
#az group create --name "${RESOURCE_GROUP_NAME}" --location eastus

# Create a storage account
az storage account create \
  --name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false

# Assign a role with managed identity to the storage account
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee "${MI_ID}"\
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"

# Get storage account key
az storage account keys list \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --query "[0].value" --output json

# Create a container
az storage container create \
  --name "data" \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --auth-mode login

# Add a role assignment
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee "${ROLE_EMAIL}"\
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.Storage/storageAccounts/${STORAGE_ACCOUNT_NAME}"
