---
issue: 6187
branch: OPS-6187/update-aln-dropdown
---

# Update ALN Numbers Dropdown for Grants

## Goal

Replace the placeholder integer ALN number options (1–10) in the grant agreement dropdown with the real OPRE ALN values, and update the backend column type from ARRAY(Integer) to ARRAY(String) to match.

## Acceptance Criteria

- [ ] Remove the placeholder #s (1, 2, 3, etc)
- [ ] Update ALN Numbers options to include the following --
     - [ ] 93.086 (HMRF)
     - [ ] 93.600 (Child Care)
     - [ ] 93.575 (Head Start)
     - [ ] 93.493 (Congressionally Directed)
     - [ ] 93.595 (Welfare research)
     - [ ] 93.320 (MIECHV)
     - [ ] 93.643 (Child Welfare)
     - [ ] 93.647 (SSRD)
     - [ ] 93.671 (FVPSA)
     - [ ] 93.591 (DV)
- [ ] Ensure the component remains multi-select
- [ ] Ensure the component is updated in create-grant and edit-grant
- [ ] Ensure the selected options display on the Grant Details Tab

## Technical Details

### Approach

Keep ALN options as hardcoded frontend constants (matching the existing pattern for small fixed lists like GrantFundingPeriod). Change the backend column from ARRAY(Integer) to ARRAY(String) and update all dependent schemas, types, and test fixtures.

### Key Files

**Frontend:**
- `frontend/src/components/Agreements/AlnNumbersComboBox/AlnNumbersComboBox.jsx` — replace options array, update `id` field to strings
- `frontend/src/types/AgreementTypes.d.ts` — `aln_numbers?: number[]` → `string[]`
- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — fix numeric sort (line 182: `a - b` → `parseFloat(a) - parseFloat(b)`)

**Backend:**
- `backend/models/agreements.py` — `ARRAY(Integer)` → `ARRAY(String)` + type annotation
- `backend/ops_api/ops/schemas/agreements.py` — 3 schema fields: `fields.Integer()` → `fields.String()` (lines 118, 307, 315)
- New Alembic migration — alter both `grant_agreement` and `grant_agreement_version` tables

**Tests to update (fixture values only — no logic changes):**
- `frontend/src/pages/agreements/details/AgreementDetailsView.test.jsx` — lines 170, 192, 193
- `frontend/cypress/e2e/editGrantAgreement.cy.js` — line 26 (E2E seed payload)
- `backend/ops_api/tests/ops/agreement/test_agreement.py` — lines 337, 347, 1403, 1416, 1425, 1431
- `backend/ops_api/tests/ops/schemas/test_agreements.py` — lines 326, 331
- `backend/ops_api/tests/ops/agreement/test_agreement_change_requests.py` — line 36
- `backend/ops_api/tests/ops/agreement/test_skip_cr_proc_shop.py` — line 65

### Testing Strategy

- New `AlnNumbersComboBox.test.jsx` — Vitest+RTL unit test asserting the 10 real ALN options render (no existing test file)
- Update `AgreementDetailsView.test.jsx` fixture + text assertions from integers to strings
- Update backend test fixtures in 4 files from integer values `[3, 7]` to strings `["93.086", "93.600"]` — no new tests, existing round-trip coverage is sufficient
- Update `editGrantAgreement.cy.js` E2E seed payload from `[3]` to `["93.086"]`
- Note: `AgreementEditForm.hooks.test.js` already uses string format — no changes needed

### Constraints

- The `grant_agreement_version` table also has the `aln_numbers` column — the migration must alter both tables, matching the pattern in the prior migration (`2026_08_04_1300-b8c9d0e1f2a3`)
- The `id` field in each option object drives what gets stored as `aln_numbers` — must be strings like `"93.086"`, not numbers
- `AgreementDetailsView.jsx` sort is currently `a - b` (numeric subtraction) — will silently produce undefined order for string values; must fix
