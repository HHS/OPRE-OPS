---
issue: OPS-5379
branch: OPS-5379/show-post-award-agreement-data
---

# Feature Story: Award & Modification History Tab (Contract & AA Agreements)

## Story Overview

**Ticket:** OPS-5379
**Title:** Enable "Award & Modifications" tab for Awarded Contract and AA Agreements, showing an accordion per Budget-Team-approved award/modification with a fixed set of fields (falling back to `NO_DATA` when a field is missing).
**Story Points:** TBD — note that covering AA alongside Contract roughly doubles the integration/E2E/manual test surface (separate seed data, separate Cypress cases, separate empty-state checks per type; see [Testing Strategy](#testing-strategy)), which should factor into estimation.

## Background

### Current State

- Contract and AA Agreement detail pages already show a **disabled** "Award & Modifications" tab. It lives in `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` as a placeholder entry (`name: "TBD1"`), gated by:
  ```js
  disabled: !IS_AWARDED_TAB_READY || !isAgreementAwarded
  ```
  and shown at all only when `isDevelopedAgreement && !isGrant` (`isGrant = agreement_type === AgreementType.GRANT`; `isDevelopedAgreement = !isNotDevelopedYet(agreement_type)`, both computed in `Agreement.jsx`). **Verified directly against `isNotDevelopedYet` (`agreement.helpers.js`):** it already returns `true` (i.e. "not developed") for both `DIRECT_OBLIGATION` and `IAA`, so this gate *already* excludes Direct Obligation and IAA today, not just Grant — for those two types the tab entry doesn't render at all, it isn't merely disabled. The one type this gate does **not** exclude, and that the plan hadn't previously considered, is `AgreementType.MISCELLANEOUS`: it's neither `GRANT` nor covered by `isNotDevelopedYet`, so a Miscellaneous agreement that somehow became Awarded would pass this gate once `IS_AWARDED_TAB_READY` flips (see [Assumptions](#assumptions) and [Risks](#risks-and-mitigations)). Separately, this gate only controls whether the *tab button* renders — it has no bearing on whether the new `<Route>` itself responds to a manually-typed URL; see [Assumptions](#assumptions) for the direct-navigation gap this implies for the new route specifically. `IS_AWARDED_TAB_READY` is a feature flag in `frontend/src/constants.js`, currently `false`. No route exists yet in `frontend/src/pages/agreements/details/Agreement.jsx` for this tab.
- "Awarded" status is not a literal enum value — it's `Agreement.is_awarded` (backend property, `models/agreements.py`), true when a `ProcurementAction` with `award_type == NEW_AWARD` has `status` in `{AWARDED, CERTIFIED}`. This property lives on the base `Agreement` class, not on `ContractAgreement`/`AaAgreement` — it works identically for both. The frontend mirrors this as `agreement?.is_awarded` → `isAgreementAwarded`.
- Award/modification data needed for this tab is **scattered across four backend models**, with no single record today that matches the mockup's flat field list. All four are agreement-type-agnostic (no `ContractAgreement`-only or `AaAgreement`-only branching in `ProcurementAction`, `ProcurementTracker`/steps, or `AgreementMod` service code today):
  - `ProcurementAction` (`models/procurement_action.py`) — one row per award or modification cycle, FK'd to the base `Agreement.id` (works for any subtype). Holds `award_total`, `agreement_total` (cumulative — "Contract Total"), `date_awarded_obligated` ("Award Date"), `agreement_mod_id` (null = initial award, set = modification), and relates to `ProcurementTracker`.
  - `DefaultProcurementTrackerStep` (`models/procurement_tracker.py`) — the AWARD step carries `award_vendor_id`, `award_contract_number`, `award_amount`, `award_date`; the PRE_AWARD step carries `pre_award_requisition_number`, `pre_award_requisition_date`, `pre_award_requisition_approved_date`. Same shape regardless of the linked agreement's subtype.
  - `AgreementMod` (`models/agreements.py`) — `number` (e.g. "Mod 1"), `mod_date`, `mod_type`. `agreement_id` FKs to the base `Agreement`, so this also works unchanged for AA. No record exists for the initial award, and no "Base" value exists in `ModType`.
  - `Vendor` (`models/vendors.py`) — `name`, `duns` (legacy DUNS field, **already reused elsewhere in the app** — `AwardRequestForm.jsx`, `ApproveAwardApproval.jsx` — as "Unique Entity ID (SAM.gov ID)"), `vendor_type`. Both `ContractAgreement` and `AaAgreement` already list `AgreementFields.Vendor` as visible in `frontend/src/helpers/agreement.helpers.js`'s `AGREEMENT_TYPE_VISIBLE_FIELDS` map, so the Vendor fields aren't a Contract-only concept today.
  - `ContractAgreement` / `AaAgreement` (`models/agreements.py`) — each subtype independently declares its own `po_number`, `task_order_number`, and `contract_number` columns (identical field names, identical types, defined separately in each subclass — there is no shared mixin). Each is single, non-versioned per Agreement (not per award/mod cycle). `AaAgreement` also already lists `AgreementFields.ContractNumber` as visible per the same frontend map, confirming this field is treated as applicable to AA today, not just Contract.
- Reference UI: `~/Downloads/Award Expanded Accordion.pdf` shows the target tab — a page titled "Award & Modification History" with intro copy, and one accordion per award/mod cycle (e.g. "FY 2024 Award"), each expanding to a 5-column grid of label/value pairs where every value renders as a light-blue rounded tag. The mockup was built against a Contract Agreement example; field labels (e.g. "Contract Total", "Contract #") have not been separately confirmed for the AA case — see [Open Questions](#open-questions).

### Desired State

For a Contract or AA Agreement whose status is Awarded, the "Award & Modifications" tab is enabled and navigable. It renders one USWDS `Accordion` per procurement action whose AWARD tracker step has been approved by the Budget Team (initial award + each approved modification), each showing:

Row 1: Award Date · Award Amount · Contract Total · Contract # · Modification #
Row 2: Requisition Approval Date · Requisition # · Vendor · Unique Entity ID (SAM.gov ID) · Vendor Type
Row 3: Purchase Order # · Task Order #

Any field with no data renders the shared `NO_DATA` constant (`"TBD"`) instead of being left blank. All label/value pairs and the "Awarded" status tag reuse the exact same `Tag` and `dl/dt/dd` components already used on the Agreement Details tab, for visual consistency.

### User Story

As an OPRE budget/procurement team member reviewing an **Awarded** Contract or AA Agreement, I want to see the full award and modification history in one place, so I don't have to piece it together from the Procurement Tracker wizard or ask another team member.

### Acceptance Criteria

- [ ] For Contract and AA Agreements with `is_awarded === true`, the "Award & Modifications" tab is enabled (no longer permanently disabled by `IS_AWARDED_TAB_READY`).
- [ ] The tab is disabled (as today) for Contract/AA Agreements that are not yet Awarded, and is not shown/relevant for Grant, Direct Obligation, or IAA Agreements (the existing `isDevelopedAgreement && !isGrant` gate already excludes all three — verified: `isNotDevelopedYet()` returns `true` for `DIRECT_OBLIGATION`/`IAA` — so no frontend gate change is needed for those types).
- [ ] `AgreementType.MISCELLANEOUS` is explicitly handled (allowlisted out or in) rather than silently falling through the existing gate as a side effect — it is not excluded by either `!isGrant` or `isNotDevelopedYet()` today. See [Assumptions](#assumptions) and [Open Questions](#open-questions).
- [ ] The new route responds correctly (redirect or graceful error, not a raw stack trace or blank page) if a user navigates directly to its URL for an agreement type the endpoint rejects — the tab-list gate alone doesn't protect a manually-typed URL, and no existing per-route guard covers this new route by default (contrast with the `procurement-tracker` route's explicit `isGrant ? <Navigate/> : ...` guard). See [Assumptions](#assumptions).
- [ ] The tab shows one accordion per `ProcurementAction` whose linked tracker's AWARD step has been Budget-Team-approved (`DefaultProcurementTrackerStep.award_approval_status == "APPROVED"`), ordered per [Open Question: sort order](#open-questions), for both Contract and AA Agreements.
- [ ] The initial award's accordion header reads `"FY {year} Award"`; each modification's header reads `"FY {year} Mod {number}"`, using each action's own award/mod fiscal year (not necessarily the agreement's overall first-award FY).
- [ ] Each accordion shows the 12 fields listed above, with `NO_DATA` (`"TBD"`) for any missing value.
- [ ] "Modification #" shows the literal string `"Base"` when the action has no linked `AgreementMod`, otherwise shows `agreement_mod.number`.
- [ ] Purchase Order # and Task Order # show the Agreement-level `po_number`/`task_order_number`, read from whichever concrete subtype (`ContractAgreement` or `AaAgreement`) the agreement actually is (same value across all accordions — see [Key Decisions](#key-decisions)).
- [ ] "Unique Entity ID (SAM.gov ID)" shows `vendor.duns`.
- [ ] If a Contract or AA Agreement is Awarded but has zero procurement actions with a Budget-Team-approved AWARD step, the tab shows an empty state instead of an empty page (see [Open Questions](#open-questions)).
- [ ] All new code has tests per `docs/TESTING.md` (see [Testing Strategy](#testing-strategy)).

## Technical Context

### Related Components

**Frontend:**
- `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` — tab list; placeholder entry to be wired to a real route.
- `frontend/src/pages/agreements/details/Agreement.jsx` — owns the nested `<Routes>` for `/agreements/:id/*`; needs a new `<Route>`, and passes `agreement`/`isAgreementAwarded` down the same way it does to `AgreementProcurementTracker`.
- `frontend/src/pages/agreements/details/AgreementProcurementTracker.jsx` — closest existing sibling page; same heading pattern (`<h2 className="font-sans-lg">`), same data-fetching-then-render structure. New page (`AgreementAwardModifications.jsx`, exact name TBD) should follow this shape.
- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — source of the `dl/dt/dd` + `Tag` label/value pattern to reuse verbatim for field rendering.
- `frontend/src/components/Agreements/AgreementMetaAccordion/AgreementMetaAccordion.jsx` (~line 92) — existing precedent for reusing "Contract Type"/"Contract #" labels unchanged on AA Agreements (gated only by `isFieldVisible(agreementType, AgreementFields.ContractNumber)`, which is `true` for AA), cited in [Open Questions](#open-questions) as the basis for not inventing AA-specific label wording.
- `frontend/src/pages/agreements/details/Agreement.jsx` (top of file) — source of the "Awarded" status `Tag` (`bg-brand-secondary` + `#verified` icon) and the `<h1>`/`<h2>` name/project heading pattern, in case this tab's own header needs to mirror it (mockup shows the existing global header unchanged above the tabs, so this is likely just a confirmation, not new work).
- `frontend/src/components/UI/Accordion/Accordion.jsx` — base accordion (uncontrolled, one instance per record, no built-in "multiple open" coordination — matches how `AgreementProcurementTracker.jsx` already renders 6 independent accordions).
- `frontend/src/components/UI/Tag/Tag.jsx` — `tagStyle="primaryDarkTextLightBackground"` for the light-blue pill look.
- `frontend/src/constants.js` — `NO_DATA` (`"TBD"`) and `IS_AWARDED_TAB_READY` (to flip to `true`).
- `frontend/src/api/opsAPI.js` (or wherever RTK Query endpoints are registered) — new endpoint/hook for the aggregated award-history data.

**Backend:**
- `models/procurement_action.py` — `ProcurementAction`, `AwardType`, `ProcurementActionStatus`.
- `models/procurement_tracker.py` — `ProcurementTracker`, `DefaultProcurementTrackerStep`, `ProcurementTrackerStatus`.
- `models/agreements.py` — `AgreementMod`, `ContractAgreement`, `AaAgreement`, `ModType`, `Agreement.award_fiscal_year` / `date_to_fiscal_year()` (`models/utils/fiscal_year.py`).
- `ops_api/ops/services/agreements.py` (`_apply_agreement_specific_filters`, ~line 1288) — existing precedent for how this codebase already branches on `agreement_cls in [ContractAgreement, AaAgreement]` when a field is shared by both subtypes; the new service's Contract/AA resolution (see [Decision 1a](#key-decisions)) should follow this established pattern rather than inventing a new one.
- `models/vendors.py` — `Vendor`, `VendorType`.
- `ops_api/ops/resources/`, `ops_api/ops/schemas/`, `ops_api/ops/services/` — new resource/schema/service for the aggregated endpoint (see [Approach](#approach)).
- `ops_api/ops/urls.py` — new route registration.

### Dependencies

- None external. Relies entirely on existing models; no new tables.

### Assumptions

(Resolved via team discussion — recorded here so anyone reviewing this plan can see the reasoning, not just the conclusion.)

- Purchase Order # and Task Order # will display the single Agreement-level `po_number`/`task_order_number` on every accordion (same value repeated across award + all mods), read from `ContractAgreement` or `AaAgreement` depending on the agreement's actual subtype. **Verified:** because both subclasses declare these columns with identical attribute names/types, a plain query against the base `Agreement` (e.g. `session.get(Agreement, agreement_id)`) returns a live `ContractAgreement`/`AaAgreement` instance via normal SQLAlchemy joined-table polymorphism, and `agreement.po_number` "just works" on either — no `with_polymorphic` or explicit branching is required *for the attribute read itself*. Two real constraints remain: (1) this must be a separate row fetch merged into each flat record in Python, not pulled into the same one-shot SQL join that aggregates `ProcurementAction`/`ProcurementTracker`/`Vendor`/`AgreementMod` (attempting the latter would need a double-outerjoin-with-coalesce); (2) it must run only after confirming `agreement_type in {CONTRACT, AA}`, since calling `.po_number` on a `GrantAgreement`/`DirectAgreement`/`IaaAgreement`/Miscellaneous instance raises `AttributeError` (those subclasses don't define the column). Building true per-award/mod-versioned PO#/Task Order# fields is out of scope for this story (see [Future Improvements](#future-improvements)).
- Contract and AA Agreements are treated identically by this story's backend and frontend logic — same query shape, same schema, same page component, same field grid. No AA-specific fields (`requesting_agency`, `servicing_agency`, `partner_type`, etc.) are added to this tab; those aren't part of the mockup's field list and aren't required for award/mod history.
- Direct Obligation and IAA Agreements are out of scope, and — unlike an earlier draft of this plan assumed — the existing frontend tab gate already excludes them today: `isNotDevelopedYet()` returns `true` for both `DIRECT_OBLIGATION` and `IAA`, so `isDevelopedAgreement` is `false` and the tab entry never renders for those types. No frontend gate change is needed for Direct/IAA. `AgreementType.MISCELLANEOUS` is the one type this reasoning doesn't cover (neither `isGrant` nor `isNotDevelopedYet` catches it) — the backend endpoint's `agreement_type in {CONTRACT, AA}` validation ([Decision 8](#key-decisions)) is the actual scope enforcement for Miscellaneous, not the frontend gate.
- The tab-list gate in `DetailsTabs.jsx` only controls whether the tab *button* renders — it does not stop a direct/manually-typed URL from hitting the new `<Route>` in `Agreement.jsx`. The existing `procurement-tracker` route guards itself explicitly (`isGrant ? <Navigate .../> : <AgreementProcurementTracker/>`); the new route needs an equivalent guard (or must rely entirely on the backend's type validation plus a defined frontend error/redirect state) so a Miscellaneous/Direct/IAA agreement navigated to directly doesn't hit an unhandled error.
- It is **not yet empirically verified** that an AA Agreement can actually reach a Budget-Team-approved AWARD step (`award_approval_status == "APPROVED"`, the new gating milestone) with populated AWARD-step fields through the real tracker wizard — existing tests (`test_agreement_is_awarded.py`) only unit-test `is_awarded` against a bare `AaAgreement` + directly-constructed `ProcurementAction`, and no integration test under `ops_api/tests/ops/procurement_tracker/` or `procurement_action/` exercises an AA agreement end-to-end through the wizard. This should be confirmed early in implementation (e.g. via a spike or the first AA integration test), not assumed from model-level field parity alone.
- "Unique Entity ID (SAM.gov ID)" will display `vendor.duns`, consistent with how `AwardRequestForm.jsx` and `ApproveAwardApproval.jsx` already label that field. Adding a real, distinct SAM.gov UEI column to `Vendor` is out of scope (see [Future Improvements](#future-improvements)).
- A new backend endpoint will aggregate/join the four models server-side and return one flat record per procurement action whose AWARD step is Budget-Team-approved, rather than having the frontend stitch together `/procurement-actions/`, `/procurement-trackers/`, `/procurement-tracker-steps/`, and vendor data client-side.
- `IS_AWARDED_TAB_READY` will be flipped to `true` as part of this story, enabling the tab for all Awarded Contract and AA Agreements once the route/content exist.
- Requisition # / Requisition Approval Date will be read from the PRE_AWARD tracker step's `pre_award_requisition_number` / `pre_award_requisition_approved_date` fields (the fields the current tracker wizard and existing requisition-review screens actually populate), not from the separate `Requisition` model.
- A row is included when its AWARD tracker step's `award_approval_status == "APPROVED"` (Budget Team approval), regardless of `ProcurementTracker.status` or `ProcurementAction.status`. See [Decision 5](#key-decisions).
- "Modification #" shows the literal string `"Base"` when `ProcurementAction.agreement_mod_id` is null (i.e., the initial award), otherwise `agreement_mod.number`.
- Accordion headers use an FY-prefixed format: `"FY {year} Award"` for the initial award, `"FY {year} Mod {number}"` for modifications, each using that action's own award/mod date via `date_to_fiscal_year()` (not necessarily the agreement's overall first-award FY).

## Implementation Plan

### Approach

**Backend — one new read-only aggregating endpoint.**

Add a new endpoint (name/URL pattern TBD during implementation — follow whatever convention the team already uses for agreement-scoped sub-resources) that, given an `agreement_id`, returns a list of flat records, one per `ProcurementAction` whose linked tracker's AWARD step has been Budget-Team-approved (`DefaultProcurementTrackerStep.award_approval_status == "APPROVED"`; the tracker need not be `COMPLETED`), each shaped like:

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

Query shape: start from `ProcurementAction.agreement_id == agreement_id`, join `ProcurementTracker`, join that tracker's AWARD step and PRE_AWARD step (`DefaultProcurementTrackerStep`, filtered by `step_type`), keep only trackers whose AWARD step's `award_approval_status == "APPROVED"` (Budget Team approval), join `Vendor` via the AWARD step's `award_vendor_id`, and outer-join `AgreementMod` via `agreement_mod_id` (nullable). The AWARD-step approval filter is applied in Python against eager-loaded steps rather than in SQL. `contract_total` reads from `ProcurementAction.agreement_total`. `purchase_order_number`/`task_order_number` read from the parent Agreement's concrete subtype — either `ContractAgreement` or `AaAgreement`, both of which expose these under the same column names via a separate fetch of the base `Agreement` row (see [Decision 1a](#key-decisions)), merged into each flat record in Python rather than joined into the main aggregating query. The endpoint must validate `agreement_type in {CONTRACT, AA}` up front (404 or 400 otherwise, following the existing `_apply_agreement_specific_filters` branching pattern in `ops_api/ops/services/agreements.py`) — this isn't just about rejecting Grant/Direct/IAA/Miscellaneous cleanly, it's a hard requirement: reading `.po_number` on any other subtype raises `AttributeError`, since only `ContractAgreement`/`AaAgreement` define that column.

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
- `backend/ops_api/ops/services/<new_service>.py` — query/aggregation logic (joins across `ProcurementAction`, `ProcurementTracker`/steps, `AgreementMod`, `Vendor`, plus a separate `ContractAgreement`/`AaAgreement` resolution for `po_number`/`task_order_number`/`contract_number` — see [Decision 1a](#key-decisions)).
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
   - Unit tests for any extracted helpers (fiscal-year label, "Base" fallback) and for the service's Contract-vs-AA subtype resolution ([Decision 1a](#key-decisions)).
   - Component tests for `AgreementAwardModifications.jsx` (renders N accordions, renders `NO_DATA` for missing fields, renders empty state), against both a Contract fixture and an AA fixture.
   - Two Cypress specs/cases exercising the golden path — one against an Awarded Contract agreement, one against an Awarded AA agreement (tab → expand → see fields) — plus `cy.checkA11y()` on each.
   - Manual check in `docker compose up --build`: an Awarded Contract agreement with real tracker data, an Awarded AA agreement with real tracker data, and one of each with none (empty state).

### Key Decisions

**Decision 1: Where does per-accordion PO#/Task Order# data come from?**
- Option A: Reuse single Agreement-level `po_number`/`task_order_number` (no schema changes), resolved from whichever concrete subtype (`ContractAgreement`/`AaAgreement`) the agreement is.
- Option B: Add new per-action columns (new migration, broader scope).
- **Chosen:** Option A — reuse Agreement-level values on every row. Flagged as a known limitation; see [Future Improvements](#future-improvements).

**Decision 1a: How does the service resolve `po_number`/`task_order_number`/`contract_number` across `ContractAgreement` and `AaAgreement`?**
- Option A: Query the base `Agreement` polymorphically (e.g. `session.get(Agreement, agreement_id)`) and read the attribute directly — SQLAlchemy's joined-table polymorphism returns a live `ContractAgreement`/`AaAgreement` instance, so `agreement.po_number` works on either without any type check at the read site.
- Option B: Branch explicitly on `agreement_type` (`if agreement_cls in [ContractAgreement, AaAgreement]`) and query the concrete subtype directly, matching the existing precedent in `_apply_agreement_specific_filters` (`ops_api/ops/services/agreements.py` ~line 1288).
- **Chosen:** Option A for the attribute read itself — it's simpler than it first appears and needs no type check to *work*. However, an explicit `agreement_type in {CONTRACT, AA}` check is still required beforehand regardless of which option is used, per [Decision 8](#key-decisions) — without it, `.po_number` raises `AttributeError` on any other subtype. This fetch must be a separate row lookup merged into each flat record in Python, not folded into the one-shot aggregating join (see [Approach](#approach)).

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
- Option A: AWARD tracker step Budget-Team-approved (`DefaultProcurementTrackerStep.award_approval_status == "APPROVED"`), independent of tracker/action status.
- Option B: `ProcurementTracker.status == COMPLETED` (i.e. the COR completed the final step 6).
- Option C: COMPLETED tracker AND `ProcurementActionStatus in {AWARDED, CERTIFIED}`.
- **Chosen:** Option A. The tab surfaces a cycle as soon as the Budget Team approves its award, rather than waiting for the COR to complete the final step 6. Keying off the AWARD step's `award_approval_status` (rather than `ProcurementAction.status == AWARDED`) is deliberate: Budget Team approval sets `award_approval_status = "APPROVED"` on the AWARD step for **any** award type, whereas the service only flips `ProcurementAction.status` to `AWARDED` for `NEW_AWARD` actions — so approving off the step correctly includes **modifications** too. Note: a completed-via-backfill tracker (`ProcurementTracker.mark_completed()`) sets step statuses to `COMPLETED` but does **not** set `award_approval_status`; such backfilled cycles will not appear under this rule unless the AWARD step is also marked approved.

**Decision 6: "Modification #" for the initial award**
- Option A: Hardcode `"Base"` when `agreement_mod_id` is null.
- Option B: `NO_DATA` when null.
- **Chosen:** Option A.

**Decision 7: Feature flag rollout**
- Option A: Flip `IS_AWARDED_TAB_READY` to `true` as part of this story.
- Option B: Leave it off, coordinate separately (e.g. with the Documents tab).
- **Chosen:** Option A.

**Decision 8: Scope boundary — Contract + AA only**
- Option A: Rely solely on the existing frontend tab-list gate (`isDevelopedAgreement && !isGrant`); don't add any additional type check anywhere.
- Option B: Add an explicit `agreement_type in {CONTRACT, AA}` check in the new backend endpoint, plus a route-level guard on the frontend (mirroring `procurement-tracker`'s `isGrant ? <Navigate/> : ...` pattern) for the new route specifically.
- **Chosen:** Option B. Correction from an earlier draft of this decision: the frontend tab-list gate does **not** need tightening for Direct Obligation/IAA — `isNotDevelopedYet()` already excludes both. The real gaps Option B closes are (1) `AgreementType.MISCELLANEOUS`, which neither `isGrant` nor `isNotDevelopedYet` excludes, and (2) direct/manually-typed URL navigation to the new route, which bypasses the tab-list gate entirely regardless of agreement type. The backend check is also load-bearing for [Decision 1a](#key-decisions) — without it, resolving `po_number` on a non-Contract/AA subtype raises `AttributeError` rather than a clean error response.

## Testing Strategy

Per `docs/TESTING.md`'s decision matrix: this feature is mostly presentational (a new read-only tab) plus one new read-only aggregating endpoint — no complex multi-step workflow, so BDD/Gherkin is not warranted (a "poor candidate" per the doc's own guidance: "simple CRUD" / display-only work). Test at the lowest appropriate level:

### Unit Tests
- [ ] Backend: aggregation/service function — field mapping per source model, `"Base"` fallback when `agreement_mod_id` is null, `null` (not `NO_DATA`) when a field genuinely has no data (fallback is a frontend concern).
- [ ] Backend: `po_number`/`task_order_number`/`contract_number` resolution ([Decision 1a](#key-decisions)) — returns the right value for a `ContractAgreement` and for an `AaAgreement`, and raises/handles the rejected-type case cleanly for any other subtype (does not depend on the slower integration-test layer to catch a broken branch).
- [ ] Backend: fiscal-year label formatting (`"FY {year} Award"` vs `"FY {year} Mod {number}"`), including edge cases (missing award date, missing mod number).
- [ ] Frontend: any extracted helper function(s) for label/fallback formatting (pure function, e.g. `getModificationLabel(agreementMod)`).

### Integration Tests
- [ ] Backend: new endpoint against `loaded_db` — returns the expected shape/count for a Contract agreement with 1 award + N Budget-Team-approved mods, **and** the same for an AA agreement (verifying `po_number`/`task_order_number`/`contract_number` resolve correctly for both subtypes); returns an empty list for an agreement with no approved AWARD steps; includes a cycle whose AWARD step is approved but whose tracker is still ACTIVE (not yet COMPLETED) and excludes a cycle whose AWARD step is not yet approved; respects existing auth/permission patterns (reuse `auth_client`/`no_perms_auth_client` fixtures per `docs/TESTING.md`).
- [ ] Backend: endpoint called against a Grant, Direct Obligation, IAA, or Miscellaneous agreement returns the agreed-upon error (per [Decision 8](#key-decisions)) rather than silently succeeding or raising an unhandled `AttributeError` on the `po_number` lookup.
- [ ] Frontend: RTK Query endpoint — query params/URL construction, `transformResponse` if any (MSW-backed, per `opsAPI.test.js` pattern).
- [ ] Frontend: `AgreementAwardModifications.jsx` component (RTL) — renders one `Accordion` per record, renders `NO_DATA` tags for null fields, renders the empty state when the list is empty, tab is disabled/hidden appropriately based on `isAgreementAwarded`, for both a Contract-agreement fixture and an AA-agreement fixture.

### E2E / Manual
- [ ] Two Cypress cases (or one parameterized): navigate to an Awarded Contract agreement and to an Awarded AA agreement, click "Award & Modifications", expand an accordion, assert key fields are visible (`cy.checkA11y()` included, matching existing specs).
- [ ] Manual: verify in `docker compose up --build` against seeded test data for both agreement types, including the empty-state case.

### Test Data Needed
- At least one seeded Awarded Contract Agreement with a Budget-Team-approved AWARD step (`award_approval_status == "APPROVED"`) for its initial award, plus one with an additional approved modification cycle (to verify multi-accordion + "Mod #" rendering).
- At least one seeded Awarded AA Agreement with the same shape (initial award + an approved mod), to verify the AA code path independently of Contract.
- One seeded Awarded Contract Agreement and one seeded Awarded AA Agreement with no approved AWARD steps (empty-state case for both types).

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
| Implementation is built/tested only against Contract Agreements, then assumed to "just work" for AA because the models happen to line up today | Med | Med | Explicit AA test data and test cases required in [Testing Strategy](#testing-strategy); AA is treated as a first-class case in the plan, not an afterthought |
| `AgreementType.MISCELLANEOUS` isn't excluded by either `!isGrant` or `isNotDevelopedYet()`, so it could pass the frontend tab-list gate if ever Awarded, and a direct URL to the new route bypasses that gate entirely for any type | Low–Med | Low (Miscellaneous/Direct/IAA agreements aren't expected to reach Awarded via the tracker wizard today; no evidence found either way) | [Decision 8](#key-decisions) adds an explicit backend `agreement_type in {CONTRACT, AA}` check plus a route-level guard mirroring `procurement-tracker`'s `isGrant ? <Navigate/> : ...` pattern |
| No integration test today proves an AA Agreement can reach a Budget-Team-approved AWARD step through the real wizard (existing `is_awarded` tests construct `ProcurementAction` directly, bypassing the wizard) — the "AA just works" assumption is model-level, not empirically confirmed | Med | Med | Confirm early in implementation (spike or first AA integration test) before building the aggregation on top of it; see [Assumptions](#assumptions) |

## Notes

### Open Questions

These are UI-detail decisions not yet made, intentionally left for team review (not blocking the overall approach above):

- [ ] **Sort order** of accordions — oldest-first (award, then mods in chronological order, matching how the mockup's single example reads top-to-bottom) vs. newest-first (most recent activity on top, typical for a "history" view)?
- [ ] **Default open/closed state** — mockup shows the (only) accordion open by default. With multiple entries, should all start closed (consistent with how `AgreementProcurementTracker.jsx`'s 6 step-accordions behave independently), or should the most recent one start open?
- [ ] **"Return to top" link** — no existing pattern for this in the frontend today (confirmed via repo-wide search). Build a small one-off anchor/scroll component, or drop it from MVP scope?
- [ ] Exact URL path/naming for the new backend endpoint and exact RTK Query hook name — should follow whatever convention the backend team prefers for agreement-scoped sub-resources.
- [ ] **AA-specific field labels** — does "Contract Total" / "Contract #" read correctly to users on an AA Agreement, or should the tab use more agreement-type-neutral labels (e.g. "Award Total")? The mockup only shows a Contract example. Existing screens (`AgreementMetaAccordion.jsx`) already reuse "Contract Type"/"Contract #" labels for AA today, so precedent favors keeping the labels as-is — needs explicit team sign-off, not an implementer's guess.
- [ ] **`AgreementType.MISCELLANEOUS` handling** — should the new route also get its own explicit guard (like `procurement-tracker`'s `isGrant ? <Navigate/> : ...`) so a Miscellaneous agreement can't even reach an error state via direct URL navigation, or is the backend's `agreement_type in {CONTRACT, AA}` rejection (plus a defined frontend error/redirect for that response) sufficient on its own? See [Decision 8](#key-decisions).
- [ ] **AA-through-the-wizard verification** — has anyone actually driven an AA Agreement through the tracker wizard to a Budget-Team-approved AWARD step with populated AWARD-step data? No existing test proves this is possible today (see [Assumptions](#assumptions) and [Risks](#risks-and-mitigations)) — worth confirming before or very early in implementation, since it's foundational to the AA half of this story actually being testable end-to-end.

### Future Improvements

- Add true per-award/mod-versioned Purchase Order # and Task Order # fields (likely new columns on `ProcurementAction` or the AWARD tracker step), so historical accuracy improves when these numbers legitimately change across modifications.
- Add a real, distinct SAM.gov Unique Entity ID column on `Vendor`, and correct the existing mislabeled `duns` usage across `AwardRequestForm.jsx`, `ApproveAwardApproval.jsx`, and this new tab in one follow-up pass.
- Reconcile the two currently-parallel requisition-tracking mechanisms (`Requisition` model vs. PRE_AWARD tracker step fields) so there's one source of truth going forward.

### References

- Reference mockup: `~/Downloads/Award Expanded Accordion.pdf`
- Related existing tab: `frontend/src/pages/agreements/details/AgreementProcurementTracker.jsx`
- Related existing screens reusing `vendor.duns` as "Unique Entity ID (SAM.gov ID)": `frontend/src/components/Agreements/AwardRequestForm/AwardRequestForm.jsx`, `frontend/src/pages/agreements/award-approval/ApproveAwardApproval.jsx`
- Precedent for reusing "Contract #"/"Contract Type" labels unchanged on AA Agreements: `frontend/src/components/Agreements/AgreementMetaAccordion/AgreementMetaAccordion.jsx`
- Precedent for explicit Contract/AA subtype branching in a shared-field query: `backend/ops_api/ops/services/agreements.py` (`_apply_agreement_specific_filters`)
- Testing philosophy: `docs/TESTING.md`
