---
issue: 6261
branch: OPS-6261/project-spending-all-fys
---

# Feature Story: Project Details Spending Tab — All FYs Option

## Story Overview

**Ticket:** GitHub issue #6261 (sub-issue of #5332 — Standardize filter behavior across all list pages)
**Title:** Add an "All FYs" option to the Project Details Spending tab, and show agreements with
no budget line items when it's selected.

## Background

### Current State

`ProjectSpending.jsx` fetches:
- `useGetProjectSpendingByIdQuery(projectId)` → `agreements_by_fy`, `agreements_with_spending_by_fy`,
  `total_by_fiscal_year`, `spending_type_by_fiscal_year`, `total` (backend:
  `backend/models/projects.py` `Project.project_list_metadata`, lines 198-290).
- `useGetAgreementsByResearchProjectFilterQuery(projectId)` → the full list of agreements linked to
  the project, **independent of budget line items**.

The page only offers a single-FY dropdown (`FiscalYear` with no `showAllOption`). The table's
agreement list (`agreementsForFY`) is always `allAgreements` filtered down to the ids present in
`spendingData.agreements_by_fy[selectedFY]`.

**The bug/gap:** `project_list_metadata`'s inner loop only adds an agreement to
`agreements_by_fy[fy]` when one of its budget line items has a non-null `fiscal_year`
(`backend/models/projects.py:240-250`). An agreement with **zero budget line items** never enters
that loop body, so it never appears under any FY key — under every existing FY selection it is
filtered out of the table, even though it's already present in `allAgreements`. There is currently
no "All FYs" choice that would let it surface.

### Desired State

- The Spending tab's FY dropdown offers an "All FYs" option (`FiscalYear` already supports this via
  `showAllOption`; just not wired up here).
- Selecting "All FYs" shows every agreement linked to the project, including ones with zero budget
  line items, and aggregates the summary card / donut chart / per-row totals across every fiscal
  year instead of one.
- No backend change is required — `agreement_name_list`/`allAgreements` already contains every
  agreement regardless of BLIs; the fix is to stop filtering that list down to one FY's bucket when
  "All FYs" is selected.

### User Story

As a project stakeholder reviewing the Spending tab, I want an "All FYs" view so I can see every
agreement linked to the project — including ones that have no budget lines yet — instead of only
agreements that happen to have a BLI in the currently selected fiscal year.

### Acceptance Criteria

- [ ] The Spending tab FY dropdown includes an "All FYs" option.
- [ ] Selecting "All FYs" lists every agreement linked to the project, including agreements with
      zero budget line items.
- [ ] Selecting a specific FY continues to behave exactly as today (no regression) — zero-BLI
      agreements remain absent from single-FY views (backend behavior is correct here: a zero-BLI
      agreement isn't "in" any FY).
- [ ] Summary card, donut chart, and table headings/empty-state read sensibly under "All FYs"
      (no literal "FY All" string leaks into the UI).
- [ ] Per-row "FY Total" column under "All FYs" reflects each agreement's total non-draft spending
      across all fiscal years combined (summing `GET /agreements/:id/spending/`'s `fy_total` map),
      resolving to $0 for a zero-BLI agreement rather than showing stale/incorrect data.

## Technical Context

### Related Components

- `frontend/src/pages/projects/detail/ProjectSpending.jsx` — page-level state, data fetching, FY
  filtering/aggregation logic.
- `frontend/src/components/UI/FiscalYear/FiscalYear.jsx` — dropdown; already supports
  `showAllOption` (renders an `"All"` `<option>`); no changes needed here.
- `frontend/src/components/Projects/ProjectSpendingTotalsCard/ProjectSpendingTotalsCard.jsx` —
  summary card; hardcodes `FY {fiscalYear} Project Total` / `FY {fiscalYear} Agreements` labels.
- `frontend/src/components/Projects/ProjectSpendingAgreementsTable/ProjectSpendingAgreementsTable.jsx`
  and `.constants.js` — table wrapper; empty-state message and `FY {fiscalYear} Total` column
  heading both interpolate the raw FY value.
- `frontend/src/components/Projects/ProjectSpendingAgreementRow/ProjectSpendingAgreementRow.jsx` —
  per-row "FY Total" cell; indexes `agreementSpending.fy_total[fiscalYear]` by a single numeric key.

### Dependencies

- `useGetAgreementsByResearchProjectFilterQuery` (already used) — full agreement list per project.
- `useGetProjectSpendingByIdQuery` (already used) — FY-keyed aggregates.
- `useGetAgreementSpendingByIdQuery` (already used per row) — per-agreement `fy_total` map.
- No new endpoints, no backend/model/migration changes.

### Assumptions

- Default FY on page load stays a real fiscal year (current FY, or the highest available) — "All
  FYs" becomes an available *option*, not the default. Neither #6261 nor #5332 mandates defaulting
  to "All" on a detail page (the "reverts to All FYs" business rule in #5332 is specifically about
  list-page Compare-Fiscal-Years filter tags, not this detail page).
- "FY Total" semantics under "All FYs" = sum of non-draft spending across every fiscal year (mirrors
  what `fyTotal`/`fyAgreementCount` already mean for a single FY — non-draft-only, per issue #6139's
  existing convention — just summed across all FY keys instead of one).

## Implementation Plan

### Approach

Treat `"All"` as a valid value for `selectedFY` throughout `ProjectSpending.jsx`. When it's
selected, skip the `agreements_by_fy`-based membership filter entirely (return the full
`allAgreements` list) and aggregate every FY-keyed backend field by summing/unioning across all its
keys instead of indexing one. Push a small `fyLabel` string ("All FYs" vs `FY 2044`) down into the
child components that currently interpolate the raw FY value into UI copy, so nothing renders
`"FY All"`.

### Files to Create

None.

### Files to Modify

- `frontend/src/pages/projects/detail/ProjectSpending.jsx`
  - Pass `showAllOption={true}` to `<FiscalYear>`; change the `onChange` handler to keep `"All"` as
    a string instead of `Number(val)`-coercing it.
  - `agreementsForFY`: when `selectedFY === "All"`, return `allAgreements` unfiltered.
  - `fyTotal`: when `"All"`, sum every value in `spendingData.total_by_fiscal_year`.
  - `fyAgreementCount`: when `"All"`, size of the union of ids across every value in
    `spendingData.agreements_with_spending_by_fy`.
  - `donutData`: when `"All"`, sum `spending_type_by_fiscal_year` values across all FY keys before
    mapping to `AGREEMENT_TYPE_ORDER`.
  - `fyTotals` (single-agreement fallback optimization): extend the existing
    `agreementsForFY.length === 1` branch to use the aggregated `fyTotal` regardless of whether
    `selectedFY` is a number or `"All"`.
  - Add an `fyLabel` computed value (`"All FYs"` vs `` `FY ${selectedFY}` ``) and use it in the
    "Agreements" section copy and the donut chart `title` prop instead of the raw `selectedFY`
    interpolation.
- `frontend/src/components/Projects/ProjectSpendingTotalsCard/ProjectSpendingTotalsCard.jsx`
  - Compute the same `fyLabel` internally from the `fiscalYear` prop and use it in place of
    `` `FY ${fiscalYear}` `` in both the "Project Total" and "Agreements" labels.
- `frontend/src/components/Projects/ProjectSpendingAgreementsTable/ProjectSpendingAgreementsTable.constants.js`
  - `getTableHeadings(fiscalYear)`: use the fyLabel pattern for the `` `FY ${fiscalYear} Total` ``
    column heading so it reads `"All FYs Total"` when appropriate.
- `frontend/src/components/Projects/ProjectSpendingAgreementsTable/ProjectSpendingAgreementsTable.jsx`
  - Empty-state message: use the fyLabel pattern instead of raw `fiscalYear` interpolation.
- `frontend/src/components/Projects/ProjectSpendingAgreementRow/ProjectSpendingAgreementRow.jsx`
  - `fyTotalFromEndpoint`: when `fiscalYear === "All"`, sum `Object.values(agreementSpending.fy_total ?? {})`
    instead of indexing a single key. An agreement with zero BLIs has `fy_total: {}`, so this
    naturally resolves to `0` (not `NO_DATA`) — matching the existing "resolved but no entry = $0,
    not unknown" comment already in this file.

### Implementation Steps

1. **Wire "All" into `ProjectSpending.jsx` state/derivations**
   - `showAllOption` on the dropdown; stop coercing the change handler's value to `Number` when it's
     `"All"`.
   - Rewrite `agreementsForFY`, `fyTotal`, `fyAgreementCount`, `donutData`, `fyTotals` to branch on
     `selectedFY === "All"` as described above.
   - Add the `fyLabel` helper and use it for the donut title and the "Agreements" section blurb.

2. **Propagate FY-label formatting into child components**
   - `ProjectSpendingTotalsCard.jsx`, `ProjectSpendingAgreementsTable.constants.js`, and
     `ProjectSpendingAgreementsTable.jsx`: replace raw `FY {fiscalYear}` string interpolation with
     the same `"All FYs"` vs `` `FY ${fiscalYear}` `` branch (kept local to each file — no new shared
     helper needed for a two-line ternary repeated in three small components).

3. **Aggregate per-row totals in `ProjectSpendingAgreementRow.jsx`**
   - Branch the `fyTotalFromEndpoint` computation on `fiscalYear === "All"` to sum the row's
     `fy_total` map instead of indexing one key.

4. **Tests** (see Testing Strategy) — extend all five existing test files; add a zero-BLI agreement
   fixture that is absent from every `agreements_by_fy` bucket to `ProjectSpending.test.jsx`'s
   `mockAgreements`/`mockSpendingData`.

5. `bun run format`, `bun run lint --fix`, `bun run test --watch=false` before committing.

### Key Decisions

**Decision 1:** Should selecting "All FYs" become the new default view on page load?
- Option A: Default to "All FYs" — maximizes visibility of zero-BLI agreements without user action.
- Option B: Keep defaulting to a real FY (current behavior), make "All" an available option only.
- **Chosen:** Option B — neither issue mandates changing the default, and the existing
  current-FY-first default is a deliberate, tested behavior (`getDefaultFY`). Confirmed with user in
  planning discussion before writing this story.

**Decision 2:** Backend change to `getProjectSpendingById`/`project_list_metadata` vs. client-side
merge (this was posed as an open question directly in #6261)?
- Option A: Add a "no FY" bucket server-side (e.g. `agreements_by_fy[null]` or a new
  `agreements_without_blis` field) that the frontend merges in under "All FYs".
- Option B: Client-side — bypass the `agreements_by_fy` filter entirely under "All FYs" and use the
  already-fetched `allAgreements` list directly.
- **Chosen:** Option B — `allAgreements` (via `useGetAgreementsByResearchProjectFilterQuery`)
  already contains every agreement linked to the project regardless of BLI status, so no backend
  change or new field is needed. Simpler, and avoids growing the `project_list_metadata` payload
  shape for something the frontend can already derive.

## Testing Strategy

### Unit Tests

- [ ] `ProjectSpending.test.jsx`: add a 4th mock agreement with an id absent from every
      `agreements_by_fy` bucket (simulating zero BLIs). Assert:
  - "All" option renders in the dropdown (`getByRole("option", { name: "All" })`).
  - Selecting "All" renders the zero-BLI agreement's row alongside every other agreement.
  - Selecting a specific FY still excludes the zero-BLI agreement (no regression).
  - `fyTotal`/`fyAgreementCount` on the totals card aggregate correctly under "All" (sum across FYs
    / union of `agreements_with_spending_by_fy` ids).
- [ ] `ProjectSpendingTotalsCard.test.jsx`: `fiscalYear="All"` renders "All FYs Project Total" /
      "All FYs Agreements" labels, not "FY All ...".
- [ ] `ProjectSpendingAgreementsTable.test.jsx`: column heading and empty-state message read
      correctly when `fiscalYear="All"`.
- [ ] `ProjectSpendingAgreementRow.test.jsx`: with `fiscalYear="All"`, the FY Total cell sums the
      row's `fy_total` map; a zero-BLI agreement (`fy_total: {}`) resolves to `$0`, not `N/A`.

### Integration Tests

- [ ] None planned — existing component-level tests (RTK Query mocked via `vi.mock`) already cover
      the wiring; no new integration-layer test needed per `docs/TESTING.md`'s decision matrix.

### Manual Testing

- [ ] Open a project with at least one agreement that has zero budget line items; confirm it's
      invisible under any specific FY and visible under "All FYs".
- [ ] Confirm donut chart and summary card numbers under "All FYs" equal the sum of what's shown
      when manually stepping through each individual FY.
- [ ] Confirm switching FY ↔ All ↔ FY doesn't strand stale table pagination (existing `useEffect`
      resets `currentPage` on `fiscalYear` change — verify `"All"` also triggers it).

### Test Data Needed

- A project (existing seed data or a factory-created one) with ≥1 agreement that has no budget line
  items at all, alongside agreements that do — to exercise the "All FYs" surfacing behavior locally.

## Validation

### Code Quality
- [ ] All tests pass (`bun run test --watch=false`)
- [ ] ESLint passes (`bun run lint`)
- [ ] Prettier formatting applied (`bun run format`)
- [ ] Code coverage meets requirements (90% for frontend)
- [ ] Pre-commit hooks pass

### Functional Validation
- [ ] Feature works in local dev (`docker compose up --build`)
- [ ] Zero-BLI agreements surface only under "All FYs", never under a specific FY
- [ ] No regressions to existing single-FY behavior (issue #6139's draft-only-agreement handling
      stays intact)

### Documentation
- [ ] No README/API doc changes needed (frontend-only, no new endpoints)

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Aggregating `total_by_fiscal_year`/`spending_type_by_fiscal_year` client-side could double-count if backend semantics change later | Med | Low | Aggregation is a straightforward sum over already-disjoint per-FY dicts; add unit tests that lock in the summed values |
| "All FYs" per-row total (summing `fy_total`) diverges from `total_by_fiscal_year` sum shown on the card if an agreement's spending isn't attributed the same way at both endpoints | Low | Low | Both derive from the same non-draft-BLI convention; covered by `ProjectSpendingAgreementRow.test.jsx` |
| String label branching duplicated in 3 small components could drift | Low | Med | Keep the ternary trivial (`fiscalYear === "All" ? "All FYs" : \`FY ${fiscalYear}\``); revisit as a shared helper only if a 4th consumer appears |

## Notes

### Open Questions
- None outstanding for this sub-issue — both open questions posed in #6261 are resolved above
  (Decision 2: client-side merge; UI display: full agreement list under "All FYs", same table).

### Future Improvements
- If CANs list / Projects list / OPRE Budget Reporting later need the same "All FYs + zero-BLI
  agreements" treatment, consider extracting the `fyLabel` ternary into a shared helper alongside
  `src/helpers/fiscalYearFilter.helpers.js`.

### References
- Sub-issue: https://github.com/HHS/OPRE-OPS/issues/6261
- Parent story: https://github.com/HHS/OPRE-OPS/issues/5332
- Sibling sub-issue (Agreements list, same parent, merged pattern reference for "All"/"Multi"
  dropdown handling): https://github.com/HHS/OPRE-OPS/issues/6256, PR #6265
- Backend: `backend/models/projects.py:198-290` (`Project.project_list_metadata`)
- Prior regression test precedent for draft-only-agreement handling: issue #6139,
  `backend/ops_api/tests/ops/project/test_project_spending.py:313`
