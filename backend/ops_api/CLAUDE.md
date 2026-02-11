# CLAUDE.md - Backend (ops_api)

This file provides backend-specific guidance for Claude Code when working in the Flask/SQLAlchemy API.

## Backend Development Context

This is the Flask REST API backend for OPRE OPS. All commands below should be run from the `backend/ops_api/` directory unless otherwise specified.

### Package Management

**Use pipenv for all Python dependencies:**

```bash
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

### Running Tests

**Always run tests from the `backend/ops_api/` directory:**

```bash
# Run all tests
pipenv run pytest

# Run specific test file
pipenv run pytest tests/ops/resources/test_agreements.py

# Run specific test function
pipenv run pytest tests/ops/resources/test_agreements.py::test_get_agreement_by_id

# Run specific test class
pipenv run pytest tests/ops/resources/test_agreements.py::TestAgreementAPI

# Run with verbose output
pipenv run pytest -v

# Run with coverage report
pipenv run pytest --cov=ops --cov-report=html
```

**Important**: Test files mirror the source structure. Tests for `ops/resources/agreements.py` are in `tests/ops/resources/test_agreements.py`.

### Code Quality

```bash
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
3. Fix any issues with `pipenv run nox -s black` (formatting) or manually (linting)
4. Pre-commit hooks will enforce these checks

### Database Migrations

**CRITICAL: Database migrations must be run from the `backend/` directory (parent of ops_api):**

```bash
cd ..  # Move to backend/ directory

# Generate new migration (auto-detect model changes)
alembic revision --autogenerate -m "Add new field to agreements table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# View current revision
alembic current
```

**Migration Best Practices:**
- Always review auto-generated migrations before applying
- Test migrations on a copy of production data when possible
- Migrations should be idempotent (safe to run multiple times)
- Add data migrations separately from schema migrations when needed
- Migration files are in `backend/alembic/versions/`

## Architecture Patterns

### Service-Oriented Architecture

The backend follows a clear separation of concerns:

1. **API Resources** (`ops/resources/`) - Handle HTTP requests/responses, validation, serialization
2. **Services** (`ops/services/`) - Contain business logic, orchestrate database operations
3. **Models** (`models/`) - SQLAlchemy ORM models (shared with other backend services)
4. **Schemas** (`ops/schemas/`) - Marshmallow schemas for serialization/deserialization

**Pattern:**
```python
# API Resource (ops/resources/agreements.py)
class AgreementItemAPI(BaseItemAPI):
    def get(self, id):
        agreement = AgreementService.get_by_id(id)
        return AgreementSchema().dump(agreement)

# Service (ops/services/agreements.py)
class AgreementService:
    @staticmethod
    def get_by_id(id):
        return db.session.get(Agreement, id)

# Model (models/agreements.py)
class Agreement(BaseModel):
    __tablename__ = "agreement"
    id = Column(Integer, primary_key=True)
    # ...
```

### Base Views Pattern

Most API resources inherit from `BaseItemAPI` or `BaseListAPI` in `ops/resources/base_views.py`:

- **BaseItemAPI**: Provides `GET /resource/{id}`, `PUT /resource/{id}`, `DELETE /resource/{id}`
- **BaseListAPI**: Provides `GET /resources`, `POST /resources`

**When to override base methods:**
- Custom validation logic
- Additional side effects (sending notifications, updating related records)
- Custom authorization beyond the `@is_authorized` decorator
- Complex query logic (joins, filters, aggregations)

**Example:**
```python
class AgreementItemAPI(BaseItemAPI):
    model = Agreement
    schema = AgreementSchema()

    # Override put() to add custom logic
    def put(self, id):
        # Custom validation
        data = self.schema.load(request.json)
        # Call service layer
        agreement = AgreementService.update(id, data)
        return self.schema.dump(agreement)
```

### Authorization Pattern

Use the `@is_authorized` decorator for route-level authorization:

```python
from ops.auth.decorators import is_authorized

class AgreementItemAPI(BaseItemAPI):
    @is_authorized(ApplicationScope.UPDATE_AGREEMENT)
    def put(self, id):
        # Only users with UPDATE_AGREEMENT permission can call this
        pass
```

**Authorization scopes** are defined in `ops/auth/authorization_providers.py`.

### Event System for Audit History

All database models automatically track changes via the event system:

- **Models inherit from `BaseModel`** which sets up event listeners
- **Events are defined** in `models/events.py`
- **History is tracked** in `*_history.py` models (e.g., `agreement_history.py`)
- **Message bus pattern** in `models/history.py` dispatches events

**You don't need to manually track history** - it happens automatically when you commit changes to the database.

## Testing Patterns

### Test Structure

Tests use pytest with fixtures for database setup:

```python
import pytest
from models import Agreement

def test_get_agreement_by_id(app, auth_client):
    """Test retrieving a single agreement."""
    # auth_client fixture provides authenticated test client
    response = auth_client.get("/api/v1/agreements/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
```

### Key Test Fixtures

Available in `tests/conftest.py`:

- `app`: Flask application instance with test config
- `client`: Test client (unauthenticated)
- `auth_client`: Test client with authenticated user
- `loaded_db`: Database with test data loaded from `data_tools/initial_data/`

### Testing Database Changes

When testing code that modifies the database:

```python
def test_update_agreement(app, auth_client):
    """Test updating an agreement."""
    with app.app_context():
        # Make request
        response = auth_client.put(
            "/api/v1/agreements/1",
            json={"name": "Updated Agreement"}
        )
        assert response.status_code == 200

        # Verify database change
        agreement = db.session.get(Agreement, 1)
        assert agreement.name == "Updated Agreement"
```

### Testing Authorization

Test both authorized and unauthorized scenarios:

```python
def test_update_agreement_requires_permission(client):
    """Test that updating requires UPDATE_AGREEMENT permission."""
    # Unauthenticated request should fail
    response = client.put("/api/v1/agreements/1", json={"name": "New"})
    assert response.status_code == 401
```

## Database Models

### Model Location

**IMPORTANT**: Database models are in `models/` (at the ops_api level), NOT in `ops/`. This is because models are shared across multiple backend services.

### Key Model Files

- `agreements.py`: Agreement, ContractType, ContractAgreement, GrantAgreement
- `budget_line_items.py`: BudgetLineItem (links Agreements to CANs)
- `cans.py`: CAN (Contract Account Numbers), CANFundingBudget
- `projects.py`: Project
- `portfolios.py`: Portfolio
- `users.py`: User, UserStatus
- `events.py`: Domain events for audit tracking
- `*_history.py`: History tracking for each model

### Adding New Models

1. Create model in `models/new_model.py`:
```python
from models.base import BaseModel
from sqlalchemy import Column, Integer, String

class NewModel(BaseModel):
    __tablename__ = "new_model"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
```

2. Import in `models/__init__.py`:
```python
from models.new_model import NewModel
```

3. Generate migration from `backend/` directory:
```bash
cd ..
alembic revision --autogenerate -m "Add NewModel table"
alembic upgrade head
```

## Common Patterns and Conventions

### Fee Percentage Format

**CRITICAL**: Fee percentages are stored as whole numbers (e.g., `5.0` = 5%, not `0.05`).

```python
# ✅ CORRECT
agreement.fee_percentage = 5.0  # 5%

# ❌ INCORRECT
agreement.fee_percentage = 0.05  # Would be interpreted as 0.05%
```

This convention applies to:
- Database storage
- API request/response payloads
- Test fixtures
- Service layer calculations

### Date Handling

Use `datetime.date` objects for dates (not strings):

```python
from datetime import date

agreement.period_start = date(2024, 1, 1)
agreement.period_end = date(2024, 12, 31)
```

### Enum Usage

Many models use SQLAlchemy Enums. Always use the enum class, not raw strings:

```python
from models.agreements import ContractType

# ✅ CORRECT
agreement.contract_type = ContractType.FIRM_FIXED_PRICE

# ❌ INCORRECT
agreement.contract_type = "FIRM_FIXED_PRICE"
```

### Session Management

SQLAlchemy sessions are managed by Flask's app context:

```python
from models import db

# In a request context (routes, services)
agreement = db.session.get(Agreement, 1)
db.session.add(new_agreement)
db.session.commit()

# In tests with app.app_context()
with app.app_context():
    agreement = db.session.get(Agreement, 1)
```

**Don't manually create sessions** - use `db.session` which is scoped to the Flask app context.

## Debugging

### Enable Debug Mode

Set environment variable:
```bash
export FLASK_ENV=development
```

### View SQL Queries

Enable SQLAlchemy echo in `ops/default_settings.py`:
```python
SQLALCHEMY_ECHO = True
```

### Test with Simulated Errors

API endpoints support `simulatedError` query parameter:
```
GET /api/v1/agreements/1?simulatedError=true  # Returns 500
GET /api/v1/agreements/1?simulatedError=400   # Returns 400
```

This is used by frontend tests to verify error handling.

## Common Tasks

### Adding a New API Endpoint

1. **Define the route** in `ops/resources/new_resource.py`:
```python
from flask import request
from ops.resources.base_views import BaseItemAPI

class NewResourceAPI(BaseItemAPI):
    model = NewModel
    schema = NewModelSchema()
```

2. **Register the route** in `ops/__init__.py`:
```python
from ops.resources.new_resource import NewResourceAPI

api.add_resource(NewResourceAPI, "/api/v1/new-resources/<int:id>")
```

3. **Add tests** in `tests/ops/resources/test_new_resource.py`:
```python
def test_get_new_resource(auth_client):
    response = auth_client.get("/api/v1/new-resources/1")
    assert response.status_code == 200
```

4. **Run tests**:
```bash
pipenv run pytest tests/ops/resources/test_new_resource.py
```

### Adding Business Logic

**Keep business logic in services**, not in API resources:

1. **Create service** in `ops/services/new_service.py`:
```python
class NewService:
    @staticmethod
    def complex_operation(data):
        # Business logic here
        pass
```

2. **Call from API resource**:
```python
class NewResourceAPI(BaseItemAPI):
    def post(self):
        data = self.schema.load(request.json)
        result = NewService.complex_operation(data)
        return self.schema.dump(result)
```

3. **Test service independently**:
```python
def test_complex_operation(app):
    with app.app_context():
        result = NewService.complex_operation(test_data)
        assert result.status == "completed"
```

## Important Files

- `ops/__init__.py`: Flask application factory (app setup, middleware, routes)
- `ops/default_settings.py`: Default configuration
- `ops/resources/base_views.py`: Base classes for API resources
- `ops/auth/decorators.py`: Authorization decorators
- `ops/auth/authorization_providers.py`: Permission definitions
- `models/base.py`: Base model with audit fields and event listeners
- `models/__init__.py`: Database initialization and model imports
- `tests/conftest.py`: Pytest fixtures and test configuration

## Environment Variables

Key environment variables for local development:

- `JWT_PRIVATE_KEY`: RSA private key for JWT signing (required)
- `JWT_PUBLIC_KEY`: RSA public key for JWT verification (required)
- `FLASK_ENV`: Set to `development` for debug mode
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://ops:ops@localhost:5432/postgres`)
- `SECRET_KEY`: Flask secret key (auto-generated in development)

## Integration with Frontend

The frontend makes API calls to endpoints at `http://localhost:8080/api/v1/`. Key integration points:

- **Authentication**: JWT tokens in `Authorization: Bearer <token>` header
- **Error responses**: Return `{"error": "message"}` for 4xx/5xx status codes
- **Pagination**: List endpoints support `?offset=0&limit=10`
- **Serialization**: Marshmallow schemas define the JSON structure

When modifying API responses, ensure frontend RTK Query endpoints in `frontend/src/api/opsAPI.js` are updated accordingly.
