# Testing Assessment & Roadmap

**Last Updated:** 2026-04-28
**Next Review:** 2026-07-28 (Quarterly)
**Status:** Active
**Audience:** Dev team - for planning and tracking testing improvements
**Related:** See [TESTING.md](TESTING.md) for testing strategy and best practices

**Note:** Sprint = 2 weeks throughout this document

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Strengths](#strengths)
4. [Areas for Improvement](#areas-for-improvement)
5. [Technical Debt](#technical-debt)
6. [Migration Guide](#migration-guide)
7. [Roadmap](#roadmap)
8. [Success Metrics](#success-metrics)

---

## Executive Summary

### Current Snapshot

| Metric | Backend | Frontend | E2E |
|--------|---------|----------|-----|
| **Framework** | pytest + pytest-bdd | Vitest + RTL | Cypress |
| **Test Files** | 122+ | 277 | 46 specs |
| **Coverage** | Tracked via pytest-cov | 90% required | N/A |
| **CI Execution** | ~5-10 min | ~5-10 min | ~20-30 min (parallel) |
| **Flaky Test Rate** | Low | Low | ~10-15% (requires 3 retries) |

### Top 5 Priorities

1. **Reduce E2E test count from 46 → 15-20** by migrating appropriate tests down the pyramid
2. **Address flaky E2E tests** (currently requiring 3 retries in CI)
3. **Expand BDD coverage** from ~10 features to 15-20 critical business scenarios
4. **Standardize test patterns** across frontend and backend with documented examples
5. **Introduce Cypress component testing** for complex UI components

---

## Current State

### Test Distribution

```
E2E Tests: 46 specs
├─ Authentication: 3 specs
├─ Agreements: 12 specs
├─ Budget Line Items: 8 specs
├─ CANs: 6 specs
├─ Change Requests: 4 specs
├─ Procurement Tracker: 5 specs
├─ Reporting: 3 specs
└─ Other: 5 specs

Integration Tests: ~150 files
├─ Backend Services: ~30 files
├─ Backend API Resources: ~50 files
├─ Frontend RTK Query: ~20 files
├─ Frontend Redux Hooks: ~30 files
└─ Frontend Components: ~20 files

Unit Tests: ~250 files
├─ Backend Models: ~40 files
├─ Backend Utils: ~30 files
├─ Frontend Helpers: ~60 files
├─ Frontend Hooks: ~40 files
└─ Frontend Components: ~80 files

BDD Tests: ~10 feature files
├─ API Version: 1 feature
├─ Agreement Editing: 3 features
├─ Budget Line Items: 2 features
├─ Procurement Tracker: 1 feature
└─ Portfolio Calculations: 3 features
```

### CI/CD Pipeline Performance

**Total CI Duration:** ~45-60 minutes (with E2E parallelization)

| Stage | Duration | Status |
|-------|----------|--------|
| Secret Scanning | ~2 min | ✅ Reliable |
| Backend Unit Tests | ~8 min | ✅ Reliable |
| Frontend Unit Tests | ~6 min | ✅ Reliable |
| Linting | ~3 min | ✅ Reliable |
| E2E Tests (Parallel) | ~25 min | ⚠️ Flaky (3 retries) |
| A11y Regression | ~8 min | ✅ Reliable |
| Security Scanning | ~10 min | ✅ Reliable |

**Bottleneck:** E2E test suite accounts for ~55% of total CI time and has highest flakiness rate.

---

## Strengths

### ✅ Comprehensive Fixture System

**What:** Backend provides role-based auth clients for testing permission scenarios.

**Available Fixtures:**
- `auth_client` (SYSTEM_OWNER - full permissions)
- `basic_user_auth_client` (limited permissions)
- `division_director_auth_client` (division-level access)
- `budget_team_auth_client` (budget-specific permissions)
- `procurement_team_auth_client` (procurement workflows)
- `power_user_auth_client` (elevated permissions)
- `no_perms_auth_client` (permission denial tests)

**Benefit:** No repetitive setup code for auth scenarios, easy to test RBAC.

---

### ✅ MSW Integration

**What:** Frontend uses Mock Service Worker for API mocking in tests.

**Location:** `frontend/src/tests/mocks.js` (default handlers)

**Capabilities:**
- Intercept HTTP requests in tests
- Mock API responses without backend
- Override handlers per-test
- Query parameter validation
- Error scenario testing

**Benefit:** Fast, isolated frontend tests with realistic HTTP mocking.

---

### ✅ Automatic Database History Tracking

**What:** All SQLAlchemy models automatically track changes via event listeners.

**Tracked Events:**
- NEW (insert)
- UPDATED (update)
- DELETED (delete)
- ERROR (constraint violations)

**Benefit:** Audit trails without manual instrumentation, comprehensive history for compliance.

---

### ✅ BDD for Stakeholder Communication

**What:** pytest-bdd with Gherkin provides readable acceptance criteria.

**Current Features:** ~10 feature files covering API endpoints, agreement editing, budget validation, portfolio calculations.

**Benefit:** Non-technical stakeholders can review and validate business logic.

---

### ✅ Accessibility Testing Integrated

**What:** All E2E tests include inline `cy.checkA11y()` calls.

**Tool:** cypress-axe (aXe-core integration)

**Coverage:** Every view tested for accessibility violations.

**Benefit:** Accessibility regression detection as part of normal development workflow.

---

### ✅ Parallel CI Execution

**What:** GitHub Actions runs E2E tests in parallel matrix jobs (one per spec file).

**Implementation:** Dynamic matrix generation from `cypress/e2e/*.cy.js` files.

**Benefit:** E2E tests that would take ~2 hours serially now complete in ~25 minutes.

---

### ✅ Flaky Test Detection

**What:** Automated flaky test detection captures tests that fail then pass on retry.

**Location:** `.github/scripts/detect-flaky-tests.sh`

**Output:** GitHub Actions job summary with flaky test list.

**Benefit:** Visibility into unreliable tests without manual log analysis.

---

## Areas for Improvement

### ⚠️ E2E Test Overuse

**Current State:** 46 Cypress specs test scenarios that could be covered by faster unit or integration tests.

**Impact:**
- Increases CI time (~25 min for E2E vs ~6 min for frontend unit tests)
- Higher flakiness rate (~10-15% vs <1% for unit tests)
- Slower local development feedback
- Harder to debug failures (full stack vs isolated component)

**Examples of Overuse:**
- Form field validation (should be Vest suite unit tests)
- Helper function calculations (should be pure function unit tests)
- API query parameter construction (should be RTK Query integration tests)
- Permission checks (should be backend authorization tests)

**Target:** Reduce to 15-20 critical user journeys.

---

### ⚠️ Flaky Tests Requiring Retries

**Current State:** CI configured with 3 retries for React 19 compatibility.

**Flakiness Sources:**
- React 19 timing issues (state updates, re-renders)
- Network timing variability
- Test data race conditions
- Hard-coded waits vs proper assertions

**Impact:**
- Retries mask root causes
- False confidence in test stability
- Slower CI (each retry adds ~5-10 min)
- Developer frustration

**Mitigation Strategies:**
- Custom Cypress commands (`cy.waitForEditingState()`, `cy.waitForModalToAppear()`)
- Proper `cy.should()` assertions with automatic retry
- Idempotent test setup
- Fix root causes vs adding more retries

**Target:** Reduce retry count from 3 → 2 → 1, achieve <5% flaky test rate.

---

### ⚠️ Potential Test Duplication

**Current State:** Some scenarios tested at multiple layers without clear rationale.

**Examples:**
- Agreement filtering tested in E2E + RTK Query integration + component test
- Budget calculations tested in E2E + helper unit test + service test
- Permission checks tested in E2E + backend auth test

**Impact:**
- Increased maintenance burden (3 tests to update for one change)
- Slower test suites
- Confusion about "source of truth" test

**Recommendation:** Document "primary test location" for each scenario, keep redundant tests only if they validate different aspects.

---

### ⚠️ Inconsistent Test Patterns

**Current State:** Mix of testing approaches across files without clear conventions.

**Examples:**
- Some tests use page objects, others use direct selectors
- Inconsistent mock strategies (some mock components, others don't)
- Mix of `cy.wait()` hard-coded waits vs proper assertions
- Varying levels of test isolation (some clean up, some don't)

**Impact:**
- Harder for new developers to write tests
- Inconsistent test quality
- Difficult to enforce standards in code review

**Recommendation:** Document patterns in TESTING.md (completed), enforce in code review, refactor high-visibility tests as examples.

---

## Technical Debt

### 🔴 BDD Coverage Gaps

**Current State:** Only ~10 feature files vs 122+ backend test files.

**Missing BDD Coverage:**
- Complete agreement lifecycle (creation → execution → closeout)
- Budget allocation and transfer workflows
- Change request approval chains
- Procurement tracker multi-step workflows
- CAN funding and fiscal year transitions
- User role and permission management
- Document upload and approval workflow

**Impact:**
- Business stakeholders can't validate critical workflows via readable scenarios
- Complex business logic hidden in pytest unit tests
- Regulatory compliance harder to demonstrate

**Target:** 15-20 feature files covering high-value business scenarios.

---

### 🔴 React 19 Timing Workarounds

**Current State:** Custom Cypress commands work around React 19 timing issues.

**Workaround Commands:**
- `cy.waitForEditingState()` - Wait for React state updates
- `cy.waitForModalToAppear()` - Wait for modal rendering
- `cy.selectAndWaitForChange()` - Select dropdown and wait for state change

**Root Cause:** React 19 concurrent rendering changes timing of state updates and re-renders.

**Impact:**
- Workarounds mask timing issues
- Commands may not work for all scenarios
- Technical debt that may break with React 20+

**Recommendation:**
1. Investigate if React 19 concurrent features can be configured differently
2. Use proper `cy.should()` assertions with automatic retry
3. Consider if components can be refactored to be more testable
4. Document expected React 19 behavior in component tests

---

### 🔴 E2E Tests That Should Be Unit/Integration Tests

**High-Priority Candidates for Migration:**

| E2E Test | Should Be | Benefit |
|----------|-----------|---------|
| Agreement list filtering by fiscal year | RTK Query integration test | 100x faster, no browser |
| Budget line item fee calculation | Helper function unit test | 1000x faster, easier edge cases |
| Form field validation (required fields) | Vest suite unit test | Instant feedback, no DOM |
| API error state rendering | Component test with MSW | Fast, isolated, no backend |
| User permission checks (button disabled) | Backend auth test | Tests at source, no frontend |
| CAN expiration date logic | Model property unit test | Fast, pure logic test |
| Procurement tracker step validation | Backend BDD test | Stakeholder-readable, no browser |

**Impact of Migration:**
- CI time: ~25 min → ~10 min (15 min savings)
- Flaky test rate: ~10-15% → <5%
- Local test execution: ~5 min → ~30 sec
- Developer experience: Instant feedback vs waiting for browser

---

## Migration Guide

### Phase 1: Low-Hanging Fruit (Sprint 1-2)

**Target:** Migrate 10 E2E tests to unit/integration tests

**Candidates:**
1. Form field validation → Vest suite unit tests
2. Helper calculations → Pure function unit tests
3. API query parameters → RTK Query integration tests
4. Permission checks → Backend authorization tests
5. Model property logic → Backend unit tests

**Example Migration:**

**Before (E2E):**
```javascript
// cypress/e2e/budgetLineItem.cy.js
it("calculates procurement fee correctly", () => {
    cy.visit("/agreements/1/edit");
    cy.get("#fee-percentage").clear().type("5.0");
    cy.get("#bli-amount").clear().type("1000");
    cy.get("[data-testid='total-with-fee']").should("contain", "1050");
});
```

**After (Unit Test):**
```javascript
// src/helpers/agreement.helpers.test.js
describe("calculateTotal", () => {
    it("applies fee percentage correctly", () => {
        const budgetLines = [{ amount: 1000, status: "PLANNED" }];
        const total = calculateTotal(budgetLines, 5.0); // 5% fee
        expect(total).toBe(1050);
    });

    it("excludes DRAFT lines", () => {
        const budgetLines = [
            { amount: 1000, status: "PLANNED" },
            { amount: 500, status: "DRAFT" }
        ];
        const total = calculateTotal(budgetLines, 5.0);
        expect(total).toBe(1050); // 1000 * 1.05, DRAFT excluded
    });
});
```

**Benefit:** Test runs in <1ms vs ~5 seconds, easier to add edge cases.

---

### Phase 2: Component Tests (Sprint 3-4)

**Target:** Set up Cypress component testing, migrate 5 complex components

**Setup:**
1. Install `@cypress/react` and configure component test runner
2. Create first component test as example
3. Document component testing patterns in TESTING.md
4. Migrate 5 complex components from E2E

**Candidates:**
- `AgreementProcurementTracker.jsx` - 4-step wizard
- `CANFundingCard` - interactive budget allocation
- `ChangeRequestAccordion` - collapsible sections
- `BudgetLineItemForm` - multi-field validation
- `DocumentUploadModal` - file upload + validation

---

### Phase 3: Backend BDD Expansion (Sprint 5-6)

**Target:** Add 5-10 new BDD feature files for critical business workflows

**Candidates:**
1. Agreement approval workflow
2. Budget allocation and transfer
3. Procurement tracker step-by-step
4. Change request escalation
5. CAN funding lifecycle
6. Document approval workflow
7. User role changes

**Process:**
1. Identify business scenario with stakeholder
2. Write Gherkin feature file collaboratively
3. Implement step definitions
4. Remove overlapping E2E test if exists

---

### Phase 4: Final E2E Reduction (Sprint 7-10)

**Target:** Reduce E2E suite to 15-20 critical journeys

**Keep These E2E Tests:**
- Authentication flows (login, logout, session timeout)
- Agreement create → execute → closeout (full workflow)
- Budget allocation complete workflow
- Procurement tracker end-to-end
- Change request submission → approval
- CAN funding and fiscal transitions
- Document upload and approval
- User role changes and permissions
- Accessibility keyboard navigation (3-5 critical paths)
- Multi-page wizard workflows

**Delete These E2E Tests** (after migrating to unit/integration/BDD):
- Individual form validation scenarios
- API error state rendering
- Helper calculation edge cases
- Single-page filtering and sorting
- Component UI states (collapsed/expanded)
- Permission button visibility checks

---

## Roadmap

### Immediate Actions (Sprints 1-2)

**Week 1-2: E2E Test Audit**
*Owner: QA + Frontend Lead*
- [ ] Create spreadsheet categorizing all 46 E2E specs (columns: Spec, Category, Keep/Migrate Decision, Priority, Flaky?)
- [ ] Label each: Keep, Convert to Integration, Convert to Unit, Convert to Component, Convert to BDD
- [ ] Identify top 10 flakiest tests from CI logs (`.github/scripts/detect-flaky-tests.sh` output)
- [ ] Document overlap with existing unit/integration tests
- [ ] Review audit results in team meeting

**Week 3-4: Migration Sprint 1**
*Owner: Frontend Team*
- [ ] Migrate 5 form validation E2E tests → Vest unit tests (pick simplest first)
- [ ] Migrate 3 calculation E2E tests → Helper unit tests
- [ ] Migrate 2 permission E2E tests → Backend auth tests
- [ ] Delete original E2E tests after verification (run both old and new in parallel first)
- [ ] Measure CI time reduction (before/after comparison)

**Week 5-6: BDD Feature Inventory**
*Owner: Backend Lead + PM*
- [ ] List all critical business scenarios (target 15-20) via stakeholder workshop
- [ ] Identify gaps in current 10 feature files
- [ ] Prioritize 3-5 high-value features for next sprint based on regulatory requirements
- [ ] Draft Gherkin scenarios for top 3 priorities

**Week 7-8: Fix Flakiest Tests**
*Owner: QA + Frontend Engineers*
- [ ] Analyze top 10 flaky tests (timing issues, race conditions, test data problems?)
- [ ] Fix root causes OR convert to unit/integration if E2E not needed
- [ ] Reduce CI retry count from 3 → 2 after fixes
- [ ] Add React 19 timing patterns to TESTING_ASSESSMENT.md technical debt section

---

### Short-term (Months 2-3)

**Month 2: E2E Migration + Component Testing**
*Owner: Frontend Team*
- [ ] Migrate 10 more E2E tests to appropriate layers (continue work from Sprint 1)
- [ ] Set up Cypress component test runner (install `@cypress/react`, configure)
- [ ] Create 3 component test examples (start with `AgreementProcurementTracker`, `CANFundingCard`, `BudgetLineItemForm`)
- [ ] Document component testing patterns in TESTING.md

**Month 3: BDD Expansion**
*Owner: Backend Team + PM*
- [ ] Add 5 new BDD feature files (from prioritized list)
- [ ] Refactor existing BDD tests for consistency (shared step definitions)
- [ ] Create shared step definition library in `tests/ops/features/conftest.py`
- [ ] Train team on BDD best practices (lunch & learn session)

**Ongoing:**
*Owner: Tech Leads*
- [ ] Establish E2E test acceptance criteria (when to add new E2E) - add to PR template
- [ ] Require approval for new E2E tests in PR reviews (CODEOWNERS rule)
- [ ] Enforce "unit/integration test first" policy in code review

---

### Long-term (Months 4-6)

**Month 4: Final E2E Reduction**
*Owner: QA + Frontend Lead*
- [ ] Reduce E2E suite to 15-20 specs (final push, migrate remaining convertible tests)
- [ ] Delete redundant E2E tests (after parallel verification period)
- [ ] Achieve <5% flaky test rate (measure over 2-week period)
- [ ] Reduce CI E2E time to ~10 min (measure average across 50 runs)

**Month 5: Advanced Testing**
*Owner: Tech Leads*
- [ ] Evaluate visual regression tools (Percy, Chromatic, Playwright) - spike week
- [ ] Add visual tests for component library (if tool selected)
- [ ] Establish performance testing baseline (Locust/K6) for critical API endpoints

**Month 6: Stabilization**
*Owner: Entire Team*
- [ ] Review and update TESTING.md and TESTING_ASSESSMENT.md (retrospective)
- [ ] Conduct developer satisfaction survey (Google Form, 10 questions)
- [ ] Document lessons learned (what worked, what didn't, what to do differently)
- [ ] Plan next iteration (review metrics, set new goals for next 6 months)

---

## Success Metrics

### Quantitative Metrics

| Metric | Baseline (Apr 2026) | 3 Months (Jul 2026) | 6 Months (Oct 2026) |
|--------|---------------------|---------------------|---------------------|
| **E2E Test Count** | 46 | 30 | 15-20 |
| **CI E2E Duration** | ~25 min | ~15 min | ~10 min |
| **Total CI Duration** | ~50 min | ~35 min | ~25 min |
| **Flaky Test Rate** | ~10-15% | ~7% | <5% |
| **E2E Retry Count** | 3 | 2 | 1 |
| **BDD Feature Count** | 10 | 15 | 20 |
| **Unit Test Count (files)** | 399 | 450 | 500 |
| **Component Test Count** | 0 | 5 | 15 |

**Note:** Unit Test Count represents test files, not individual test cases. Expected increase due to E2E migration creating new unit/integration test files.

### Qualitative Metrics

**Measured via quarterly developer survey (Google Form):**

**Developer Experience:**
- Faster local test execution (rate 1-5)
- Clearer test failure messages (rate 1-5)
- Easier to write new tests (rate 1-5)
- Less time waiting for CI (rate 1-5)

**Confidence:**
- Fewer bugs reaching production (observed via production incidents log)
- Faster root cause identification (average time to diagnose test failure)
- Better coverage of edge cases (subjective, rate 1-5)
- Stakeholder trust in test suite (PM feedback)

**Maintenance:**
- Consistent test patterns (rate 1-5)
- Clear documentation (rate 1-5)
- Less flakiness investigation time (tracked via Jira time logs)
- Easier onboarding for new developers (onboarding feedback)

---

## Review Process

**Quarterly Review (Every 3 months):**
1. Update metrics table with current values
2. Review roadmap progress
3. Adjust priorities based on team feedback
4. Update "Last Updated" date
5. Schedule next review

**Stakeholders:**
- Engineering team (execution)
- QA team (testing strategy)
- Product team (business scenario coverage)
- Leadership (budget/timeline approval)

---

**Next Review Date:** 2026-07-28
