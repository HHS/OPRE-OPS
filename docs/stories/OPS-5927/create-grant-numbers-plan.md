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
**Backend (edit):** `backend/models/agreements.py` (relationship on `GrantAgreement`, NOT the base `Agreement` — see §1.3), `backend/models/__init__.py`, `backend/models/events.py`, `backend/ops_api/ops/auth/auth_types.py`, `backend/ops_api/ops/schemas/agreements.py` (fields on `GrantAgreementData`/`GrantAgreementResponse`/`GrantListAgreementResponse` — see §1.13), `backend/ops_api/ops/schemas/agreement_edit_bundle.py`, `backend/ops_api/ops/services/agreements.py`, `backend/ops_api/ops/services/agreement_edit_bundle.py` (including the `loaded.pop("grant_numbers", None)` fix — see §1.13), `backend/ops_api/ops/views.py`, `backend/ops_api/ops/urls.py`, plus **role seed data** (see §1.7).
**Frontend (new):** `frontend/src/components/GrantNumbers/` dir, `frontend/src/types/GrantNumbers.d.ts`.
**Frontend (edit):** `frontend/src/components/Agreements/AgreementEditor/AgreementEditorContext.hooks.js` + `AgreementEditorContext.jsx`, `frontend/src/api/opsAPI.js`, `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.jsx` + `CreateBLIsAndSCs.hooks.js`, `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.jsx`, `frontend/src/pages/agreements/review/EditAgreementAndBudgetLines.jsx` (**added during plan review — see §2.4a; without this file's wiring, editing an existing grant shows a blank grant-numbers list regardless of what's persisted**), `frontend/src/helpers/agreement.helpers.js` (defensive), `frontend/src/types/AgreementTypes.d.ts` (add `grant_numbers?: GrantNumber[]` to the single shared `Agreement` type — see §2.9), `frontend/cypress/e2e/createGrantAgreement.cy.js`.

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
Add `from .grant_numbers import *` next to line 20 (`from .services_components import *`); give the new module an `__all__`. Required so the mapper configures, the auto-Marshmallow schema attaches, and the `GrantAgreement.grant_numbers` relationship resolves.

### 1.3 Relationship — `backend/models/agreements.py` — **on `GrantAgreement`, NOT the base `Agreement`**
**Corrected during plan review.** The original draft placed this on the base `Agreement` class (mirroring `services_components` at lines 233-238), but Services Components are legitimately generic across Contract/AA/IAA/Direct — Grant Numbers are not. `ContractAgreement` already sets the precedent for type-specific relationships living on the subclass (e.g. `support_contacts`, `vendor` at `agreements.py:672-673`). Putting `grant_numbers` on the base class would (a) let non-grant agreements silently carry a `grant_numbers` collection with no product meaning, and (b) — per §1.13 below — leak an empty `grant_numbers: []` into every Contract/IAA/AA/Direct API response if the response-schema field is ever accidentally placed on the shared base schema instead of the Grant-specific one.

Add to `GrantAgreement` (`agreements.py:718+`, alongside its other columns, before `__mapper_args__`):
```python
grant_numbers: Mapped[list["GrantNumber"]] = relationship(
    "GrantNumber", back_populates="agreement", lazy="selectin", cascade="all, delete",
)
```
The relationship's `back_populates="agreement"` still points at `GrantNumber.agreement`, whose FK is `agreement.id` (the base table) — that's fine; SQLAlchemy resolves it through the joined-table inheritance chain. The FK-level `ondelete="CASCADE"` + this cascade give delete-agreement → delete grant numbers.

**Verified:** `AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(agreement.agreement_type)()` (`agreements_constants.py`) selects `GrantAgreementResponse` by `agreement.agreement_type`, and thanks to polymorphic loading `agreement` is already a `GrantAgreement` instance at that point — so `schema.dump(agreement)` can access `agreement.grant_numbers` even though the attribute only exists on the subclass.

### 1.4 Migration — new file in `backend/alembic/versions/` (down_revision = current head `c1d2e3f4a5b6`)
Autogenerate then hand-adjust, modeled on `2025_02_20_2207-b5d03aa79d12` + the `services_component_version` block in `2024_08_19_2009-9be2fd1e3794_initial.py:2512-2552`. One revision containing:
1. `op.create_table("grant_number", ...)` — `id` PK, `number` (Integer, nullable=False), `description` (String), `period_start`/`period_end` (Date), `agreement_id` (Integer FK `agreement.id` ondelete CASCADE, nullable=False), plus audit cols `created_by`/`updated_by` (Integer FK `ops_user.id`) and `created_on`/`updated_on` (DateTime). Add `op.create_index("ix_grant_number_unique", "grant_number", ["agreement_id","number"], unique=True)`.
2. `op.create_table("grant_number_version", ...)` — same data cols all `autoincrement=False, nullable=True`, plus `transaction_id` (BigInteger, nullable=False), `end_transaction_id` (BigInteger), `operation_type` (SmallInteger, nullable=False), `PrimaryKeyConstraint("id","transaction_id")`, and the three Continuum indexes (name them explicitly — e.g. `ix_grant_number_version_transaction_id`, `ix_grant_number_version_end_transaction_id`, `ix_grant_number_version_operation_type` — so `downgrade()` can drop them by name instead of relying on inferred defaults). (Continuum does NOT auto-migrate DDL — this table is hand-written. **Verified during plan review:** no separate `models/grant_number_history.py` file is needed. `OpsDBHistory`/`build_audit` in `models/history.py` is fully generic off `mapper.columns` + `mapper.relationships` and needs no per-model file — the domain-specific `*_history.py` files that DO exist (`agreement_history.py`, `can_history.py`, `project_history.py`) are user-facing timeline builders subscribed to specific `OpsEventType`s, not a requirement for every `BaseModel` subclass. `ServicesComponent` has no dedicated history file either — only its `*_version` Continuum table, which this step already covers. Grant-number timeline entries are the fast-follow noted in §5.6, not a blocking file.)
3. **Enum values**: add `CREATE_GRANT_NUMBER`, `UPDATE_GRANT_NUMBER`, `DELETE_GRANT_NUMBER` to the native PG `opseventtype` enum via `op.sync_enum_values(enum_schema="ops", enum_name="opseventtype", new_values=[<FULL existing list + 3 new>], affected_columns=[TableReference("ops","ops_event","event_type"), TableReference("ops","ops_event_version","event_type")], enum_values_to_rename=[])`. **Both** `ops_event` and `ops_event_version` columns must be listed. Pattern: `2025_01_16_2349-0536c9a5d32e_adding_new_opsevent_type.py:23-29`. `new_values` must be the complete value list, not just additions.
4. **Role permissions** (see verified finding — this is required, not optional): `op.execute(...)` `UPDATE ops.role SET permissions = array_append(...)` for `GET_/POST_/PUT_/PATCH_/DELETE_GRANT_NUMBER` on every role that currently has the matching `*_SERVICES_COMPONENT` string. Pattern: `2026_04_13_1940-c47768234303_add_perms_for_reviewer_approver.py:31-42`. **Without this, every `/grant-numbers/` call 403s.**

`downgrade()` reverses in order: drop role perms, revert enum, drop `grant_number_version`, drop index, drop `grant_number`.

Use the `/db-migrations` skill for the full workflow.

### 1.5 Permission enum — `backend/ops_api/ops/auth/auth_types.py:28`
Add `GRANT_NUMBER = auto()` after `SERVICES_COMPONENT` (i.e. mid-enum, not appended at the end). **Note (verified):** the enum value alone is NOT sufficient — `authorization_providers.py:27-30`'s `_check_role` builds the string `f"{permission_type.name}_{permission.name}".upper()` (e.g. `"GET_GRANT_NUMBER"`) checked against `user.roles[].permissions`, which is entirely name-based. The migration (§1.4.4) and seed (§1.7) supply those strings.

**Insertion-order safety (verified during plan review, resolving a raised concern):** a prior review pass flagged that inserting `GRANT_NUMBER` mid-list would shift the `auto()`-assigned integer values of `UPLOAD_DOCUMENT`, `USER`, and `WORKFLOW`, and worried this could silently break persisted permissions. Confirmed false — grepped the full codebase for `Permission.*.value` and `permission.value`: zero hits. `Permission` enum members are used exclusively by `.name` (the string form), never by their `auto()` integer, and `role.permissions` in the DB stores the name-based strings (e.g. `"GET_SERVICES_COMPONENT"`) directly — never an integer. Insertion order is cosmetic here; keep `GRANT_NUMBER` next to `SERVICES_COMPONENT` for readability, not because ordering matters functionally.

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
**Corrected during plan review — both halves of this section MUST live on the Grant-specific classes, not the shared `AgreementData`/`AgreementResponse` base.** The original draft's request-side bullet said "in `AgreementData`," which would put `grant_numbers` on the schema every agreement type inherits from (`ContractAgreementData`, `IaaAgreementData`, `DirectAgreementData`, `AaAgreementData` all subclass `AgreementData`) — the same base-class mistake as §1.3, and it would directly contradict this section's own response-side claim of being "scoped to grants."

- **Request (nested create):** add the field to **`GrantAgreementData`** only (`agreements.py:112-116`, alongside `foa`/`nofo_number`/`aln_number`/`funding_period_months`), NOT to the shared `AgreementData` base:
  ```python
  grant_numbers = fields.List(
      fields.Nested(NestedGrantNumberRequestSchema),
      required=False,
      allow_none=True,
      load_default=[],
      metadata={"description": "Grant numbers to create with the agreement"},
  )
  ```
  Import `NestedGrantNumberRequestSchema`. This is dispatched correctly because `AGREEMENT_TYPE_TO_DATACLASS_MAPPING[AgreementType.GRANT] == GrantAgreementData` (`agreements_constants.py:39-45`) — the request-parsing schema is selected per-type before `.load()` runs, so only grant payloads are ever parsed against this field; a Contract payload never sees it.
- **Response:** add an explicit dump-scoped field to **`GrantAgreementResponse`** (line 289) AND **`GrantListAgreementResponse`** (line 296):
  ```python
  grant_numbers = fields.List(fields.Nested(GrantNumberItemResponse), dump_only=True)
  ```
  This dumps the `GrantAgreement.grant_numbers` relationship (added to the subclass per §1.3) with full fields (id, display_title, dates) so the wizard/details hydrate after save/refetch — cleaner than SC's approach of round-tripping through the request schema, and genuinely scoped to grants (won't dump empty for other types, verified per §1.3's polymorphic-dispatch note). Import `GrantNumberItemResponse`.
- **Edit-bundle pop (new — closes a gap found during plan review):** `services/agreement_edit_bundle.py::_apply_agreement_update` (~line 172-173) already does `loaded.pop("budget_line_items", None)` and `loaded.pop("services_components", None)` after loading the per-type dataclass schema and before calling `self._agreements.update(...)`. Add `loaded.pop("grant_numbers", None)` alongside them — otherwise a grant-number array embedded under `agreement` in an edit-bundle PATCH would either raise or get silently forwarded into the plain agreement-field update path instead of the bundle's dedicated `grant_numbers: {create,update,delete}` handling (§1.14). Mirrors the existing SC/BLI defense exactly.

### 1.14 Edit-bundle (edit path for existing grants) — `agreement_edit_bundle.py` + schema
- Schema `schemas/agreement_edit_bundle.py`: add `_GrantNumberMutationsSchema` (create/update/delete buckets, mirror `_ServicesComponentMutationsSchema` lines 4-9); add `grant_numbers = fields.Nested(_GrantNumberMutationsSchema, load_default=None)` to `AgreementEditBundleRequestSchema` (line 35); extend `_reject_nested_collections` (line 48) to also reject `grant_numbers` nested under `agreement`.
- Service `services/agreement_edit_bundle.py`: add `self._grant_numbers = GrantNumberService(...)` in `__init__`; in `update()` read `gn_payload = payload.get("grant_numbers") or {}` and add `_create_grant_numbers`/`_update_grant_numbers`/`_delete_grant_numbers` (mirror lines 181-206, using `NestedGrantNumberRequestSchema` for creates, `GrantNumberUpdateSchema` for updates). Grant-number deletes run near the end alongside SC deletes (no BLI linkage this slice). Add `grant_numbers_{created,updated,deleted}` to `BundleResult`.

### 1.15 OpenAPI
Run `/sync-openapi` skill, then `./backend/validate_openapi.sh`. Expect new `/grant-numbers/` paths, `GrantNumber*` schemas, and `grant_numbers` on `GrantAgreementData` + `GrantAgreementResponse`/`GrantListAgreementResponse` only (per §1.13's correction — NOT on the shared `AgreementData`/`AgreementResponse`, and NOT appearing on `ContractAgreementData`/`ContractAgreementResponse` etc.). If the generated spec shows `grant_numbers` on any non-grant schema, that's a signal §1.3/§1.13 were implemented on the wrong class — treat it as a required fix, not a spec-generation quirk.

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
**Line numbers corrected during plan review** — SC state already occupies the exact lines the original draft pointed at; grant fields insert immediately after, not "at" 42-43/94-135.
- Add to `defaultState`, **immediately after the existing `services_components: []` / `deleted_services_components_ids: []` pair** (currently lines 42-43 — grant fields become lines 44-45 once inserted), **at the top level as siblings of `agreement`** (critical — see §5.2): `grant_numbers: []`, `deleted_grant_numbers_ids: []`.
- Add reducer cases mirroring SC, inserted immediately after the existing SC cases (currently occupying lines 94-135 — grant cases follow at 136+): `ADD_GRANT_NUMBER` (append), `UPDATE_GRANT_NUMBER` (map by `number`), `DELETE_GRANT_NUMBER` (filter by `number`; push `action.payload.id` to `deleted_grant_numbers_ids` only if present — guard exactly like the SC `DELETE_SERVICES_COMPONENT` case at lines 98-100), `RESEED_GRANT_NUMBERS` (mirrors `RESEED_SERVICES_COMPONENTS` at line 129: `grant_numbers: action.payload ?? []`, `deleted_grant_numbers_ids: []`).
- `AgreementEditorContext.jsx` (mirror the existing `servicesComponents`/`servicesComponentsReseedKey` wiring exactly):
  - Provider function signature (~line 26-27): add `grantNumbers` and `grantNumbersReseedKey = 0` props.
  - Seeding block (~line 31-35, where `modifiedInitialState.services_components = servicesComponents || []` is set): add `modifiedInitialState.grant_numbers = grantNumbers || [];` alongside it.
  - Ref + reseed effect (~lines 55-67, `servicesComponentsRef`/the `RESEED_SERVICES_COMPONENTS` dispatch on `servicesComponentsReseedKey` change): add a parallel `grantNumbersRef` and a parallel `useEffect` dispatching `RESEED_GRANT_NUMBERS` on `grantNumbersReseedKey` change.
  - **This provider-level wiring is necessary but not sufficient** — see the new §2.4a below for the consumer-side wiring this depends on.

### 2.3 RTK endpoints — `frontend/src/api/opsAPI.js`
Register `"GrantNumbers"` in `tagTypes` (array at lines 64-88). Add 5 endpoints after the SC ones (~line 1133) mirroring SC: `addGrantNumber` (POST `/grant-numbers/`), `updateGrantNumber` (PATCH `/grant-numbers/${id}`), `getGrantNumberById`, `getGrantNumbersList` (GET `/grant-numbers/?agreement_id=${id}`), `deleteGrantNumber`. `invalidatesTags: ["GrantNumbers", "Agreements", "AgreementHistory"]`. Export the generated hooks (e.g. `useGetGrantNumbersListQuery`).

### 2.4 Step 3 host branching — `CreateBLIsAndSCs.jsx`
Import `GrantNumbers` and `AGREEMENT_TYPES`. Define `const isGrant = selectedAgreement.agreement_type === AGREEMENT_TYPES.GRANT;`.

**Two render sites use `ServicesComponents`, not one — corrected during plan review.** The original draft only addressed the `workflow === "agreement"` block (the wizard). There is a second, structurally identical block for `workflow === "none"` (the Agreement Details page, `!isAgreementNotYetDeveloped && <ServicesComponents .../>`) that renders SC for an *existing* agreement being viewed/edited outside the wizard. Left unaddressed, a saved grant's Agreement Details page would still show the ServicesComponents UI. Branch both:
- **`workflow === "agreement"` block** (the wizard, inside `isAgreementWorkflowOrCanEditBudgetLines &&`): render `<GrantNumbers .../>` for grants instead of `<ServicesComponents/>`.
- **`workflow === "none"` block** (Agreement Details page, inside `!isAgreementNotYetDeveloped &&`): same swap — `<GrantNumbers .../>` for grants instead of `<ServicesComponents/>`. Note the props differ slightly here (no `continueBtnText`/`workflow` needed in this call site today; match whatever the existing `ServicesComponents` call passes).

**Gate the grant-BL surface completely, not just the form/accordion.** The original draft said to wrap `BudgetLinesForm` and the grouped-BLI accordion in `!isGrant` but left the `FormHeader` ("Add Budget Lines" heading + helper text) and the `AgreementTotalCard`/`BLIsByFYSummaryCard` row unguarded — those sit between the SC/GrantNumbers block and the `BudgetLinesForm` in the JSX and would still render for grants even with the form/accordion hidden. Decide per this plan's spec (§Context: "the 'Add Budget Lines' section renders an empty-state placeholder for grants"):
- Wrap the `FormHeader` block in `!isGrant &&` for its "Add Budget Lines" heading with the SC-specific helper copy ("Add Budget lines to each Services Component...") — for grants, render a grant-specific `FormHeader` instead (heading "Add Budget Lines", no details text, or the empty-state placeholder copy) so the section still has a heading.
- Wrap `BudgetLinesForm` (the functional add-BLI form) in `!isGrant &&` — confirmed correct as originally drafted.
- Wrap the grouped-BLI accordion render (the `groupedBudgetLinesByServicesComponent.length > 0 ? ... : <p>You have not added any Budget Lines yet.</p>` block) in `!isGrant &&`, and render the same "You have not added any Budget Lines yet." paragraph unconditionally for grants (since a new/draft grant will always have zero BLIs this slice, the empty-state text can render directly rather than through the conditional).
- `AgreementTotalCard`/`BLIsByFYSummaryCard`: the plan's original call to leave these visible (showing $0) is fine — they're type-agnostic summary widgets, not evidence of a broken BL feature. No change needed there.

### 2.4a Wire grant numbers into the EDIT/REVIEW entry point — `EditAgreementAndBudgetLines.jsx` (new step, closes a critical gap found during plan review)
**This file was missing from Critical Files entirely, and without it editing an existing grant is broken.** `AgreementEditorContext.jsx`'s `servicesComponents`/`servicesComponentsReseedKey` props (§2.2) are not self-seeding — something has to fetch the persisted data and pass it in. That "something" is `frontend/src/pages/agreements/review/EditAgreementAndBudgetLines.jsx`, the sole current consumer of those two props (confirmed by grep — no other file references `servicesComponentsReseedKey`). It:
- Fetches SCs via `useGetServicesComponentsListQuery`-equivalent, holds `servicesComponentsReseedKey` state (bumped on save-failure to revert optimistic edits), and threads `servicesComponents={servicesComponents ?? []}` + `servicesComponentsReseedKey={servicesComponentsReseedKey}` into `<AgreementEditorProvider>` (~lines 98, 128-129, 174, 241-242).
- It also folds `bliSlice.services_components` into the outgoing `bundle` payload for the edit-bundle PATCH (~line 128-129) — this is the same slice built in §2.6, so this file is where that slice's `grant_numbers` bucket actually gets sent.

Do the mirror wiring for grants:
1. Fetch grant numbers for the agreement being edited (via `useGetGrantNumbersListQuery` from §2.3) alongside the existing SC fetch.
2. Add `grantNumbersReseedKey` state (same save-failure-revert pattern as `servicesComponentsReseedKey`), bumped in the same place(s) the SC key is bumped.
3. Pass `grantNumbers={grantNumbers ?? []}` and `grantNumbersReseedKey={grantNumbersReseedKey}` into `<AgreementEditorProvider>` alongside the existing SC props.
4. Confirm the `bundle.grant_numbers` bucket from §2.6's `getSlice()` return actually reaches the outgoing PATCH body here (it should, since it's the same `bundle` object the SC section already folds in) — add it explicitly if the bundle is assembled with named keys rather than a spread.

Without this, opening an existing grant for edit/review initializes `AgreementEditorContext` with `grant_numbers: []` regardless of what's actually persisted — the user sees a blank list on a grant that already has numbers, and if they "re-add" the same numbers thinking the list is just empty, the `(agreement_id, number)` unique index (§1.1) will 400 on save.

### 2.5 Persistence — CREATE path — `CreateBLIsAndSCs.hooks.js` `handleSave` (`if (!agreement.id)`, lines 852-901)
- Destructure `grant_numbers` from `useEditAgreement()` (near line 105 where `services_components` is read).
- Build `newGrantNumbers = grant_numbers.filter(gn => !("created_on" in gn)).map(({display_title, popStartDate, popEndDate, mode, has_changed, ...gn}) => ({...gn, ref: display_title}))` (mirror lines 858-864).
- Add `grant_numbers: newGrantNumbers` to `createAgreementPayload` (lines 894-898). (Empty arrays are fine — verified a grant with no SCs/BLIs POSTs cleanly.)
- **Add `grant_numbers` (and any new derived var) to `handleSave`'s `useCallback` dependency array (lines 985-1002)** — otherwise a stale closure / `react-hooks/exhaustive-deps` lint failure.
- **Note (flagged during plan review, not a required change):** `handleSave` here only covers the brand-new-agreement path (`if (!agreement.id)`). For an *existing* grant being edited, the relevant fan-out is the `bundleSliceRef.getSlice()` path in §2.6, threaded through `EditAgreementAndBudgetLines.jsx` (§2.4a) — not this file's individual-RTK-mutation branch. This is almost certainly intentional (mirrors how SC already splits create-vs-edit across these same two paths) but call it out explicitly in the PR description so a reviewer doesn't go looking for a third grant-numbers persistence path that was never meant to exist.

### 2.6 Persistence — EDIT path — `CreateBLIsAndSCs.jsx` `bundleSliceRef.getSlice()` (lines 171-269)
Add `grant_numbers: { create, update, delete }` to the returned slice, mirroring the SC section (simpler — no BLI-linking): `deletedGrantNumbersIds = editorState?.deleted_grant_numbers_ids ?? []`; new = filter `!("created_on" in gn)` → strip UI-only fields → add `ref`; update = filter `"created_on" in gn && gn.has_changed` → `{id, ...clean}`; delete = `deletedGrantNumbersIds`.

### 2.7 Re-enable Continue for grants — `AgreementEditForm.jsx` (lines 744-761)
Change the gate from `{!(isGrant && isWizardMode) && (…continue…)}` to render Continue for grants again (drop the `isGrant` special-case). Remove/replace the now-stale comment at lines 744-749. **Verified safe:** `handleContinue`→`saveAgreement` returns early (no POST) for a new grant, advances to Step 3 with `agreement.id` undefined, and the single "Create Agreement" POST persists agreement + grant numbers atomically (§2.5). `shouldDisableBtn` already gates on `(isGrant && !nofoNumber)`, so Continue stays disabled until NOFO is entered. Save Draft (`handleDraft`) is independent and unaffected. **This must ship together with §2.4/§2.5** or the grant is stranded on Step 3.

### 2.8 Defensive: `cleanAgreementForApi` — `frontend/src/helpers/agreement.helpers.js` (fieldsToRemove ~lines 319-333)
**Corrected during plan review** — only add `"grant_numbers"`, NOT `"deleted_grant_numbers_ids"`. Verified: `fieldsToRemove` currently contains `"services_components"` but deliberately omits `"deleted_services_components_ids"` — that array is pure local editor state that structurally never appears on the `agreement` object passed into `cleanAgreementForApi` (every call site builds its input as `{ ...agreement, ... }`, never a spread of the whole editor-context state). Mirror that same asymmetry for grants: add `"grant_numbers"` for consistency with `"services_components"`'s existing defensive placement, but leave `"deleted_grant_numbers_ids"` out to match the actual SC precedent rather than inventing a new one.

### 2.9 Types — `frontend/src/types/GrantNumbers.d.ts`
Mirror `ServicesComponents.d.ts` (id, number, description, period_start, period_end, agreement_id, display_title, audit fields). **Corrected during plan review:** there is no separate "grant agreement type" in the frontend's type layer — `AgreementTypes.d.ts` defines a single `Agreement` type used for every agreement type. Add `grant_numbers?: GrantNumber[]` directly to that one `Agreement` type (as an optional field, same as `contract_type?: string` and other type-specific optional fields already do), not to a non-existent grant-specific type.

---

## 3. Tests

### 3.1 Backend (`backend/ops_api/tests/ops/`)
- **Model** — new `grant_numbers/test_grant_number.py` (mirror `services_components/test_services_component.py`): instantiation, `display_title == "Grant N"` AND `display_name == "Grant N"` (test both properties, not just `display_title` — they're separately defined per §1.1 and a future edit to one without the other should fail a test), `period_duration` (normal case AND the inverted-date case `period_end < period_start` — the model's `abs(...)` makes this silently "work" by returning a positive duration for nonsensical input; assert the actual behavior so a future change to that logic is caught), missing-date handling.
- **Resource CRUD** — GET list (filter by `agreement_id`) / GET item / POST / PATCH / PUT / DELETE round-trips on `/grant-numbers/`; duplicate `(agreement_id, number)` → 400 via **both PATCH and PUT**, not just POST (the unique index fires on any write path that changes `number`); cascade (delete agreement → grant numbers gone) AND the inverse — deleting a `GrantNumber` must NOT cascade back up to delete its parent `GrantAgreement` (sanity-check the relationship direction).
- **Auth allow/deny** — using `conftest.py` auth-client fixtures (lines 308-364): a role WITH `*_GRANT_NUMBER` succeeds; one WITHOUT → 403. Also cover the team-membership dimension, not just the role-permission dimension: a user with the right role permission but who is NOT a team member on the agreement should still be denied by `associated_with_agreement()` (mirror however the SC tests already cover this same check for `ServicesComponent`, since `GrantNumberService` reuses the identical `associated_with_agreement()` guard per §1.9). Optionally a pytest-bdd feature in `tests/ops/features/` mirroring `delete_agreement.feature` for the role matrix.
- **Nested create round-trip** — POST `/agreements/` with a GRANT payload carrying a `grant_numbers` array → 201; GET the agreement and assert grant numbers appear in the response (validates §1.13 response exposure). Sibling to `test_agreement.py::test_grant_agreement_grant_details_round_trip`. **Also assert the negative case:** POST a CONTRACT (or any non-grant type) and confirm the response does NOT contain a `grant_numbers` key at all — this is the regression test that would have caught the base-class placement bug found during plan review (§1.3/§1.13); without it, a future accidental revert of that fix ships silently.
- **Edit-bundle** — PATCH `/agreements/{id}/edit-bundle` with `grant_numbers: {create/update/delete}` applies atomically; a forced failure rolls all of it back.
- **Schema** — new grant_number schema tests (load/dump, `NestedGrantNumberRequestSchema` excludes `agreement_id`, accepts `ref`); extend `schemas/test_agreements.py` to assert `GrantAgreementData` (not the shared `AgreementData` — see §1.13's correction) loads nested `grant_numbers`, `GrantAgreementResponse`/`GrantListAgreementResponse` dump them, and `ContractAgreementResponse` does NOT expose a `grant_numbers` field at the schema level (belt-and-suspenders alongside the round-trip negative-case test above).

### 3.2 Frontend unit (Vitest + RTL, co-located, 90% gate)
- `GrantNumberForm.test.jsx` (mirror `ServicesComponentForm.test.jsx`): renders fields, add/update button states, used-number disabling, 150-char description cap.
- `GrantNumbers.hooks.test.js`: ADD/UPDATE/DELETE dispatch, `display_title === "Grant N"`, delete-with-id pushes to `deleted_grant_numbers_ids`, delete-without-id does not. Also assert the ADD dispatch's payload shape doesn't carry a stray `agreement_id` on the transient (not-yet-persisted) item — `agreement_id` is set server-side per §1.12/§2.5, and a client-side value leaking in could mask a real bug if the server-side assignment were ever accidentally removed.
- `GrantNumbersList.test.jsx`: sorted render + empty state.
- **Context reducer** (new — closes a gap left implicit by §2.2): a `RESEED_GRANT_NUMBERS` test asserting it resets `deleted_grant_numbers_ids: []` in the same dispatch that reseeds `grant_numbers` — mirroring `RESEED_SERVICES_COMPONENTS`'s behavior exactly, since a reseed-without-clearing-deletes bug would cause a stale delete-id to be resent on the next save after a revert.
- **`cleanAgreementForApi`** (new — validates §2.8's corrected fix): a test asserting `grant_numbers` is stripped from the cleaned payload when present, confirming the added blacklist entry actually does something (even though, per §2.8's analysis, no current call site would ever pass it in — this test guards against a future refactor reintroducing the risk the blacklist entry exists to prevent).

### 3.3 Frontend E2E — extend `frontend/cypress/e2e/createGrantAgreement.cy.js`
- **Update line 43**: `continue-btn` now EXISTS for grants — replace `should("not.exist")` with disabled/enabled assertions gated on NOFO.
- **Add a new Continue→Step 3 flow** (the current spec only exercises Save Draft at Step 2 and never reaches Step 3): after filling required fields, click Continue → assert the "Create Grant Numbers" form renders → select "Grant 1", set PoP dates + description, click `add-grant-number-btn` → assert `[data-cy='grant-number-list']` lists it → add "Grant 2" → edit one, delete one → confirm the "Add Budget Lines" section shows only the empty-state placeholder (§2.4's corrected gating — no functional BL form/accordion for a grant) → click "Create Agreement" → `cy.wait("@postAgreement")` asserts the response status is `201` AND inspects `interception.request.body.grant_numbers` (the **request** body, not the response — the response is just a success message; be explicit about this in the assertion to avoid checking the wrong side of the intercept) → assert success alert + redirect. Mirror the SC add flow in `createAgreement.cy.js`.
- **Regression coverage (new — closes gaps found during plan review):**
  - A CONTRACT agreement still shows `ServicesComponents` (not `GrantNumbers`) at Step 3, and its BL form/accordion still work — covers §2.4's two-render-site fix without regressing the non-grant path.
  - Save Draft from Step 2 still works for a grant after Continue is re-enabled (§2.7) — the two buttons are independent, but re-enabling Continue is exactly the kind of change that could accidentally shift focus/tab order or a shared disabled-state computation in a way that breaks Save Draft; a direct assertion is cheap insurance.

---

## 4. Verification (user runs the local stack with **podman**, not docker)

1. `podman compose up db data-import --build` (or full stack).
2. Migrations (from `backend/`): `alembic upgrade head` → confirm `grant_number` + `grant_number_version` tables, the 3 new `opseventtype` values, and the new role `*_GRANT_NUMBER` perms exist; `alembic downgrade -1` reverses cleanly; re-`upgrade head`.
3. Backend (from `backend/ops_api/`): `pipenv run pytest tests/ops/grant_numbers tests/ops/agreement tests/ops/schemas -k grant -n auto`; then `pipenv run nox -s lint && pipenv run nox -s format-check`.
4. OpenAPI: `/sync-openapi` skill → `./backend/validate_openapi.sh`.
5. Frontend (from `frontend/`): `bun run test --watch=false` (90% coverage), `bun run lint --fix`, `bun run format`.
6. E2E: `/e2e-tests` skill (needs the stack up).
7. **Manual**: `/agreements/create` → pick Project → Continue → select GRANT → fill Title + NOFO (Save Draft/Continue enable) → click **Continue** → land on **Step 3** → add "Grant 1"/"Grant 2" with dates + description → confirm they list; edit one; delete one → confirm the "Add Budget Lines" section shows the empty-state placeholder (no functional grant-BL form) → click **Create Agreement** → confirm 201, success alert, redirect; open the new grant's **Agreement Details page** (the `workflow === "none"` render site, §2.4) and confirm it shows `GrantNumbers`, not `ServicesComponents`, and that the grant numbers hydrate. Then re-open that same grant for **edit/review** (exercises §2.4a's `EditAgreementAndBudgetLines.jsx` wiring) and confirm the existing grant numbers appear pre-populated — NOT a blank list. **Regression:** create a CONTRACT the same way → Step 3 still shows ServicesComponents + the working BL form, no GrantNumbers, on both the wizard AND the Agreement Details page; Save Draft on a grant from Step 2 still works.

---

## 5. Risks & edge cases (resolved during adversarial plan review, then independently re-verified against the actual codebase during a second review pass)

1. **Permission bootstrap is the highest-risk omission.** `Permission.GRANT_NUMBER = auto()` alone does nothing — auth resolves to strings `"{TYPE}_GRANT_NUMBER"` checked against role data (`authorization_providers.py:27-30`). Must ship BOTH the migration role-perm grants (§1.4.4, for deployed DBs) AND the seed strings (§1.7, for fresh loads), for the same roles that hold `*_SERVICES_COMPONENT`. Miss it → all `/grant-numbers/` calls 403 and save silently fails.
   - **Insertion order does NOT matter for this enum** (a concern raised and then disproven during the second review pass): grepped the full backend for `Permission.*.value` / `permission.value` — zero hits. `_check_role` in `authorization_providers.py` builds its lookup string from `.name` only. Inserting `GRANT_NUMBER` mid-enum is safe; no need to append-only.
2. **Model AND response-schema placement — grant-only fields belong on the `GrantAgreement`/`GrantAgreementData`/`GrantAgreementResponse`/`GrantListAgreementResponse` subclasses, never on the shared `Agreement`/`AgreementData`/`AgreementResponse` base.** This was an actual mistake in the plan's first draft (§1.3, §1.13), caught during the second review pass and corrected in both sections. Putting the `grant_numbers` relationship or schema field on the base class would leak an empty `grant_numbers: []` into every Contract/IAA/AA/Direct agreement's API response, directly contradicting this plan's own "scoped to grants" claim. `ContractAgreement`'s existing type-specific fields (`support_contacts`, `vendor`, etc.) are the established precedent for where type-specific data belongs. Verified the dispatch is polymorphism-safe: `AGREEMENT_ITEM_TYPE_TO_RESPONSE_MAPPING.get(agreement.agreement_type)()` selects the Grant-specific response schema by the actual loaded type, and SQLAlchemy's joined-table inheritance means `agreement` is already a `GrantAgreement` instance when that dispatch happens.
3. **Keep `grant_numbers`/`deleted_grant_numbers_ids` at context top level (siblings of `agreement`), never inside `defaultState.agreement`.** `cleanAgreementForApi` is a blacklist (`omit`) — a nested field would ride `{...agreement}` into the POST as an agreement field → likely 400. §2.8 adds `grant_numbers` (but deliberately NOT `deleted_grant_numbers_ids` — see §2.8's note on matching the actual SC precedent) to the blacklist as defense-in-depth.
4. **`EditAgreementAndBudgetLines.jsx` must be wired for grants too (§2.4a), or editing an existing grant is broken.** This file was missing from the plan's first draft entirely. It's the sole consumer that seeds `AgreementEditorContext`'s `services_components`/`servicesComponentsReseedKey` from persisted data via a fetch — without the mirror wiring for `grant_numbers`/`grantNumbersReseedKey`, opening an existing grant for edit initializes the context with `grant_numbers: []` regardless of what's actually saved. A user re-entering what they think are missing numbers would then hit the `(agreement_id, number)` unique-index 400 (§1.1) on save.
5. **Continue re-enable (§2.7) and Step 3 grant persistence (§2.4/§2.5) must ship together** — Continue doesn't persist; without Step 3 grant support the grant is stranded (exactly what the #5926 comment warned).
6. **`handleSave` `useCallback` deps** must include the new grant variable(s) (§2.5) — stale-closure/lint failure otherwise.
7. **Do NOT copy the SC `before_insert/before_update` event listener** — it queries `ContractAgreement` and misfires on grants. GrantNumber has no `display_name_for_sort`.
8. **Edit-bundle must pop `grant_numbers` from the loaded agreement-update payload (§1.13), mirroring the existing `budget_line_items`/`services_components` pops in `_apply_agreement_update`.** Found during the second review pass. Without this, a `grant_numbers` array nested under `agreement` in an edit-bundle PATCH could leak into the plain agreement-field update path instead of going through the bundle's dedicated create/update/delete handling.
9. **Grant-number agreement-history messages are a fast-follow, not required.** The `agreement_history` `match` (`agreement_history.py:102`) has no default arm and safely falls through for unhandled event types, so `CREATE_/UPDATE_/DELETE_GRANT_NUMBER` events persist as `OpsEvent` rows but produce no `AgreementHistory` entries — no crash. Adding history cases + registering the subscriber is a separate follow-up; note in the PR. **Also verified (second review pass): no separate `models/grant_number_history.py` file is needed for this slice** — that would be a misreading of the "*_history table" convention in `backend/ops_api/CLAUDE.md`, which refers to the Continuum `*_version` table (already covered by §1.4.2), not a bespoke domain-history module. `ServicesComponent` itself has no such file.
10. **Enum migration must pass the FULL value list and BOTH `ops_event`/`ops_event_version` columns** to `op.sync_enum_values` (§1.4.3).
11. **`display_title`/`display_name` both return `"Grant {number}"`**; the picker options ("Grant 1".."Grant 25") must align so list rows and picker labels match.
12. **Cypress coverage gap** — the existing grant spec never reaches Step 3; §3.3 adds that path, plus regression coverage for the CONTRACT path and Save Draft.
13. **`AgreementTypes.d.ts` has one shared `Agreement` type, not per-agreement-type variants** — `grant_numbers?: GrantNumber[]` goes directly on it (§2.9), not on a nonexistent grant-specific type.
