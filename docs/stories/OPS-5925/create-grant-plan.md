# Plan: Create & View a Grant Agreement (Vertical Slice #5925)

> Team context doc. This is the FIRST vertical slice of [#787 "Create a Grant"](https://github.com/HHS/OPRE-OPS/issues/787). Scope is limited to [#5925](https://github.com/HHS/OPRE-OPS/issues/5925). Later slices (#5926–#5928) cover budget lines and review/approval — **do not build those here.**

## Context

OPRE staff need to create Grant agreements. Today the Create Agreement wizard only supports Contracts (and Partner/AA types); the Grant option is present in the type dropdown but **actively blocked** by the validation suite, and grant-specific rendering is missing in a few helpers.

Per the Figma design, a Grant only needs **4 fields**: Type, Agreement Title (`name`), Nickname (`nick_name`), and Description. This slice makes those 4 fields creatable through the existing wizard and viewable on the Agreement Details page.

**Key finding — the backend is already done.** The `GrantAgreement` model, the `GrantAgreementData` marshmallow schema, and the `POST`/`PATCH /agreements` dispatch (routing by `agreement_type=GRANT`) all already support `name`, `nick_name`, `description`, and `agreement_type`. **No backend, model, migration, or schema changes are needed.** This is a **frontend-only** slice.

### Decided scope (confirmed with product owner)
- **In scope:** (1) Create a Grant via the `/agreements/create` wizard; (2) View a created Grant on the details page (`/agreements/:id`).
- **When Type = Grant, show ONLY the 4 grant fields** — hide all Contract- and AA/Partner-specific controls.
- **Keep the Step 1 "Select Project" step** — `project_id` is still required for grants.
- **Out of scope:** editing a grant from the details page, budget lines, and the send-to-approval/review flow.

## Critical Files
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditFormSuite.js` — Vest v6 validation suite (blocks GRANT today).
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.jsx` — the create/edit form JSX.
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.hooks.js` — form state/handlers.
- `frontend/src/helpers/agreement.helpers.js` — `AGREEMENT_TYPE_VISIBLE_FIELDS` / `isFieldVisible` (details-view gating).
- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — read-only details view (verify only).

Enums already contain GRANT — **no changes needed** to `agreements.constants.js` or `ServicesComponents.constants.js`.

---

## Implementation

### 1. Make the Vest suite type-aware — `AgreementEditFormSuite.js`
The suite currently (a) blocks GRANT and (b) unconditionally requires ~8 contract-only fields, so even an unblocked grant would keep the submit button disabled.

- **Unblock GRANT:** in the two `"...not yet available"` tests (currently lines ~12–21), remove only the `enforce(...).notEquals(AGREEMENT_TYPES.GRANT)` lines. Leave IAA and DIRECT_OBLIGATION rejections intact (still out of scope).
- **Guard contract-only tests:** add `const isGrant = data.agreement_type === AGREEMENT_TYPES.GRANT;` at the top of the suite body (after the `if (fieldName) only(fieldName)` block), then early-`return` from each contract-only test when `isGrant`:
  ```js
  test("service_requirement_type", "This is required information", () => {
      if (isGrant) return;
      enforce(data.service_requirement_type).notEquals("-Select Service Requirement Type-");
  });
  ```
  Apply the same `if (isGrant) return;` guard to: `service_requirement_type`, `description`, `product_service_code_id`, `agreement_reason`, `vendor`, `project_officer`, `contract-type`, `procurement-shop-select`.
- **Keep unconditional** (these ARE the grant requirements): the `agreement_type` "-Select-" test, `name`, and `project_id`.
- **Vest v6 rules (from frontend/CLAUDE.md):** do NOT delete the `test(...)` registrations (keeps error keys stable — no `convertCodeForDisplay` label changes needed); do NOT switch to `only(dataObject)`; the early-`return` keeps each test id present and passing so prior failed state clears on re-run. `requesting_agency`/`servicing_agency` are already AA-gated — leave as-is.

### 2. Hide contract/AA controls when Grant — `AgreementEditForm.jsx` + `.hooks.js`
- In `AgreementEditForm.hooks.js`, add `const isGrant = agreementType === AGREEMENT_TYPES.GRANT;` (near `isAgreementAA`, ~line 301) and return it. Destructure `isGrant` in the component.
- In `AgreementEditForm.jsx`, wrap the entire contract control block — `ContractTypeSelect` through the Notes `TextArea` (currently ~lines 421–618) — in `{!isGrant && ( <> … </> )}`. The 4 grant fields (type filter `Select`, Title `Input`, Nickname `Input`, Description `TextArea`) sit above this block and stay rendered. The `AgreementTypeSelect` (partner) and AA blocks are already gated by `selectedAgreementFilter === PARTNER` / `isAgreementAA`, so they won't show for grants.
- **Clear stale contract state on switch:** extend `handleAgreementFilterChange` (`.hooks.js` ~line 650) so that when switching to GRANT it nulls out contract-only state (`setContractType(null)`, `setServiceReqType(null)`, `changeSelectedProductServiceCode(null)`, `setAgreementReason(null)`, `setAgreementVendor(null)`, project-officer setters, and the team-member/research/special-topic dispatch setters). All these setters are already in the hook's scope. This guarantees a clean 4-field payload if a user picks Contract first, types, then switches to Grant. (Submit gating is already safe via step 1's guards; this is payload hygiene to honor the "only 4 fields" intent.)

### 3. Submit button — no change needed
`shouldDisableBtn` already reduces to `!agreementTitle || !project_id || !agreementType || res.hasErrors() || uniqueness`. After step 1, a grant with a Title + selected Project (and `agreement_type=GRANT`, set by `handleAgreementFilterChange`) produces no suite errors, so Save Draft enables. Verify, don't modify.

### 4. Persist via Save Draft; guard Continue — `AgreementEditForm.jsx`
- The create path for this slice is **Save Draft** (`handleDraft` in `.hooks.js` ~line 522): for a new grant (`agreement.id` undefined) it calls `addAgreement(cleanData)`, which the backend routes by `agreement_type=GRANT`, then shows a success alert and redirects to `/agreements`. `cleanAgreementForApi` (`agreement.helpers.js` ~310–336) preserves `name`/`nick_name`/`description`/`agreement_type`/`project_id`. Works unchanged once steps 1–2 let the button enable.
- **Guard Continue:** `handleContinue` advances to Step 3 (budget lines — out of scope) and does NOT persist a brand-new agreement. For grants in wizard mode, **hide the Continue button** (render only Save Draft) so users can't reach Step 3. Gate the Continue button JSX (~lines 642–651) on `!(isGrant && isWizardMode)`. Do NOT change the shared `handleContinue` logic (review mode reuses it).

### 5. Details-page view — `agreement.helpers.js`
Add a GRANT entry to `AGREEMENT_TYPE_VISIBLE_FIELDS` so `isFieldVisible` returns true for the grant fields (without it, a GRANT renders no gated fields):
```js
[AgreementType.GRANT]: new Set([
    AgreementFields.DescriptionAndNotes, // gates the Description block (+ empty Notes line)
    AgreementFields.NickName             // gates the Nickname tag
]),
```
Both `AgreementFields` keys already exist — no enum change. Title and the "Grant" type tag render via always-on blocks. `AgreementDetailsView.jsx` needs no change (verify only). Note: `isNotDevelopedYet(GRANT)` still gates *editing from the table* — that's fine, editing is out of scope; **viewing** a grant's details page is not blocked.

**Known cosmetic item (flag, don't fix here):** the details view always renders Project Officer, Alternate PO, and Team Members regardless of type; for a grant these show `NO_DATA`. Hiding them for grants is a separate change to the unconditional blocks — leave for a follow-up.

### 6. Downstream consumers of a persisted Grant (found in review)
Once a Grant is creatable, it appears in read-only views that today assume contract-shaped data. Handle these so the slice is coherent:

- **`AgreementsTable/AgreementTableRow.jsx`** (~lines 148–150, 177–201): the expanded row renders Procurement Shop, Subtotal, Fees, Lifetime Obligated, Contract #, Award Type, and Vendor unconditionally. For a grant (no procurement shop, no BLIs) these show "TBD"/`NO_DATA`. **In scope:** gate the contract-only cells so grants don't show empty contract fields (mirror the `isFieldVisible` pattern or a simple `agreement_type` check). The type label cell and title already render fine.
- **`AgreementMetaAccordion/AgreementMetaAccordion.jsx`** (~line 124): renders `procurement_shop?.abbr` → "TBD" for a grant. **In scope:** gate this line on `isFieldVisible(agreement.agreement_type, AgreementFields.ProcurementShop)` for consistency with the details view.
- **`DetailsTabs/DetailsTabs.jsx`** (~lines 30–65): the "SCs & Budget Lines" tab renders for grants (because `isNotDevelopedYet(GRANT)` feeds `isDevelopedAgreement`), so a draft grant shows an empty budget-lines tab. **Acceptable for this slice** (budget lines arrive in #5927/#5928) — document as expected-empty; do not hide unless trivial.
- **Edit-button UX trap (document, don't fix):** `isNotDevelopedYet(GRANT)` returns `true` (`agreement.helpers.js` ~152–162), so the Edit button stays disabled in the table/details for grants. A user can *create* a grant but not *edit* it until a later slice. This is consistent with "editing out of scope" — call it out explicitly in the PR description so it's not read as a bug.

---

## Tests
- **Suite unit test** for `AgreementEditFormSuite.js`: `suite.run({ agreement_type: "GRANT", name: "X", project_id: 5 })` → `hasErrors()` is `false`; a contract payload still fails its contract tests (no regression).
- **Form render test:** with Grant selected, assert the contract controls (ContractType, ServiceReqType, ProductServiceCode, ProcurementShop, Reason/Vendor, PO combo boxes, TeamMember, Notes) are absent and Title/Nickname/Description are present; Continue button hidden, Save Draft enabled with Title + project set.
- **Details-view test:** a GRANT agreement renders Description + Nickname + "Grant" type tag and NOT contract-only tags.
- **Table + accordion tests:** a GRANT row (with `procurement_shop = null`, no BLIs) renders without contract-only cells and without a "TBD" procurement shop in `AgreementMetaAccordion`. Extend the existing GRANT fixtures in `AgreementsTable.test.js` / `AgreementMetaAccordion.test.jsx`.
- **Update** `AgreementEditForm.hooks.test.js` for the new `isGrant` + `handleAgreementFilterChange` clearing behavior. Grep `src/**/*.test.*` for `"This Agreement type is not yet available"` / `AGREEMENT_TYPES.GRANT` and update any assertion that expected GRANT to be blocked.
- **E2E:** add `frontend/cypress/e2e/createGrantAgreement.cy.js` mirroring `createAgreement.cy.js`: Step 1 pick project → Continue; Step 2 select `GRANT`, type Title + Description, assert contract controls absent + `save-draft-btn` enabled, click Save Draft, assert success alert + redirect; optionally open the new agreement's details page and assert Description/Nickname/"Grant" tags.

## Verification
1. `cd frontend && bun run test --watch=false` — unit tests green (90% coverage gate).
2. `bun run lint --fix && bun run format`.
3. Manual (Docker stack up): `/agreements/create` → pick a Project → Continue → select **Grant** → confirm only the 4 fields show → enter Title + Description → **Save Draft** → success alert + redirect to `/agreements`. Open the new grant's details page → Title, Nickname, Description, and "Grant" type tag display.
4. Regression: create a Contract the same way — all contract fields still show and validate; Continue still works.
5. E2E: `bun run test:e2e` (or the `/e2e-tests` skill) including the new grant spec.

## File-by-file change list
1. `AgreementEditFormSuite.js` — unblock GRANT; `isGrant` guard on 8 contract tests.
2. `AgreementEditForm.hooks.js` — add/return `isGrant`; clear contract state in `handleAgreementFilterChange` on GRANT.
3. `AgreementEditForm.jsx` — destructure `isGrant`; wrap contract block in `{!isGrant && …}`; hide Continue for grants in wizard mode.
4. `agreement.helpers.js` — add `AgreementType.GRANT` entry to `AGREEMENT_TYPE_VISIBLE_FIELDS`.
5. `AgreementsTable/AgreementTableRow.jsx` — gate contract-only expanded-row cells so grants don't show empty contract fields.
6. `AgreementMetaAccordion/AgreementMetaAccordion.jsx` — gate the procurement-shop line on `isFieldVisible(..., AgreementFields.ProcurementShop)`.
7. Tests — suite test, form render test, details-view test, table/accordion grant-fixture assertions, `AgreementEditForm.hooks.test.js` updates, `cypress/e2e/createGrantAgreement.cy.js`.

*(Not code: note the create-but-can't-edit `isNotDevelopedYet(GRANT)` behavior and the expected-empty budget-lines tab in the PR description.)*
