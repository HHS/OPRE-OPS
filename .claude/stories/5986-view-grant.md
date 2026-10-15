---
issue: 5986
branch: OPS-5986/view-grant-details
---

# View a Grant

## Goal

Give users a clear Grant-specific view on both the Agreement Details tab and the Grants & Budget Lines tab, distinguishing Grant agreements from other types and surfacing grant-number-grouped budget lines with period of performance and description metadata.

## Acceptance Criteria

- [ ] User can be aware that they are viewing a Grant as opposed to other agreement types
- [ ] User can view attributes that are unique to the Grant agreement type
- [ ] User can view a summary of a Grant's budget lines organized by grant number
- [ ] User can view the individual budget lines that belong to a given grant number
- [ ] A grant number with no budget lines yet is still visible to the user, rather than being hidden
- [ ] Export functionality should work as expected for grants

## Technical Details

### Approach

Most infrastructure (grant-number grouping, Grant accordion, per-type field visibility, backend `GrantNumber` serialization) is already implemented. This story closes the remaining view-layer gaps: field reordering on the details tab, conditional tab label and disabled "coming soon" tabs, metadata block (PoP + description) inside each grant accordion section, and disabling Export for grants.

### Key Files

- `frontend/src/pages/agreements/details/AgreementDetailsView.jsx` — reorder Grant Funding Period after NOFO Number
- `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` — conditional "Grant & Budget Lines" label; force Procurement Tracker "coming soon" for grants
- `frontend/src/pages/agreements/details/Agreement.jsx` — thread `isGrant` prop into DetailsTabs
- `frontend/src/components/GrantNumbers/GrantNumberAccordion/GrantNumberAccordion.jsx` — accept and render metadata props
- `frontend/src/components/GrantNumbers/GrantNumberMetadata/` — NEW component: PoP Start/End + Description (figma layout)
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` — pass metadata props to accordion; disable Export for grants
- `frontend/src/helpers/budgetLines.helpers.js` — add grant findPeriodStart / findPeriodEnd / findDescription helpers

### Testing Strategy

- Unit tests (Vitest + RTL) for `GrantNumberMetadata`, `GrantNumberAccordion` (with/without metadata, group-0 bucket), `DetailsTabs` (label and Proc Tracker tooltip conditionality), `AgreementDetailsView` (field DOM order), `AgreementBudgetLines` (Export disabled state for grants)
- No new E2E for this polish — existing grant view flow covers the happy path

### Constraints

- NOFO Period is a computed field: min `period_start` → max `period_end` across all grant numbers; Total Grant Count is out of scope for this story
- NOFO Period display order: NOFO Number → Grant Funding Period → NOFO Period → ALN Numbers
- Awards & Modifications and Documents tabs are already disabled via feature flags for all agreements; only Procurement Tracker needs a grant-specific override
- `GrantNumber.period_start/period_end/description` are available from the existing `useGetGrantNumbersListQuery` — no backend changes needed
