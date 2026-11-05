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
- `frontend/src/components/UI/BudgetRangeSlider/BudgetRangeSlider.jsx` — fixed: orphaned `<label htmlFor="budget-range-slider">`
- `frontend/src/components/UI/DoubleRangeSlider/DoubleRangeSlider.jsx` — fixed: thumbs lacked distinguishing `aria-label`
- `frontend/src/components/UI/Form/ComboBox/ComboBox.hooks.js` — fixed: shared `noOptionsMessage` color failed WCAG AA contrast
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

Initially planned to rely solely on the existing `cy.checkA11y` afterEach hook (validated against ADR 015 and `docs/TESTING.md`'s decision matrix). Revised after a real violation was found hiding in a state the afterEach-only check couldn't see (see Resolution): added `cy.injectAxe(); cy.checkA11y(...)` calls directly in `budgetLineItemsList.cy.js` at two additional checkpoints — right after the filter modal opens, and right after the Division & Staffing combobox menu opens — mirroring the existing in-test-checkpoint pattern already used in `headerSearch.cy.js`. These are now permanent regression checks, not just one-off manual verification.

### Constraints

Still not covered by an explicit checkpoint, acknowledged as residual gaps rather than new AC items: the exact mid-drag instant of the budget range slider (checked immediately after, not during), the zero-results filtered state, and the export-loading spinner state.

## Resolution

Fast-forwarding the branch onto latest `main` picked up ~20 unrelated commits of accessibility work (Division & Staffing filter, `FilterResultsAnnouncer`, dashboard filter labeling). Running the spec headless against that baseline: **8 passing, 0 failing** — `cy.checkA11y` was already clean on every state the spec exercises.

Because `checkA11y` only ran once per test against the end-state DOM, the filter modal (and its comboboxes/slider) was always closed by the time the check ran — a real coverage gap. Added two new in-test checkpoints to close it (see Testing Strategy). The second one — checking right after the Division & Staffing combobox menu opens — immediately caught a real, previously-invisible violation: **`color-contrast` (serious)** on `.division-staffing-combobox__menu-notice--no-options`, react-select's default "No options" text (`#999999` on white, 2.84:1 contrast, needs 4.5:1). It only appears for the instant between the filter panel opening and `filterOptions` finishing its fetch — exactly the kind of state the old afterEach-only check could never reach, and flaky to catch even with the new checkpoint (Cypress's retry sometimes outran the race). Reproduced deterministically via a throttled-network Playwright repro to confirm root cause before fixing.

Fixed by adding a `noOptionsMessage` entry to the shared `customStyles` object in [`ComboBox.hooks.js`](../../src/components/UI/Form/ComboBox/ComboBox.hooks.js), matching the existing `placeholder` color (`#565C65`, already WCAG-AA compliant) — this is the one `useComboBox` hook shared by every ComboBox in the app, so the fix applies everywhere a "No options" state can flash, not just Budget Lines. Re-verified with the throttled-network repro: zero violations. Ran the full spec 3x back-to-back with no retries/violations.

Also found and fixed, by manual code inspection, one more defect axe's automated rules don't catch (`aria-input-field-name` evaluates as inapplicable to these elements): `BudgetRangeSlider.jsx`'s `<label htmlFor="budget-range-slider">` pointed at an `id` that doesn't exist anywhere in the tree, and its two `react-slider` thumbs had no accessible name distinguishing min from max. Fixed in [`BudgetRangeSlider.jsx`](../../src/components/UI/BudgetRangeSlider/BudgetRangeSlider.jsx) and [`DoubleRangeSlider.jsx`](../../src/components/UI/DoubleRangeSlider/DoubleRangeSlider.jsx) (shared by the BLI, CAN, and Portfolio filter panels) by replacing the orphaned label with a plain legend-style span and adding an `ariaLabel` prop passthrough to `react-slider`, giving each thumb a distinct name (e.g. "Budget Line Total minimum"/"maximum"). Added a unit test for the new prop; verified no visual regression via screenshot and confirmed zero axe violations post-fix.

Full frontend suite: 5313 tests passing, 0 failures. `budgetLineItemsList.cy.js`: 8 passing, 0 failing, run 3x with no flakiness.
