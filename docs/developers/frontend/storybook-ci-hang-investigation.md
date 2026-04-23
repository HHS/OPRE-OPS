# Storybook CI Hang Investigation & Fix

**Date:** 2026-04-23
**Affected workflows:** `Continuous Integration` (all PR branches)
**Symptoms:** E2E test matrix jobs hanging for >1 hour; normal CI wall-time is ~20 min
**Fixed by:** `hotfix/storybook-ci-hang` → PR #XXXX

---

## Symptom

PR CI runs were hanging with the following build step stuck indefinitely:

```
#37 [frontend-static build 8/8] RUN VITE_BACKEND_DOMAIN=http://localhost:8080 \
    VITE_ENABLE_MSW=${VITE_ENABLE_MSW} NODE_ENV=dev bun run build --mode dev && \
    if [ "dev" != "production" ]; then \
      CI=true bun run build-storybook --output-dir build/storybook --quiet; \
    fi
```

The job never failed — it just sat there until GitHub's 6-hour runner limit eventually killed it.

---

## Investigation

### Step 1 — Narrow the workflow

`dev_fe_build_and_deploy` (the direct push-to-main Docker build) was completing in **2–3 minutes** with no issues. The hang only reproduced on pull-request CI runs — specifically the `Continuous Integration` workflow.

### Step 2 — Identify the stuck job

Querying the GitHub Actions API for the in-progress run `24835948034` showed that out of ~40 parallel E2E shards, exactly two were stuck:

| Stuck job | Step hung on |
|---|---|
| `End-to-End Testing (procurementShopChangeRequest.cy.js)` | **Launch Stack** (step 6 of 15) |
| `End-to-End Testing (reviewChangeRequestResponse.cy.js)` | **Launch Stack** (step 6 of 15) |

All other shards had already completed. Everything downstream of Launch Stack (Cypress itself, artifact upload, log capture) was pending.

### Step 3 — Trace Launch Stack to Dockerfile.azure

The `run-full-stack` composite action runs:

```bash
docker compose -f docker-compose.static.yml --profile setup up --build -d
```

`docker-compose.static.yml` passes `MODE: dev` to `Dockerfile.azure`, which triggered the `if [ "${MODE}" != "production" ]` branch and ran `bun run build-storybook`.

### Step 4 — Why dev_fe doesn't reproduce it

`dev_fe_build_and_deploy` uses the `build-and-push` action, which pulls `--cache-from ghcr.io/.../latest` and `ghcr.io/.../deps`. The storybook build layer is a cache hit, so Docker skips it entirely. The E2E `docker compose up --build` has **no registry cache** — every shard builds Storybook from scratch, cold, concurrently.

### Step 5 — Root cause

GitHub Actions runners are 2 vCPU / 7 GB RAM. Each E2E shard launches the full stack:
`postgres` + `data-import` + `backend` + `frontend-static` (Docker build) — all in the same runner, simultaneously.

When `bun run build-storybook` executes inside the Docker build, Vite spawns worker threads for the manager bundle and the preview bundle in parallel. Under memory pressure (postgres + flask already resident), one of the Vite worker threads intermittently OOMs or stalls waiting for a system resource. Because the command was wrapped in `--quiet`, **no output was emitted**, so GitHub Actions received no stdout/stderr and didn't detect the hang.

Without a `timeout`, the job sat at the GitHub-default maximum of **360 minutes**.

### Step 6 — Why PR #5569 didn't fix it

PR #5569 added `CI=true` to disable Storybook's interactive telemetry prompts and removed the `addon-onboarding` addon. Neither addressed the underlying issue:

- `CI=true` suppresses the interactive prompt but doesn't prevent Vite worker OOM.
- `addon-onboarding` removal had no effect on memory usage.
- `--quiet` was retained, keeping the hang invisible.

---

## Fix

### 1. `frontend/Dockerfile.azure` — new `BUILD_STORYBOOK` build arg

Replaced the `MODE != production` gate with an explicit opt-in arg that **defaults to `false`**:

```dockerfile
ARG BUILD_STORYBOOK=false

RUN ... bun run build --mode ${MODE} && \
    if [ "${BUILD_STORYBOOK}" = "true" ]; then \
      CI=true timeout 600 bun run build-storybook --output-dir build/storybook; \
    fi
```

Changes:
- `--quiet` **removed** — verbose output is essential for diagnosing future hangs.
- `timeout 600` added — fails the Docker layer after 10 minutes instead of silently hanging for hours.
- Gate is now independent of `MODE`, so a future `MODE=staging` or similar won't accidentally re-enable it.

### 2. `docker-compose.static.yml` — explicit `BUILD_STORYBOOK: "false"`

```yaml
args:
  VITE_BACKEND_DOMAIN: ${BACKEND_DOMAIN:-http://localhost:8080}
  MODE: dev
  BUILD_STORYBOOK: "false"  # never build Storybook in the E2E stack
```

E2E CI and local `docker compose -f docker-compose.static.yml up` no longer build Storybook. Storybook is not served in that stack and was never needed there.

### 3. `dev_fe_build_and_deploy.yml` and `stg_fe_build_and_deploy.yml` — opt in

```yaml
build_args: "..., BUILD_STORYBOOK=true"
```

Only the two deploy workflows that actually serve `/storybook` opt in. `prod_fe_build_and_deploy.yml` is intentionally left without `BUILD_STORYBOOK` — production has no storybook endpoint.

### 4. `storybook_build.yml` — drop `--quiet`, add timeout

```yaml
timeout-minutes: 15    # job-level hard cap

- name: Build Storybook
  run: CI=true timeout 600 bun run build-storybook
```

The dedicated Storybook PR check now surfaces build output and fails fast.

---

## Storybook build matrix — who builds what

| Context | `BUILD_STORYBOOK` | Storybook built? |
|---|---|---|
| E2E `docker compose -f docker-compose.static.yml` | `false` (explicit) | ❌ |
| `docker compose up` (local dev) | `false` (default) | ❌ |
| `prod_fe_build_and_deploy` | `false` (default) | ❌ |
| `dev_fe_build_and_deploy` | `true` (explicit) | ✅ served at `/storybook` |
| `stg_fe_build_and_deploy` | `true` (explicit) | ✅ served at `/storybook` |
| `storybook_build.yml` (PR check) | n/a (host, not Docker) | ✅ verify-only, not deployed |

---

## Local verification

To confirm the fix locally before merging:

```bash
# 1. Cold build without Storybook (mimics E2E path) — should finish in ~2 min
docker build \
  --build-arg MODE=dev \
  --build-arg VITE_BACKEND_DOMAIN=http://localhost:8080 \
  --build-arg VITE_ENABLE_MSW=false \
  --build-arg BUILD_STORYBOOK=false \
  -f frontend/Dockerfile.azure frontend/
# Expected: no "build-storybook" output in layer 8/8

# 2. Build with Storybook (mimics dev deploy) — should finish in ~5–15 min
docker build \
  --build-arg MODE=dev \
  --build-arg VITE_BACKEND_DOMAIN=http://localhost:8080 \
  --build-arg VITE_ENABLE_MSW=false \
  --build-arg BUILD_STORYBOOK=true \
  -f frontend/Dockerfile.azure frontend/
# Expected: Storybook build output visible, no --quiet suppression

# 3. E2E full stack (smoke test the compose change)
docker compose -f docker-compose.static.yml --profile setup up --build -d
# Expected: frontend-static build completes quickly, no storybook step
```

---

## Related

- PR #5569 — prior (partial) fix attempt: added `CI=true`, removed `addon-onboarding`, added nginx `/storybook` location
- PR #5531 — introduced Storybook 10 infrastructure (Phase 0)
- ADR 031 — [`docs/adr/031-storybook-for-component-documentation.md`](../../adr/031-storybook-for-component-documentation.md)
