# [Coverage][Wave 2] API and shared hook concentration

## Objective
Add branch- and error-path heavy tests in shared API/hook modules with high uncovered statement counts.

## Targets
- [x] `src/api/opsAPI.js`
- [x] `src/hooks/useChangeRequests.hooks.js`
- [x] `src/hooks/useGetAllAgreements.js`

## Test Scenarios
- [x] Query/mutation success paths
- [x] Error and rejected-promise handling
- [x] Conditional options and skip logic
- [x] Returned selectors/derived state shape

## Coverage Snapshot (Local)
- `src/api/opsAPI.js`: statements `28.05% -> 31.10%` (`+3.05`), branches `26.77% -> 30.71%` (`+3.94`)
- `src/hooks/useChangeRequests.hooks.js`: statements `9.32% -> 100.00%` (`+90.68`), branches `7.00% -> 73.00%` (`+66.00`)
- `src/hooks/useGetAllAgreements.js`: statements `2.22% -> 100.00%` (`+97.78`), branches `0.00% -> 88.24%` (`+88.24`)

## Acceptance Criteria
- [ ] Tests pass locally and in CI
- [x] Coverage delta posted in issue comment (statements + branches)
- [ ] Linked PR(s) included
