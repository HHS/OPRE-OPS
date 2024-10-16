#!/usr/bin/env bash

RESOURCE_GROUP_NAME=$1
MI_NAME=$2
CAE_NAME=$3
REGISTRY_NAME=$4

# Get the managed identity id
MI_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query id --output tsv)
MI_CLIENT_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query clientId --output tsv)
MI_OBJECT_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query principalId --output tsv)

# Create a container app job
az containerapp job create \
  --name "data-tools-test-job" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --image "${REGISTRY_NAME}.azurecr.io/data-tools-test:latest" \
  --cpu 0.25 \
  --memory 0.5Gi \
  --trigger-type Manual \
  --args "/bin/ash, -c, ./data_tools/scripts/get_csv.sh azure https://tsytx8kx85test.blob.core.windows.net/data/can.tsv https://tsytx8kx85test.blob.core.windows.net/data/can.tsv" \
  --parallelism 1 \
  --replica-timeout 600 \
  --replica-retry-limit 0 \
  --replica-completion-count 1 \
  --environment "${CAE_NAME}" \
  --registry-identity "${MI_ID}" \
  --registry-server "${REGISTRY_NAME}.azurecr.io" \
  --env-vars ENV=azure FILE_STORAGE_AUTH_METHOD=mi MI_CLIENT_ID="${MI_CLIENT_ID}" MI_OBJECT_ID="${MI_OBJECT_ID}" PGUSER="${PGUSER}" ADMIN_PGUSER="${ADMIN_PGUSER}" PGPASSWORD="${PGPASSWORD}" ADMIN_PGPASSWORD="${ADMIN_PGPASSWORD}" PGHOST="${PGHOST}" PGPORT="${PGPORT}" ADMIN_PGHOST="${ADMIN_PGHOST}" ADMIN_PGPORT="${ADMIN_PGPORT}" PGDATABASE="${PGDATABASE}"
