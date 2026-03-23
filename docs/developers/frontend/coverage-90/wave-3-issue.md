# [Coverage][Wave 3] Agreement review + CAN detail workflow hooks

## Objective
Lift near-zero coverage for workflow-critical agreement and CAN detail hook modules.

## Targets
- [ ] `src/pages/agreements/review/ReviewAgreement.hooks.js`
- [ ] `src/pages/cans/detail/CanFunding.hooks.js`
- [ ] `src/pages/cans/detail/Can.hooks.js`

## Implementation Approach
- Test style: hook-focused unit tests with mocked RTK Query, router, alert, and Redux dependencies.
- Primary goal: maximize statements and branch coverage in workflow-heavy hooks before adding any component-level tests.
- Execution order:
  1. `ReviewAgreement.hooks.test.js`
  2. `CanFunding.hooks.test.js`
  3. `Can.hooks.test.js`

## Progress Tracker

### `ReviewAgreement.hooks.js`
- [x] Add base hook test file and shared fixtures
- [x] Cover initial derived state from agreement + services components
- [x] Cover `handleActionChange` actionable-row logic
- [x] Cover BLI selection and `isSubmissionReady`
- [x] Cover validation aggregation into `pageErrors` and alert state
- [x] Cover submit success path and cleaned mutation payloads
- [x] Cover submit failure path and error alert
- [x] Cover cancel modal and navigation

### `CanFunding.hooks.js`
- [x] Add base hook test file and shared fixtures
- [x] Cover `showButton` gating rules
- [x] Cover `handleAddBudget`
- [x] Cover add funding received path
- [x] Cover edit funding received path
- [x] Cover delete funding received modal confirm path
- [x] Cover submit success path for create/update/delete operations
- [x] Cover submit failure alert and current cleanup behavior
- [x] Cover populate and cancel form helpers

### `Can.hooks.js`
- [x] Add base hook test file and shared fixtures
- [x] Cover route/user-derived state (`canId`, `fiscalYear`, `isBudgetTeam`)
- [x] Cover FY filtering for budget lines and funding received
- [x] Cover summary/count derivations
- [x] Cover detail page edit toggle
- [x] Cover funding page edit toggle with existing funding
- [x] Cover zero-funding welcome modal path and confirm handler
- [x] Cover `resetWelcomeModal`
- [x] Cover `currentFiscalYearFundingId`

## Test Scenarios
- [ ] Happy path state transitions
- [ ] Mutation and fetch failure handling
- [ ] Edge cases around empty or missing API data
- [ ] User-facing side effects (alerts/navigation)

## Risks / Notes
- `ReviewAgreement.hooks.js` uses multiple effects for validation, so assertions should use `waitFor` after selection changes.
- `ReviewAgreement.hooks.js` can report `isSubmissionReady` even when validation still fails; tests should lock down current behavior.
- `CanFunding.hooks.js` uses `Promise.allSettled` and modal callbacks; submit tests should flush async work before asserting.
- `CanFunding.hooks.js` appears to run cleanup even after submit failure; capture current behavior before deciding whether to change it.
- `Can.hooks.js` is mostly derived state and toggle behavior, so keep fixtures small and realistic.

## Coverage Snapshot (Local)
- `src/pages/agreements/review/ReviewAgreement.hooks.js`: statements `91.95%`, branches `72.72%`, functions `94.73%`, lines `91.71%`
- `src/pages/cans/detail/CanFunding.hooks.js`: statements `91.77%`, branches `80.00%`, functions `84.61%`, lines `91.50%`
- `src/pages/cans/detail/Can.hooks.js`: statements `100.00%`, branches `90.38%`, functions `93.75%`, lines `100.00%`

## Acceptance Criteria
- [ ] Tests pass locally and in CI
- [ ] Coverage delta posted in issue comment (statements + branches)
- [ ] Linked PR(s) included

## Local Validation
- `bun run test --watch=false src/pages/agreements/review/ReviewAgreement.hooks.test.js src/pages/cans/detail/CanFunding.hooks.test.js src/pages/cans/detail/Can.hooks.test.js`
- `bunx vitest run --coverage src/pages/agreements/review/ReviewAgreement.hooks.test.js src/pages/cans/detail/CanFunding.hooks.test.js src/pages/cans/detail/Can.hooks.test.js`
- `bun run lint:src src/pages/agreements/review/ReviewAgreement.hooks.test.js src/pages/cans/detail/CanFunding.hooks.test.js src/pages/cans/detail/Can.hooks.test.js`

## Parent Issue Update Draft
Use this comment on the parent coverage tracking issue once Wave 3 is complete:

```md
Wave 3 update (frontend coverage program):

Opened PR: https://github.com/HHS/OPRE-OPS/pull/<PR_NUMBER>
Branch: `OPS-5160/wave-three`

Scope completed in this PR:
- Added/expanded hook-focused unit tests for:
  - `frontend/src/pages/agreements/review/ReviewAgreement.hooks.js`
  - `frontend/src/pages/cans/detail/CanFunding.hooks.js`
  - `frontend/src/pages/cans/detail/Can.hooks.js`
- Focused on workflow state transitions, error handling, and user-facing side effects.
- Updated tracking doc:
  - `docs/developers/frontend/coverage-90/wave-3-issue.md`

Local coverage delta for Wave 3 targets:
- `src/pages/agreements/review/ReviewAgreement.hooks.js`: statements `<BEFORE> -> <AFTER>`, branches `<BEFORE> -> <AFTER>`
- `src/pages/cans/detail/CanFunding.hooks.js`: statements `<BEFORE> -> <AFTER>`, branches `<BEFORE> -> <AFTER>`
- `src/pages/cans/detail/Can.hooks.js`: statements `<BEFORE> -> <AFTER>`, branches `<BEFORE> -> <AFTER>`

Status:
- Local frontend unit tests and coverage <STATUS>
- CI <STATUS>
```
