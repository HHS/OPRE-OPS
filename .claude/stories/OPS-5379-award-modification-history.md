---
issue: OPS-5379
branch: OPS-5379/show-post-award-agreement-data
---

# Feature Story: Award & Modification History Tab (Contract Agreements)

## Story Overview

**Ticket:** OPS-5379
**Title:** Enable "Award & Modifications" tab for Awarded Contract Agreements, showing an accordion per completed award/modification with a fixed set of fields (falling back to `NO_DATA` when a field is missing).
**Story Points:** TBD

## Background

### Current State

- Contract Agreement detail pages already show a **disabled** "Award & Modifications" tab. It lives in `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` as a placeholder entry (`name: "TBD1"`), gated by:
  ```js
  disabled: !IS_AWARDED_TAB_READY || !isAgreementAwarded
  ```
  `IS_AWARDED_TAB_READY` is a feature flag in `frontend/src/constants.js`, currently `false`. No route exists yet in `frontend/src/pages/agreements/details/Agreement.jsx` for this tab.
- "Awarded" status is not a literal enum value — it's `Agreement.is_awarded` (backend property, `models/agreements.py`), true when a `ProcurementAction` with `award_type == NEW_AWARD` has `status` in `{AWARDED, CERTIFIED}`. The frontend mirrors this as `agreement?.is_awarded` → `isAgreementAwarded`.
- Award/modification data needed for this tab is **scattered across four backend models**, with no single record today that matches the mockup's flat field list:
  - `ProcurementAction` (`models/procurement_action.py`) — one row per award or modification cycle. Holds `award_total`, `agreement_total` (cumulative — "Contract Total"), `date_awarded_obligated` ("Award Date"), `agreement_mod_id` (null = initial award, set = modification), and relates to `ProcurementTracker`.
  - `DefaultProcurementTrackerStep` (`models/procurement_tracker.py`) — the AWARD step carries `award_vendor_id`, `award_contract_number`, `award_amount`, `award_date`; the PRE_AWARD step carries `pre_award_requisition_number`, `pre_award_requisition_date`, `pre_award_requisition_approved_date`.
  - `AgreementMod` (`models/agreements.py`) — `number` (e.g. "Mod 1"), `mod_date`, `mod_type`. No record exists for the initial award, and no "Base" value exists in `ModType`.
  - `Vendor` (`models/vendors.py`) — `name`, `duns` (legacy DUNS field, **already reused elsewhere in the app** — `AwardRequestForm.jsx`, `ApproveAwardApproval.jsx` — as "Unique Entity ID (SAM.gov ID)"), `vendor_type`.
  - `ContractAgreement` (`models/agreements.py`) — single, non-versioned `po_number` and `task_order_number` per Agreement (not per award/mod cycle).
- Reference UI: `~/Downloads/Award Expanded Accordion.pdf` shows the target tab — a page titled "Award & Modification History" with intro copy, and one accordion per award/mod cycle (e.g. "FY 2024 Award"), each expanding to a 5-column grid of label/value pairs where every value renders as a light-blue rounded tag.

### Desired State

For a Contract Agreement whose status is Awarded, the "Award & Modifications" tab is enabled and navigable. It renders one USWDS `Accordion` per completed procurement action (initial award + each completed modification), each showing:

Row 1: Award Date · Award Amount · Contract Total · Contract # · Modification #
Row 2: Requisition Approval Date · Requisition # · Vendor · Unique Entity ID (SAM.gov ID) · Vendor Type
Row 3: Purchase Order # · Task Order #

Any field with no data renders the shared `NO_DATA` constant (`"TBD"`) instead of being left blank. All label/value pairs and the "Awarded" status tag reuse the exact same `Tag` and `dl/dt/dd` components already used on the Agreement Details tab, for visual consistency.

### User Story

As an OPRE budget/procurement team member reviewing an **Awarded** Contract Agreement, I want to see the full award and modification history in one place, so I don't have to piece it together from the Procurement Tracker wizard or ask another team member.

### Acceptance Criteria

- [ ] For Contract Agreements with `is_awarded === true`, the "Award & Modifications" tab is enabled (no longer permanently disabled by `IS_AWARDED_TAB_READY`).
- [ ] The tab is disabled (as today) for Contract Agreements that are not yet Awarded, and is not shown/relevant for Grant Agreements (matching the existing `isDevelopedAgreement && !isGrant` gate).
- [ ] The tab shows one accordion per `ProcurementAction` whose linked `ProcurementTracker.status == COMPLETED`, ordered per [Open Question: sort order](#open-questions).
- [ ] The initial award's accordion header reads `"FY {year} Award"`; each modification's header reads `"FY {year} Mod {number}"`, using each action's own award/mod fiscal year (not necessarily the agreement's overall first-award FY).
- [ ] Each accordion shows the 12 fields listed above, with `NO_DATA` (`"TBD"`) for any missing value.
- [ ] "Modification #" shows the literal string `"Base"` when the action has no linked `AgreementMod`, otherwise shows `agreement_mod.number`.
- [ ] Purchase Order # and Task Order # show the Agreement-level `po_number`/`task_order_number` (same value across all accordions — see [Key Decisions](#key-decisions)).
- [ ] "Unique Entity ID (SAM.gov ID)" shows `vendor.duns`.
- [ ] If a Contract Agreement is Awarded but has zero completed procurement actions/trackers, the tab shows an empty state instead of an empty page (see [Open Questions](#open-questions)).
- [ ] All new code has tests per `docs/TESTING.md` (see [Testing Strategy](#testing-strategy)).

## Technical Context

### Related Components

**Frontend:**
- `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` — tab list; placeholder entry to be wired to a real route.
- `frontend/src/pages/agreements/details/Agreement.jsx` — owns the nested `<Routes>` for `/agreements/:id/*`; needs a new `<Route>`, and passes `agreement`/`isAgreementAwarded` down the same way it does to `AgreementProcurementTracker`.
- `frontend/src/pages/agreements/details/AgreementProcurementTracker.jsx` — closest existing sibling page; same heading pattern (`<h2 className="font-sans-lg">`), same data-fetching-then-render structure. New page (`AgreementAwardModifications.jsx`, exact name TBD) should follow this shape.
- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — source of the `dl/dt/dd` + `Tag` label/value pattern to reuse verbatim for field rendering.
- `frontend/src/pages/agreements/details/Agreement.jsx` (top of file) — source of the "Awarded" status `Tag` (`bg-brand-secondary` + `#verified` icon) and the `<h1>`/`<h2>` name/project heading pattern, in case this tab's own header needs to mirror it (mockup shows the existing global header unchanged above the tabs, so this is likely just a confirmation, not new work).
- `frontend/src/components/UI/Accordion/Accordion.jsx` — base accordion (uncontrolled, one instance per record, no built-in "multiple open" coordination — matches how `AgreementProcurementTracker.jsx` already renders 6 independent accordions).
- `frontend/src/components/UI/Tag/Tag.jsx` — `tagStyle="primaryDarkTextLightBackground"` for the light-blue pill look.
- `frontend/src/constants.js` — `NO_DATA` (`"TBD"`) and `IS_AWARDED_TAB_READY` (to flip to `true`).
- `frontend/src/api/opsAPI.js` (or wherever RTK Query endpoints are registered) — new endpoint/hook for the aggregated award-history data.

**Backend:**
- `models/procurement_action.py` — `ProcurementAction`, `AwardType`, `ProcurementActionStatus`.
- `models/procurement_tracker.py` — `ProcurementTracker`, `DefaultProcurementTrackerStep`, `ProcurementTrackerStatus`.
- `models/agreements.py` — `AgreementMod`, `ContractAgreement`, `ModType`, `Agreement.award_fiscal_year` / `date_to_fiscal_year()` (`models/utils/fiscal_year.py`).
- `models/vendors.py` — `Vendor`, `VendorType`.
- `ops_api/ops/resources/`, `ops_api/ops/schemas/`, `ops_api/ops/services/` — new resource/schema/service for the aggregated endpoint (see [Approach](#approach)).
- `ops_api/ops/urls.py` — new route registration.

### Dependencies

- None external. Relies entirely on existing models; no new tables.

### Assumptions

(Resolved via team discussion — recorded here so anyone reviewing this plan can see the reasoning, not just the conclusion.)

- Purchase Order # and Task Order # will display the single Agreement-level `po_number`/`task_order_number` on every accordion (same value repeated across award + all mods). Building true per-award/mod-versioned PO#/Task Order# fields is out of scope for this story (see [Future Improvements](#future-improvements)).
- "Unique Entity ID (SAM.gov ID)" will display `vendor.duns`, consistent with how `AwardRequestForm.jsx` and `ApproveAwardApproval.jsx` already label that field. Adding a real, distinct SAM.gov UEI column to `Vendor` is out of scope (see [Future Improvements](#future-improvements)).
- A new backend endpoint will aggregate/join the four models server-side and return one flat record per completed procurement action, rather than having the frontend stitch together `/procurement-actions/`, `/procurement-trackers/`, `/procurement-tracker-steps/`, and vendor data client-side.
- `IS_AWARDED_TAB_READY` will be flipped to `true` as part of this story, enabling the tab for all Awarded Contract Agreements once the route/content exist.
- Requisition # / Requisition Approval Date will be read from the PRE_AWARD tracker step's `pre_award_requisition_number` / `pre_award_requisition_approved_date` fields (the fields the current tracker wizard and existing requisition-review screens actually populate), not from the separate `Requisition` model.
- A row is included when its `ProcurementTracker.status == COMPLETED`, regardless of the `ProcurementAction.status` value.
- "Modification #" shows the literal string `"Base"` when `ProcurementAction.agreement_mod_id` is null (i.e., the initial award), otherwise `agreement_mod.number`.
- Accordion headers use an FY-prefixed format: `"FY {year} Award"` for the initial award, `"FY {year} Mod {number}"` for modifications, each using that action's own award/mod date via `date_to_fiscal_year()` (not necessarily the agreement's overall first-award FY).

## Implementation Plan

### Approach

**Backend — one new read-only aggregating endpoint.**

Add a new endpoint (name/URL pattern TBD during implementation — follow whatever convention the team already uses for agreement-scoped sub-resources) that, given an `agreement_id`, returns a list of flat records, one per `ProcurementAction` whose `ProcurementTracker.status == COMPLETED`, each shaped like:

```
{
  "fiscal_year_label": "FY 2024 Award" | "FY 2025 Mod 1",
  "award_date": "2024-06-26",
  "award_amount": "1000000.00",
  "contract_total": "5000000.00",
  "contract_number": "123456789",
  "modification_number": "Base" | "Mod 1",
  "requisition_approval_date": "2024-06-20",
  "requisition_number": "000444",
  "vendor_name": "Flexion Inc.",
  "vendor_unique_entity_id": "123456789",
  "vendor_type": "SMALL_BUSINESS",
  "purchase_order_number": "234156777",
  "task_order_number": "87654321"
}
```

Fields that resolve to `None` server-side are simply `null` in the response — the frontend applies `?? NO_DATA` at render time, matching the existing convention (`AgreementDetailsView.jsx` never applies `NO_DATA` server-side).

Query shape: start from `ProcurementAction.agreement_id == agreement_id`, join `ProcurementTracker` (filter `status == COMPLETED`), join that tracker's AWARD step and PRE_AWARD step (`DefaultProcurementTrackerStep`, filtered by `step_type`), join `Vendor` via the AWARD step's `award_vendor_id`, and outer-join `AgreementMod` via `agreement_mod_id` (nullable). `contract_total` reads from `ProcurementAction.agreement_total`. `purchase_order_number`/`task_order_number` read from the parent `ContractAgreement`, not from any per-action field.

**Frontend — new tab route + page + RTK Query hook.**

1. Register a new RTK Query endpoint (e.g. `getAgreementAwardHistory`) calling the new backend route.
2. Add a new page component (e.g. `AgreementAwardModifications.jsx`) under `frontend/src/pages/agreements/details/`, following `AgreementProcurementTracker.jsx`'s shape: heading + intro paragraph, fetch via the new hook, render a list of `Accordion`s (one per record).
3. Each accordion's body reuses the `dl/dt/dd` + `Tag` pattern from `AgreementDetailsView.jsx`, laid out as a 5-column grid mirroring the mockup's row groupings, with `?? NO_DATA` on every field.
4. Wire the route into `Agreement.jsx`'s nested `<Routes>` and update `DetailsTabs.jsx`'s placeholder entry (`name: "TBD1"` → real path) to point at it.
5. Flip `IS_AWARDED_TAB_READY` to `true` in `constants.js`.
6. Handle the empty-list case (Awarded agreement, zero completed actions) with an explicit empty-state message rather than an empty page.

### Files to Create

- `backend/ops_api/ops/resources/<new_resource>.py` — GET resource for the aggregated award-history endpoint.
- `backend/ops_api/ops/schemas/<new_schema>.py` — response schema for the record shape above.
- `backend/ops_api/ops/services/<new_service>.py` — query/aggregation logic (joins across `ProcurementAction`, `ProcurementTracker`/steps, `AgreementMod`, `Vendor`, `ContractAgreement`).
- `backend/ops_api/tests/ops/resources/test_<new_resource>.py` — endpoint integration tests.
- `backend/ops_api/tests/ops/services/test_<new_service>.py` — service/aggregation unit+integration tests.
- `frontend/src/pages/agreements/details/AgreementAwardModifications.jsx` — new tab page.
- `frontend/src/pages/agreements/details/AgreementAwardModifications.test.jsx` — component tests.
- Possibly `frontend/src/helpers/awardModificationHistory.helpers.js` (+ `.test.js`) — if fiscal-year-label / "Base" fallback formatting logic is non-trivial enough to extract as pure functions (recommended, for unit-testability per `docs/TESTING.md`).

### Files to Modify

- `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` — replace placeholder `name: "TBD1"` with the real route path.
- `frontend/src/pages/agreements/details/Agreement.jsx` — add the new `<Route>`.
- `frontend/src/constants.js` — flip `IS_AWARDED_TAB_READY` to `true`.
- `frontend/src/api/opsAPI.js` (exact file TBD — wherever endpoints are registered) — add the new query endpoint.
- `backend/ops_api/ops/urls.py` — register the new route.
- `frontend/cypress/e2e/` — extend or add a spec covering the new tab (see [Testing Strategy](#testing-strategy)).

### Implementation Steps

1. **Backend: aggregation service + schema + endpoint**
   - Write the service function that, given an `agreement_id`, returns the joined/flattened list described above.
   - Write the marshmallow schema for the response shape.
   - Wire the resource + URL route, matching existing auth/permission patterns used by `procurement_actions.py`/`procurement_trackers.py` resources.
   - Backend tests (unit for the service's field-mapping/fallback logic, integration for the endpoint).

2. **Frontend: data layer**
   - Add the RTK Query endpoint + generated hook.
   - Add MSW handler(s) for tests (`frontend/src/tests/mocks.js` or test-local overrides).

3. **Frontend: page + route + tab wiring**
   - Build `AgreementAwardModifications.jsx`: heading/intro copy, loading state, empty state, list of `Accordion`s.
   - Build the field-grid body (5-column layout, `Tag` + `dl/dt/dd`, `?? NO_DATA` everywhere).
   - Wire the route in `Agreement.jsx` and the tab entry in `DetailsTabs.jsx`.
   - Flip `IS_AWARDED_TAB_READY`.

4. **Tests + manual verification**
   - Unit tests for any extracted helpers (fiscal-year label, "Base" fallback).
   - Component tests for `AgreementAwardModifications.jsx` (renders N accordions, renders `NO_DATA` for missing fields, renders empty state).
   - One Cypress spec/case exercising the golden path (Awarded contract → tab → expand → see fields) plus `cy.checkA11y()`.
   - Manual check in `docker compose up --build`: an Awarded contract with real tracker data, and one with none (empty state).

### Key Decisions

**Decision 1: Where does per-accordion PO#/Task Order# data come from?**
- Option A: Reuse single Agreement-level `po_number`/`task_order_number` (no schema changes).
- Option B: Add new per-action columns (new migration, broader scope).
- **Chosen:** Option A — reuse Agreement-level values on every row. Flagged as a known limitation; see [Future Improvements](#future-improvements).

**Decision 2: Where does the SAM.gov Unique Entity ID come from?**
- Option A: Reuse `vendor.duns` (matches existing mislabeled usage elsewhere in the app).
- Option B: Add a real, distinct UEI column to `Vendor`.
- **Chosen:** Option A, for consistency with `AwardRequestForm.jsx`/`ApproveAwardApproval.jsx`. Flagged as a data-model gap; see [Future Improvements](#future-improvements).

**Decision 3: New backend endpoint vs. client-side composition?**
- Option A: New aggregating backend endpoint returning one flat record per completed action.
- Option B: Frontend composes from `/procurement-actions/`, `/procurement-trackers/`, `/procurement-tracker-steps/`.
- **Chosen:** Option A — keeps the 4-model join server-side and testable in one place; avoids N+1-style client-side stitching.

**Decision 4: Requisition # / Requisition Approval Date source**
- Option A: PRE_AWARD tracker step fields (`pre_award_requisition_number`/`pre_award_requisition_approved_date`).
- Option B: Separate `Requisition` model.
- **Chosen:** Option A — these are the fields the current tracker wizard and existing review screens actually populate end-to-end.

**Decision 5: Row inclusion rule**
- Option A: `ProcurementTracker.status == COMPLETED` only.
- Option B: COMPLETED tracker AND `ProcurementActionStatus in {AWARDED, CERTIFIED}`.
- **Chosen:** Option A.

**Decision 6: "Modification #" for the initial award**
- Option A: Hardcode `"Base"` when `agreement_mod_id` is null.
- Option B: `NO_DATA` when null.
- **Chosen:** Option A.

**Decision 7: Feature flag rollout**
- Option A: Flip `IS_AWARDED_TAB_READY` to `true` as part of this story.
- Option B: Leave it off, coordinate separately (e.g. with the Documents tab).
- **Chosen:** Option A.

## Testing Strategy

Per `docs/TESTING.md`'s decision matrix: this feature is mostly presentational (a new read-only tab) plus one new read-only aggregating endpoint — no complex multi-step workflow, so BDD/Gherkin is not warranted (a "poor candidate" per the doc's own guidance: "simple CRUD" / display-only work). Test at the lowest appropriate level:

### Unit Tests
- [ ] Backend: aggregation/service function — field mapping per source model, `"Base"` fallback when `agreement_mod_id` is null, `null` (not `NO_DATA`) when a field genuinely has no data (fallback is a frontend concern).
- [ ] Backend: fiscal-year label formatting (`"FY {year} Award"` vs `"FY {year} Mod {number}"`), including edge cases (missing award date, missing mod number).
- [ ] Frontend: any extracted helper function(s) for label/fallback formatting (pure function, e.g. `getModificationLabel(agreementMod)`).

### Integration Tests
- [ ] Backend: new endpoint against `loaded_db` — returns the expected shape/count for an agreement with 1 award + N completed mods; returns an empty list for an agreement with no completed trackers; respects existing auth/permission patterns (reuse `auth_client`/`no_perms_auth_client` fixtures per `docs/TESTING.md`).
- [ ] Frontend: RTK Query endpoint — query params/URL construction, `transformResponse` if any (MSW-backed, per `opsAPI.test.js` pattern).
- [ ] Frontend: `AgreementAwardModifications.jsx` component (RTL) — renders one `Accordion` per record, renders `NO_DATA` tags for null fields, renders the empty state when the list is empty, tab is disabled/hidden appropriately based on `isAgreementAwarded`.

### E2E / Manual
- [ ] One Cypress case: navigate to an Awarded contract agreement, click "Award & Modifications", expand an accordion, assert key fields are visible (`cy.checkA11y()` included, matching existing specs).
- [ ] Manual: verify in `docker compose up --build` against seeded test data, including the empty-state case.

### Test Data Needed
- At least one seeded Awarded Contract Agreement with a COMPLETED `ProcurementTracker` for its initial award, plus one with an additional COMPLETED modification tracker (to verify multi-accordion + "Mod #" rendering).
- One seeded Awarded Contract Agreement with no completed trackers (empty-state case).

## Validation

### Code Quality
- [ ] All tests pass (backend `pipenv run pytest`, frontend `bun run test --watch=false`)
- [ ] `pipenv run nox -s lint` / `bun run lint --fix` pass
- [ ] `pipenv run black` / `bun run format` applied
- [ ] Pre-commit hooks pass

### Functional Validation
- [ ] Feature works in `docker compose up --build`
- [ ] Acceptance criteria met
- [ ] No regressions to the existing Agreement Details / Procurement Tracker / Documents tabs or the `IS_AWARDED_TAB_READY`/`IS_DOCUMENTS_TAB_READY` flag interaction

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Reusing Agreement-level PO#/Task Order# across all rows is misleading if a real mod changes either number | Med | Low (no versioned data exists today to do better) | Documented explicitly in acceptance criteria; tracked as a follow-up ticket |
| `vendor.duns` is not actually a SAM.gov UEI, so the field may show incorrect-looking data for old vendors | Low | Med | Matches existing behavior elsewhere in the app; tracked as a follow-up ticket, not a regression introduced by this story |
| Flipping `IS_AWARDED_TAB_READY` globally could expose the tab on agreements with unexpected/legacy data shapes (e.g. awarded outside the tracker wizard) | Med | Med | Empty-state handling (acceptance criteria) covers the zero-completed-trackers case; QA pass on staging with a range of real Awarded agreements before flag flip ships |

## Notes

### Open Questions

These are UI-detail decisions not yet made, intentionally left for team review (not blocking the overall approach above):

- [ ] **Sort order** of accordions — oldest-first (award, then mods in chronological order, matching how the mockup's single example reads top-to-bottom) vs. newest-first (most recent activity on top, typical for a "history" view)?
- [ ] **Default open/closed state** — mockup shows the (only) accordion open by default. With multiple entries, should all start closed (consistent with how `AgreementProcurementTracker.jsx`'s 6 step-accordions behave independently), or should the most recent one start open?
- [ ] **"Return to top" link** — no existing pattern for this in the frontend today (confirmed via repo-wide search). Build a small one-off anchor/scroll component, or drop it from MVP scope?
- [ ] Exact URL path/naming for the new backend endpoint and exact RTK Query hook name — should follow whatever convention the backend team prefers for agreement-scoped sub-resources.

### Future Improvements

- Add true per-award/mod-versioned Purchase Order # and Task Order # fields (likely new columns on `ProcurementAction` or the AWARD tracker step), so historical accuracy improves when these numbers legitimately change across modifications.
- Add a real, distinct SAM.gov Unique Entity ID column on `Vendor`, and correct the existing mislabeled `duns` usage across `AwardRequestForm.jsx`, `ApproveAwardApproval.jsx`, and this new tab in one follow-up pass.
- Reconcile the two currently-parallel requisition-tracking mechanisms (`Requisition` model vs. PRE_AWARD tracker step fields) so there's one source of truth going forward.

### References

- Reference mockup: `~/Downloads/Award Expanded Accordion.pdf`
- Related existing tab: `frontend/src/pages/agreements/details/AgreementProcurementTracker.jsx`
- Related existing screens reusing `vendor.duns` as "Unique Entity ID (SAM.gov ID)": `frontend/src/components/Agreements/AwardRequestForm/AwardRequestForm.jsx`, `frontend/src/pages/agreements/award-approval/ApproveAwardApproval.jsx`
- Testing philosophy: `docs/TESTING.md`
