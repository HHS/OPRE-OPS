# Scheduled Usage Metrics Report Job (OPS-4148)

An Azure Container App Job aggregates `ops_event` activity once per sprint — on the **last Friday of
each two-week sprint** — and uploads it to Blob storage for the UX team as a single two-sheet
**`.xlsx`** each run: an "Aggregate" sheet (per-day x division x role counts) and a "Per-user" sheet
listing each named user who signed in during the reporting window
(`name, email, division, roles, sign_in_count, last_sign_in_utc`). Code:
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
`USAGE_METRICS_CONTAINER_NAME` / `USAGE_METRICS_REPORT_PREFIX` if needed. Schedule defaults
(`50 23 * * 5` cron, 14-day window, `2026-09-11` sprint anchor) are baked into the create script —
see [Schedule](#schedule-last-friday-of-each-sprint).

## Test-fire and verify (don't wait for the sprint-end Friday)

A manual start on any other day hits the sprint filter and no-ops, so force the run for the test,
then put it back on schedule:

```bash
# 1. force-run, so this start generates a report regardless of the date
az containerapp job update -n usage-metrics-job -g opre-ops-stg-app-rg \
  --set-env-vars USAGE_METRICS_FORCE_RUN=true

az containerapp job start -n usage-metrics-job -g opre-ops-stg-app-rg
az containerapp job execution list -n usage-metrics-job -g opre-ops-stg-app-rg -o table

# 2. restore the sprint schedule when you are done verifying
az containerapp job update -n usage-metrics-job -g opre-ops-stg-app-rg \
  --set-env-vars USAGE_METRICS_FORCE_RUN=""
```

**Leaving `USAGE_METRICS_FORCE_RUN=true` set turns the job back into a weekly report** (every Friday
generates and emails), so step 2 is not optional. The lookback window would also still be 14 days,
producing overlapping reports week over week.

Then confirm the report appears at `data/reports/usage-metrics-latest.xlsx` (the two-sheet
workbook with the Aggregate and Per-user sheets). The UX team needs read access to that container
(SAS link or `Storage Blob Data Reader`) to retrieve it.

## Emailing a download link to the UX team (OPS-4148, no Azure ID needed)

The UX team has no Azure/Entra identity, so the job can email them a **time-limited SAS download
link** to that sprint's dated report (`reports/usage-metrics-<date>.xlsx`) via **Azure Communication
Services (ACS)**. Code: `deliver_report_link` in `src/usage_metrics/utils.py` →
`build_blob_sas_url` in `src/azure_utils/utils.py` (mints the SAS) →
`send_report_link_email` in `src/usage_metrics/email_delivery.py` (sends via ACS). Email delivery
**no-ops** (report still uploads to Blob) unless `USAGE_METRICS_ACS_CONNECTION_STRING_SECRET`,
`USAGE_METRICS_EMAIL_SENDER`, and `USAGE_METRICS_EMAIL_RECIPIENTS` are all set — so local/dev/staging
runs stay silent until wired.

**Auth design (why connection string, not AAD/RBAC):** the ACS resources are provisioned by
[OPRE-OPS-Data#59](https://github.com/HHS/OPRE-OPS-Data/pull/59), which distributes the ACS
**connection string as a Key Vault secret** into each environment's vault (the same convention
`pg-server` uses for DB creds) and deliberately leaves RBAC auth out of scope. ACS's AAD data-plane
auth would require the **`Contributor`** role on the ACS resource — ACS has no narrower built-in
send role — and the job's MI holds no role there. So the job reads the connection string from Key
Vault via its MI at run time (`get_secret(vault_url, usage_metrics_acs_connection_string_secret)`),
exactly like the storage account key below. Neither secret is stored on the job.

**SAS design (why account-key, not user-delegation):** a user-delegation SAS (MI-signed) is capped
at **7 days** by Azure; the link needs ~90 days, so the SAS is signed with the **storage account
key**. The key is **not** stored on the job — it's read from **Key Vault via the MI** at run time
(`get_secret(vault_url, vault_file_storage_key)`), so the no-plaintext-secret posture holds. The
link is a bearer token to **named-user data** — keep expiry as short as the use case allows and the
recipient list tight. Dated files accumulate in Blob for history; only the *links* expire.

**Env vars (all optional; add to `create_usage_metrics_job.sh` invocation):**

| Var | Purpose | Default |
|---|---|---|
| `USAGE_METRICS_ACS_CONNECTION_STRING_SECRET` | Key Vault secret name holding the ACS connection string | — (unset = no email) |
| `USAGE_METRICS_EMAIL_SENDER` | Verified ACS `MailFrom` address | — |
| `USAGE_METRICS_EMAIL_RECIPIENTS` | Comma-separated recipient addresses | — |
| `USAGE_METRICS_SAS_EXPIRY_DAYS` | Days the download link stays valid | `90` |
| `VAULT_URL`, `VAULT_FILE_STORAGE_KEY` | Key Vault URL + secret name of the storage account key (used to sign the SAS) | — |

### Verified ACS values (provisioned by OPRE-OPS-Data#59, applied 2026-09-10)

Dev and staging **share one** ACS instance (the `sdlc` stack, shared at the `eus/` level); prod has
its own. Values below were read from Azure on 2026-09-15.

| Thing | dev + staging (`opre-ops-services-sdlc`) | production (`opre-ops-services-prod`) |
|---|---|---|
| Resource group | `opre-ops-sdlc-comms-rg` | `opre-ops-prod-comms-rg` |
| ACS resource | `opre-ops-sdlc-comms-acs` | `opre-ops-prod-comms-acs` |
| Key Vault secret name | `opre-ops-sdlc-comms-acs-connection-string` | `opre-ops-prod-comms-acs-connection-string` |
| Key Vault holding it | `opre-ops-dev-app-kv` **and** `opre-ops-stg-app-kv` | `opre-ops-prod-app-kv` |
| Sender address | `DoNotReply@7b9d729e-13e1-43ab-b12d-fa0ea1793a56.azurecomm.net` | (read from that stack's `defaultSenderAddress` output) |
| Sender display name | `OPRE Portfolio Management System (OPS)` | same |

The prod resource-group / ACS / secret names follow the same label pattern; confirm them against the
prod stack rather than assuming, since only `sdlc` was inspected directly.

**One-time Azure prerequisite: grant the job's MI Key Vault access.** `opre-ops-stg-app-kv` uses
**access policies**, not RBAC (`enableRbacAuthorization: false`), and the `storageAccountUser` MI is
**not** in its policy list — so it currently cannot read *any* secret from that vault. This blocks
both the SAS-signing storage key and the ACS connection string. Secret permissions are vault-wide,
so one grant covers both:

```bash
MI_PRINCIPAL_ID=$(az identity show -n storageAccountUser -g opre-ops-stg-app-rg --query principalId -o tsv)
az keyvault set-policy -n opre-ops-stg-app-kv --object-id "$MI_PRINCIPAL_ID" --secret-permissions get
```

Then wire the email vars into the create/update invocation:

```bash
export VAULT_URL="https://opre-ops-stg-app-kv.vault.azure.net/"
export VAULT_FILE_STORAGE_KEY='<secret name holding the storage account key>'
export USAGE_METRICS_ACS_CONNECTION_STRING_SECRET="opre-ops-sdlc-comms-acs-connection-string"
export USAGE_METRICS_EMAIL_SENDER="DoNotReply@7b9d729e-13e1-43ab-b12d-fa0ea1793a56.azurecomm.net"
export USAGE_METRICS_EMAIL_RECIPIENTS="ux1@example.gov,ux2@example.gov"
```

**Deliverability caveats to expect on the first send:**
- The sender is an Azure-managed `*.azurecomm.net` subdomain, which ACF mail filtering is likely to
  treat as unfamiliar — tell recipients to check junk on the first run. A custom domain would need
  DNS ownership proof through ACF Tech's formal process (see OPRE-OPS-Data#59 for why it was skipped).
- Newly created ACS Email resources start on a **low-volume trial sending tier**. One report per
  sprint to a handful of recipients fits comfortably; raising the quota needs a manual Azure support
  ticket.

## Ongoing image updates

`.github/workflows/stg_be_build_and_deploy.yml` (staging) and `prod_be_build_and_deploy.yml`
(production) both update `usage-metrics-job` to the new image on deploy — guarded with
`|| echo ... skipping` so each is a no-op until that environment's job is created. Staging redeploys
automatically on merge to `main`; production is a manual `workflow_dispatch`.

## Schedule: last Friday of each sprint

The report is wanted **once per sprint, on the sprint's last Friday** (sprints are two weeks). Cron
cannot express "every other Friday" — there is no week-parity field, and restricting day-of-month
alongside day-of-week makes standard cron parsers **OR** the two fields rather than AND them (a
`50 23 8-14,22-28 * 5` would fire on every day in those ranges *and* every Friday). So:

| Piece | Value | Why |
|---|---|---|
| Cron | `50 23 * * 5` | 23:50 UTC **every** Friday. Azure cron is UTC-only; this lands Friday evening US Central (18:50 CDT / 17:50 CST) — after the workday, still on the Friday. |
| Sprint filter | `should_generate_report` in `src/usage_metrics/utils.py` | Off-sprint Fridays log why they are skipping and exit 0 without touching the DB or Blob storage. |
| `USAGE_METRICS_SPRINT_ANCHOR_DATE` | `2026-09-11` (default) | A known sprint-end Friday; sprint ends are every 14 days from it in both directions. Validated as a Friday at run time — a non-Friday anchor would never line up with the cron, so it raises instead of silently no-opping forever. |
| `USAGE_METRICS_LOOKBACK_DAYS` | `14` (default) | Matches the sprint length, so consecutive reports tile the calendar with no gap or overlap. Keep these two in step. |

The anchor came from the team's own sprint boundaries — the sprint 106 and 107 release-note commits
landed Friday 2026-08-28 and Friday 2026-09-11, exactly 14 days apart. **If the team's sprint
boundary ever shifts, update `USAGE_METRICS_SPRINT_ANCHOR_DATE`** to any Friday that ends a sprint
(an `az containerapp job update --set-env-vars` is enough; no code change).

Two consequences worth knowing:

- Roughly half the scheduled runs are deliberate no-ops. A skipped run still starts a container and
  shows up in `az containerapp job execution list` as `Succeeded` — check the logs for the "not a
  sprint-end Friday" line before treating a run as a missed report.
- Activity after ~18:50 Central on the sprint's last Friday falls into the *next* sprint's report.
  Nothing is lost (the 14-day windows tile exactly), it just lands one report later.

To test-fire off-schedule, set `USAGE_METRICS_FORCE_RUN=true` — see below.

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

# test-fire without waiting for the sprint-end Friday (see the staging test-fire section for the
# USAGE_METRICS_FORCE_RUN=true / reset dance this needs):
az containerapp job start -n usage-metrics-job -g opre-ops-prod-app-rg
```

Then confirm `data/reports/usage-metrics-latest.xlsx` appears in `opreopsprodappsa`. The prod
storage holds **real** named-user data — grant `reports/` read access only to intended recipients.

### Email delivery on production

Same two prerequisites as staging, with prod names — check whether `opre-ops-prod-app-kv` uses
access policies or RBAC before picking the grant command, and confirm the prod ACS values against
the `opre-ops-services-prod` stack (only `sdlc` was inspected directly):

```bash
# grant the job's MI read access to secrets (access-policy vault; use a role assignment if the
# prod vault has enableRbacAuthorization: true)
MI_PRINCIPAL_ID=$(az identity show -n storageAccountUser -g opre-ops-prod-app-rg --query principalId -o tsv)
az keyvault set-policy -n opre-ops-prod-app-kv --object-id "$MI_PRINCIPAL_ID" --secret-permissions get

export VAULT_URL="https://opre-ops-prod-app-kv.vault.azure.net/"
export VAULT_FILE_STORAGE_KEY='<secret name holding the prod storage account key>'
export USAGE_METRICS_ACS_CONNECTION_STRING_SECRET="opre-ops-prod-comms-acs-connection-string"
export USAGE_METRICS_EMAIL_SENDER='<prod stack defaultSenderAddress>'
export USAGE_METRICS_EMAIL_RECIPIENTS="ux1@example.gov,ux2@example.gov"
```

Prod uses its **own** ACS instance (`opre-ops-prod-comms-acs` in `opre-ops-prod-comms-rg`), not the
shared `sdlc` one — do not reuse the dev/staging secret name or sender address here.
