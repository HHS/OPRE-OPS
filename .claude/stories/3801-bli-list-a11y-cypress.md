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

Also found and fixed, by manual code inspection, one more defect axe's automated rules don't catch (`aria-input-field-name` evaluates as inapplicable to these elements): `BudgetRangeSlider.jsx`'s `<label htmlFor="budget-range-slider">` pointed at an `id` that doesn't exist anywhere in the tree, and its two `react-slider` thumbs had no accessible name distinguishing min from max. Fixed in [`BudgetRangeSlider.jsx`](../../src/components/UI/BudgetRangeSlider/BudgetRangeSlider.jsx) and [`DoubleRangeSlider.jsx`](../../src/components/UI/DoubleRangeSlider/DoubleRangeSlider.jsx) (the latter shared by the BLI, CAN, and Portfolio filter panels — see the Shared PR Review Follow-up section below for why only BLI was fixed initially) by replacing the orphaned label with a plain legend-style span and adding an `ariaLabel` prop passthrough to `react-slider`, giving each thumb a distinct name (e.g. "Budget Line Total minimum"/"maximum"). Added a unit test for the new prop; verified no visual regression via screenshot and confirmed zero axe violations post-fix.

Full frontend suite: 5313 tests passing, 0 failures. `budgetLineItemsList.cy.js`: 8 passing, 0 failing, run 3x with no flakiness.

## Quality Follow-up (spec hygiene)

A broader quality assessment of `budgetLineItemsList.cy.js` turned up 4 more issues, addressed in this same PR since no review would happen until Monday anyway:

1. **Dead alias, unasserted interaction**: the "filter button" test captured `@initialMin`/`@initialMax` from the budget-range-slider thumbs before dragging them, then never referenced the aliases — the drag's effect was never actually verified. Fixing this surfaced two real, separate bugs:
   - **Cypress `.as()` on a DOM-derived chain doesn't freeze the value.** `cy.get(...).invoke("attr", ...).as("x")` re-runs the whole chain against the *live* DOM every time `cy.get("@x")` is read later, so comparing "before" vs "after" via an alias always compares the post-drag value to itself. Fixed by capturing into plain JS closure variables instead.
   - **The drag math used the thumb's own ~30px width, not the track's width**, as the basis for the pixel delta — so every "drag to 20%/80%" actually only ever moved by ~1-2%, regardless of intent. Fixed to measure the track container's width instead. Dialed the target down to a small ~2% nudge (not the original 20%/80%) after confirming against this worktree's real seeded data that a large cut against the slider's always-global min/max bounds intermittently zero-results this test's other 5 hardcoded filters (reproduced 2/3 runs). The assertion only checks direction (`greaterThan`/`lessThan`), not magnitude, so the exact nudge size doesn't matter.
2. **Dead code**: removed 9 lines of commented-out, abandoned-approach code inside the already-skipped `"Should filter all budgetlines vs my budget lines"` test. Left the skip/TODO itself as-is (performance investigation, not this story's scope).
3. **Kitchen-sink test split**: `"filter button works as expected"` did 5 comboboxes + a slider drag + apply + ~11 assertions + reset + ~7 more assertions + 2 a11y checks in one `it`. Split into `"applying filters sets tags, values, and announces the result"` and `"resetting filters clears tags and announces the result"`, sharing setup via a local `applyAllFilters()` helper (mirroring the file's existing `announcedCount` local-helper pattern) so resetting still exercises a real apply-then-reset journey without duplicating ~40 lines.
4. **`it.skip("click on edit bli and check to see if the form is populated")` — deleted, not fixed.** Investigated via direct source inspection: the component this page actually renders (`AllBLIRow.jsx`) has no edit button, no `data-cy="edit-row"`, nothing — the old inline-edit row (`BudgetLinesTable`/`BLIRow`/`ChangeIcons`) was superseded by `AllBudgetLinesTable`/`AllBLIRow` at some point, and editing now only happens via the agreement-page link. This skip was testing a feature that no longer exists on this page.

**Process note**: mid-investigation, a cross-session Docker port collision (this worktree's stack was stopped ~22h earlier when another worktree's stack claimed ports 3000/8080/5432) caused a stretch of live-browser/Cypress verification to silently run against the wrong app/database, producing a false "always reproducing" contrast violation and masking the real zero-results risk in finding #1 above. Caught via `docker ps` showing the wrong container name; all live findings were re-verified after the correct stack was restarted.

Final verification: `budgetLineItemsList.cy.js` run 3x against the correct stack — 9 passing (1 pending, the unrelated performance-skip), 0 failing, no retries. Full unit suite: 5313 passing.

## Shared PR Review Follow-up

Ran `/ops-pr-review` (`flexion-engineer-base:code-review-orchestrator`, full multi-turn adversarial review, Tier 1, N=2) against the PR. Two reviewers (frontend-expert-review, accessibility-expert-review) independently converged on the same real finding, confirmed by an independent skeptic pass:

- **[S2] `CANFYBudgetRangeSlider.jsx` and `PortfolioFYBudgetRangeSlider.jsx` still had the orphaned-label/missing-`ariaLabel` defect** this PR fixed in `BudgetRangeSlider.jsx`. Both are separate sibling components calling `DoubleRangeSlider` directly, untouched by the original diff. Per `docs/REVIEW.md`'s exception ("a PR that claims to fix the whole bug" promotes the unfixed parts to S2, rather than leaving them `[Pre-existing]`) — this PR's own description said the fix was "shared by the BLI, CAN, and Portfolio filter panels," which wasn't true at the time. **Fixed**: applied the identical `<label>`→`<span>` + `ariaLabel={["FY Budget minimum", "FY Budget maximum"]}` pattern to both files, added an `aria-label` assertion to each component's existing test file, verified live on `/cans` and `/portfolios` (screenshots: no visual regression; both thumbs correctly labeled) and re-ran `canList.cy.js` (9 passing, 0 failing — the only E2E spec that drags this slider).
- **[S2, Low] No unit test asserted `BudgetRangeSlider`'s actual interpolated `aria-label` text** — `DoubleRangeSlider.test.jsx` only proved pass-through of a hardcoded literal, and `BLIFilterButton.test.jsx` mocks `BudgetRangeSlider` away entirely. **Fixed**: added `BudgetRangeSlider.test.jsx` (new file) asserting both thumbs' `aria-label` for a custom `label` prop and the default.
- **[S3]** The PR description/this story's own earlier wording overstated the `ariaLabel` fix's reach — corrected above, now moot since CAN/Portfolio are actually fixed.

No S0/S1 findings. Full report posted as a PR comment.

Full suite re-run after these fixes: 5321 tests passing (8 new), 0 failures.
