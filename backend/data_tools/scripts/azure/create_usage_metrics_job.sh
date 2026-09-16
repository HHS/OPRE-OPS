#!/usr/bin/env bash

# Creates the scheduled Usage Metrics report Container App Job (#4148).
#
# This is the first *scheduled* job in the repo. It runs once per sprint and uploads a usage report
# to Blob storage for the UX team. Deploy to STAGING first (staging DB / storage account / MI),
# gather UX feedback, then rerun against production values.
#
# Cron: "50 23 * * 5" == 23:50 UTC Friday. Azure cron is UTC-only, so this is a fixed UTC time that
# lands Friday evening US Central (18:50 CDT in summer / 17:50 CST in winter) -- after the workday,
# still on the Friday. Do NOT try to encode Central directly.
#
# The report is wanted on the LAST FRIDAY OF EACH SPRINT (sprints are two weeks), i.e. every other
# Friday. Cron cannot express that -- it has no notion of "every other week", and restricting
# day-of-month alongside day-of-week makes standard cron parsers OR the two fields rather than AND
# them. So the cron fires EVERY Friday and the job itself exits early on the Fridays that do not end
# a sprint (see should_generate_report / USAGE_METRICS_SPRINT_ANCHOR_DATE below). A skipped run
# starts a container, logs why it is skipping, and exits 0 without touching the DB or Blob storage.
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
#   USAGE_METRICS_LOOKBACK_DAYS  (optional, default "14")   -- reporting window; keep == sprint length
#                                                              so consecutive reports tile with no gap
#   USAGE_METRICS_SPRINT_ANCHOR_DATE (optional,             -- a known sprint-end FRIDAY; sprint ends
#     default "2026-09-11")                                    are every 14 days from it. Update if the
#                                                              team's sprint boundary ever shifts.
#   USAGE_METRICS_FORCE_RUN (optional, default unset)       -- "true" makes every Friday run generate a
#                                                              report, ignoring the sprint schedule
#
# Email delivery (optional -- when set, the job emails the UX team a SAS download link to that
# sprint's report via Azure Communication Services):
#   USAGE_METRICS_ACS_CONNECTION_STRING_SECRET              -- Key Vault secret name holding the ACS
#                                                              connection string, e.g.
#                                                              opre-ops-sdlc-comms-acs-connection-string
#   USAGE_METRICS_EMAIL_SENDER                              -- verified ACS MailFrom address
#   USAGE_METRICS_EMAIL_RECIPIENTS                          -- comma-separated recipient addresses
#   USAGE_METRICS_SAS_EXPIRY_DAYS (optional, default "90")  -- how long the download link stays valid
#   VAULT_URL, VAULT_FILE_STORAGE_KEY                       -- Key Vault URL + secret name of the
#                                                              storage account key (used to sign the SAS)
#
# Both secrets the email path needs are read from Key Vault by the MI at run time, so neither is
# stored on the job: the storage account key that signs the SAS link, and the ACS connection string
# that authenticates the send. ACS's AAD/RBAC data-plane auth is deliberately not used -- it needs
# the Contributor role on the ACS resource, which the infra repo does not grant (it provisions the
# connection string into each environment's Key Vault instead).
#
# Email delivery is skipped (report is still uploaded to Blob) unless ACS_CONNECTION_STRING_SECRET,
# EMAIL_SENDER, and EMAIL_RECIPIENTS are all set. When email is enabled, the MI needs Key Vault
# "get" on secrets -- see USAGE_METRICS_JOB.md for the az keyvault set-policy step.
#
# The managed identity must have WRITE access (Storage Blob Data Contributor) on the target
# container -- read access (used for data import) is not sufficient for upload. The staging
# "storageAccountUser" MI already has this role on opreopsstgappsa.

set -euo pipefail

RESOURCE_GROUP_NAME=$1
MI_NAME=$2
CAE_NAME=$3

# Fail fast if a required value is missing, rather than creating a job with an empty pgpassword
# secret / blank connection that only fails DB auth on the first scheduled run.
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
#
# NOTE: --args must be passed as SEPARATE tokens, not one comma-quoted string. A single string
# like "/bin/ash, -c, ./script.sh" is stored by az as ONE argument, so the container tries to
# exec a program literally named "/bin/ash, -c, ..." and dies with exit 128 (StartError) before
# producing any logs. We invoke /bin/sh with the script path directly (sh runs the file), which
# also avoids az's --args parser rejecting the leading-dash "-c" token. This mirrors the
# Dockerfile CMD ["/bin/sh", "-c", "./data_tools/scripts/..."] used by the other data-tools jobs.
az containerapp job create \
  --name "${JOB_NAME}" \
  --resource-group "${RESOURCE_GROUP_NAME}" \
  --image "${IMAGE}" \
  --cpu 0.25 \
  --memory 0.5Gi \
  --trigger-type Schedule \
  --cron-expression "50 23 * * 5" \
  --args "/bin/sh" "./data_tools/scripts/usage_metrics.sh" \
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
    USAGE_METRICS_LOOKBACK_DAYS="${USAGE_METRICS_LOOKBACK_DAYS:-14}" \
    USAGE_METRICS_SPRINT_ANCHOR_DATE="${USAGE_METRICS_SPRINT_ANCHOR_DATE:-2026-09-11}" \
    USAGE_METRICS_FORCE_RUN="${USAGE_METRICS_FORCE_RUN:-}" \
    USAGE_METRICS_ACS_CONNECTION_STRING_SECRET="${USAGE_METRICS_ACS_CONNECTION_STRING_SECRET:-}" \
    USAGE_METRICS_EMAIL_SENDER="${USAGE_METRICS_EMAIL_SENDER:-}" \
    USAGE_METRICS_EMAIL_RECIPIENTS="${USAGE_METRICS_EMAIL_RECIPIENTS:-}" \
    USAGE_METRICS_SAS_EXPIRY_DAYS="${USAGE_METRICS_SAS_EXPIRY_DAYS:-90}" \
    VAULT_URL="${VAULT_URL:-}" \
    VAULT_FILE_STORAGE_KEY="${VAULT_FILE_STORAGE_KEY:-}"
