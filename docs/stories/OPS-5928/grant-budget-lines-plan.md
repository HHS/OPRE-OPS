# Grant Budget Lines (OPS-5928)

## Context

**Ticket:** OPS-5928 — Grant Numbers & Budget Lines (Step 3 of Create Grant Agreement)
**Design ref:** `Step 3 - Grants Numbers & BLs Empty State (Grants).pdf`

Grant agreements currently cannot have budget lines created, edited, or deleted. On the "Create New Agreement" wizard (step 3) and the Agreement Details page, contract agreements show a Services-Component–grouped budget-line editor; grant agreements show only a **placeholder** ("You have not added any Budget Lines yet.") at `CreateBLIsAndSCs.jsx:470-473` (comment references #5928).

This feature makes Grant budget lines work **exactly like Contract budget lines, except the "Services Component" concept is replaced by "Grant Number."** A budget line on a grant agreement is associated with one of the agreement's Grant Numbers (the analog of a Services Component), and budget lines are grouped by Grant Number in the preview.

**Why now:** The branch `OPS-5928/grant-bli-numbers` already landed the entire Grant Numbers subsystem — the `GrantNumber` backend model + full CRUD, the frontend `GrantNumbers/` components, the AgreementEditor context reducer (`grant_numbers` / `deleted_grant_numbers_ids`), and the save-bundle slice emitting `grant_numbers: {create, update, delete}` with a `ref` field. The one gap left open is **linking a budget line to a grant number** end-to-end. This plan closes that gap.

**Scope:** Full-stack, split into **2 PRs**. Budget lines grouped by Grant Number (accordion), mirroring Contract UX.

## PR split (decided)

- **PR 1 — Backend (data layer / API contract).** The full linkage on the server: `grant_number_id` on `GrantBudgetLineItem`, migration, status-change override, schemas, ref resolution + create-ordering, service-layer validation, tests, OpenAPI. No user-visible change; fully testable via API/pytest. Ends in a correct state (API accepts the link; nothing renders it yet).
- **PR 2 — Frontend (all UI).** Everything user-facing: the write UI (create/edit/delete + grouping on the wizard and Agreement Details) **and** read/approval parity (grouping + validation across Review/Approve/Award-approval/Pre-award, the all-BLI table + XLSX export), plus the Cypress update.

**Why read/approval parity is in PR 2, not deferred:** grant agreements are **not** gated out of the approval flow — `isNotDevelopedYet` (`agreement.helpers.js:152-158`) only blocks DIRECT_OBLIGATION/IAA, and there is no `agreement_type` gate on submit-for-approval in `AgreementBudgetLines.jsx`. So the moment PR 2 enables grant BLI create/submit, a user can push a grant into Review/Approve. If those pages weren't fixed in the same PR, grant BLIs would show false "must be assigned to a services component" errors and ungrouped rows. Keeping all frontend in one PR avoids a broken intermediate state. (PR 1 → PR 2 has no broken state: PR 1 ships an unused-but-correct column.)

Deferred to a follow-up (not blocking either PR): `data_tools` loader/fixtures to seed `grant_number_id` on demo data. Nullable column → no import breakage; without it, loaded grant BLIs group as "unassociated" until backfilled.

---

## The Core Gap

Contract BLIs link to a Services Component via `services_component_id` (a column on the **base** `BudgetLineItem`) during editing, and via `services_component_ref` when the SC doesn't have a DB id yet (new-agreement / in-bundle create). **No `grant_number_id` / `grant_number_ref` counterpart exists.** Everything else (grant number creation, editor state, save-bundle grant_numbers slice) is already built and only needs the BLI linkage threaded through.

---

## Guiding principle: mirror the Services Component path, but place the FK where it belongs

`services_component_id` is threaded generically through every layer (schema → create/edit-bundle service → cleaner → form → grouping); we add `grant_number_id` in the parallel spots, substituting grant terms.

**One deliberate divergence:** `services_component_id` lives on the **base** `BudgetLineItem` for legacy reasons. `grant_number_id` goes on the **`GrantBudgetLineItem` subclass** — the only BLI type it is meaningful for. This is the more correct domain model, and the pipeline supports it (verified below). The asymmetry with `services_component_id` is accepted and should carry a one-line code comment explaining why.

Why the subclass is safe (verified against code):
- **Polymorphic constructor** `create_budget_line_item_instance` (`ops_api/ops/utils/budget_line_items_helpers.py:82`) does `factory(**data)` on the resolved subclass, so `GrantBudgetLineItem(grant_number_id=…)` is valid; ref-resolution just sets `loaded["grant_number_id"]` on a plain dict before the factory call.
- **PATCH** `update_data` (`budget_line_items_helpers.py:49-52`) only sets attrs present in the *instance's* `mapper.column_attrs`, so a stray `grant_number_id` on a contract BLI is silently skipped — no cross-type contamination.
- **Type safety bonus:** a contract PUT/POST carrying `grant_number_id` fails fast / is ignored rather than nulling a base column.
- **Note:** this is the first subclass-only field exposed via the shared request/response schema (existing grant subclass fields — `grant_year_number`, `bns_number`, etc. — are neither accepted nor serialized today), so add an explicit serialization test (below).

---

## PR 1 — Backend (data layer / API contract)

### 1. Model — `backend/models/budget_line_items.py`
Add `grant_number_id` to the **`GrantBudgetLineItem` subclass** (~line 538, alongside `details_id`/`grant_year_number`), NOT the base `BudgetLineItem`. Add a one-line comment noting the deliberate asymmetry with the base-level `services_component_id`.

```python
# On the subclass (not the base): a grant number only applies to grant BLIs.
# (services_component_id sits on the base for legacy reasons.)
grant_number_id -> ForeignKey("grant_number.id", ondelete="SET NULL"), Optional
grant_number = relationship("GrantNumber", backref="budget_line_items", passive_deletes=True)
```
`SET NULL` mirrors SC behavior (deleting a grant number nulls the link, doesn't cascade-delete BLIs). `backref="budget_line_items"` does not collide — it creates `GrantNumber.budget_line_items`, distinct from `ServicesComponent.budget_line_items` / `CLIN.budget_line_items` (backrefs live in the target class namespace). No denormalized sort-name / event-listener analog and no other new `GrantBudgetLineItem` fields — out of scope.

Also: **override `get_required_fields_for_status_change` on `GrantBudgetLineItem`** to require `grant_number_id` instead of `services_component_id` (base list at `budget_line_items.py:386-392` hardcodes `services_component_id`; without the override a grant BLI can never leave DRAFT). See Risk 6 below.

### 2. Migration — new file `backend/alembic/versions/YYYY_MM_DD_HHMM-<rev>_add_grant_number_id_to_grant_bli.py`
- `add_column` `grant_number_id` (Integer, nullable) on **`grant_budget_line_item`** AND on **`grant_budget_line_item_version`** (history table gets the column, no FK — matches existing version-table pattern).
- `create_foreign_key` to `grant_number` with `ondelete="SET NULL"` on the main (`grant_budget_line_item`) table only.
- `downgrade`: drop constraint + both columns. No enum changes.
- **`down_revision = e1f2a3b4c5d6`** (verified single head). **Autogenerate will likely drop `ondelete="SET NULL"`** — pass it explicitly and hand-verify the generated file (use `/db-migrations`).

### 3. Schemas — `backend/ops_api/ops/schemas/budget_line_items.py`
The request/response schemas are shared across all BLI types; a subclass-only field round-trips fine (verified — marshmallow returns `missing`→`None` for instances lacking the attr; `update_data` skips absent columns on PATCH).
- `RequestBodySchema`: add `grant_number_id = fields.Int(allow_none=True)` next to `services_component_id` (flows to POST/PATCH). Add to `PUTRequestBodySchema` with `load_default=None`.
- `NestedBudgetLineItemRequestSchema`: add `grant_number_ref` (Str, allow_none, load_default=None), mirroring `services_component_ref`. Extend the `@validates_schema` to reject `grant_number_id` + `grant_number_ref` together AND to reject mixing SC and grant linkage on the same BLI (defensive; the frontend only emits one).
- `BudgetLineItemResponseSchema` (and `BudgetLineItemListResponseSchema`): serialize `grant_number_id` (`fields.Int(dump_default=None, allow_none=True)`) AND the grant number's `number` (nested or a resolved field) so the frontend can regroup after refetch — see Risk 7 (id-vs-number). Add a unit test asserting a contract BLI dumps `grant_number_id: null` (first subclass-only field via the shared schema). (`grant_number_number`/`grant_number_ref` are UI-only, not serialized.)

### 4. Ref resolution — mirror the existing `services_component_ref` blocks
Both service paths already build a `gn_ref_map` (ref → new grant number id) and create grant numbers **before** BLIs; they just don't consume the map in the BLI path.
- **Edit-bundle** `backend/ops_api/ops/services/agreement_edit_bundle.py`: capture the map at line 118 (currently `_, created_gn_count = self._create_grant_numbers(...)`), thread `gn_ref_map` into `_create_budget_line_items` (~261) and `_update_budget_line_items` (~287), and add a `grant_number_ref` resolution block identical to the `services_component_ref` blocks at ~271-282 and ~299-310.
- **Atomic create** `backend/ops_api/ops/services/agreements.py`: ensure grant numbers are created before BLIs (reorder if needed — SC path is the model), capture `gn_ref_map`, and add the same `grant_number_ref → grant_number_id` resolution in `_create_budget_line_items`.
- Run `/sync-openapi` after schema changes.

### 5. Service-layer validation — `backend/ops_api/ops/services/budget_line_items.py`
Mirror the SC ownership check (`_validation`, ~line 786-788, "Services Component does not belong to the Agreement") with a **grant-number-belongs-to-agreement** check. Because the schema can't see agreement type, add type-aware validation here: reject a grant `grant_number_id` that belongs to a different agreement, and reject SC/grant linkage that doesn't match the agreement type. (Not optional — closes the cross-agreement-link hole.)

### 6. Backend tests
Mirror the existing `services_component_ref` tests for the atomic-create and edit-bundle paths; add: a model/migration round-trip test for `grant_number_id`; a test that a grant BLI with `grant_number_id` (no SC) passes status-change validation and one that it's blocked without; a serialization test that a contract BLI dumps `grant_number_id: null`; a validation test for cross-agreement grant-number rejection.

---

## PR 2 — Frontend (all UI: write + read/approval parity)

### 7. New context-driven select — `frontend/src/components/GrantNumbers/AllGrantNumberSelect/AllGrantNumberSelect.jsx` (+ index.js, + test)
Model on `ServicesComponents/AllServicesComponentSelect/AllServicesComponentSelect.jsx`. Read `grant_numbers` from `useEditAgreement()` context (**not** the hardcoded `GRANT_NUMBER_OPTIONS`). Build options `{ value: gn.number, label: gn.display_title ?? \`Grant ${gn.number}\` }` sorted by number. Reuse `UI/Form/Select`, `name="allGrantNumberSelect"`, `label="Grant Number"`. Distinct from the existing dumb `GrantNumberSelect` (which takes `options` as a prop for the grant-number editor form).

### 8. Reuse `BudgetLinesForm` with a grant variant — `frontend/src/components/BudgetLineItems/BudgetLinesForm/BudgetLinesForm.jsx`
The form is ~95% identical (CAN, amount, obligate-by-date, description); only the first select differs. Add an `isGrant` prop: when true, render `<AllGrantNumberSelect>` and validate `allGrantNumberSelect`; else render `<AllServicesComponentSelect>`. Keep a second state pair for the grant key to avoid cross-contamination. In `CreateBLIsAndSCs.jsx`, remove the `!isGrant` guard at line 432 so the form renders for grants, passing `isGrant`.

### 9. Thread grant-number key onto temp BLIs — `CreateBLIsAndSCs.hooks.js`
Add `grant_number_number` (mirror `services_component_number`; grouping label is just `String(number)` since grant numbers have no sub-component). Add `grantNumberNumber`/`setGrantNumberNumber` state. Touch the SC analogs:
- `handleAddBLI` / `handleEditBLI`: set `grant_number_number` (+ grouping label) on grant temp BLIs. **CONFIRMED: `handleEditBLI` (lines 614-615) unconditionally re-stamps `services_component_number` + `serviceComponentGroupingLabel` — for grants this must be guarded/replaced, else an edited grant BLI is rewritten as "SC 0".**
- `handleSetBudgetLineForEditingById`: prepopulate the grant number.
- Initial hydration effect (~149-162): for grants, resolve `grant_number_number` from `grantNumbers.find(gn => gn.id === bli.grant_number_id)?.number`.
- Add `addGrantNumberIdToBLI(bli, createdGrantNumbers)` analog of `addServiceComponentIdToBLI` (resolve `grant_number_id` by matching `number`, strip UI-only fields).
- `cleanBudgetLineItemForApi` (`frontend/src/helpers/agreement.helpers.js`): strip `grant_number_number` and coerce `grant_number_id === 0` → `null`, mirroring the SC lines (365, 385). (Blocklist cleaner — a forgotten `grant_number_number` leaks to the API; also prevents the JSON.stringify dirty-check at hooks.js:219-221 from flagging unchanged grant BLIs.)
- **Mount-time baseline decoration** (hydration effect ~149-162): decorate baseline BLIs with `grant_number_number` for grants too, so the dirty-check compares like-with-like (else every unchanged grant BLI looks changed → spurious PATCH/approval prompts).

### 10. Grouped preview — replace placeholder at `CreateBLIsAndSCs.jsx:470-473`
- Add `groupByGrantNumber(budgetLines, grantNumbers)` to `frontend/src/helpers/budgetLines.helpers.js`, modeled on `groupByServicesComponent` (keyed on `grant_number_number`/`grant_number_id`; group "0" = "BLs not associated with a Grant Number").
- Add `groupedBudgetLinesByGrantNumber` state + recompute effect in the hook (mirror lines 85, 164-166).
- New `frontend/src/components/GrantNumbers/GrantNumberAccordion/GrantNumberAccordion.jsx` (+ index, + test), modeled on `ServicesComponentAccordion` — heading `Grant {number}`, wrapping `<BudgetLinesTable>`.
- Replace the placeholder branch with the grant grouped render (mirror lines 474-497). Note the SC render passes SC-only props (`serviceRequirementType`, `optional` via `findIfOptional`) — `GrantNumberAccordion` must NOT reuse `ServicesComponentAccordion` (its title uses `formatServiceComponent`); build a distinct component.

### 11. Wire the link into ALL THREE save paths
CONFIRMED there are **three**, not two — the existing-agreement `handleSave` branch was missed originally.
- **New-agreement `handleSave`** (`CreateBLIsAndSCs.hooks.js` ~884-908): for each new grant BLI, match `newGrantNumbers.find(gn => gn.number === bli.grant_number_number)` and emit `grant_number_ref: matched?.ref` (mirror the SC block ~867-882). Strip `grant_number_number`.
- **Existing-agreement `handleSave`** (`CreateBLIsAndSCs.hooks.js` ~912-969): this branch routes ALL BLIs through `addServiceComponentIdToBLI` (lines 941-947), which returns `services_component_id: null` and NO grant link for grants. Branch to `addGrantNumberIdToBLI` for grant agreements (resolves `grant_number_id` from just-created grant numbers). **This is the primary Agreement-Details edit path — without it, edited grant BLIs save with no grant reference.**
- **Edit-bundle `getSlice()`** (`CreateBLIsAndSCs.jsx` ~260-293): add `linkBliToGrantNumber(bli)` (persisted → `{grant_number_id}`, in-bundle new → `{grant_number_ref}`) and an `applyGnLink` analog that drops a stale `grant_number_id` when emitting a ref; apply to `newBlis` and `updatedBlis`. Remove the "no BLI linkage this slice" comment.

### 12. Vest validation — `BudgetLinesForm/suite.js`
Add an `allGrantNumberSelect` group following vest v6 rules: `enforce(data.grantNumberNumber).isNotNullish().greaterThan(0)`. **Pass `isGrant` into BOTH `budgetFormSuite.run(...)` call sites (lines 70 AND 102) and skip the non-applicable select group bidirectionally** (skip grant group for contracts, SC group for grants) — otherwise the inactive select's null value permanently fails and disables the Add button. Update `BudgetLinesForm.jsx` `getErrors` to read `allGrantNumberSelect` for grants. (Note: the error string is passed literally to `Select` via `messages`, so no `convertCodeForDisplay` label-map change is needed — verified.) The page-level `CreateBLIsAndSCs/suite.js` needs no new key.

### 13. Read/approval-surface parity (grants are NOT gated out — required in this PR)
Grouping + validation currently key on `services_component_id` across the read/approval views. Add the grant equivalent (reuse the `groupByGrantNumber` helper from §10, branch by `agreement_type`):
- **Grouping (use `groupByGrantNumber` when grant):** `pages/agreements/details/AgreementBudgetLines.jsx` (:152 id→number map, :161 group, :285 accordion), `pages/agreements/review/ReviewAgreement.hooks.js` (:53, :128), `pages/agreements/approve/ApproveAgreement.hooks.js` (:321/331, :344/354), `pages/agreements/pre-award-approval/usePreAwardApprovalData.js` (:44, :48). Each needs the grant-number list available (via `useGetGrantNumbersListQuery` / editor-context reseed) to resolve `grant_number_id`→`number`.
- **Validation gating (type-aware):** `pages/agreements/review/suite.js` (:63 "assigned to a services component" test) — for grants require `grant_number_id` instead; `components/BudgetLineItems/BLIReviewTable/BLIReviewRow.jsx` (:66 `!services_component_id` → red error) — use grant field for grants.
- **All-BLI table + export:** `components/BudgetLineItems/AllBudgetLinesTable/AllBLIRow.jsx` (:32 `useGetServicesComponentDisplayName`) and the XLSX export in `helpers/budgetLines.helpers.js` (:380-402) — show the grant number for grant BLIs (blank SC cell today).

### 14. Types — `frontend/src/types/BudgetLineTypes.d.ts`
Add `grant_number_id?: number`, `grant_number_number?: number` (UI-only), `grant_number_ref?: string` (UI-only). (`/sync-openapi` does NOT touch this hand-written file — add manually.)

### 15. Cypress — `frontend/cypress/e2e/createGrantAgreement.cy.js`
Update the spec: the empty-state assertion at :117-118 ("You have not added any Budget Lines yet.") breaks once §10 replaces the placeholder. Add coverage for adding/editing/deleting a grant BLI and asserting the `grant_number_ref`/`grant_number_id` in the request payload.

---

## Recommended build order

**PR 1 — Backend**
1. Model: `grant_number_id` on `GrantBudgetLineItem` + `get_required_fields_for_status_change` override + migration (verify single `alembic head` first).
2. Schemas (`grant_number_id`, `grant_number_ref`, response w/ `number`).
3. Ref resolution (edit-bundle + atomic create, incl. create-ordering fix) + service-layer validation.
4. `/sync-openapi` + backend tests.

**PR 2 — Frontend**
5. Types + `AllGrantNumberSelect`.
6. `BudgetLinesForm` grant variant + Vest suite (both run sites, bidirectional skip).
7. Hook threading (add/edit/edit-by-id/hydration/baseline-decoration/clean/`addGrantNumberIdToBLI`).
8. `groupByGrantNumber` helper + `GrantNumberAccordion` + replace placeholder.
9. All three save paths.
10. Read/approval-surface parity (Details/Review/Approve/Pre-award grouping; review suite + `BLIReviewRow`; all-BLI table + export).
11. Cypress update + frontend tests + lint/format.

---

## New vs Modified files

**PR 1 — Backend**
- New: one alembic migration (`grant_budget_line_item` + version table).
- Modified: `models/budget_line_items.py`, `schemas/budget_line_items.py`, `services/agreement_edit_bundle.py`, `services/agreements.py`, `services/budget_line_items.py` (validation), `openapi.yml` (via /sync-openapi), + backend tests.

**PR 2 — Frontend**
- New: `GrantNumbers/AllGrantNumberSelect/` (jsx + index + test), `GrantNumbers/GrantNumberAccordion/` (jsx + index + test).
- Modified (write UI): `helpers/budgetLines.helpers.js` (`groupByGrantNumber` + export), `helpers/agreement.helpers.js` (cleaner), `BudgetLinesForm/BudgetLinesForm.jsx`, `BudgetLinesForm/suite.js`, `CreateBLIsAndSCs/CreateBLIsAndSCs.jsx`, `CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js`, `types/BudgetLineTypes.d.ts`.
- Modified (read/approval parity): `pages/agreements/details/AgreementBudgetLines.jsx`, `pages/agreements/review/ReviewAgreement.hooks.js`, `pages/agreements/review/suite.js`, `pages/agreements/approve/ApproveAgreement.hooks.js`, `pages/agreements/pre-award-approval/usePreAwardApprovalData.js`, `components/BudgetLineItems/BLIReviewTable/BLIReviewRow.jsx`, `components/BudgetLineItems/AllBudgetLinesTable/AllBLIRow.jsx`.
- Modified (E2E): `cypress/e2e/createGrantAgreement.cy.js`.

**Deferred follow-up:** `data_tools` grant BLI loader + fixtures to seed `grant_number_id`.

---

## Risks & Notes
1. **Editor state keys grant numbers by `number`, not DB `id`** (like SC). Temp BLIs reference by `grant_number_number`. DB enforces unique `(agreement_id, number)`, so this is safe.
2. **BLI referencing a not-yet-persisted grant number:** solved by the `ref` mechanism (already built for grant numbers), resolved to id backend-side after grant numbers flush. Grant numbers MUST be created before BLIs (already true in edit-bundle; verify in atomic create).
3. **Mutual exclusivity:** a BLI carries at most one of SC/grant linkage; enforce defensively in `NestedBudgetLineItemRequestSchema`.
4. **Suite gating:** must skip the inactive select group by `isGrant`, or the Add button never enables.
5. **Agreement Details page (`workflow === "none"`) refetch grouping:** confirm it reseeds `grant_numbers` into editor context (RESEED_GRANT_NUMBERS) so persisted grant BLIs group correctly rather than falling into the "unassociated" bucket.
6. **CONFIRMED — status-change blocker (must fix):** `get_required_fields_for_status_change` (`budget_line_items.py:386-392`) hardcodes `services_component_id` for ALL BLI types. Override it on `GrantBudgetLineItem` (require `grant_number_id`), else grant BLIs can never leave DRAFT.
7. **CONFIRMED — id-vs-number regroup mismatch (must fix):** read-side grouping resolves a BLI's grant/SC by looking up the object by id then reading `.number` (e.g. `AgreementBudgetLines.jsx:152`). A refetched grant BLI carries only `grant_number_id`, so the response must serialize `grant_number_id` AND the grouping code must resolve it to `.number` against the grant-number list — otherwise saved grant BLIs land in the ungrouped bucket after reload.

8. **CONFIRMED — three save paths, not two:** the existing-agreement `handleSave` branch (hooks.js:912-969) was originally missed; it nulls the grant link via `addServiceComponentIdToBLI`. All three paths are covered in §11.
9. **CONFIRMED — read/approval parity in scope:** grants reach Review/Approve/Pre-award (not gated by `isNotDevelopedYet`); §13 covers grouping + validation there. Skipping it would surface false "assigned to a services component" errors on grant BLIs.

---

## Verification

**PR 1 — Backend**
- `cd backend/ops_api && pipenv run pytest` (ref-resolution on atomic-create + edit-bundle; status-change with/without `grant_number_id`; contract-BLI-dumps-null serialization; cross-agreement grant-number rejection). `pipenv run nox -s lint`.
- Apply the migration on a fresh DB; confirm `grant_number_id` round-trips (POST + PATCH + edit-bundle) via API. Validate OpenAPI: `./backend/validate_openapi.sh`.

**PR 2 — Frontend**
- `cd frontend && bun run test --watch=false` (≥90% coverage; co-locate tests for new components), `bun run lint --fix`, `bun run format`.
- **E2E / manual** (requires PR 1 merged / backend running): full stack (`docker compose up --build`), create a Grant agreement → add Grant Numbers → add budget lines each associated with a Grant Number; verify grouping under the correct Grant Number accordion, edit a BLI's grant number + amount, delete a BLI, save — confirm `grant_number_id` persists after reload on **all three** save paths (new-agreement wizard, Agreement-Details edit, review edit-bundle). Then submit for approval and confirm the Review/Approve pages group grant BLIs by grant number with no false "services component" validation errors.
