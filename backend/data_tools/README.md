# Data Tools

ETL and data import utilities for the OPRE Portfolio Management System. Loads TSV/CSV and JSON5 data into the shared PostgreSQL database used by the ops_api backend.

## Prerequisites

- Python >=3.14
- pipenv for dependency management
- PostgreSQL (e.g. via Docker)
- For Azure: Azure Storage blob and optional Key Vault (see scripts/README.md)

## Quick Start

### 1. Install Dependencies

```bash
cd backend/data_tools
pipenv install --dev
```

### 2. Start the Database

From the project root:

```bash
docker compose up db --build
```

From `backend/` (if using Alembic and scripts):

```bash
docker compose up db data-import --build
```

### 3. Run ETL (Load TSV/CSV Data)

From the **backend/** directory (so `models` and `data_tools` are on the path):

```bash
cd backend

# Example: load projects from a local TSV
python data_tools/src/load_data.py --env dev --type projects --input-csv data_tools/test_csv/projects_latest.tsv
```

Use `--env local` when connecting to the default local Docker Postgres; use `--env dev` for a dev config. For Azure blob input, use `--env azure` and pass a blob URL as `--input-csv`. See **scripts/README.md** for Azure setup.

### 4. Run Tests

From the data_tools directory:

```bash
cd backend/data_tools
pipenv run pytest
```

## Development

### Running Tests

```bash
cd backend/data_tools

# Run all tests
pipenv run pytest

# Run a specific test file or test
pipenv run pytest tests/load_projects/test_load_projects.py
pipenv run pytest tests/load_projects/test_load_projects.py::test_transform_creates_projects

# Verbose and coverage
pipenv run pytest -v
pipenv run pytest --cov=src --cov-report=html
```

Tests that need Postgres use pytest-docker; the `loaded_db` fixture provides a session with history triggers.

### Code Quality

```bash
cd backend/data_tools

# Lint (flake8)
pipenv run nox -s lint

# Check formatting (Black + isort)
pipenv run nox -s format-check

# Auto-format
pipenv run nox -s black

# All nox sessions
pipenv run nox
```

### Shell Scripts

Scripts in **scripts/** are run from the **backend/** directory (or from a container with `backend` as cwd):

| Script | Purpose |
|--------|--------|
| **initial_data.sh** | Drop/recreate `ops` schema, run Alembic migrations, load `data_tools/initial_data/*.sql` |
| **import_test_data.sh** | Same as above, then load JSON5 static data (users, portfolios, CANs, agreements, etc.) |
| **load_data.sh** | Wrapper for `load_data.py`: `./data_tools/scripts/load_data.sh ENV DATA_TYPE INPUT_CSV` |
| **upgrade_schema.sh** / **downgrade_schema.sh** | Alembic upgrade/downgrade |

Set `ENV=local` for local Docker Postgres; set admin and app DB env vars for other environments.

## Directory Structure

```
data_tools/
├── environment/          # Config (local, dev, azure, pytest)
├── initial_data/         # Seed SQL (divisions, roles, portfolios, etc.)
├── scripts/              # Shell scripts and Azure automation
├── src/                  # ETL and import code
│   ├── common/           # DB init, config, shared utils
│   ├── azure_utils/      # Blob and Azure helpers
│   ├── import_static_data/  # JSON5 import
│   ├── etl_data_from_excel/ # Excel ETL
│   ├── load_*/           # Per-entity loaders (projects, contracts, grants, etc.)
│   ├── update_*/         # Update helpers (e.g. budget_line_type)
│   └── load_data.py      # CLI entrypoint
├── tests/                # Pytest (mirrors src layout)
├── test_csv/             # Sample TSV/CSV for tests and local runs
├── Pipfile / pyproject.toml / noxfile.py
└── pytest.ini
```

## Supported Data Types (--type)

- **projects**, **contracts**, **grants**, **users**, **cans**, **vendors**
- **contract_budget_lines**, **grant_budget_lines**, **iaa_budget_lines**, **direct_obligation_budget_lines**, **master_spreadsheet_budget_lines**, **master_spreadsheet_budget_lines_v2**, **obe_budget_lines**
- **iaas**, **iaa_agency**, **direct_obligations**
- **team_members**, **remove_budget_lines**, **remove_agreements**
- **update_budget_line_type**, **procurement_shops**, **aas**, **ops_contracts**, **roles**

Use `--first-run` only with `master_spreadsheet_budget_lines` when processing all agreement types on first run.

## Configuration

- **Environments**: `local`, `dev`, `azure`, `pytest`, `pytest_data_tools` (see `environment/` and `src/common/utils.py`).
- **.env**: Optional; create in `backend/` with `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGHOST`, `PGPORT`, and for Azure `FILE_STORAGE_AUTH_METHOD=rbac`. `load_data.py` loads `ENV_FILE` (default `.env`).
- **Models**: Database models live in `backend/models/` and are shared with ops_api. Migrations are under `backend/alembic/` and run from `backend/`.

## Integration

- **ops_api**: Uses the same DB and models; data_tools populate and update data (seed + ETL).
- **Docker**: The `data-import` service typically runs schema migration and then `import_test_data.sh` to seed the DB for development and E2E.
- **Alembic**: Run migrations from `backend/`: `alembic upgrade head`, `alembic revision --autogenerate -m "..."`.

For more detail on running loaders locally or from Azure, see **scripts/README.md**.
