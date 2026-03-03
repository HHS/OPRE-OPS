# [Coverage][Wave 3] Agreement review + CAN detail workflow hooks

## Objective
Lift near-zero coverage for workflow-critical agreement and CAN detail hook modules.

## Targets
- [ ] `src/pages/agreements/review/ReviewAgreement.hooks.js`
- [ ] `src/pages/cans/detail/CanFunding.hooks.js`
- [ ] `src/pages/cans/detail/Can.hooks.js`

## Test Scenarios
- [ ] Happy path state transitions
- [ ] Mutation and fetch failure handling
- [ ] Edge cases around empty or missing API data
- [ ] User-facing side effects (alerts/navigation)

## Acceptance Criteria
- [ ] Tests pass locally and in CI
- [ ] Coverage delta posted in issue comment (statements + branches)
- [ ] Linked PR(s) included
