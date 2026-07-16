# Plan: Create Grant Numbers (Vertical Slice #5927)

> Team context doc. 3rd vertical slice of [#787 "Create a Grant"](https://github.com/HHS/OPRE-OPS/issues/787), building on shipped [#5925](https://github.com/HHS/OPRE-OPS/issues/5925) (Type/Name/Nickname/Description) and [#5926](https://github.com/HHS/OPRE-OPS/issues/5926) (Grant Details, Step 2). This slice adds **Grant Numbers** — a repeatable child entity on **Step 3** of the Create Agreement wizard for GRANT agreements. Grant **Budget Lines** are [#5928](https://github.com/HHS/OPRE-OPS/issues/5928) — **out of scope here.**

## Context

Per the Figma design (Step 3 – Grants Numbers & BLs Empty State), a GRANT agreement's Step 3 shows a **"Create Grant Numbers"** section: a form (Grant Number picker with helper text "Placeholder grant # until award", Period of Performance Start/End dates, optional Description max 150 chars), an "Add Grant Number" button, and a list of added grant numbers with edit/delete. Below it is an **"Add Budget Lines"** section (empty-state only for this slice; the functional grant-BL form is #5928).

Today, Step 3 is **unreachable for grants**: #5926 hid the wizard "Continue" button for grants (`AgreementEditForm.jsx:750`) because Step 3 rendered nothing grant-aware and advancing would strand the in-progress grant. This slice makes Step 3 grant-aware AND re-enables Continue — the two must ship together.

Grant Numbers are structurally very similar to **Services Components** (the "what" of a Contract). We mirror the SC implementation but create a **dedicated `GrantNumber` model/table** so grant numbers don't inherit SC's contract-specific baggage (severable logic, "Services Component N" naming, the `ContractAgreement` event listener).

### Confirmed product decisions
- **Dedicated `GrantNumber` model** (new `grant_number` table), NOT reusing `services_component`.
- **Scope = Grant Numbers CRUD only** + make Step 3 reachable for grants. No grant-BL form or BL→GrantNumber linking (that's #5928); the "Add Budget Lines" section renders an empty-state placeholder for grants.
- **Grant Number = auto-sequential placeholder** picker ("Grant 1", "Grant 2", …), mirroring `ServicesComponentSelect`. Fields: Grant Number (sequential picker), Period of Performance Start (date), Period of Performance End (date), Description (optional, max 150).

### Architecture that governs this slice (verified against code)
- In the wizard, Services Components live in **React Context** (`AgreementEditorContext`), keyed by `number` — NOT persisted via their own RTK mutation during create. They ride along as a nested `services_components` array on `POST /agreements` (new agreement) or via the edit-bundle `PATCH /agreements/{id}/edit-bundle` (existing agreement). Grant Numbers follow the identical pattern.
- For a brand-new agreement, "Continue" does **not** persist (`saveAgreement` returns early when there's no `id`); everything is POSTed atomically when the user clicks "Create Agreement" on Step 3 (`CreateBLIsAndSCs.hooks.js` `handleSave`, `if (!agreement.id)` branch). Grant Numbers accumulate in context and are included in that single POST.

## Critical Files

**Backend (new):** `backend/models/grant_numbers.py`, `backend/ops_api/ops/schemas/grant_number.py`, `backend/ops_api/ops/services/grant_number.py`, `backend/ops_api/ops/resources/grant_number.py`, new Alembic migration.
**Backend (edit):** `backend/models/agreements.py` (relationship + `GrantAgreementResponse` note), `backend/models/__init__.py`, `backend/models/events.py`, `backend/ops_api/ops/auth/auth_types.py`, `backend/ops_api/ops/schemas/agreements.py`, `backend/ops_api/ops/schemas/agreement_edit_bundle.py`, `backend/ops_api/ops/services/agreements.py`, `backend/ops_api/ops/services/agreement_edit_bundle.py`, `backend/ops_api/ops/views.py`, `backend/ops_api/ops/urls.py`, plus **role seed data** (see §1.7).
**Frontend (new):** `frontend/src/components/GrantNumbers/` dir, `frontend/src/types/GrantNumbers.d.ts`.
**Frontend (edit):** `frontend/src/components/Agreements/AgreementEditor/AgreementEditorContext.hooks.js` + `AgreementEditorContext.jsx`, `frontend/src/api/opsAPI.js`, `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.jsx` + `CreateBLIsAndSCs.hooks.js`, `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.jsx`, `frontend/src/helpers/agreement.helpers.js` (defensive), `frontend/cypress/e2e/createGrantAgreement.cy.js`.

Reference the prior slice's plan for conventions: `docs/stories/OPS-5926/grant-details-plan.md`.

---

## 1. Backend

### 1.1 Model — new `backend/models/grant_numbers.py`
Mirror `backend/models/services_components.py:25-100` **minus all contract baggage** (no `optional`, `sub_component`, `display_name_for_sort`, `severable()`, and — critically — **NO `before_insert/before_update` event listener**; the SC listener at `services_components.py:103-115` queries `ContractAgreement` and would misfire on grants).

```python
class GrantNumber(BaseModel):
    __tablename__ = "grant_number"
    __table_args__ = (Index("ix_grant_number_unique", "agreement_id", "number", unique=True),)
    id: Mapped[int] = BaseModel.get_pk_column()
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String)
    period_start: Mapped[Optional[date]] = mapped_column(Date)
    period_end: Mapped[Optional[date]] = mapped_column(Date)
    agreement_id: Mapped[int] = mapped_column(Integer, ForeignKey("agreement.id", ondelete="CASCADE"))
    agreement: Mapped["Agreement"] = relationship("Agreement", back_populates="grant_numbers", passive_deletes=True)

    @property
    def display_title(self):
        return f"Grant {self.number}"

    @property
    def period_duration(self):
        return abs(self.period_end - self.period_start) if self.period_start and self.period_end else None

    @BaseModel.display_name.getter
    def display_name(self):
        return f"Grant {self.number}"
```
The single unique index `(agreement_id, number)` is what surfaces duplicate-number as a 400 via the service's `IntegrityError` handling — it **must** exist or duplicates silently succeed.

### 1.2 Register — `backend/models/__init__.py`
Add `from .grant_numbers import *` next to line 20 (`from .services_components import *`); give the new module an `__all__`. Required so the mapper configures, the auto-Marshmallow schema attaches, and the `Agreement.grant_numbers` relationship resolves.

### 1.3 Base Agreement relationship — `backend/models/agreements.py`
After the `services_components` relationship (lines 233-238):
```python
grant_numbers: Mapped[list["GrantNumber"]] = relationship(
    "GrantNumber", back_populates="agreement", lazy="selectin", cascade="all, delete",
)
```
(On the base `Agreement`, mirroring SC — the FK-level `ondelete="CASCADE"` + this cascade give delete-agreement → delete grant numbers.)

### 1.4 Migration — new file in `backend/alembic/versions/` (down_revision = current head `c1d2e3f4a5b6`)
Autogenerate then hand-adjust, modeled on `2025_02_20_2207-b5d03aa79d12` + the `services_component_version` block in `2024_08_19_2009-9be2fd1e3794_initial.py:2512-2552`. One revision containing:
1. `op.create_table("grant_number", ...)` — `id` PK, `number` (Integer, nullable=False), `description` (String), `period_start`/`period_end` (Date), `agreement_id` (Integer FK `agreement.id` ondelete CASCADE, nullable=False), plus audit cols `created_by`/`updated_by` (Integer FK `ops_user.id`) and `created_on`/`updated_on` (DateTime). Add `op.create_index("ix_grant_number_unique", "grant_number", ["agreement_id","number"], unique=True)`.
2. `op.create_table("grant_number_version", ...)` — same data cols all `autoincrement=False, nullable=True`, plus `transaction_id` (BigInteger, nullable=False), `end_transaction_id` (BigInteger), `operation_type` (SmallInteger, nullable=False), `PrimaryKeyConstraint("id","transaction_id")`, and the three Continuum indexes. (Continuum does NOT auto-migrate DDL — this table is hand-written. No separate `*_history` table is needed; `OpsDBHistory` is generic off `mapper.columns`.)
3. **Enum values**: add `CREATE_GRANT_NUMBER`, `UPDATE_GRANT_NUMBER`, `DELETE_GRANT_NUMBER` to the native PG `opseventtype` enum via `op.sync_enum_values(enum_schema="ops", enum_name="opseventtype", new_values=[<FULL existing list + 3 new>], affected_columns=[TableReference("ops","ops_event","event_type"), TableReference("ops","ops_event_version","event_type")], enum_values_to_rename=[])`. **Both** `ops_event` and `ops_event_version` columns must be listed. Pattern: `2025_01_16_2349-0536c9a5d32e_adding_new_opsevent_type.py:23-29`. `new_values` must be the complete value list, not just additions.
4. **Role permissions** (see verified finding — this is required, not optional): `op.execute(...)` `UPDATE ops.role SET permissions = array_append(...)` for `GET_/POST_/PUT_/PATCH_/DELETE_GRANT_NUMBER` on every role that currently has the matching `*_SERVICES_COMPONENT` string. Pattern: `2026_04_13_1940-c47768234303_add_perms_for_reviewer_approver.py:31-42`. **Without this, every `/grant-numbers/` call 403s.**

`downgrade()` reverses in order: drop role perms, revert enum, drop `grant_number_version`, drop index, drop `grant_number`.

Use the `/db-migrations` skill for the full workflow.

### 1.5 Permission enum — `backend/ops_api/ops/auth/auth_types.py:28`
Add `GRANT_NUMBER = auto()` after `SERVICES_COMPONENT`. **Note (verified):** the enum value alone is NOT sufficient — `authorization_providers.py:27-30` turns `(PermissionType.GET, Permission.GRANT_NUMBER)` into the string `"GET_GRANT_NUMBER"` checked against `user.roles[].permissions`. The migration (§1.4.4) and seed (§1.7) supply those strings.

### 1.6 Event types — `backend/models/events.py` (after the SC block ~line 55-57)
```python
CREATE_GRANT_NUMBER = auto()
UPDATE_GRANT_NUMBER = auto()
DELETE_GRANT_NUMBER = auto()
```

### 1.7 Role seed data (fresh-DB path — pairs with §1.4.4 for existing DBs)
Add `GET_/POST_/PUT_/PATCH_/DELETE_GRANT_NUMBER` strings wherever `*_SERVICES_COMPONENT` appears in: `backend/data_tools/data/user_data.json5`, `backend/data_tools/initial_data/003-role.sql`, `backend/data_tools/initial_data/004-role_version.sql`, `backend/data_tools/test_csv/roles.tsv`. (The migration fixes deployed DBs; the seed keeps a fresh `podman` load consistent.)

### 1.8 Schemas — new `backend/ops_api/ops/schemas/grant_number.py`
Mirror `backend/ops_api/ops/schemas/services_component.py`, dropping `optional`/`sub_component`:
- `GrantNumberSchema` (id, agreement_id, number required; description/period_start/period_end optional; `display_title` dump_only; audit fields dump_only).
- `GrantNumberItemResponse(GrantNumberSchema)`, `GrantNumberListResponse`.
- `GrantNumberCreateSchema` (agreement_id + number required), `GrantNumberUpdateSchema` (all optional; PATCH partial).
- `NestedGrantNumberRequestSchema` — mirror `NestedServicesComponentRequestSchema` (`services_component.py:61-105`): EXCLUDE `agreement_id`, ADD `ref` (Str, allow_none, load_default=None), `number` required. Keep `ref` even though grant BLIs (#5928) don't consume it yet — harmless and keeps the nested-create machinery symmetric.

### 1.9 Service — new `backend/ops_api/ops/services/grant_number.py`
Copy `services_component.py` service, renaming `ServicesComponent`→`GrantNumber`, `ServicesComponentService`→`GrantNumberService`, helper `_sc_associated_with_agreement`→`_gn_associated_with_agreement`. Keep `create/update/delete(..., commit=True)` (needed for the atomic edit-bundle). Keep the `associated_with_agreement()` auth guard (works because GrantNumber has `agreement_id` + `agreement`). The `IntegrityError`→`ValidationError({"number": [...]})` message maps 1:1 (our unique key IS `number` scoped to agreement) — update the human string to "A Grant Number with this number already exists for this agreement."

### 1.10 Resource — new `backend/ops_api/ops/resources/grant_number.py`
Copy `resources/services_component.py`:
- `GrantNumberItemAPI(BaseItemAPI)`: get/put/patch/delete, each `@is_authorized(PermissionType.X, Permission.GRANT_NUMBER)`; put/patch wrap `OpsEventHandler(OpsEventType.UPDATE_GRANT_NUMBER)`, delete `DELETE_GRANT_NUMBER`.
- `GrantNumberListAPI(BaseListAPI)`: get (filter by `agreement_id`), post (`OpsEventHandler(OpsEventType.CREATE_GRANT_NUMBER)`).
- Drop the SC-specific `sc_display_name`/`sc_display_number` history-metadata lines (grant-number history is a fast-follow, see §5).

### 1.11 Routes — `views.py` + `urls.py`
- `views.py`: import the two APIs (~line 126-129); add `GRANT_NUMBER_ITEM_API_VIEW_FUNC = GrantNumberItemAPI.as_view("grant-number-item", GrantNumber)` and `..._LIST_..._FUNC = GrantNumberListAPI.as_view("grant-number-group", GrantNumber)` (~line 283-285).
- `urls.py`: `add_url_rule("/grant-numbers/<int:id>", ...)` and `add_url_rule("/grant-numbers/", ...)` (~line 326-333), importing the view funcs.

### 1.12 Nested creation on POST /agreements — `backend/ops_api/ops/services/agreements.py`
In `create()` (line 117): after `services_components_data = create_request.pop("services_components", [])` (line 162) add `grant_numbers_data = create_request.pop("grant_numbers", [])`; after `_create_services_components` (line 184) call a new `self._create_grant_numbers(agreement.id, grant_numbers_data)` (mirror `_create_services_components` lines 227-265: pop `ref`, set `agreement_id`, build `GrantNumber(**data)`, add, flush, map ref→id). Add `grant_numbers_created` to the metadata dict. Import `GrantNumber`.

### 1.13 Agreement schemas — `backend/ops_api/ops/schemas/agreements.py`
- **Request (nested create):** in `AgreementData` after the `services_components` nested field (lines 88-94), add a `grant_numbers` `fields.List(fields.Nested(NestedGrantNumberRequestSchema), required=False, allow_none=True, load_default=[], ...)`. Import `NestedGrantNumberRequestSchema`.
- **Response (verified — SC uses the inherited nested field dumping the model relationship):** grant numbers are grant-only, so add an explicit dump-scoped field to **`GrantAgreementResponse`** (line 289) AND **`GrantListAgreementResponse`** (line 296):
  ```python
  grant_numbers = fields.List(fields.Nested(GrantNumberItemResponse), dump_only=True)
  ```
  This dumps the `Agreement.grant_numbers` relationship with full fields (id, display_title, dates) so the wizard/details hydrate after save/refetch — cleaner than SC's approach of round-tripping through the request schema, and scoped to grants (won't dump empty for other types). Import `GrantNumberItemResponse`.

### 1.14 Edit-bundle (edit path for existing grants) — `agreement_edit_bundle.py` + schema
- Schema `schemas/agreement_edit_bundle.py`: add `_GrantNumberMutationsSchema` (create/update/delete buckets, mirror `_ServicesComponentMutationsSchema` lines 4-9); add `grant_numbers = fields.Nested(_GrantNumberMutationsSchema, load_default=None)` to `AgreementEditBundleRequestSchema` (line 35); extend `_reject_nested_collections` (line 48) to also reject `grant_numbers` nested under `agreement`.
- Service `services/agreement_edit_bundle.py`: add `self._grant_numbers = GrantNumberService(...)` in `__init__`; in `update()` read `gn_payload = payload.get("grant_numbers") or {}` and add `_create_grant_numbers`/`_update_grant_numbers`/`_delete_grant_numbers` (mirror lines 181-206, using `NestedGrantNumberRequestSchema` for creates, `GrantNumberUpdateSchema` for updates). Grant-number deletes run near the end alongside SC deletes (no BLI linkage this slice). Add `grant_numbers_{created,updated,deleted}` to `BundleResult`.

### 1.15 OpenAPI
Run `/sync-openapi` skill, then `./backend/validate_openapi.sh`. Expect new `/grant-numbers/` paths, `GrantNumber*` schemas, `grant_numbers` on `AgreementData` + `GrantAgreementResponse`/`GrantListAgreementResponse`.

---

## 2. Frontend

### 2.1 New dir `frontend/src/components/GrantNumbers/` (mirror `ServicesComponents/`)
- **`GrantNumbers.constants.js`** — `initialFormData = { id: 0, number: 0, popStartDate: "", popEndDate: "", description: "", mode: "add" }` (no `optional`); `GRANT_NUMBER_OPTIONS` = `[{label: "Grant 1", value: 1}, … up to 25]` (mirror `NON_SEVERABLE_OPTIONS`).
- **`GrantNumberSelect/GrantNumberSelect.jsx`** — copy `ServicesComponentSelect.jsx`; label "Grant Number", hint "Placeholder grant # until award"; disable already-used numbers (the `optionsWithSelected` pattern) so two entries can't share a `number` (also prevents the DB-unique 400).
- **`GrantNumberForm/GrantNumberForm.jsx`** — copy `ServicesComponentForm.jsx`, REMOVE `serviceTypeReq` guard/branching, the optional checkbox, and all severable logic. Fields: `GrantNumberSelect`, PoP-Start/End `DatePicker` in `DateRangePickerWrapper` (keyed by `formKey`), `TextArea` Description (maxLength 150). Buttons `data-cy="add-grant-number-btn"`/`data-cy="update-grant-number-btn"`. Plain `formData` state, **no Vest suite** (matches SC form).
- **`GrantNumbersList/GrantNumbersList.jsx`** — copy `ServicesComponentsList.jsx`; sort `a.number - b.number`; empty-state "You have not added any Grants Numbers yet." (match Figma copy); `data-cy="grant-number-list"`.
- **`GrantNumberListItem/GrantNumberListItem.jsx`** — copy `ServicesComponentListItem.jsx`, DROP `isSubComponent`/`isFirstServiceComponent` edit/delete-disable logic (all grant numbers freely editable/deletable). Reuse `ServicesComponentMetadata` for period/description display (it's generic).
- **`GrantNumbers.hooks.js`** — copy `ServicesComponents.hooks.js`; dispatch NEW reducer actions `ADD_GRANT_NUMBER`/`UPDATE_GRANT_NUMBER`/`DELETE_GRANT_NUMBER`; read `grant_numbers` from context; `display_title = "Grant " + number` (no `formatServiceComponent`); alert copy uses "Grant N".
- **`GrantNumbers.jsx`** — copy `ServicesComponents.jsx`: ConfirmationModal + `GrantNumberForm` + `GrantNumbersList`. Props: `agreementId`, `continueBtnText`, `workflow`, `isReviewMode`, `setHasUnsavedChanges`, `hasUnsavedChanges` (no `serviceRequirementType`).
- **`index.js`** — default export `GrantNumbers`.

### 2.2 Context reducer — `AgreementEditorContext.hooks.js` (+ `AgreementEditorContext.jsx`)
- Add to `defaultState` (lines 42-43), **at the top level as siblings of `agreement`** (critical — see §5.2): `grant_numbers: []`, `deleted_grant_numbers_ids: []`.
- Add reducer cases mirroring SC (lines 94-135): `ADD_GRANT_NUMBER` (append), `UPDATE_GRANT_NUMBER` (map by `number`), `DELETE_GRANT_NUMBER` (filter by `number`; push `action.payload.id` to `deleted_grant_numbers_ids` only if present — guard exactly like SC lines 98-100), `RESEED_GRANT_NUMBERS`.
- `AgreementEditorContext.jsx`: add `grantNumbersRef` + `RESEED_GRANT_NUMBERS` on a `grantNumbersReseedKey` bump, and seed `grant_numbers` from a prop, mirroring SC seeding (defaults to `[]` for create; reseed matters for edit/review).

### 2.3 RTK endpoints — `frontend/src/api/opsAPI.js`
Register `"GrantNumbers"` in `tagTypes` (array at lines 64-88). Add 5 endpoints after the SC ones (~line 1133) mirroring SC: `addGrantNumber` (POST `/grant-numbers/`), `updateGrantNumber` (PATCH `/grant-numbers/${id}`), `getGrantNumberById`, `getGrantNumbersList` (GET `/grant-numbers/?agreement_id=${id}`), `deleteGrantNumber`. `invalidatesTags: ["GrantNumbers", "Agreements", "AgreementHistory"]`. Export the generated hooks (e.g. `useGetGrantNumbersListQuery`).

### 2.4 Step 3 host branching — `CreateBLIsAndSCs.jsx`
Import `GrantNumbers` and `AGREEMENT_TYPES`. Define `const isGrant = selectedAgreement.agreement_type === AGREEMENT_TYPES.GRANT;`. In the `workflow === "agreement"` block (lines 312-322), render `<GrantNumbers .../>` for grants instead of `<ServicesComponents/>`. Gate the grant-**BL** surface: for grants, do NOT render the `BudgetLinesForm` (lines 378-403) or the grouped-BLI accordion (lines 416-442) — wrap those with `!isGrant`, and for grants show only the "Add Budget Lines" `FormHeader` + the empty-state text "You have not added any Budget Lines yet." (The `AgreementTotalCard`/`BLIsByFYSummaryCard` can remain, showing $0.)

### 2.5 Persistence — CREATE path — `CreateBLIsAndSCs.hooks.js` `handleSave` (`if (!agreement.id)`, lines 852-901)
- Destructure `grant_numbers` from `useEditAgreement()` (near line 105 where `services_components` is read).
- Build `newGrantNumbers = grant_numbers.filter(gn => !("created_on" in gn)).map(({display_title, popStartDate, popEndDate, mode, has_changed, ...gn}) => ({...gn, ref: display_title}))` (mirror lines 858-864).
- Add `grant_numbers: newGrantNumbers` to `createAgreementPayload` (lines 894-898). (Empty arrays are fine — verified a grant with no SCs/BLIs POSTs cleanly.)
- **Add `grant_numbers` (and any new derived var) to `handleSave`'s `useCallback` dependency array (lines 985-1002)** — otherwise a stale closure / `react-hooks/exhaustive-deps` lint failure.

### 2.6 Persistence — EDIT path — `CreateBLIsAndSCs.jsx` `bundleSliceRef.getSlice()` (lines 171-269)
Add `grant_numbers: { create, update, delete }` to the returned slice, mirroring the SC section (simpler — no BLI-linking): `deletedGrantNumbersIds = editorState?.deleted_grant_numbers_ids ?? []`; new = filter `!("created_on" in gn)` → strip UI-only fields → add `ref`; update = filter `"created_on" in gn && gn.has_changed` → `{id, ...clean}`; delete = `deletedGrantNumbersIds`.

### 2.7 Re-enable Continue for grants — `AgreementEditForm.jsx` (lines 744-761)
Change the gate from `{!(isGrant && isWizardMode) && (…continue…)}` to render Continue for grants again (drop the `isGrant` special-case). Remove/replace the now-stale comment at lines 744-749. **Verified safe:** `handleContinue`→`saveAgreement` returns early (no POST) for a new grant, advances to Step 3 with `agreement.id` undefined, and the single "Create Agreement" POST persists agreement + grant numbers atomically (§2.5). `shouldDisableBtn` already gates on `(isGrant && !nofoNumber)`, so Continue stays disabled until NOFO is entered. Save Draft (`handleDraft`) is independent and unaffected. **This must ship together with §2.4/§2.5** or the grant is stranded on Step 3.

### 2.8 Defensive: `cleanAgreementForApi` — `frontend/src/helpers/agreement.helpers.js` (fieldsToRemove ~lines 319-333)
Add `"grant_numbers"` and `"deleted_grant_numbers_ids"` to `fieldsToRemove` (alongside the existing `"services_components"`). Not strictly required today (payloads spread only `agreement`, and these live at context top level), but cheap insurance against a future refactor that spreads whole state leaking them to the backend as agreement fields (→ 400).

### 2.9 Types — `frontend/src/types/GrantNumbers.d.ts`
Mirror `ServicesComponents.d.ts` (id, number, description, period_start, period_end, agreement_id, display_title, audit fields). Add `grant_numbers?: GrantNumber[]` to the grant agreement type in `AgreementTypes.d.ts`.

---

## 3. Tests

### 3.1 Backend (`backend/ops_api/tests/ops/`)
- **Model** — new `grant_numbers/test_grant_number.py` (mirror `services_components/test_services_component.py`): instantiation, `display_title == "Grant N"`, `period_duration`, missing-date handling.
- **Resource CRUD** — GET list (filter by `agreement_id`) / GET item / POST / PATCH / PUT / DELETE round-trips on `/grant-numbers/`; duplicate `(agreement_id, number)` → 400; cascade (delete agreement → grant numbers gone).
- **Auth allow/deny** — using `conftest.py` auth-client fixtures (lines 308-364): a role WITH `*_GRANT_NUMBER` succeeds; one WITHOUT → 403. Optionally a pytest-bdd feature in `tests/ops/features/` mirroring `delete_agreement.feature` for the role matrix.
- **Nested create round-trip** — POST `/agreements/` with a GRANT payload carrying a `grant_numbers` array → 201; GET the agreement and assert grant numbers appear in the response (validates §1.13 response exposure). Sibling to `test_agreement.py::test_grant_agreement_grant_details_round_trip`.
- **Edit-bundle** — PATCH `/agreements/{id}/edit-bundle` with `grant_numbers: {create/update/delete}` applies atomically; a forced failure rolls all of it back.
- **Schema** — new grant_number schema tests (load/dump, `NestedGrantNumberRequestSchema` excludes `agreement_id`, accepts `ref`); extend `schemas/test_agreements.py` to assert `AgreementData` loads nested `grant_numbers` and `GrantAgreementResponse` dumps them.

### 3.2 Frontend unit (Vitest + RTL, co-located, 90% gate)
- `GrantNumberForm.test.jsx` (mirror `ServicesComponentForm.test.jsx`): renders fields, add/update button states, used-number disabling, 150-char description cap.
- `GrantNumbers.hooks.test.js`: ADD/UPDATE/DELETE dispatch, `display_title === "Grant N"`, delete-with-id pushes to `deleted_grant_numbers_ids`, delete-without-id does not.
- `GrantNumbersList.test.jsx`: sorted render + empty state.

### 3.3 Frontend E2E — extend `frontend/cypress/e2e/createGrantAgreement.cy.js`
- **Update line 43**: `continue-btn` now EXISTS for grants — replace `should("not.exist")` with disabled/enabled assertions gated on NOFO.
- **Add a new Continue→Step 3 flow** (the current spec only exercises Save Draft at Step 2 and never reaches Step 3): after filling required fields, click Continue → assert the "Create Grant Numbers" form renders → select "Grant 1", set PoP dates + description, click `add-grant-number-btn` → assert `[data-cy='grant-number-list']` lists it → add "Grant 2" → edit one, delete one → click "Create Agreement" → `cy.wait("@postAgreement")` asserts `201` and the request body contains `grant_numbers` → assert success alert + redirect. Mirror the SC add flow in `createAgreement.cy.js`.

---

## 4. Verification (user runs the local stack with **podman**, not docker)

1. `podman compose up db data-import --build` (or full stack).
2. Migrations (from `backend/`): `alembic upgrade head` → confirm `grant_number` + `grant_number_version` tables, the 3 new `opseventtype` values, and the new role `*_GRANT_NUMBER` perms exist; `alembic downgrade -1` reverses cleanly; re-`upgrade head`.
3. Backend (from `backend/ops_api/`): `pipenv run pytest tests/ops/grant_numbers tests/ops/agreement tests/ops/schemas -k grant -n auto`; then `pipenv run nox -s lint && pipenv run nox -s format-check`.
4. OpenAPI: `/sync-openapi` skill → `./backend/validate_openapi.sh`.
5. Frontend (from `frontend/`): `bun run test --watch=false` (90% coverage), `bun run lint --fix`, `bun run format`.
6. E2E: `/e2e-tests` skill (needs the stack up).
7. **Manual**: `/agreements/create` → pick Project → Continue → select GRANT → fill Title + NOFO (Save Draft/Continue enable) → click **Continue** → land on **Step 3** → add "Grant 1"/"Grant 2" with dates + description → confirm they list; edit one; delete one → confirm the "Add Budget Lines" section shows the empty-state placeholder (no functional grant-BL form) → click **Create Agreement** → confirm 201, success alert, redirect; open the new grant's details/refetch and confirm grant numbers hydrate. **Regression:** create a CONTRACT the same way → Step 3 still shows ServicesComponents + the working BL form, no GrantNumbers; Save Draft on a grant from Step 2 still works.

---

## 5. Risks & edge cases (resolved during adversarial plan review)

1. **Permission bootstrap is the highest-risk omission.** `Permission.GRANT_NUMBER = auto()` alone does nothing — auth resolves to strings `"{TYPE}_GRANT_NUMBER"` checked against role data (`authorization_providers.py:27-30`). Must ship BOTH the migration role-perm grants (§1.4.4, for deployed DBs) AND the seed strings (§1.7, for fresh loads), for the same roles that hold `*_SERVICES_COMPONENT`. Miss it → all `/grant-numbers/` calls 403 and save silently fails.
2. **Keep `grant_numbers`/`deleted_grant_numbers_ids` at context top level (siblings of `agreement`), never inside `defaultState.agreement`.** `cleanAgreementForApi` is a blacklist (`omit`) — a nested field would ride `{...agreement}` into the POST as an agreement field → likely 400. §2.8 adds them to the blacklist as defense-in-depth.
3. **Continue re-enable (§2.7) and Step 3 grant persistence (§2.4/§2.5) must ship together** — Continue doesn't persist; without Step 3 grant support the grant is stranded (exactly what the #5926 comment warned).
4. **`handleSave` `useCallback` deps** must include the new grant variable(s) (§2.5) — stale-closure/lint failure otherwise.
5. **Do NOT copy the SC `before_insert/before_update` event listener** — it queries `ContractAgreement` and misfires on grants. GrantNumber has no `display_name_for_sort`.
6. **Grant-number agreement-history messages are a fast-follow, not required.** The `agreement_history` `match` (`agreement_history.py:102`) has no default arm and safely falls through for unhandled event types, so `CREATE_/UPDATE_/DELETE_GRANT_NUMBER` events persist as `OpsEvent` rows but produce no `AgreementHistory` entries — no crash. Adding history cases + registering the subscriber is a separate follow-up; note in the PR.
7. **Enum migration must pass the FULL value list and BOTH `ops_event`/`ops_event_version` columns** to `op.sync_enum_values` (§1.4.3).
8. **`display_title`/`display_name` both return `"Grant {number}"`**; the picker options ("Grant 1".."Grant 25") must align so list rows and picker labels match.
9. **Cypress coverage gap** — the existing grant spec never reaches Step 3; §3.3 adds that path.
