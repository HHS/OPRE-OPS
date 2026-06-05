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

### Storybook

Storybook provides an interactive component browser for developing and reviewing UI components in isolation. It runs on port 6006 and is served at `/storybook` on dev and staging (not production).

```bash
bun run storybook          # Start dev server at http://localhost:6006
bun run build-storybook    # Build static output (used in Dockerfile.azure for dev/stg)
```

**Story file convention** — co-locate stories with their component:
```
src/components/UI/Alert/
  Alert.jsx
  Alert.test.jsx          ← unit test (unchanged)
  Alert.stories.jsx       ← new story file
```

**Global decorators** (configured in `.storybook/preview.jsx`, apply to every story automatically):
- **Redux `Provider`** — seed store state via `parameters.store.preloadedState`
- **`MemoryRouter`** — set initial route via `parameters.reactRouter.initialEntries`

**Coverage**: `*.stories.jsx` files are excluded from the 90% coverage gate.

See [`.storybook/README.md`](.storybook/README.md) for the full conventions guide.

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

## scrollToTop After Success Alerts

Always call `scrollToTop()` after `setAlert({ type: "success", ... })` in action handlers that navigate away from the current page. This ensures the user sees the success alert banner at the top before the page transitions.

```javascript
// CORRECT — scrollToTop after success alert, before navigate
setAlert({ type: "success", heading: "Saved", message: "..." });
scrollToTop();
navigate("/agreements");

// INCORRECT — user may miss the alert if scrolled down on a long form
setAlert({ type: "success", heading: "Saved", message: "..." });
navigate("/agreements");
```

Import from `src/helpers/scrollToTop.helper`. Do NOT call `scrollToTop()` on error paths.

## Numeric Display Conventions

### Fee Percentage Storage

**CRITICAL**: Fee percentages are whole numbers (e.g., `5.0` = 5%). The `calculateTotal` helper in `src/helpers/agreement.helpers.js` divides by 100 internally.

```javascript
// CORRECT
const fee = calculateTotal(budgetLines, 5.0); // 5% fee rate

// INCORRECT - do NOT pre-divide
const fee = calculateTotal(budgetLines, 5.0 / 100); // Results in 0.05% fee rate
```

### Currency Display: Always Show Two-Digit Cents

Currency values in the UI must render with exactly two decimal places (rounded, not truncated). Never display a raw float like `$130,143,958.5836`.

For **display-only** (read-only) currency, use the `formatCurrency()` helper from `src/helpers/currencyFormat.helpers.js`. It already enforces the project convention: zero renders as `$0` (no decimals), non-zero renders with exactly two decimals (e.g., `$1,234.50`). Null, undefined, NaN, and Infinity coerce to `$0`.

```jsx
import { formatCurrency } from "../../helpers/currencyFormat.helpers";

// CORRECT — handles zero suppression and 2-decimal rounding internally
<span>{formatCurrency(amount)}</span>

// INCORRECT — manual Intl.NumberFormat without the zero-suppression rule
<span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)}</span>
```

For **form inputs** accepting currency, use the `CurrencyInput` component (`src/components/UI/Form/CurrencyInput/CurrencyInput.jsx`), which wraps `react-currency-input-field`.

For card totals rendered at large font sizes (`font-sans-xl` / 2 rem or larger), use `src/components/UI/CurrencyWithSmallCents/CurrencyWithSmallCents.jsx` to render dollars in the large font and cents in a smaller font. This is required — large bold cents at 32 px+ look disproportionate. See `BudgetCard`, `BigBudgetCard`, `CurrencyCard`, and `ReceivedFundingCard` for existing usage. Cards with smaller text sizes for amounts (e.g., legend rows, table cells) can render cents at the same size as the dollars using `formatCurrency()`.

### Percentages: Use the `<1%` and 99-Cap Conventions

Multi-segment legends and summary breakdowns must follow these display rules:

1. A non-zero value that rounds down to 0% displays as `<1%`, never `0%`. `0%` is reserved for values that are truly zero.
2. When one segment would round to 100% but other non-zero segments exist, cap the dominant segment at `99%` (per Figma spec — never `>99%`).
3. When all segments round to whole numbers, the displayed integers should sum to exactly 100 via the largest-remainder algorithm.

Use the helpers in `src/helpers/utils.js`:

- `computeDisplayPercents(items)` — apply this to the **full array** of legend/segment items. It performs cross-item normalization (rules 1–3 above) and is the right choice for any multi-item legend, donut, or stacked bar. Examples: `BLIStatusSummaryCard`, `PortfolioLegend`, `AgreementSpendingCards`.
- `computeDisplayPercent(value, total)` — single-item helper. Only handles rule 1 (`<1%`). Use this only when the surrounding context already guarantees rules 2 and 3 don't apply (e.g., a standalone metric, not a legend).

```javascript
// CORRECT — cross-item normalization for a legend
const legendData = computeDisplayPercents(rawItems);

// INCORRECT — per-item calls in a loop lose the 99-cap and sum-to-100 rules
const legendData = rawItems.map((item) => ({
    ...item,
    percent: computeDisplayPercent(item.value, total)
}));
```

The `Tag` component renders these values verbatim, so a `percent` of `"<1"` displays as `<1%` and `99` displays as `99%` without further string handling.

## Important Files

- `src/api/opsAPI.js`: RTK Query API with all endpoints
- `src/api/opsAuthAPI.js`: Authentication-specific endpoints
- `src/store.js`: Redux store configuration
- `src/components/UI/`: Shared UI components
- `src/components/UI/CurrencyWithSmallCents/CurrencyWithSmallCents.jsx`: Required for large-font (font-sans-xl+) currency totals on cards
- `src/helpers/agreement.helpers.js`: Agreement calculation helpers
- `src/helpers/utils.js`: Shared helpers including `computeDisplayPercents` / `computeDisplayPercent` and `convertToCurrency`
- `src/helpers/currencyFormat.helpers.js`: `formatCurrency` helper for display-only currency rendering
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
