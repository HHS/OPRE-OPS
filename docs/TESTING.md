# Testing Strategy

**Purpose:** Timeless guidance on how to write and organize tests in OPRE OPS
**Audience:** Developers, QA engineers, new team members
**Related:** See [TESTING_ASSESSMENT.md](TESTING_ASSESSMENT.md) for current state analysis and roadmap

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Strategy by Layer](#testing-strategy-by-layer)
3. [BDD Testing Guidelines](#bdd-testing-guidelines)
4. [Best Practices by Technology](#best-practices-by-technology)
5. [CI/CD Testing Architecture](#cicd-testing-architecture)
6. [Resources and Examples](#resources-and-examples)

---

## Testing Philosophy

### Test Pyramid Model

OPRE OPS follows the **test pyramid** model, emphasizing fast, isolated unit tests at the base, integration tests in the middle, and a small set of critical E2E tests at the top. This strategy balances confidence, speed, and maintainability.

```
         /\
        /  \  E2E Tests (Slow, Critical Paths Only)
       /    \  Critical user journeys only
      /------\
     /        \ Integration Tests (Medium Speed)
    /  BDD +   \ API, Service Layer, Redux + RTK Query
   /   Component \
  /--------------\
 /                \ Unit Tests (Fast, Numerous)
/  Pure Functions  \ Helpers, Models, Utilities
--------------------
```

### Key Principles

**1. Test at the Lowest Appropriate Level**

Don't use an E2E test when a unit test would suffice. The lower in the pyramid, the faster and more reliable the test.

**2. Favor Integration Over E2E**

Integration tests with real framework components (Redux, SQLAlchemy) provide strong confidence without browser overhead.

**3. Write Tests That Provide Value**

Every test should catch real bugs or document important behavior. Avoid tests that simply assert implementation details.

**4. Make Tests Reliable**

A flaky test is worse than no test. Fix or delete tests that fail intermittently.

**5. Keep Tests Fast**

Slow test suites discourage running tests locally. Optimize for developer experience.

**6. Know When NOT to Test**

Don't test trivial code, framework internals, or generated artifacts. Focus testing effort on business logic and integration points.

---

## Testing Strategy by Layer

### Unit Tests (Fast, Isolated, Numerous)

**Philosophy:** Test individual functions, components, and modules in complete isolation. No database, no network, no external dependencies.

**When to Use:**
- Pure functions (calculations, transformations, formatters)
- Model properties and methods
- Helper utilities
- Simple React components with no state or side effects
- Form validation logic

**Backend Example:**
```python
# backend/ops_api/tests/ops/can/test_can.py
def test_can_retrieve(loaded_db, mocker, app_ctx):
    """Test basic CAN retrieval and property access"""
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2023, 8, 1)

    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can.number == "G99HRF2"
    assert can.active_period == 1
    assert can.status == CANStatus.ACTIVE
```

**Frontend Example:**
```javascript
// frontend/src/helpers/agreement.helpers.test.js
describe("getProcurementShopSubTotal", () => {
    it("returns 0 if procurement_shop is not present", () => {
        agreement.procurement_shop = null;
        const result = getProcurementShopSubTotal(agreement);
        expect(result).toBe(0);
    });

    it("excludes DRAFT budget lines before approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, false);
        expect(result).toBe(165);
    });
});
```

**Key Characteristics:**
- Execute in milliseconds
- No database fixtures required
- Use mocks/stubs for external dependencies
- Focus on edge cases and boundary conditions

---

### Integration Tests (Medium Speed, Some Dependencies)

**Philosophy:** Test interactions between modules, ensuring components work together correctly. May use real database, real Redux store, or real API layer.

**When to Use:**
- Service layer business logic with database access
- Redux hooks that interact with state
- RTK Query API endpoints with transformResponse logic
- Component integration with mocked APIs
- Message bus pub/sub patterns
- Validation rules with database lookups

**Backend Example:**
```python
# backend/ops_api/tests/ops/services/test_agreements.py
def test_service_can_get_all(auth_client, loaded_db):
    """Test service retrieves all CANs with correct metadata"""
    count = loaded_db.query(CAN).count()
    can_service = CANService()
    cans, metadata = can_service.get_list()

    assert len(cans) == count
    assert metadata["count"] == count
    assert metadata["limit"] == count
    assert metadata["offset"] == 0
```

**Frontend Example:**
```javascript
// frontend/src/api/opsAPI.test.js
it("should construct query parameters correctly", async () => {
    const storeRef = setupApiStore(opsApi);

    await storeRef.store.dispatch(
        opsApi.endpoints.getAgreements.initiate({
            fiscal_year: 2023,
            limit: 10,
            offset: 20
        })
    );

    expect(capturedUrl).toContain("fiscal_year=2023");
    expect(capturedUrl).toContain("limit=10");
    expect(capturedUrl).toContain("offset=20");
});
```

**Key Characteristics:**
- Execute in seconds (not milliseconds)
- May use test database or in-memory store
- Real framework components (SQLAlchemy session, Redux store)
- Focus on interactions and data flow

---

### BDD/Feature Tests (Backend Only)

**Philosophy:** Stakeholder-readable scenarios that validate critical business processes. Written in Gherkin (Given/When/Then) for non-technical comprehension.

**When to Use:**
- Multi-step business processes requiring stakeholder sign-off
- Regulatory compliance scenarios (audit, financial reporting)
- Cross-domain workflows (agreements + budget + procurement)
- High-value user journeys with complex acceptance criteria
- Features where business rules change frequently and need validation

**When NOT to Use:**
- Simple CRUD operations
- Edge case validation (use unit tests)
- Technical error scenarios
- Low-level data transformations

**Example:**
```gherkin
# backend/ops_api/tests/ops/features/api_version.feature
Feature: API Version Endpoint
    As a user of the OPS API, I want to be able to check the API version
    so that I can ensure compatibility with my client application.

Scenario: Get API version as an authenticated user
    Given I am logged in as an authenticated user
    When I request the API version
    Then I should receive a successful response
    And the response should contain a version number
```

```python
# backend/ops_api/tests/ops/features/test_api_version.py
@scenario("api_version.feature", "Get API version as an authenticated user")
def test_get_version_authenticated():
    pass

@given("I am logged in as an authenticated user", target_fixture="client")
def authenticated_client(auth_client):
    return auth_client

@when("I request the API version", target_fixture="response")
def request_version(client, context, app):
    with app.app_context():
        response = client.get("/api/v1/version/")
        context["response"] = response
        return response

@then("I should receive a successful response")
def check_successful_response(context):
    response = context.get("response")
    assert response.status_code == 200
```

See [BDD Testing Guidelines](#bdd-testing-guidelines) for detailed patterns.

---

### Component Tests (Frontend)

**Philosophy:** Test complex UI components in isolation using Cypress component testing. Faster than E2E, more realistic than unit tests.

**When to Use:**
- Complex interactive components (accordions, modals, wizards)
- Multi-step forms with validation
- Components with significant DOM manipulation
- Visual regression candidates

**Good Candidates:**
- Multi-step wizards with complex validation
- Interactive components with state management
- Collapsible sections with togglable state
- Multi-field forms with dynamic validation

**Benefits:**
- Fast feedback (faster than E2E)
- Real browser rendering (catches visual regressions)
- Isolation (no backend required)
- Cypress debugging tools (time-travel, snapshots)

---

### E2E Tests (Slow, Expensive, Critical Paths Only)

**Philosophy:** Validate complete user journeys across the entire application stack. Reserve for critical paths that justify the cost.

**When to Use:**
- Authentication flows (login, logout, session timeout)
- Complete workflows spanning multiple pages
- Critical accessibility paths (keyboard navigation, screen reader)
- Integration with external systems (OAuth, file uploads)

**When NOT to Use:**
- Individual form field validation → Vitest unit tests
- API error state handling → RTK Query integration tests
- Component variants (collapsed/expanded) → Component tests
- Helper function calculations → Unit tests
- Permission checks → Backend authorization tests

**Example:**
```javascript
// frontend/cypress/e2e/agreementList.cy.js
describe("Agreement List", () => {
    beforeEach(() => {
        cy.FakeAuth("system-owner");
        cy.visit("/agreements");
    });

    it("should display agreements and allow filtering", () => {
        cy.get("[data-testid='agreement-list']").should("be.visible");
        cy.get("[data-testid='filter-fiscal-year']").select("2023");
        cy.get("[data-testid='agreement-row']").should("have.length.greaterThan", 0);
        cy.checkA11y();
    });
});
```

### Decision Matrix: Which Test Type Should I Use?

| Scenario | Test Type | Rationale |
|----------|-----------|-----------|
| Form field validation | Unit (Vest suite) | Pure validation logic, no side effects |
| API query parameters | Integration (RTK Query) | Tests API contract, MSW mocking |
| Component rendering | Unit (Vitest + RTL) | Fast, isolated, no backend |
| Multi-step wizard | Component (Cypress CT) | Complex UI state, needs real browser |
| Permission checks | Backend Unit | Authorization logic lives in backend |
| Complete user journey | E2E (Cypress) | Validates full stack integration |
| Helper calculations | Unit | Pure functions, fast execution |
| Redux state updates | Integration (hooks) | Tests state management logic |

### When NOT to Write Tests

Avoid testing these scenarios as they provide minimal value and increase maintenance burden:

- **Auto-generated code** - Migrations, OpenAPI specs, build artifacts
- **Framework internals** - Redux Toolkit's cache invalidation, SQLAlchemy's session management
- **Trivial getters/setters** - Simple property access with no logic
- **Third-party library behavior** - Test your usage of the library, not the library itself
- **Implementation details** - Private methods, internal state that could change during refactoring
- **Visual styling alone** - CSS-only changes without visual regression testing tools

**When in doubt:** If removing the test wouldn't reduce your confidence in the code, don't write it.

---

## BDD Testing Guidelines

### When to Write BDD Feature Tests

✅ **Good Candidates:**
- Agreement approval workflow (multi-stakeholder, multi-step)
- Budget allocation and reallocation (financial compliance)
- Procurement tracker (regulatory checkpoints)
- Can funding lifecycle (fiscal year rules, expiration)
- Change request approval chain (escalation rules)

❌ **Poor Candidates:**
- GET /api/v1/agreements (simple CRUD)
- Date formatting utilities
- Form field validation rules
- CSS styling and layout
- Error message text

### Feature File Structure

**Directory Organization:**
```
backend/ops_api/tests/ops/features/
├── api_version.feature
├── edit_agreement_metadata.feature
├── validate_procurement_tracker_steps.feature
└── portfolio/
    ├── calculate_portfolio_funding.feature
    └── research_projects/
        ├── calculate_number_of_agreements.feature
        └── list_research_projects_funding.feature
```

**Feature File Template:**
```gherkin
Feature: [Business Capability Name]
    As a [role]
    I want to [action]
    So that [business value]

Scenario: [Happy path description]
    Given [precondition]
    When [action]
    Then [expected outcome]
    And [additional validation]

Scenario: [Error case description]
    Given [precondition]
    When [action that triggers error]
    Then [error response]
```

### Step Definition Pattern

```python
# tests/ops/features/test_feature_name.py
import pytest
from pytest_bdd import given, scenario, then, when

@pytest.fixture(scope="function")
def context():
    """Shared context for BDD scenarios."""
    return {}

@scenario("feature_name.feature", "Scenario name")
def test_scenario_name():
    pass

@given("precondition", target_fixture="fixture_name")
def step_given(loaded_db, auth_client):
    # Setup code
    return fixture_value

@when("action", target_fixture="response")
def step_when(client, context):
    response = client.post("/api/v1/endpoint", json={...})
    context["response"] = response
    return response

@then("expected outcome")
def step_then(context):
    response = context["response"]
    assert response.status_code == 200
```

### Shared Step Definitions

Create reusable step definitions in `tests/ops/features/conftest.py`:

```python
# Common authentication steps
@given("I am logged in as a system owner")
def auth_system_owner(auth_client):
    return auth_client

@given("I am logged in as a basic user")
def auth_basic_user(basic_user_auth_client):
    return basic_user_auth_client

# Common assertion steps
@then("I should receive a successful response")
def assert_success(context):
    assert context["response"].status_code == 200

@then("I should receive an unauthorized response")
def assert_unauthorized(context):
    assert context["response"].status_code == 403
```

---

## Best Practices by Technology

### Backend (pytest + pytest-bdd)

#### Fixture Patterns

**Session-scoped fixtures** (expensive, shared across all tests):
```python
@pytest.fixture(scope="session")
def db_service(docker_ip, docker_services):
    """Spin up Docker Postgres container once per test session"""
    connection_string = f"postgresql://postgres:pwd@{docker_ip}:5432/postgres"
    engine = create_engine(connection_string)
    docker_services.wait_until_responsive(timeout=120.0, check=lambda: is_loaded(engine))
    return engine
```

**Function-scoped fixtures** (reset per test):
```python
@pytest.fixture()
def loaded_db(db_service):
    """Provide clean database session with test data"""
    session = Session(db_service)
    yield session
    session.rollback()  # Undo changes
    session.execute(text("DELETE FROM ops_db_history"))
    session.commit()
```

**Parameterized fixtures** (test multiple scenarios):
```python
@pytest.mark.parametrize("status", [
    BudgetLineItemStatus.IN_EXECUTION,
    BudgetLineItemStatus.OBLIGATED,
])
def test_bli_status_validation(status):
    bli = make_bli(status)
    with pytest.raises(ValidationError):
        validate_bli_editable(bli)
```

#### Auth Client Selection

Choose the appropriate auth client fixture based on test permissions:

| Fixture | User ID | Role | Use Case |
|---------|---------|------|----------|
| `auth_client` | 503 | SYSTEM_OWNER | Full permissions, default |
| `basic_user_auth_client` | 521 | BASIC_USER | Limited permissions |
| `division_director_auth_client` | 522 | DIVISION_DIRECTOR | Division-level permissions |
| `budget_team_auth_client` | 523 | BUDGET_TEAM | Budget-specific permissions |
| `no_perms_auth_client` | 506 | (none) | Permission denial tests |

```python
def test_endpoint_requires_permission(no_perms_auth_client):
    """Test that endpoint denies access for users without permission"""
    response = no_perms_auth_client.get("/api/v1/protected")
    assert response.status_code == 403
```

#### Database Test Isolation

**Always use rollback strategy:**
```python
def test_create_agreement(loaded_db):
    agreement = ContractAgreement(name="Test Agreement")
    loaded_db.add(agreement)
    loaded_db.commit()

    assert agreement.id is not None

    # Cleanup automatically handled by fixture rollback
```

**Manual cleanup for complex scenarios:**
```python
@pytest.fixture()
def agreement_with_blis(loaded_db):
    agreement = ContractAgreement(name="Test")
    bli = BudgetLineItem(agreement=agreement, amount=1000)
    loaded_db.add(agreement)
    loaded_db.commit()

    yield agreement

    # Explicit cleanup if needed
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()
```

#### Mocking Strategy

**Time-dependent code:**
```python
def test_can_expiration(loaded_db, mocker):
    """Test CAN expiration logic with mocked date"""
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2024, 8, 1)

    can = loaded_db.get(CAN, 500)
    assert can.is_expired is True
```

**External APIs:**
```python
def test_notification_service(mocker, loaded_db):
    """Test notification without calling external service"""
    mock_send = mocker.patch("ops.services.notifications.send_email")

    trigger_notification(event=OpsEvent(...))

    mock_send.assert_called_once()
    assert "subject" in mock_send.call_args[1]
```

#### ETL Testing Pattern

```python
def test_etl_pipeline(loaded_db):
    # 1. Parse CSV data
    test_data = list(csv.DictReader(open("test.tsv"), dialect="excel-tab"))
    parsed = [create_project_data(row) for row in test_data]

    # 2. Validate
    assert all(validate_data(p) for p in parsed)

    # 3. Create models
    sys_user = User(email="system@localhost")
    for data in parsed:
        create_models(data, sys_user, loaded_db)

    # 4. Verify
    project = loaded_db.get(Project, 1)
    assert project.title == "Expected Title"
```

#### Debugging Backend Tests

```bash
# Run single test with verbose output
pipenv run pytest tests/path/to/test.py::test_name -vv

# Add breakpoint in test
import pdb; pdb.set_trace()

# Print SQL queries
# In backend/ops_api/ops/default_settings.py, set SQLALCHEMY_ECHO = True

# Run with print statements visible
pipenv run pytest tests/path/to/test.py -s
```

---

### Frontend (Vitest + React Testing Library + MSW)

#### renderWithProviders Pattern

**Standard usage:**
```javascript
import { renderWithProviders } from "../../test-utils";

it("renders component with Redux state", () => {
    renderWithProviders(<MyComponent />, {
        preloadedState: {
            auth: { activeUser: { id: 1, name: "Test User" } },
            agreements: { list: [] }
        }
    });

    expect(screen.getByText("Test User")).toBeInTheDocument();
});
```

**Custom store:**
```javascript
const customStore = setupStore({
    auth: { activeUser: mockUser }
});

renderWithProviders(<MyComponent />, { store: customStore });
```

#### MSW Handler Patterns

**Default handlers** (in `src/tests/mocks.js`):
```javascript
export const handlers = [
    http.get("*/api/v1/agreements/", () => {
        return HttpResponse.json({
            data: mockAgreements,
            count: 10,
            limit: 10,
            offset: 0
        });
    })
];
```

**Test-specific override:**
```javascript
import { server } from "./tests/mocks";
import { http, HttpResponse } from "msw";

it("handles API error", async () => {
    server.use(
        http.get("*/api/v1/agreements/", () => {
            return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
    );

    renderWithProviders(<AgreementList />);
    await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
});
```

#### RTK Query Testing

**Test query parameters:**
```javascript
it("should construct query parameters correctly", async () => {
    let capturedUrl = "";

    server.use(
        http.get("*/api/v1/agreements/", ({ request }) => {
            capturedUrl = request.url;
            return HttpResponse.json({ data: [], count: 0 });
        })
    );

    const { store } = setupApiStore(opsApi);
    await store.dispatch(
        opsApi.endpoints.getAgreements.initiate({
            fiscal_year: 2023,
            limit: 10
        })
    );

    expect(capturedUrl).toContain("fiscal_year=2023");
    expect(capturedUrl).toContain("limit=10");
});
```

**Test transformResponse:**
```javascript
it("should transform API response correctly", async () => {
    server.use(
        http.get("*/api/v1/agreements/", () => {
            return HttpResponse.json({
                data: [{ id: 1, name: "Agreement 1" }],
                count: 1
            });
        })
    );

    const { store } = setupApiStore(opsApi);
    const result = await store.dispatch(
        opsApi.endpoints.getAgreements.initiate({})
    );

    expect(result.data).toEqual({
        agreements: [{ id: 1, name: "Agreement 1" }],
        count: 1,
        limit: 10,
        offset: 0
    });
});
```

#### Hook Testing

**Redux hooks:**
```javascript
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

function createWrapper(preloadedState = {}) {
    const store = setupStore(preloadedState);
    return function Wrapper({ children }) {
        return (
            <Provider store={store}>
                <MemoryRouter>{children}</MemoryRouter>
            </Provider>
        );
    };
}

it("returns true when user has role", () => {
    const { Wrapper } = createWrapper({
        auth: {
            activeUser: {
                roles: [{ name: "SUPER_USER", is_superuser: true }]
            }
        }
    });

    const { result } = renderHook(() => useIsUserSuperUser(), { wrapper: Wrapper });
    expect(result.current).toBe(true);
});
```

**Non-Redux hooks:**
```javascript
const TestComponent = ({ items, onHookResult }) => {
    const hookResult = useSortableData(items);
    onHookResult(hookResult);
    return null;
};

it("should sort items correctly", () => {
    let hookResult;
    render(
        <TestComponent
            items={[{ name: "B" }, { name: "A" }]}
            onHookResult={(result) => { hookResult = result; }}
        />
    );

    act(() => {
        hookResult.requestSort("name");
    });

    expect(hookResult.items[0].name).toBe("A");
});
```

#### Debugging Frontend Tests

```bash
# Run tests with UI debugger
bun run test:ui

# Run specific test file
bun run test src/path/to/test.js

# Add debug output in test
import { screen } from "@testing-library/react";
screen.debug();  // Prints current DOM state

# Check what's rendered
console.log(screen.getByRole('button', { name: /submit/i }));

# Use waitFor to see timing issues
await waitFor(() => {
    console.log('Waiting for element...');
    expect(screen.getByText('Expected')).toBeInTheDocument();
}, { timeout: 5000 });
```

#### Component Mocking

**When to mock:**
- Complex child components that slow tests
- Components with external dependencies (maps, charts)
- Third-party components with internal state

**When NOT to mock:**
- Simple presentational components
- Components critical to the behavior being tested

```javascript
// Mock a component
vi.mock("../../components/UI/ComplexChart", () => ({
    default: () => <div data-testid="mocked-chart">Chart</div>
}));

// Mock a hook
vi.mock("./MyComponent.hooks", () => ({
    useComponentData: vi.fn(() => ({
        data: mockData,
        isLoading: false
    }))
}));
```

---

### E2E (Cypress)

#### Custom Commands

**Authentication:**
```javascript
cy.FakeAuth("system-owner");  // Full permissions
cy.FakeAuth("basic-user");    // Limited permissions
cy.FakeAuth("division-director");  // Division-level access
```

**State Synchronization:**
```javascript
// Custom commands for framework-specific timing (see cypress/support/commands.js)
cy.waitForEditingState();
cy.waitForModalToAppear();
cy.selectAndWaitForChange("[data-testid='dropdown']", "option-value");
```

**Accessibility:**
```javascript
// Check entire page
cy.checkA11y();

// Check specific element
cy.checkA11y("[data-testid='modal']");

// Check with options
cy.checkA11y(null, {
    rules: {
        "color-contrast": { enabled: false }
    }
});
```

#### Page Object Pattern

**When to use:** Complex pages with repeated interactions.

```javascript
class AgreementPage {
    visit(id) {
        cy.visit(`/agreements/${id}`);
    }

    fillName(name) {
        cy.get("[data-testid='agreement-name']").clear().type(name);
    }

    selectProject(projectId) {
        cy.get("[data-testid='project-select']").select(projectId.toString());
    }

    save() {
        cy.get("[data-testid='save-button']").click();
    }
}

// In test
const agreementPage = new AgreementPage();
agreementPage.visit(1);
agreementPage.fillName("New Agreement Name");
agreementPage.save();
```

#### Data Management

**Test data isolation:**
```javascript
beforeEach(() => {
    // Use unique IDs or timestamps
    const testId = `test-${Date.now()}`;
    cy.FakeAuth("system-owner");
    cy.visit("/agreements/create");
    cy.get("[data-testid='agreement-name']").type(`Test Agreement ${testId}`);
});
```

**Cleanup:**
```javascript
afterEach(() => {
    // Delete test data if needed
    cy.request("DELETE", `/api/v1/agreements/${Cypress.env("testAgreementId")}`);
});
```

#### Flakiness Mitigation

**Proper waits:**
```javascript
// ✅ GOOD - automatic retry
cy.get("[data-testid='element']").should("be.visible");

// ❌ BAD - hard-coded wait
cy.wait(5000);
cy.get("[data-testid='element']");
```

**Idempotent setup:**
```javascript
beforeEach(() => {
    // Reset to known state
    cy.request("POST", "/api/v1/test/reset-database");
    cy.FakeAuth("system-owner");
});
```

#### Debugging E2E Tests

```bash
# Run tests in interactive mode
bun run test:e2e:interactive

# Run specific spec file
bun run test:e2e -- --spec cypress/e2e/agreementList.cy.js

# Add pause in test
cy.pause();  // Stops execution, allows manual inspection

# Check Cypress console for errors
# Click on command in Cypress UI to see before/after snapshots

# Debug API calls
cy.intercept('GET', '/api/v1/**').as('apiCall');
cy.wait('@apiCall').then((interception) => {
    console.log(interception.request);
    console.log(interception.response);
});
```

### Test Isolation Principles

**Backend:**
- Use `loaded_db` fixture with automatic rollback
- Never rely on test execution order
- Clean up state in `yield` fixtures
- Use transactions to prevent database pollution

**Frontend:**
- Mock external APIs with MSW
- Reset Redux store between tests (automatic via `setupTests.jsx`)
- Don't share mutable state across tests
- Clear localStorage/sessionStorage if tests modify it

**E2E:**
- Use unique test data IDs (timestamps, UUIDs)
- Reset database to known state in `beforeEach`
- Don't depend on data from previous tests
- Clean up created resources in `afterEach` when necessary

---

## CI/CD Testing Architecture

### Pipeline Flow

```
┌─────────────────────────────────────────────────────┐
│ Push to main / PR to main                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ├─► Secret Scanning (TruffleHog)
                   │
                   ├─► Unit Tests (Parallel)
                   │   ├─► Backend API (pytest)
                   │   ├─► Data Tools (pytest)
                   │   └─► Frontend (Vitest)
                   │
                   ├─► Linting & Formatting
                   │   ├─► Backend (flake8, black, isort)
                   │   └─► Frontend (ESLint, Prettier)
                   │
                   ├─► E2E Tests (Matrix Parallel)
                   │   ├─► Spec 1 (agreementList.cy.js)
                   │   ├─► Spec 2 (budgetLineItem.cy.js)
                   │   └─► ... (all specs in parallel)
                   │
                   ├─► A11y Regression Gate (priority specs)
                   │
                   └─► Security Scanning
                       ├─► CodeQL (JavaScript + Python)
                       └─► Semgrep (default rules)
```

### Parallel Execution Strategy

**Unit tests** (fastest feedback):
```yaml
# .github/workflows/unit_test_reusable.yml
jobs:
  backend-api:
    runs-on: ubuntu-latest
    steps:
      - run: cd backend/ops_api && pipenv run pytest

  backend-data-tools:
    runs-on: ubuntu-latest
    steps:
      - run: cd backend/data_tools && pipenv run pytest

  frontend:
    runs-on: ubuntu-latest
    steps:
      - run: cd frontend && bun run test --watch=false
```

**E2E tests** (matrix parallelization):
```yaml
# .github/workflows/e2e_test_reusable.yml
jobs:
  prepare-matrix:
    runs-on: ubuntu-latest
    outputs:
      specs: ${{ steps.list-specs.outputs.specs }}
    steps:
      - id: list-specs
        run: |
          SPECS=$(find frontend/cypress/e2e -name "*.cy.js" -printf "%P\n" | jq -R -s -c 'split("\n")[:-1]')
          echo "specs=$SPECS" >> $GITHUB_OUTPUT

  e2e:
    needs: prepare-matrix
    runs-on: ubuntu-latest
    strategy:
      matrix:
        spec: ${{ fromJson(needs.prepare-matrix.outputs.specs) }}
    steps:
      - run: docker compose up -d
      - run: cd frontend && bun run test:e2e:ci -- --spec "cypress/e2e/${{ matrix.spec }}"
```

### Pre-commit Hooks

**Installation:**
```bash
pre-commit install
pre-commit install --hook-type commit-msg
```

**Enforced checks** (`.pre-commit-config.yaml`):
- Detect AWS credentials and private keys
- Trailing whitespace cleanup
- End-of-file fixer
- JSON/YAML validation
- Large file detection
- Backend linting (flake8)
- Frontend linting (ESLint)
- Code formatting (Prettier, Black, isort)
- Commit message linting (commitlint)
- Secret scanning (TruffleHog)

**When to skip** (emergency hotfixes only):
```bash
git commit --no-verify -m "fix: emergency production fix"
```

### Test Environments

**Local development:**
```bash
docker compose up --build  # Full stack with hot reload
```

**CI environment:**
```bash
docker compose -f docker-compose.static.yml up  # Static builds for E2E
```

**Test database:**
- PostgreSQL 16 in Docker
- Initialized with schema from `backend/data_tools/ops_db_sql_init/`
- Seeded with test data via `import_test_data.sh`
- Alembic migrations applied automatically

---

## Resources and Examples

### Example Test Files

**Backend Unit Test:**
- `backend/ops_api/tests/ops/can/test_can.py` - Model properties, business logic
- `backend/ops_api/tests/utils.py` - Test utilities and helpers

**Backend Integration Test:**
- `backend/ops_api/tests/ops/services/test_agreements.py` - Service layer with database
- `backend/ops_api/tests/ops/messagebus/test_message_bus.py` - Event pub/sub

**Backend BDD Test:**
- `backend/ops_api/tests/ops/features/api_version.feature` - Gherkin feature
- `backend/ops_api/tests/ops/features/test_api_version.py` - Step definitions

**Frontend Unit Test:**
- `frontend/src/helpers/agreement.helpers.test.js` - Pure functions
- `frontend/src/hooks/useSortableData.test.js` - Custom hooks

**Frontend Integration Test:**
- `frontend/src/api/opsAPI.test.js` - RTK Query endpoints (1042 lines)
- `frontend/src/hooks/user.hooks.test.js` - Redux hooks with state

**E2E Test:**
- `frontend/cypress/e2e/agreementList.cy.js` - List and filtering
- `frontend/cypress/e2e/auth.cy.js` - Authentication flows

### Documentation References

**ADRs:**
- [ADR 014: Use Cypress for Testing](adr/014-use-cypress-for-testing.md)
- [ADR 015: Accessibility Testing](adr/015-a11y-testing.md)

**CLAUDE.md Files:**
- [Backend CLAUDE.md](../backend/ops_api/CLAUDE.md) - pytest patterns, fixtures, MessageBus
- [Frontend CLAUDE.md](../frontend/CLAUDE.md) - Vitest, MSW, RTK Query, Vest validation
- [Root CLAUDE.md](../CLAUDE.md) - Docker, CI/CD, commit conventions

**CI/CD:**
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/e2e_test_reusable.yml` - E2E matrix execution
- `.github/workflows/unit_test_reusable.yml` - Unit test execution
- `.github/scripts/detect-flaky-tests.sh` - Flaky test detection

### External Resources

**Testing Philosophy:**
- [Test Pyramid - Martin Fowler](https://martinfowler.com/articles/practical-test-pyramid.html)
- [Testing Trophy - Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

**BDD:**
- [Cucumber Best Practices](https://cucumber.io/docs/bdd/)
- [pytest-bdd Documentation](https://pytest-bdd.readthedocs.io/)

**Frontend Testing:**
- [React Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Vitest Documentation](https://vitest.dev/)
- [MSW Documentation](https://mswjs.io/)

**E2E Testing:**
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Component Testing](https://docs.cypress.io/guides/component-testing/overview)

---

## Appendix: Test Commands Reference

### Backend

```bash
cd backend/ops_api

# Run all tests
pipenv run pytest

# Run specific file
pipenv run pytest tests/ops/resources/test_agreements.py

# Run specific test
pipenv run pytest tests/ops/resources/test_agreements.py::test_get_agreement_by_id

# Run with coverage
pipenv run pytest --cov

# Run BDD tests only
pipenv run pytest tests/ops/features/

# Linting
pipenv run nox -s lint

# Formatting
pipenv run nox -s black
```

### Frontend

```bash
cd frontend

# Run all tests (watch mode)
bun run test

# Run tests once
bun run test --watch=false

# Run with coverage
bun run test:coverage --watch=false

# Run specific file
bun run test src/helpers/agreement.helpers.test.js

# Test UI
bun run test:ui

# Linting
bun run lint
bun run lint --fix

# Formatting
bun run format
```

### E2E

```bash
cd frontend

# Headless E2E tests
bun run test:e2e

# Interactive E2E tests
bun run test:e2e:interactive

# CI configuration
bun run test:e2e:ci

# Specific spec
bun run test:e2e -- --spec cypress/e2e/agreementList.cy.js
```

### Full Stack

```bash
# Start full stack for E2E tests
docker compose up --build

# Start in detached mode
docker compose up --build -d

# Clean state (between full test runs)
docker system prune --volumes

# Database only
docker compose up db data-import --build
```
