---
issue: 3153
branch: OPS-3153/edit-cor-awarded
---

> **Status (2026-11-03):** Reviewed plan, pending team confirmation. Implementation not started.

# Plan: #3153 — Edit the COR on an Awarded Agreement (admin contract mod)

## Context

Today `project_officer_id` (COR) can be changed freely on an awarded agreement. No approval is needed and nothing records that the signed contract no longer matches. Under #3153:

- Promoting the saved Alternate COR to COR stays free.
- Any other COR change needs Division Director (DD) approval. Once approved, it is tracked on the Award & Modifications tab as an "Edit That Requires a Contract Modification" (an **Admin Change**) until #3269 starts the mod.

Most of the plumbing already exists from #3072, #6440 and #3268:
- `ContractModificationEdit` and the pending-edit list API
- the `requires_contract_modification` snapshot on change requests
- the `CONTRACT_MODIFICATION_APPROVAL_HEADING` modal copy
- the "Changes Sent to Approval / In Review / Approved / Declined" alerts
- `ENABLE_MODIFIED_LOE_EDITS`

This story adds a COR change request alongside those pieces.

Figma: node `15119-133789` ("Edit COR on an Awarded Agreement"). The #3153 part of the flow ends at the Award & Mods card. Everything after that is #3269.

## Decisions (confirmed with user)

| # | Decision |
|---|---|
| D1 | DD approval **applies the COR change in OPS immediately** and writes a `ContractModificationEdit`. This matches #3072's Decision 13. |
| D2 | When the COR is changed to the **saved** Alt COR, the change is free. The form clears the Alt COR box, and the user can pick a new Alt COR in the same save. The backend clears `alternate_project_officer_id` only when the request leaves it unchanged. |
| D3 | The rule compares against the **saved** Alt COR, not the value in the form. Setting Alt COR = X and COR = X in one save still needs approval. |
| D4 | Only **superusers** bypass the rule. Their change applies directly with no card. Budget Team is **not** exempt. |
| D5 | Alt COR edits (add, replace, remove) stay free. |
| D6 | While a COR request is In Review, **only the COR and Alt COR fields are locked**, in both the UI and the backend. Budget lines and other fields stay editable. |
| D7 | Scope: **Contract agreements only**, gated on the existing `ENABLE_MODIFIED_LOE_EDITS` flag. |
| D8 | In a mixed save, the other fields apply right away. The COR goes to a change request and the response is 202. This matches the procurement-shop flow. |
| D9 | Both entry points are covered: the Details "Edit" page (`PATCH /agreements`) and the Edit Agreement & Budget Lines bundle. |
| D10 | #3269 boundary: the COR card appears on the Award & Mods tab, but COR edits are **excluded from Start Modification**. They aren't submitted or attached, and they don't enable the Start button. All mod work stays in #3269. |

## Approach

### Backend

1. **Change request subtype.** In `backend/models/change_requests.py`, add `ProjectOfficerChangeRequest(AgreementChangeRequest)`.
   - It uses single-table inheritance like `ServicesComponentChangeRequest` and adds no new columns.
   - It gets a new `ChangeRequestType.PROJECT_OFFICER_CHANGE_REQUEST`.
   - Add an `in_review_filter()` that matches the exact type, plus `has_project_officer_change` and the `requires_contract_modification` snapshot hybrid. Copy both from the SC subtype at `:205-222`.
   - Update `to_dict`.
   - Add a partial unique index allowing **one COR request In Review per agreement**, like `ix_change_request_one_in_review_per_services_component`.
   - Why a subtype: `AgreementChangeRequest.in_review_filter()` and the BLI in-review queries (`models/budget_line_items.py:327-356`, `services/budget_line_items.py:1617-1680`) match the exact `AGREEMENT_CHANGE_REQUEST` type. A subtype therefore does **not** lock budget lines (D6). `Agreement.change_requests_in_review` (`models/agreements.py:455`) is polymorphic, so `agreement.in_review` still turns on the global "Changes In Review" alert.

2. **Enums and migration.** Add `ModificationEditType.ADMIN_CHANGE` in `models/contract_modification_edits.py`. Use the `db-migrations` skill to generate one migration. It adds:
   - the `changerequesttype` value
   - the `modificationedittype` value
   - the partial unique index

   The downgrade deletes rows that use the new values. Follow `2026_10_23_1456-39dc6a6e0303_add_services_component_change_request.py`. The current head is `a73a897bb0db`.

3. **Where the request is created.** Change `AgreementsService.update` in `ops_api/ops/services/agreements.py` (around line 410):
   - Pull `project_officer_id` out the same way `awarding_entity_id` is pulled out (`:443-446`).
   - Hand it to a new `_handle_project_officer_change(agreement, new_value, updated_fields, user, commit)` after the merge.
   - Gate: `agreement_tracks_contract_modifications(agreement)` (`utils/budget_line_items_helpers.py:23`), **and** Contract type, **and** not superuser, **and** the value is actually changing. Compare with the current value, because PUTs always send the field.
   - If the new value is the **saved** `alternate_project_officer_id`: apply it directly. If the request didn't change the Alt COR, also set `alternate_project_officer_id = None` (D2).
   - Otherwise: create a `ProjectOfficerChangeRequest` inside `OpsEventHandler(CREATE_CHANGE_REQUEST)`, using the `_handle_proc_shop_change` template (`:625-682`):
     - `requested_change_data={"project_officer_id": new}`
     - a `requested_change_diff` with the old and new values
     - `requested_change_info={"requires_contract_modification": True}`
   - Return 202 if either a COR request or a proc-shop request was created.
   - Outside the gate (not awarded, flag off, not a Contract, or superuser): behavior is unchanged.

4. **Server-side lock (D6).** Add a validation rule, e.g. `ProjectOfficerChangeInReviewRule`, to `AwardedAgreementValidator` (`validation/awarded_agreement_validator.py`). It rejects any change to `project_officer_id` or `alternate_project_officer_id` while a COR request is In Review. Superusers are exempt, as in `ImmutableAwardedFieldsRule`.
   - Expose the lock in `_meta` as `projectOfficerLockedMessage` (`resources/agreements.py:490-507`), next to `procurementShopLockedMessage`.
   - Message: "There are pending edits In Review for the COR. It cannot be edited until pending edits have been approved or declined."

5. **Edit bundle (D9).** `services/agreement_edit_bundle.py:218` currently discards the return value of `_agreements.update`. Capture the agreement-level change request id, add it to `result.change_request_ids`, and add it to `deferred_notifications`. This gives the bundle the 202 response and the DD notification. Also make sure COR field diffs reach history (`:234-241` only passes `awarding_entity_id` today).

6. **Review and apply** (`services/change_requests.py`):
   - Add the new type to `_AGREEMENT_REVIEWED_TYPES` (`:69-72`).
   - In `_handle_review_action`, the approve branch (`:278-287`) calls `ContractModificationEditService.create_from_approved_change_request` before `_apply_agreement_changes`. `update_agreement` already writes `project_officer_id`.
   - In `ContractModificationEditService.create_from_approved_change_request` (`services/contract_modification_edits.py:39-82`):
     - accept the new type
     - set `modification_type = ADMIN_CHANGE` for it (MODIFIED_LOE otherwise)
     - store `field="project_officer_id"` with old and new user ids
   - In `_latest_per_budget_line_field`, key agreement-level rows as `("agreement", field)` so that only the latest COR edit is shown.
   - In `schemas/contract_modification_edits.py`, add old and new display names for COR rows, resolved from `User`.
   - Update the `field` docstring.

7. **#3269 boundary (D10).** In `services/contract_modification_requests.py`, filter `submit()` (`:68-123`) to `modification_type == MODIFIED_LOE`. Admin rows then stay pending and are never attached. `_approve`'s hardcoded `ModType.MODIFIED_LOE` stays correct.

8. **Notifications and history:**
   - `utils/change_requests_helpers.py`:
     - add a `build_approve_url` branch with slug `cor-change`. Without it, notifying reviewers raises `ValueError`.
     - add a `build_review_outcome_title_and_message` branch: "COR Change Approved/Declined".
     - add the new type to `CHANGE_REQUEST_MODEL_MAP` and to the `find_in_review_requests_by_user` filter.
   - `models/agreement_history.py` `create_change_request_history_event` (`:466-641`): add a `project_officer_id` branch. Without it the shared return raises `UnboundLocalError`. Use the Figma copy:
     - "Change to COR In Review": "{requestor} requested a COR change from {old} to {new} and it's currently In Review for approval. This agreement is awarded and will require a contract modification in order to make changes to the contract."
     - "Change to COR Approved" and "Change to COR Declined": "{DD} approved/declined the COR change from {old} to {new} as requested by {requestor}. …"
   - Who, when and IP are already recorded on `OpsEvent` by `OpsEventHandler`. Nothing new is needed there.
   - The direct path (Alt COR promotion and clear) already produces "Change to COR" and "Change to Alternate COR" history through `UPDATE_AGREEMENT` (`agreement_history.py:847-892`).

9. **OpenAPI:** document the new change request type, `has_project_officer_change`, `_meta.projectOfficerLockedMessage`, and the edit-row fields with `/sync-openapi`.

### Frontend (`frontend/src`)

10. **Edit form:**
    - `ProjectOfficerComboBox.jsx`: add `isDisabled` and `tooltipMsg` props. The underlying `UI/Form/ComboBox` already supports both.
    - `AgreementEditForm.jsx` (`:681-705`): disable both COR boxes when `projectOfficerLockedMessage` is set, and use it as the tooltip.
    - `AgreementEditForm.hooks.js`:
      - `changeSelectedProjectOfficer` (`:374`): when the selected user equals the **saved** Alt COR on an awarded Contract with the flag on, clear the Alt COR selection (D2).
      - Compute `requiresCorApproval`: tracks contract modifications, and Contract, and not superuser, and the COR changed, and the new COR ≠ the saved Alt COR. Read `enable_modified_loe_edits` from the `useGetVersionQuery()` call that is already there (`:214`).
      - `handleContinue` (`:548-589`): when `requiresCorApproval`, open the modal with `CONTRACT_MODIFICATION_APPROVAL_HEADING` (`helpers/agreement.helpers.js:500`) and the "Send to Approval" / "Continue Editing" buttons.
      - `saveAgreement` (`:435-509`): on 202, show "Changes Sent to Approval" with "Pending Changes: COR: {old} to {new}" using a new `buildCorChangeAlert`, modeled on `buildProcurementShopChangeAlert` (`agreement.helpers.js:567-590`).
    - Report the state to the bundle page with an `onCorChangeStateChange` callback, modeled on `onProcurementShopChangeStateChange` (`:212-219`).

11. **Bundle page** (`pages/agreements/review/EditAgreementAndBudgetLines.jsx`):
    - Fold the COR state into `requiresApproval` and `requiresContractModification` (`:102-153`) so the shared modal (`:355-366`) shows the contract-mod heading.
    - `fireBundleSave` (`:201-235`) shows the COR pending alert.

12. **Global and outcome alerts:**
    - `pages/agreements/details/Agreement.jsx:116-166`: add "COR: {old} to {new}" to the "Changes In Review" pending list for in-review requests with `has_project_officer_change`.
    - `AgreementChangesResponseAlert.hooks.jsx` `formatChangeRequest` (`:85-148`): add a COR case for the Approved and Declined alerts, including the DD's notes.

13. **DD review:**
    - `ChangeRequests.constants.js`: add the COR type, the `cor-change` slug and `KEY_NAMES`.
    - `ChangeRequestsList.jsx:110-119`: add a `crCor` card. Without it the request disappears from the list silently.
    - Add a new `CorChangeReviewCard`, modeled on `ProcurementShopReviewCard.jsx`.
    - Add COR cases to `titleGenerator`, `ChangeRequests.hooks.js` (`:49-98`), `ApproveAgreement.hooks.js` (checkbox text, filtering, `relevantMessages`, modal and alert branches) and `ReviewChangeRequestAccordion.jsx`.
    - `AgreementMetaAccordion.jsx:230-244`: highlight the changed COR, as the procurement shop is highlighted at `:115-131`.

14. **Award & Mods card:**
    - `ContractModificationEditCard.jsx`: add an Admin Change layout with "Modification Type: Admin Change", "Change To: COR", and From and To names.
    - Add entries to `helpers/utils.js` `changeToTypes` and `modificationEditType`, and to `renderChangeValues` (`helpers/changeRequests.helpers.js:23-62`).
    - Start Modification (D10):
      - `StartModification.jsx` and `StartModification.hooks.js` show and submit only MODIFIED_LOE edits.
      - In `ContractModificationEdits.jsx:125-131`, the Start button ignores ADMIN_CHANGE edits when deciding whether it is enabled.

### Seed data, story file and tests

15. **Seed data:** in `backend/data_tools/data/agreements_and_blin_data.json5`, give agreement 523 (the awarded contract with every LOE edit type) an Alt COR, so both paths can be tested manually. Optionally seed one approved COR `contract_modification_edit` row.

16. **Story file:** add `.claude/stories/3153-edit-cor-awarded-agreement.md` from `.claude/templates/feature-story.md` with the decisions above. Branch: `OPS-3153/edit-cor-awarded`, created from `main`.

17. **Tests.** These are required: they cover workflow state, authorization and data writes.
    - Backend service and integration tests (`tests/ops/...`, mirroring `test_contract_modification_edits*.py`):
      - Gate matrix: awarded or not, flag on or off, Contract or AA, superuser or not, new COR equal to the saved Alt COR, value unchanged on a PUT.
      - Promotion clears the Alt COR, but keeps a new Alt COR set in the same request.
      - Alt COR = X plus COR = X in one save → change request (D3).
      - Mixed save applies the other fields and returns 202.
      - Lock rule rejects COR or Alt COR edits while a request is In Review.
      - A second In Review request → 400 from the unique index.
      - Budget lines stay editable while a COR request is pending.
      - Approval sets the COR and writes one ADMIN_CHANGE edit row. Decline writes no row and leaves the COR unchanged.
      - Bundle path returns `change_request_ids` and notifies the DD.
      - `submit()` leaves ADMIN_CHANGE rows pending.
      - History rows for created, approved and declined, with the `OpsEvent` holding `request.remote_addr`.
      - Notification URL and outcome title.
    - Migration upgrade and downgrade round trip.
    - Frontend Vitest:
      - form hook: modal trigger, Alt COR auto-clear, locked comboboxes
      - alert builders and `formatChangeRequest`
      - `ChangeRequestsList` COR card
      - edit card Admin Change layout
      - Start button and page excluding ADMIN_CHANGE
    - Cypress E2E: one spec on agreement 523 covering promotion with no modal; then change to another user → modal → Sent alert → DD approves → Approved alert → card on the Award & Mods tab. Register it in the CI cypress config. See `d167d1dcf` for the precedent.

## Verification

- `cd backend/ops_api && pipenv run black --config ./pyproject.toml . && pipenv run nox -s lint && pipenv run pytest`. Per memory, run with `SKIP=nox-lint` only if the venv drift issue appears.
- `cd frontend && bun run format && bun run lint --fix && bun run test --watch=false`.
- `./backend/validate_openapi.sh`.
- Manual: `podman compose up --build`, with `ENABLE_MODIFIED_LOE_EDITS=true`, on agreement 523:
  1. As the COR, promote the Alt COR. Expect no modal, an "Agreement Updated" alert, and an empty Alt COR.
  2. Change the COR to another user. Expect the modal, then "Changes Sent to Approval", the COR fields locked, and BLs still editable.
  3. As the DD, approve from the For Review list.
  4. Back as the COR, expect the Approved alert, the new COR, and the Admin Change card on the Award & Mods tab. The card must not appear on Start Modification.
  5. Repeat steps 2–3 with a decline and check the Declined alert and notes.
- Run `/visual-check` against the Figma frames for the alerts, modal and card. Then run the E2E spec.
