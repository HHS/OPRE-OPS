# CLAUDE.md - Frontend (React/Redux)

This file provides frontend-specific guidance for Claude Code when working in the React/Redux frontend.

## Frontend Development Context

This is the React frontend for OPRE OPS. All commands below should be run from the `frontend/` directory.

### Package Management

**Use bun for all Node.js dependencies:**

```bash
# Install dependencies (frozen lockfile for consistent builds)
bun install --frozen-lockfile

# Add a new package
bun add package-name

# Add a development dependency
bun add --dev package-name
```

### Running the App

```bash
bun run start          # Development server (port 3000)
bun run start:debug    # Development server with debugging
bun run build          # Production build
```

### Running Tests

```bash
bun run test --watch=false       # Run unit tests once
bun run test                     # Run tests in watch mode
bun run test:coverage --watch=false  # Coverage report (requires 90%)
bun run test:ui                  # Run tests with UI
```

**Important**: 90% code coverage is required. Tests are co-located with components (`.test.jsx` files).

### E2E Tests

E2E tests use Cypress and require the Docker stack to be running. Use the `/e2e-tests` skill for running, monitoring, and fixing E2E tests.

```bash
bun run test:e2e              # Run E2E tests (headless)
bun run test:e2e:interactive  # Run E2E tests interactively
```

Clean state between full test runs: `docker system prune --volumes`

### Code Quality

```bash
bun run lint         # Linting (ESLint)
bun run lint --fix   # Auto-fix linting errors
bun run format       # Format code (Prettier)
```

**Before committing:**
1. Run `bun run lint` to check for linting errors
2. Run `bun run format` to fix formatting
3. Pre-commit hooks will enforce these checks

## Architecture

### Core Structure

- **Component Architecture**: Functional components with hooks, organized by feature
  - UI components: `src/components/UI/`
  - Feature components: `src/components/{Agreements,CANs,Projects,etc.}/`
  - Pages: `src/pages/`
- **State Management**:
  - Redux Toolkit (`store.js`) for global state
  - RTK Query (`src/api/opsAPI.js`) for API calls with automatic caching and invalidation
  - React Context for wizard-like flows with encapsulated state
- **Routing**: React Router with protected routes (`ProtectedRoute` component)
- **Styling**: SASS with US Web Design System (USWDS) components
- **API Layer**: Centralized in `src/api/`
  - `opsAPI.js`: Main RTK Query API with all endpoints
  - `opsAuthAPI.js`: Authentication-specific endpoints

### Key Patterns

**Protected Routes**: Routes wrapped with authentication checks. Unauthenticated users are redirected to login.

**RTK Query**: API endpoints defined as RTK Query endpoints with automatic cache invalidation via tags. Mutations invalidate related queries to keep data fresh.

**Form Validation**: Uses **Vest** validation library for declarative form validation.

**Type Safety**: PropTypes used throughout for runtime type checking.

### Testing Patterns

- **Vitest** with React Testing Library for unit tests
- **MSW (Mock Service Worker)** for API mocking in tests only
- Tests are co-located with their components (`.test.jsx` files)
- E2E tests use **Cypress** in `cypress/e2e/*.cy.js`

## Fee Percentage Format Convention

**CRITICAL**: Fee percentages are whole numbers (e.g., `5.0` = 5%). The `calculateTotal` helper in `src/helpers/agreement.helpers.js` divides by 100 internally.

```javascript
// CORRECT
const fee = calculateTotal(budgetLines, 5.0); // 5% fee rate

// INCORRECT - do NOT pre-divide
const fee = calculateTotal(budgetLines, 5.0 / 100); // Results in 0.05% fee rate
```

## Important Files

- `src/api/opsAPI.js`: RTK Query API with all endpoints
- `src/api/opsAuthAPI.js`: Authentication-specific endpoints
- `src/store.js`: Redux store configuration
- `src/components/UI/`: Shared UI components
- `src/helpers/agreement.helpers.js`: Agreement calculation helpers
- `src/pages/`: Page-level components (route targets)
- `cypress/e2e/`: E2E test specs
- `cypress/support/commands.js`: Custom Cypress commands

## Integration with Backend

The frontend makes API calls to `http://localhost:8080/api/v1/`. Key integration points:

- **Authentication**: JWT tokens in `Authorization: Bearer <token>` header
- **Error responses**: Backend returns `{"error": "message"}` for 4xx/5xx
- **Simulated errors**: Append `?simulatedError=true` to any API call for testing error handling

When backend API responses change, update the corresponding RTK Query endpoints in `src/api/opsAPI.js`.
