# Scheduled Usage Metrics Report Job (OPS-4148)

A weekly Azure Container App Job aggregates `ops_event` activity and uploads it to Blob storage for
the UX team as a single two-sheet **`.xlsx`** each run: an "Aggregate" sheet (per-day x division x
role counts) and a "Per-user" sheet listing each named user who signed in during the reporting
window (`name, email, division, roles, sign_in_count, last_sign_in_utc`). Code:
`src/usage_metrics/utils.py`; wrapper: `scripts/usage_metrics.sh`; create script:
`scripts/azure/create_usage_metrics_job.sh`.

**Privacy note:** the per-user sheet names individual users (an approved #4148 requirement change
that reverses the original counts-only posture); it excludes IP addresses. Grant read access to
`reports/` with the awareness that the `.xlsx` contains named user data. `sign_in_count` is a
count of successful login events (each `/auth/login/` creates a fresh session), so a user who
idle-logs-out and re-authenticates repeatedly shows a higher count than one who stays active via
token refresh — it measures "how many times they had to sign in," not distinct active days.

Unlike the local-test `create_container_app_job.sh`, the real staging jobs (verified live) are
configured as: **public** `ghcr.io` image (no registry creds), DB password via container-app
**secret**, and Blob access through the shared user-assigned MI **`storageAccountUser`** (which
already holds `Storage Blob Data Contributor` on the storage account). The create script matches
this. Note staging jobs report `identity.type: None` on themselves — they rely on that shared MI.

## Verified staging values

| Thing | Value |
|---|---|
| Resource group | `opre-ops-stg-app-rg` |
| Container App Environment | `opre-ops-stg-app-cae` |
| User-assigned MI (Blob write) | `storageAccountUser` |
| Storage account URL | `https://opreopsstgappsa.blob.core.windows.net` |
| Blob container | `data` (default; report lands under `reports/`) |
| DB host / db / user | `opre-ops-stg-db-pg-server.postgres.database.azure.com` / `postgres` / `ops` |
| DB password | `pgpassword` secret on the existing staging jobs (not in this repo) |
| Report blobs | `reports/usage-metrics-latest.xlsx`, `reports/usage-metrics-<date>.xlsx` (two blobs/run; uploaded with the spreadsheet MIME type) |

## Enable on staging (one-time creation)

```bash
export PGUSER=ops
export PGHOST=opre-ops-stg-db-pg-server.postgres.database.azure.com
export PGPORT=5432
export PGDATABASE=postgres
export PGPASSWORD='<ops DB password — the pgpassword secret on the other jobs>'
export USAGE_METRICS_STORAGE_ACCOUNT_URL="https://opreopsstgappsa.blob.core.windows.net"

./scripts/azure/create_usage_metrics_job.sh opre-ops-stg-app-rg storageAccountUser opre-ops-stg-app-cae
```

Container name and report prefix default to `data` / `reports`; override with
`USAGE_METRICS_CONTAINER_NAME` / `USAGE_METRICS_REPORT_PREFIX` if needed.

## Test-fire and verify (don't wait for the Monday cron)

```bash
az containerapp job start -n usage-metrics-job -g opre-ops-stg-app-rg
az containerapp job execution list -n usage-metrics-job -g opre-ops-stg-app-rg -o table
```

Then confirm the report appears at `data/reports/usage-metrics-latest.xlsx` (the two-sheet
workbook with the Aggregate and Per-user sheets). The UX team needs read access to that container
(SAS link or `Storage Blob Data Reader`) to retrieve it.

## Emailing a download link to the UX team (OPS-4148, no Azure ID needed)

The UX team has no Azure/Entra identity, so the job can email them a **time-limited SAS download
link** to that week's dated report (`reports/usage-metrics-<date>.xlsx`) via **Azure Communication
Services (ACS)**. Code: `deliver_report_link` in `src/usage_metrics/utils.py` →
`build_blob_sas_url` in `src/azure_utils/utils.py` (mints the SAS) →
`send_report_link_email` in `src/usage_metrics/email_delivery.py` (sends via ACS). Email delivery
**no-ops** (report still uploads to Blob) unless `USAGE_METRICS_ACS_ENDPOINT`,
`USAGE_METRICS_EMAIL_SENDER`, and `USAGE_METRICS_EMAIL_RECIPIENTS` are all set — so local/dev/staging
runs stay silent until wired.

**SAS design (why account-key, not user-delegation):** a user-delegation SAS (MI-signed) is capped
at **7 days** by Azure; the link needs ~90 days, so the SAS is signed with the **storage account
key**. The key is **not** stored on the job — it's read from **Key Vault via the MI** at run time
(`get_secret(vault_url, vault_file_storage_key)`), so the no-plaintext-secret posture holds. The
link is a bearer token to **named-user data** — keep expiry as short as the use case allows and the
recipient list tight. Dated files accumulate in Blob for history; only the *links* expire.

**Env vars (all optional; add to `create_usage_metrics_job.sh` invocation):**

| Var | Purpose | Default |
|---|---|---|
| `USAGE_METRICS_ACS_ENDPOINT` | ACS resource endpoint (`https://<res>.communication.azure.com`) | — (unset = no email) |
| `USAGE_METRICS_EMAIL_SENDER` | Verified ACS `MailFrom` address | — |
| `USAGE_METRICS_EMAIL_RECIPIENTS` | Comma-separated recipient addresses | — |
| `USAGE_METRICS_SAS_EXPIRY_DAYS` | Days the download link stays valid | `90` |
| `VAULT_URL`, `VAULT_FILE_STORAGE_KEY` | Key Vault URL + secret name of the storage account key (used to sign the SAS) | — |

**One-time Azure prerequisites (per environment, do in the target subscription):**
1. Provision an **ACS resource** + an **Email Communication Service** with a verified sender domain
   (Azure-managed subdomain is quickest; custom domain needs DNS).
2. Grant the `storageAccountUser` MI the **ACS sender role** (for Entra-auth email send).
3. Ensure the MI can **read `VAULT_FILE_STORAGE_KEY` from Key Vault** (get-secret access) and that
   the secret holds the storage account key.

Auth uses `DefaultAzureCredential(managed_identity_client_id=MI_CLIENT_ID)` — the same MI the job
already uses for Blob — so no ACS connection string is stored.

## Ongoing image updates

`.github/workflows/stg_be_build_and_deploy.yml` (staging) and `prod_be_build_and_deploy.yml`
(production) both update `usage-metrics-job` to the new image on deploy — guarded with
`|| echo ... skipping` so each is a no-op until that environment's job is created. Staging redeploys
automatically on merge to `main`; production is a manual `workflow_dispatch`. The cron is
`50 4 * * 1` (04:50 UTC Monday = Sunday night US Central) — Azure cron is UTC-only.

## Enable on production (one-time creation)

Production lives in a **separate subscription** (`opre-ops-services-prod`) from dev/staging
(`opre-ops-services-sdlc`); target it with `--subscription opre-ops-services-prod` or
`az account set`. The layout mirrors staging exactly. Prerequisites: PR #5960 merged to `main`
**and** the prod BE deploy (`prod_be_build_and_deploy.yml`) run at least once so the `prod`-tagged
`ops-data-tools` image contains this code.

Verified production values (read-only inspection, 2026-07-31):

| Thing | Value |
|---|---|
| Subscription | `opre-ops-services-prod` |
| Resource group | `opre-ops-prod-app-rg` |
| Container App Environment | `opre-ops-prod-app-cae` |
| User-assigned MI (Blob write) | `storageAccountUser` |
| Storage account URL | `https://opreopsprodappsa.blob.core.windows.net` |
| Blob container | `data` (default; report lands under `reports/`) |
| DB host / db / user | `opre-ops-prod-db-pg-server.postgres.database.azure.com` / `postgres` / `ops` |
| DB password | `pgpassword` secret on the existing prod jobs (not in this repo) |

```bash
az account set --subscription opre-ops-services-prod

export IMAGE_TAG=prod   # or a specific prod SHA
export PGUSER=ops
export PGHOST=opre-ops-prod-db-pg-server.postgres.database.azure.com
export PGPORT=5432
export PGDATABASE=postgres
export PGPASSWORD='<ops DB password — the pgpassword secret on the other prod jobs>'
export USAGE_METRICS_STORAGE_ACCOUNT_URL="https://opreopsprodappsa.blob.core.windows.net"

./scripts/azure/create_usage_metrics_job.sh opre-ops-prod-app-rg storageAccountUser opre-ops-prod-app-cae

# test-fire without waiting for the Monday cron:
az containerapp job start -n usage-metrics-job -g opre-ops-prod-app-rg
```

Then confirm `data/reports/usage-metrics-latest.xlsx` appears in `opreopsprodappsa`. The prod
storage holds **real** named-user data — grant `reports/` read access only to intended recipients.
