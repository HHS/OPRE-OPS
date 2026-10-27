---
issue: 6419
branch: OPS-6419/pr-preview-environments
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

## Technical Details

### Approach

Follow the issue's increment plan (0–7). Each PR gets Azure Container Apps in `opre-ops-dev-app-rg` behind the shared dev/staging App Gateway. The gateway and DNS are changed only through one declarative reconcile script (`appgw_reconcile.py`): a single read-modify-write PUT that touches only `pr<N>-*` objects, has `--dry-run`, and fails closed on any other diff.

Decisions from planning:
- **Reseed (AC6):** a `workflow_dispatch` trigger on `preview_create.yml`, with `pr_number` and `reseed` inputs and a same-repo check
- **TTL (AC12):** 3 days since the PR head commit's last push
- **First label vs. later push (AC5):** detect by whether `ops_pr_<N>` exists, which stays idempotent after a partial failure
- **Cap and AC13 safety:** a single global `concurrency:` group shared by create, destroy and reap, since gateway PUTs have no ETag guard
- **Fork safety (AC10):** use `pull_request`, not `pull_request_target`, plus an explicit job-level `if:` that the head repo is this repo
- **Backend config:** the ACA backend sets `OPS_CONFIG` to `preview.py`. `preview.py` reads these from env vars: `OPS_FRONTEND_URL` (also drives CORS), `HOST_HEADER_PREFIX`, and the FakeAuth `redirect_uri`.

### Key Files

- `frontend/src/helpers/backend.js` (+ new `frontend/src/helpers/backend.test.js`)
- `frontend/Dockerfile.azure` (each PR gets its own frontend build with `VITE_BACKEND_DOMAIN=https://pr-<N>.ops.opre.acf.gov`, reusing `MODE=dev`)
- `backend/ops_api/ops/environment/azure/preview.py`
- `backend/ops_api/tests/ops/test_preview_config.py` (DB-free `check_csrf` + preview config tests)
- `backend/data_tools/scripts/preview_seed.sh` (wraps `initial_data.sh` / `upgrade_schema.sh` / `load_data.sh`)
- `backend/data_tools/environment/` (verify whether a preview config is needed)
- `.github/scripts/preview_bootstrap.sh`, `.github/scripts/appgw_reconcile.py`, `.github/scripts/tests/`, `.github/scripts/README.md`
- `.github/workflows/preview_create.yml`, `preview_destroy.yml`, `preview_reap.yml`
- `.github/workflows/unit_test_reusable.yml` (add a pytest step for `.github/scripts/tests/`)
- `docs/adr/032-pr-preview-environments.md`, `docs/developers/preview-environments.md`, `CLAUDE.md`, `README.md`

### Testing Strategy

Per `docs/TESTING.md`: test at the lowest level, and skip config, glue and generated artifacts.

- **Unit (Vitest), `backend.test.js`:** the precedence chain `__RUNTIME_CONFIG__` → `VITE_BACKEND_DOMAIN` → `https://localhost:8000`. `BACKEND_DOMAIN` is a module-level const, so each case uses `vi.resetModules()` plus `vi.stubEnv` and a dynamic import.
- **Backend unit (pytest), `test_preview_config.py`:**
  - The preview Host/Referer pair passes `check_csrf`, and a FakeAuth write succeeds.
  - A Referer from another PR is rejected.
  - pr12 vs pr123: `check_csrf` uses `startswith`, so the prefix must keep its trailing delimiter, and the test asserts a pr123 host is rejected for pr12.
- **Unit (pytest), `.github/scripts/tests/`:** cover `appgw_reconcile.py` with fixture gateway and DNS JSON, plus a new CI step.
  - Adding PR N creates exactly the `pr<N>-*` objects, and removing it deletes only those.
  - Re-running is idempotent and issues no PUT.
  - Removing pr12 leaves `pr123-*` alone.
  - Fail closed on any non-`pr<N>-` change, a priority collision, going over the cap, or malformed state.
  - `--dry-run` never calls PUT.
- **Shell:** no bats. The repo has no shell test framework. The `preview_seed.sh` guard is one anchored regex, `^ops_pr_[1-9][0-9]*$`, checked before any drop.
- **Not tested:** the `preview.py` constants, the workflow YAML, `preview_bootstrap.sh`, and docs.
- **Manual verification on a live preview:** every workflow-level AC (deploy and comment, own images, WAF path, DB isolation, seed then migrate, reseed, teardown, other labels do nothing, forks, cap, reaper, dev/staging unchanged). For dev/staging, also check the reconcile dry-run diff in the CI logs.
- **No E2E:** this isn't a critical user journey, and E2E runs against docker-compose, not Azure.

### Constraints

- The App Gateway serves **both dev and staging**. Every change is a full PUT (3–8 minutes), and concurrent PUTs can silently lose changes. Only the reconcile script touches it, and only under the global concurrency lock.
- Gateway/ACA must forward a Host header that ends in `:443` and starts with the preview backend prefix.
- Blocked on Increment 0 DevOps prerequisites: SP permissions, the preview Postgres server, secrets, and the `preview` label.
- Open questions to settle before Increments 4–5:
  - Can the shared probe/http-settings use a host-name pairing?
  - Does the gateway PUT honour `If-Match`?
  - How do `az containerapp job start` overrides behave?
  - Can `psqladmin` force-drop databases owned by `ops`?
- Previews have limits: FakeAuth only; no `/storybook` or `/docs/*`; no document upload until the managed identity lands; amending an applied migration needs a manual reseed.
