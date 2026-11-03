---
issue: 6419
branch: OPS-6419/preview-workflows
---

# DevEx: Per-PR ephemeral preview environments

## Goal

Let any same-repo PR labeled `preview` get its own temporary full-stack deployment at `https://pr-<N>.ops.opre.acf.gov`, so QA can test before merge and fixes land in the same open PR instead of a new PR → approvals → merge → deploy cycle.

## Acceptance Criteria

- [ ] Adding the `preview` label to a same-repo PR deploys a preview at `https://pr-<N>.ops.opre.acf.gov` and posts the URL as a PR comment
- [ ] The preview runs the PR's own backend, frontend and data-tools images, so both UI and API changes are visible
- [ ] Requests take the same path as dev: App Gateway (WAF) → path-based routing on one hostname → internal Container Apps
- [ ] Each preview has its own database (`ops_pr_<N>`) on a dedicated preview Postgres server; data created on a preview never shows up on dev or another preview
- [ ] When the label is first added, the database is created and seeded with test data; later pushes only run `alembic upgrade head`, so data QA entered survives fix commits
- [ ] A manual workflow can force a full reseed
- [ ] Logging in with FakeAuth works on a preview, including writes (create an agreement), which shows the CSRF Host/Referer checks pass
- [ ] Removing the `preview` label or closing the PR deletes the container apps, database, gateway objects and DNS record
- [ ] Adding or removing any _other_ label on a previewed PR does nothing: no reseed, no teardown
- [ ] Fork PRs never trigger preview workflows
- [ ] At most 8 previews run at once; a PR over the cap gets an explanatory comment and no gateway objects or hostname
- [ ] A nightly reaper removes previews for closed PRs, unlabeled PRs, and PRs inactive past the TTL (3–5 days), and leaves healthy live previews alone
- [ ] dev and staging ingress (which share the same App Gateway) are never changed by any preview workflow

### ACs narrowed for option (a)

The team chose a wildcard listener plus a preview router ([ADR 032](../../docs/adr/032-pr-preview-environments.md)) instead of per-PR gateway objects. The AC checkboxes above stay verbatim from the issue. Until the issue is updated, these four are **narrowed** as follows:

- **AC3 (request path):** App Gateway (WAF) → the wildcard listener → the preview router → that PR's internal Container Apps. `/api`, `/auth` and `/documents` go to the PR's backend; everything else goes to its frontend.
- **AC8 (teardown):** removing the label or closing the PR deletes the PR's container apps and database, and its URL stops serving the preview (a 404 page). There are no per-PR gateway objects or DNS records to delete.
- **AC11 (cap):** at most 8 previews run at once. A PR over the cap gets a comment explaining why, and nothing is deployed for it. Its hostname still resolves (wildcard DNS) but returns a 404.
- **AC13 (dev/staging untouched):** apart from the one-time wildcard listener and DNS change made in Terraform, no preview workflow changes the shared App Gateway or DNS. If the router fails, only previews go down.

## Technical Details

### Approach

Option (a) from [ADR 032](../../docs/adr/032-pr-preview-environments.md):

- The teammate who handles infra adds one Terraform-managed wildcard listener for `*.ops.opre.acf.gov`, plus a wildcard DNS record. It points at the preview router container app, also defined in Terraform.
- The router (`preview/router/`) reads `x-original-host` and proxies to `opre-ops-pr<N>-app-{frontend,backend}.<ACA domain>`. It sends `Host: <target>:443` so `check_csrf` passes.
- Each PR's apps and database are managed by the workflows.

Delivery:

| Part | Status | Contents |
|---|---|---|
| Part 1 | Merged (PR 6448) | `preview.py`, `preview_seed.sh`, startup prefix check, frontend backend-domain fallback |
| Part 2, PR A (`OPS-6419/preview-backend-fixes`) | Merged | Pool 2 + 3 (threads + 1, to avoid write deadlocks) with a 10s timeout, a `HEALTH_CHECK_AUTH_SERVICES` flag (off on previews), and a startup wiring test |
| Part 2, PR B (`OPS-6419/preview-router`) | Merged | The router image and its build/smoke-test workflow, ADR 032, this story update |
| Infra (HHS/OPRE-OPS-Data PR 76) | Applied | Wildcard listener and DNS, the router app, the preview Postgres server |
| Part 3, infra (HHS/OPRE-OPS-Data) | In progress | The `opre-ops-dev-app-preview-db` job: holds the secrets and runs `preview_seed.sh` inside the VNet |
| Part 3 (this branch) | In progress | The create, destroy and reap workflows, `.github/scripts/preview.sh`, the per-database `CONNECTION LIMIT`, and the docs |

Decisions so far:

- **Reseed (AC6):** a `workflow_dispatch` trigger on `preview_create.yml`, with `pr_number` and `reseed` inputs and a same-repo check.
- **First label vs. later push (AC5):** `preview_seed.sh ensure` checks a "seed finished" marker on the database.
- **Fork safety (AC10):** `pull_request`, not `pull_request_target`, plus a job-level check that the PR's head repo is this repo.
- **Secrets (part 3):** the deploy identity (`SDLC_AZURE_CREDS`) can't read Key Vault, and runners can't reach the private preview server. So a Terraform-managed container app job, `opre-ops-dev-app-preview-db`, holds `pgpassword`, `admin-pgpassword`, `jwt-private-key` and `jwt-public-key`. The workflows copy the backend's secrets from it through the management plane, and run every database step inside it.
- **Separate preview JWT keypair:** previews sign tokens with their own keys (Key Vault `preview-jwt-{private,public}-key`), so code from an open PR never holds the key that signs dev tokens.
- **Slot claim is optimistic, not locked:** instead of a short lock for claiming a slot, a PR creates its placeholder backend app first and then recounts. If more than 8 exist, the latest claims (by `preview-created` tag, ties to the higher PR number) delete theirs and post the cap comment. Every run sorts the same way, so no shared lock is needed and no queued run is dropped.
- **Database:** one B1ms preview server (35 usable connections). Each preview keeps 2 connections idle and up to 5 under load (threads + 1, because a write can hold two connections). Steady state is about 16; going past 35 needs all 8 previews at full write load at once.

### Key Files

- **Router:**
  - `preview/router/` (`nginx.conf.template`, `docker-entrypoint.sh`, `Dockerfile`, `README.md`)
  - `.github/workflows/preview_router_build.yml`
- **Backend:**
  - `backend/ops_api/ops/environment/azure/preview.py`
  - `backend/ops_api/ops/utils/health_check.py`
  - `backend/data_tools/scripts/preview_seed.sh`
- **Part 3 workflows:** `.github/workflows/preview_create.yml`, `preview_destroy.yml`, `preview_reap.yml`
- **Docs:**
  - `docs/adr/032-pr-preview-environments.md`
  - `docs/developers/preview-environments.md` (part 3)
  - the `CLAUDE.md` CI/CD section and the `README.md` Deployment section

### Testing Strategy

Per `docs/TESTING.md`: test at the lowest level, and skip config, glue and generated artifacts.

- **Backend unit (pytest, no DB):**
  - `test_preview_config.py`: the preview Host and Referer pair passes `check_csrf`; another PR's Host or Referer is rejected; the fakeauth client is reused from dev.
  - `test_api_helpers.py`: the prefix must end in `.`.
  - PR A adds the health-check flag tests and the `create_app` wiring test.
- **Router:**
  - The image build runs `nginx -t`, and hadolint runs in pre-commit.
  - The CI smoke test checks `/healthz`, the 404 guard for invalid hosts, and the backend/frontend split, using the access log's `target=` field against an unresolvable domain.
  - TLS, the resolver and CSRF through the router are verified on the first real preview, using the checklist in `preview/router/README.md`.
- **Workflow-level ACs:** verified by hand on a live preview once part 3 lands.
- **No E2E:** this isn't a critical user journey, and E2E runs against docker-compose, not Azure.

### Constraints

- **The shared App Gateway is managed by Terraform.** Previews must never change it after the one-time wildcard change.
- **Infra prerequisites (Increment 0, done by the teammate who handles infra):**
  - the wildcard listener (priority after dev and staging, plus IPv6) and DNS records
  - the router container app
  - the preview Postgres server with `GRANT ops TO psqladmin`
  - the two secrets
  - the deploy identity: a narrow OIDC identity, ideally on its own resource group. **Not met; accepted for now.** The workflows use the existing `SDLC_AZURE_CREDS` (Contributor on the SDLC subscription). Same-repo PR workflows already receive that secret and any write-access user can push a workflow, so running a PR-modified script adds no new exposure. A narrow OIDC identity is a follow-up.
  - making the GHCR package pullable
- **Carried into part 3, from the reviews:**
  - **Locking:** one lock per PR, plus a short lock only for claiming one of the 8 slots. Not a single global concurrency group, which can drop pending runs.
  - **Connections:** a per-database `CONNECTION LIMIT`, one backend replica per preview, and DB jobs run one at a time.
  - **TTL:** based on activity, not just the last commit, with a warning comment before teardown.
  - **Reaper:** finds orphans from Azure resources (`opre-ops-pr*` apps, `ops_pr_*` databases), not from the PR list.
  - **Health check:** after each deploy, assert `db_conn_is_ok` in `/api/v1/health/`. The gateway only probes the router.
  - **QA-facing:** one PR comment updated as status changes (URL, commit, status, last seeded); the list of FakeAuth roles; what happens at the cap; how to trigger a reseed; the known limits.
- **Preview limits:** FakeAuth only, no `/storybook` or `/docs/*`, no document upload until the managed identity lands, and changing an already-applied migration needs a manual reseed.
