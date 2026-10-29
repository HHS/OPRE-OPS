---
issue: 3268
branch: OPS-3268/start-mod-modified-loe
---

# Start a Contract Modification for a Modified LOE

## Goal

Let a COR bundle the approved modified-LOE edits on an awarded agreement (plus any Planned BLs to execute) into one Contract Modification and send it to their Division Director, so the edits can be made official on the award documents. Second half of #3072.

## Acceptance Criteria

- [x] User can see the edit they made on a BL or SC that triggered the Modified Level of Effort listed under "Edits That Require a Contract Modification" on the Award & Modifications Tab
- [x] User can click Start Modification on the Award & Modifications Tab
- [x] User can review the details of the agreement
- [x] User can select Planned BLs to Execute (if applicable)
- [x] User cannot select Draft and Obligated BLs (disabled with tooltip)
- [x] User can Review CANs to see the impact on the CAN/budget for any BLs selcted
- [x] User can review the summary of their contract modification including the details of their modified LOE (which BLs or SCs were changed)
- [ ] User can upload any relevant documents, as needed
- [x] User can provide optional notes to the approver, as needed
- [x] User can click "Send to Approval" to send the mod to their DD
- [x] All relevant alerts are displayed as changes are successfully sent to approval, In Review, and either approved or declined
- [x] All modified LOE changes included in the mod appear with an In Review status
- [x] All relevant event / history records should be recorded denoting the who (user), when, and what, and remote IP of changes being made/requested.

## Technical Details

### Approach

Designs: Figma section "Edit SCs & BLs on an Awarded Agreement" (node 15119:133682), frames after "#3268 starts here".

- **Award & Mods tab**: add a Start modification button under the edit cards. It's disabled while a mod is In Review, and the cards then show an In Review tag. Alerts: Sent to Approval (success), Contract Modification In Review (warning, all users), Approved, and Declined (with DD notes).
- **New Start Modification page** (`/agreements/:id/start-modification`), built from `ReviewAgreement`'s prop-driven pieces (`AgreementBLIAccordion`, `ServicesComponentAccordion`, `BLIReviewTable`, `AgreementCANReviewAccordion`, notes). Sections in order:
  - Review Contract Modifications: the pending edit cards, plus a synthesized Planned→Executing card for each selected BL
  - Review Agreement Details
  - Select Budget Lines: Planned, current-FY only
  - Review CANs: selected BLs only
  - Upload Documents: Mod Memo, Revised IGCE, Certificate of Funding, Revised SOW/PWS, Additional
  - Notes: optional, 150-character limit
  - Send to approval
- **BL eligibility** comes from a pure helper, `getModBudgetLineDisabledReason(bl)`. Disabled cases and their tooltips:
  - Draft: "Only Budget Lines in Planned Status can be changed to Executing Status"
  - Obligated / In Execution: "Budget lines in Obligated Status cannot be changed"
  - Future FY: "Only current FY Budget Lines can be changed from Planned to Executing Status"

  The backend enforces the same rules.
- **Backend**: add a new `contract_modification_request` table rather than a ChangeRequest subtype, because a subtype would:
  - flip `Agreement.change_requests_in_review` and lock the agreement
  - be invisible to BLI `in_review`
  - need a branch in `_handle_review_action` that doesn't exist yet
  - leak into DD lists before #3331

  The table:
  - Status is IN_REVIEW / APPROVED / DECLINED, plus requester, `reviewer_notes` and `notes`.
  - It joins to the included edits and to the selected BLs.
  - It has a history table and its own `NotificationType`.
  - DD routing uses `get_division_directors_for_agreement`.
- **Service methods**:
  - `submit_modification` validates the one-open-mod rule and BL eligibility, then creates the request. The edits stay unattached (`agreement_mod_id` NULL); the resource layer marks them `in_review`.
  - `approve` reuses the existing `start_modification` attach logic. It creates an `AgreementMod` with `mod_type` Modified LOE (number and date null), sets the selected BLs to IN_EXECUTION directly (this deliberately bypasses `validate_no_execution_status_change_on_awarded`), and notifies the submitter.
  - `decline` stores the reviewer notes and leaves the edits pending.
- **Documents**: the five upload slots (Mod Memo, Revised IGCE, Certificate of Funding, Revised SOW/PWS, Additional) are shown **disabled** with the app's "Documents tab is coming soon" tooltip, matching pre-award approval. Upload isn't live anywhere in OPS yet. The three new `DocumentType`s and the enum-derived type mapping are in place for when it ships.
- **Award & Mods section** is now shown on every Awarded agreement (flag on), even with no edits, so the user can start an "as-is" modification that only executes Planned budget lines. Before, #3072 hid it when there were no edits.
- **Supported cards**: only the edit types #3072 already records (Amount, CAN, Obligate By, Delete BL, Draft→Planned status).

### Key Files

Backend:
- `backend/models/contract_modification_edits.py` (read only, no restructure); a new `backend/models/contract_modification_requests.py`
- `backend/models/agreements.py` (`AgreementMod`, `ModType.MODIFIED_LOE`), `backend/models/document.py` (new types only), `backend/models/notifications.py`, `backend/models/events.py`, `backend/models/agreement_history.py`, `backend/models/__init__.py`
- `backend/ops_api/ops/services/contract_modification_edits.py` (add methods; leave `_pending_query` / `_latest_per_budget_line_field` alone)
- `backend/ops_api/ops/resources/contract_modification_edits.py`, `backend/ops_api/ops/schemas/contract_modification_edits.py`
- `backend/ops_api/ops/resources/notifications.py`, `backend/ops_api/ops/utils/budget_line_items_helpers.py`
- `backend/ops_api/ops/__init__.py` (event subscription), `backend/ops_api/ops/views.py`, `backend/ops_api/ops/urls.py`, `backend/openapi.yml`
- a new alembic migration under `backend/alembic/versions/`
- seed data: agreement 523's Planned BLI moved into FY2027 in `backend/data_tools/data/agreements_and_blin_data.json5`; changed in place, so no seeded IDs shift

Frontend:
- `frontend/src/pages/agreements/details/AgreementAwardModifications.jsx`
- `frontend/src/components/Agreements/ContractModificationEdits/*` (In Review via a `status` prop only)
- a new `frontend/src/pages/agreements/modifications/StartModification.jsx` (+ hooks/helpers)
- `frontend/src/pages/agreements/review/ReviewAgreement.hooks.js` / `ReviewAgreement.helpers.js` (export the predicate)
- `frontend/src/components/BudgetLineItems/BLIReviewTable/BLIReviewRow.jsx` (tooltip branch)
- `frontend/src/components/Agreements/Documents/Documents.constants.js`
- `frontend/src/api/opsAPI.js`, `frontend/src/index.jsx` (route)

### Testing Strategy

- **Backend pytest (integration)**:
  - `submit_modification`, `approve` and `decline` state transitions
  - the one-open-mod guard (4xx)
  - BL eligibility rejections
  - auth/permission and 4xx cases at the resource level
  - IP recorded on events (`"request.remote_addr" in event.event_details`), following `tests/ops/agreement/test_contract_modification_edits.py`
- **Backend BDD**: `start_contract_modification.feature` covering submit→approve (BLs Executing, edits attached to the mod) and submit→decline (edits back to pending). Model it on `edit_planned_budget_line.feature`.
- **Frontend unit**: `getModBudgetLineDisabledReason` covering Draft, Obligated, future FY and eligible.
- **Frontend Vitest+RTL**: `vi.mock` the RTK hooks, as the sibling tests do (not MSW).
  - StartModification: one disabled row with its tooltip, BL selection feeding the Planned→Executing card, and the Send to approval payload.
  - Award & Mods tab: the button enabled/disabled, In Review tags, and the In Review/Approved/Declined alerts from mocked request status.
- **E2E**: one Cypress spec from Award & Mods → Start modification → select BL → Send to approval → In Review state, with cleanup. Approve/decline stay out of E2E until #3331 has a UI.
- **Not tested**: "sections render" on its own, every tooltip string in RTL, and `maxLength`.

### Constraints

- Everything is behind `ENABLE_MODIFIED_LOE_EDITS`.
- One open contract modification per agreement.
- Contract and AA agreements only (`_SUPPORTED_AGREEMENT_TYPES`).
- Out of scope:
  - Add BL, Add SC and Delete SC cards (#3072 / OPS-6440)
- **SC edits (follow-up on `OPS-3268/sc-mod-edits`):** PR 6447 (OPS-6440) records an approved "Add SC" as a pending edit and renders it on the shared edit card, so it appears on the Award & Modifications tab and the Start Modification summary. The follow-up adds submit/decline tests for SC edits and names the added SCs in the START and REVIEW history messages ("including 2 edits (adding SC2)", "It included adding SC2.").
  - **SC deletes are not modification edits.** Deleting an SC with non-Draft BLs on an awarded agreement is blocked (superuser-only per #3072), so there's no "Delete SC" card.
  - the DD approve/decline UI (#3331); backend transitions (`PATCH /contract-modification-requests/<id>/`) and submitter-side alerts are in scope
  - creating a ProcurementAction or tracker for the mod (that screen is a placeholder in the designs)
- **Merge-conflict mitigation with OPS-6440** (SC add/delete, Santi-3rd):
  1. Keep changes additive. Don't restructure `ContractModificationEdit` or touch `_pending_query` / `_latest_per_budget_line_field`.
  2. Add new service methods rather than rewriting existing ones.
  3. Add the In Review tag to `ContractModificationEditCard` as a prop.
  4. Use one migration. Whoever merges second re-parents it (`db-migrations` skill).
  5. Don't add seed rows; adding one shifts the auto-assigned BLI IDs that E2E tests rely on. Edit existing rows in place.
  6. Agree with Santi-3rd on ownership and merge `main` after each 6440 PR. Never edit `3072-modified-loe-edit-budget-line.md`.
