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

**Before pushing frontend code changes:**
1. Run `bun run lint` to check for linting errors
2. Run `bun run format` to fix formatting
3. Re-run any focused frontend tests you changed or added
4. Pre-commit hooks will enforce some of these checks, but do not rely on CI to catch avoidable frontend lint/format failures

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

### Internal Notification Links and Auth Hydration

Notification messages are rendered from markdown in `src/components/UI/LogItem/LogItem.jsx`.

- Internal OPS links in markdown must use client-side routing via `react-router-dom` `Link`, not plain `<a>` tags.
- Same-origin absolute URLs (for example `http://localhost:3000/agreements/approve/...`) should also be converted to SPA routes.
- Plain anchors can trigger a full page reload, which may re-enter protected routes before `auth.activeUser` has been restored.
- Pages that gate access on `activeUser` should avoid redirecting or denying access until auth hydration is complete.

This pattern matters for notification-center links into protected pages like agreement review and approval flows.

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
