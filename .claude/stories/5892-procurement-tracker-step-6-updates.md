---
issue: 5892
branch: OPS-5892/procurement-tracker-step-6-updates
---

# Procurement Tracker Step 6 (Award) — Request Award Approval Updates

## Story Overview

**Ticket:** OPS-5892
**Title:** Procurement tracker step 6 updates (Request Award Approval / COR Request)
**Design:** `Step 6 - Award - COR Request.pdf` · [Figma](https://www.figma.com/design/dsQFe6G2KjcTWNq7NNZujm/OPRE-OPS?node-id=24912-21301)

> **Status:** Product decisions resolved (see [Resolved Decisions](#resolved-decisions)). This plan
> has been adversarially reviewed against the code; the "Apply title at approval" decision removes
> the earlier two-mutation atomicity risk on the request side.

## Background

### Current State
Step 6 (Award) of the Procurement Tracker links a COR/requester out to the **Request Award
Approval** page (`/agreements/:id/award-approval`), which renders the shared `AwardRequestForm`
component. It today collects: **Add CLINs to Budget Lines**, **Vendor Information**, **Current
Award Information** (Contract #, Award Amount, Award Date), a disabled **Upload Signed Award**
placeholder, and **Notes (Optional)**.

On submit, the requester PATCHes step 6 with `{ approval_requested, approval_requested_date,
requestor_notes, vendor_id, contract_number, award_amount, award_date }`. The Budget Team reviews
these read-only on **Approve Award Approval** (`/agreements/:id/review-award`) and, on approval,
transitions Executing BLIs → Obligated and the agreement → Awarded.

### Desired State (per design + issue + resolved decisions)
1. **New "Update Agreement Title" accordion** (between *Add CLINs* and *Vendor Information*) with
   instructional text and an input pre-filled with the current agreement title. Copy from design:
   > "Enter the Agreement Title to match the signed award exactly. This will over write the
   > agreement title currently entered and it will be locked from editing after this step. You
   > will still be able to edit the Agreement Nickname at anytime."

   The entered title is stored **on step 6** as a proposed title and applied to `agreement.name`
   **only when the Budget Team approves** (Decision D4).
2. **Modification #** dropdown under *Current Award Information* — `Base` + `P00001…P00020`,
   default `Base` (Decision D1).
3. **Purchase Order #** field (= ODN) under *Current Award Information*.
4. **Task Order #** field under *Current Award Information*.

Annotations (Notes) already exist; no change beyond confirming placement.

### User Story
As a COR requesting award approval, I want to record the signed-award title, modification #,
purchase order # (ODN), and task order # so the Budget Team can confirm everything matches the
award exactly before the agreement is marked Awarded.

### Acceptance Criteria
- [ ] "Update Agreement Title" accordion renders with the exact copy and a text input pre-filled
      with the current agreement title, on both the Request and Edit pages.
- [ ] Modification # renders as a dropdown (`Base` + `P00001…P00020`, default `Base`).
- [ ] Purchase Order # and Task Order # render as text inputs under Current Award Information.
- [ ] **All four** new fields (Title, Modification #, Purchase Order #, Task Order #) are required
      to submit for approval (Decision D2).
- [ ] All new values persist on step 6 through submit and re-display on the Edit page.
- [ ] Budget Team can edit all four fields on the Edit Award Approval page (Decision D3).
- [ ] The Approve/Review page shows the proposed title (old → new) plus the 3 new award fields,
      read-only.
- [ ] On Budget Team approval, `agreement.name` is set to the proposed title (then locked by
      existing awarded-agreement immutability).
- [ ] Backend persists the new fields on the step and returns them on GET; Alembic migration adds
      the columns; unit tests updated; lint/format/tests pass.

## Resolved Decisions

| # | Decision | Choice |
|---|----------|--------|
| D1 | Modification # options | **Full dropdown per design:** `Base` + `P00001…P00020`, default `Base`. Note: this is a decoupled label with **no backend meaning yet** (not linked to `ProcurementAction`/`AwardType`); the mod feature isn't built. |
| D2 | Required-to-submit | **All four new fields required:** Agreement Title, Modification # (defaults Base), Purchase Order #, Task Order #. |
| D3 | Budget Team edit on Edit page | **All editable by Budget Team** — Title, Modification #, Purchase Order #, Task Order # are all editable on the Edit Award Approval page. |
| D4 | Title write timing + lock | **Apply at approval.** Store the proposed title on step 6; write `agreement.name` only when the Budget Team approves, at which point existing awarded-agreement immutability locks it. No new lock rule needed. |

### Consequences of D4 (important)
- The **agreement title is stored on the step** (new column `award_agreement_title`), NOT written
  to `agreement.name` at COR submit. This means:
  - The request-side submit stays a **single step PATCH** — no separate `updateAgreement` call, so
    the earlier two-mutation atomicity concern disappears on the request/edit paths.
  - The write to `agreement.name` happens in the **backend approval handler**
    (`_handle_award_approval`), by direct model mutation (which bypasses `AgreementsService.update`
    and its `ImmutableAwardedFieldsRule`, so ordering vs. `is_awarded` is not a problem).
  - After approval, `name` is immutable because `get_required_fields_for_awarded_agreement()`
    includes `"name"` (`backend/models/agreements.py:720-728`) and the awarded validator enforces
    it once `agreement.is_awarded` (`ops_api/ops/services/agreements.py:416-418`).
  - **Decline → re-request:** the proposed title lives on the step and is fully editable until an
    actual approval; nothing is written to `agreement.name` until approval, so re-requests are safe.

## Technical Context

### Key term
> **Purchase Order # = ODN** (Obligating Document Number) to the Budget Team — general term across
> agreement types (contract → PO #, grant → different #, AA → order #). Surfaced as **Purchase
> Order #** in the UI, stored generically on the step.

### Domain note — approvals are NOT change requests
The award-approval workflow is modeled as prefixed columns on `DefaultProcurementTrackerStep`,
driven through the single `PATCH /procurement-tracker-steps/<id>` endpoint (not `ChangeRequest`).
New fields follow the same `award_*`-column → generic-API-name mapping pattern.

### Verified-OK (no action needed)
- `agreement.name` is **not** unique (only `nick_name` is — `models/agreements.py:185-186`): no
  title-collision risk.
- COR / PO / team members are authorized to PATCH the agreement (not needed at submit anymore under
  D4, but confirmed).
- Backend field-mapping surface is award-only: `_remove_award_fields`, the single award `to_dict`
  branch, `ProcurementTrackerStepResponseSchema`, and `ProcurementTrackerStepSchema`. The
  notification schema and the pre-award (step 5) parallel do **not** need these fields.

### Related components / files
**Frontend — shared form (Request + Edit):**
- `frontend/src/components/Agreements/AwardRequestForm/AwardRequestForm.jsx` (+ `.test.jsx`)
- `frontend/src/components/Agreements/AwardRequestForm/awardForm.helpers.js` — add
  `getModificationOptions()` (Base + P00001–P00020).

**Frontend — Request page (COR):**
- `frontend/src/pages/agreements/award-approval/RequestAwardApproval.jsx`
- `RequestAwardApproval.hooks.js`, `RequestAwardApproval.suite.js`, `RequestAwardApproval.hooks.test.js`

**Frontend — Edit page (Budget Team):**
- `EditAwardApproval.jsx`, `EditAwardApproval.hooks.js` (uses `RequestAwardApproval.suite.js`)

**Frontend — Approve/review page (Budget Team read-only):**
- `ApproveAwardApproval.jsx` (Current Award Information review row at `:194-216`; page subtitle at `:105`)

**Frontend — misc:**
- `frontend/src/types/ProcurementTrackerTypes.d.ts` — extend `ProcurementTrackerAwardStep`.
- `frontend/src/api/opsAPI.js` — `useUpdateProcurementTrackerStepMutation` (existing). No
  `useUpdateAgreementMutation` needed on request/edit under D4.

**Backend:**
- `backend/models/procurement_tracker.py` — new `award_*` columns; `_remove_award_fields()`;
  award `to_dict()` mapping (~lines 1035-1056).
- `backend/ops_api/ops/schemas/procurement_tracker_steps.py` — add to
  `ProcurementTrackerStepPatchRequestSchema`, `ProcurementTrackerStepResponseSchema`,
  `ProcurementTrackerStepSchema` (+ their award `pre_dump` mappings).
- `backend/ops_api/ops/services/procurement_tracker_steps.py` — add fields to the `"award"`
  field→column mapping in `update()`; **apply the title in `_handle_award_approval`** (set
  `agreement.name = award_agreement_title` on approval).
- New Alembic migration (via the `db-migrations` skill).

## Implementation Plan

### Backend — data model
Add nullable columns to `DefaultProcurementTrackerStep`, mirroring `award_contract_number`:

| Column                        | Type          | Notes                                  |
|-------------------------------|---------------|----------------------------------------|
| `award_agreement_title`       | `String`      | Proposed title; applied to `agreement.name` at approval. Match `agreement.name` (unbounded `String`). |
| `award_modification_number`   | `String(20)`  | e.g. `"Base"`, `"P00001"`              |
| `award_purchase_order_number` | `String(100)` | ODN                                    |
| `award_task_order_number`     | `String(100)` |                                        |

- Map to generic API names `agreement_title`, `modification_number`, `purchase_order_number`,
  `task_order_number` in the award branch of `to_dict()` and schema `pre_dump` (follow the exact
  `contract_number` pattern).
- Add all four to `_remove_award_fields()` so non-award step types exclude them.

### Backend — service
- `ProcurementTrackerStepService.update()`: extend the `"award"` API-field → column mapping with
  the four new fields.
- `_handle_award_approval` (the approval branch): when the step transitions to approved, set
  `agreement.name = step.award_agreement_title` (guard: only if non-empty), so the title is
  applied exactly at award. Add an OpsEvent/audit note consistent with existing approval handling.
- Confirm `award_agreement_title` is required only at the *request* boundary if backend validation
  is desired; the frontend enforces the four required fields, but consider a validation rule so the
  API can't approve/complete with a blank proposed title (see Testing).

### Backend — schemas
- `ProcurementTrackerStepPatchRequestSchema`: `agreement_title` (`String`, `required=False`,
  `allow_none=True`), `modification_number` (`Length(max=20)`), `purchase_order_number`
  (`Length(max=100)`), `task_order_number` (`Length(max=100)`).
- `ProcurementTrackerStepResponseSchema` + `ProcurementTrackerStepSchema`: add the four fields and
  map in the award `pre_dump` branch.
- **`preserve_keys` (do not skip — GET-parity fix):** the `@post_dump remove_none_values`
  (`ProcurementTrackerStepResponseSchema:409`) drops any `None`-valued key not in the step's
  `preserve_keys` set, so a null field is *omitted* from GET rather than returned as `null`. Add all
  four new generic names (`agreement_title`, `modification_number`, `purchase_order_number`,
  `task_order_number`) to the **AWARD** `preserve_keys` set in **both**
  `ProcurementTrackerStepResponseSchema` (`~:352-371`) and `ProcurementTrackerStepSchema`
  (`~:718-738`), matching how `contract_number`/`award_amount`/etc. are listed. Also add them to the
  non-award `else`-branch pop-list (`~:401-407`) for parity, so non-award step types keep excluding
  them. (Low functional impact — Mod # always defaults to `"Base"` and edit-seed uses truthy checks
  — but keeps the new fields behaving identically to their neighbors.)

### Backend — migration
Use the `db-migrations` skill to autogenerate + hand-verify a migration adding the four nullable
columns. Confirm upgrade/downgrade; run backend suite.

### Frontend — `AwardRequestForm.jsx`
1. New controlled props (no local state): `agreementTitle`/`onAgreementTitleChange`,
   `modificationNumber`/`onModificationNumberChange`, `purchaseOrderNumber`/`on…`,
   `taskOrderNumber`/`on…`. Update JSDoc.
2. Insert **"Update Agreement Title"** `<Accordion>` after the CLINs accordion, before Vendor
   Information, with the exact copy and a text input bound to `agreementTitle` + Vest validation.
   Render in **both** request and edit modes (D3 — Budget Team edits it too); do NOT gate with
   `!isEditMode`.
3. In **Current Award Information**, add: **Modification #** `<select>` (options from
   `getModificationOptions()`, default `Base`), **Purchase Order #** text input, **Task Order #**
   text input — matching the existing `grid-row grid-gap` / `grid-col-4` layout and PDF order
   (Contract #, Award Amount, Modification #, Purchase Order #, Task Order #, Award Date). All wired
   to `runValidate`.

### Frontend — Request hooks (`RequestAwardApproval.hooks.js`)
- **Add a seed-once effect** (the Request hook currently has none): seed `agreementTitle` from
  `agreement?.name` when the agreement loads; default `modificationNumber = "Base"`;
  `purchaseOrderNumber`/`taskOrderNumber` default `""`. Guard with an `isSeeded` flag like the Edit
  hook, to avoid clobbering user edits on refetch.
- **Fix `hasChanged` (blocker misfire risk):** diff against seeded/default values, not `""` —
  `agreementTitle !== (agreement?.name ?? "")`, `modificationNumber !== "Base"`,
  `purchaseOrderNumber !== ""`, `taskOrderNumber !== ""`. Do NOT use `agreementTitle !== ""`
  (would make the form permanently dirty and pop the unsaved-changes modal on every navigation).
- `handleSubmit`: add `agreement_title`, `modification_number`, `purchase_order_number`,
  `task_order_number` to the **step PATCH** `data`. No separate agreement mutation (D4).
- Submit gate + button `disabled`: require all four new fields non-empty (D2). **Also add the four
  fields to the `allData` validation object in `handleSubmit` (`~:189-194`)** — today it only runs
  `vendor/contractNumber/awardAmount/awardDate`, so without this the submit gate won't catch an
  empty title/mod/PO/task-order even though the Vest suite defines the rules.
- Return new state/setters; pass through in `RequestAwardApproval.jsx`.

### Frontend — Edit hooks (`EditAwardApproval.hooks.js`)
- Seed the four fields from `step6.agreement_title` / `.modification_number` /
  `.purchase_order_number` / `.task_order_number` (fall back `agreement_title` → `agreement.name`
  if the step value is null for legacy rows) in the existing seed effect.
- Add them to `hasChanged` (diff vs. seeded) and to the save PATCH `data`.

### Frontend — validation suite (`RequestAwardApproval.suite.js`)
- Add required tests: `agreementTitle` (`isNotEmpty`), `modificationNumber` (`isNotEmpty`),
  `purchaseOrderNumber` (`isNotEmpty`), `taskOrderNumber` (`isNotEmpty`). Add length caps matching
  DB columns (Mod # ≤ 20; PO #/Task Order # ≤ 100). Since this suite is shared with Edit, verify
  Edit's submit gate still behaves (Edit already resets the suite on mount).

### Frontend — Approve/review page (`ApproveAwardApproval.jsx`)
- Add read-only rows for **Modification #**, **Purchase Order #**, **Task Order #** in the Current
  Award Information review block.
- Add an explicit **Agreement Title** review affordance showing **old → new** (current
  `agreement.name` vs. proposed `step6.agreement_title`) so the Budget Team can confirm the change
  before approving — the page subtitle alone is insufficient.

### Frontend — types
- Extend `ProcurementTrackerAwardStep` in `ProcurementTrackerTypes.d.ts` with `agreement_title`,
  `modification_number`, `purchase_order_number`, `task_order_number`.

## Testing Strategy

> Consult `docs/TESTING.md` decision matrix before adding tests.

### Unit / component
- [ ] `AwardRequestForm.test.jsx`: renders the title accordion + exact copy; renders Modification #
      select (Base default + full option list), Purchase Order #, Task Order #; fires change/validate
      handlers; renders in **both** request and edit modes.
- [ ] `RequestAwardApproval.hooks.test.js`:
  - seed-once populates title/Base and does not clobber edits on refetch;
  - **`hasChanged` is false on a pristine seeded form** (regression for the blocker-misfire fix) and
    true after editing any new field;
  - all four fields flow into the step PATCH payload;
  - submit gate blocks when any of the four required fields is empty.
  - If touching the `useBlocker`/`flushSync` guard, apply the `useblocker-bypass-regression-test` skill.
- [ ] Edit hooks: seeding (incl. legacy `agreement.name` fallback) + save PATCH include the four fields.
- [ ] Backend: `to_dict()` maps the four award fields; PATCH schema accepts + persists; response
      schema returns them; service `update()` maps API names → columns; **`_handle_award_approval`
      sets `agreement.name` from the proposed title on approval**; migration up/down.
- [ ] If a Vest `test(...)` is added/renamed, apply the `vest-error-key-lifecycle` skill.

### Regression
- [ ] Existing Request/Edit/Approve award-approval tests still pass.
- [ ] Approving an award updates `agreement.name` and the field is then immutable via the awarded validator.

## Rollout / Sequencing
1. Backend: model + migration + schema + service (incl. approval-time title apply) + tests.
2. Frontend: types + `AwardRequestForm` + Request/Edit hooks (seed effect + `hasChanged` fix +
   required validation) + Approve view + tests.
3. Pre-commit: frontend `bun run format`, `bun run lint --fix`, `bun run test --watch=false`;
   backend `black`, `nox -s lint`, `pytest`.

## Deferred / lower-priority defaults (flag on review)
- **Title diff on review page:** included (old → new). Confirm exact placement with design.
- **Max lengths:** Mod # 20, Purchase Order # 100, Task Order # 100; Agreement Title unbounded
  `String` (matches `agreement.name`). Confirm with Budget Team.
- **Business-rule doc** (issue UX task, still open): update once implementation lands.

## Plan Review Reconciliation
A code-backed plan review (`5892-plan-review-findings.md`) raised four findings against an earlier
draft. Disposition against this (post-decision) plan:
- **#1 `hasChanged` blocker misfire (HIGH):** valid — addressed (seed-once effect + diff vs.
  seeded/default values); also added the reviewer's follow-on point (include the four fields in the
  `handleSubmit` `allData` validation object).
- **#2 Title write atomicity / decline-rollback (MED-HIGH):** **resolved by D4.** Title now stores
  on step 6 and is applied to `agreement.name` server-side only at approval — single step PATCH, no
  cross-entity frontend mutation, no partial-failure window, decline/re-request safe by construction.
- **#3 Accordion renders in Edit mode vs. lock rule (MEDIUM):** **resolved by D3 + D4.** Budget Team
  editing the title on Edit is intentional; the title isn't locked until approval, so there is no
  collision. Accordion renders in both modes.
- **#4 New fields stripped from GET when null (MEDIUM):** valid — added the `preserve_keys` /
  `else`-pop parity fix to the backend schema section above.
- **Minor (pre-existing, noted):** `handleCancel` omits `flushSync` (touch only if working the nav
  guard); `ApproveAwardApproval` renders `vendor_type` raw (new read-only rows are plain strings —
  no formatting expectation to copy); Notes is a bare `TextArea` hidden in edit mode, **not** an
  accordion — don't model it as one.

## Out of Scope
- Upload Signed Award remains the disabled placeholder ("Documents tab coming soon").
- Building the contract-modification feature (mod versions beyond Base have no backend effect yet).
- CLIN / Vendor / Award Amount / Award Date behavior (unchanged).
