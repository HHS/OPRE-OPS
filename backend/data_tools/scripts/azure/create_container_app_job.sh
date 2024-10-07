#!/usr/bin/env bash

RESOURCE_GROUP_NAME=$1
MI_NAME=$2

# Create a resource group
az group create --name "${RESOURCE_GROUP_NAME}" --location eastus

# Create a container app environment
#az containerapp env create \
#  --name "opre-ops-test-app-cae" \
#  --resource-group "${RESOURCE_GROUP_NAME}" \
#  --location eastus

# Get the managed identity id
MI_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query id --output tsv)

# Create a container app job
az containerapp job create \
  --name "data-tools-test-job" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --image "opreopstest.azurecr.io/data-tools-test:latest" \
  --cpu 0.25 \
  --memory 0.5Gi \
  --trigger-type Manual \
  --args "/bin/ash, -c, ./data_tools/scripts/get_csv.sh azure" \
  --parallelism 1 \
  --replica-timeout 600 \
  --replica-retry-limit 0 \
  --replica-completion-count 1 \
  --environment opre-ops-test-app-cae \
  --registry-identity "${MI_ID}" \
  --registry-server "opreopstest.azurecr.io" \
  --env-vars ENV=azure PGUSER=ops ADMIN_PGUSER=psqladmin PGPASSWORD="Lkw1JFarYTcZqKOBW46vJ_" ADMIN_PGPASSWORD="tyTZ7XGLJvpKRFT1aH9iS-" PGHOST=opre-ops-dev-db-pg-server.postgres.database.azure.com PGPORT=5432 ADMIN_PGHOST=opre-ops-dev-db-pg-server.postgres.database.azure.com ADMIN_PGPORT=5432 PGDATABASE=postgres
