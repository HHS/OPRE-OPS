# Frontend unit-test coverage to 90% (phased ratchet)

## Goal
Raise frontend unit-test coverage to 90% using a phased ratchet approach while keeping tests stable and maintainable.

## Baseline (measured 2026-02-26)
- Statements: 49.62% (4106/8275)
- Lines: 49.78% (3926/7886)
- Functions: 46.71% (1051/2250)
- Branches: 47.69% (2977/6243)

## Scope
Use prod-scope denominator for coverage tracking:
- Include runtime app code under `src/**`
- Exclude:
  - `src/mocks/**`
  - `src/pages/dev/**`
  - `src/index.jsx`
  - `src/test-utils.js`
  - `src/applicationContext/TestApplicationContext.js`
  - `src/helpers/test.js`

## CI Ratchet Milestones
- [ ] Stage 1: 60% (statements/lines/functions/branches)
- [ ] Stage 2: 75%
- [ ] Stage 3: 85%
- [ ] Stage 4: 90%

## Phase Plan
### Wave 1 (fastest points)
- [ ] Activate and finish `CreateBLIsAndSCs` tests
- [ ] Convert `ApproveAgreement` todo tests into full assertions
- [ ] Increase coverage in:
  - `src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js`
  - `src/pages/agreements/approve/ApproveAgreement.hooks.js`
  - `src/pages/agreements/approve/ApproveAgreement.jsx`

### Wave 2 (API/hooks concentration)
- [ ] Add focused tests for:
  - `src/api/opsAPI.js`
  - `src/hooks/useChangeRequests.hooks.js`
  - `src/hooks/useGetAllAgreements.js`

### Wave 3 (critical zero/near-zero workflow modules)
- [ ] Add tests for:
  - `src/pages/agreements/review/ReviewAgreement.hooks.js`
  - `src/pages/cans/detail/CanFunding.hooks.js`
  - `src/pages/cans/detail/Can.hooks.js`

### Wave 4 (medium-size gaps)
- [ ] Add tests for:
  - `src/components/Agreements/AgreementEditor/AgreementEditForm.hooks.js`
  - `src/pages/agreements/list/AgreementsFilterTags/AgreementsFilterTags.hooks.js`
  - `src/components/ServicesComponents/ServicesComponents.hooks.js`

## Child Issues
- Wave 1:
- Wave 2:
- Wave 3:
- Wave 4:

## Risks / Blockers
- Track flaky tests, missing mocks, and architectural constraints here.
