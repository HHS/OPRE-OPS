#!/bin/bash

MI_NAME=$1
RESOURCE_GROUP_NAME=$2

# Create a resource group
az group create --name "${RESOURCE_GROUP_NAME}" --location eastus

# Create a user managed identity
az identity create --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}"

# Delete a user managed identity
# az identity delete --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}"
