# Bug Fix Story

## Bug Overview

**Ticket:** GitHub issue #6178 (branch: `OPS-6178/disable-edit-button-tooltip`)
**Title:** Agreement Edit button disappears instead of being disabled with a tooltip
**Severity:** High (`bug-high`)
**Priority:** P1

## Bug Description

### What's Broken
The "Edit" button on agreements is hidden entirely when the current user cannot edit,
instead of remaining visible but disabled with an explanatory tooltip.

### Expected Behavior
The Edit button should always render (across all editable tabs and agreement types). When
the user cannot edit, it is shown disabled with a tooltip explaining why.

### Actual Behavior
The button disappears with no tooltip, leaving users confused about why they cannot edit.

### Impact
- **Users Affected:** Any user who is not a team member on an agreement, and any user viewing
  an agreement in a review/locked state.
- **Workaround:** None.
- **Business Impact:** Poor system-status visibility — users can't tell whether editing is
  blocked by permissions, review state, or a bug.

## Reproduction Steps

1. Open an agreement where you are **not** a listed team member (or one in pre-award status).
2. Observe there is no Edit button and no explanatory tooltip.
3. Confusion results.

### Environment
- **Browser/Device:** All
- **User Role:** Non-team-member (non-superuser); or any user on an in-review/locked agreement
- **Data State:** Agreement in pre-award review, award review, post-pre-award lock, or an
  undeveloped agreement type (grant / IAA / direct obligation)

### Reproduction Rate
Always.

## Root Cause Analysis

### Investigation
The Edit button lives in two tab headers:
- `frontend/src/components/Agreements/AgreementDetailHeader.jsx` (Details tab)
- `frontend/src/components/Agreements/AgreementBudgetLinesHeader.jsx` (Budget Lines tab)

Both headers already contain an enabled branch **and** a disabled-with-tooltip branch, but
**both branches are gated on the single `isEditable` prop**:

```jsx
{!isEditMode && isEditable && !isEditDisabled && ( /* enabled button */ )}
{!isEditMode && isEditable && isEditDisabled && ( /* disabled + tooltip */ )}
```

The parent pages fold the review/lock flags **into** `isEditable` before passing it down:
- `AgreementDetails.jsx:62-66`
- `AgreementBudgetLines.jsx:93-98`

both compute
`isEditable = !isPreAwardInReview && !isAwardInReview && !isPostPreAwardLocked && (...)`.

Because the child's `isEditDisabled = isPreAwardInReview || isAwardInReview || isPostPreAwardLocked`,
the disabled-branch condition `isEditable && isEditDisabled` is
`(!A && !B && !C) && (A || B || C)` = **always false**.

### Root Cause
`isEditable` conflates two independent concerns — *does the user have permission to edit* vs.
*is the agreement currently in a locked/review state*. Since **both** button branches require
`isEditable` to be truthy, the button disappears whenever either concern blocks editing, and the
disabled-with-tooltip branch is effectively dead code.

Backend confirmation — `backend/ops_api/ops/services/agreements.py:860`:
```python
return user.is_superuser or associated_with_agreement(agreement.id)
```
`_meta.isEditable` is `false` for any non-superuser who is not a team member → the
"Only team members can edit this agreement." scenario.

### Why It Wasn't Caught
- [x] Regression from recent change (the disabled branch was added but never reachable)
- [x] Missing test coverage (no unit tests exist for either header component)
- [x] Edge case not considered (permission vs. lock-state were merged into one boolean)

### Related Issues
- OPS-2280 introduced the broadened `isEditable` computation that made the disabled branch
  unreachable.

## Fix Implementation

### Solution Approach
Keep the parent's `isEditable` as the **single source of truth for enabled vs. disabled** (it
already correctly encodes the superuser bypasses). Always render an Edit button when not in edit
mode: enabled when `isEditable`, otherwise disabled + tooltip. Pass the individual *reason* flags
to the header purely to select the correct tooltip text. This avoids the header ever contradicting
the reachable edit form (e.g. superusers keep editing undeveloped agreements — enforced by the
existing parent logic).

### Decisions Made (locked in with product/user)
1. **Undeveloped agreement types** (grants, IAAs, direct obligations): show the disabled button
   with the existing "…coming soon" tooltip. **Superusers keep the enabled button** on undeveloped
   agreements (unchanged behavior — enforced by the existing parent `isEditable`; do NOT add
   `!isAgreementNotDeveloped` for superusers).
2. **Tooltip precedence** when multiple conditions apply: the **not-a-team-member** message wins
   over review-state messages.
3. **Documents tab**: out of scope (stubbed with `isEditable={true}`, mock data).
4. **Procurement Tracker tab**: out of scope (separate permission model, not an edit-pencil).
5. **All-budget-lines-in-review** (Budget Lines tab only): reuse the existing string
   "Budget lines In Review Status cannot be sent for status changes".

### Tooltip Precedence (first match wins)
Consulted only when `!isEditable`:
1. `!canUserEdit` → **"Only team members can edit this agreement."**
2. `isAgreementNotDeveloped` → "Agreements that are grants, other partner agreements (IAAs, IPAs,
   IDDAs), \nor direct obligations have not been developed yet, but are coming soon." (the
   `AgreementBudgetLines.jsx:109` variant — matches the on-page alert `Agreement.jsx:259`)
3. `isPreAwardInReview` → "This agreement is In Review for Pre-Award Approval. Edits or changes
   cannot be made at this time."
4. `isAwardInReview` → "This agreement is In Review for Award Approval. Edits or changes cannot be
   made at this time."
5. `isPostPreAwardLocked` → "This agreement has completed Pre-Award Approval and is locked from
   further edits."
6. `allBudgetLinesInReview` (Budget Lines header only) → "Budget lines In Review Status cannot be
   sent for status changes"

where `canUserEdit = isSuperUser || agreement._meta.isEditable`.

Precedence is well-defined and complete: every condition that makes the parent `isEditable` false
is covered by one of the flags above (verified against both parent formulas), so there is no
tooltip fall-through.

### Files to Modify
- `frontend/src/helpers/agreement.helpers.js` — add shared `getEditDisabledTooltip(...)` helper so
  both headers stay in sync and strings don't drift.
- `frontend/src/components/Agreements/AgreementDetailHeader.jsx` — always render the button; enabled
  when `isEditable`, else disabled `<span>` + `<Tooltip>` using the helper. Accept reason props
  (`canUserEdit`, `isAgreementNotDeveloped`, existing review flags).
- `frontend/src/components/Agreements/AgreementBudgetLinesHeader.jsx` — same change; also accept
  `allBudgetLinesInReview`. Align the disabled `<span>` a11y attributes with the Details header
  (`role="button"`, `tabIndex={0}`, `aria-disabled="true"`).
- `frontend/src/pages/agreements/details/AgreementDetails.jsx` — keep `isEditable` computation
  **as-is**; pass `canUserEdit = isSuperUser || agreement?._meta.isEditable` and
  `isAgreementNotDeveloped` to the header.
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` — keep `isAgreementEditable`
  **as-is**; pass `canUserEdit`, `isAgreementNotDeveloped`, and `allBudgetLinesInReview` to the
  header.
- Tests (see Testing Strategy).

### Code Changes (illustrative)

**Header — before (both branches gated on `isEditable`):**
```jsx
{!isEditMode && isEditable && !isEditDisabled && ( /* enabled button */ )}
{!isEditMode && isEditable && isEditDisabled && ( /* disabled + tooltip — DEAD */ )}
```

**Header — after (`isEditable` = enable source of truth):**
```jsx
{!isEditMode && isEditable && ( /* enabled <button id="edit"> */ )}
{!isEditMode && !isEditable && (
    <Tooltip label={getEditDisabledTooltip({ canUserEdit, isAgreementNotDeveloped,
        isPreAwardInReview, isAwardInReview, isPostPreAwardLocked, allBudgetLinesInReview })}>
        <span id="edit-disabled" role="button" tabIndex={0} aria-disabled="true"
              data-cy="edit-disabled"> ... Edit </span>
    </Tooltip>
)}
```

**Parents — no change to `isEditable` / `isAgreementEditable`; add reason props only:**
```jsx
canUserEdit={isSuperUser || agreement?._meta.isEditable}
isAgreementNotDeveloped={isAgreementNotDeveloped}
/* Budget Lines only */ allBudgetLinesInReview={allBudgetLinesInReview}
```

### Implementation Steps
1. Add `getEditDisabledTooltip` to `agreement.helpers.js` with the precedence above.
2. Refactor `AgreementDetailHeader.jsx` to the enable/disable-by-`isEditable` model + helper.
3. Refactor `AgreementBudgetLinesHeader.jsx` likewise; add `allBudgetLinesInReview`; align a11y.
4. Pass the new reason props from `AgreementDetails.jsx` and `AgreementBudgetLines.jsx`
   (leave the editable computations untouched).
5. Add/adjust tests (below).
6. `bun run format`, `bun run lint --fix`, `bun run test --watch=false`.

## Testing Strategy

### Regression Tests
- [ ] New `AgreementDetailHeader.test.jsx` — net new (no existing header tests).
- [ ] New `AgreementBudgetLinesHeader.test.jsx` — net new.
- [ ] Verify existing page tests still pass; update where they assert header rendering.

### Test Cases (per header)
- [ ] Enabled: `isEditable=true`, not in edit mode → `#edit` button present, clickable.
- [ ] In edit mode: no button rendered (unchanged).
- [ ] Disabled — non-team-member (`!canUserEdit`) → `#edit-disabled` present, tooltip
      "Only team members can edit this agreement."
- [ ] Disabled — pre-award review → pre-award tooltip.
- [ ] Disabled — award review → award tooltip.
- [ ] Disabled — post-pre-award lock → locked tooltip.
- [ ] Disabled — undeveloped (regular user) → "coming soon" tooltip.
- [ ] Precedence — non-team-member AND in review → "Only team members…" wins.
- [ ] Budget Lines only — `allBudgetLinesInReview` → status-change string.
- [ ] Assert on `data-cy="edit-disabled"` / `aria-disabled` / tooltip `title` — **not** button
      absence (the disabled variant is a `<span role="button">`, so `queryByRole("button")`
      still matches it).

### Existing Tests to Update
- [ ] `frontend/src/pages/agreements/details/AgreementDetails.test.js:453` — "regular user cannot
      edit when isAgreementNotDeveloped is true" currently asserts the Edit button is **absent**.
      Invert to assert the disabled button + "coming soon" tooltip.
- [ ] `frontend/src/pages/agreements/details/AgreementDetails.test.js:358`/`:380` — superuser can
      edit undeveloped: **stays passing** (superuser keeps the enabled button); confirm the
      assertion targets the enabled `#edit` button, not just any `role="button"`.

### Manual Verification
- [ ] Non-team-member on a normal agreement → disabled button + team-member tooltip.
- [ ] Team member on pre-award / award / post-lock agreement → disabled button + matching tooltip.
- [ ] Regular user on undeveloped agreement → disabled + "coming soon".
- [ ] Superuser on undeveloped agreement → **enabled** button, edit form works.
- [ ] Tooltip appears on both hover and keyboard focus (a11y).

## Validation

### Code Quality
- [ ] All tests pass (including new header tests)
- [ ] `bun run lint` passes
- [ ] `bun run format` applied
- [ ] Coverage maintained (≥90%)
- [ ] Pre-commit hooks pass

### Functional Validation
- [ ] Edit button visible in every scenario (never disappears) except while in edit mode.
- [ ] Correct tooltip per scenario; precedence honored.
- [ ] No change to superuser edit ability, form gating, `?mode=edit`, or the Change BL Status button.

## Regression Prevention

### New Tests Added
- Unit tests for both header components covering enabled + every disabled/tooltip scenario, guarding
  against the button ever silently disappearing again.

### Process Improvements
- [ ] Header components now have dedicated unit coverage (previously none).

## Rollout Plan

### Deployment Strategy
- [ ] Frontend-only change; deploys with normal `main` → dev/staging auto-deploy.

### Rollback Plan
Revert the PR; no data or schema changes involved.

## Notes

### Scope Guardrails
- Do **not** modify parent `isEditable` / `isAgreementEditable` computations — they are the enable
  source of truth and already correct (including superuser bypasses).
- Documents and Procurement Tracker tabs are explicitly out of scope.

### Open Questions
- None outstanding — all decisions resolved (see "Decisions Made").

### References
- GitHub issue #6178
- Sibling precedent: `frontend/src/components/Agreements/AgreementsTable/AgreementTableRow.jsx:60-87`
  (`lockedMessages` `switch(true)` with not-team-member before not-developed)
- Existing tooltip pattern: Change BL Status button `AgreementBudgetLines.jsx:403-425`
- Reusable disabled-button-with-tooltip: `frontend/src/components/UI/Button/DisabledButtonWithTooltip`
