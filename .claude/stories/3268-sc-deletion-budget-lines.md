---
issue: 3268
branch: claude/sc-deletion-budget-lines-f2a48f
---

# SC Deletion with Budget Lines

## Goal

Implement the UX-defined deletion rules for a Service Component (SC) that has budget lines: an empty SC deletes immediately; a SC with only Draft/Planned budget lines prompts the user to delete or keep those lines; OBE budget lines are always kept and unassigned; a SC with any Obligated budget line cannot be deleted at all. Scope is limited to these 4 new AC on issue #3268 — no other item from that issue (the Modified-LOE contract-modification flow, SC PoP-lock work, etc.) is in scope.

## Acceptance Criteria

- [ ] If a SC has no budget lines, the user can delete it directly from the delete icon with no additional prompt
- [ ] If a SC contains Draft and/or Planned budget lines, clicking the delete icon presents a modal asking the user whether to delete or keep those budget lines
  - [ ] If the user chooses to delete, the SC and its Draft/Planned budget lines are deleted together
  - [ ] If the user chooses to keep, the SC is deleted and its Draft/Planned budget lines become unassigned (no SC)
- [ ] If a SC contains OBE budget lines, those budget lines are always kept and become unassigned (no SC) when the SC is deleted, regardless of what the user selects for any other Draft/Planned budget lines in the same SC
- [ ] If a SC contains any Obligated budget lines, the delete icon/action is disabled and the SC cannot be deleted

## Technical Details

### Approach

Almost entirely a **frontend** change — the backend already has the needed primitives (nullable `services_component_id` FK, an existing Obligated/Executing delete block, and a separate BLI-delete endpoint).

1. In `useServicesComponents.handleDelete` (`ServicesComponents.hooks.js`), categorize the SC's matched budget lines on click: `obligated`/`executing` (existing check, unchanged), `obeLines` (`is_obe === true`, always excluded from any delete set), `draftOrPlanned` (`!is_obe` and `status` in `DRAFT`/`PLANNED`).
2. **AC4**: proactively disable the delete icon (today the Obligated/Executing check only fires an error *after* clicking delete). Extend `ServicesComponentListItem`'s existing `isDeleteDisabled`/`disabledDeleteMsg` precedence chain with a new "has Obligated budget lines" condition and tooltip, threaded down `ServicesComponents.jsx` → `ServicesComponentsList.jsx` → `ServicesComponentListItem.jsx` the same way `lockedMessage` is today.
3. **AC1**: if the SC has zero matched budget lines (after the existing obligated/executing check and the existing PoP-conflict check both pass), skip the generic `ConfirmationModal` and delete directly.
4. **AC2/AC3**: when `draftOrPlanned.length > 0`, show a new modal with a 3-way choice (Delete budget lines / Keep budget lines / Cancel) — no existing modal in the codebase supports more than 2 buttons (`ConfirmationModal`, `SaveChangesAndExitModal`), so this needs a new component or an extension.
   - **Keep**: dispatch `DELETE_SERVICE_COMPONENT` exactly as today — the existing reducer (`AgreementEditorContext.hooks.js`) already unconditionally unassigns every remaining BLI (including OBE) via `clearBliServiceComponentLink`. No change needed for this path; it's also what already happens for OBE lines regardless of which button the user picks.
   - **Delete**: dispatch `DELETE_SERVICE_COMPONENT` **and** move the chosen `draftOrPlanned` BLI ids into `deleted_budget_line_items_ids` (extend the reducer to accept this, mirroring however an individual BLI delete is already dispatched elsewhere in `CreateBLIsAndSCs`). OBE lines are never added to this set regardless of the user's choice.
5. **Persistence**: no new backend endpoint is needed. `CreateBLIsAndSCs.hooks.js`'s existing `handleDeletions()` already deletes `deleted_budget_line_items_ids` before `deleted_services_components_ids` on Save — once the delete set is populated correctly, the existing save flow persists it.
6. **Backend**: verify-only. Confirm `ServicesComponentService._check_no_executing_budget_lines()` (which currently blocks on `IN_EXECUTION` **and** `OBLIGATED`, for every user including superusers) doesn't need to narrow to Obligated-only per the new AC's wording — see Constraints.

### Key Files

Backend (verify only — no changes currently expected):
- [backend/ops_api/ops/services/services_component.py](backend/ops_api/ops/services/services_component.py) — `ServicesComponentService.delete()` / `_check_no_executing_budget_lines()`
- [backend/models/budget_line_items.py](backend/models/budget_line_items.py) — `BudgetLineItemStatus` enum (`DRAFT`, `PLANNED`, `IN_EXECUTION`, `OBLIGATED`) and the independent `is_obe` boolean column — source of truth for all status/OBE gating
- [backend/ops_api/ops/services/budget_line_items.py](backend/ops_api/ops/services/budget_line_items.py) — `BudgetLineItemService.delete()`, used for the chosen Draft/Planned BLI deletions

Frontend (primary changes):
- [frontend/src/components/ServicesComponents/ServicesComponents.hooks.js](frontend/src/components/ServicesComponents/ServicesComponents.hooks.js) — `handleDelete`/`performDelete`: core branching logic
- [frontend/src/components/ServicesComponents/ServicesComponents.jsx](frontend/src/components/ServicesComponents/ServicesComponents.jsx) — wires in the new modal, threads budget-line data to the list
- [frontend/src/components/ServicesComponents/ServicesComponentsList/ServicesComponentsList.jsx](frontend/src/components/ServicesComponents/ServicesComponentsList/ServicesComponentsList.jsx) — thread a new "has Obligated budget lines" prop per SC
- [frontend/src/components/ServicesComponents/ServicesComponentListItem/ServicesComponentListItem.jsx](frontend/src/components/ServicesComponents/ServicesComponentListItem/ServicesComponentListItem.jsx) — extend `isDeleteDisabled`/tooltip logic
- [frontend/src/components/ServicesComponents/ServicesComponents.helpers.js](frontend/src/components/ServicesComponents/ServicesComponents.helpers.js) — new helper for per-SC budget-line categorization/Obligated flag
- [frontend/src/components/Agreements/AgreementEditor/AgreementEditorContext.hooks.js](frontend/src/components/Agreements/AgreementEditor/AgreementEditorContext.hooks.js) — `deleteServiceComponent`/`makeDeleteCase`/`clearBliServiceComponentLink`: needs a way to also move chosen BLI ids into `deleted_budget_line_items_ids`
- [frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js](frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js) — `handleDeletions()`: existing BLI-then-SC delete ordering on save (verify only)
- [frontend/src/helpers/budgetLines.helpers.js](frontend/src/helpers/budgetLines.helpers.js) — `BLI_STATUS`, `getNonDRAFTBudgetLines`, `getBudgetByStatus`: reuse for categorization
- [frontend/src/components/UI/Modals/ConfirmationModal.jsx](frontend/src/components/UI/Modals/ConfirmationModal.jsx) — extend, or add a new sibling modal, for the 3-way delete/keep/cancel prompt

### Testing Strategy

Backend (pytest), extend [backend/ops_api/tests/ops/services_components/test_services_component.py](backend/ops_api/tests/ops/services_components/test_services_component.py):
- Service-layer/integration tests (`loaded_db` + `auth_client`) for the branching matrix: no BLIs → deletes clean; Draft/Planned + "delete" choice → SC and those BLIs both gone; Draft/Planned + "keep" choice → SC gone, BLIs remain unassigned; OBE mixed in with Draft/Planned → OBE always remains unassigned regardless of choice (new test — no existing analog); any Obligated BLI → delete blocked and nothing mutated (extends the currently-untested `HAS_EXECUTING_BUDGET_LINES_MESSAGE` path).
- Authorization tests across roles (`basic_user_auth_client`/`division_director_auth_client`/`system_owner_auth_client`), confirming the Obligated-block applies to every role, following `test_services_components_delete_forbidden_as_basic_user`.
- Plain pytest, not `pytest-bdd` — matches the existing SC test file's style.

Frontend (Vitest + RTL):
- Extend `ServicesComponents.hooks.test.js` (or a new `ServicesComponents.delete.test.jsx` alongside the existing `.focus.test.jsx`) for `handleDelete`'s new branching: no-BLI direct delete, Draft/Planned → modal, OBE always unassigned regardless of the modal choice.
- Extend `ServicesComponentListItem.test.jsx` for the new disabled+tooltip "Obligated budget lines present" case (`aria-disabled`, `toHaveAccessibleName`/`toHaveAccessibleDescription`), following the existing locked-SC pattern.
- Modal-choice assertions live in the hook tests (which `actionButtonText`/`handleConfirm` variant is passed for the new modal); no new modal-component test needed if it reuses `ConfirmationModal`.
- Extend `ServicesComponents.focus.test.jsx` with focus-restoration cases for the new modal's Delete/Keep/Cancel paths (WCAG 2.4.3), per `docs/REVIEW.md`'s accessibility bar for new/changed UI.
- No E2E spec warranted — component + backend integration tests give the stronger, faster coverage `docs/TESTING.md` recommends ("Favor Integration Over E2E"); this is UI-state branching plus already-covered backend authorization, not a new critical cross-page journey.

### Constraints

- Scope is limited to the 4 new AC added to issue #3268 on this branch. No other item on that issue (the Modified-LOE contract-modification flow, SC period-of-performance tracking/number-lock work) is in scope, even though they share files in `ServicesComponents*`.
- `is_obe` is a boolean column independent of `status` — **not** a `BudgetLineItemStatus` enum value. All status-based branching in this feature must check `is_obe` separately from `DRAFT`/`PLANNED`/`OBLIGATED`.
- Open product nuance (non-blocking, confirm with the ticket author if it matters): the existing block also treats `IN_EXECUTION` ("Executing") budget lines the same as Obligated ones, both backend (`_check_no_executing_budget_lines`) and frontend. The new AC only mentions Obligated — treat this as a pre-existing, broader restriction, not a conflict introduced by this work, and leave it as-is unless told to narrow it.
- Open product nuance (non-blocking): elsewhere in the app, deleting a Planned budget line directly can route through Division Director approval rather than hard-deleting outright (`isDeletionRoutedToApproval` in `CreateBLIsAndSCs.hooks.js`). The "delete together" path (AC2) needs to decide how it interacts with that existing approval-routing logic; precedent for the distinction already exists in the same file.
- Coordination risk: two other story files already exist for issue #3268 — [3268-start-contract-modification-loe.md](3268-start-contract-modification-loe.md) (the Modified-LOE contract-mod flow, mostly shipped) and [3268-sc-period-and-number-lock-plan.md](3268-sc-period-and-number-lock-plan.md) (SC PoP tracking + number lock, in progress). The contract-mod story's own Constraints section notes a separate, parallel effort (OPS-6440 / "Santi-3rd") adding Add/Delete-SC modification-edit cards, which also touches `ServicesComponentService.delete()`. Check for merge conflicts against that work before landing changes to `delete()`.
