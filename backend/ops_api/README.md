# OPS API Backend

Flask/SQLAlchemy REST API backend for the OPRE Portfolio Management System.

## Prerequisites

- Python >=3.14
- pipenv for dependency management
- PostgreSQL (via Docker)
- RSA keys for JWT authentication

## Quick Start

### 1. Install Dependencies

```bash
cd backend/ops_api
pipenv install --dev
```

### 2. Generate RSA Keys for JWT

The backend uses RSA keys to sign and verify JWTs. Generate these once:

```bash
mkdir ~/ops-keys
openssl genrsa -out ~/ops-keys/keypair.pem 2048
openssl rsa -in ~/ops-keys/keypair.pem -pubout -out ~/ops-keys/public.pem
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in ~/ops-keys/keypair.pem -out ~/ops-keys/private.pem

export JWT_PRIVATE_KEY="$(cat ~/ops-keys/private.pem)"
export JWT_PUBLIC_KEY="$(cat ~/ops-keys/public.pem)"

cat ~/ops-keys/public.pem > ../../public.pub
cat ~/ops-keys/public.pem > ./ops/static/public.pem
```

### 3. Start the Database

From the project root:

```bash
docker compose up db data-import --build
```

### 4. Run Database Migrations

From `backend/` directory:

```bash
cd ..
alembic upgrade head
```

### 5. Run the Backend

Use Docker (recommended):

```bash
# From project root
docker compose up backend --build
```

Or run directly with pipenv:

```bash
cd backend/ops_api
pipenv run flask run --host=0.0.0.0 --port=8080
```

The API will be available at http://localhost:8080

## Development

### Running Tests

```bash
# Run all tests
pipenv run pytest

# Run specific test file
pipenv run pytest tests/path/to/test_file.py

# Run specific test
pipenv run pytest tests/path/to/test_file.py::test_function_name

# Run with verbose output
pipenv run pytest -v
```

### Code Quality

```bash
# Linting (flake8)
pipenv run nox -s lint

# Format checking (Black + isort)
pipenv run nox -s format-check

# Auto-format code
pipenv run nox -s black

# Run all checks
pipenv run nox
```

### Database Migrations

Migrations must be run from the `backend/` directory:

```bash
cd backend/

# Generate new migration (auto-detect model changes)
alembic revision --autogenerate -m "Your migration message"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history
```

## Architecture

### Directory Structure

```
ops_api/
├── ops/                    # Main application package
│   ├── __init__.py        # Flask application factory
│   ├── auth/              # Authentication & authorization
│   ├── document/          # Document Management System (DMS)
│   ├── environment/       # Environment Config (local, docker, Azure)
│   ├── events/            # Event-driven architecture
│   ├── home_page/         # Home page views
│   ├── resources/         # REST API endpoints (Flask MethodViews)
│   ├── services/          # Business logic layer
│   ├── schemas/           # Marshmallow schemas for serialization
│   ├── utils/             # Utility functions
│   └── validation/        # Validation rules and orchestrators
├── tests/                 # Test suite (mirrors source structure)
```

### Key Patterns

- **Flask Application Factory**: `ops/__init__.py` configures the app, database, auth, and middleware
- **Service Layer**: Business logic in `ops/services/` is separated from API resources
- **Base Views**: `BaseItemAPI` and `BaseListAPI` provide common CRUD operations
- **Authorization**: `@is_authorized` decorator provides route-level permission checks
- **Event System**: Domain events use message bus pattern for audit history tracking

## Configuration

Default configuration is loaded from `ops/environment/default_settings.py`.

### Key Environment Variables

- `JWT_PRIVATE_KEY` - Required for JWT signing (RSA private key)
- `JWT_PUBLIC_KEY` - Required for JWT verification (RSA public key)
- `FLASK_ENV` - Set to `development` for debug mode
- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://ops:ops@localhost:5432/postgres`)

## Testing

Tests use pytest with database fixtures. The test suite includes:

- Unit tests for services and utilities
- Integration tests for API endpoints
- BDD tests for API endpoints
- Database model tests

Run tests from the `backend/ops_api` directory. Tests use an test PostgreSQL instance in Docker.

## Deployment

The application is containerized with Docker and deployed via GitHub Actions:

- **Development/Staging**: Auto-deploys on push to `main`
- **Production**: Manual deploy via GitHub Actions workflows

For production deployments, ensure:
- `SECRET_KEY` is set to a secure, stable value
- RSA keys are properly configured
- Database migrations are applied
- Environment-specific configuration is set
