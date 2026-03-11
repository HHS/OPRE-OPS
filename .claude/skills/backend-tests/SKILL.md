---
name: backend-tests
description: Run backend tests and code quality checks for OPRE OPS. Covers ops_api pytest, data_tools pytest, and nox linting/formatting sessions. Use this skill when the user wants to run backend tests, check code quality, lint Python code, run pytest, or verify their backend changes pass CI checks — even if they just say "run the tests" or "does this pass".
argument-hint: "[api | data-tools | lint | format | all | <test-path>]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
disable-model-invocation: true
---

# Backend Test Runner

You run tests and code quality checks for the two backend Python packages in OPRE OPS: **ops_api** (the Flask API) and **data_tools** (the ETL/data loading scripts). Each has its own pipenv environment, test suite, and nox sessions.

## How to Determine What to Do

Interpret `$ARGUMENTS` to decide the action:

### 1. API Tests: `$ARGUMENTS` is `api` or starts with `api`

Run the ops_api test suite.

```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api

# Run all API tests
pipenv run pytest

# Run with verbose output and short summary
pipenv run pytest -v --tb=short
```

If `$ARGUMENTS` includes a specific path or test name after `api` (e.g., `api test_agreements`):
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api

# Find matching test files
find tests -name "*<pattern>*" -type f

# Run the matching test file
pipenv run pytest tests/ops/resources/test_agreements.py
```

Test files mirror the source structure: `ops/resources/agreements.py` -> `tests/ops/resources/test_agreements.py`.

Report results:
- Total tests: passed, failed, errors, skipped
- For failures: show the test name and the assertion error
- Suggest fixes if the failure is straightforward

### 2. Data Tools Tests: `$ARGUMENTS` is `data-tools` or `data` or `etl`

Run the data_tools test suite. These tests use pytest-docker to spin up a Postgres instance.

**Pre-flight check** — Docker must be available:
```bash
docker info > /dev/null 2>&1 && echo "Docker: OK" || echo "Docker: NOT RUNNING"
```

```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools

# Run all data tools tests
pipenv run pytest

# Run with verbose output
pipenv run pytest -v --tb=short
```

If a specific test path is provided:
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run pytest tests/load_projects/test_load_projects.py
```

Data tools tests use the `loaded_db` fixture which:
- Starts Postgres via pytest-docker
- Applies history triggers
- Rolls back and cleans `ops_db_history` after each test

Report results the same as API tests.

### 3. Lint: `$ARGUMENTS` is `lint`

Run linting across both packages:
```bash
echo "=== ops_api linting ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api
pipenv run nox -s lint

echo ""
echo "=== data_tools linting ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run nox -s lint
```

Report any linting violations with file, line number, and rule code.

### 4. Format Check: `$ARGUMENTS` is `format` or `format-check`

Check formatting (Black + isort) without modifying files:
```bash
echo "=== ops_api format check ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api
pipenv run nox -s format_check

echo ""
echo "=== data_tools format check ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run nox -s format_check
```

If formatting issues are found, offer to auto-fix:
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api
pipenv run nox -s black

cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run nox -s black
```

### 5. Specific Test Path: `$ARGUMENTS` is a file path or test identifier

If the argument looks like a file path or test name (contains `/`, `.py`, or `::`):

Determine which package it belongs to:
- If it contains `data_tools` or `load_` -> run in `backend/data_tools/`
- Otherwise -> run in `backend/ops_api/`

```bash
# For ops_api tests
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api
pipenv run pytest <test-path> -v --tb=short

# For data_tools tests
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run pytest <test-path> -v --tb=short
```

### 6. All Checks: `$ARGUMENTS` is `all` or `ci`

Run the full backend CI check suite — everything that CI would catch.

**IMPORTANT: Do NOT run ops_api and data_tools tests in parallel.** Both use pytest-docker with a Postgres container, and running them simultaneously causes a container name collision. Run lint/format in parallel if desired, but run the two test suites sequentially.

```bash
echo "=== Step 1/4: ops_api lint + format ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api
pipenv run nox -s lint
pipenv run nox -s format_check

echo ""
echo "=== Step 2/4: ops_api tests ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/ops_api
pipenv run pytest --tb=short

echo ""
echo "=== Step 3/4: data_tools lint + format ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run nox -s lint
pipenv run nox -s format_check

echo ""
echo "=== Step 4/4: data_tools tests ==="
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/data_tools
pipenv run pytest --tb=short
```

**Note on data_tools lint:** The data_tools package has known pre-existing lint violations (unused imports, f-string placeholders, complexity warnings). These are technical debt, not new failures. Only report lint issues that are in files you or the user have changed.

Report a final summary:
```
Backend CI Check Summary:
  ops_api lint:         PASS/FAIL
  ops_api format:       PASS/FAIL
  ops_api tests:        X passed, Y failed
  data_tools lint:      PASS/FAIL
  data_tools format:    PASS/FAIL
  data_tools tests:     X passed, Y failed
```

### 7. Default: `$ARGUMENTS` is empty or unrecognized

Show help:
```
Backend Test Skill - Available Commands:

  /backend-tests api                Run ops_api test suite
  /backend-tests api <pattern>      Run matching ops_api tests (e.g., "api agreements")
  /backend-tests data-tools         Run data_tools test suite (needs Docker)
  /backend-tests lint               Run flake8 linting on both packages
  /backend-tests format             Check Black/isort formatting on both packages
  /backend-tests all                Run full CI check suite (lint + format + tests)
  /backend-tests <test-path>        Run a specific test file or function

Package locations:
  ops_api:    backend/ops_api/    (Flask API tests)
  data_tools: backend/data_tools/ (ETL tests, needs Docker for Postgres)
```

## Key File Locations

- **ops_api tests**: `backend/ops_api/tests/`
- **ops_api conftest**: `backend/ops_api/tests/conftest.py` (fixtures: `app`, `client`, `auth_client`, `loaded_db`)
- **ops_api noxfile**: `backend/ops_api/noxfile.py`
- **data_tools tests**: `backend/data_tools/tests/`
- **data_tools conftest**: `backend/data_tools/tests/conftest.py` (fixtures: `db_service`, `loaded_db`)
- **data_tools noxfile**: `backend/data_tools/noxfile.py`
- **Shared models**: `backend/models/` (used by both packages)

## Common Issues

- **"ModuleNotFoundError: No module named 'models'"**: You're running from the wrong directory. ops_api tests run from `backend/ops_api/`, data_tools tests from `backend/data_tools/`.
- **data_tools tests hang**: Docker might not be running. Check with `docker info`.
- **Fixture errors**: The `loaded_db` fixture in ops_api loads test data from `data_tools/initial_data/`. If seed data has changed, the fixture may need updating.
- **Formatting differs between packages**: Each package has its own Black/isort config. Run formatting per-package, not globally.
