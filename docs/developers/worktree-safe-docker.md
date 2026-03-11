# Worktree-Safe Docker Compose (Issue #5237)

This document tracks the plan and progress for making the local Docker Compose stack safe for parallel development using Git worktrees.

## Goals

- Allow developers to run the local Docker/Compose stack from multiple Git worktrees or parallel checkouts without container-name or port collisions
- Restore normal Compose project isolation for local development
- Reduce confusion from stale exited setup containers in local container tooling

## Tasks

- [x] **Task 1:** Remove all `container_name` lines from all 6 compose files
- [x] **Task 2:** Parameterize host ports with `${VAR:-default}` syntax in all 6 compose files
- [x] **Task 3:** Parameterize `VITE_BACKEND_DOMAIN` / `REACT_APP_BACKEND_DOMAIN` with `${BACKEND_DOMAIN:-http://localhost:8080}`
- [x] **Task 4:** Add `profiles: [setup]` to `data-import` and `disable-users` services in all 4 main compose files
- [x] **Task 5:** Update `README.md` with multi-worktree workflow documentation
- [x] **Task 6:** Update `AGENTS.md` Docker commands section to reflect profile usage
- [x] **Task 7:** Verify compose files parse correctly (`docker compose config`)

---

## Detailed Plan

### Task 1: Remove fixed `container_name` values

**Files affected:** All 6 compose files
**Action:** Delete every `container_name:` line.

Without `container_name`, Docker Compose auto-generates names using the pattern `{project_name}-{service_name}-{instance}`, which is unique per Compose project. This is the single most impactful change — it eliminates the "container name already in use" error.

| File | `container_name` values to remove |
|---|---|
| `docker-compose.yml` | `ops-db`, `ops-data-import`, `disable-users`, `ops-backend`, `ops-frontend` |
| `docker-compose.static.yml` | `ops-db`, `ops-data-import`, `disable-users`, `ops-backend`, `ops-frontend` |
| `docker-compose.demo.yml` | `ops-db`, `disable-users`, `ops-frontend-demo`, `ops-backend-demo`, `ops-data-demo` |
| `docker-compose.initial.yml` | `ops-db`, `ops-data-import`, `disable-users`, `ops-backend`, `ops-frontend` |
| `backend/ops_api/tests/docker-compose.yml` | `unit-test-db`, `pytest-data-import` |
| `backend/data_tools/tests/docker-compose.yml` | `unit-test-db` |

---

### Task 2: Parameterize host ports

**Files affected:** All 6 compose files
**Action:** Replace hard-coded port mappings with `${VAR:-default}` syntax.

| Service | Before | After |
|---|---|---|
| `db` | `"5432:5432"` | `"${DB_PORT:-5432}:5432"` |
| `backend` | `"8080:8080"` | `"${BACKEND_PORT:-8080}:8080"` |
| `frontend` | `"3000:3000"` | `"${FRONTEND_PORT:-3000}:3000"` |

For the test compose files:
- `backend/ops_api/tests/docker-compose.yml`: `"${DB_PORT:-5432}:5432"`
- `backend/data_tools/tests/docker-compose.yml`: `"${DB_PORT:-54321}:5432"` (preserves the existing non-standard default)

All defaults match current behavior, so no changes are required for developers who don't set these variables.

---

### Task 3: Parameterize frontend backend domain

**Files affected:** `docker-compose.yml`, `docker-compose.demo.yml`, `docker-compose.initial.yml`, `docker-compose.static.yml`
**Action:** Replace the hard-coded `localhost:8080` backend URL with a parameterized variable.

```yaml
# Before
- VITE_BACKEND_DOMAIN=http://localhost:8080
- REACT_APP_BACKEND_DOMAIN=http://localhost:8080

# After
- VITE_BACKEND_DOMAIN=${BACKEND_DOMAIN:-http://localhost:8080}
- REACT_APP_BACKEND_DOMAIN=${BACKEND_DOMAIN:-http://localhost:8080}
```

Also update the build arg in `docker-compose.static.yml`:

```yaml
# Before
args:
  VITE_BACKEND_DOMAIN: http://localhost:8080

# After
args:
  VITE_BACKEND_DOMAIN: ${BACKEND_DOMAIN:-http://localhost:8080}
```

---

### Task 4: Move one-shot services behind a `setup` profile

**Files affected:** `docker-compose.yml`, `docker-compose.static.yml`, `docker-compose.demo.yml`, `docker-compose.initial.yml`
**Action:** Add `profiles: [setup]` to `data-import` and `disable-users` services, and remove `data-import` from `backend`'s `depends_on`.

**Why remove `depends_on: data-import`?**
When `data-import` is in a profile and not activated, `backend`'s dependency on it would prevent the backend from starting. Removing the dependency is safe — the backend can start with an empty database.

**New developer workflows:**

```bash
# First run or data reset — starts the full stack including setup services that seed the database
docker compose --profile setup up --build

# Subsequent runs — starts db + backend + frontend only (no setup containers)
docker compose up --build
```

This eliminates stale exited `data-import` and `disable-users` setup containers from showing up in Docker Desktop / `docker ps -a` on every run.

---

### Task 5: Update `README.md`

Add a new section "Running Multiple Worktrees in Parallel" covering:

- Why `COMPOSE_PROJECT_NAME` matters (Docker Compose defaults to the directory name, so worktrees in different directories already get unique project names after Tasks 1–4)
- How to set port variables for parallel instances
- Example command matching the issue's target workflow:

```bash
COMPOSE_PROJECT_NAME=ops_feature_xyz \
DB_PORT=55432 \
BACKEND_PORT=58080 \
FRONTEND_PORT=53000 \
BACKEND_DOMAIN=http://localhost:58080 \
docker compose --profile setup up --build
```

---

### Task 6: Update `AGENTS.md`

Update the Docker Commands section to reflect:
- Profile-based commands for setup vs. day-to-day use
- New environment variable options for port customization

---

### Task 7: Validate compose files

Run `docker compose config` on each file to confirm YAML syntax is valid and variable interpolation resolves correctly:

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.static.yml config
docker compose -f docker-compose.demo.yml config
docker compose -f docker-compose.initial.yml config
docker compose -f backend/ops_api/tests/docker-compose.yml config
docker compose -f backend/data_tools/tests/docker-compose.yml config
```

---

## Risks and Considerations

1. **Profile + `depends_on` interaction:** When `data-import` is behind a profile and not activated, `backend`'s `depends_on` on `data-import` blocks startup. Removing that dependency is required. On a first run without `--profile setup`, the backend will start against an empty database — the docs must make the `--profile setup` workflow clear.

2. **Backward compatibility:** For developers who don't set any variables, all defaults match current behavior (ports `5432`/`8080`/`3000`, `http://localhost:8080`). The only behavioral change is needing `--profile setup` to run data seeding.

3. **No `.env` file committed:** Variables are documented rather than provided in a `.env.example` to avoid conflicts with Docker Compose's auto-loading of `.env` and reduce the risk of accidental commits of secrets.
