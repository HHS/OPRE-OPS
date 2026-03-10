# CLAUDE.md

## Project Overview

OPRE OPS is the Portfolio Management System for OPRE (Office of Planning, Research and Evaluation), replacing the legacy MAPS system. It's a full-stack web application with a Flask/SQLAlchemy backend API and a React/Redux frontend, containerized with Docker.

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## Subdirectory Guides

Each major directory has its own `CLAUDE.md` with detailed commands, architecture, and patterns:

- **`backend/ops_api/CLAUDE.md`**: Backend Flask API — commands, testing, architecture, authorization patterns
- **`backend/data_tools/CLAUDE.md`**: ETL and data import — load_data CLI, test fixtures, environment configs
- **`frontend/CLAUDE.md`**: React frontend — commands, testing, RTK Query, component patterns

## Data Model

PostgreSQL with SQLAlchemy ORM. Key domain entities:

- **CANs** (Contract Account Numbers): Funding sources with budgets and fiscal year tracking
- **Agreements**: Contracts or grants with budget line items
- **Projects**: Organizational units that group agreements
- **Portfolios**: Top-level organizational structure
- **Budget Line Items**: Line-level budget allocations linking agreements to CANs
- **Users**: Authentication and authorization with role-based permissions

All models have automatic audit history tracking via the event system.

## Fee Percentage Format Convention

**CRITICAL**: Fee percentages are stored and passed as whole numbers throughout the stack (e.g., `5.0` = 5%, not `0.05`). The frontend `calculateTotal` helper in `frontend/src/helpers/agreement.helpers.js` divides by 100 internally — do NOT pre-divide.

```javascript
// CORRECT
const fee = calculateTotal(budgetLines, 5.0); // 5% fee rate

// INCORRECT — results in 0.05% fee rate
const fee = calculateTotal(budgetLines, 5.0 / 100);
```

## Docker

The application runs four services: **db** (PostgreSQL), **data-import** (seeds test data), **backend** (Flask, port 8080), **frontend** (Vite, port 3000).

```bash
docker compose up --build             # Full app with hot reload
docker compose up --build -d          # Detached mode
docker compose up db data-import --build  # Database + test data only
docker system prune --volumes         # Clean state between E2E runs
```

## Commit Message Standards

Uses **Conventional Commits** enforced by commitlint.

```
<type>: <description>
```

**Types:** feat, fix, refactor, test, docs, chore, style

- Always use conventional commit format (commitlint will reject non-conforming commits)
- Check recent commits with `git log --oneline -5` to match repository style
- Include ticket numbers in branch names (e.g., `OPS-4927/feature-name`), not in commit messages

## Pre-commit Hooks

Required for development. Enforces linting, formatting, and security scanning.

```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

## CI/CD

GitHub Actions for CI/CD. Workflows in `.github/workflows/`.
- Dev and staging deploy automatically on push to `main`
- Production deploys manually via GitHub Actions

Flaky E2E test detection runs automatically in CI. Use the `/e2e-tests` skill to run, monitor, or fix E2E tests.

## Claude Actions

Reusable automation scripts in `.claude/actions/`:

- **`monitor-ci.sh`**: Monitor GitHub Actions CI runs until completion
- **`quick-ci-status.sh`**: Instantly check the latest CI run status

See [`.claude/actions/README.md`](.claude/actions/README.md) for usage.

## Claude Story Templates

Story templates in `.claude/templates/` for planning and implementation:

- **`feature-story.md`**, **`bug-story.md`**, **`refactor-story.md`**

See [`.claude/templates/README.md`](.claude/templates/README.md) for usage. Story files in `.claude/stories/` are gitignored.
