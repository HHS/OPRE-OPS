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
- **`docs/TESTING.md`**: Testing philosophy and the test-type decision matrix — consult before adding any new test, at any layer
- **`docs/REVIEW.md`**: Code review standards — severity levels, what blocks a merge, and when a review is done — follow it when reviewing any PR

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

## Pre-Commit Workflow

**ALWAYS run these checks before committing and pushing:**

### Frontend Changes
```bash
cd frontend
bun run format              # Auto-fix formatting
bun run lint --fix          # Auto-fix linting issues
bun run test --watch=false  # Run all unit tests
```

### Backend Changes
```bash
cd backend/ops_api
pipenv run black --config ./pyproject.toml .  # Auto-format
pipenv run nox -s lint                        # Linting check
pipenv run pytest                             # Run all tests
```

**Why this matters:** Pre-commit hooks will catch some issues, but running these manually first:
- Prevents CI failures from formatting/linting
- Catches test failures before pushing
- Saves time by finding issues locally

## Commit Message Standards

Uses **Conventional Commits** enforced by commitlint.

```
<type>: <description>
```

**Types:** feat, fix, refactor, test, docs, chore, style

- Always use conventional commit format (commitlint will reject non-conforming commits)
- Check recent commits with `git log --oneline -5` to match repository style
- Include ticket numbers in branch names (e.g., `OPS-4927/feature-name`), not in commit messages
- **Single line only, under 100 characters** — no multiline body, no blank lines
- **No trailers** — no `Co-Authored-By`, no `Signed-off-by`, nothing after the subject line
- Always commit with `git commit -m "type: description"` — never HEREDOC (multiline fails commitlint)

## Branching

Always branch from `main` (not from another feature branch), unless explicitly instructed otherwise.

**Naming patterns:**
- Ticket work: `OPS-NNNN/short-description` (e.g. `OPS-6028/disable-save-draft`)
- Docs/tooling with no ticket: `docs/short-description` (e.g. `docs/claude-commit-conventions`)
- Hotfixes: `OPS/hotfix-description`

**Rules:**
- Never commit directly to `main`
- Branch names use kebab-case after the prefix
- Keep descriptions short — 3-5 words max

## Pre-commit Hooks

Required for development. Enforces linting, formatting, and security scanning.

```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

## Pull Request Standards

- **Never add `Closes #NNN`, `Fixes #NNN`, or `Resolves #NNN`** to PR descriptions. The team's process requires additional review and QA steps before a story moves out of "in progress" — auto-closing on merge skips those steps.
- Reference the ticket in the branch name only (e.g. `OPS-5931/feature-name`).

## Code Review

<!-- Summary of docs/REVIEW.md. Change both in the same PR; if they differ, docs/REVIEW.md wins. -->

When reviewing a PR, read [`docs/REVIEW.md`](docs/REVIEW.md) first: it has the full rubric, the finding format and the risk tiers. If this summary and `docs/REVIEW.md` differ, `docs/REVIEW.md` wins. The core rules:

- **Label every finding S0, S1, S2 or S3. Only S0 and S1 block a merge.**
  - **S0:** data loss or corruption, a security or authorization bypass, wrong money math (computing or saving fees, budget line totals, CAN balances), or a broken migration.
  - **S1:** a user-visible bug on a realistic path, a display-only money formatting error, the linked issue's acceptance criteria not met, or an accessibility defect in new or changed UI (WCAG 2.1 AA is a contractual and ATO requirement).
  - **S2:** a bug that needs an edge case, or a missing test. **S3:** style, refactor ideas, wrong comments or docstrings. Neither S2 nor S3 blocks.
  - If a tool uses its own severity scale (e.g. Critical/High/Medium/Low), also label each finding S0–S3; only the S0–S3 label decides blocking.
- **Tests are required for money math, authorization and migrations.** A PR that changes them must include a test for that change; a missing one is S1.
- **Scope exceptions:** for Renovate and other bot PRs only S0 blocks; for docs-only PRs only a factually wrong command, path or rule blocks.
- **Only defects the PR introduces, makes reachable or makes worse can block.** Report older problems as `[Pre-existing S<n>]`; they never block.
- **Every finding needs a concrete scenario** (inputs or state that produce the wrong result). A finding with no realistic scenario is S3 at most.
- **Pick a severity by the outcome your scenario actually shows**, not the worst case it might reach.
- **End an AI review with `Verdict: BLOCKING (n)` or `Verdict: NOT BLOCKING`**, and list at most 5 S2/S3 findings. Don't guess acceptance criteria you can't see.

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

See [`.claude/templates/README.md`](.claude/templates/README.md) for usage. Story files in `.claude/stories/` are tracked in git.
