---
issue: 3801
branch: OPS-3801/bli-list-a11y-cypress
---

# a11y on BLI list cypress tests

## Goal

Fix the accessibility violations surfaced by the Cypress axe check (`cy.checkA11y`) in `budgetLineItemsList.cy.js` so the Budget Lines list page — filter panel, table, pagination, and summary cards — passes a11y testing cleanly.

## Acceptance Criteria

- [x] Identify the problem(s)
- [x] Fix it
- [x] Repeat until all problems are fixed and a11y testing is passing successfully

## Technical Details

### Approach

Run the existing `afterEach(() => { cy.injectAxe(); cy.checkA11y(null, null, terminalLog); })` hook against each test's rendered state, see what axe violations surface, then fix the underlying component markup (missing labels, color contrast, aria attributes, etc.) one by one. Track identified violations as a short list (rule ID + component) before marking "Fix it," so "Identify the problem(s)" has a checkable deliverable rather than just a re-run of axe.

### Key Files

- `frontend/cypress/e2e/budgetLineItemsList.cy.js`
- `frontend/src/pages/budgetLines/list/BudgetLineItemList.jsx`
- `frontend/src/pages/budgetLines/list/BLIFilterButton.jsx`
- `frontend/src/pages/budgetLines/list/BLIFilterTags.jsx`
- `frontend/src/pages/budgetLines/list/BLITabs.jsx`
- `frontend/src/components/BudgetLineItems/AllBudgetLinesTable/AllBudgetLinesTable.jsx`
- `frontend/src/components/BudgetLineItems/AllBudgetLinesTable/AllBLIRow.jsx`
- `frontend/src/components/BudgetLineItems/SummaryCardsSection/SummaryCardsSection.jsx`
- `frontend/src/components/BudgetLineItems/BLIStatusSummaryCard/BLIStatusSummaryCard.jsx`
- `frontend/src/components/BudgetLineItems/BudgetLinesTotalSummaryCard/BudgetLinesTotalSummaryCard.jsx`
- `frontend/src/components/UI/FilterButton/FilterButton.jsx` (react-modal filter dialog)
- `frontend/src/components/UI/Table/Table.jsx`
- `frontend/src/components/UI/PaginationNav/PaginationNav.jsx`
- `frontend/src/components/UI/BudgetRangeSlider/BudgetRangeSlider.jsx` — known orphaned `<label htmlFor="budget-range-slider">`, no matching `id` in the tree
- `frontend/src/components/UI/DoubleRangeSlider/DoubleRangeSlider.jsx` — thumbs lack `aria-label`/`ariaValuetext` distinguishing min vs max (likely needs a `react-slider` prop fix, not markup)
- `frontend/src/components/UI/Form/FiscalYearComboBox/FiscalYearComboBox.jsx`
- `frontend/src/components/Portfolios/PortfoliosComboBox/PortfoliosComboBox.jsx`
- `frontend/src/components/Agreements/AgreementTypeComboBox/AgreementTypeComboBox.jsx`
- `frontend/src/components/Agreements/AgreementNameComboBox/AgreementNameComboBox.jsx`
- `frontend/src/components/CANs/CANActivePeriodComboBox/CANActivePeriodComboBox.jsx`
- `frontend/src/components/BudgetLineItems/BLIStatusComboBox/BLIStatusComboBox.jsx`
- `frontend/src/components/Agreements/DivisionStaffingComboBox/DivisionStaffingComboBox.jsx`
- `frontend/src/components/UI/FilterTags/FilterTags.jsx` and `FilterTagsWrapper.jsx`
- `frontend/src/components/UI/Modals/ConfirmationModal.jsx`

### Testing Strategy

Rely on the existing Cypress `cy.checkA11y` afterEach hook in the spec as the pass/fail gate. Validated against this project's own ADR 015 and `docs/TESTING.md`'s decision matrix, which designate E2E axe checks (not unit/component-level jest-axe) as the chosen a11y testing mechanism for this app — no new tests needed.

### Constraints

`cy.checkA11y` runs once per test, against whatever DOM state that test ends on. No current test leaves the filter modal open, mid-drag on the range slider, or in another mid-interaction state — so violations isolated to those states could go undetected by this story's fixes. This is a known limitation, not an added AC item; mid-interaction coverage is out of scope here.

## Resolution

Fast-forwarding the branch onto latest `main` picked up ~20 unrelated commits of accessibility work (Division & Staffing filter, `FilterResultsAnnouncer`, dashboard filter labeling). Running the spec headless against that baseline: **8 passing, 0 failing** — `cy.checkA11y` was already clean on every state the spec exercises.

Because `checkA11y` only runs once per test against the end-state DOM, the filter modal (and its comboboxes/slider) is always closed by the time the check runs — a real coverage gap (see Constraints). To verify those untested states without expanding the committed test suite, ran a live axe-core scan via Playwright with the filter modal open, the Division & Staffing combobox menu open, and the default closed state. **Zero violations in all three.**

One genuine defect was found by manual code inspection that axe's automated rules don't catch (`aria-input-field-name` evaluates as inapplicable to these elements): `BudgetRangeSlider.jsx`'s `<label htmlFor="budget-range-slider">` pointed at an `id` that doesn't exist anywhere in the tree, and its two `react-slider` thumbs had no accessible name distinguishing min from max. Fixed in [`BudgetRangeSlider.jsx`](../../src/components/UI/BudgetRangeSlider/BudgetRangeSlider.jsx) and [`DoubleRangeSlider.jsx`](../../src/components/UI/DoubleRangeSlider/DoubleRangeSlider.jsx) (shared by the BLI, CAN, and Portfolio filter panels) by replacing the orphaned label with a plain legend-style span and adding an `ariaLabel` prop passthrough to `react-slider`, giving each thumb a distinct name (e.g. "Budget Line Total minimum"/"maximum"). Added a unit test for the new prop; verified no visual regression via screenshot and confirmed zero axe violations post-fix.

Full frontend suite: 5313 tests passing, 0 failures. `budgetLineItemsList.cy.js`: 8 passing, 0 failing (unchanged — confirms no regression).
