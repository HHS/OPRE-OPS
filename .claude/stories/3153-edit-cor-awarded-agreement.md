---
issue: 3153
branch: OPS-3153/edit-cor-awarded
---

> **Status (2026-11-04):** Implemented on this branch (PR #6497). UX confirmed that a COR change does **not** need Division Director approval and only takes effect once the contract modification is approved, and supplied the modal copy (Figma node `38177-368057`). See [Implementation notes](#implementation-notes) for where the build differs from the draft below.

# Plan: #3153 — Edit the COR on an Awarded Agreement (admin contract mod)

> **UX change (2026-11-11), implemented in PR #6527 (#3269):** UX revised the rule after #6497 merged.
> - **Every COR change shows the modal**, including promoting the saved Alternate COR. This replaces the AC "User can change the COR to the Alternate COR without any approvals or modals".
> - **The change applies on save.** It no longer waits for the contract modification to be approved.
> - **The COR card stays on the Award & Modifications tab**, like a Modified LOE edit. It tracks that the contract still needs a modification.
>
> Revised decisions:
> - **D1:** the COR changes on save, with no approval.
> - **D2:** promoting the saved Alternate COR now shows the modal and is tracked too. The Alternate COR still clears automatically.
> - **D6 / D12:** one card per agreement shows the net change, from the COR on the contract to the current COR. A further change updates its To, and changing back to the COR on the contract removes it. The COR is locked while its card is in a contract modification that is in review (#3269).
> - **D10:** approving or declining the modification doesn't change the COR.
> - **D11:** Details always shows the current COR, which is now the new one.
>
> Other changes:
> - **History:** a COR change records the normal "Change to COR" entry. The "Change to COR Pending Contract Modification" entry is gone.
> - **Old data:** migration `6f1d2c3b4a59` applies cards recorded under the old rule, in dev and staging.
> - **Issue ACs:** the PO still needs to reword #3153's ACs to match.

## Context

Today `project_officer_id` (COR) can be changed freely on an awarded agreement, and nothing records that the signed contract no longer matches. Under #3153:

- Promoting the saved Alternate COR to COR stays free and applies immediately.
- Any other COR change is **recorded as a pending Admin Change**, with no Division Director (DD) approval. The COR in OPS doesn't change. The pending change shows on the Award & Modifications tab as an "Edit That Requires a Contract Modification", and the COR changes only when the contract modification is approved (#3269).

Most of the plumbing already exists from #3072, #6440 and #3268:
- the `ContractModificationEdit` table and the pending-edit list API
- the Award & Mods edit cards
- the `ENABLE_MODIFIED_LOE_EDITS` flag

Because there's no DD approval, this story does **not** need a change request, notifications, review UI, or approve/decline alerts.

Figma: node `15119-133789` ("Edit COR on an Awarded Agreement"). Its approval and alert screens are replaced by the UX decision above.

**Issue ACs affected by the UX decision.** These should be reworded on the issue (left for the PO):
- AC2: "see that their change will require a contract modification". This now means the modal and the card.
- AC3: the sent-to-approval, In Review, approved and declined alerts no longer apply. They're replaced by the normal save-success alert.
- AC4: the card appears on save, not after approval.

## Decisions (confirmed with user)

| # | Decision |
|---|---|
| D1 | **No DD approval.** A COR change to anyone other than the saved Alt COR leaves the COR unchanged. It records one pending `ContractModificationEdit` (`ADMIN_CHANGE`, field `project_officer_id`), and the COR changes when the #3269 mod is approved. |
| D2 | Changing the COR to the **saved** Alt COR is free and applies immediately. The form clears the Alt COR box, and the user can pick a new Alt COR in the same save. The backend clears `alternate_project_officer_id` only when the request leaves it unchanged. |
| D3 | The rule compares against the **saved** Alt COR, not the value in the form. Setting Alt COR = X and COR = X in one save still records a pending change. |
| D4 | **Superusers are treated like everyone else.** They get the modal and a pending card. |
| D5 | Alt COR edits (add, replace, remove) stay free and apply immediately. |
| D6 | **No lock.** The COR stays editable while a change is pending. A new target **replaces** the pending edit, so there is at most one pending COR card per agreement. Picking the person who is already the pending target does nothing. Locking once the edit is in a submitted mod is #3269 work. |
| D7 | Scope: **Contract and AA** agreements, the same as the Award & Mods tab, gated on `ENABLE_MODIFIED_LOE_EDITS`. |
| D8 | In a mixed save, the other fields apply immediately, the COR is recorded as pending, and the response is a normal 200. |
| D9 | Both entry points are covered: the Details "Edit" page (`PATCH /agreements`) and the Edit Agreement & Budget Lines bundle. |
| D10 | #3153 records the pending edit and shows the card. **Applying** the COR when the mod is approved, and including COR edits in Start Modification, belong to #3269. Until then, COR edits are excluded from Start Modification: they aren't submitted or attached, and they don't enable the Start button. |
| D11 | Agreement Details and the edit form always show the **current** COR. The pending target is visible only on the Award & Mods card. |
| D12 | If the saved Alt COR is promoted while a COR change is pending, the promotion applies now and **the card stays**. Its From is updated to the new current COR. If the promoted person **is** the pending target, the card is removed because nothing is left to change. |
| D13 | Withdrawing a pending COR change (without re-targeting it) is **not in #3153**. |
| D14 | Alerts: after saving, the usual agreement save-success alert appears and disappears after 6 seconds, like other agreement field edits. After that, the Award & Mods card is the only indicator. There is no persistent or global alert. |
| D15 | A confirmation modal appears before saving a COR change that will be recorded as pending, with the UX copy below. |

### Copy

- **Modal heading (UX, Figma `38177-368057`):** "This agreement has already been awarded and any changes will require a contract modification. Changes on Awarded Agreements will be tracked on the Award & Modifications Tab where you can take further action."
- **Modal buttons:** "Save Changes" / "Continue Editing" (the app's existing casing for the secondary link).
- **Success alert (6s):** the existing "Agreement Updated" alert, unchanged, as for other agreement field edits.
- **History title (not reviewed by UX):** "Change to COR Pending Contract Modification".
- **History message (not reviewed by UX):** "{user} requested a COR change from {old} to {new}. This agreement is awarded, so the COR will change once the contract modification is approved."

## Approach

### Backend

1. **Enum and migration.** Add `ModificationEditType.ADMIN_CHANGE` in `backend/models/contract_modification_edits.py`, and update the model docstring: rows are no longer only written when a DD approves. Use the `db-migrations` skill to generate one migration. It adds:
   - the `modificationedittype` value
   - a partial unique index allowing **one pending ADMIN_CHANGE `project_officer_id` row per agreement**: `(agreement_id) WHERE modification_type='ADMIN_CHANGE' AND field='project_officer_id' AND agreement_mod_id IS NULL`. This guards against double-click races.
   - The downgrade deletes ADMIN_CHANGE rows.

   The current head is `a73a897bb0db`. Follow `2026_10_20_1908-158fdbfa2907_add_contract_modification_edit.py`.

2. **Recording service.** In `ContractModificationEditService` (`ops_api/ops/services/contract_modification_edits.py`), add `record_project_officer_change(agreement, new_user_id, user)`:
   - Lock the agreement's pending ADMIN_CHANGE COR row with `with_for_update`.
   - If there is no row, insert one with:
     - `old_value` = the current `project_officer_id`, `new_value` = the target
     - `requested_by_id` = the user, `requested_on` = now
     - `change_request_id` and `approved_*` left NULL
   - If a row exists and its target is different, update `new_value`, `requested_by_id` and `requested_on` (D6).
   - If the target matches, do nothing.
   - Catch `IntegrityError` from the unique index and turn it into a 400.

   Also add `sync_pending_project_officer_change(agreement)` for D12. After a direct promotion it either updates the pending row's `old_value` to the new current COR, or deletes the row if the new current COR equals the target.

3. **Hook into agreement updates.** Change `AgreementsService.update` in `ops_api/ops/services/agreements.py` (around line 410):
   - Pull `project_officer_id` out the same way `awarding_entity_id` is pulled out (`:443-446`), and send it to a new `_handle_project_officer_change(...)` after the merge.
   - Gate: `agreement_tracks_contract_modifications(agreement)` (`utils/budget_line_items_helpers.py:23`), **and** Contract or AA (`_SUPPORTED_AGREEMENT_TYPES` in `services/agreement_award_history.py`), **and** the value is actually changing (`!=` the current COR, because PUTs always send the field). There's no superuser exemption (D4).
   - If the new value is the **saved** `alternate_project_officer_id`: apply it directly. If the request didn't change the Alt COR, also set it to None (D2). Then call `sync_pending_project_officer_change` (D12).
   - Otherwise: leave `project_officer_id` unchanged and call `record_project_officer_change`.
   - Outside the gate, behavior is unchanged.
   - Return the pending-change info so the resource can add it to the `UPDATE_AGREEMENT` event metadata, e.g. `meta.metadata["agreement_updates"]["pending_project_officer_change"] = {old, new}`.

4. **Edit bundle (D9).** `services/agreement_edit_bundle.py` goes through the same `AgreementsService.update` (`:218`, `commit=False`), so recording happens automatically. Add the pending-change info to the bundle's `agreement_updates` history metadata (`:234-241`).

5. **History (AC5).** In `models/agreement_history.py` `agreement_history_trigger_func`, inside the `UPDATE_AGREEMENT` case (`:168-200`), when `pending_project_officer_change` is present, add one `AgreementHistory` row with type `AGREEMENT_UPDATED` and the draft title and message. Use `get_project_officer_display_name` (`:1560`) for the label. No new history type or event type is needed.
   - Who, when and remote IP are already recorded on the `OpsEvent` by `OpsEventHandler` (`utils/events.py:19-75`).
   - The direct promotion and clear already produce "Change to COR" and "Change to Alternate COR" through the field diff (`:847-892`).

6. **List and schema.**
   - In `_latest_per_budget_line_field`, key agreement-level rows as `("agreement", field)`. Without this, COR rows would be keyed `("bli", None)`.
   - In `schemas/contract_modification_edits.py`, add old and new display names for `project_officer_id` rows, resolved from `User`. Update the docstring for `field`.

7. **#3269 boundary (D10).** In `services/contract_modification_requests.py`, filter `submit()` (`:68-123`) to `modification_type == MODIFIED_LOE`, so ADMIN_CHANGE rows stay pending and are never attached. `_approve`'s hardcoded `ModType.MODIFIED_LOE` stays correct.

8. **OpenAPI:** use `/sync-openapi` to document the edit-row `modification_type` value and the display-name fields.

### Frontend (`frontend/src`)

9. **Edit form.** In `AgreementEditForm.hooks.js`:
   - `changeSelectedProjectOfficer` (`:374`): when the selected user is the **saved** Alt COR on an awarded Contract or AA with the flag on, clear the Alt COR selection (D2).
   - Compute `requiresCorModification`: tracks contract modifications, and Contract or AA, and the COR changed from the saved value, and the new COR ≠ the saved Alt COR. There's no superuser exemption. Read `enable_modified_loe_edits` from the `useGetVersionQuery()` call that is already there (`:214`).
   - `handleContinue` (`:548-589`): when `requiresCorModification`, open the modal with the new `COR_CONTRACT_MODIFICATION_HEADING` constant (draft copy) in `helpers/agreement.helpers.js`, next to `CONTRACT_MODIFICATION_APPROVAL_HEADING` (`:500`).
   - `saveAgreement` (`:435-509`): keep the normal "Agreement Updated" alert with its 6-second auto-dismiss, and add the pending-COR sentence when `requiresCorModification` was true.
   - After saving, the form and Details show the current COR, which is unchanged (D11).
   - Report the state to the bundle page with an `onCorChangeStateChange` callback, modeled on `onProcurementShopChangeStateChange` (`:212-219`).

10. **Bundle page** (`pages/agreements/review/EditAgreementAndBudgetLines.jsx`):
    - Make `handlePageSave` (`:274-288`) show the COR modal when the COR state is set. If budget changes also need approval, show the COR modal first and then the existing flow; confirm the order during implementation.
    - `fireBundleSave` (`:201-235`) adds the pending-COR sentence to its "Changes Saved" alert.

11. **Award & Mods card:**
    - `ContractModificationEditCard.jsx`: add an Admin Change layout with "Requested by", the date, "Modification Type: Admin Change", "Change To: COR", and the From and To names, matching the Figma card.
    - Add entries to `helpers/utils.js` `changeToTypes` (`project_officer_id` → "COR") and `modificationEditType` (`ADMIN_CHANGE` → "Admin Change"), and to `renderChangeValues` (`helpers/changeRequests.helpers.js:23-62`).
    - Start Modification (D10):
      - `StartModification.jsx` and `StartModification.hooks.js` show and submit only MODIFIED_LOE edits.
      - In `ContractModificationEdits.jsx:125-131`, the Start button ignores ADMIN_CHANGE edits when deciding whether it is enabled.

### Seed data, story file and tests

12. **Seed data:** in `backend/data_tools/data/agreements_and_blin_data.json5`, give agreement 523 (the awarded contract with every LOE edit type) an Alt COR. Optionally seed one pending ADMIN_CHANGE row.

13. **Tests.** These are required because the change writes data and changes workflow state.
    - Backend service and integration tests (`tests/ops/...`, mirroring `test_contract_modification_edits*.py`):
      - Gate matrix: awarded or not, flag on or off, Contract, AA or Grant, superuser (still recorded), value unchanged on a PUT (no row).
      - The COR stays unchanged after a pending save, and exactly one ADMIN_CHANGE row exists.
      - Re-targeting updates the same row. Picking the same target does nothing.
      - A concurrent second insert → 400 from the unique index.
      - Promotion applies and clears the Alt COR, but keeps a new Alt COR set in the same request.
      - Alt COR = X plus COR = X in one save → pending row (D3).
      - D12: promotion while a change is pending updates `old_value`, and promoting the pending target removes the row.
      - Mixed save applies the other fields.
      - The bundle path records the row.
      - A history row exists, and the `OpsEvent` has `request.remote_addr`.
      - `submit()` leaves ADMIN_CHANGE rows pending.
      - The list API returns COR rows with display names.
    - Migration upgrade and downgrade round trip.
    - Frontend Vitest:
      - form hook: modal trigger matrix, Alt COR auto-clear, alert text
      - bundle page modal
      - edit card Admin Change layout
      - Start button and page excluding ADMIN_CHANGE
    - Cypress E2E on agreement 523:
      - promote the Alt COR → no modal, the COR is updated, Alt COR is empty
      - change the COR to another user → modal → success alert → Details still shows the old COR → Admin Change card on the Award & Mods tab
      - re-target → still one card with the new To
      - register the spec in the CI cypress config (precedent: `d167d1dcf`)

## Implementation notes

Where the build differs from, or adds to, the approach above:

- **Success alert:** kept as the standard "Agreement Updated" alert with no extra sentence (the user asked for the same behavior as other field edits).
- **Removing the COR** on a tracked agreement is rejected with a 400 ("The COR cannot be removed on an awarded agreement."). A pending card going "to nobody" has no meaning, and the form already requires a COR.
- **COR handling runs before the first commit** in `AgreementsService.update`, so a failed record (e.g. losing the unique-index race) rolls back the whole save, mixed fields included. The prep logic lives in `_prepare_project_officer_change` to keep `update()` under the flake8 complexity limit.
- **Bundle page, one modal:** a COR change alone shows the COR copy with "Save Changes". If the same save also has edits that need Division Director approval, the existing approval copy and "Send to Approval" take precedence (one confirmation, no stacking).
- **Bundle history:** the bundle now also records "Change to COR" and "Change to Alternate COR" from its field diff, not just the procurement shop.
- **Seed data:** agreement 523 already has an Alternate COR (Dave Director, 522), so no seed change was needed.
- **No Cypress spec:** the existing contract-mod spec skips when `ENABLE_MODIFIED_LOE_EDITS` is off, which it is in CI's E2E stack. There's also no API to withdraw a pending COR change (D13), so a spec couldn't clean up after itself. Backend integration tests (`tests/ops/agreement/test_cor_change_awarded.py`, 26 tests) and frontend unit tests cover the flow, and it was checked by hand in the running app.
- **Shared review follow-ups (PR #6497):**
  - A COR change to a user id that doesn't exist is rejected with a 400 ("The selected COR does not exist."). The pending edit stores the id in JSONB, so no foreign key would catch it.
  - The unsaved-changes dialog says the changes will be tracked as a contract modification when a COR change is pending (approval wording still wins when edits need approval).
  - If the user promotes the saved Alternate COR and then picks someone else as COR, the cleared Alternate COR is restored. A status message ("Alternate COR cleared because this person is now the COR. You can select a new Alternate COR.") announces the clear, and "Alternate COR {name} restored." announces the restore. Picking the promoted person twice still restores. The copy hasn't been reviewed by UX.
- **Pre-existing display bug found, not fixed:** `formatDateToMonthDayYear` parses the API's naive UTC timestamps as local time and then formats them in UTC, so edits saved after 4 PM Pacific show the next day's date on every Award & Mods card.

## Open items

- UX review of the history title and message.
- The PO should reword ACs 2–4 on #3153 to match the no-approval flow.

## Verification

- `cd backend/ops_api && pipenv run black --config ./pyproject.toml . && pipenv run nox -s lint && pipenv run pytest`.
- `cd frontend && bun run format && bun run lint --fix && bun run test --watch=false`.
- `./backend/validate_openapi.sh`.
- Manual: `podman compose up --build`, with `ENABLE_MODIFIED_LOE_EDITS=true`, on agreement 523:
  1. Promote the Alt COR. Expect no modal, the COR updated, and Alt COR empty.
  2. Change the COR to another user. Expect the modal, the success alert to disappear after about 6 seconds, Details to still show the old COR, and the card on the Award & Mods tab.
  3. Change the target again. Expect one card with the new To.
  4. Open Start Modification. The COR card must not appear there.
  5. Check that History shows the pending-change entry.
- Run `/visual-check` against the Figma card frame.
