# CLAUDE.md - Backend (ops_api)

Flask REST API backend for OPRE OPS. Run all commands from `backend/ops_api/` unless otherwise noted.

## Commands

### Tests

```bash
pipenv run pytest                                            # All tests
pipenv run pytest tests/ops/resources/test_agreements.py     # Specific file
pipenv run pytest tests/ops/resources/test_agreements.py::test_get_agreement_by_id  # Specific test
```

Test files mirror source structure: `ops/resources/agreements.py` → `tests/ops/resources/test_agreements.py`.

### Code Quality

```bash
pipenv run nox -s lint           # Linting (flake8)
pipenv run nox -s format-check   # Check formatting (Black + isort)
pipenv run nox -s black          # Auto-format code
```

### Database Migrations

**Run from the `backend/` directory** (parent of ops_api):

```bash
cd ..
alembic revision --autogenerate -m "Your migration message"
alembic upgrade head
alembic downgrade -1   # Rollback
```

Migration files are in `backend/alembic/versions/`. Always review auto-generated migrations before applying.

## Architecture

### Layers

1. **API Resources** (`ops/resources/`) — HTTP requests/responses, validation, serialization
2. **Services** (`ops/services/`) — Business logic. Keep business logic here, not in resources.
3. **Models** (`models/`) — SQLAlchemy ORM models (shared across backend services)
4. **Schemas** (`ops/schemas/`) — Marshmallow schemas for serialization/deserialization

### Base Views

Most resources inherit from `BaseItemAPI` or `BaseListAPI` in `ops/resources/base_views.py`:

- **BaseItemAPI**: `GET /resource/{id}`, `PUT /resource/{id}`, `DELETE /resource/{id}`
- **BaseListAPI**: `GET /resources`, `POST /resources`

Override base methods for: custom validation, side effects, custom authorization, or complex queries.

### Authorization

Use the `@is_authorized` decorator for route-level authorization:

```python
from ops.auth.decorators import is_authorized

class AgreementItemAPI(BaseItemAPI):
    @is_authorized(ApplicationScope.UPDATE_AGREEMENT)
    def put(self, id):
        pass
```

Scopes are defined in `ops/auth/authorization_providers.py`.

### MessageBus (Domain Events)

The app uses a synchronous MessageBus for domain event side effects (history records, notifications, etc.). It is **not** async — subscribers run within the same request transaction.

**How it works:**
1. API resources publish events via `OpsEventHandler` context manager (see `ops/utils/events.py`)
2. Events are queued on `request.message_bus` during the request
3. After the response, `message_bus.handle()` calls all subscribers (in `teardown_request`)
4. Subscribers are registered once at app startup via `initialize_event_subscriptions()` in `ops/__init__.py`

**Key types:**
- `OpsEventType` (`models/events.py`): Enum of all event types (e.g., `CREATE_NEW_CAN`, `UPDATE_AGREEMENT`, `CREATE_BLI`)
- `OpsEvent` (`models/events.py`): Event record persisted to the database
- `MessageBusSubscriber` (`ops/services/subscriber_protocol.py`): Protocol that all subscriber functions must follow — `(event: OpsEvent, session: Session) -> None`

**Existing subscribers** (registered in `ops/__init__.py`):
- `can_history_trigger` (`ops/services/can_messages.py`): CAN and CAN funding history
- `agreement_history_trigger` (`ops/services/agreement_messages.py`): Agreement, BLI, change request, and services component history

**Adding a new subscriber:**
1. Create a function matching `MessageBusSubscriber` protocol in `ops/services/`
2. Register it in `initialize_event_subscriptions()` using `MessageBus.subscribe_globally(OpsEventType.X, your_fn)`

See `ops/services/MESSAGEBUS_SUBSCRIBERS.md` for the full subscriber guide.

### Automatic Model History (OpsDBHistory)

Separate from the MessageBus, all SQLAlchemy models inheriting from `BaseModel` automatically track row-level changes (NEW/UPDATED/DELETED) via `models/history.py`. This uses SQLAlchemy `before_commit`/`after_flush` events — no manual tracking needed.

## Database Models

**IMPORTANT**: Models are in `models/` (at the ops_api level), NOT in `ops/`. They are shared across backend services.

### Key Model Files

- `agreements.py`: Agreement, ContractType, ContractAgreement, GrantAgreement
- `budget_line_items.py`: BudgetLineItem (links Agreements to CANs)
- `cans.py`: CAN, CANFundingBudget
- `projects.py`: Project
- `portfolios.py`: Portfolio
- `users.py`: User, UserStatus
- `events.py`: Domain events for audit tracking
- `*_history.py`: History tracking for each model

### Key Test Fixtures

Available in `tests/conftest.py`:

- `app`: Flask application instance with test config
- `client`: Test client (unauthenticated)
- `auth_client`: Test client with authenticated user
- `loaded_db`: Database with test data loaded from `data_tools/initial_data/`

## Conventions

### Fee Percentage Format

**CRITICAL**: Fee percentages are stored as whole numbers (e.g., `5.0` = 5%, not `0.05`). This applies to database storage, API payloads, test fixtures, and service calculations.

```python
# CORRECT
agreement.fee_percentage = 5.0  # 5%

# INCORRECT — would be interpreted as 0.05%
agreement.fee_percentage = 0.05
```

### Other Conventions

- **Dates**: Use `datetime.date` objects, not strings
- **Enums**: Use enum classes (e.g., `ContractType.FIRM_FIXED_PRICE`), not raw strings
- **Sessions**: Use `db.session` (Flask-scoped). Don't create sessions manually.
- **Simulated errors**: Endpoints support `?simulatedError=true` (returns 500) or `?simulatedError=400` for frontend error testing
- **SQL debugging**: Set `SQLALCHEMY_ECHO = True` in `ops/default_settings.py`

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

- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY`: RSA keys for JWT signing/verification (required)
- `FLASK_ENV`: Set to `development` for debug mode
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://ops:ops@localhost:5432/postgres`)
- `SECRET_KEY`: Flask secret key (auto-generated in development)
