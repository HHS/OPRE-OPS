# [Coverage][Wave 2] API and shared hook concentration

## Objective
Add branch- and error-path heavy tests in shared API/hook modules with high uncovered statement counts.

## Targets
- [ ] `src/api/opsAPI.js`
- [ ] `src/hooks/useChangeRequests.hooks.js`
- [ ] `src/hooks/useGetAllAgreements.js`

## Test Scenarios
- [ ] Query/mutation success paths
- [ ] Error and rejected-promise handling
- [ ] Conditional options and skip logic
- [ ] Returned selectors/derived state shape

## Acceptance Criteria
- [ ] Tests pass locally and in CI
- [ ] Coverage delta posted in issue comment (statements + branches)
- [ ] Linked PR(s) included
