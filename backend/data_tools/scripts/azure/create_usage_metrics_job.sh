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
# This mirrors how the OTHER staging data-tools jobs are actually configured (verified against
# opre-ops-stg-app-* jobs), which differs from create_container_app_job.sh:
#   - The ghcr.io image is PUBLIC, so no --registry-* flags / credentials are needed.
#   - Blob access uses a user-assigned managed identity that already holds
#     "Storage Blob Data Contributor" on the storage account (staging: "storageAccountUser").
#     The job code selects it via MI_CLIENT_ID + FILE_STORAGE_AUTH_METHOD=mi.
#   - The DB password is passed as a container-app SECRET (secretRef), not a plaintext env var.
#
# Positional args:
#   $1 RESOURCE_GROUP_NAME   -- e.g. opre-ops-stg-app-rg
#   $2 MI_NAME               -- user-assigned MI with Blob write (staging: storageAccountUser)
#   $3 CAE_NAME              -- Container App Environment name (staging: opre-ops-stg-app-cae)
#
# Required env vars (supply per-environment, pointed at staging for the first deploy):
#   IMAGE_TAG (optional, default "stg")                     -- ops-data-tools tag to run
#   PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE          -- database connection
#   USAGE_METRICS_STORAGE_ACCOUNT_URL                       -- e.g. https://opreopsstgappsa.blob.core.windows.net
#   USAGE_METRICS_CONTAINER_NAME (optional, default "data")
#   USAGE_METRICS_REPORT_PREFIX  (optional, default "reports")
#   USAGE_METRICS_LOOKBACK_DAYS  (optional, default "7")    -- reporting window; keep >= cron period
#
# The managed identity must have WRITE access (Storage Blob Data Contributor) on the target
# container -- read access (used for data import) is not sufficient for upload. The staging
# "storageAccountUser" MI already has this role on opreopsstgappsa.

set -euo pipefail

RESOURCE_GROUP_NAME=$1
MI_NAME=$2
CAE_NAME=$3

# Fail fast if a required value is missing, rather than creating a job with an empty pgpassword
# secret / blank connection that only fails DB auth on the first weekly cron run.
missing=()
for var in RESOURCE_GROUP_NAME MI_NAME CAE_NAME \
           PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE USAGE_METRICS_STORAGE_ACCOUNT_URL; do
  if [ -z "${!var:-}" ]; then
    missing+=("${var}")
  fi
done
if [ "${#missing[@]}" -ne 0 ]; then
  echo "ERROR: missing required value(s): ${missing[*]}" >&2
  echo "Positional args: RESOURCE_GROUP_NAME MI_NAME CAE_NAME; the rest are env vars (see header)." >&2
  exit 1
fi

# Job name must match the name used by the stg deploy workflow's "az containerapp job update" step.
JOB_NAME="usage-metrics-job"
IMAGE="ghcr.io/hhs/opre-ops/ops-data-tools:${IMAGE_TAG:-stg}"

# Get the managed identity id (attached for runtime Blob access via FILE_STORAGE_AUTH_METHOD=mi)
MI_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query id --output tsv)
MI_CLIENT_ID=$(az identity show --name "${MI_NAME}" --resource-group "${RESOURCE_GROUP_NAME}" --query clientId --output tsv)

# Create the scheduled container app job. The image is public on ghcr.io, so no registry creds.
az containerapp job create \
  --name "${JOB_NAME}" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --image "${IMAGE}" \
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
  --mi-user-assigned "${MI_ID}" \
  --secrets pgpassword="${PGPASSWORD}" \
  --env-vars \
    ENV=azure \
    FILE_STORAGE_AUTH_METHOD=mi \
    MI_CLIENT_ID="${MI_CLIENT_ID}" \
    PGUSER="${PGUSER}" \
    PGPASSWORD=secretref:pgpassword \
    PGHOST="${PGHOST}" \
    PGPORT="${PGPORT}" \
    PGDATABASE="${PGDATABASE}" \
    USAGE_METRICS_STORAGE_ACCOUNT_URL="${USAGE_METRICS_STORAGE_ACCOUNT_URL}" \
    USAGE_METRICS_CONTAINER_NAME="${USAGE_METRICS_CONTAINER_NAME:-data}" \
    USAGE_METRICS_REPORT_PREFIX="${USAGE_METRICS_REPORT_PREFIX:-reports}" \
    USAGE_METRICS_LOOKBACK_DAYS="${USAGE_METRICS_LOOKBACK_DAYS:-7}"
