---
issue: 6224
branch: OPS-6224/grant-funding-periods
---

# Additional budget funding periods for grants

## Goal

Let users pick 36-month and 60-month funding periods for grant agreements, alongside the existing 12- and 18-month options (per Wendy's feedback, verified by Sheila on 9/8/2026).

## Acceptance Criteria

- [ ] Add 36 months and 60 months options to the grant funding period dropdown

## Technical Details

### Approach

Follow existing patterns: add `36` and `60` entries to `FUNDING_PERIOD_OPTIONS`, and widen the backend validation and the OpenAPI enum from `[12, 18]` to `[12, 18, 36, 60]`. No migration needed: `funding_period_months` is a plain nullable Integer with no check constraint. Display (`${n} months`) and history messages already handle any value.

### Key Files

- `frontend/src/components/Agreements/GrantFundingPeriodSelect/GrantFundingPeriodSelect.constants.js`
- `backend/ops_api/ops/schemas/agreements.py` (line 136, `validate.OneOf`)
- `backend/openapi.yml` (line ~10027, `enum: [12, 18]`)
- `backend/ops_api/tests/ops/schemas/test_agreements.py`

### Testing Strategy

- Backend schema unit test: parametrize so 12, 18, 36 and 60 load and 24 is still rejected. Update the docstring on `test_grant_agreement_data_rejects_invalid_funding_period_months` ("only allows 12 or 18").
- Optional: extend one endpoint round-trip in `backend/ops_api/tests/ops/agreement/test_agreement.py` to use 60.
- No frontend test (constants-only change, trivial per docs/TESTING.md). No E2E.

### Constraints

None noted
