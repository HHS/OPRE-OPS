# Contributing to OPRE OPS

Thank you for contributing to OPRE OPS! This guide covers everything you need to know to make successful contributions.

## Table of Contents

- [Quick Start for Web UI Contributors](#quick-start-for-web-ui-contributors)
- [Local Development Setup](#local-development-setup)
- [Code Formatting](#code-formatting)
- [Commit Message Conventions](#commit-message-conventions)
- [Running Tests](#running-tests)
- [Submitting a Pull Request](#submitting-a-pull-request)

---

## Quick Start for Web UI Contributors

If you're making small changes (doc fixes, typo corrections, minor edits) directly through GitHub's web interface, here's what to expect:

**Formatting is auto-fixed for you.** When CI detects a commit made via the GitHub web UI, it automatically runs the formatters (Prettier, Black, isort) and commits the fixes. You'll see a bot comment on your PR if this happens.

**Linting errors still require attention.** Auto-formatting only fixes code style (whitespace, import order, etc.). If your code has logical linting errors, you'll need to fix those manually.

> **Tip for regular contributors:** Setting up the local dev environment (see below) lets you run formatters before pushing, avoiding the extra auto-format commit round-trip.

---

## Local Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) — required for running the full stack
- [Bun](https://bun.sh/) — JavaScript runtime and package manager (frontend)
- [Python 3.12+](https://www.python.org/downloads/) — backend
- [pipenv](https://pipenv.pypa.io/) — Python dependency manager

### RSA Keys (required for JWT)

```bash
mkdir ~/ops-keys
openssl genrsa -out ~/ops-keys/keypair.pem 2048
openssl rsa -in ~/ops-keys/keypair.pem -pubout -out ~/ops-keys/public.pem
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in ~/ops-keys/keypair.pem -out ~/ops-keys/private.pem

export JWT_PRIVATE_KEY=$(cat ~/ops-keys/private.pem)
export JWT_PUBLIC_KEY=$(cat ~/ops-keys/public.pem)
```

### Install Pre-commit Hooks

Pre-commit hooks run formatters and linters automatically on every commit, so CI stays green.

```bash
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg
```

### Run the Full Stack

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080

---

## Code Formatting

Formatting is enforced in CI. Run these commands locally before pushing to keep CI happy.

### Frontend (Prettier)

```bash
cd frontend

# Check for formatting issues
bun run prettier --check --ignore-unknown 'src/**/*' '!src/uswds/**'

# Auto-fix formatting issues
bun run format
```

### Backend — ops_api (Black + isort)

```bash
cd backend/ops_api

# Check formatting
pipenv run black --config ./pyproject.toml --check ops tests ./noxfile.py
pipenv run isort --settings-file ./pyproject.toml --check-only --filter-files ops tests ./noxfile.py

# Auto-fix formatting
pipenv run black --config ./pyproject.toml ops tests ./noxfile.py
pipenv run isort --settings-file ./pyproject.toml --filter-files ops tests ./noxfile.py
```

### Backend — data_tools (Black + isort)

```bash
cd backend/data_tools

# Check formatting
pipenv run black --config ./pyproject.toml --check .
pipenv run isort --settings-file ./pyproject.toml --check-only --filter-files .

# Auto-fix formatting
pipenv run black --config ./pyproject.toml .
pipenv run isort --settings-file ./pyproject.toml --filter-files .
```

---

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages that don't follow this format will be rejected by CI.

**Format:**

```
<type>: <description>
```

**Common types:**

| Type       | When to use                                           |
| ---------- | ----------------------------------------------------- |
| `feat`     | A new feature                                         |
| `fix`      | A bug fix                                             |
| `docs`     | Documentation changes only                            |
| `style`    | Formatting changes (no logic changes)                 |
| `refactor` | Code restructuring (no feature/bug change)            |
| `test`     | Adding or updating tests                              |
| `chore`    | Build process, dependency updates, or tooling changes |

**Examples:**

```bash
git commit -m "feat: add export button to budget line items table"
git commit -m "fix: resolve null pointer on agreement detail page"
git commit -m "docs: add web contributor guide to CONTRIBUTING.md"
```

---

## Running Tests

### Frontend unit tests

```bash
cd frontend
bun run test --watch=false
```

### Backend unit tests

```bash
cd backend/ops_api
pipenv run pytest
```

### End-to-end tests (requires running Docker stack)

```bash
cd frontend
bun run test:e2e
```

---

## Submitting a Pull Request

1. Fork the repository and create your branch from `main`.
2. Make your changes and ensure tests pass locally.
3. Run the formatters (see [Code Formatting](#code-formatting)) before pushing.
4. Open a pull request against `main`.
5. Fill out the PR template — especially the **A11y impact** and **Definition of Done** sections.

PRs require review from a CODEOWNER before merging. CI must be green (all checks passing).

---

## Questions?

Open a [GitHub Discussion](https://github.com/HHS/OPRE-OPS/discussions) or reach out to the team via the project's communication channels.
