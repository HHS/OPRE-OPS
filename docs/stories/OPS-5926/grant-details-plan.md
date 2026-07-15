# Plan: Grant Details Section (Vertical Slice #5926)

> Team context doc. This is the SECOND vertical slice of [#787 "Create a Grant"](https://github.com/HHS/OPRE-OPS/issues/787), building on the shipped [#5925](https://github.com/HHS/OPRE-OPS/issues/5925) slice (Type/Title/Nickname/Description). Scope is limited to [#5926](https://github.com/HHS/OPRE-OPS/issues/5926). Grant Numbers (#5927) and Budget Lines (#5928) are separate, later slices on Step 3 of the wizard — **do not build those here.**

## Context

The Figma design ([node 33776-59813](https://www.figma.com/design/dsQFe6G2KjcTWNq7NNZujm/OPRE-OPS?node-id=33776-59813)) shows a "Grant Details" subheading directly below the "Agreement Details" block (Title/Nickname/Description, shipped in #5925) on Step 2 of the Create Agreement wizard. It contains:

1. **NOFO Number** — text input, marked "Required Information*" (the only required field in this section)
2. **Grant Funding Period** — numeric stepper, unit "months" (design shows "18 months")
3. **ALN Number** — text input, optional
4. **Federal Project Officer (FPO)** — single-user combobox with clear (X) button, optional
5. **Project Specialist** — single-user combobox with clear (X) button, optional
6. **Team Members** — multi-user combobox, optional
7. **Team Members Added** — removable tag list, reflects #6
8. **Notes (optional)** — textarea, max 500 characters

Unlike #5925 (frontend-only — the backend already supported Type/Title/Nickname/Description), **this slice requires backend changes**: `nofo_number`, `aln_number`, `funding_period_months`, and `project_specialist_id` do not exist anywhere in the codebase today and must be added to the `GrantAgreement` model, an Alembic migration, and the Marshmallow schema. Team Members and Notes already exist on the base `Agreement` model (shared with Contracts) and only need frontend wiring.

### Decisions confirmed with product owner
- **Federal Project Officer (FPO)** reuses the existing `project_officer_id` column/relationship — same as Contracts reuse it and display it as "COR". No new column; only a label change (`GRANT: "Federal Project Officer"` in the `projectOfficer` display-label map).
- **No Alternate FPO.** The design shows only one FPO combobox — do not render an Alternate Project Officer field for grants. `alternate_project_officer_id` stays unused for GRANT (matches the design exactly; diverges intentionally from the Contract block's PO + Alternate PO pair).
- **Project Specialist** is a new user-reference FK (`project_specialist_id`, FK to `ops_user`), not free text — the design renders it as a combobox identical in style to FPO, not a text `Input`. It grants the same automatic view access as PO/Alt-PO/Team Members: `project_specialist_id` is added to `Agreement.authorized_user_ids` (see step 1a).
- **Grant Funding Period** is a new `funding_period_months` Integer column, explicitly in months (matches the design's "18 months" literally). Do **not** repurpose the existing unused `number_of_years` column on `GrantAgreement` — leave it as a separate, still-dead column (flag in PR description, don't touch). Rendered as a plain numeric `Input` this slice, not a native stepper — see step 8 (confirmed with PO: ship the simpler control now, file a fast-follow for the stepper widget).
- **NOFO Number is required** — blocks Save Draft, exactly like Agreement Title already does. Added to the Vest suite as a GRANT-required field and to `shouldDisableBtn` (see step 10 — Title uses both an explicit check and a suite test, and `nofo_number` must follow the same dual pattern, not one alone).
- **One combined PR** — backend (model/migration/schema/OpenAPI) and frontend ship together, same as #5925. Revisit this if implementation review finds the 17-item file list unwieldy for one review pass; splitting backend from frontend into two sequential PRs remains a fallback, not a change to this plan.

### Out of scope — and a naming note
- **Grant Numbers (#5927) and Grant Budget Lines (#5928)** — Step 3 of the wizard. **Disambiguation, because these are easy to conflate:** this ticket's **"NOFO Number"** is a single required text field on THIS page (Step 2, Grant Details) identifying the Notice of Funding Opportunity the grant responds to. Issue #5927's **"Grant Number"** is a different, later concept — a repeatable child entity created on Step 3 with its own stepper control ("Placeholder grant # until award"), Period of Performance start/end dates, and a Description. They are not the same field and not interchangeable; this slice touches only NOFO Number.
- Editing a grant from the details page — still blocked by `isNotDevelopedYet(GRANT)` per the #5925 slice; unaffected by this slice.
- Backfilling `total_funding` / `number_of_years` / `number_of_grants` into the schema/UI — these are pre-existing unused columns unrelated to this design; flag their dead-column status in the PR description but do not wire them up.

## Critical Files

**Backend:**
- `backend/models/agreements.py` — `GrantAgreement` model (currently just `foa`, `total_funding`, `number_of_years`, `number_of_grants`).
- `backend/alembic/versions/` — new migration, modeled on `2025_02_20_2207-b5d03aa79d12_add_more_attributes_to_grants.py`.
- `backend/ops_api/ops/schemas/agreements.py` — `GrantAgreementData` / `GrantAgreementResponse` / `GrantListAgreementResponse` (currently only add `foa` on top of the base `AgreementData`/`AgreementResponse`).
- `backend/openapi.yml` — `GrantAgreementData` (~line 9071) / `GrantAgreementResponse` (~line 9232) schema blocks; sync via `/sync-openapi` skill after model/schema changes.
- `backend/data_tools/src/load_grants/utils.py` (`create_models`, ~lines 93-132) and `backend/data_tools/data/agreements_and_blin_data.json5` (`grant_agreement` seed array) — optional, nullable columns don't strictly require updates here, but should be checked so seed/ETL data isn't silently missing the new fields.

**Frontend:**
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.jsx` — add the new "Grant Details" JSX block, gated on `isGrant` (parallel to the existing `!isGrant` contract block at lines 427-628).
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.hooks.js` — new setters/state, extend `handleAgreementFilterChange` to clear Grant Details fields when switching away from GRANT.
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditFormSuite.js` — new `nofo_number` required-for-GRANT test (inverse-guard pattern: `if (!isGrant) return;`).
- `frontend/src/helpers/agreement.helpers.js` — extend the `[AgreementType.GRANT]` entry in `AGREEMENT_TYPE_VISIBLE_FIELDS`.
- `frontend/src/pages/agreements/agreements.constants.js` — new `AgreementFields` enum entries (`NofoNumber`, `AlnNumber`, `ProjectSpecialist`, `GrantFundingPeriod` — no `FederalProjectOfficer` entry; see step 12).
- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — render the new fields on the read-only details page.
- `frontend/src/helpers/utils.js` (`convertCodeForDisplay`, ~line 224-231) — `projectOfficer.GRANT` label change from `"Project Officer"` to `"Federal Project Officer"`.
- `frontend/src/components/Agreements/ProjectOfficerComboBox.jsx` — reused as-is for both FPO and Project Specialist (generic props already support arbitrary `label`/state).

No net-new combobox component is needed for Project Specialist — `ProjectOfficerComboBox` is already generic (takes `selectedProjectOfficer`/`setSelectedProjectOfficer`/`label`/`messages`/`onChange` props, backed by `useGetUsersQuery`), so it can be reused for Project Specialist with different prop names/labels bound to a new `project_specialist_id` field.

---

## Implementation

### 1. Backend model — `GrantAgreement` (`backend/models/agreements.py`)

Add three new columns:
```python
class GrantAgreement(Agreement):
    __tablename__ = "grant_agreement"
    id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), primary_key=True)
    foa: Mapped[Optional[str]] = mapped_column(String)
    total_funding: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2))
    number_of_years: Mapped[Optional[int]] = mapped_column(Integer)
    number_of_grants: Mapped[Optional[int]] = mapped_column(Integer)
    nofo_number: Mapped[Optional[str]] = mapped_column(String)
    aln_number: Mapped[Optional[str]] = mapped_column(String)
    funding_period_months: Mapped[Optional[int]] = mapped_column(Integer)
    project_specialist_id: Mapped[Optional[int]] = mapped_column(ForeignKey("ops_user.id"))
    project_specialist: Mapped[Optional["User"]] = relationship("User", foreign_keys=[project_specialist_id])
    __mapper_args__ = {"polymorphic_identity": AgreementType.GRANT}
```
- `nofo_number`/`aln_number` are nullable at the DB level (matches every other agreement string field, e.g. `contract_number`) — the "required" constraint for NOFO Number is enforced at the frontend Vest-suite layer only, consistent with how `name` (Agreement Title) is nullable in the DB but required by the frontend suite. Do not add a NOT NULL constraint; that would break the "come back and edit later" language in the Figma helper text and require a backfill story for existing grants.
- `project_specialist_id` follows the same FK pattern as `project_officer_id`/`alternate_project_officer_id` on the base `Agreement` class — no new relationship table needed (`ForeignKey("ops_user.id")` + `relationship("User", ...)`, single-valued, not a M2M like `team_members`). No back-populate collision: `project_officer`/`alternate_project_officer` are already one-directional relationships with no back-populated attribute on `User`, so `project_specialist` can follow the identical shape safely.
- Remove the stale `# TODO: Skeleton, will need flushed out more when we know what all a Grant is.` comment above the class now that it's genuinely fleshed out.
- Leave `get_required_fields_for_status_change()` / `get_required_fields_for_awarded_agreement()` returning `[]` — award-status field requirements are out of scope for this slice (grants can't be awarded yet).

### 1a. Authorization — `Agreement.authorized_user_ids` (`backend/models/agreements.py:589-601`)

This property already adds `project_officer_id`, `alternate_project_officer_id`, and `team_members` to the set of users authorized to view an agreement. Per product decision, add `project_specialist_id` to this same set so a Project Specialist automatically gets view access to a grant they're assigned to, consistent with PO/Alt-PO. This is a one-line addition to an existing property, not a new authorization mechanism — no new `@is_authorized` scope is needed anywhere (confirmed: authorization in this codebase is resource-level via `@is_authorized(PermissionType.X, Permission.AGREEMENT)` on the route, not field-level; `authorized_user_ids` is a separate, additive visibility list consumed elsewhere for filtering "my agreements").

### 2. Migration (`backend/alembic/versions/`)

Follow the exact pattern in `2025_02_20_2207-b5d03aa79d12_add_more_attributes_to_grants.py`: `op.add_column("grant_agreement", ...)` for each new column, nullable=True, PLUS the mirrored `op.add_column("grant_agreement_version", ..., autoincrement=False, nullable=True)` for the audit/version table. Include `op.create_foreign_key(...)` for `project_specialist_id` → `ops_user.id` (model the FK migration on `2026_06_16_2230-13d45ff8c225_add_vendor_id_to_step_6.py`, which adds a similar FK). Write paired `downgrade()` dropping version-table columns first, then main-table columns, in reverse order. Use `/db-migrations` skill for the full workflow (autogenerate, review, `alembic upgrade head`).

`grant_agreement_version` is a real, existing table generated by SQLAlchemy-Continuum (`sqlalchemy_continuum.make_versioned(...)` + `BaseModel.__versioned__ = {}` in `backend/models/base.py`) — confirmed, not speculative. Continuum manages the version *model*/metadata automatically but does **not** auto-migrate the DB schema, so the hand-written `add_column` on `grant_agreement_version` in this migration is genuinely required, exactly as both precedent migrations do it.

This is separate from the `OpsDBHistory`/`agreement_history` event-driven audit mechanism (`models/history.py`) described in the backend CLAUDE.md — that system works generically off `mapper.columns` with no per-model column allowlist, so the new grant columns get audit-tracked there automatically with zero extra work. No new `*_history` table is needed; confirmed during planning, not just asserted.

### 3. Marshmallow schema (`backend/ops_api/ops/schemas/agreements.py`)

```python
class GrantAgreementData(AgreementData):
    foa = fields.String(allow_none=True)
    nofo_number = fields.String(allow_none=True)
    aln_number = fields.String(allow_none=True)
    funding_period_months = fields.Integer(allow_none=True)
    project_specialist_id = fields.Integer(allow_none=True)
```
Mirror the same four fields onto `GrantAgreementResponse` and `GrantListAgreementResponse`. **Note**: there is no existing precedent in this schema file for nesting a full user object on an agreement response — `project_officer_id`/`cotr_id` are dumped as plain `fields.Integer(allow_none=True)`, and the frontend independently fetches user details via `useGetUsersQuery`/`getUser(id)`. Follow that exact precedent: `project_specialist_id = fields.Integer(allow_none=True)` on the response schemas, no nested object. (This corrects an earlier draft of this plan that assumed a nested `project_officer` shorthand existed to mirror — it doesn't; don't invent one.)

Do **not** add `nofo_number`/`aln_number` as `required=True` in the schema. This is a deliberate new convention for this codebase (the one existing precedent, `AgreementData.name`, is required at *both* the schema and frontend layers) — the choice here is schema-optional / frontend-required specifically so a legitimate future PATCH from a non-wizard client isn't blocked by a field the API itself doesn't strictly need, while the wizard's Save Draft UX still enforces it via the Vest suite (step 9) and `shouldDisableBtn` (step 10). Revisit only if there's a concrete reason the API itself must reject a NOFO-less grant regardless of client.

### 4. OpenAPI (`backend/openapi.yml`)

Add the four new properties to both `GrantAgreementData` (~line 9071) and `GrantAgreementResponse` (~line 9232) blocks, matching the types used in step 3. Run `/sync-openapi` skill after the resource/schema changes land, then `./backend/validate_openapi.sh`. While in this file, note (don't necessarily fix in this PR) that `total_funding`/`number_of_years`/`number_of_grants` are still undocumented from a prior slice — call out as pre-existing debt in the PR description, not something this slice is responsible for backfilling.

### 5. Backend tests

- Extend `backend/ops_api/tests/ops/agreement/test_agreement_change_requests.py`'s local `test_grant_agreement` fixture (or add a sibling fixture) to include the new fields, and add a focused test asserting create/read round-trips `nofo_number`, `aln_number`, `funding_period_months`, `project_specialist_id` through `POST`/`GET /agreements`.
- Add a schema test in `backend/ops_api/tests/ops/schemas/test_agreements.py` (alongside the existing `test_grant_agreement_data_has_nested_fields`) asserting the new fields load/dump correctly, including `allow_none`.
- No new validation-rule tests needed — `ServiceRequirementTypeRule` and the awarded/immutable-field rules are Contract/AA-specific and already correctly return `[]`/skip for GRANT; this slice doesn't touch those rules.

### 6. Frontend state wiring — `AgreementEditForm.hooks.js`

Add setters mirroring the existing pattern:
```js
const setNofoNumber = useUpdateAgreement("nofo_number");
const setAlnNumber = useUpdateAgreement("aln_number");
const setFundingPeriodMonths = useUpdateAgreement("funding_period_months");
const setProjectSpecialistId = useUpdateAgreement("project_specialist_id");
const setSelectedProjectSpecialist = useSetState("selected_project_specialist");
```
Destructure `nofo_number`, `aln_number`, `funding_period_months` off `agreement` (same style as `notes`/`vendor`/etc. at lines 132-149) and `selected_project_specialist` off `useEditAgreement()` (same style as `selected_project_officer`). Add a `changeSelectedProjectSpecialist` handler mirroring `changeSelectedProjectOfficer` (lines 333-337).

Register `selected_project_specialist: {}` in `defaultState` (`AgreementEditorContext.hooks.js`) alongside `selected_project_officer`/`selected_alternate_project_officer`, and seed it via a new `projectSpecialist` prop on `EditAgreementProvider`, mirroring the `projectOfficer`/`alternateProjectOfficer` prop-seeding in `AgreementEditorContext.jsx` (lines 36-41). **Important — the source of that prop is NOT a nested field on `agreement`** (the API only returns `project_officer_id` as a plain integer, confirmed in step 3): each `projectOfficer`/`alternateProjectOfficer` value is fetched separately via `getUser(id)` and held in local `useState` by the PARENT component, then passed down as a prop. The three real fetch sites to extend are:
- `frontend/src/pages/agreements/details/Agreement.jsx` (~lines 81-225) — fetches PO/Alt-PO via `getProjectOfficerSetState`/`getUser`, passes both into `<AgreementDetails projectOfficer={...} alternateProjectOfficer={...} />`. Add a third `getUser(agreement?.project_specialist_id)` fetch + `projectSpecialist` state, threaded the same way through `AgreementDetails.jsx` → `AgreementDetailsEdit.jsx` → `EditAgreementProvider`.
- `frontend/src/pages/agreements/EditAgreement.jsx` (lines 10-14, 34-51, 90-95) — same `getUser`-fetch-into-`useState` pattern, feeds `EditAgreementProvider` directly. Add the equivalent `projectSpecialist` fetch/state/prop.
- `frontend/src/pages/agreements/review/EditAgreementAndBudgetLines.jsx` — has its own `getUser` calls for the review/approval flow; check and extend analogously.
- **`CreateAgreement.jsx` needs NO change** — a brand-new agreement has no `project_specialist_id` yet to fetch, and today it doesn't pass `projectOfficer`/`alternateProjectOfficer` to `EditAgreementProvider` at all (confirmed: it renders `<EditAgreementProvider>` with no such props). Do not add prop-threading here; there's nothing to seed until the grant is saved and reloaded.
- `AgreementDetailsEdit.jsx` is a pure pass-through (destructures `projectOfficer`/`alternateProjectOfficer` from its own props and forwards them to `EditAgreementProvider`) — add `projectSpecialist` to its prop list and pass-through, but the actual `getUser` fetch happens upstream in `Agreement.jsx`, not here.

**Extend `handleAgreementFilterChange`** (lines 662-686): when switching to a NON-grant type (CONTRACT/DIRECT_OBLIGATION/PARTNER), clear the new Grant Details fields — `setNofoNumber(null)`, `setAlnNumber(null)`, `setFundingPeriodMonths(null)`, `changeSelectedProjectSpecialist(null)` — the inverse of the existing GRANT-branch clearing (which nulls contract-only fields when switching *to* GRANT). Today the function only clears state on entry to GRANT; it does not clear Grant-only state on exit. Without this, switching Grant → Contract → back to a different Grant would leak stale NOFO/ALN/FPO/Specialist values into a subsequent unrelated save. Team Members already gets cleared in both directions implicitly (it's a shared field, cleared only on entry-to-GRANT today — verify whether Contract needs the same symmetric clearing added, or whether this is pre-existing behavior out of scope here; if in scope, add it in the same edit for consistency).

Return the four new fields/handlers from the hook.

### 7. Frontend JSX — `AgreementEditForm.jsx`

Add a new block gated on `isGrant`, positioned directly after the existing 4-field block (Title/Nickname/Description, currently ending ~line 347) and before the `{!isGrant && (...)}` contract block:

```jsx
{isGrant && (
    <>
        <h3 className="font-sans-lg text-semibold">Grant Details</h3>
        <p>Please complete the information below for this grant...</p>
        <Input
            name="nofo_number"
            label="NOFO Number"
            isRequired={true}
            messages={res.getErrors("nofo_number")}
            value={nofoNumber || ""}
            onChange={(name, value) => { setNofoNumber(value); runValidate(name, value); }}
        />
        {/* Grant Funding Period — numeric input, unit "months"; no existing stepper component (see step 8) */}
        <Input
            name="funding_period_months"
            label="Grant Funding Period"
            value={fundingPeriodMonths ?? ""}
            onChange={(name, value) => { if (/^[0-9]*$/.test(value)) setFundingPeriodMonths(value === "" ? null : Number(value)); }}
        />
        <Input
            name="aln_number"
            label="ALN Number"
            value={alnNumber || ""}
            onChange={(name, value) => setAlnNumber(value)}
        />
        <div className="display-flex margin-top-3">
            <ProjectOfficerComboBox
                selectedProjectOfficer={selectedProjectOfficer}
                setSelectedProjectOfficer={changeSelectedProjectOfficer}
                label="Federal Project Officer (FPO)"
                messages={res.getErrors("project_officer")}
            />
            <ProjectOfficerComboBox
                className="margin-left-4"
                selectedProjectOfficer={selectedProjectSpecialist}
                setSelectedProjectOfficer={changeSelectedProjectSpecialist}
                label="Project Specialist"
            />
        </div>
        <div className="margin-top-3 width-card-lg">
            <TeamMemberComboBox
                selectedTeamMembers={selectedTeamMembers}
                selectedProjectOfficer={selectedProjectOfficer}
                setSelectedTeamMembers={setSelectedTeamMembers}
                overrideStyles={{ width: "15em" }}
            />
        </div>
        <h3 className="font-sans-sm text-semibold">Team Members Added</h3>
        <TeamMemberList selectedTeamMembers={selectedTeamMembers} removeTeamMember={removeTeamMember} />
        <TextArea
            name="agreementNotes"
            label="Notes (optional)"
            maxLength={500}
            messages={res.getErrors("agreementNotes")}
            value={agreementNotes || ""}
            onChange={(name, value) => setAgreementNotes(value)}
        />
    </>
)}
```
Notes on the sketch above (finalize exact JSX/props during implementation, not a copy-paste-ready diff):
- `TeamMemberComboBox` for grants omits `selectedAlternateProjectOfficer` entirely (there is no Alternate FPO) — **confirmed safe**: the component destructures it with no default and only ever reads it via optional chaining (`user.id !== selectedAlternateProjectOfficer?.id`), so an omitted/undefined prop never matches a real user id and causes no incorrect filtering or crash. No component change needed. (Its JSDoc implies the prop is required since it's not bracketed — that's a pre-existing doc inaccuracy, not something this slice needs to fix.)
- Reuse the exact same `TeamMemberList`/Notes `TextArea` JSX the contract block already uses (same components, just moved into the grant-gated block) — do not duplicate/fork them into new grant-specific components.
- The `isGrant` block sits ABOVE the `!isGrant` contract block, matching the design's visual order (Agreement Details → Grant Details, vs. Agreement Details → Contract-only controls).

### 8. Grant Funding Period widget — plain `Input`, confirmed with product owner

The design shows a numeric stepper (up/down arrows) displaying "18 months" — no such control exists anywhere in `frontend/src/components/UI` today. **Decision (confirmed): ship a plain `Input` this slice**, not a new stepper component. Use numeric-only filtering in the `onChange` handler (same digit-regex pattern as `YearInput.jsx`'s `if (e.target.value.match(/^[0-9]*$/))` guard). This intentionally diverges from the Figma spinner control — call this out explicitly in the PR description as a known visual gap, and file a separate follow-up ticket for a native `<input type="number">`/spinner widget if/when design review requires exact fidelity. Do not build a new shared stepper component in this slice.

### 9. Validation — `AgreementEditFormSuite.js`

Add one new test, following the established inverse-guard convention (grant-*required* fields use `if (!isGrant) return;`, the opposite of the existing 8 contract-only `if (isGrant) return;` guards):
```js
test("nofo_number", "This is required information", () => {
    if (!isGrant) return;
    enforce(data.nofo_number).isNotBlank();
});
```
No other new fields are required — ALN Number, Funding Period, FPO, Project Specialist, Team Members, and Notes are all optional per the design, matching the pattern already established for `notes` (optional/no test exists for it today) and how Contract's own optional fields (e.g. `notes`) have no validation test either.

### 10. Submit gating — `shouldDisableBtn` (`AgreementEditForm.hooks.js`)

**Confirmed**: Title enforcement is a dual mechanism, not `res.hasErrors()` alone — the current code is:
```js
const shouldDisableBtn =
    !agreementTitle || !agreement?.project_id || !agreementType ||
    res.hasErrors() || hasUniquenessErrors ||
    (isAgreementAA && (!servicingAgency || !requestingAgency));
```
`!agreementTitle` is an explicit check here, IN ADDITION to the `name` Vest test that also feeds `res.hasErrors()`. Since `nofo_number` is meant to be the grant-equivalent hard-requirement to Title, add the matching explicit check: `|| (isGrant && !nofoNumber)`, alongside (not instead of) the Vest suite test from step 9. Relying on `res.hasErrors()` alone would be inconsistent with how the one other precedent (Title) is actually enforced in this codebase.

### 11. Clearing on type switch — symmetric with step 6

Already covered in step 6's `handleAgreementFilterChange` extension — repeated here as a checklist item: on switch AWAY from GRANT (to CONTRACT/DIRECT_OBLIGATION/PARTNER), clear `nofo_number`, `aln_number`, `funding_period_months`, `project_specialist_id`/`selected_project_specialist`. Do NOT touch the switch-TO-GRANT branch's existing contract-clearing logic (already correct from #5925).

### 12. Details-page view — `AgreementDetailsView.jsx` + `agreement.helpers.js`

Add new `AgreementFields` enum entries (`agreements.constants.js`): `NofoNumber`, `AlnNumber`, `ProjectSpecialist`, `GrantFundingPeriod`. (Do **not** add a `FederalProjectOfficer` entry — the FPO block is a relabel of the existing always-on PO/Alt-PO block, not a new gated field; adding an enum value with no corresponding `isFieldVisible` call would be dead code.) Extend the GRANT set in `AGREEMENT_TYPE_VISIBLE_FIELDS`:
```js
[AgreementType.GRANT]: new Set([
    AgreementFields.DescriptionAndNotes,
    AgreementFields.NickName,
    AgreementFields.NofoNumber,
    AgreementFields.AlnNumber,
    AgreementFields.ProjectSpecialist,
    AgreementFields.GrantFundingPeriod
])
```
In `AgreementDetailsView.jsx`, add new gated `<dl>` blocks (mirroring the Contract # block pattern at ~lines 98-110) for NOFO Number, ALN Number, and Grant Funding Period, placed near the top of the details tags (next to the existing Nickname/Description gates). For Project Specialist, add a new gated block near the existing (currently unconditional) Project Officer/Alternate PO block (~lines 447-479) — Project Specialist is GRANT-only and has no Contract equivalent, so it needs its own new `<dl>`, not a relabel of an existing one.

**Federal Project Officer label**: change `frontend/src/helpers/utils.js`'s `projectOfficer.GRANT` map entry (~line 224-231) from `"Project Officer"` to `"Federal Project Officer"`. This label is used both by the wizard's `ProjectOfficerComboBox` (`label={convertCodeForDisplay("projectOfficer", agreementType)}`) and by `AgreementDetailsView.jsx`'s existing unconditional PO/Alt-PO block (line 450). **Confirmed safe**: the map is keyed per-type (`AA`/`CONTRACT`/`IAA` → `"COR"`; `DIRECT_OBLIGATION`/`MISCELLANEOUS` → `"Project Officer"`), so changing only the `GRANT` entry cannot affect other types' rendering, and a repo-wide search for `"Project Officer"` text combined with a GRANT fixture found only `ProjectOfficerComboBox.test.jsx`, which hardcodes its own `label` prop directly rather than reading this map — no existing test breaks.

**Alternate PO block for grants**: since Grants have no Alternate FPO, and `AgreementDetailsView.jsx`'s Alternate PO block (~lines 465-479) is currently unconditional for ALL types (unlike every other gated block in this file, which uses a single `isFieldVisible` call), gate it off for GRANT using a plain inline guard — `agreement?.agreement_type !== "GRANT" && (...)` — rather than promoting it to `isFieldVisible`. **Why not `isFieldVisible`**: that would require adding a matching field entry to the CONTRACT/AA/PARTNER/DIRECT_OBLIGATION sets too (to preserve their current unconditional rendering), which is unnecessary extra surface area for a one-off GRANT-only exclusion. The inline guard is a smaller, more targeted change and matches the scope of what's actually needed here.

### 13. Tests (frontend)

- **Suite unit test**: extend `AgreementEditFormSuite.test.js`'s `describe("AgreementEditFormSuite — GRANT", ...)` block with a case asserting `nofo_number` blank → `hasErrors()` true, and a valid case with `nofo_number` set → no errors. Add to the CONTRACT regression block if needed to confirm `nofo_number`'s test doesn't affect Contract validation (it early-returns via `if (!isGrant) return;` so should be a no-op for Contract).
- **Hooks test**: extend `AgreementEditForm.hooks.test.js`'s existing `handleAgreementFilterChange` describe block with a case for switching AWAY from GRANT clearing the new fields (mirrors the existing switch-TO-GRANT clearing test).
- **Form render test**: assert that with Grant selected, the new fields (NOFO Number, Grant Funding Period, ALN Number, Federal Project Officer, Project Specialist, Team Members, Notes) render, Save Draft stays disabled until NOFO Number (plus Title/Project, from #5925) is filled, and Contract-only controls remain absent (regression check against #5925's existing test).
- **Details-view test**: a GRANT agreement fixture with all new fields populated renders NOFO Number, ALN Number, Grant Funding Period, "Federal Project Officer" label + value, Project Specialist, and does NOT render an Alternate FPO block.
- **E2E**: extend `frontend/cypress/e2e/createGrantAgreement.cy.js` (from #5925) — after selecting GRANT and before Save Draft, fill NOFO Number (now required to enable Save Draft — update the existing "Save Draft should now be enabled" assertion, which today only requires Title+Description, to also require NOFO Number), optionally fill Funding Period/ALN/FPO/Specialist/Team Member/Notes, confirm Save Draft enables only once NOFO Number is present, save, and assert the new fields appear on the resulting details page.

## Verification
1. `cd backend && alembic upgrade head` (via `/db-migrations` skill) — migration applies cleanly, `alembic downgrade -1` reverses cleanly.
2. `cd backend/ops_api && pipenv run pytest tests/ops/agreement tests/ops/schemas -k grant` — backend grant tests green.
3. `pipenv run nox -s lint && pipenv run nox -s format-check` (backend).
4. `/sync-openapi` skill, then `./backend/validate_openapi.sh`.
5. `cd frontend && bun run test --watch=false` — unit tests green (90% coverage gate).
6. `bun run lint --fix && bun run format`.
7. Manual (Docker stack up): `/agreements/create` → pick a Project → Continue → select **Grant** → confirm Agreement Details (Title/Nickname/Description) AND Grant Details (NOFO/Funding Period/ALN/FPO/Specialist/Team Members/Notes) both render → Save Draft disabled until NOFO Number + Title filled → fill required fields → Save Draft enables → save → confirm success alert + redirect. Open the new grant's details page → confirm all new fields display correctly, no Alternate FPO block shown.
8. Regression: create a Contract the same way — Grant Details block does not render; all Contract fields still show/validate/save correctly. Switch a form from Grant → Contract → Grant mid-edit and confirm no stale NOFO/ALN/FPO/Specialist values leak across the switches.
9. E2E: `bun run test:e2e` (or `/e2e-tests` skill) including the updated grant spec.

## File-by-file change list
**Backend:**
1. `backend/models/agreements.py` — add `nofo_number`, `aln_number`, `funding_period_months`, `project_specialist_id`/`project_specialist` to `GrantAgreement`; add `project_specialist_id` to `Agreement.authorized_user_ids`; remove stale skeleton TODO comment.
2. New Alembic migration in `backend/alembic/versions/` — add columns to `grant_agreement` + `grant_agreement_version`, FK for `project_specialist_id`.
3. `backend/ops_api/ops/schemas/agreements.py` — extend `GrantAgreementData`/`GrantAgreementResponse`/`GrantListAgreementResponse` (plain scalar fields, no nesting).
4. `backend/openapi.yml` — sync via `/sync-openapi` skill.
5. Backend tests — extend `test_agreement_change_requests.py` fixture/tests, `test_agreements.py` (schemas).
6. (Verify only, update if needed) `backend/data_tools/src/load_grants/utils.py`, `backend/data_tools/data/agreements_and_blin_data.json5`.

**Frontend:**
7. `AgreementEditForm.hooks.js` — new setters/state for NOFO/ALN/Funding Period/Project Specialist; extend `handleAgreementFilterChange` to clear on switch-away-from-GRANT; explicit `nofo_number` check in `shouldDisableBtn`; return new fields.
8. `AgreementEditorContext.hooks.js` — add `selected_project_specialist: {}` to `defaultState`.
9. `AgreementEditorContext.jsx` — seed `selected_project_specialist` from a new `projectSpecialist` prop.
10. `frontend/src/pages/agreements/details/Agreement.jsx` and `frontend/src/pages/agreements/EditAgreement.jsx` (and `review/EditAgreementAndBudgetLines.jsx` if it has its own `getUser` calls) — add a `getUser(project_specialist_id)` fetch + state, mirroring the existing PO/Alt-PO fetch pattern; thread the resulting `projectSpecialist` prop down through `AgreementDetails.jsx` → `AgreementDetailsEdit.jsx` → `EditAgreementProvider`. **`CreateAgreement.jsx` needs no change** (no existing agreement to fetch a specialist for).
11. `AgreementEditForm.jsx` — new `isGrant`-gated "Grant Details" JSX block (NOFO/Funding Period/ALN/FPO/Specialist/Team Members/Notes).
12. `AgreementEditFormSuite.js` — new `nofo_number` required-for-GRANT test.
13. `agreements.constants.js` — new `AgreementFields` enum entries (`NofoNumber`, `AlnNumber`, `ProjectSpecialist`, `GrantFundingPeriod` — no `FederalProjectOfficer` entry).
14. `agreement.helpers.js` — extend `AGREEMENT_TYPE_VISIBLE_FIELDS[GRANT]`.
15. `AgreementDetailsView.jsx` — new gated blocks for NOFO/ALN/Funding Period/Project Specialist; gate off Alternate PO block for GRANT via an inline `agreement_type !== "GRANT"` guard (not `isFieldVisible`).
16. `frontend/src/helpers/utils.js` — `projectOfficer.GRANT` label → `"Federal Project Officer"`.
17. Tests — suite test, hooks test, form render test, details-view test, `createGrantAgreement.cy.js` E2E update.

*(Not code: note in the PR description that `total_funding`/`number_of_years`/`number_of_grants` remain unexposed pre-existing dead columns, unrelated to this slice's new fields, and that the Grant Funding Period control is a plain numeric `Input` rather than a stepper widget, per the confirmed decision in step 8 — file a follow-up ticket for the stepper if design review requires exact fidelity.)*

## Risks carried into implementation (resolved during planning review — listed so implementers don't need to re-litigate them)
- **`nofo_number` required-ness**: schema-optional, frontend-required via both the Vest suite (step 9) AND an explicit `shouldDisableBtn` check (step 10) — confirmed as the correct dual-enforcement pattern by cross-checking how Title is actually enforced today, not assumed.
- **`TeamMemberComboBox`'s `selectedAlternateProjectOfficer` prop**: confirmed safe to omit for the grant block — verified via the component's actual optional-chaining usage, not left as an open question.
- **Project Specialist prop-threading**: confirmed the real fetch sites are `Agreement.jsx`/`EditAgreement.jsx`/`EditAgreementAndBudgetLines.jsx` (each independently calls `getUser(id)` into local state), not a nested field on the agreement API response and not `CreateAgreement.jsx`.
- **`*_history` vs `*_version` tables**: confirmed `grant_agreement_version` is a real SQLAlchemy-Continuum-managed table requiring hand-written migration columns (as the precedent migrations already do), and that this is unrelated to the separate, automatic `OpsDBHistory` event-driven audit mechanism — no new history table needed.
- **`FederalProjectOfficer` enum entry**: dropped from the `AgreementFields` enum — it would have been unused dead code, since FPO is a label change on an existing always-on block, not a new gated field.
