# AGENTS.md

This file provides guidance to AI Agents and developers working on the OPRE OPS project.

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

# Run Storybook (component documentation, dev server on port 6006)
bun run storybook

# Build Storybook static output (only when BUILD_STORYBOOK=true; dev/stg deploy workflows opt in)
bun run build-storybook

# Linting
bun run lint

# Auto-fix linting errors
bun run lint --fix

# Format code
bun run format
```

### Docker Commands

```bash
# First run or data reset — starts the full stack including setup services that seed the database
docker compose --profile setup up --build

# Subsequent runs — starts db + backend + frontend only (faster, no setup containers)
docker compose up --build

# Run in detached mode
docker compose up --build -d

# Use enhanced file monitoring (optional, creates additional system overhead)
docker compose up --build --watch

# Run with production server configuration
docker compose -f docker-compose.static.yml --profile setup up --build

# Run with demo data
docker compose -f docker-compose.demo.yml --profile setup up --build

# Start just database and seed data (e.g. before running migrations)
docker compose --profile setup up db data-import --build

# Clean up for fresh E2E test runs
docker system prune --volumes

# Run a second worktree on alternate ports (avoids host-port collisions)
COMPOSE_PROJECT_NAME=ops_feature_xyz \
DB_PORT=55432 \
BACKEND_PORT=58080 \
FRONTEND_PORT=53000 \
BACKEND_DOMAIN=http://localhost:58080 \
OPS_FRONTEND_URL=http://localhost:53000 \
docker compose --profile setup up --build
```

Port variables and their defaults:

| Variable | Default | Purpose |
|---|---|---|
| `DB_PORT` | `5432` | PostgreSQL host port |
| `BACKEND_PORT` | `8080` | Flask API host port |
| `FRONTEND_PORT` | `3000` | Frontend host port |
| `BACKEND_DOMAIN` | `http://localhost:8080` | Backend URL used by the frontend container |
| `OPS_FRONTEND_URL` | `http://localhost:3000` | Frontend origin allowed by backend CORS and Referer validation |

> **Note:** `OPS_FRONTEND_URL` must match the origin the browser uses to reach the frontend. When `FRONTEND_PORT` is set, Compose derives `OPS_FRONTEND_URL` automatically (e.g., `FRONTEND_PORT=53000` → `http://localhost:53000`). Only set `OPS_FRONTEND_URL` explicitly when the browser uses a different host or scheme — otherwise login will fail with CORS errors.

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

### Before Pushing Changes

Run the checks that match the part of the repo you changed instead of relying on CI to catch basic formatting or lint issues.

- Frontend changes: run `bun run lint` and `bun run format` from `frontend/` before pushing.
- Backend changes: run the relevant backend quality checks from `backend/ops_api/`, such as `pipenv run nox -s lint` and formatting checks when Python files changed.
- Mixed changes: run both frontend and backend checks for the files you touched.
- Docs-only or metadata-only changes: use judgment and run only the checks relevant to the edited files.

### Conventional Commits

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages, enforced by commitlint.

**Required Format:**
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Examples:**
```bash
# Feature addition
git commit -m "feat: add user authentication endpoint"

# Bug fix
git commit -m "fix: resolve memory leak in data processing"

# Documentation update
git commit -m "docs: update API documentation for new endpoints"

# Chore (maintenance)
git commit -m "chore: update dependencies to latest versions"

# With scope
git commit -m "feat(auth): implement OAuth2 integration"
```

**Breaking Changes:**
For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:
```bash
git commit -m "feat!: remove deprecated API endpoints"
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
- **Storybook** (dev/stg only): http://localhost:6006 (local), https://dev.ops.opre.acf.gov/storybook, https://stg.ops.opre.acf.gov/storybook

## Storybook Component Documentation

Storybook provides an interactive component library for browsing and developing UI components in isolation. It runs on port 6006 locally and is served at `/storybook` on dev and staging environments. It is **not available in production** (the `Dockerfile.azure` build stage only compiles Storybook when the `BUILD_STORYBOOK=true` build arg is passed; dev and stg deploy workflows opt in, production does not).

### Story File Convention

Stories are **co-located** with their component, following the same pattern as unit tests:

```
src/components/UI/DataViz/LineGraph/
  LineGraph.jsx
  LineGraph.test.jsx        ← unit test
  LineGraph.stories.jsx     ← story
```

### When to Write a Story

- **Required**: All new components added to `src/components/UI/`
- **Encouraged**: Feature/domain components that appear on multiple pages or have complex visual states
- **Not required**: Highly page-specific components tightly coupled to a single route

### Story Title Hierarchy

| Component type | Title prefix | Example |
|---|---|---|
| DataViz primitives | `UI/DataViz/` | `UI/DataViz/LineGraph` |
| Card composites | `UI/Cards/` | `UI/Cards/BudgetCard` |
| Shared UI | `UI/` | `UI/Alert` |
| Feature/domain | `Features/<Domain>/` | `Features/CANs/CanCard` |

### Global Decorators

Every story automatically receives two global decorators (configured in `.storybook/preview.jsx`):

1. **Redux `Provider`** — seed specific state via `parameters.store.preloadedState`:
   ```jsx
   export const WithUser = {
       parameters: { store: { preloadedState: { auth: { activeUser: { id: 1 } } } } }
   };
   ```

2. **`MemoryRouter`** — set initial route via `parameters.reactRouter.initialEntries`:
   ```jsx
   export const OnDetailPage = {
       parameters: { reactRouter: { initialEntries: ["/cans/1"] } }
   };
   ```

### Coverage Exclusion

`*.stories.jsx` files are excluded from the 90% Vitest coverage gate. Stories are documentation, not tests.

See [`frontend/.storybook/README.md`](./frontend/.storybook/README.md) for full conventions and [`docs/adr/031-storybook-for-component-documentation.md`](./docs/adr/031-storybook-for-component-documentation.md) for the architectural decision record.

## Important Notes

- E2E tests require running `docker system prune --volumes` between runs for clean state
- Backend API endpoints support `simulatedError=true` query parameter for frontend testing
- Database migrations should be reviewed before applying
- RSA keys are required for JWT functionality in development
- Use `pipenv shell` to avoid prefixing commands with `pipenv run`

### Vest v6 Form Validation Patterns

**CRITICAL**: This project uses **vest v6** for form validation. Vest v6 has significant breaking changes from v5. When writing or editing suite files (`suite.js`) or validation hooks, follow these rules:

**1. `isNotBlank()` only accepts non-empty strings — numbers always fail.**

Numeric fields (IDs, amounts, counts) must NOT use `isNotBlank()`.

```javascript
// ✅ CORRECT: numeric field
enforce(item.can_id).isNotNullish().greaterThan(0);

// ❌ INCORRECT: enforce(504).isNotBlank() FAILS in vest v6
enforce(item.can_id).isNotBlank();
```

**2. Suite invocation API changed: `suite(data)` → `suite.run(data)`.**

```javascript
// ✅ CORRECT
const result = suite.run(formData);

// ❌ INCORRECT (vest v5 API — throws in v6)
const result = suite(formData);
```

**3. Do not use `only(data)` with a data object.**

In vest v6, `only(fieldName)` skips all other tests and those tests **retain their previous failed state**, causing phantom validation errors. Pass a specific field name string or omit `only()` entirely.

```javascript
// ✅ CORRECT: omit only() to run all tests
create("suiteName", () => {
    test("field_a", "Error message", () => { ... });
    test("field_b", "Error message", () => { ... });
});

// ❌ INCORRECT: only(data) where data is the whole form object silently skips tests
create("suiteName", (data) => {
    only(data); // DO NOT DO THIS
    test("field_a", "Error message", () => { ... });
});
```

**4. Avoid calling `suite.reset()` during a render cycle.**

If you need validation state in a component, store the result with `useEffect` or call `suite.run()` inline during render (not in an effect that also resets state). See `ReviewAgreement.hooks.js` for the `useEffect`-based pattern.

### Data-Visualization Percentage Display Convention

**CRITICAL**: Data-viz components use a custom rounding scheme to avoid contradictory or broken labels. Never use `Math.round()` directly on chart percentages — always go through the shared helpers in `frontend/src/helpers/utils.js`.

#### Figma design rules (source of truth)

| Scenario | Display value |
|---|---|
| Value is exactly zero | `0%` |
| Non-zero value that rounds to 0% | `<1%` — never show `0%` for a real non-zero value |
| Dominant value that rounds to 100% while non-zero peers exist | `99%` — never show `100%` when other categories exist |
| Integer labels would otherwise sum to 99% or 101% | Use largest remainder so the displayed whole-number labels sum to `100%` |
| All other values | Rounded to nearest whole number |

**What NOT to show**: `>99%`, `0%` for non-zero values, `100%` when other non-zero items exist.

#### Three shared helpers (all exported from `utils.js`)

| Helper | Purpose |
|---|---|
| `computeDisplayPercent(value, total)` | Single-item display percent; returns `"<1"` instead of `0` for non-zero tiny values |
| `computeDisplayPercents(items)` | Cross-item normalisation; caps a dominant item at `99` and uses largest remainder so integer labels sum to `100` when possible |
| `applyMinimumArcValue(items, total)` | Floors arc slices to 1% of total **for chart geometry only** (never for legend labels) |

#### Why `"<1"`, `99`, and largest remainder exist

- `Math.round(0.4%)` → `0` — renders as "0%" in the legend, hiding a real slice.
- `Math.round(99.6%)` with a non-zero peer → `100%` — contradicts the peer's label (e.g. "100% + <1%").
- `Math.round(33.3%) + Math.round(33.3%) + Math.round(33.4%)` → `33 + 33 + 33 = 99` — the legend no longer adds up to the whole.

The helpers fix both cases:

```javascript
// ✅ CORRECT: use shared helpers for chart labels
import { computeDisplayPercents } from "../../helpers/utils";

const itemsWithPercent = computeDisplayPercents(rawItems);
// Each item now has a `percent` field: integer (including 99 for capped dominant), or "<1"
// Example: 333/333/334 becomes 33/33/34 so the legend sums to 100%
```

```javascript
// ❌ INCORRECT: raw Math.round produces "0%" for tiny non-zero values
const percent = Math.round((item.value / total) * 100); // may return 0 for <0.5%
```

#### Arc-visibility vs. legend values

`applyMinimumArcValue` is applied **inside `ResponsiveDonutWithInnerPercent`** automatically. Callers must **not** apply it before passing data to the component — it would corrupt the legend numbers. Supply the real `value` fields; the component floors arc geometry internally.

```javascript
// ✅ CORRECT: pass real values; arc flooring is automatic
<ResponsiveDonutWithInnerPercent data={itemsWithRealValues} />

// ❌ INCORRECT: pre-flooring distorts both chart AND legend
const safeData = applyMinimumArcValue(items, total);
<ResponsiveDonutWithInnerPercent data={safeData} />
```

#### `HorizontalStackedBar` segment filtering

`HorizontalStackedBar` filters and sizes bars by `item.value` (always numeric), **not** by `item.percent` (which may be the string `"<1"`). Ensure every segment object has a numeric `value` field alongside the display `percent`.

```javascript
// ✅ CORRECT: segment has numeric value
{ id: 1, value: 500, percent: "<1", color: "...", label: "..." }

// ❌ INCORRECT: filtering/sizing by percent string breaks layout
// Do not rely on item.percent for conditional rendering inside bar components
```

### Fee Percentage Format Convention

**CRITICAL**: Fee percentages must be consistently formatted throughout the application:

- **Backend Storage**: Fee percentages are stored as whole numbers (e.g., `5.0` = 5%, `4.8` = 4.8%)
- **Frontend Calculation**: The `calculateTotal` helper function in `frontend/src/helpers/agreement.helpers.js` expects whole numbers and divides by 100 internally
- **Test Data**: Always use whole number format in test files (e.g., `fee_percentage: 5.0`, not `fee_percentage: 0.05`)

**Common Bug Pattern**: Components should NOT pre-divide fee percentages by 100 before passing to `calculateTotal`, as this causes fees to be calculated as 1/100th of the correct value.

**Example:**
```javascript
// ✅ CORRECT: Pass whole number directly
const fee = calculateTotal(budgetLines, 5.0); // 5% fee rate

// ❌ INCORRECT: Do not pre-divide by 100
const fee = calculateTotal(budgetLines, 5.0 / 100); // Results in 0.05% fee rate
```
