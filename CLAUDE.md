# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Actions

This repository includes reusable automation scripts in `.claude/actions/` for common development tasks:

- **`monitor-ci.sh`**: Monitor GitHub Actions CI runs until completion
- **`quick-ci-status.sh`**: Instantly check the latest CI run status

See [`.claude/actions/README.md`](.claude/actions/README.md) for usage details.

**Example usage**:
```bash
# Check current CI status
./.claude/actions/quick-ci-status.sh

# Monitor a specific CI run
./.claude/actions/monitor-ci.sh 21634663420 90
```

These scripts can be invoked by Claude Code automatically or run manually.

## Claude Story Templates

This repository includes reusable story templates in `.claude/templates/` for consistent planning and implementation with Claude Code.

Available templates:

- **`feature-story.md`**: For implementing new features
- **`bug-story.md`**: For fixing bugs and defects
- **`refactor-story.md`**: For code refactoring and technical improvements

See [`.claude/templates/README.md`](.claude/templates/README.md) for detailed usage instructions.

**Example usage**:

```bash
# Copy template to gitignored stories directory
cp .claude/templates/feature-story.md .claude/stories/OPS-1234.md

# Edit with your specific story details
# Use with Claude Code for implementation
```

Personal story files in `.claude/stories/` are gitignored to keep work-in-progress private.

## Flaky Test Detection

The CI pipeline automatically detects flaky E2E tests by analyzing Cypress retry patterns. Spec files that require retries are flagged in the GitHub Actions job summary.

**How it works**:

- Cypress is configured in CI via `frontend/cypress.config.ci.js` with `retries.runMode: 3` (3 retries, up to 4 attempts total)
- A detection script (`.github/scripts/detect-flaky-tests.sh`) parses Cypress output logs
- Spec files with retries are reported in the job summary with recommended actions
- Cypress output logs are uploaded as artifacts for manual review

**Viewing flaky test reports**:

1. Navigate to the GitHub Actions run for your PR
2. Click on any E2E test job
3. Scroll to the job summary to see the flaky test detection report

**Local usage**:

```bash
# Run E2E tests locally and capture output
cd frontend
bun run test:e2e 2>&1 | tee cypress-output.log

# Analyze for flaky tests
../.github/scripts/detect-flaky-tests.sh cypress-output.log
```

See [`.github/scripts/README.md`](.github/scripts/README.md) for detailed documentation.

## Project Overview

OPRE OPS is the Portfolio Management System for OPRE (Office of Planning, Research and Evaluation), replacing the legacy MAPS system. It's a full-stack web application with a Flask/SQLAlchemy backend API and a React/Redux frontend, containerized with Docker.

## Common Development Commands

### Backend (Python/Flask)

The backend uses **pipenv** for Python dependency management. Navigate to `backend/ops_api/` for most operations.

```bash
# Install dependencies
cd backend/ops_api
pipenv install --dev

# Run unit tests
pipenv run pytest

# Run single test
pipenv run pytest tests/path/to/test_file.py::test_function_name

# Run specific test class or method
pipenv run pytest tests/path/to/test_file.py::TestClassName::test_method_name

# Linting
pipenv run nox -s lint

# Check formatting (Black + isort) without modifying files
pipenv run nox -s format-check

# Auto-format code with Black and isort
pipenv run nox -s black

# If you're in a pipenv shell, omit "pipenv run"
pipenv shell
pytest
nox -s lint
nox -s format-check
```

### Database Migrations

Database migrations use **Alembic** and must be run from the `backend/` directory.

```bash
# Start database and apply migrations
docker compose up db data-import --build

# Generate new migration (auto-detect model changes)
cd backend/
alembic revision --autogenerate -m "Your migration message"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Frontend (React/Bun)

The frontend uses **bun** for Node.js dependency management. Navigate to `frontend/` for all operations.

```bash
# Install dependencies (frozen lockfile - use for consistent builds)
cd frontend
bun install --frozen-lockfile

# Run development server
bun run start

# Run development server with debugging
bun run start:debug

# Build for production
bun run build

# Run unit tests (once)
bun run test --watch=false

# Run tests in watch mode
bun run test

# Run tests with coverage (requires 90% coverage)
bun run test:coverage --watch=false

# Run tests with UI
bun run test:ui

# Linting
bun run lint

# Auto-fix linting errors
bun run lint --fix

# Format code with Prettier
bun run format

# Run E2E tests (requires running Docker stack)
bun run test:e2e

# Run E2E tests interactively
bun run test:e2e:interactive
```

### Docker Commands

```bash
# Run full application with hot reload
docker compose up --build

# Run in detached mode
docker compose up --build -d

# Run with enhanced file monitoring (creates system overhead)
docker compose up --build --watch

# Run with production server configuration
docker compose -f docker-compose.static.yml up --build

# Run with demo data
docker compose -f docker-compose.demo.yml up --build

# Start only database and import test data
docker compose up db data-import --build

# Clean up volumes between E2E test runs
docker system prune --volumes
```

### Pre-commit Hooks

Required for development. Enforces linting, formatting, and security scanning.

```bash
# Install pre-commit hooks (run once)
pre-commit install
pre-commit install --hook-type commit-msg
```

### Commit Message Standards

This repository uses **Conventional Commits** format enforced by commitlint.

**Format:**
```
<type>: <description>

[optional body]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Common Types:**
- **feat**: New feature
- **fix**: Bug fix
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **docs**: Documentation changes
- **chore**: Maintenance tasks (deps, config)
- **style**: Code style changes (formatting, no logic change)

**Examples:**
```bash
feat: add includeAllOption to FiscalYearComboBox
fix: correct fiscal year formatting in dropdown
refactor: simplify budget calculation logic
test: add coverage for filter component
chore(deps): update patch dependencies
```

**Important:**
- Always use conventional commit format (commitlint will reject non-conforming commits)
- Check recent commits with `git log --oneline -5` to match repository style
- Include ticket numbers in branch names (e.g., `OPS-4927/feature-name`), not in commit messages

### Editor Setup

For consistent code formatting across the team, configure your editor properly.

#### VSCode (Recommended)

The repository includes VSCode configuration files (`.vscode/settings.json` and `.vscode/extensions.json`) that automatically:
- Enable format-on-save for all file types
- Configure Prettier with the project's settings (120 char width, 4 space tabs)
- Configure Black for Python formatting

**Required extensions** (VSCode will prompt you to install these):
- Prettier - Code formatter (`esbenp.prettier-vscode`)
- ESLint (`dbaeumer.vscode-eslint`)
- Python (`ms-python.python`)
- Black Formatter (`ms-python.black-formatter`)
- Flake8 (`ms-python.flake8`)

**Manual setup** (if extensions don't auto-configure):
1. Install the Prettier extension
2. Set Prettier as your default formatter for JS/JSX/TS/TSX/JSON/CSS/SCSS/HTML/Markdown
3. Enable "Format On Save" in VSCode settings

#### Other Editors

The project uses **EditorConfig** (`.editorconfig`) and **Prettier** (`frontend/.prettierrc.json`) for consistent formatting:
- Install an EditorConfig plugin for your editor
- Install a Prettier plugin and configure it to use the project's `.prettierrc.json`
- Formatting settings: 120 char line width, 4 space indentation, no trailing commas

**Frontend formatting config** (`frontend/.prettierrc.json`):
```json
{
  "printWidth": 120,
  "tabWidth": 4,
  "trailingComma": "none",
  "singleAttributePerLine": true
}
```

**Important**: Always check and fix formatting before committing if your editor doesn't auto-format:
- Frontend: `bun run format` (or `bun run prettier --check` to verify without modifying)
- Backend: `pipenv run nox -s format-check` to verify, or `pipenv run nox -s black` to auto-fix

The pre-commit hooks will block commits with formatting issues.

## High-Level Architecture

### Backend Architecture (Flask/SQLAlchemy)

The backend follows a **service-oriented architecture** with clear separation of concerns:

#### Core Structure

- **Flask Application Factory** (`backend/ops_api/ops/__init__.py`): Configures the app, database, authentication, and middleware
- **Database Models** (`backend/models/`): SQLAlchemy models shared across backend services
  - Key models: `agreements.py`, `budget_line_items.py`, `cans.py`, `projects.py`, `users.py`
  - Automatic audit history tracking via `history.py` and event system in `events.py`
- **API Resources** (`backend/ops_api/ops/resources/`): REST API endpoints using Flask MethodView pattern
- **Services** (`backend/ops_api/ops/services/`): Business logic layer separated from API endpoints
- **Authentication** (`backend/ops_api/ops/auth/`): JWT-based authentication with OAuth integration
  - Supports multiple providers: Login.gov, HHS AMS, and fake auth for testing
  - Authentication gateway pattern with provider factory
- **Database Migrations** (`backend/alembic/`): Alembic migrations for schema versioning
- **Data Tools** (`backend/data_tools/`): ETL scripts for importing data from Excel and managing test data

#### Key Backend Patterns

**Base Views**: `BaseItemAPI` and `BaseListAPI` in `base_views.py` provide common CRUD operations. Most API resources inherit from these for consistency.

**Permission System**: `@is_authorized` decorator in `backend/ops_api/ops/auth/` provides route-level authorization. Works with role-based permissions defined in `authorization_providers.py`.

**Event System**: Domain events use a message bus pattern for tracking history and triggering side effects. See `backend/models/events.py` and `*_history.py` models.

**Request/Response Middleware**: Automatic request logging, CSRF protection, user session validation, and simulated error support (via `simulatedError` query parameter for frontend testing).

**Database Session Management**: SQLAlchemy sessions are scoped to Flask app context, automatically committed or rolled back.

#### Testing Backend

- Uses **pytest** with database fixtures
- Test directory mirrors source structure: `backend/ops_api/tests/`
- Run tests from `backend/ops_api/` directory
- Tests use in-memory SQLite or test PostgreSQL database

### Frontend Architecture (React/Redux)

The frontend follows modern React patterns with **Redux Toolkit** for state management:

#### Core Structure

- **Component Architecture**: Functional components with hooks, organized by feature
  - UI components: `frontend/src/components/UI/`
  - Feature components: `frontend/src/components/{Agreements,CANs,Projects,etc.}/`
  - Pages: `frontend/src/pages/`
- **State Management**:
  - Redux Toolkit (`store.js`) for global state
  - RTK Query (`frontend/src/api/opsAPI.js`) for API calls with automatic caching and invalidation
  - React Context for wizard-like flows with encapsulated state
- **Routing**: React Router with protected routes (`ProtectedRoute` component)
- **Styling**: SASS with US Web Design System (USWDS) components
- **API Layer**: Centralized in `frontend/src/api/`
  - `opsAPI.js`: Main RTK Query API with all endpoints
  - `opsAuthAPI.js`: Authentication-specific endpoints

#### Key Frontend Patterns

**Protected Routes**: Routes wrapped with authentication checks. Unauthenticated users are redirected to login.

**RTK Query Pattern**: API endpoints defined as RTK Query endpoints with automatic cache invalidation via tags. Mutations invalidate related queries to keep data fresh.

**Form Validation**: Uses **Vest** validation library for declarative form validation.

**Component Organization**: Components are co-located with their tests (`.test.jsx` files) and styles.

**Type Safety**: PropTypes used throughout for runtime type checking.

#### Testing Frontend

- Uses **Vitest** with React Testing Library
- **MSW (Mock Service Worker)** for API mocking in tests only
- **90% code coverage requirement**
- E2E tests use **Cypress** and require running Docker stack
- Run `docker system prune --volumes` between E2E test runs for clean state

### Data Model

The database uses PostgreSQL with SQLAlchemy ORM. Key domain entities:

- **CANs** (Contract Account Numbers): Funding sources with budgets and fiscal year tracking
- **Agreements**: Contracts or grants with budget line items
- **Projects**: Organizational units that group agreements
- **Portfolios**: Top-level organizational structure
- **Budget Line Items**: Line-level budget allocations linking agreements to CANs
- **Users**: Authentication and authorization with role-based permissions

All models have automatic audit history tracking via the event system.

### Docker Architecture

The application runs in four main services:

1. **db**: PostgreSQL database
2. **data-import**: Imports test data on startup
3. **backend**: Flask API server (port 8080)
4. **frontend**: Vite dev server with hot reload (port 3000)

## Important Technical Details

### Required Initial Setup

**RSA Keys for JWT**: The backend uses RSA keys to sign and verify JWTs. Generate and configure these before running:

```bash
mkdir ~/ops-keys
openssl genrsa -out ~/ops-keys/keypair.pem 2048
openssl rsa -in ~/ops-keys/keypair.pem -pubout -out ~/ops-keys/public.pem
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in ~/ops-keys/keypair.pem -out ~/ops-keys/private.pem

export JWT_PRIVATE_KEY=$(cat ~/ops-keys/private.pem)
export JWT_PUBLIC_KEY=$(cat ~/ops-keys/public.pem)

cat ~/ops-keys/public.pem > ./public.pub
cat ~/ops-keys/public.pem > ./backend/ops_api/ops/static/public.pem
```

### Fee Percentage Format Convention

**CRITICAL**: Fee percentages must be consistently formatted throughout the application:

- **Backend Storage**: Fee percentages are stored as whole numbers (e.g., `5.0` = 5%, `4.8` = 4.8%)
- **Frontend Calculation**: The `calculateTotal` helper function in `frontend/src/helpers/agreement.helpers.js` expects whole numbers and divides by 100 internally
- **Test Data**: Always use whole number format (e.g., `fee_percentage: 5.0`, not `fee_percentage: 0.05`)

**Common Bug**: Components should NOT pre-divide fee percentages by 100 before passing to `calculateTotal`, as this causes fees to be calculated as 1/100th of the correct value.

```javascript
// ✅ CORRECT
const fee = calculateTotal(budgetLines, 5.0); // 5% fee rate

// ❌ INCORRECT
const fee = calculateTotal(budgetLines, 5.0 / 100); // Results in 0.05% fee rate
```

### Simulated Errors for Testing

Backend API endpoints support `simulatedError=true` query parameter for frontend testing. This returns a 500 status code (or custom code with `simulatedError=400`, etc.) without processing the request.

### Code Quality Standards

- **Python**: Black formatting (120 char line length), flake8 linting
- **JavaScript/React**: ESLint + Prettier, accessibility checks (jsx-a11y)
- **Pre-commit hooks**: Automatically enforce formatting, linting, and security scanning
- **Coverage**: Frontend requires 90% code coverage

### Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

### CI/CD

The project uses **GitHub Actions** for CI/CD:
- Development and staging deploy automatically on push to `main`
- Production deploys manually via GitHub Actions workflows
- Workflows located in `.github/workflows/`
