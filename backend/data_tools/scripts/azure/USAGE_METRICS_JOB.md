# Scheduled Usage Metrics Report Job (OPS-4148)

An Azure Container App Job aggregates `ops_event` activity once per sprint — on the **last Friday of
each two-week sprint** — and uploads it to Blob storage for the UX team as a single two-sheet
**`.xlsx`** each run: an "Aggregate" sheet (per-day x division x role counts) and a "Per-user" sheet
listing each named user who signed in during the reporting window
(`name, email, division, roles, sign_in_count, last_sign_in_utc`).

Code: `src/usage_metrics/utils.py`; wrapper: `scripts/usage_metrics.sh`.

**The job is owned by Terraform.** It is created by the `deployments/usage-metrics` Terragrunt stack
in [HHS/OPRE-OPS-Data](https://github.com/HHS/OPRE-OPS-Data), as
`opre-ops-<env>-app-usage-metrics`. `scripts/azure/create_usage_metrics_job.sh` in this repo is
**deprecated** and kept only as a rollback path until one green end-to-end production run exists.

**Privacy note:** the per-user sheet names individual users (an approved #4148 requirement change
that reverses the original counts-only posture); it excludes IP addresses. Grant read access to
`reports/` with the awareness that the `.xlsx` contains named user data. `sign_in_count` is a
count of successful login events (each `/auth/login/` creates a fresh session), so a user who
idle-logs-out and re-authenticates repeatedly shows a higher count than one who stays active via
token refresh — it measures "how many times they had to sign in," not distinct active days.

## How the secrets reach the job

Both secrets the email path needs are **injected as Container App secrets by Terraform at apply
time**, read with the applying principal's own credentials. The job itself holds no Key Vault access
and performs no vault read at run time.

| Job env var | Source | Terraform secret |
|---|---|---|
| `ACS_CONNECTION_STRING` | `data "azurerm_key_vault_secret"` on the app vault | `acs-connection-string` |
| `FILE_STORAGE_ACCOUNT_KEY` | `data "azurerm_storage_account".primary_access_key` | `storage-account-key` |
| `EMAIL_SENDER_ADDRESS` | `communications` stack output (plain value, not a secret) | — |

This is the pattern established by [OPRE-OPS-Data#63](https://github.com/HHS/OPRE-OPS-Data/pull/63)
for the sibling `disable-users` job, and it replaces two manual steps that earlier versions of this
runbook required: a Key Vault access-policy grant for the `storageAccountUser` MI, and hand-creating
a storage-account-key secret that nothing provisioned. **Neither is needed any more — do not do
them.**

**Why an account-key SAS at all:** a user-delegation SAS (MI-signed) is capped at **7 days** by
Azure; the link needs ~90, so it is signed with the storage account key. The link is a bearer token
to **named-user data** — keep expiry as short as the use case allows and the recipient list tight.
Dated files accumulate in Blob for history; only the *links* expire. Rotating the storage account key
invalidates every link already emailed, and the baked copy goes stale until the next `terragrunt
apply`.

**Why a connection string rather than AAD/RBAC for ACS:** ACS's AAD data-plane auth requires the
**`Contributor`** role on the ACS resource — ACS has no narrower built-in send role — and the job's
identity holds none. The infrastructure distributes the connection string as a Key Vault secret
instead ([OPRE-OPS-Data#59](https://github.com/HHS/OPRE-OPS-Data/pull/59)).

### Permissions needed to apply

In each subscription the applying principal needs **both**:

- Key Vault secret `get` on the app vault, and
- `Microsoft.Storage/storageAccounts/listKeys/action` on the app storage account.
  **`Storage Blob Data Contributor` does not grant this**; `Contributor` or
  `Storage Account Contributor` do.

Being in `kvAccessList` in the env's `app` stack (`locals.tf`) is what grants the first one; it
creates a per-user access policy on `opre-ops-<env>-app-kv`.

Two more things are needed before plan works at all:

- **VPN.** The app vaults have public network access disabled. Off VPN, the vault answers with an
  authorization error first (`does not have secrets get permission`), which hides the real
  `ForbiddenByConnection` until the access policy is in place. On VPN,
  `nslookup opre-ops-<env>-app-kv.vault.azure.net` resolves to a private `10.x` address.
- **The right subscription for state.** The remote-state backend uses the `az` CLI's default
  subscription. If yours is `opre-ops-services-prod`, init fails for sdlc stacks with
  `Resource group 'opre-ops-sdlc-terraform-state' could not be found`. Run `az account set` to the
  target subscription, or set `ARM_SUBSCRIPTION_ID` for the session.

The `listKeys` permission matters more than it looks: when it is missing, `primary_access_key` comes back as an
**empty string rather than erroring**. The stack carries a `lifecycle precondition` that fails the
plan in that case, but only when `usageMetricsEmailRecipients` is non-empty — with no recipients an
empty key is harmless and the guard stays out of the way.

**Open question, to settle on the first apply without `listKeys`:** with no recipients and no
`listKeys`, the job is created with an *empty* `storage-account-key` secret. The provider accepts
that, but it's unconfirmed whether the Container Apps API does. (The staging apply on 2026-10-06 had
`listKeys`, so it did not settle this; dev and prod have not been applied yet.) If it rejects it,
the stack should add the secret and the `FILE_STORAGE_ACCOUNT_KEY` env var only when the key is
non-empty. Either way, the application already treats an unset or empty `FILE_STORAGE_ACCOUNT_KEY`
as "email not configured".

## Enabling an environment

⚠️ **Order matters: deploy this repo's code before applying the stack.** The job runs
`ghcr.io/hhs/opre-ops/ops-data-tools:<env>`, and until the code from OPRE-OPS#5960 is deployed to
that environment, the image has no `scripts/usage_metrics.sh` or `src/usage_metrics/`. Applying the
stack first creates a job whose entrypoint doesn't exist, so every scheduled run fails.

Status as of 2026-10-07: #5960 and [OPRE-OPS-Data#64](https://github.com/HHS/OPRE-OPS-Data/pull/64)
are both merged, and **staging is applied** (see "Verified end to end" below). Dev and prod have no
`usage-metrics` job yet. Per remaining environment:

1. Make sure `ops-data-tools:<env>` contains the #5960 code. For prod that means running the manual
   `prod_be_build_and_deploy.yml` workflow first.
2. `terragrunt plan` (expect `1 to add, 0 to change, 0 to destroy`), then `terragrunt apply`.

The reverse order is harmless for the deploy workflows: before the job exists they log "not found;
skipping", and the first deploy after the apply pins the job to that commit's image.

```bash
cd infra/cloud/azure/<subscription>/eus/[<env>/]deployments/usage-metrics
terragrunt plan     # confirm one job created; EMAIL_SENDER_ADDRESS renders the real DoNotReply@ address
terragrunt apply
```

`1 to add` holds only for the first apply. After that the deploy workflow repins the job's image to a
commit SHA (see "Ongoing image updates"), and the stack has no `ignore_changes` on the image, so every
later plan shows an in-place change of the image back to `:<env>`. That diff is expected and harmless.

Do **not** try to verify the secrets from plan output — the provider marks the whole `secret` set
`Sensitive`, so a real key and an empty string both render as `(sensitive value)`. Sanity-check the
principal separately:

```bash
az storage account keys list -n <storage-account> -g <rg> --query "[].keyName" -o tsv   # expect 2 rows
```

Then confirm the wiring landed, without printing secrets:

```bash
az containerapp job show -n opre-ops-stg-app-usage-metrics -g opre-ops-stg-app-rg \
  --query "properties.configuration.{cron:scheduleTriggerConfig.cronExpression, secrets:secrets[].name}"
az containerapp job show -n opre-ops-stg-app-usage-metrics -g opre-ops-stg-app-rg \
  --query "properties.template.containers[0].env[].name"
```

### Recipient lists are per environment

The stack lands in dev, stg **and** prod. A non-empty recipient list in a lower environment means UX
receives multiple emails per sprint-end with links to different datasets. Intended end state:
**empty in dev, one internal test address in stg, the real list in prod only.** Email delivery
no-ops cleanly (the report still uploads) whenever the list is empty. As of OPRE-OPS-Data#64,
`usageMetricsEmailRecipients` is `""` in **all three** environments, so no email is sent anywhere
until someone sets it.

## Test-firing without waiting for the sprint-end Friday

A manual start on any other day hits the sprint filter and no-ops. Use a **per-execution override**,
which applies to that one run and never mutates the job — so there is nothing to revert and nothing
for Terraform to fight.

The override must carry the job's **complete** container — image, `args` and every env var — plus
`USAGE_METRICS_FORCE_RUN=true`. Copy it from the job itself and start through the REST API:

```bash
SUB=$(az account show --subscription opre-ops-services-sdlc --query id -o tsv)
ID=/subscriptions/${SUB}/resourceGroups/opre-ops-stg-app-rg/providers/Microsoft.App/jobs/opre-ops-stg-app-usage-metrics

# The job's current container, with one env var appended. Secrets appear only as secretRef names.
az rest --method get --url "https://management.azure.com${ID}?api-version=2024-03-01" \
  | jq '{containers: [.properties.template.containers[0]
          | .env += [{"name":"USAGE_METRICS_FORCE_RUN","value":"true"}]]}' > start-body.json

# Check before starting: args must be the usage_metrics.sh pair, and the env count one more than the job's.
jq '.containers[0] | {image, args, envCount: (.env | length)}' start-body.json

az rest --method post --url "https://management.azure.com${ID}/start?api-version=2024-03-01" \
  --body @start-body.json
az containerapp job execution list -n opre-ops-stg-app-usage-metrics -g opre-ops-stg-app-rg -o table
```

Confirm the override took effect from the logs, not just the `Succeeded` status:
`usage_metrics_force_run is set; generating report regardless of the sprint schedule.`

### ⛔ Do not use `az containerapp job start --env-vars` / `--image` on this or any `ops-data-tools` job

An override **replaces** the job's container, it does not merge into it, and the CLI never sends the
job's `args`. Tested on staging on 2026-10-06 (az 2.90.0):

| Command | Result |
|---|---|
| `job start --env-vars USAGE_METRICS_FORCE_RUN=true` | Rejected: `ContainerAppImageRequired`. Azure does not fill in missing fields from the job. |
| `job start --image ...:stg --env-vars USAGE_METRICS_FORCE_RUN=true` | Execution ran with **only** that one env var and **no `args`**, then failed. This is the `Failed` execution `opre-ops-stg-app-usage-metrics-jhggfw7` (2026-10-06 21:45 UTC) in staging's history; it is not a report failure. |

With no `args`, the container runs the image's default command. CI builds `ops-data-tools` from
`Dockerfile.data-tools-import`, whose `CMD` is `scripts/import_test_data.sh`. That script runs
`DROP SCHEMA IF EXISTS ops CASCADE`, re-runs migrations, and then **loads the JSON5 test seed data**
into the database. The test run died only because the override had also wiped `PGHOST`, so `psql`
never reached the database. "Pass the full env list too" does **not** make the CLI safe: the `args`
are still dropped, and on a job that carries admin DB credentials (`up-schema`, `down-schema`,
`data-tools`) a full-env, no-args override could drop the `ops` schema in that environment and
replace it with test data.

`--yaml` with a complete container is the only safe CLI form. The REST method above does the same
thing without hand-writing YAML.

**Do not** set `USAGE_METRICS_FORCE_RUN` as a committed Terraform input. A forgotten `true` there is
permanent and invisible: it turns the report weekly and emails a 90-day SAS link to named-user data
every Friday.

Then verify end to end:

1. Both blobs appear at `data/reports/usage-metrics-latest.xlsx` and `…-<date>.xlsx`.
2. The email arrives. **Check junk on the first send.**
3. **Click the link** from a browser with no Azure session and confirm the workbook downloads *and
   opens*. "Email arrived" does not prove the SAS works — a stale key or `allowSharedKeyAccess=false`
   fails only at click time.

A failed ACS send now raises rather than exiting 0, so a throttled first send fails the job loudly
instead of leaving a green run and an empty inbox.

### Verified end to end (staging, 2026-10-06)

The Terraform-created staging job was test-fired with the REST method above, with
`usageMetricsEmailRecipients` temporarily set to one internal address and
`usageMetricsSasExpiryDays = "7"` (OPRE-OPS-Data#67, applied and then closed without merging).
Execution `opre-ops-stg-app-usage-metrics-oohrlsw` took about a minute and succeeded:

- It aggregated 6,235 `ops_event` rows into 44 aggregate rows and 8 per-user rows.
- It uploaded `reports/usage-metrics-2026-10-06.xlsx` and `reports/usage-metrics-latest.xlsx`.
- ACS returned `Succeeded` for the send to 1 recipient, from the sdlc `DoNotReply@` sender.

Staging was then re-applied from `main`, so recipients are `""` and expiry is 90 days again
(confirmed on the live job 2026-10-07). Prod still needs its own first send (see the deliverability
caveats below).

## Verified environment values

| Thing | dev | staging | production |
|---|---|---|---|
| Subscription | `opre-ops-services-sdlc` | `opre-ops-services-sdlc` | `opre-ops-services-prod` |
| Resource group | `opre-ops-dev-app-rg` | `opre-ops-stg-app-rg` | `opre-ops-prod-app-rg` |
| Container App Environment | `opre-ops-dev-app-cae` | `opre-ops-stg-app-cae` | `opre-ops-prod-app-cae` |
| MI (Blob write) | `storageAccountUser` | `storageAccountUser` | `storageAccountUser` |
| Storage account | `opreopsdevappsa` | `opreopsstgappsa` | `opreopsprodappsa` |
| Blob container | `data` (report lands under `reports/`) | same | same |
| DB host | `opre-ops-dev-db-pg-server…` | `opre-ops-stg-db-pg-server…` | `opre-ops-prod-db-pg-server…` |

All three storage accounts have `allowSharedKeyAccess: true` (verified 2026-09-29), so an
account-key SAS is viable. Production lives in a **separate subscription** — target it with
`--subscription opre-ops-services-prod` or `az account set`.

### Verified ACS values (provisioned by OPRE-OPS-Data#59, applied 2026-09-10)

Dev and staging **share one** ACS instance (the `sdlc` stack, shared at the `eus/` level); prod has
its own. The `sdlc` column was read from Azure on 2026-09-15; the production column on 2026-09-29.

| Thing | dev + staging (`opre-ops-services-sdlc`) | production (`opre-ops-services-prod`) |
|---|---|---|
| Resource group | `opre-ops-sdlc-comms-rg` | `opre-ops-prod-comms-rg` |
| ACS resource | `opre-ops-sdlc-comms-acs` | `opre-ops-prod-comms-acs` |
| Key Vault secret name | `opre-ops-sdlc-comms-acs-connection-string` | `opre-ops-prod-comms-acs-connection-string` |
| Key Vault holding it | `opre-ops-dev-app-kv` **and** `opre-ops-stg-app-kv` | `opre-ops-prod-app-kv` |
| Sender address | `DoNotReply@7b9d729e-13e1-43ab-b12d-fa0ea1793a56.azurecomm.net` | `DoNotReply@273fd226-bb3b-47c2-b966-08ed4d698bc9.azurecomm.net` |
| Sender display name | `OPRE Portfolio Management System (OPS)` | same |
| Vault auth mode | access policies (`enableRbacAuthorization: false`) | same — access policies |

Terraform derives the secret name and sender from the `communications` stack, so neither needs to be
hardcoded — the table is for verification, not configuration. Prod uses its **own** ACS instance; the
sender GUIDs differ between environments. Re-read the prod sender with:

```bash
SUB=$(az account show --subscription opre-ops-services-prod --query id -o tsv)
az rest --method get --url "https://management.azure.com/subscriptions/${SUB}/resourceGroups/opre-ops-prod-comms-rg/providers/Microsoft.Communication/EmailServices/opre-ops-prod-comms-email/Domains/AzureManagedDomain?api-version=2023-04-01" \
  --query "properties.{mailFrom:mailFromSenderDomain, verified:verificationStates.Domain.status}"
```

(`az resource show` does not work for this resource type — it rejects the nested
`emailServices/domains` path, hence `az rest`.)

**Deliverability caveats to expect on the first send:**

- The sender is an Azure-managed `*.azurecomm.net` subdomain, which ACF mail filtering is likely to
  treat as unfamiliar — tell recipients to check junk on the first run. A custom domain would need
  DNS ownership proof through ACF Tech's formal process (see OPRE-OPS-Data#59 for why it was skipped).
- Newly created ACS Email resources start on a **low-volume trial sending tier**. One report per
  sprint to a handful of recipients fits comfortably; raising the quota needs a manual Azure support
  ticket.
- Staging does **not** predict production: the two use different managed sender domains, so
  SPF/DMARC/reputation are independent. One prod send to one real recipient is required.

## Ongoing image updates

`.github/workflows/stg_be_build_and_deploy.yml` (staging) and `prod_be_build_and_deploy.yml`
(production) repin `opre-ops-<env>-app-usage-metrics` to the deployed SHA, the same way they handle
the `up-schema`, `down-schema` and `data-tools` jobs. Terraform pins the job to the floating
`:stg` / `:prod` tag; the workflow repin keeps a bi-weekly job on a determinate image rather than
relying on a mutable tag being re-pulled. Both point at the same digest from the same build, so the
drift is benign. Staging redeploys automatically on merge to `main`; production is a manual
`workflow_dispatch`.

⚠️ The workflow looks the job up by name. If that name ever drifts from the stack's `locals.tf`
(`format("%s-%s", label_obj.id, "usage-metrics")`), the guarded branch logs "not found; skipping" and
**silently stops pinning forever**.

## Schedule: last Friday of each sprint

The report is wanted **once per sprint, on the sprint's last Friday** (sprints are two weeks). Cron
cannot express "every other Friday" — there is no week-parity field, and restricting day-of-month
alongside day-of-week makes standard cron parsers **OR** the two fields rather than AND them (a
`50 23 8-14,22-28 * 5` would fire on every day in those ranges *and* every Friday). So:

| Piece | Value | Why |
|---|---|---|
| Cron | `50 23 * * 5` | 23:50 UTC **every** Friday. Azure cron is UTC-only; this lands Friday evening US Central (18:50 CDT / 17:50 CST) — after the workday, still on the Friday. |
| Sprint filter | `should_generate_report` in `src/usage_metrics/utils.py` | Off-sprint Fridays log why they are skipping and exit 0 without touching the DB or Blob storage. A run that starts up to two hours late (cold start, retry) is still attributed to the Friday — see `effective_run_date`. |
| `USAGE_METRICS_SPRINT_ANCHOR_DATE` | `2026-09-11` | A known sprint-end Friday; sprint ends are every 14 days from it in both directions. Validated as a Friday at run time — a non-Friday anchor would never line up with the cron, so it raises instead of silently no-opping forever. |
| `USAGE_METRICS_LOOKBACK_DAYS` | `14` | Matches the sprint length, so consecutive reports tile the calendar. Keep these two in step. |

The anchor came from the team's own sprint boundaries — the sprint 106 and 107 release-note commits
landed Friday 2026-08-28 and Friday 2026-09-11, exactly 14 days apart. **If the team's sprint
boundary ever shifts, update `usageMetricsSprintAnchorDate`** in the Terraform stack to any Friday
that ends a sprint (no code change needed).

Both the cron and these values are now Terraform inputs, so change them there rather than with
`az containerapp job update` — an out-of-band change is reverted by the next apply.

Two consequences worth knowing:

- Roughly half the scheduled runs are deliberate no-ops. A skipped run still starts a container and
  shows up in `az containerapp job execution list` as `Succeeded` — check the logs for the "not a
  sprint-end Friday" line before treating a run as a missed report.
- Activity after ~18:50 Central on the sprint's last Friday falls into the *next* sprint's report.
  Nothing is lost, it just lands one report later. The tiling is exact to within a few minutes: the
  14-day window is measured back from when each run actually starts, so a slow cold start or a retry
  can shift a boundary by that much.

## Cutover from the hand-created staging job (done)

Staging previously ran a `usage-metrics-job` created by the deprecated script, on a **Monday** cron
(`50 4 * * 1`) with a 7-day lookback. It completed 4 successful runs (2026-09-07 to 2026-09-28) and
has **already been deleted**, ahead of the Terraform apply, as agreed in review of
[OPRE-OPS-Data#64](https://github.com/HHS/OPRE-OPS-Data/pull/64). There is nothing left to delete.

What that means now:

- **The staging stack was applied on 2026-10-06**, so `opre-ops-stg-app-usage-metrics` now exists
  and runs on the Friday schedule. Email stays off there until a recipient is committed.
- Blobs under `opreopsstgappsa/data` are untouched, so the old weekly reports remain. Log Analytics
  logs for the old runs stay keyed to the name `usage-metrics-job`, so saved queries need both names.
- **There is a reporting gap.** The window moves from 7 to 14 days and the run moves to the
  sprint-end Friday; the first report on the new schedule is **Friday 2026-10-09**. Confirm with UX
  that nobody depends on the Monday weekly output.

It was deleted rather than imported because `name` is `ForceNew` in the provider, so keeping the old
name and adopting the convention are mutually exclusive, and the imported resource would have
diverged on cron, lookback, retry limit, six env vars, two secrets and the image anyway.
