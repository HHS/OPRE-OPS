#!/bin/bash

RESOURCE_GROUP_NAME=$1
VAULT_NAME=$2
FILE_STORAGE_ACCESS_KEY=$3
MI_NAME=$4
#SUBSCRIPTION_ID=$5

# Create a azure vault
az keyvault create \
  --name "${VAULT_NAME}" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --location eastus \
  --add accessPolicies objectId="${MI_NAME}" secret-permissions get list set

# Add a role assignment
#az role assignment create \
#  --role "Key Vault Secrets Officer" \
#  --assignee "${ROLE_EMAIL}"\
#  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.KeyVault/vaults/${VAULT_NAME}"

# Add a secret to the vault
az keyvault secret set --vault-name "${VAULT_NAME}-kv" --name "file-storage-access-key" --value "${FILE_STORAGE_ACCESS_KEY}"
