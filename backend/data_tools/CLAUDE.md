# CLAUDE.md - Data Tools

This file provides data-tools-specific guidance for Claude Code when working in the ETL and data import scripts for OPRE OPS.

## Data Tools Development Context

This is the data loading and ETL backend for OPRE OPS. It imports TSV/CSV and JSON5 data into the shared PostgreSQL database. All commands below assume you are in the `backend/` directory when running `load_data.py` (so that `models` and `data_tools` are on `PYTHONPATH`), and in `backend/data_tools/` for tests, linting, and formatting.

### Package Management

**Use pipenv for all Python dependencies:**

```bash
cd backend/data_tools

# Install dependencies (always use --dev for development)
pipenv install --dev

# Add a new package
pipenv install package-name

# Add a development dependency
pipenv install --dev package-name

# Enter pipenv shell (then you can omit "pipenv run" prefix)
pipenv shell

# Update Pipfile.lock
pipenv lock
```

### Running the ETL (load_data.py)

**Run from the `backend/` directory** so that `models` and `data_tools` are importable:

```bash
cd backend

# Local TSV file (dev environment)
python data_tools/src/load_data.py --env dev --type projects --input-csv data_tools/test_csv/projects_latest.tsv

# Azure blob URL (azure environment, requires .env with DB and FILE_STORAGE_AUTH_METHOD=rbac)
python data_tools/src/load_data.py --env azure --type projects --input-csv "https://<storage>.blob.core.windows.net/data/projects_latest.tsv"

# With first-run flag (for master_spreadsheet_budget_lines only)
python data_tools/src/load_data.py --env dev --type master_spreadsheet_budget_lines --input-csv path/to/file.tsv --first-run
```

**Supported `--type` values:** projects, contract_budget_lines, contracts, grant_budget_lines, grants, users, cans, vendors, iaas, iaa_budget_lines, iaa_agency, direct_obligations, direct_obligation_budget_lines, master_spreadsheet_budget_lines, remove_budget_lines, team_members, remove_agreements, update_budget_line_type, procurement_shops, obe_budget_lines, aas, ops_contracts, roles, master_spreadsheet_budget_lines_v2.

### Running Tests

**Run tests from the `backend/data_tools/` directory:**

```bash
cd backend/data_tools

# Run all tests (uses pytest-docker for Postgres when needed)
pipenv run pytest

# Run specific test file
pipenv run pytest tests/load_projects/test_load_projects.py

# Run specific test function
pipenv run pytest tests/load_projects/test_load_projects.py::test_transform_creates_projects

# Run with verbose output
pipenv run pytest -v

# Run with coverage report
pipenv run pytest --cov=src --cov-report=html
```

**Important:** Tests mirror the source structure. Tests for `src/load_projects/utils.py` live under `tests/load_projects/`. Many tests use the `loaded_db` fixture, which brings up Postgres via pytest-docker and applies history triggers.

### Code Quality

```bash
cd backend/data_tools

# Linting (flake8)
pipenv run nox -s lint

# Format checking (Black + isort) - DO NOT modify files
pipenv run nox -s format-check

# Auto-format code with Black and isort
pipenv run nox -s black

# Run all nox sessions
pipenv run nox
```

**Before committing:**
1. Run `pipenv run nox -s format-check` to verify formatting
2. Run `pipenv run nox -s lint` to check for linting errors
3. Fix with `pipenv run nox -s black` (formatting) or manually (linting)
4. Pre-commit hooks will enforce these checks

### Shell Scripts (Docker / CI)

Scripts in `scripts/` are intended to run from the **backend/** directory (or inside a container with `backend` as working directory):

- **initial_data.sh**: Drops/recreates `ops` schema, runs `alembic upgrade head`, loads all SQL from `data_tools/initial_data/*.sql` in order.
- **import_test_data.sh**: Same schema/migration steps, then loads JSON5 static data via `import_static_data/import_data.py` (user_data, portfolio_data, can_data, etc.).
- **load_data.sh**: Wrapper for `load_data.py`; usage: `./scripts/load_data.sh ENV DATA_TYPE INPUT_CSV` (optional `FIRST_RUN=1` for first-run).
- **upgrade_schema.sh** / **downgrade_schema.sh**: Alembic upgrade/downgrade.

## Architecture Patterns

### Shared Models

**IMPORTANT:** Database models live in `backend/models/` (backend level), not inside `data_tools`. Data tools import from `models` and use the same SQLAlchemy `BaseModel`, so schema and history behavior stay consistent with the API.

```python
from models import Agreement, User, BudgetLineItem
from models import BaseModel
```

### ETL Pattern (load_data.py)

1. **Config**: `get_config(env)` returns a `DataToolsConfig` (local, dev, azure, pytest, pytest_data_tools).
2. **DB**: `init_db_from_config(config)` creates the engine; a scoped session is used for the run.
3. **System user**: `get_or_create_sys_user(session)` ensures the system user exists for history.
4. **Triggers**: `setup_triggers(session, sys_user)` wires history tracking (before_commit, after_flush, handle_error).
5. **Input**: `get_csv(input_csv, config)` returns a file-like object (local path or Azure blob).
6. **Transform**: Each `--type` maps to a `transform(csv_f, session, sys_user)` (and optionally `is_first_run`) in the corresponding `src/load_*/utils.py` (or `update_budget_line_type/utils.py`).

**Adding a new data type:**
1. Implement `transform(csv_f, session, sys_user)` in a new (or existing) module under `src/`.
2. Register the type in the `--type` `click.Choice` in `load_data.py`.
3. Add a `case "new_type":` that imports and calls the new `transform`.

### Environment Config

Configs implement `DataToolsConfig` in `environment/types.py`:

- **LocalConfig**: Local Postgres (e.g. Docker); typically no vault, not remote.
- **DevConfig**: Development; may point at shared DB or local.
- **AzureConfig**: Remote; uses vault for secrets, blob for file storage (RBAC or key).
- **PytestConfig** / **PytestDataToolsConfig**: Test DB connection strings for pytest.

Connection string and file-storage behavior come from these configs; env vars (e.g. `PGHOST`, `PGUSER`, `FILE_STORAGE_AUTH_METHOD`, `ENV_FILE`) are read by the config implementations.

### Initial and Static Data

- **initial_data/**: Numbered SQL files (e.g. `001-division.sql`, `007-portfolio.sql`) loaded in order by `initial_data.sh`. Use for seed/reference data that must exist before app or ETL runs.
- **import_static_data**: Loads JSON5 files (e.g. `user_data.json5`, `can_data.json5`) via `import_data.py`. Table names are allowlisted in `ALLOWED_TABLES` to reduce risk of SQL injection from JSON.

### History and Triggers

Data tools use the same history mechanism as the API: `track_db_history_before`, `track_db_history_after`, `track_db_history_catch_errors` from `models.utils`. `setup_triggers` in `src/common/db.py` attaches these to the session and engine so that changes made by ETL are audited.

## Testing Patterns

### Test Structure

Tests use pytest. Many modules use a Postgres instance via pytest-docker and the `loaded_db` fixture:

```python
def test_transform_creates_projects(loaded_db):
    """Test that transform creates project records."""
    from data_tools.src.load_projects.utils import transform
    from models import Project
    import io
    csv_content = "name\t..."
    transform(io.StringIO(csv_content), loaded_db, sys_user)
    loaded_db.commit()
    assert loaded_db.query(Project).count() == expected
```

### Key Fixtures

- **db_service** (session): Ensures Postgres is up; returns `(db_session, engine)`.
- **loaded_db**: Session with history triggers registered; rolls back and cleans `ops_db_history` after each test.

### Fee Percentage and Conventions

Same as the rest of the backend: fee percentages are stored as whole numbers (e.g. `5.0` = 5%). Use `datetime.date` for dates and model enums (e.g. `ContractType`) rather than raw strings.

## Important Files

- **src/load_data.py**: CLI entrypoint; dispatches to per-type `transform` functions.
- **src/common/db.py**: `init_db`, `init_db_from_config`, `setup_triggers`.
- **src/common/utils.py**: `get_config`, `get_or_create_sys_user`, and shared helpers.
- **environment/types.py**: `DataToolsConfig` protocol.
- **environment/local.py**, **environment/dev.py**, **environment/azure.py**: Config implementations.
- **scripts/initial_data.sh**: Schema reset + migrations + initial_data SQL.
- **scripts/import_test_data.sh**: Schema + migrations + JSON5 static data.
- **scripts/load_data.sh**: Wrapper for `load_data.py`.
- **tests/conftest.py**: Pytest fixtures and history trigger setup for tests.

## Environment Variables

Typical variables (used by configs and scripts):

- **PGHOST**, **PGPORT**, **PGUSER**, **PGPASSWORD**, **PGDATABASE**: Postgres connection (scripts and dev/azure).
- **ADMIN_PGUSER**, **ADMIN_PGPASSWORD**: Used by non-local scripts for schema drop/create.
- **ENV_FILE**: Path to `.env` (default `.env`); `load_data.py` loads it via python-dotenv.
- **FILE_STORAGE_AUTH_METHOD**: e.g. `rbac` for Azure blob with RBAC.
- **LOG_LEVEL**: Logging level (default `INFO`).
- **ENV**: Passed to scripts (e.g. `local` vs non-local) for connection and schema behavior.

## Integration with ops_api and Docker

- **ops_api** tests and app use the same `models` and same DB schema; `data_tools` fills the DB (initial_data + import_test_data or load_data).
- **Docker**: `data-import` (or similar) often runs `import_test_data.sh` after migrations to seed the database for local/demo runs.
- **Alembic**: Migrations live under `backend/alembic/` and are run from `backend/`; both ops_api and data_tools rely on the same migration history.

When adding new tables or columns, add migrations in `backend/alembic/`, then update ETL and initial/static data as needed so seed and test data stay valid.
