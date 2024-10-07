#!/bin/bash

RESOURCE_GROUP_NAME=$1
REGISTRY_NAME=$2
MI_NAME=$3
SUBSCRIPTION_ID=$4

# Create a resource group
az group create --name "${RESOURCE_GROUP_NAME}" --location eastus

# Create a container registry
az acr create --name "${REGISTRY_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --sku Basic

# Create a user managed identity
az identity create --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}"

# Get the managed identity id
MI_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query principalId --output tsv)

# Assign a role with managed identity to the container registry
az role assignment create \
  --role "AcrPull" \
  --assignee "${MI_ID}" \
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP_NAME}/providers/Microsoft.ContainerRegistry/registries/${REGISTRY_NAME}"
