# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

OPRE OPS is the Portfolio Management System for OPRE, replacing the previous MAPS system. It's a full-stack web application with a Flask/SQLAlchemy backend API and a React frontend, containerized with Docker.

## Common Development Commands

### Backend (Python/Flask)

The backend uses **pipenv** for Python dependency management and is located in `backend/ops_api/`.

```bash
# Navigate to backend directory
cd backend/ops_api

# Install dependencies
pipenv install --dev

# Run unit tests
pipenv run pytest

# Run single test
pipenv run pytest tests/path/to/test_file.py::test_function_name

# Linting
pipenv run nox -s lint

# Auto-format code
pipenv run nox -s black

# Generate database migration
cd ../
alembic revision --autogenerate -m "Your migration message here"

# Apply database migrations
cd ../
alembic upgrade head

# Rollback migration
cd ../
alembic downgrade -1
```

### Frontend (React/Bun)

The frontend uses **bun** for Node.js dependency management and is located in `frontend/`.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (frozen lockfile)
bun install --frozen-lockfile

# Install/upgrade dependencies
bun install

# Run development server
bun run start

# Build for production
bun run build

# Run unit tests
bun run test --watch=false

# Run tests with coverage
bun run test:coverage --watch=false

# Run E2E tests (requires running stack)
bun run test:e2e

# Run E2E tests interactively
bun run test:e2e:interactive

# Linting
bun run lint

# Auto-fix linting errors
bun run lint --fix

# Format code
bun run format
```

### Docker Commands

```bash
# Run application with development server (hot reload)
docker compose up --build --watch

# Run with production server configuration
docker compose -f docker-compose.static.yml up --build

# Run with demo data
docker compose -f docker-compose.demo.yml up --build

# Start just database and data import
docker compose up db data-import --build

# Clean up for fresh E2E test runs
docker system prune --volumes
```

### RSA Key Generation (Required Setup)

```bash
# Generate RSA keys for JWT signing
mkdir ~/ops-keys
openssl genrsa -out ~/ops-keys/keypair.pem 2048
openssl rsa -in ~/ops-keys/keypair.pem -pubout -out ~/ops-keys/public.pem
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in ~/ops-keys/keypair.pem -out ~/ops-keys/private.pem

# Set environment variables
export JWT_PRIVATE_KEY=$(cat ~/ops-keys/private.pem)
export JWT_PUBLIC_KEY=$(cat ~/ops-keys/public.pem)

# Update public key files (deprecated but still needed)
cat ~/ops-keys/public.pem > ./public.pub
cat ~/ops-keys/public.pem > ./backend/ops_api/ops/static/public.pem
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks (required for development)
pre-commit install
pre-commit install --hook-type commit-msg
```

## Architecture Overview

### Backend Architecture (Flask/SQLAlchemy)

The backend follows a service-oriented architecture with clear separation of concerns:

**Core Structure:**
- **Flask Application Factory** (`backend/ops_api/ops/__init__.py`): Configures app, database, authentication, and request/response middleware
- **Database Models** (`models/`): SQLAlchemy models with history tracking and event system
- **API Resources** (`backend/ops_api/ops/resources/`): REST API endpoints following Flask MethodView pattern
- **Services** (`backend/ops_api/ops/services/`): Business logic layer
- **Authentication** (`backend/ops_api/ops/auth/`): JWT-based auth with OAuth integration
- **Database Migrations** (`backend/alembic/`): Alembic for schema versioning

**Key Patterns:**
- **Base Views**: `BaseItemAPI` and `BaseListAPI` provide common CRUD operations
- **Permission Decorators**: `@is_authorized` decorator for route-level authorization
- **Event System**: Message bus pattern for domain events (e.g., CAN history tracking)
- **Request/Response Middleware**: Automatic request logging, CSRF protection, user session validation

**Database:**
- PostgreSQL with SQLAlchemy ORM
- Automatic audit history tracking on all model changes
- Database session scoped to Flask app context

### Frontend Architecture (React/Redux)

The frontend follows modern React patterns with Redux for state management:

**Core Structure:**
- **Component Architecture**: Functional components with hooks
- **State Management**: Redux Toolkit with RTK Query for API calls
- **Routing**: React Router with protected routes pattern
- **Styling**: SASS with US Web Design System (USWDS) components

**State Management Pattern:**
- **Redux**: For shared state across components
- **RTK Query**: For API state management and caching
- **useState**: For local component state
- **React Context**: For wizard-like components with encapsulated state

**Authentication Flow:**
- Protected routes using `ProtectedRoute` wrapper
- JWT tokens stored in localStorage
- Automatic token refresh via RTK Query middleware
- OAuth integration with multiple providers

**Key Components:**
- **ProtectedRoute**: Handles authentication checks and redirects
- **DefaultLayout**: Main layout wrapper with navigation
- **API Layer** (`frontend/src/api/`): Centralized API communication

### Development Patterns

**Code Organization:**
- Backend follows service layer pattern with clear separation between API, business logic, and data layers
- Frontend components are organized by feature with co-located tests
- Both use TypeScript/JSDoc for type safety

**Testing Strategy:**
- Backend: pytest with database fixtures
- Frontend: Vitest with React Testing Library and MSW for API mocking
- E2E: Cypress tests requiring running Docker stack
- **90% code coverage requirement** for frontend tests

**Quality Controls:**
- Pre-commit hooks enforce linting, formatting, and security scanning
- Black code formatting for Python
- ESLint + Prettier for JavaScript/React
- TruffleHog for secret detection
- Hadolint for Dockerfile linting

## Application Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## Important Notes

- E2E tests require running `docker system prune --volumes` between runs for clean state
- Backend API endpoints support `simulatedError=true` query parameter for frontend testing
- Database migrations should be reviewed before applying
- RSA keys are required for JWT functionality in development
- Use `pipenv shell` to avoid prefixing commands with `pipenv run`
