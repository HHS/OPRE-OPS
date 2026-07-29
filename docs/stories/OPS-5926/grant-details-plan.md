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

Unlike #5925 (frontend-only — the backend already supported Type/Title/Nickname/Description), **this slice requires backend changes**: `nofo_number`, `aln_number`, and `funding_period_months` do not exist anywhere in the codebase today and must be added to the `GrantAgreement` model, an Alembic migration, and the Marshmallow schema. Team Members and Notes already exist on the base `Agreement` model (shared with Contracts) and only need frontend wiring. **Project Specialist needs no backend work at all** — see the updated decision below; it reuses the existing `alternate_project_officer_id` column/relationship/schema field/authorization wiring, all of which already exist and already work for Contracts today.

### Decisions confirmed with product owner
- **Federal Project Officer (FPO)** reuses the existing `project_officer_id` column/relationship — same as Contracts reuse it and display it as "COR". No new column; only a label change (`GRANT: "Federal Project Officer"` in the `projectOfficer` display-label map).
- **Project Specialist reuses the existing `alternate_project_officer_id` column/relationship** (revised decision — supersedes the original plan's new `project_specialist_id` FK). The design shows FPO and Project Specialist as two separate single-user comboboxes, which visually maps exactly onto the existing Project Officer + Alternate Project Officer pair Contracts already use — for GRANT, "Alternate Project Officer" is relabeled "Project Specialist" at the frontend display layer only. This means: **no new column, no migration, no new schema field** — `alternate_project_officer_id` already exists on `Agreement`, is already in `AgreementData`/`AgreementResponse`, and is already included in `Agreement.authorized_user_ids` (`backend/models/agreements.py:600-601`), so a Project Specialist automatically gets the same view access a Contract's Alternate PO already gets, with zero backend changes. The backend has no concept of "Project Specialist" and doesn't need one — it's purely a frontend relabeling of the same underlying field, the same way "Federal Project Officer" is a frontend relabeling of `project_officer_id`.
- **Grant Funding Period** is a new `funding_period_months` Integer column, explicitly in months (matches the design's "18 months" literally). Do **not** repurpose the existing unused `number_of_years` column on `GrantAgreement` — leave it as a separate, still-dead column (flag in PR description, don't touch). Rendered as a plain numeric `Input` this slice, not a native stepper — see step 8 (confirmed with PO: ship the simpler control now, file a fast-follow for the stepper widget).
- **NOFO Number is required** — blocks Save Draft, exactly like Agreement Title already does. Added to the Vest suite as a GRANT-required field and to `shouldDisableBtn` (see step 10 — Title uses both an explicit check and a suite test, and `nofo_number` must follow the same dual pattern, not one alone).
- **One combined PR** — backend (model/migration/schema/OpenAPI) and frontend ship together, same as #5925. Revisit this if implementation review finds the 17-item file list unwieldy for one review pass; splitting backend from frontend into two sequential PRs remains a fallback, not a change to this plan.

### Out of scope — and a naming note
- **Grant Numbers (#5927) and Grant Budget Lines (#5928)** — Step 3 of the wizard. **Disambiguation, because these are easy to conflate:** this ticket's **"NOFO Number"** is a single required text field on THIS page (Step 2, Grant Details) identifying the Notice of Funding Opportunity the grant responds to. Issue #5927's **"Grant Number"** is a different, later concept — a repeatable child entity created on Step 3 with its own stepper control ("Placeholder grant # until award"), Period of Performance start/end dates, and a Description. They are not the same field and not interchangeable; this slice touches only NOFO Number.
- Editing a grant from the details page — still blocked by `isNotDevelopedYet(GRANT)` per the #5925 slice; unaffected by this slice.
- Backfilling `total_funding` / `number_of_years` / `number_of_grants` into the schema/UI — these are pre-existing unused columns unrelated to this design; flag their dead-column status in the PR description but do not wire them up.

## Critical Files

**Backend:**
- `backend/models/agreements.py` — `GrantAgreement` model (currently just `foa`, `total_funding`, `number_of_years`, `number_of_grants`). No changes needed for Project Specialist — it reuses the existing `alternate_project_officer_id` on the base `Agreement` class.
- `backend/alembic/versions/` — new migration, modeled on `2025_02_20_2207-b5d03aa79d12_add_more_attributes_to_grants.py`, for `nofo_number`/`aln_number`/`funding_period_months` only.
- `backend/ops_api/ops/schemas/agreements.py` — `GrantAgreementData` / `GrantAgreementResponse` / `GrantListAgreementResponse` (currently only add `foa` on top of the base `AgreementData`/`AgreementResponse`, which already carries `alternate_project_officer_id`).
- `backend/openapi.yml` — `GrantAgreementData` (~line 9071) / `GrantAgreementResponse` (~line 9232) schema blocks; sync via `/sync-openapi` skill after model/schema changes.
- `backend/data_tools/src/load_grants/utils.py` (`create_models`, ~lines 93-132) and `backend/data_tools/data/agreements_and_blin_data.json5` (`grant_agreement` seed array) — optional, nullable columns don't strictly require updates here, but should be checked so seed/ETL data isn't silently missing the new fields.

**Frontend:**
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.jsx` — add the new "Grant Details" JSX block, gated on `isGrant` (parallel to the existing `!isGrant` contract block at lines 427-628).
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.hooks.js` — new setters/state for NOFO/ALN/Funding Period only; Project Specialist reuses the existing `selectedAlternateProjectOfficer`/`changeSelectedAlternateProjectOfficer`/`setAlternateProjectOfficerId` plumbing that already exists for Contracts — no new state needed. Extend `handleAgreementFilterChange` to clear NOFO/ALN/Funding Period fields when switching away from GRANT (Alternate PO/Project Specialist clearing already exists from #5925).
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditFormSuite.js` — new `nofo_number` required-for-GRANT test (inverse-guard pattern: `if (!isGrant) return;`).
- `frontend/src/helpers/agreement.helpers.js` — extend the `[AgreementType.GRANT]` entry in `AGREEMENT_TYPE_VISIBLE_FIELDS`.
- `frontend/src/pages/agreements/agreements.constants.js` — new `AgreementFields` enum entries (`NofoNumber`, `AlnNumber`, `GrantFundingPeriod` — no `FederalProjectOfficer` or `ProjectSpecialist` entries; see step 12).
- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — render the new fields on the read-only details page; relabel the existing Alternate PO block to "Project Specialist" for GRANT rather than adding a new block.
- `frontend/src/helpers/utils.js` (`convertCodeForDisplay`, ~line 224-231) — `projectOfficer.GRANT` label change from `"Project Officer"` to `"Federal Project Officer"`; add an equivalent `alternateProjectOfficer`-style map entry (or extend the existing one, see step 6) so `GRANT` displays "Project Specialist" instead of "Alternate Project Officer"/"Alternate COR".
- `frontend/src/components/Agreements/ProjectOfficerComboBox.jsx` — reused as-is for both FPO and Project Specialist (generic props already support arbitrary `label`/state); this was already true before this revision, but now it's the ONLY component involved — no new backend-facing plumbing at all.

No net-new combobox component, no new column, no new schema field, and no new prop-threading is needed for Project Specialist — it is Contract's Alternate Project Officer, relabeled, exactly the same way Grant's Federal Project Officer is Contract's Project Officer, relabeled.

---

## Implementation

### 1. Backend model — `GrantAgreement` (`backend/models/agreements.py`)

Add three new columns (no Project Specialist column — see revised decision above):
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
    __mapper_args__ = {"polymorphic_identity": AgreementType.GRANT}
```
- `nofo_number`/`aln_number` are nullable at the DB level (matches every other agreement string field, e.g. `contract_number`) — the "required" constraint for NOFO Number is enforced at the frontend Vest-suite layer only, consistent with how `name` (Agreement Title) is nullable in the DB but required by the frontend suite. Do not add a NOT NULL constraint; that would break the "come back and edit later" language in the Figma helper text and require a backfill story for existing grants.
- Remove the stale `# TODO: Skeleton, will need flushed out more when we know what all a Grant is.` comment above the class now that it's genuinely fleshed out.
- Leave `get_required_fields_for_status_change()` / `get_required_fields_for_awarded_agreement()` returning `[]` — award-status field requirements are out of scope for this slice (grants can't be awarded yet).
- **No authorization change needed.** `Agreement.authorized_user_ids` (`backend/models/agreements.py:588-601`) already adds `alternate_project_officer_id` to the set of users authorized to view an agreement (line 600-601). Since Project Specialist reuses that exact column, a Project Specialist automatically gets the same view access a Contract's Alternate PO already gets — zero backend work required. (This replaces the original plan's step 1a, which proposed adding a new `project_specialist_id` to this property; that's now unnecessary since no such column exists.)

### 2. Migration (`backend/alembic/versions/`)

Follow the exact pattern in `2025_02_20_2207-b5d03aa79d12_add_more_attributes_to_grants.py`: `op.add_column("grant_agreement", ...)` for `nofo_number`, `aln_number`, `funding_period_months`, nullable=True, PLUS the mirrored `op.add_column("grant_agreement_version", ..., autoincrement=False, nullable=True)` for the audit/version table. No FK columns needed this slice (Project Specialist reuses the existing `alternate_project_officer_id` FK on the base `agreement` table — nothing to migrate there). Write a paired `downgrade()` dropping version-table columns first, then main-table columns, in reverse order. Use `/db-migrations` skill for the full workflow (autogenerate, review, `alembic upgrade head`).

`grant_agreement_version` is a real, existing table generated by SQLAlchemy-Continuum (`sqlalchemy_continuum.make_versioned(...)` + `BaseModel.__versioned__ = {}` in `backend/models/base.py`) — confirmed, not speculative. Continuum manages the version *model*/metadata automatically but does **not** auto-migrate the DB schema, so the hand-written `add_column` on `grant_agreement_version` in this migration is genuinely required, exactly as both precedent migrations do it.

This is separate from the `OpsDBHistory`/`agreement_history` event-driven audit mechanism (`models/history.py`) described in the backend CLAUDE.md — that system works generically off `mapper.columns` with no per-model column allowlist, so the new grant columns get audit-tracked there automatically with zero extra work. No new `*_history` table is needed; confirmed during planning, not just asserted.

### 3. Marshmallow schema (`backend/ops_api/ops/schemas/agreements.py`)

```python
class GrantAgreementData(AgreementData):
    foa = fields.String(allow_none=True)
    nofo_number = fields.String(allow_none=True)
    aln_number = fields.String(allow_none=True)
    funding_period_months = fields.Integer(allow_none=True)
```
No `project_specialist_id` field — `alternate_project_officer_id` already exists on the base `AgreementData`/`AgreementResponse`/`AgreementListResponse` (inherited by every `Grant*` schema already) and is already `fields.Integer(allow_none=True)`. Nothing to add there.

Mirror the three new fields onto `GrantAgreementResponse` and `GrantListAgreementResponse`.

Do **not** add `nofo_number`/`aln_number` as `required=True` in the schema. This is a deliberate new convention for this codebase (the one existing precedent, `AgreementData.name`, is required at *both* the schema and frontend layers) — the choice here is schema-optional / frontend-required specifically so a legitimate future PATCH from a non-wizard client isn't blocked by a field the API itself doesn't strictly need, while the wizard's Save Draft UX still enforces it via the Vest suite (step 9) and `shouldDisableBtn` (step 10). Revisit only if there's a concrete reason the API itself must reject a NOFO-less grant regardless of client.

### 4. OpenAPI (`backend/openapi.yml`)

Add the three new properties (`nofo_number`, `aln_number`, `funding_period_months`) to both `GrantAgreementData` (~line 9071) and `GrantAgreementResponse` (~line 9232) blocks, matching the types used in step 3. `alternate_project_officer_id` is already documented on the base schemas — no OpenAPI change needed for Project Specialist. Run `/sync-openapi` skill after the resource/schema changes land, then `./backend/validate_openapi.sh`. While in this file, note (don't necessarily fix in this PR) that `total_funding`/`number_of_years`/`number_of_grants` are still undocumented from a prior slice — call out as pre-existing debt in the PR description, not something this slice is responsible for backfilling.

### 5. Backend tests

- Extend `backend/ops_api/tests/ops/agreement/test_agreement_change_requests.py`'s local `test_grant_agreement` fixture (or add a sibling fixture) to include the new fields, and add a focused test asserting create/read round-trips `nofo_number`, `aln_number`, `funding_period_months` through `POST`/`GET /agreements`. Also assert `alternate_project_officer_id` round-trips on a GRANT the same way it already does for CONTRACT (regression check, not new behavior — this exercises the reused field for the Project Specialist use case without any schema change).
- Add a schema test in `backend/ops_api/tests/ops/schemas/test_agreements.py` (alongside the existing `test_grant_agreement_data_has_nested_fields`) asserting the three new fields load/dump correctly, including `allow_none`.
- No new validation-rule tests needed — `ServiceRequirementTypeRule` and the awarded/immutable-field rules are Contract/AA-specific and already correctly return `[]`/skip for GRANT; this slice doesn't touch those rules.

### 6. Frontend state wiring — `AgreementEditForm.hooks.js`

Add setters mirroring the existing pattern, for NOFO/ALN/Funding Period only:
```js
const setNofoNumber = useUpdateAgreement("nofo_number");
const setAlnNumber = useUpdateAgreement("aln_number");
const setFundingPeriodMonths = useUpdateAgreement("funding_period_months");
```
Destructure `nofo_number`, `aln_number`, `funding_period_months` off `agreement` (same style as `notes`/`vendor`/etc. at lines 132-149).

**Project Specialist needs no new state, no new context key, no new prop-threading, and no new fetch site.** It is rendered and wired using the exact same `selectedAlternateProjectOfficer`/`changeSelectedAlternateProjectOfficer`/`setAlternateProjectOfficerId` that already exist in this hook (lines 75, 87, 339-343) and are already seeded end-to-end for Contracts via `Agreement.jsx`/`EditAgreement.jsx`'s existing `getUser(alternate_project_officer_id)` fetch and `AgreementEditorContext.jsx`'s existing `alternateProjectOfficer` prop-seeding — none of that needs to change. The GRANT-gated JSX block (step 7) simply renders a second `ProjectOfficerComboBox` bound to `selectedAlternateProjectOfficer`/`changeSelectedAlternateProjectOfficer` with the label "Project Specialist" instead of "Alternate Project Officer".

**Extend `handleAgreementFilterChange`** (lines 662-686): when switching AWAY from GRANT (to CONTRACT/DIRECT_OBLIGATION/PARTNER), clear only the new Grant-specific fields — `setNofoNumber(null)`, `setAlnNumber(null)`, `setFundingPeriodMonths(null)`. **Do not add any clearing for Alternate PO/Project Specialist on this transition** — unlike NOFO/ALN/Funding Period (which have no Contract equivalent), `alternate_project_officer_id` is a shared field Contracts already use for their own Alternate PO/Alt-COR, so a value present when switching types should carry over exactly as it already does today for a PO/Alt-PO value when switching, say, CONTRACT → DIRECT_OBLIGATION (no clearing happens there either — confirmed by reading the existing `handleAgreementFilterChange`, whose CONTRACT/DIRECT_OBLIGATION/PARTNER branches don't touch PO/Alt-PO at all). The existing switch-TO-GRANT branch already calls `changeSelectedProjectOfficer(null)`/`changeSelectedAlternateProjectOfficer(null)` (shipped in #5925) — that behavior is unchanged and correct; it just means a user switching a Contract-with-a-COR-filled-in to Grant starts with a blank FPO/Specialist, which is the right UX (the old COR isn't automatically the new FPO).

Return the three new fields/handlers from the hook (no fourth — Project Specialist reuses returns that already exist).

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
            {/* Project Specialist reuses the existing Alternate Project Officer field/state/handler,
                relabeled — NOT a new field. Same component, same props Contracts already use for
                their "Alternate <COR>" combobox. */}
            <ProjectOfficerComboBox
                className="margin-left-4"
                selectedProjectOfficer={selectedAlternateProjectOfficer}
                setSelectedProjectOfficer={changeSelectedAlternateProjectOfficer}
                label="Project Specialist"
            />
        </div>
        <div className="margin-top-3 width-card-lg">
            <TeamMemberComboBox
                selectedTeamMembers={selectedTeamMembers}
                selectedProjectOfficer={selectedProjectOfficer}
                selectedAlternateProjectOfficer={selectedAlternateProjectOfficer}
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
- **This revises the prior draft's guidance to OMIT `selectedAlternateProjectOfficer` from `TeamMemberComboBox`.** That guidance was written when Project Specialist was a separate new field with nothing to filter. Now that Project Specialist IS `selectedAlternateProjectOfficer`, it must be PASSED to `TeamMemberComboBox` (as shown above), so the person selected as Project Specialist is correctly excluded from the Team Members dropdown — exactly the same filtering behavior Contracts already get for their Alternate PO. Passing it is not just safe, it's now required for correct behavior.
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

Already covered in step 6's `handleAgreementFilterChange` extension — repeated here as a checklist item: on switch AWAY from GRANT (to CONTRACT/DIRECT_OBLIGATION/PARTNER), clear only `nofo_number`, `aln_number`, `funding_period_months`. Do NOT clear Alternate PO/Project Specialist on this transition — it's a shared field that legitimately carries a different meaning per type but no data-loss reason to null it out (see step 6's fuller reasoning). Do NOT touch the switch-TO-GRANT branch's existing contract-clearing logic (already correct from #5925, including its existing `changeSelectedAlternateProjectOfficer(null)` call).

### 12. Details-page view — `AgreementDetailsView.jsx` + `agreement.helpers.js`

Add new `AgreementFields` enum entries (`agreements.constants.js`): `NofoNumber`, `AlnNumber`, `GrantFundingPeriod`. **No `ProjectSpecialist` or `FederalProjectOfficer` entries** — both FPO and Project Specialist are frontend label swaps on the existing, always-on PO/Alt-PO block, not new gated fields; adding enum values with no corresponding `isFieldVisible` call would be dead code. Extend the GRANT set in `AGREEMENT_TYPE_VISIBLE_FIELDS`:
```js
[AgreementType.GRANT]: new Set([
    AgreementFields.DescriptionAndNotes,
    AgreementFields.NickName,
    AgreementFields.NofoNumber,
    AgreementFields.AlnNumber,
    AgreementFields.GrantFundingPeriod
])
```
In `AgreementDetailsView.jsx`, add new gated `<dl>` blocks (mirroring the Contract # block pattern at ~lines 98-110) for NOFO Number, ALN Number, and Grant Funding Period, placed near the top of the details tags (next to the existing Nickname/Description gates).

**No new block for Project Specialist.** `AgreementDetailsView.jsx`'s existing PO/Alt-PO block (~lines 447-479) is unconditional for ALL types and already renders both `project_officer`/`alternate_project_officer`. Leave that block's structure exactly as-is — do not gate it off, do not add a parallel block. The only change needed is the label (below).

**FPO and Project Specialist labels — one shared fix.** Change `frontend/src/helpers/utils.js`'s `projectOfficer.GRANT` map entry (~line 224-231) from `"Project Officer"` to `"Federal Project Officer"`, exactly as originally planned. Then find (or add, if it doesn't already exist as a separate map) the equivalent lookup used for the "Alternate ___" label — in the wizard this is currently computed inline as `` `Alternate ${convertCodeForDisplay("projectOfficer", agreementType)}` `` (`AgreementEditForm.jsx`) and similarly in `AgreementDetailsView.jsx` (line ~465, `` `Alternate ${convertCodeForDisplay(...)}` ``) — so today GRANT would automatically compute "Alternate Federal Project Officer" once the `projectOfficer` map entry changes, which is **not** what the design wants (design says "Project Specialist", not "Alternate Federal Project Officer" or "Alternate Project Specialist"). Do not rely on the `Alternate ${...}` string-interpolation pattern for GRANT. Instead, add a small explicit label lookup for the Alternate-PO slot (e.g. a new `alternateProjectOfficer` map in `utils.js`, keyed by type, with `GRANT: "Project Specialist"` and every other type defaulting to the current `` `Alternate ${convertCodeForDisplay("projectOfficer", type)}` `` string) and swap both call sites (`AgreementEditForm.jsx`'s wizard combobox label and `AgreementDetailsView.jsx`'s details-page label) to use it. This is a slightly larger change than a one-line label swap, but it's still purely a display-layer change — no state, no schema, no new field.

**Confirmed safe** (unchanged from the original plan): the `projectOfficer` map is keyed per-type (`AA`/`CONTRACT`/`IAA` → `"COR"`; `DIRECT_OBLIGATION`/`MISCELLANEOUS` → `"Project Officer"`), so changing only the `GRANT` entry cannot affect other types' rendering, and a repo-wide search for `"Project Officer"` text combined with a GRANT fixture found only `ProjectOfficerComboBox.test.jsx`, which hardcodes its own `label` prop directly rather than reading this map — no existing test breaks.

### 13. Tests (frontend)

- **Suite unit test**: extend `AgreementEditFormSuite.test.js`'s `describe("AgreementEditFormSuite — GRANT", ...)` block with a case asserting `nofo_number` blank → `hasErrors()` true, and a valid case with `nofo_number` set → no errors. Add to the CONTRACT regression block if needed to confirm `nofo_number`'s test doesn't affect Contract validation (it early-returns via `if (!isGrant) return;` so should be a no-op for Contract).
- **Hooks test**: extend `AgreementEditForm.hooks.test.js`'s existing `handleAgreementFilterChange` describe block with a case for switching AWAY from GRANT clearing NOFO/ALN/Funding Period (mirrors the existing switch-TO-GRANT clearing test). Add a case confirming Alternate PO/Project Specialist is NOT cleared on that same transition (regression guard against accidentally over-clearing a shared field).
- **Form render test**: assert that with Grant selected, the new fields (NOFO Number, Grant Funding Period, ALN Number, Federal Project Officer, Project Specialist, Team Members, Notes) render, Save Draft stays disabled until NOFO Number (plus Title/Project, from #5925) is filled, and Contract-only controls remain absent (regression check against #5925's existing test). Assert selecting a Project Specialist correctly excludes that user from the Team Members dropdown (exercises the `selectedAlternateProjectOfficer` prop now passed to `TeamMemberComboBox` for grants).
- **Details-view test**: a GRANT agreement fixture with `project_officer_id`/`alternate_project_officer_id` populated renders NOFO Number, ALN Number, Grant Funding Period, "Federal Project Officer" label + value, and "Project Specialist" label + value (not "Alternate Federal Project Officer" or "Alternate Project Officer" — this is the specific regression this slice must guard against, per step 12's label-lookup fix).
- **E2E**: extend `frontend/cypress/e2e/createGrantAgreement.cy.js` (from #5925) — after selecting GRANT and before Save Draft, fill NOFO Number (now required to enable Save Draft — update the existing "Save Draft should now be enabled" assertion, which today only requires Title+Description, to also require NOFO Number), optionally fill Funding Period/ALN/FPO/Specialist/Team Member/Notes, confirm Save Draft enables only once NOFO Number is present, save, and assert the new fields appear on the resulting details page — including the "Project Specialist" label (not "Alternate Project Officer").

## Verification
1. `cd backend && alembic upgrade head` (via `/db-migrations` skill) — migration applies cleanly, `alembic downgrade -1` reverses cleanly.
2. `cd backend/ops_api && pipenv run pytest tests/ops/agreement tests/ops/schemas -k grant` — backend grant tests green.
3. `pipenv run nox -s lint && pipenv run nox -s format-check` (backend).
4. `/sync-openapi` skill, then `./backend/validate_openapi.sh`.
5. `cd frontend && bun run test --watch=false` — unit tests green (90% coverage gate).
6. `bun run lint --fix && bun run format`.
7. Manual (Docker stack up): `/agreements/create` → pick a Project → Continue → select **Grant** → confirm Agreement Details (Title/Nickname/Description) AND Grant Details (NOFO/Funding Period/ALN/FPO/Specialist/Team Members/Notes) both render → Save Draft disabled until NOFO Number + Title filled → fill required fields, including FPO and Project Specialist → Save Draft enables → save → confirm success alert + redirect. Open the new grant's details page → confirm all new fields display correctly, with the PO/Alt-PO block correctly labeled "Federal Project Officer" / "Project Specialist" (not "Project Officer" / "Alternate Project Officer").
8. Regression: create a Contract the same way — Grant Details block does not render; PO/Alt-PO block still labeled "COR"/"Alternate COR" as before; all Contract fields still show/validate/save correctly. Switch a form from Grant (with NOFO/ALN/Funding-Period/FPO/Specialist filled in) → Contract mid-edit: confirm NOFO/ALN/Funding-Period are cleared (grant-only, no Contract equivalent) but FPO/Project-Specialist values carry over unchanged into Contract's PO/Alt-PO (COR/Alt-COR) fields — since switching to CONTRACT doesn't clear PO/Alt-PO today and this slice doesn't add clearing there. Then switch back to Grant and confirm PO/Alt-PO/FPO/Specialist are blank again — this is pre-existing #5925 behavior (the switch-TO-GRANT branch already nulls PO/Alt-PO), unchanged by this slice.
9. E2E: `bun run test:e2e` (or `/e2e-tests` skill) including the updated grant spec.

## File-by-file change list
**Backend:**
1. `backend/models/agreements.py` — add `nofo_number`, `aln_number`, `funding_period_months` to `GrantAgreement`; remove stale skeleton TODO comment. No `authorized_user_ids` change (Project Specialist reuses `alternate_project_officer_id`, already covered there).
2. New Alembic migration in `backend/alembic/versions/` — add `nofo_number`/`aln_number`/`funding_period_months` columns to `grant_agreement` + `grant_agreement_version`. No FK/relationship columns needed.
3. `backend/ops_api/ops/schemas/agreements.py` — extend `GrantAgreementData`/`GrantAgreementResponse`/`GrantListAgreementResponse` with the three new scalar fields only.
4. `backend/openapi.yml` — sync via `/sync-openapi` skill.
5. Backend tests — extend `test_agreement_change_requests.py` fixture/tests, `test_agreements.py` (schemas).
6. (Verify only, update if needed) `backend/data_tools/src/load_grants/utils.py`, `backend/data_tools/data/agreements_and_blin_data.json5`.

**Frontend:**
7. `AgreementEditForm.hooks.js` — new setters/state for NOFO/ALN/Funding Period only (no Project Specialist state — reuses existing Alt-PO plumbing); extend `handleAgreementFilterChange` to clear only NOFO/ALN/Funding Period on switch-away-from-GRANT; explicit `nofo_number` check in `shouldDisableBtn`; return the three new fields.
8. `AgreementEditForm.jsx` — new `isGrant`-gated "Grant Details" JSX block (NOFO/Funding Period/ALN/FPO/Specialist/Team Members/Notes), where FPO and Project Specialist are `ProjectOfficerComboBox` instances bound to the existing `selectedProjectOfficer`/`selectedAlternateProjectOfficer` state; pass `selectedAlternateProjectOfficer` into `TeamMemberComboBox` (currently omitted for grants) so Project Specialist is correctly excluded from the Team Members list.
9. `AgreementEditFormSuite.js` — new `nofo_number` required-for-GRANT test.
10. `agreements.constants.js` — new `AgreementFields` enum entries (`NofoNumber`, `AlnNumber`, `GrantFundingPeriod` — no `FederalProjectOfficer`/`ProjectSpecialist` entries).
11. `agreement.helpers.js` — extend `AGREEMENT_TYPE_VISIBLE_FIELDS[GRANT]`.
12. `AgreementDetailsView.jsx` — new gated blocks for NOFO/ALN/Funding Period; no new block or gating for the PO/Alt-PO section — only its label changes.
13. `frontend/src/helpers/utils.js` — `projectOfficer.GRANT` label → `"Federal Project Officer"`; add/extend an `alternateProjectOfficer`-equivalent label lookup so GRANT's Alt-PO slot displays `"Project Specialist"` rather than the default `` `Alternate ${...}` `` interpolation, and swap both call sites (`AgreementEditForm.jsx`, `AgreementDetailsView.jsx`) to use it.
14. Tests — suite test, hooks test (including a no-clear regression case for Alt-PO), form render test (including Team Members exclusion), details-view test (including the Project Specialist label check), `createGrantAgreement.cy.js` E2E update.

**Eliminated by this revision** (no longer needed, listed so nobody re-adds them): a `project_specialist_id` column/migration/schema field, `Agreement.authorized_user_ids` changes, `AgreementEditorContext.hooks.js`/`.jsx` changes, any `getUser`/prop-threading changes to `Agreement.jsx`/`EditAgreement.jsx`/`CreateAgreement.jsx`/`AgreementDetailsEdit.jsx`, and a `ProjectSpecialist` enum entry.

*(Not code: note in the PR description that `total_funding`/`number_of_years`/`number_of_grants` remain unexposed pre-existing dead columns, unrelated to this slice's new fields, and that the Grant Funding Period control is a plain numeric `Input` rather than a stepper widget, per the confirmed decision in step 8 — file a follow-up ticket for the stepper if design review requires exact fidelity.)*

## Risks carried into implementation (resolved during planning review — listed so implementers don't need to re-litigate them)
- **`nofo_number` required-ness**: schema-optional, frontend-required via both the Vest suite (step 9) AND an explicit `shouldDisableBtn` check (step 10) — confirmed as the correct dual-enforcement pattern by cross-checking how Title is actually enforced today, not assumed.
- **`*_history` vs `*_version` tables**: confirmed `grant_agreement_version` is a real SQLAlchemy-Continuum-managed table requiring hand-written migration columns (as the precedent migrations already do), and that this is unrelated to the separate, automatic `OpsDBHistory` event-driven audit mechanism — no new history table needed.
- **Project Specialist = relabeled Alternate PO (revised mid-planning)**: confirmed `alternate_project_officer_id` already exists on the base `Agreement` model/schema, is already in `authorized_user_ids`, and is already fully wired end-to-end on the frontend (state, prop-threading, `handleAgreementFilterChange` clearing on switch-TO-GRANT) from #5925's Contract support. This eliminated the need for any new backend column/migration/schema/authorization work and any new frontend state/context/prop-threading — the only real work left for Project Specialist is a label lookup (step 12/13) and passing `selectedAlternateProjectOfficer` into `TeamMemberComboBox` for the grant block (step 8), which wasn't being done before since nothing rendered there for grants.
- **Label collision risk**: the naive fix of just changing the `projectOfficer` map's `GRANT` entry would make the existing `` `Alternate ${...}` `` interpolation produce "Alternate Federal Project Officer" for GRANT — wrong per the design (should read "Project Specialist"). This is called out explicitly in step 12 so it isn't missed during implementation.
