#!/bin/bash

RESOURCE_GROUP_NAME=$1

# Create a resource group
az group create --name "${RESOURCE_GROUP_NAME}" --location eastus

# Delete a resource group
# az group delete --name "${RESOURCE_GROUP_NAME}" --yes --no-wait
