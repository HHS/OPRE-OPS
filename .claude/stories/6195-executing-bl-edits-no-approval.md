---
issue: 6195
branch: OPS-6195/executing-bl-edits-no-approval
---

# Enable edits on executing BLs w/o approval (until step 5 pre-award)

## Goal

Let budget lines in Executing status be edited without Division Director approval (like Planned BLs) until Pre-Award Approval is requested in Procurement Tracker Step 5, so DDs don't review executing-BL change requests and then re-review the same agreement state at pre-award.

## Acceptance Criteria

- [ ] Status change from planned to executing still requires approval to start procurement
- [ ] Once a budget line is in executing status, it can be edited without approvals (just like BLs in planned status)
- [ ] While an agreement is in review for pre-award, it cannot be edited
- [ ] After a DD approves a pre-award request, the agreement cannot be edited until its awarded

## Technical Details

### Approach

Reuse the `SKIP_CR_FOR_DRAFT_PLANNED` direct-edit pattern from PR #6105 (commit `6c0c880c0`):

- **Backend:** in `_flagged_direct_edit`, change the in-Planned branch's `== PLANNED` check to `in (PLANNED, IN_EXECUTION)`. Keep the `not has_status_change` guard so Planned→Executing still creates a change request (AC 1).
- **Frontend:** extend `flagAllowsDirectApply` in `CreateBLIsAndSCs.hooks.js` to accept `BLI_STATUS.EXECUTING`. This also settles the deferred mixed Planned and Executing case. Rewrite the comments that say executing lines keep approval.
- **BLI locks (AC 3–4):** already enforced for BLIs. `_validation` runs `is_pre_award_in_review` and `is_post_pre_award_locked` before the direct-edit path, and `EDITABLE_STATUSES` / `get_bli_locked_message` already drive the pen icon and lock tooltip. A DD decline releases the lock.
- **Agreement locks (AC 3–4):** add backend pre-award checks to `AgreementService.update` and `ServicesComponentService.update`. Today only the UI blocks these, and the procurement shop has its own lock. Mirror the BLI lock rules: Budget Team exemption, and the lock lifts when the Award request is approved.

### Key Files

- `backend/ops_api/ops/services/budget_line_items.py`: `_flagged_direct_edit`, plus the docstrings and comments around lines 697 and 791–815
- `backend/ops_api/ops/utils/budget_line_items_helpers.py`: `is_pre_award_in_review` and `is_post_pre_award_locked`, reused for the agreement locks
- `backend/ops_api/ops/services/agreements.py`: `AgreementService.update` pre-award lock
- `backend/ops_api/ops/services/services_component.py`: `ServicesComponentService.update` pre-award lock
- `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js`: `flagAllowsDirectApply` and the approval copy
- Tests:
  - `backend/ops_api/tests/ops/budget_line_items/test_skip_cr_draft_planned.py`
  - `backend/ops_api/tests/ops/budget_line_items/test_edit_executing_budget_line.py`
  - `backend/ops_api/tests/ops/agreement/` and `backend/ops_api/tests/ops/services_components/`
  - `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.test.js`

- `backend/ops_api/ops/validation/rules/agreement.py` and `agreement_validator.py`: new `PreAwardLockRule`
- `backend/ops_api/tests/ops/agreement/test_agreement_pre_award_lock.py`
- `backend/data_tools/data/agreements_and_blin_data.json5`: test agreements #25–#28

### Test Data (dev, local docker)

All four are contracts on project 1002, with BLIs on CAN 515 (FY2027) and the procurement tracker at Step 5. The DD for division 4 is Dave Director (522).

| Agreement | Pre-Award state | Expected |
|---|---|---|
| #25 `EXEC-EDIT-OPEN` | Not requested | Executing BLI budget edits save immediately. The Planned BLI → Executing still needs approval. |
| #26 `EXEC-EDIT-IN-REVIEW` | Requested, pending DD | BLIs, agreement and services components are locked. Shows in the DD's pre-award queue. |
| #27 `EXEC-EDIT-APPROVED` | DD approved + requisition approved | Locked until the Award request is approved |
| #28 `EXEC-EDIT-DECLINED` | DD declined | Editable again without approval |

### Testing Strategy

- **Backend pytest, `test_skip_cr_draft_planned.py`:**
  - Add executing cases with the `skip_cr_enabled` fixture. A budget edit returns 200 and writes only the budget fields plus the always-direct fields. With the flag off it still returns 202.
  - Add an executing case to the edit-bundle test (~line 349).
  - Keep `test_planned_to_executing_still_creates_cr_when_flag_on` for AC 1, and reword its docstring.
- **Backend pytest, `test_edit_executing_budget_line.py`:** parametrize the flag in the `make_pre_award` lock tests (~lines 240, 253, 265, 292). This proves the pre-award lock still wins over the new direct-edit path, and covers in-review, approved, declined and post-award (AC 3–4).
- **Backend pytest, new agreement-level locks:** PATCHes to agreements and services components are rejected while pre-award is in review or approved. They are allowed after a decline and for Budget Team.
- **Vitest + RTL, `CreateBLIsAndSCs.hooks.test.js`:**
  - Flip the test at ~line 452, which currently asserts executing lines still need approval with the flag on.
  - Fix its fixture to use `BLI_STATUS.EXECUTING` (`"IN_EXECUTION"`), not `"EXECUTING"`.
  - Add a mixed Planned+Executing case and a flag-off executing case.
- **Keep:** the `ReviewAgreement.hooks.test.js` check that Planned→Executing keeps "Send to Approval" (AC 1).
- **No new E2E.** The flag defaults off in docker and CI, so the existing change-request Cypress specs stay valid.

### Constraints

- Reuse `SKIP_CR_FOR_DRAFT_PLANNED`. It's already on in dev, stg and prod, so this goes live wherever the code is deployed: dev and stg automatically on merge, prod on the next manual deploy. The flag name and the `skip_cr_for_draft_planned` key in `version.py` now understate what they cover.
- Ship as one PR. The backend and frontend direct-edit changes must land together, and the agreement-level locks go in the same PR.
- Planned→Executing stays on the approval path. Only edits within Executing status skip approval.
- **Out of scope: deletes.** Deleting a Planned or Executing BLI still creates a delete change request.
- **Out of scope: procurement-shop changes.** They're already hard-blocked for IN_EXECUTION (`agreements.py:631-634`).
- **No migration of pending change requests.** Requests already pending on executing BLIs are left for DDs to resolve. Until then they keep those BLIs locked and block the Step 5 pre-award request.
- **Existing lock exceptions stay:** Budget Team is exempt from the pre-award locks, and edits that only change `clin_id` are allowed after pre-award.
- **Lock release timing:** the post-pre-award lock lifts when the Award request is approved, not on a separate "awarded" state.
