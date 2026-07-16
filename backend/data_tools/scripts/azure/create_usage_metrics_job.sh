#!/usr/bin/env bash

# Creates the scheduled Usage Metrics report Container App Job (#4148).
#
# This is the first *scheduled* job in the repo. It runs weekly and uploads a usage report CSV
# to Blob storage for the UX team. Deploy to STAGING first (staging DB / storage account / MI),
# gather UX feedback, then rerun against production values.
#
# Cron: "50 4 * * 1" == 04:50 UTC Monday. Azure cron is UTC-only, so this is a fixed UTC time
# that lands late Sunday night US Central (23:50 CDT in summer / 22:50 CST in winter) -- always
# Sunday night Central, well before Monday morning. Do NOT try to encode Central directly.
#
# Required env vars (supply per-environment, pointed at staging for the first deploy):
#   PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE          -- database connection
#   USAGE_METRICS_STORAGE_ACCOUNT_URL                       -- e.g. https://<account>.blob.core.windows.net
#   USAGE_METRICS_CONTAINER_NAME (optional, default "data")
#   USAGE_METRICS_REPORT_PREFIX  (optional, default "reports")
#   USAGE_METRICS_LOOKBACK_DAYS  (optional, default "7")    -- reporting window; keep >= cron period
#
# The job's managed identity must have WRITE access (Storage Blob Data Contributor) on the
# target container -- read access (used for data import) is not sufficient for upload.

RESOURCE_GROUP_NAME=$1
MI_NAME=$2
CAE_NAME=$3
REGISTRY_NAME=$4

# Get the managed identity id
MI_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query id --output tsv)
MI_CLIENT_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query clientId --output tsv)
MI_OBJECT_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query principalId --output tsv)

# Create the scheduled container app job
az containerapp job create \
  --name "usage-metrics-job" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --image "${REGISTRY_NAME}.azurecr.io/data-tools-test:latest" \
  --cpu 0.25 \
  --memory 0.5Gi \
  --trigger-type Schedule \
  --cron-expression "50 4 * * 1" \
  --args "/bin/ash, -c, ./data_tools/scripts/usage_metrics.sh" \
  --parallelism 1 \
  --replica-timeout 1800 \
  --replica-retry-limit 1 \
  --replica-completion-count 1 \
  --environment "${CAE_NAME}" \
  --registry-identity "${MI_ID}" \
  --registry-server "${REGISTRY_NAME}.azurecr.io" \
  --env-vars \
    ENV=azure \
    FILE_STORAGE_AUTH_METHOD=mi \
    MI_CLIENT_ID="${MI_CLIENT_ID}" \
    MI_OBJECT_ID="${MI_OBJECT_ID}" \
    PGUSER="${PGUSER}" \
    PGPASSWORD="${PGPASSWORD}" \
    PGHOST="${PGHOST}" \
    PGPORT="${PGPORT}" \
    PGDATABASE="${PGDATABASE}" \
    USAGE_METRICS_STORAGE_ACCOUNT_URL="${USAGE_METRICS_STORAGE_ACCOUNT_URL}" \
    USAGE_METRICS_CONTAINER_NAME="${USAGE_METRICS_CONTAINER_NAME:-data}" \
    USAGE_METRICS_REPORT_PREFIX="${USAGE_METRICS_REPORT_PREFIX:-reports}" \
    USAGE_METRICS_LOOKBACK_DAYS="${USAGE_METRICS_LOOKBACK_DAYS:-7}"
