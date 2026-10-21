---
issue: 3072
branch: OPS-3072/modified-loe-amount-edit
---

# Feature Story: Modified LOE Contract Mod — Slice 1 (Edit Budget Line Amount on an Awarded Agreement)

## Story Overview

> **Revision (round 7): OBLIGATED BLIs are out of scope.** On the issue, jonnalley clarified the ACs apply to *Planned* BLs: "We wouldn't be modifying an obligated BL for what this story is trying to do." The OBLIGATED amount-edit carve-out (`is_modified_loe_amount_edit`, the OBLIGATED diffing branch, and its tests) has been removed; OBLIGATED BLIs stay non-editable. Everything below that describes editing OBLIGATED BLIs is superseded. Seeded agreement 523 keeps its 3 OBLIGATED BLIs (read-only) and its 1 PLANNED BLI is the one to edit.

**Ticket:** #3072 — "Edit a Budget Line or Services Component on an Awarded Agreement (modified LOE contract mod)"
**This document's scope:** The parent issue has 10 acceptance criteria. This is a **slice plan**, not a plan for the whole issue. It designs and plans **AC1 only** ("User can increase or decrease the amount of an existing budget line and see that their edit will require a contract modification") in full, then uses that design to sketch — but not fully plan — how **AC9** (Award & Modifications tab list) and **AC10** (event/history + remote IP) would extend it, since the user asked specifically to validate the approach against those two before committing to the other field-level ACs (CAN, Obligate By, add/delete BL, add/delete SC), which are expected to be near-identical repeats of the AC1 pattern (see [Generalizing](#generalizing-to-the-remaining-acceptance-criteria)).

**Revision (round 2):** A manual walkthrough of the Figma designs against the live app surfaced two additional, confirmed-missing pieces of behavior that this slice now also plans for, plus a test-data gap that was blocking manual verification of all of the above:
1. **The "Change BL Status" button guard** — the Figma shows this button disabled on an Awarded agreement when there are no Draft BLs left to transition (because Planned→Executing is supposed to require a contract modification on an Awarded agreement). Confirmed via direct code read: **this guard does not exist today** — neither the button's disabled state nor the Planned→Executing action itself accounts for `is_awarded` in any way. See [Current State: Status-Change Button Gap](#current-state-status-change-button-gap).
2. **A new "requires a contract modification" confirmation modal** — shown whenever a user tries to save an amount/CAN/date change, a new BL, a deleted BL, or an added/deleted Services Component on an agreement that `is_awarded`, before the edit is actually submitted. Confirmed via direct research: the exact reusable modal component and an almost-identical existing modal already live in this flow (`EditAgreementAndBudgetLines.jsx`) — this is a close clone, not new infrastructure. See [Current State: Modal Pattern & Save-Flow](#current-state-modal-pattern--save-flow-gap).
3. **A new seeded test agreement** — Awarded, fully populated, with exactly 3 OBLIGATED BLIs — so all of the above can be manually exercised without first having to walk a fresh agreement through the entire procurement tracker wizard. See [Test Data](#test-data-seeded-awarded-agreement-for-manual-testing).

**Revision (round 3) — AC9 backend pulled into scope:** AC9 ("All approved modified LOE changes are displayed on the Award & Modifications Tab as 'Edits That Require a Contract Modification' and they remain on that list until the user is ready to start the contract modification") is no longer just sketched — its **backend** is now planned in full. **No frontend for AC9 in this slice.** Reference design: `Agreements After Award/Modified LOE - Award & Modifications Tab.pdf` — under a "Contract Modifications" heading, an "Edits That Require a Contract Modification" list shows one card per approved edit (**Requested by** name + date, **Modification Type** "Modified Level of Effort", **BL ID**, **Change To** e.g. "Amount", **From** $600,000.00, **To** $500,000.00), followed by a **Start modification** button. Product framing: once the Division Director approves a modified-LOE edit, OPS must remember it as "pending a contract modification" and keep it there until the user presses Start Modification (#3268); approval does **not** itself start a modification. Two findings from this pass force a change to the round-1 design — see [Decision 2 (revised)](#key-decisions) and [AC9 — Backend Design](#ac9--award--modifications-tab-edits-that-require-a-contract-modification):
1. The shipped `requires_contract_modification` hybrid (`change_requests.py`, commit `6309018e7`) reads `agreement.is_awarded` **live**, so every pre-award CR on an agreement flips to `True` the moment the agreement is awarded. Harmless as a display hint, but wrong as the AC9 list predicate — it would pull years of pre-award approvals onto the list.
2. Approving a delete-BL CR deletes the BLI, and `change_request.budget_line_item_id` is `ON DELETE CASCADE` (`change_requests.py:98-100`) — the approved CR row itself disappears. A list derived purely from `ChangeRequest` rows can never show an approved "delete BL" edit (AC5), so AC9 needs its own durable record.

**Revision (round 5):** round 4 had switched Decision 13 to "approval does not change the BLI". The Figma annotation for this screen (quoted in [Decision 13](#key-decisions)) says the opposite: the change is made in OPS on approval, and the card tracks that the actual contract still needs a modification. Decision 13 is back to immediate apply, and the round-4-only pieces (pending-edit lock, `applied_on`, `apply_edits`) are removed.

**Revision (round 6):** a minimal "Start modification" endpoint, `POST /agreements/<id>/contract-modifications/`, moves into this slice as the starting point for #3268. It creates a bare `AgreementMod` and attaches the pending edits to it. See [Decision 18](#key-decisions).

**Precondition (from the issue):** #3267 is complete. A contract exists with 1+ BLs in **Obligated** status; there may also be 1+ BLs still in Draft or Planned status on the same (awarded) agreement.

## Background

### Current State

**A BLI's editability is governed by two independent gates today, both in `backend/ops_api/ops/utils/budget_line_items_helpers.py`:**

1. **Status allowlist** (`EDITABLE_STATUSES`, line 91) — `[DRAFT, PLANNED, IN_EXECUTION]`. `compute_bli_editable_status_only` (line 98) returns `False` for any BLI whose status is **OBLIGATED**, full stop, for every non-superuser. This is the categorical block AC1 needs to open: today there is no way for a regular user to edit an Obligated BLI's amount at all.
2. **Pre-award / post-pre-award locks** (`is_pre_award_in_review`, `is_post_pre_award_locked`, lines 199–325) — block edits to BLIs of *any* status while the agreement's pre-award approval is in review, and after it's fully approved **until** the Budget Team approves the Award request. Once the Award is approved, `is_post_pre_award_locked` **releases** (line 319-323: "Release the lock once the Budget Team approves the Award request... even if the AWARD step itself has not been completed"). So once an agreement is Awarded, gate 2 is already open — gate 1 (status allowlist) is the only thing still blocking OBLIGATED-BLI edits.

The write path (`BudgetLineItemService.update_with_change_request_ids`, `backend/ops_api/ops/services/budget_line_items.py:662`) runs `_validation` (line 1025), which calls `is_bli_editable` (the lock-free, status-only check) as the final fallback (line 1061-1062) — this is what actually rejects an OBLIGATED-BLI PATCH with `{"status": "Budget Line Item is not in an editable state."}` today.

**For statuses that ARE editable** (PLANNED, IN_EXECUTION), amount/CAN/date_needed changes already route through the existing Change Request workflow, not a direct write:
- `_handle_change_requests` (`budget_line_items.py:962`) detects changed keys in `BudgetLineItemChangeRequest.budget_field_names` (`["amount", "can_id", "date_needed"]`, `backend/models/change_requests.py:122`) and calls `ChangeRequestService.add_bli_change_requests` (`backend/ops_api/ops/services/change_requests.py:305`), which creates **one `BudgetLineItemChangeRequest` per changed field**, each carrying `requested_change_diff` (old/new values), `managing_division_id` (resolved from the BLI's CAN → Portfolio → Division), and a notification to that Division's director(s).
- Review/approval is handled by `ChangeRequestService.update` (`change_requests.py:76`) — a Division Director approves or rejects; on approval, `_apply_budget_line_item_changes` (`change_requests.py:414`) writes the field.
- Every CR create/update is wrapped in `OpsEventHandler` (`backend/ops_api/ops/utils/events.py:14`), which publishes `OpsEventType.CREATE_CHANGE_REQUEST` / `UPDATE_CHANGE_REQUEST`. A registered subscriber, `agreement_history_trigger_func` (`backend/models/agreement_history.py:84`), turns each event into a human-readable `AgreementHistory` row (e.g. `create_change_request_history_event`, line 393) — this is the "Agreement History" users see on the Agreement Details page today.
- **Remote IP is already captured for every one of these events, today, for free.** `OpsEventHandler.__enter__` (`events.py:19-27`) stores `"request.remote_addr": get_request_ip_address()` into `event.event_details` on every `OpsEvent` row. `get_request_ip_address()` (`backend/ops_api/ops/auth/utils.py:224-226`) honors `X-Forwarded-For` first, falling back to `request.remote_addr`. **Who** (`event.created_by`, set from `current_user.id` at `events.py:59`) and **when** (`OpsEvent.created_on`, inherited from `BaseModel`, `backend/models/base.py:100`) are likewise already captured automatically for every event — not something this story needs to add. See [Current State](#current-state-1) under the AC10 section for the one real gap (the IP sits on `OpsEvent.event_details`, not on the user-facing `AgreementHistory` row itself).

**Is-awarded is already a well-defined, reusable concept:** `Agreement.is_awarded` (`backend/models/agreements.py:572-581`) is `True` once the agreement has a `ProcurementAction` with `award_type == NEW_AWARD` and `status` in `{AWARDED, CERTIFIED}`. It is a plain Python `@property` (not a `hybrid_property`), so it can be read off a loaded `Agreement`/BLI's `.agreement` in Python but **cannot** be used inside a SQL `.where()` filter without a different query shape — relevant for the AC9 extension, which needs to filter in SQL (see [Generalizing](#generalizing-to-the-remaining-acceptance-criteria)).

**The Award & Modifications tab exists today** (`frontend/src/pages/agreements/details/AgreementAwardModifications.jsx`, backend `AgreementAwardHistoryService.get_award_history`, `backend/ops_api/ops/services/agreement_award_history.py:100`) and renders one accordion per Budget-Team-approved award/mod cycle. It has **no concept of pending/approved BLI-level edits** today — it only reflects `ProcurementAction`/`ProcurementTracker`/`AgreementMod` data, never `ChangeRequest` data.

**The issue's own definition of scope** (Additional Context): *"A modified LOE is anything that changes money or time on the awarded contract."* This is agreement-level, not BLI-status-level — the preconditions explicitly allow some BLIs on an awarded agreement to still be Draft/Planned. That phrasing is why this plan keys the new "requires a contract modification" determination off **`agreement.is_awarded`**, not off the edited BLI's own status (see [Decision 1](#key-decisions)).

### Current State: Status-Change Button Gap

Separate from the field-edit CR path above, BLIs also go through a **status-change** CR path — "Draft → Planned" and "Planned → Executing" — triggered by a different button/page: `AgreementBudgetLines.jsx`'s **"Change BL Status"** button (the Figma screenshot calls it "Request BL Status Change" — same control, label differs between design and code) → `/agreements/review/:id` (`ReviewAgreement.jsx`) → `AgreementActionAccordion.jsx` (`actionOptions.CHANGE_DRAFT_TO_PLANNED` / `CHANGE_PLANNED_TO_EXECUTING`) → the same `BudgetLineItemChangeRequest`/Division-Director pipeline (`has_status_change`, `change_requests.py:134-138`), just diffing `status` instead of `amount`/`can_id`/`date_needed`.

**Confirmed via direct code read (not yet in the original three research forks) — this entire path is unaware of `is_awarded`:**
- `AgreementBudgetLines.jsx:103` — `canRequestStatusChange = isAgreementEditable`, which checks team membership, permission, and the pre-award/award-review/lock states only. It does **not** check whether the agreement is awarded, and does **not** check whether any Draft BLI exists. In the exact scenario the Figma depicts (Awarded agreement, only Planned/Obligated BLs, zero Draft BLs), this button renders **enabled** today, not disabled.
- `AgreementActionAccordion.jsx:40`, wired from `ReviewAgreement.jsx:182` — `optionTwoDisabled={!anyBudgetLinePlanned}`. The "Change Planned Budget Lines to Executing Status" option is disabled only when there are zero Planned BLs — **never** when the agreement is awarded. A user can submit a Planned→Executing status-change CR on an already-Awarded agreement today, unobstructed.
- The only "awarded" acknowledgment anywhere nearby is plain informational copy in the Upload Documents accordion (`ReviewAgreement.jsx:321-322`): *"Please coordinate documents related to contract modifications via email until contract modifications have been developed in OPS."* — text, not a guard.
- The tooltip text the Figma shows ("Awarded agreements require a Contract Modification to execute Planned Budget Lines") does not exist anywhere in the frontend (confirmed via repo-wide grep for `"Contract Modification"`).

The Figma's own annotation states the intended rule plainly: *"For awarded agreements, the only BL Status Change that is possible would be Draft to Planned... In order to change a BL in Planned Status to Executing status, they will need to do a Contract Modification."* I.e., on an Awarded agreement, Planned→Executing is not merely "needs approval" (as it is today) — it needs to stop being offered as a status-change action at all, since the only path forward for it is the (not-yet-built, #3268) contract-modification flow.

### Current State: Modal Pattern & Save-Flow Gap

The reusable modal component this slice needs already exists — this is a close clone, not new infrastructure:
- `frontend/src/components/UI/Modals/ConfirmationModal.jsx` — generic two-button USWDS modal: `heading`, optional `description`, `setShowModal`, `actionButtonText`, `secondaryButtonText` (default `"Cancel"`), `handleConfirm`. Always invoked via a local `useState` boolean + conditional render; there is no shared modal context/hook in this codebase.
- **An almost line-for-line precedent already exists in this exact flow**: `EditAgreementAndBudgetLines.jsx` (~line 332-339) already shows a `ConfirmationModal` before saving budget-line edits that need Division-Director approval — `heading="Budget changes require approval from your Division Director. Do you want to send it to approval?"`, `actionButtonText="Send to Approval"`, `secondaryButtonText="Continue Editing"` — gated on a `requiresFinancialApproval` flag computed in `CreateBLIsAndSCs.hooks.js:913` (`!canEditDirectly && hasFinancialSnapshotChanges`) and threaded up via an `onFinancialChangeStateChange` callback prop. **This is the exact pattern to clone** for the new "requires a contract modification" modal — same component, same wiring shape, new trigger condition and new copy (see [Decision 9](#key-decisions)).
- `selectedAgreement.is_awarded` is already reachable inside `CreateBLIsAndSCs.hooks.js` with **zero new prop threading** — `selectedAgreement` is already a hook parameter; the only reason `isAgreementAwarded` isn't read there today is that nothing has needed it yet (today it's only used for `showClinColumn` in the parent component).
- **A real frontend gap, independent of the backend `EDITABLE_STATUSES` gate**: the existing amount/CAN/date diffing logic that produces `hasFinancialSnapshotChanges` (`CreateBLIsAndSCs.helpers.js:510-591`) only runs `when currentBudgetLine.status === PLANNED || EXECUTING` (line 583) — for any other status (including OBLIGATED), `tempChangeRequest`/`financialSnapshotChanged` are explicitly deleted (589-591). **This means even after the backend opens an OBLIGATED-amount edit path, the frontend's own diffing is blind to it** — a second, frontend-side fix is required, not just the backend carve-out (see [Decision 10](#key-decisions)).
- There is no existing single boolean for "any add/delete BL or add/delete SC happened" the way there is for amount/CAN/date edits — additions are detected by "no persisted `id` yet" on `tempBudgetLines`, deletions by non-empty `deleted_budget_line_items_ids`/`deleted_services_components_ids` (`useEditAgreement()`), and SC create/update has no diffing/flagging at all today (it always just proceeds). The new "requires a contract modification" condition needs to be assembled from these existing pieces, not read off one flag.

### Desired State

A user editing the **amount** of a BLI that is **OBLIGATED**, on an agreement that **`is_awarded`**, can submit that change. It:
1. Is **not** rejected outright by `_validation`/`is_bli_editable` the way it is today.
2. Flows through the **existing** `BudgetLineItemChangeRequest` / Division-Director-approval pipeline unchanged — same notification, same review UI, same approve/reject mechanics already built for PLANNED/IN_EXECUTION amount edits.
3. Is visibly marked, both to the submitter and the reviewer, as **"this edit will require a contract modification"** — because the agreement is awarded, independent of which specific BLI status triggered it.
4. Before that submission is sent, sees a confirmation modal — the same message regardless of which specific edit (amount, add BL, delete BL, add SC, delete SC) triggered it — explaining that the agreement is awarded, the change will require a contract modification, and asking whether to send it for Division Director approval now or keep editing.
5. On the Agreement's Budget Lines tab, sees the "Change BL Status" button correctly reflect that **Planned→Executing is no longer an available status-change action** once the agreement is awarded — disabled outright when there's nothing left to do (no Draft BLs), rather than silently allowing a Planned→Executing status change that today bypasses the "requires a contract modification" framing entirely.

No new approval role, no new review UI, no new notification mechanism for the amount-edit CR itself. The genuinely new things are: (a) opening the OBLIGATED-amount-specific edit path, (b) the "requires a contract modification" marker and its messaging, (c) the pre-submission confirmation modal, and (d) closing the Planned→Executing / "Change BL Status" button gap described above.

### User Story

As an OPRE COR, I want to increase or decrease the amount of an Obligated budget line on an awarded contract, and clearly see that doing so will require a contract modification, so that I understand the downstream consequence of the edit before (and after) I submit it for approval.

### Acceptance Criteria (this slice)

- [ ] ~~A COR (non-superuser) can submit an amount change on a BLI whose status is `OBLIGATED`, on an agreement where `agreement.is_awarded` is `True`.~~ *(Superseded, round 7: OBLIGATED BLIs stay non-editable; Modified LOE edits apply to Planned BLs.)*
- [ ] That submission creates a `BudgetLineItemChangeRequest` through the **existing** CR/Division-Director-approval pipeline (no bypass, no new approver).
- [ ] The CR (and the BLI amount edit UI, pre-submission) is marked as "requires a contract modification" whenever `agreement.is_awarded` is `True` at submission time — regardless of whether the specific BLI being edited is OBLIGATED, PLANNED, or IN_EXECUTION (per the issue's own "anything that changes money... on the awarded contract" framing). This is a deliberate widening from "only OBLIGATED BLIs" — see [Decision 1](#key-decisions).
- [ ] All other existing editability behavior (DRAFT direct-edit, PLANNED/IN_EXECUTION CR flow, pre-award locks, super-user bypass) is unchanged for every other case.
- [ ] New behavior is behind a feature flag, following the existing `SKIP_CR_FOR_DRAFT_PLANNED` pattern (env var → `/version` endpoint → frontend hook), off by default. See [Decision 5](#key-decisions).
- [ ] On an Awarded agreement with zero Draft BLIs, the "Change BL Status" button on `AgreementBudgetLines.jsx` is disabled with a tooltip explaining that executing a Planned BLI now requires a contract modification. On an Awarded agreement **with** a Draft BLI, the button remains enabled (Draft→Planned is still a valid, non-mod action).
- [ ] The "Change Planned Budget Lines to Executing Status" option is disabled on `AgreementActionAccordion.jsx` whenever the agreement is awarded, regardless of how many Planned BLIs exist — closing the gap where this status change bypasses contract-mod framing entirely today.
- [ ] Saving an amount/CAN/date edit, a new BL, a deleted BL, or an added/deleted Services Component on an Awarded agreement shows a confirmation modal (same message every time) before submission, offering "Send to approval" or "Continue editing."
- [ ] A new seeded Contract agreement exists — Awarded, fully populated, exactly 3 BLIs all in OBLIGATED status — so every behavior above can be manually exercised without first walking a fresh agreement through the procurement tracker wizard. See [Test Data](#test-data-seeded-awarded-agreement-for-manual-testing).
- [x] **(AC9, backend only)** `requires_contract_modification` is snapshotted onto the CR at **creation** time (`requested_change_info`), not derived live from `agreement.is_awarded` at read time. A CR created before the award keeps reading `False` after the agreement is awarded.
- [x] **(AC9, backend only)** When a Division Director **approves** a CR whose snapshot says `requires_contract_modification: true` (flag on), a durable `ContractModificationEdit` row is written in the same transaction. It captures requested-by, requested-on, modification type, BL ID, changed field, and from/to values, and it survives the BLI being deleted. Rejected and in-review CRs produce no row. Approval still applies the change to the BLI immediately, as it does today. The row is a reference that the signed contract still needs a mod (Decision 13, confirmed by the Figma annotation).
- [x] **(AC9, backend only)** `GET /agreements/<id>/contract-modification-edits/` returns every edit still **pending**, meaning not yet attached to a started modification (`agreement_mod_id IS NULL`), in the shape the PDF's card needs. Contract and AA agreements only, matching `/award-history/`.
- [x] **(AC9, backend only)** `POST /agreements/<id>/contract-modifications/` ("Start modification") creates a bare `AgreementMod` for the agreement and stamps every pending edit with its id in one transaction. That takes the edits off the list, and the response returns the new mod and its attached edits. This is deliberately minimal: it's the starting point #3268 extends with `ProcurementAction`/tracker creation (see [Decision 18](#key-decisions)).

## Technical Context

### Related Components

**Backend:**
- `backend/ops_api/ops/utils/budget_line_items_helpers.py` — `EDITABLE_STATUSES` (:91), `compute_bli_editable_status_only` (:98), `compute_bli_editable` (:122), `is_bli_editable` (:183), `is_post_pre_award_locked` (:276). This is where the OBLIGATED-amount-only carve-out gets added.
- `backend/ops_api/ops/services/budget_line_items.py` — `_validation` (:1025, the write-path rejection), `_handle_change_requests` (:962, the existing CR-creation call), `_has_non_status_change` (:761).
- `backend/models/change_requests.py` — `BudgetLineItemChangeRequest` (:97), `budget_field_names` (:122), `has_budget_change` hybrid property (:124) — the pattern to follow for the new `requires_contract_modification` hybrid property (see [Decision 1](#key-decisions)).
- `backend/ops_api/ops/services/change_requests.py` — `add_bli_change_requests` (:305, unchanged, just needs the new flag surfaced in its output / the CR's `to_dict()`), `_apply_budget_line_item_changes` (:414, unchanged).
- `backend/models/agreements.py` — `Agreement.is_awarded` (:572).
- `backend/ops_api/ops/environment/default_settings.py` (:97-99) and the per-environment `azure/{dev,stg,prod}.py` files — pattern for the new feature-flag env var.
- `backend/ops_api/ops/utils/version.py` (:37-50) — pattern for exposing the flag on `GET /version`.

**Frontend:**
- `frontend/src/components/BudgetLineItems/BudgetLinesTable/BLIRow.jsx` (:40, :59-60, :67) — reads `budgetLine._meta?.isEditable` / `isDeletable` and `useChangeRequestsForTooltip` for the lock tooltip; this is the pencil-icon gate that needs a parallel "amount-only, modified-LOE" affordance for OBLIGATED rows.
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` — the agreement-details BL table; reads `agreement?._meta.isEditable` for row-level edit gating (:94, :358, :394).
- `frontend/src/components/BudgetLineItems/BudgetLinesForm/BudgetLinesForm.jsx` — the shared create/edit form (amount, CAN, services component, date_needed fields). Needs investigation (not yet confirmed in this plan) into whether an Obligated-amount-only edit reuses this form with other fields disabled, or needs its own narrow "Edit Amount" affordance — **the issue's Figma file (linked in Additional Context) should be checked first**, since UX already explored this; see [Open Questions](#open-questions).
- `frontend/src/pages/agreements/review/ReviewAgreement.hooks.js`, `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js` — existing consumers of the `/version` flag pattern (`skip_cr_for_draft_planned`) to mirror for the new flag.
- `frontend/src/components/BudgetLineItems/BLIDiffTable/BLIDiffRow.jsx`, `frontend/src/components/BudgetLineItems/BLIReviewTable/BLIReviewRow.jsx` — existing CR diff-rendering components for the Division Director review screen; these should pick up the new "requires a contract modification" marker with minimal changes since they already render arbitrary CR diffs.
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` (:103-129) — `canRequestStatusChange`/`isAgreementEditable`/`toolTipLabel()`; needs a new `isAgreementAwarded`-and-`hasDraftBLI`-aware condition and a new tooltip case.
- `frontend/src/helpers/agreement.helpers.js` (:416-426) — `EDIT_DISABLED_TOOLTIPS`; needs a new entry for the awarded/no-draft-BLI case (exact Figma copy: "Awarded agreements require a Contract Modification to execute Planned Budget Lines").
- `frontend/src/components/Agreements/AgreementActionAccordion/AgreementActionAccordion.jsx`, `frontend/src/pages/agreements/review/ReviewAgreement.jsx` (:182) — `optionTwoDisabled={!anyBudgetLinePlanned}` needs an added `|| isAgreementAwarded` condition.
- `frontend/src/components/UI/Modals/ConfirmationModal.jsx` — the reusable modal component for the new "requires a contract modification" confirmation; no new modal component needed.
- `frontend/src/pages/agreements/review/EditAgreementAndBudgetLines.jsx` (~:332-339) — existing `ConfirmationModal` + `showFinancialApprovalModal` wiring to clone/extend for the new copy.
- `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.helpers.js` (:510-591) — `hasFinancialSnapshotChanges`/`financialSnapshotChanged` diffing, currently gated to `status === PLANNED || EXECUTING` only; needs widening so an awarded agreement's OBLIGATED-amount edit is visible to it too.
- `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js` (:100-115, :791-908, :913) — `useCreateBLIsAndSCs`'s save path; needs to read `selectedAgreement.is_awarded` and assemble the new broader "requires a contract modification" condition from the existing amount/CAN/date diff plus BL/SC add/delete state.
- `backend/data_tools/data/agreements_and_blin_data.json5` — new seed rows for the test agreement (see [Test Data](#test-data-seeded-awarded-agreement-for-manual-testing)).

### Dependencies

None external. AC1 needs no new tables. **The AC9 backend (round 3) needs one new table, `contract_modification_edit`, plus its Continuum `_version` table, so it needs one Alembic migration** (use the `db-migrations` skill). The `requires_contract_modification` snapshot needs no migration, because it lives in the existing `requested_change_info` JSONB column. See [AC9 — Backend Design](#ac9--award--modifications-tab-edits-that-require-a-contract-modification).

### Assumptions

- **Scope is Contract and AA agreements**, matching every other awarded-agreement feature in this codebase (`AgreementAwardHistoryService._SUPPORTED_AGREEMENT_TYPES`, `agreement_award_history.py:47`). Not yet confirmed against the issue/Figma; flagged in [Open Questions](#open-questions).
- Division-Director approval (the existing CR reviewer) is assumed to remain the correct approver for a modified-LOE amount change. The issue does not call for a different/additional approval step for this slice.
- Budget Team users are **not** exempt from the CR requirement for this edit (consistent with existing PLANNED/IN_EXECUTION amount-edit behavior — Budget Team is only exempt from the pre-award locks, per the comment at `budget_line_items.py:1040-1041`).
- Super users continue to bypass the CR workflow entirely for OBLIGATED-amount edits too (`is_super_user` check already short-circuits `_validation`/`existing_bypass` ahead of any new logic) — unchanged, not a new decision.

## Test Data: Seeded Awarded Agreement for Manual Testing

**Why this is its own task:** none of the above is easy to click through manually today. The 7 existing seeded `AWARDED` agreements (`backend/data_tools/data/agreements_and_blin_data.json5` — agreements 1, 2, 7, 8, 10, 4, 12) have **no `default_procurement_tracker`/`procurement_tracker_step` rows at all** — they satisfy `Agreement.is_awarded` via a bare `procurement_action` row only, so the Award & Modifications tab renders empty, not populated, for every one of them. Agreement 13 ("CONTRACT #13: Procurement Tracker Test Contract"), the richest existing tracker fixture, is **not actually Awarded** — its `procurement_action` status is `IN_PROCESS` and its AWARD step's `award_approval_status` is `null` (correcting an assumption carried over from the earlier OPS-5379 stories, which were referencing a Python pytest fixture of the same agreement ID, not this JSON5 seed row). There is currently no single seeded agreement that is both genuinely Awarded (tracker-wise) and has OBLIGATED BLIs ready to go.

**Plan:** add new rows to `backend/data_tools/data/agreements_and_blin_data.json5`:
- A new `contract_agreement` row, fully populated (name, description, PO#, task order#, contract#, `procurement_shop`, `project`, CLIN(s)) — mirror an existing fully-populated contract row for field coverage.
- A `procurement_action` row with `status: "AWARDED"`, `award_type: "NEW_AWARD"`.
- A `default_procurement_tracker` + `procurement_tracker_step` set mirroring agreement 13's shape, but — unlike agreement 13 — with the AWARD step's `award_approval_status: "APPROVED"` and populated `award_vendor_id`/`award_contract_number`/`award_amount`/`award_date`, so the agreement also exercises the Award & Modifications tab (useful for manually verifying AC9's extension later, not just AC1).
- Exactly **3** `contract_budget_line_item` rows, all `status: "OBLIGATED"`, each with a real `can_id` (reuse **CAN 504** — already exercised by two other Awarded/OBLIGATED seed BLIs, so its CAN→Portfolio→Division→Director chain is already proven to resolve for the existing CR/approval-flow tests built on this seed data), a real `services_component_id`, `proc_shop_fee_percentage` set, and `date_needed` inside the agreement's seeded performance period (seed data convention uses 2040s-era dates; no model-level constraint ties OBLIGATED to a past date).
- At least one `services_component` row the 3 BLIs reference, so the Services-Component add/delete half of this slice (and ACs 6/7 later) has something concrete to point at.

**Load process:** no migration needed (reusing existing tables/columns) — new JSON5 rows are picked up by the existing `scripts/import_test_data.sh` → `import_static_data/import_data.py` static-data loader on the next `docker compose up db data-import --build`. `backend/data_tools/src/backfill_procurement_tracker.py` is a separate repair/maintenance script for retrofitting real/legacy data — **not** the right tool for hand-authoring a new fixture; author the tracker/step rows directly in JSON5 instead, following agreement 13's existing shape as a template.

## Implementation Plan

### Approach

Add one narrowly-scoped allowance to the existing editability/CR pipeline, rather than widening `EDITABLE_STATUSES` itself (which would also quietly open CAN/date_needed/status edits and change delete-ability for OBLIGATED BLIs — out of scope for this slice, and a direct repeat of the `SKIP_CR_FOR_DRAFT_PLANNED` design pattern already used for the Draft→Planned carve-out at `_flagged_direct_edit`, `budget_line_items.py:784`).

Add a **derived** (not persisted) `requires_contract_modification` property to `BudgetLineItemChangeRequest`, mirroring `has_budget_change`/`has_status_change` (`change_requests.py:124-138`), computed from `self.agreement.is_awarded`. No new column, no migration, for this slice.

### Files to Create

- `backend/ops_api/tests/ops/services/test_modified_loe_bli_amount_edit.py` — new test file for the OBLIGATED-amount-edit allowance (unit + integration cases).
- No new frontend/backend production files for the button guard or modal — both reuse existing components (`ConfirmationModal`, `AgreementActionAccordion`, `EDIT_DISABLED_TOOLTIPS`) with new conditions/copy, not new ones.
- **(AC9)** `backend/models/contract_modification_edits.py`: the `ContractModificationEdit` model and the `ModificationEditType` enum. Export both from `backend/models/__init__.py`.
- **(AC9)** `backend/alembic/versions/<timestamp>_add_contract_modification_edit.py`: the new table plus its `_version` table (generate with the `db-migrations` skill, don't hand-write it).
- **(AC9)** `backend/ops_api/ops/services/contract_modification_edits.py`: `ContractModificationEditService` with `create_from_approved_change_request`, `get_pending_for_agreement`, `attach_pending_edits_to_mod`, and `start_modification`.
- **(AC9)** `backend/ops_api/ops/schemas/contract_modification_edits.py`: the response schema.
- **(AC9)** `backend/ops_api/ops/resources/contract_modification_edits.py`: `AgreementContractModificationEditsAPI` (GET, mirroring `resources/agreement_award_history.py`) and `AgreementContractModificationsAPI` (POST, Start modification).
- **(AC9)** `backend/ops_api/tests/ops/services/test_contract_modification_edits.py` and `backend/ops_api/tests/ops/agreements/test_agreement_contract_modification_edits_api.py` (match the existing test-directory layout).

### Files to Modify

- `backend/ops_api/ops/utils/budget_line_items_helpers.py`:
  - Add a new helper, e.g. `is_modified_loe_amount_edit(budget_line_item, edit_keys) -> bool`: `True` when `budget_line_item.status == BudgetLineItemStatus.OBLIGATED`, `budget_line_item.agreement.is_awarded`, the feature flag is on, and `edit_keys <= {"amount"}` (mirrors the existing `clin_only_edit` pattern at `budget_line_items.py:1055`).
  - `compute_bli_editable_status_only` / `is_bli_editable`: thread this new allowance through so the write-path check and the `_meta.isEditable` pen-icon meta stay in lockstep, matching the existing comment-driven contract between these two functions (lines 98-105, 183-196).
- `backend/ops_api/ops/services/budget_line_items.py` (`_validation`, :1061-1062): skip the `is_bli_editable` rejection when `is_modified_loe_amount_edit(...)` is true, falling through to the existing `_handle_change_requests` path unchanged.
- `backend/models/change_requests.py` (`BudgetLineItemChangeRequest`, after `has_delete_change` at :146): add the `requires_contract_modification` hybrid property (`self.agreement.is_awarded` — note: must dereference through `self.agreement`, the relationship already present at `AgreementChangeRequest.agreement`, :65-68) and its `.expression` counterpart for SQL use (needed by the AC9 extension later, not strictly by this slice, but cheap to add once).
- `backend/models/change_requests.py` (`BudgetLineItemChangeRequest.to_dict`, :148-154): include `requires_contract_modification` in the dict override, mirroring the existing `has_budget_change`/`has_status_change`/`has_delete_change` additions.
- `backend/ops_api/ops/environment/default_settings.py`, `azure/{dev,stg,prod}.py`: add the new flag (name TBD — see [Open Questions](#open-questions)), following the exact `SKIP_CR_FOR_DRAFT_PLANNED` pattern (:97-99 and sibling files).
- `backend/ops_api/ops/utils/version.py` (:44-49): add the new flag to the `/version` response.
- Frontend: `frontend/src/components/BudgetLineItems/BudgetLinesTable/BLIRow.jsx`, `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` — surface the new editability case and a "requires a contract modification" message/tooltip. Exact UI treatment TBD pending the Figma review noted in [Open Questions](#open-questions).
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` (:103, :113-129) — add an `isAgreementAwarded && !hasDraftBLI` condition to `canRequestStatusChange`, and a new `toolTipLabel()` case for it.
- `frontend/src/helpers/agreement.helpers.js` (:416-426) — add `EDIT_DISABLED_TOOLTIPS.awardedNoDraftBLIs` (exact name TBD) with the Figma's copy verbatim.
- `frontend/src/components/Agreements/AgreementActionAccordion/AgreementActionAccordion.jsx`, `frontend/src/pages/agreements/review/ReviewAgreement.jsx` (:182) — `optionTwoDisabled={!anyBudgetLinePlanned || isAgreementAwarded}`.
- `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.helpers.js` (:510-591) — stop deleting `tempChangeRequest`/`financialSnapshotChanged` for non-PLANNED/EXECUTING statuses when `agreement.is_awarded` is true, so an OBLIGATED-amount edit is visible to the diff.
- `frontend/src/components/BudgetLineItems/CreateBLIsAndSCs/CreateBLIsAndSCs.hooks.js` (:100-115, :791-908, :913) — read `selectedAgreement.is_awarded`; compute a new `requiresContractModification` condition = `is_awarded && (hasFinancialSnapshotChanges || any BL added/deleted || any SC added/deleted)`; surface it via the existing `onFinancialChangeStateChange`-style callback.
- `frontend/src/pages/agreements/review/EditAgreementAndBudgetLines.jsx` (~:332-339) — when `requiresContractModification` is true (vs. the existing `requiresFinancialApproval`), swap the `ConfirmationModal`'s `heading` to the new copy (see [Decision 9](#key-decisions)) while reusing the same modal/mechanism.
- `frontend/src/pages/agreements/details/AgreementBudgetLines.jsx` (:303-334, the inline `showEditWizard` branch that also hosts `CreateBLIsAndSCs`) — needs the same modal wiring as `EditAgreementAndBudgetLines.jsx`, since this is the second, independent place `CreateBLIsAndSCs` is embedded (and the one the Figma screenshot is actually from). Not just a copy-paste — see [Decision 11](#key-decisions).
- `backend/data_tools/data/agreements_and_blin_data.json5` — new `contract_agreement`, `procurement_action`, `contract_budget_line_item` ×3, `services_component`, `default_procurement_tracker`, `procurement_tracker_step` rows (see [Test Data](#test-data-seeded-awarded-agreement-for-manual-testing)).
- **(AC9)** `backend/ops_api/ops/services/change_requests.py`:
  - `add_bli_change_requests` (:369) and `add_bli_delete_change_request` (:406): add `"requires_contract_modification": bool(budget_line_item.agreement.is_awarded)` to `requested_change_info` ([Decision 2 revised](#key-decisions)).
  - `_handle_review_action` (:214-224): on `APPROVED` for a `BUDGET_LINE_ITEM_CHANGE_REQUEST` whose `requires_contract_modification` is true **and** `ENABLE_MODIFIED_LOE_EDITS` is on, call `ContractModificationEditService.create_from_approved_change_request(change_request)`. This must run **before** `update()` deletes the BLI (:118-123), while the CR and BLI still exist, so the row is in the same first commit. The row's `change_request_id` FK is `ON DELETE SET NULL`, so the later cascade delete of the CR doesn't take the edit row with it.
- **(AC9)** `backend/models/change_requests.py`: repoint the `requires_contract_modification` hybrid to the snapshot, and add its `.expression` (the docstring's "deferred to AC9" note gets resolved here).
- **(AC9)** `backend/ops_api/ops/urls.py` and `views.py`: register `GET /agreements/<int:id>/contract-modification-edits/` and `POST /agreements/<int:id>/contract-modifications/` next to `/award-history/` (`urls.py:304`, `views.py:146`).
- **(AC9)** `backend/models/events.py`: add `OpsEventType.START_CONTRACT_MODIFICATION`. It's a Postgres enum, so the new value goes into the same AC9 migration.
- **(AC9)** `backend/models/agreement_history.py` (`agreement_history_trigger_func`, :84): handle `START_CONTRACT_MODIFICATION` → one `AgreementHistory` row ("{user} started a contract modification including N edit(s)"). That covers AC10's who/when/what for this action; the IP is on the `OpsEvent` like every other event.
- **(AC9)** `backend/openapi.yml`: document the new endpoint and the `ContractModificationEdit` schema.
- **(AC9, optional)** `backend/data_tools/data/agreements_and_blin_data.json5`: seed one approved modified-LOE CR plus its `contract_modification_edit` row on the 3-OBLIGATED-BLI fixture, so the endpoint returns data straight away.

### Implementation Steps

0. **Seed data** — add the new fully-populated, Awarded, 3-OBLIGATED-BLI test agreement to `agreements_and_blin_data.json5` first (see [Test Data](#test-data-seeded-awarded-agreement-for-manual-testing)), so every later step has a concrete fixture to manually verify against as it's built, instead of only at the end.
1. **Backend flag plumbing** — add the new env-var flag, default-off, surfaced on `/version`, following `SKIP_CR_FOR_DRAFT_PLANNED` exactly.
2. **Backend editability allowance** — add `is_modified_loe_amount_edit`, wire it into `compute_bli_editable_status_only`/`is_bli_editable`/`compute_bli_editable`, and into `_validation`'s rejection check. Unit-test directly against the helper (status × is_awarded × flag × edit-keys matrix) before touching the write path.
3. **Backend "requires contract modification" marker** — add the hybrid property + `to_dict()` wiring on `BudgetLineItemChangeRequest`. Unit test: a CR on an awarded agreement reports `True`; a CR on a non-awarded agreement reports `False`; confirm it survives CR approval unchanged (the flag must still read `True` after `_apply_budget_line_item_changes` runs, since AC9 needs it to persist — see [Generalizing](#generalizing-to-the-remaining-acceptance-criteria)).
4. **Integration test** — full PATCH flow: OBLIGATED BLI + awarded agreement + flag on → 202 + CR created with `requires_contract_modification: true`; same PATCH with flag off → still rejected (regression-pins current behavior); PLANNED/IN_EXECUTION BLI on an awarded agreement → CR still created as today, now additionally carrying `requires_contract_modification: true` (this is the "widening" from [Decision 1](#key-decisions) — needs its own explicit test since it changes existing CR payloads, not just OBLIGATED).
5. **Change-BL-Status button guard** — add the `isAgreementAwarded && !hasDraftBLI` condition and new tooltip to `AgreementBudgetLines.jsx`; add `|| isAgreementAwarded` to `AgreementActionAccordion.jsx`'s `optionTwoDisabled`. Component tests for both: button disabled/enabled matrix (awarded × has-draft-BLI), and `optionTwoDisabled` true whenever `isAgreementAwarded`, independent of `anyBudgetLinePlanned`.
6. **Frontend diffing + modal** — widen `CreateBLIsAndSCs.helpers.js`'s financial-snapshot diffing to not drop OBLIGATED-status changes when the agreement is awarded; assemble the new `requiresContractModification` condition in `CreateBLIsAndSCs.hooks.js`; wire the new `ConfirmationModal` copy into both `EditAgreementAndBudgetLines.jsx` and the inline wizard in `AgreementBudgetLines.jsx`. Component tests: modal appears with the exact copy for each trigger (amount edit, add BL, delete BL, add SC, delete SC) on an awarded agreement, and does **not** appear for the same edits on a non-awarded agreement.
7. **Frontend** — after confirming the UI pattern against Figma (see [Open Questions](#open-questions)): wire the `/version` flag into the pencil-icon/edit-affordance gate for OBLIGATED rows, and surface the "requires a contract modification" messaging both pre-submission (on the edit form) and on the Division Director's review screen (`BLIDiffRow`/`BLIReviewRow`).
8. **Tests + manual verification** in `docker compose up --build` against the new seeded Awarded contract with 3 OBLIGATED BLIs — exercise the amount edit, the button guard, and the modal end-to-end on the same fixture.
9. **(AC9) Snapshot the marker at CR creation.** Write `requires_contract_modification` into `requested_change_info`, then repoint the hybrid and add its `.expression`. Regression test: create a CR on a non-awarded agreement, award the agreement, and the CR still reads `False`. That test fails against the current live-derived hybrid, which is the point.
10. **(AC9) Model + migration.** Add `ContractModificationEdit` and generate the migration with the `db-migrations` skill. Check the upgrade/downgrade round trip.
11. **(AC9) Write the row on approval.** Hook `create_from_approved_change_request` into `_handle_review_action`, before the BLI is mutated or deleted. Test approve-amount (the BLI is updated **and** a row exists), approve-delete (the row survives the BLI and CR deletes, and `change_request_id` becomes NULL), reject (no row), flag off (no row), and non-awarded (no row).
12. **(AC9) Read + attach.** Add `get_pending_for_agreement`, `attach_pending_edits_to_mod`, the GET endpoint, and the OpenAPI entry. Wire nothing in the frontend.
13. **(AC9) Start modification.** Add `start_modification`, the POST endpoint, the new event type and its history message, and the OpenAPI entry (Decision 18).

### Key Decisions

**Decision 1: What determines "requires a contract modification" — the edited BLI's own status, or the agreement's award state?**
- Option A: `budget_line_item.status == OBLIGATED` at submission time.
- Option B: `agreement.is_awarded` at submission time, independent of the specific BLI's status.
- **Chosen:** Option B. The issue's own Additional Context defines a modified LOE as "anything that changes money or time **on the awarded contract**" — agreement-scoped, not BLI-status-scoped — and the preconditions explicitly allow a mix of Obligated and Draft/Planned BLIs on the same awarded agreement. Option A would under-flag a PLANNED-BLI amount edit on an already-awarded agreement, which the issue's own framing says should still count. This also simplifies the hybrid property to a single relationship dereference (`self.agreement.is_awarded`) instead of a BLI-status check duplicated in two places.
- **Consequence worth flagging:** This means PLANNED/IN_EXECUTION amount CRs on an *already-awarded* agreement — which exist and work today with zero "contract mod" framing — will **start** carrying `requires_contract_modification: true` once this ships, even though nothing about *their* editability changes. That's a visible behavior change to an existing, already-shipped flow, not just new behavior for a newly-opened OBLIGATED path. Confirm this is desired before implementing (see [Open Questions](#open-questions)); if not, fall back to Option A, which only affects the new OBLIGATED path.

**Decision 2: Persist the flag on the CR, or derive it?**
- Option A: Add a new persisted boolean column on `BudgetLineItemChangeRequest`, written at creation time.
- Option B: A hybrid property derived from `self.agreement.is_awarded`, computed on read, no migration.
- ~~**Chosen:** Option B for this slice.~~ *(Superseded in round 3. Original reasoning kept for history:* "`agreement.is_awarded` cannot un-become true once set, so there's no risk of the derived value drifting after CR creation/approval.")
- **Revised (round 3): Option C, a snapshot stored in the existing `requested_change_info` JSONB. No new column and no migration.** The round-1 reasoning was wrong. "Is never un-awarded" only means the value can't flip back from `True` to `False`. It can still flip from `False` to `True`: a CR submitted and approved **before** the award reads `True` once the award lands, because the hybrid derives it live. That wrongly marks pre-award CRs as needing a contract mod, and AC9 can't tolerate it. Fix: `add_bli_change_requests` and `add_bli_delete_change_request` (`change_requests.py:369`, `:406`) already write `requested_change_info={"target_display_name": ...}`. Add `"requires_contract_modification": bool(agreement.is_awarded)` next to it. Repoint the hybrid's Python side to `bool((self.requested_change_info or {}).get("requires_contract_modification"))`, and add the `.expression` that round 1 deferred: `cls.requested_change_info["requires_contract_modification"].as_boolean().is_(True)`. CRs created before this ships have no key and read `False`, which is the correct fail-closed default.
- **What this does *not* solve, and why AC9 still gets its own table:** the "has this been pulled into a contract mod yet" state is mutable, and approved delete-BL CRs are cascade-deleted. See [Decision 12](#key-decisions).

**Decision 3: Widen `EDITABLE_STATUSES` to include OBLIGATED globally, or add a narrow, field-scoped carve-out?**
- Option A: Add `OBLIGATED` to `EDITABLE_STATUSES`.
- Option B: A dedicated `is_modified_loe_amount_edit` check, scoped to `{"amount"}`, consulted alongside (not instead of) the existing status allowlist.
- *(Superseded, round 7: neither. OBLIGATED BLIs are out of scope, so the Option B carve-out was removed.)*
- ~~**Chosen:** Option B.~~ Original reasoning: Option A would silently make OBLIGATED BLIs deletable too (`compute_bli_is_deletable` delegates straight to `compute_bli_editable`, `budget_line_items_helpers.py:167-180`) and would open CAN/date_needed/status edits before AC2/AC3 are designed. Mirrors the existing `SKIP_CR_FOR_DRAFT_PLANNED` precedent of a narrow, additive carve-out rather than a blanket status change.

**Decision 4: Should Division Director approval differ for a modified-LOE CR vs. a normal budget CR?**
- Option A: Same approver, same review screen, same mechanics — just an added visual marker.
- Option B: A new/different approval step specific to contract-mod-triggering changes.
- **Chosen:** Option A. Nothing in the issue's acceptance criteria calls for a different approver; AC8 ("alerts displayed as changes are sent to approval, in review, approved/declined") describes the same lifecycle the existing CR flow already has banners for.

**Decision 5: Feature flag mechanism.**
- Option A: New env-var flag, following `SKIP_CR_FOR_DRAFT_PLANNED` exactly (env var → `default_settings.py` → `/version` → frontend hook).
- Option B: A capability check embedded directly in code with no flag (ship it live immediately).
- **Chosen:** Option A — matches CLAUDE.md's "Feature flags/toggles created" Definition-of-Done item. Note: an adversarial review of this plan found that the precedent flag, `SKIP_CR_FOR_DRAFT_PLANNED`, is actually already `True` in **all three environments including prod** — so "gives staging a soak period" is aspirational framing, not a guarantee this flag will actually get one; the real value of Option A is the Definition-of-Done checkbox and an instant kill switch, not a proven staged rollout.

**Decision 6: Should Planned→Executing be blocked outright on an Awarded agreement, or routed through the new "requires a contract modification" modal/CR like the amount/CAN/date edits?**
- Option A: Disable the "Change Planned Budget Lines to Executing Status" option outright (`optionTwoDisabled={!anyBudgetLinePlanned || isAgreementAwarded}`) — the action simply isn't offered.
- Option B: Allow selecting it, but route it through the same new confirmation-modal + `requires_contract_modification`-flagged CR as the field edits.
- **Chosen:** Option A. The Figma's own annotation says plainly that this transition "will need to do a Contract Modification" — i.e. the intended replacement path is the not-yet-built #3268 flow, not a flagged status-change CR. There's nowhere for a flagged Planned→Executing CR to usefully go without #3268 existing, so blocking it (consistent with the issue's own framing that only Draft→Planned remains valid on an Awarded agreement) is simpler and matches the design intent exactly. Revisit if #3268 ships and product wants Planned→Executing offered-but-flagged instead of blocked.

**Decision 7: Does the Change-BL-Status button's disabled state depend on "any Draft BLI exists," or on something more specific (e.g. a Draft BLI the current user is permitted to act on)?**
- Option A: Simple existence check — `agreement.budget_line_items.some(bli => bli.status === DRAFT)`.
- Option B: A permission-aware check mirroring `canRegularUserEdit`'s existing team-membership logic.
- **Chosen:** Option A for this slice. The Figma's own comment frames the condition purely in terms of what statuses exist on the agreement ("this agreement does not have any Draft BLs"), not permissions — permission gating is already handled by the existing `isAgreementEditable`/`canRequestStatusChange` check this condition is additive to, so there's no case where Option B would produce a different disabled state than Option A combined with the existing gate.

**Decision 8: Should the new frontend diffing widening (Decision in [Modal Pattern & Save-Flow Gap](#current-state-modal-pattern--save-flow-gap)) touch the existing `hasFinancialSnapshotChanges` logic directly, or add a parallel, awarded-specific condition alongside it?**
- Option A: Modify `CreateBLIsAndSCs.helpers.js`'s existing diff function so it stops dropping non-PLANNED/EXECUTING statuses whenever `agreement.is_awarded` is true — one function, one new branch.
- Option B: Leave the existing function untouched (still PLANNED/EXECUTING-only) and add a second, separate "awarded-edit" diff path that only runs when `is_awarded`.
- **Chosen:** Option A. The existing function's PLANNED/EXECUTING gate exists because non-editable statuses (DRAFT direct-edit aside) can't normally be changed at all — once the backend opens an OBLIGATED-amount path (this slice's core change), the frontend's reason for excluding OBLIGATED from the diff no longer holds, so correcting the existing function is a bug fix for the new reality, not a new parallel system. Avoids two diffing implementations drifting apart over time.

**Decision 9: One modal with conditional copy, or two separate modals (existing Division-Director-approval modal vs. new contract-modification modal)?**
- Option A: Reuse the exact same `ConfirmationModal` call site in `EditAgreementAndBudgetLines.jsx` (and the inline wizard in `AgreementBudgetLines.jsx`), choosing the `heading` text based on `isAgreementAwarded` — awarded → the new contract-mod copy, not-awarded → the existing "Budget changes require approval from your Division Director..." copy.
- Option B: Two independent modal states/components, each with its own trigger flag.
- **Chosen:** Option A. Both modals share the identical mechanical shape (`ConfirmationModal`, `Send to Approval` / `Continue Editing`, send-on-confirm) and are mutually exclusive by construction (an edit is either on an awarded agreement or it isn't) — a second modal state would just be the same component rendered under a different condition, adding a maintenance seam with no behavioral benefit.

**Decision 10: Does the new modal's trigger condition subsume the existing `requiresFinancialApproval` check, or run alongside it?**
- Option A: `requiresFinancialApproval` and the new `requiresContractModification` are mutually exclusive branches of one decision (`isAgreementAwarded ? requiresContractModification : requiresFinancialApproval`), since an Awarded agreement's edits always need Division Director approval too (the new modal doesn't replace that pipeline, per [Decision 4](#key-decisions) — it's an *additional* framing on the same underlying CR).
- Option B: Independent flags that could both be true, requiring two sequential modals.
- **Chosen:** Option A. Per Decision 4, the modified-LOE edit still goes through the ordinary Division-Director CR pipeline — the new modal is a more specific framing of the *same* "needs approval" moment, not an additional approval gate stacked on top of it. Showing two modals back-to-back for the same underlying submission would be confusing and isn't what the Figma depicts (one modal, one decision point).

**Decision 11: Does the inline edit wizard inside `AgreementBudgetLines.jsx` (the actual host of the screenshot the Figma annotation is drawn from) need its own copy of this modal wiring, or can it be refactored to share `EditAgreementAndBudgetLines.jsx`'s?**
- Option A: Duplicate the modal state/wiring locally in `AgreementBudgetLines.jsx`'s `showEditWizard` branch, mirroring `EditAgreementAndBudgetLines.jsx`'s pattern.
- Option B: Extract the modal-triggering logic into a shared hook/component both pages import, as part of this slice.
- **Chosen:** Option A for this slice, flagged as tech debt. These two `CreateBLIsAndSCs` host sites are already independent, pre-existing call sites with no shared wrapper today — unifying them is a larger refactor than this slice's scope justifies, and duplicating ~10 lines of modal-state wiring twice is lower-risk than introducing a new shared abstraction under time pressure. Worth revisiting once ACs 2-7 land and this wiring needs to be touched a third/fourth time.

**Decision 12 (AC9): Where does the "Edits That Require a Contract Modification" list come from?**
- Option A: Query `BudgetLineItemChangeRequest` directly (`status == APPROVED AND requires_contract_modification`), and add a nullable `agreement_mod_id` column to `change_request` for the "already started" state.
- Option B: A new `ContractModificationEdit` table, one row written when a qualifying CR is **approved**, holding a self-contained snapshot of what the card displays, plus a nullable `agreement_mod_id`.
- **Chosen:** Option B. Option A has three problems that can't be fixed. (1) An approved delete-BL CR is cascade-deleted along with its BLI (`budget_line_item_id ... ondelete="CASCADE"`), so AC5's edits would vanish from the list right after approval, which is exactly when they should appear. (2) Services Component add/delete (AC6/AC7) has no `ChangeRequest` subtype, so a CR-only list could never show them, and Option B's table can take SC rows later without a schema change. (3) It overloads the CR table, which is a review-workflow record, with contract-mod lifecycle state. Option B also freezes the display values ("From $600,000.00 / To $500,000.00"), so later edits to the same BL don't rewrite history on the card. Cost: one table plus one migration.

**Decision 13 (AC9): Does Division Director approval still apply the change to the BLI immediately?**
- Option A: Yes. Approval writes the new amount to the BLI as it does today (`_apply_budget_line_item_changes`). The `ContractModificationEdit` row records that OPS now differs from the signed contract, and it waits there until a modification is started.
- Option B: No. Approval parks the change, and it is only applied to the BLI when "Start modification" runs.
- **Chosen (round 5, final): Option A, so approval applies the edit in OPS immediately, as it does today.** Round 4 briefly switched to Option B. The design's own Figma annotation (node `15119-128585`) settles it in favor of A:

  > *"After an edit requiring a mod is approved by the DD, card(s) will display to show what changed on the agreement since its been awarded, and what changes will require a contract modification in order to update the actual contract/award/document. The changes/edits requiring a mod are tracked here as a reference for the user because there might be a gap of time between when they make the change/edit in OPS and when they do the actual Contract Modification. In this scenario, the edit requiring a mod is the BL amount change from $600k to $500k which is known as a Modified Level of Effort."*

  Each card is "what changed on the agreement since it's been awarded," which is a change already made **in OPS**. What waits for the user is updating "the actual contract/award/document" through a Contract Modification (#3268), and the card exists because of the "gap of time" between the two. So OPS is the working record and leads the signed contract; it does not hold edits back to match it.
- **What this means for the approval path:** no fork. `_handle_review_action` applies or deletes the BLI exactly as it does today, and it **also** writes the `ContractModificationEdit` row, before the BLI is mutated and before the first commit (see [Hook point](#ac9--award--modifications-tab-edits-that-require-a-contract-modification)). Decision 4 ("no new approval mechanics") holds unchanged.
- *Round 4 history (superseded):* deferring the apply would have needed a pending-edit lock on the BLI (old Decision 16), an `applied_on` column, and an `apply_edits()` service for #3268 to call at mod time (old Decision 17). All three are dropped.

**Decision 14 (AC9): How does an edit leave the list?**
- Option A: Nullable `agreement_mod_id` FK → `agreement_mod.id`. Pending means `IS NULL`. A service method stamps every pending row for the agreement in one `UPDATE` when a mod is started.
- Option B: A status enum (`PENDING` / `IN_MODIFICATION` / ...).
- **Chosen:** Option A. `AgreementMod` already exists (`agreements.py:910`) and is what `ProcurementAction.agreement_mod_id` already points at, so #3268's "start" flow will almost certainly create one. The FK both answers "is it pending?" and records which mod absorbed the edit, and it powers the per-mod view in Award & Modification History later. This slice also ships a minimal POST endpoint that calls it ([Decision 18](#key-decisions)).

**Decision 18 (round 6): Ship a minimal "Start modification" endpoint now, or leave it all to #3268?**
- Option A: No endpoint. #3268 builds the trigger and the attach together.
- Option B: `POST /agreements/<id>/contract-modifications/` now. It creates a bare `AgreementMod` and attaches the pending edits, and #3268 extends the same endpoint and service.
- **Chosen:** Option B (user decision). It gives #3268 a working, tested starting point rather than a blank page, and it lets the full lifecycle (approve → card appears → start → card disappears) be exercised end to end now. **Kept minimal on purpose:** no `ProcurementAction`, no tracker, no mod number. Those depend on what the mod workflow looks like, which #3268 still has to design.
- **Safe to ship bare:** a lone `AgreementMod` has no visible side effects. Award & Modification History is built from `ProcurementAction` rows that have an approved tracker (`agreement_award_history.py:100-145`), and `procurement_tracker_events.py:288` only looks at actions. So an `AgreementMod` that nothing points at appears nowhere until #3268 links a `ProcurementAction` to it.
- **Fields on the bare mod:** `agreement_id` only. `mod_type`, `number` and `mod_date` stay NULL. None of the existing `ModType` values (`NEW`, `ADMIN`, `AMOUNT_TBD`, `AS_IS`, `REPLACEMENT_AMOUNT_FINAL`) is clearly "Modified LOE", and the mod number and date come from the executed mod, so #3268 fills them in.

**Decision 15 (AC9): One card per approved CR, or one card per (BL, field) netted to the latest value?**
- Option A: One row per approved CR. Two approved amount edits on the same BL produce two cards ($600k→$550k, then $550k→$500k).
- Option B: Collapse to one card per (BL, field), showing the first "from" and the latest "to".
- ~~**Chosen:** Option A, in storage **and** in the API.~~ *(Superseded: product clarified that only the last edit on a BL matters.)*
- **Chosen (revised):** Option A in **storage**, latest-only in the **API**. Every approved CR still writes its own row (audit trail), but `GET /agreements/<id>/contract-modification-edits/` returns only the latest pending edit per (BL, field), with that edit's own From/To. Product: "whatever the BL is recorded as currently is what will be included in the Contract Modification" — so editing BL 123458 $600k→$500k and then $500k→$100k lists one card, $500k→$100k. A deleted BL lists only its delete. Starting a modification attaches every pending row (superseded ones included); its response, event and history count report only the latest-per-(BL, field) edits, matching what the list showed. Display-only: the For Review / approve flow reads change requests, not these rows, so Division Director review is unchanged.
- **How this lines up with current multi-field behavior:** a single save that changes amount + CAN + Obligate By on one BL creates **three** CRs today, one per field (`add_bli_change_requests`, `change_requests.py:305-376`). They share `requestor_notes` but each has its own `requested_change_diff`. The backend reviews each CR on its own, but the Approve page approves or declines them as one batch: `ApproveAgreement.hooks.js:536` loops `reviewCR` over every in-review CR of that kind with `Promise.allSettled`, so partial success is possible in principle. One card per CR is therefore one card per field, which matches the PDF card's single "Change To: Amount" chip. Three fields on one BL produce three cards with the same Requested by, date, and BL ID.
- **Stacking edits on the same BL/field works:** because approval applies immediately, a second edit diffs against the already-updated value, so consecutive cards chain correctly ($600k→$550k, then $550k→$500k) and no extra lock is needed beyond today's in-review lock.

*Decisions 16 and 17 (round 4: pending-edit lock, and when to apply deferred edits) were withdrawn in round 5, because Decision 13 is back to immediate apply.*

## Testing Strategy

Per `docs/TESTING.md`: this is a single, bounded backend-validation change plus a derived property — unit-test the decision logic directly, integration-test the PATCH endpoint end-to-end, and a component test for the new frontend messaging. No BDD/Gherkin needed for this slice (not a multi-step business process by itself — AC8's full approve/decline lifecycle already has BDD coverage for the existing CR flow, which this slice doesn't change).

### Unit Tests
- [ ] `is_modified_loe_amount_edit`: full matrix — (status × is_awarded × flag × edit-keys-is-amount-only) → expected bool.
- [ ] `BudgetLineItemChangeRequest.requires_contract_modification`: `True` when `self.agreement.is_awarded`, `False` otherwise; survives serialization via `to_dict()`.
- [ ] `compute_bli_editable_status_only`/`compute_bli_editable`: OBLIGATED + is_awarded + flag-on + amount-only → `True`; OBLIGATED + any other field → still `False` (field-scoping is enforced, not just status).

### Integration Tests
- [ ] `PATCH /budget-line-items/<id>` on an OBLIGATED BLI, agreement is_awarded, flag on, amount-only body → `202`, one `BudgetLineItemChangeRequest` created, `requires_contract_modification: true` in its serialized form.
- [ ] Same request with the flag off → unchanged rejection (`400`, "not in an editable state") — regression pin.
- [ ] Same OBLIGATED BLI, flag on, but body includes `can_id` or `date_needed` alongside `amount` → rejected (field-scoping holds; CAN/date_needed aren't part of this slice).
- [ ] PLANNED or IN_EXECUTION BLI on an **awarded** agreement, amount-only edit → CR created as today, now with `requires_contract_modification: true` (pins [Decision 1](#key-decisions)'s widening).
- [ ] Same PLANNED/IN_EXECUTION case on a **non-awarded** agreement → CR created with `requires_contract_modification: false` (regression pin for the common, non-mod case).
- [ ] CR approval (`PATCH /change-requests/<id>` with `action: APPROVE`) on a modified-LOE CR → BLI amount updates, `requires_contract_modification` still reads `True` afterward (needed for the AC9 extension).

### AC9 Backend Tests
- [ ] **Snapshot regression:** a CR created on a non-awarded agreement, then the agreement is awarded → the CR still reads `requires_contract_modification: false`, both through `to_dict()` and through a SQL filter on the `.expression`.
- [ ] **Immediate apply (Decision 13):** approving an amount CR on an awarded agreement with the flag on updates the BLI amount **and** writes the edit row with the pre-approval `old_value`.
- [ ] **Multi-field save:** amount + CAN + Obligate By changed in one PATCH → 3 CRs; approving all 3 → 3 edit rows with the same `requested_by_id`/`requested_on`/`budget_line_item_id` and different `field`s.
- [ ] Two consecutive approved amount edits on the same BL → two stored rows, but the list shows only the latest ($500k→$100k). Edits to different fields on one BL each keep their latest card; a delete supersedes earlier edits on that BL.
- [ ] Approving an amount CR on an awarded agreement with the flag on writes exactly one `ContractModificationEdit`: `modification_type=MODIFIED_LOE`, `field="amount"`, `old_value`/`new_value` taken from `requested_change_diff`, `requested_by_id` = the CR's `created_by` (**not** the approving Division Director), `requested_on` = the CR's `created_on`, `agreement_mod_id IS NULL`.
- [ ] Approving a delete-BL CR: after `update()` returns, the BLI and the CR are both gone, but the edit row still exists with `budget_line_item_id` kept, `field="delete"`, and `change_request_id IS NULL`.
- [ ] No row for: a rejected CR, an in-review CR, a CR on a non-awarded agreement, flag off, a status-change CR (Planned→Executing is blocked on awarded agreements per Decision 6; Draft→Planned is not a modified LOE), or an agreement-level CR.
- [ ] `GET /agreements/<id>/contract-modification-edits/` returns 200 with only pending rows, oldest first. It returns 404 for an unknown agreement, 400 for a non-Contract/AA agreement (same as `/award-history/`), and 401/403 for unauthorized users.
- [ ] `attach_pending_edits_to_mod`: stamps every pending row for *that* agreement only, so the next GET returns `[]`. Rows already attached to an earlier mod are left alone. Calling it again with nothing pending is a no-op.
- [ ] `POST /agreements/<id>/contract-modifications/`: returns 201 with `{agreement_mod: {...}, edits: [...]}`. Afterwards one `AgreementMod` exists, every previously pending edit has its id, and GET returns `[]`. Award & Modification History is unchanged (no new accordion).
- [ ] POST → **400 when there are no pending edits**, and no `AgreementMod` is created. Also 400 when the agreement isn't awarded or isn't Contract/AA. 404 for an unknown agreement, 403 for a user not associated with the agreement, and 400 when `ENABLE_MODIFIED_LOE_EDITS` is off.
- [ ] Double submit: two POSTs back to back → the first is 201, the second is 400 ("no pending edits"), and only one `AgreementMod` exists.
- [ ] A `START_CONTRACT_MODIFICATION` `OpsEvent` is written (with `request.remote_addr`), and one `AgreementHistory` row names the user and the edit count.

### Frontend
- [ ] Component test: OBLIGATED-row pencil icon is enabled only when the `/version` flag is on (mock both states).
- [ ] Component test: edit form / review-screen diff row renders the "requires a contract modification" messaging when the CR's `requires_contract_modification` is `true`.
- [ ] Component test: `AgreementBudgetLines.jsx`'s "Change BL Status" button — disabled with the new tooltip when `isAgreementAwarded && !hasDraftBLI`; enabled when `isAgreementAwarded && hasDraftBLI`; existing non-awarded disabled/enabled cases unchanged.
- [ ] Component test: `AgreementActionAccordion.jsx`'s "Change Planned Budget Lines to Executing Status" option — disabled whenever `isAgreementAwarded`, including when `anyBudgetLinePlanned` is `true` (pins the closed gap).
- [ ] Component test: the new `ConfirmationModal` fires with the exact "already been awarded... requires a contract modification..." copy for each of: amount edit, add BL, delete BL, add SC, delete SC — on an awarded agreement, in both `EditAgreementAndBudgetLines.jsx` and the inline wizard in `AgreementBudgetLines.jsx`.
- [ ] Component test: the same edits on a **non-awarded** agreement show the existing "Budget changes require approval from your Division Director..." copy instead — regression pin for [Decision 9](#key-decisions)'s mutual exclusivity.
- [ ] Component test: `CreateBLIsAndSCs.helpers.js`'s diffing — an OBLIGATED BLI's amount edit on an awarded agreement now produces a non-empty `tempChangeRequest`/`financialSnapshotChanged`, where today it's silently dropped.

### Test Data Needed
- A seeded Awarded Contract agreement with at least one OBLIGATED BLI and at least one PLANNED or IN_EXECUTION BLI on the same agreement (matches the issue's own preconditions).
- A seeded non-awarded agreement with a PLANNED/IN_EXECUTION BLI, for the negative/regression case.
- The new fully-populated, Awarded, 3-OBLIGATED-BLI seeded agreement described in [Test Data](#test-data-seeded-awarded-agreement-for-manual-testing) — used for manual verification of the amount edit, the button guard, and the modal together on one fixture, and as a candidate fixture for the button-guard/modal component tests above if an existing MSW-mocked agreement fixture doesn't already cover the "awarded, zero Draft BLIs" shape.

## Validation

### Code Quality
```bash
cd backend/ops_api
pipenv run pytest tests/ops/services/test_modified_loe_bli_amount_edit.py tests/ops/services/test_change_requests.py tests/ops/services/test_contract_modification_edits.py tests/ops/agreements/test_agreement_contract_modification_edits_api.py
pipenv run black --config ./pyproject.toml .
pipenv run nox -s lint
cd ../../frontend && bun run test --watch=false && bun run lint
```

### Functional Validation
- [ ] Feature works end-to-end in `docker compose up --build` with the flag on; confirmed off by default.
- [ ] No regression to existing PLANNED/IN_EXECUTION amount-CR flow when the agreement is not awarded.
- [ ] `openapi.yml` updated if the CR response shape gains `requires_contract_modification` as a documented field (`/sync-openapi` skill).

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-------------|
| Decision 1's widening silently changes the payload of every existing PLANNED/IN_EXECUTION amount CR on an already-awarded agreement, surprising any code/UI that doesn't yet expect `requires_contract_modification` | Med | Med | Explicit regression tests pin both the "awarded" and "not awarded" cases for the pre-existing path; call out in the PR description, not just the OBLIGATED case |
| Opening OBLIGATED-amount edits could interact unexpectedly with `is_post_pre_award_locked`'s per-tracker scoping (a second, later procurement cycle on the same agreement) | Low | Low | Reuse `agreement.is_awarded` (agreement-wide) rather than re-deriving from a specific tracker; no new tracker-scoping logic introduced by this slice |
| Feature-flag drift between backend `_validation` and the frontend pencil-icon gate (one updated, the other not) causes a clickable-then-rejected or hidden-but-allowed state | Med | Low | Single source of truth pattern already established (`compute_bli_editable` feeds both the meta and the write path) — thread the new allowance through the same shared helper, not two separate checks |
| Two independent `CreateBLIsAndSCs` host sites (`EditAgreementAndBudgetLines.jsx` and the inline wizard in `AgreementBudgetLines.jsx`) mean the new modal wiring must be added twice ([Decision 11](#key-decisions)) — easy to update one and forget the other | Med | Med | Explicit test coverage for the modal in *both* host sites, not just one; call out both file paths in the PR description |
| Widening `CreateBLIsAndSCs.helpers.js`'s diffing to include OBLIGATED-status edits ([Decision 8](#key-decisions)) could also surface previously-dropped diffs for OBLIGATED BLIs in flows this slice doesn't intend to touch (e.g. if some other OBLIGATED-status field becomes editable in the UI later without an equivalent backend gate) | Low | Low | The backend's `_validation`/`is_bli_editable` remains the authoritative gate regardless of what the frontend diff computes — a wider frontend diff can at most show a confirmation modal, it cannot itself cause an unauthorized write |
| Blocking Planned→Executing outright ([Decision 6](#key-decisions)) removes a transition some awarded agreements may be relying on today in real (non-seeded) data, with no replacement path until #3268 ships | Med | Low | Matches the Figma's explicit design intent; flag in the PR description that this is a deliberate, temporary dead-end pending #3268, not an oversight |
| (AC9) The edit row is written in the wrong place in `ChangeRequestService.update()`'s delete ordering, so it is lost, or it trips the expunge/cascade sequence (`change_requests.py:105-123`) | High | Med | Write the row inside `_handle_review_action`, before the first commit; `change_request_id` uses `ON DELETE SET NULL`, never `CASCADE`; the explicit approve-delete integration test above |
| (AC9) Approved modified-LOE CRs created **after** award but **before** this ships have no snapshot key, so they never appear on the list | Low | Low | The flag is off in prod until this ships, so there should be none in prod. If there are, run a one-off backfill (any approved BLI CR whose `created_on` is later than the agreement's award date) rather than complicating the runtime logic |
| (AC9) The bare Start-modification endpoint gets used in prod before #3268 makes it meaningful: edits are cleared from the list, but no real mod workflow exists | Med | Low | It sits behind `ENABLE_MODIFIED_LOE_EDITS` (off in prod) and has no frontend button in this slice. The `AgreementMod` it creates is the same record #3268 will build on, so no data needs throwing away |
| (AC9) Concurrent Start clicks create two mods, one of them empty | Low | Low | `start_modification` locks the pending rows (`SELECT ... FOR UPDATE`) before creating the mod, and rejects the request when none are left |

## Generalizing to the Remaining Acceptance Criteria

### ACs 2–7 (CAN, Obligate By, add/delete BL, add/delete SC)

Expected to be **structurally identical** to this slice, not a new design:
- AC2 (CAN) / AC3 (Obligate By): same `is_modified_loe_amount_edit`-style helper, just widening its field allowlist from `{"amount"}` to also accept `{"can_id"}` / `{"date_needed"}` (the CR plumbing already treats all three identically via `budget_field_names` — nothing in `add_bli_change_requests` is amount-specific).
- AC4/AC5 (add/delete BLI): add/delete already have their own existing gates (`compute_bli_is_deletable`, the BLI-creation flow) and their own existing CR path for delete (`add_bli_delete_change_request`, `change_requests.py:380`) — same `requires_contract_modification` hybrid property applies unchanged, since it's agreement-scoped, not edit-type-scoped.
- AC6/AC7 (add/delete Services Component): `ServicesComponent` (`backend/models/services_components.py:25-100`) is a separate model with no `ChangeRequest` subtype today — `ServicesComponentService.create`/`delete` (`backend/ops_api/ops/services/services_component.py:69`, `:148`) have **no awarded-state or linked-BLI-status guard at all** currently (confirmed by direct review: `create()` only checks `associated_with_agreement`; `delete()` only checks `_sc_associated_with_agreement`). Deleting an SC today **orphans** linked BLIs via `ondelete="SET NULL"` (`backend/models/budget_line_items.py:89`) rather than cascading or blocking — so AC7 needs an explicit new decision (block the delete outright on an awarded agreement with linked Obligated BLIs? allow it but flag it as a modified LOE?) rather than inheriting one from existing behavior. There's no existing `ServicesComponentChangeRequest`, so this would likely need its own new `ChangeRequest` subtype (mirroring `BudgetLineItemChangeRequest`'s shape) rather than reusing `BudgetLineItemChangeRequest`. The closest existing precedent for an awarded-state guard is `AgreementsService._deletion_blocked_reason` (`backend/ops_api/ops/services/agreements.py:884-902`), which already special-cases `agreement.is_awarded` when deciding whether an *agreement* can be deleted — the same centralized-reason pattern (return a blocking reason string, or `None`) is a reasonable template for a new `ServicesComponentService._modification_blocked_reason`-style check, rather than inventing a new shape. This is enough to scope AC6/AC7 directionally, but — unlike ACs 2–5 — it is **not** a drop-in reuse of this slice's CR plumbing, and should get its own short design pass (new ChangeRequest subtype vs. simpler flag-and-allow) before implementation, not be assumed identical to AC1.

**Recommendation:** validate this slice (AC1) end-to-end first — including the Decision 1 widening — before writing a combined plan for ACs 2–7, since confirming Decision 1 and Decision 3's design against real review feedback will directly determine how much of ACs 2–7 is "just widen the allowlist" vs. "needs its own carve-out."

### AC9 — Award & Modifications tab: "Edits That Require a Contract Modification"

> **Round 3: backend now in scope, frontend still out.** This section was a sketch in rounds 1–2. It is now the plan of record for the AC9 backend. The round-1 sketch assumed the list could be a query over approved `BudgetLineItemChangeRequest` rows. That turned out wrong, for the two reasons in [Decision 12](#key-decisions): delete-BL CRs are cascade-deleted, and SC edits have no CR at all.

**Lifecycle (per the PDF and product framing):**

```
COR edits BL on awarded agreement
  → BudgetLineItemChangeRequest created, requested_change_info.requires_contract_modification = true   (snapshot, Decision 2 revised)
  → Division Director APPROVES
      → BLI updated in OPS as today                                                                   (Decision 13, confirmed by Figma)
      → ContractModificationEdit row written, agreement_mod_id = NULL   ← appears under "Edits That Require a Contract Modification"
  → … more approved edits accumulate (time gap before the real contract mod) …
  → POST /agreements/<id>/contract-modifications/   ("Start modification"; endpoint in this slice, button in #3268)
      → start_modification: creates bare AgreementMod, attach_pending_edits_to_mod(agreement_id, mod.id)   ← list empties
      → #3268 later extends this to also create ProcurementAction/tracker to update the actual contract/award/document
```

Rejected CRs never produce a row. In-review CRs don't show on this list; the existing "in review" banners and tooltips already cover them.

**Model: `ContractModificationEdit`** (`backend/models/contract_modification_edits.py`, table `contract_modification_edit`, inherits `BaseModel` so it gets `created_by`/`created_on` and Continuum versioning like everything else):

| Column | Type | Notes |
|---|---|---|
| `id` | PK | `BaseModel.get_pk_column()` |
| `agreement_id` | FK `agreement.id`, `ON DELETE CASCADE`, indexed, not null | Awarded agreements can't be deleted anyway (`_deletion_blocked_reason`); cascade only keeps test teardown clean |
| `modification_type` | `ENUM(ModificationEditType)`, not null | `MODIFIED_LOE` only for now. This is the "Modification Type" chip; it leaves room for future types without a migration-heavy redesign |
| `change_request_id` | FK `change_request.id`, **`ON DELETE SET NULL`**, nullable | Traceability back to the reviewed CR. **Must** be SET NULL, because the CR is cascade-deleted when a delete-BL CR is approved |
| `budget_line_item_id` | `Integer`, nullable, **no FK** | The "BL ID" chip. A plain int, so it survives the BLI's deletion (AC5). Nullable for the future SC-only rows (AC6/7) |
| `services_component_id` | `Integer`, nullable, no FK | Reserved for AC6/AC7, unused in this slice. Keep it out of this migration if review prefers not to add a column for future use |
| `field` | `String`, not null | The "Change To" chip: `"amount"`, `"can_id"`, `"date_needed"`, `"delete"` (later `"create"`, `"services_component"`). Taken from the CR's single `requested_change_data` key |
| `old_value` / `new_value` | `JSONB`, nullable | The "From"/"To" chips, copied from `requested_change_diff[field]["old"/"new"]`. A frozen snapshot, so later edits to the same BL don't rewrite this card |
| `requested_by_id` | FK `ops_user.id`, not null | The "Requested by" name = **the CR's `created_by`**. Do not rely on this row's own `BaseModel.created_by`, because that will be the approving Division Director (the row is inserted inside the DD's request) |
| `requested_on` | `DateTime`, not null | The CR's `created_on` (the date shown under "Requested by" in the PDF) |
| `approved_by_id` / `approved_on` | FK `ops_user.id` / `DateTime` | The CR's `reviewed_by_id` / `reviewed_on`. Not shown on the card, but cheap and useful for #3268 and audit |
| `agreement_mod_id` | FK `agreement_mod.id`, `ON DELETE SET NULL`, nullable, indexed | **NULL = pending** (shows on the list). Set by `attach_pending_edits_to_mod` ([Decision 14](#key-decisions)) |

Relationships: `agreement`, `requested_by` (`User`), `agreement_mod`. Add `ModificationEditType` to `models/__init__.py`.

**Service: `ContractModificationEditService`** (`ops_api/ops/services/contract_modification_edits.py`):
- `create_from_approved_change_request(change_request) -> ContractModificationEdit | None`: guard clauses (BLI CR type, `requires_contract_modification`, `ENABLE_MODIFIED_LOE_EDITS`, not a status change), then build the row from the CR and `db_session.add()` it. **It does not commit.** The caller's commit in `ChangeRequestService.update()` covers it, so the CR approval and the edit row succeed or fail together.
- `get_pending_for_agreement(agreement_id) -> list[ContractModificationEdit]`: rows with `agreement_mod_id IS NULL`, ordered by `requested_on, id`. Same 404/400 checks as `AgreementAwardHistoryService.get_award_history` (reuse `_SUPPORTED_AGREEMENT_TYPES`; import it rather than redefining it).
- `attach_pending_edits_to_mod(agreement_id, agreement_mod_id) -> int`: one bulk `UPDATE ... WHERE agreement_id = :a AND agreement_mod_id IS NULL`, returning the row count. Validate that the mod belongs to the agreement.
- `start_modification(agreement_id) -> tuple[AgreementMod, list[ContractModificationEdit]]`: run the same 404/400 checks as GET, plus `agreement.is_awarded`. Lock the pending rows (`SELECT ... FOR UPDATE`), raise `ValidationError` if there are none, then create `AgreementMod(agreement_id=...)`, `flush()`, `attach_pending_edits_to_mod`, and commit, all inside `OpsEventHandler(START_CONTRACT_MODIFICATION)` with `meta.metadata` = mod id and edit ids. **This is the extension point for #3268**: ProcurementAction and tracker creation go here, in the same transaction.

**Hook point:** `ChangeRequestService._handle_review_action` (`change_requests.py:214-224`), inside the `APPROVED` → `BUDGET_LINE_ITEM_CHANGE_REQUEST` branch. When `requires_contract_modification` and the flag are both set, write the edit row **before** `_apply_budget_line_item_changes` runs or `bli_to_delete` is set, then let the existing apply/delete logic continue unchanged (Decision 13). `old_value`/`new_value` come from the CR's `requested_change_diff`, not from a re-read BLI.

**API:** `GET /agreements/<int:id>/contract-modification-edits/` → `{"data": [ ... ]}`, matching `/award-history/`'s envelope. `@is_authorized(PermissionType.GET, Permission.AGREEMENT)`, the same as `AgreementAwardHistoryItemAPI`. Record shape (camel/snake case to follow the existing award-history schema's convention):

```json
{
  "id": 7,
  "modification_type": "MODIFIED_LOE",
  "budget_line_item_id": 123458,
  "field": "amount",
  "old_value": 600000.0,
  "new_value": 500000.0,
  "requested_by": {"id": 21, "full_name": "First Last Name"},
  "requested_on": "2024-12-01T14:03:00",
  "change_request_id": 512
}
```

**`POST /agreements/<int:id>/contract-modifications/`** ("Start modification", [Decision 18](#key-decisions)). No request body. `@is_authorized(PermissionType.POST, Permission.AGREEMENT)`, plus `associated_with_agreement(id)` (`agreements_helpers.py:60`), so only people on the agreement can start a mod, the same rule as other agreement-scoped writes. Returns `201`:

```json
{
  "agreement_mod": {"id": 41, "agreement_id": 15, "mod_type": null, "number": null, "mod_date": null},
  "edits": [ { "...same record shape as GET, now with agreement_mod_id: 41..." } ]
}
```

Errors: 400 for no pending edits, not awarded, not Contract/AA, or flag off; 403 for a user not associated with the agreement; 404 for an unknown agreement.

No frontend: the RTK Query endpoints, the card component, and the "Start modification" button are all deferred.

**Events / history (AC10 overlap):** no new `OpsEventType` is needed. The row is written inside the existing `UPDATE_CHANGE_REQUEST` `OpsEventHandler` scope, so who, when, and remote IP of the approval are already on that `OpsEvent`, and the requestor's who/when are on the row itself. Starting a modification gets its own new `START_CONTRACT_MODIFICATION` event and `AgreementHistory` message (see [Decision 18](#key-decisions)).

**Scope still open and carried forward:** which fields produce rows on day one. Rows come automatically from whatever CRs exist, so the answer is "amount now, plus CAN/date/delete as ACs 2–5 open those edits", with no AC9 code change needed per AC. AC4 (add BL) and AC6/AC7 (SC add/delete) don't go through a BLI CR today, so each of them adds its own `create_from_...` call when built.

### AC10 — Event/history records with who, when, what, and remote IP

**What's already true, and needs zero new code for the modified-LOE case specifically:** because this slice's amount edit flows through the *existing* `add_bli_change_requests` → `OpsEventHandler(CREATE_CHANGE_REQUEST)` → `agreement_history_trigger_func` pipeline unchanged, **who** (`OpsEvent.created_by` / `AgreementHistory` message text, which already names the acting user), **when** (`OpsEvent.created_on` / `AgreementHistory.timestamp`), and **what** (the existing `create_change_request_history_event` message text, `agreement_history.py:393`, already describes the field/old-value/new-value) are captured automatically, the same way they are for every other CR today. No new work.

**Remote IP is also already captured today** — `OpsEventHandler` writes `request.remote_addr`/`X-Forwarded-For` into `OpsEvent.event_details` for every event, including the ones this slice reuses (`events.py:19-27`, `auth/utils.py:224-226`). The only real gap: that IP lives on the **raw `OpsEvent` row** (`event_details` JSONB), reachable from an `AgreementHistory` row only by joining through `AgreementHistory.ops_event_id` — it is not denoted directly on the user-facing history record itself. If AC10 is read strictly ("history records... denoting... remote IP," not "the event records, which a history record happens to link to"), the fix is small and **uniform across every event type**, not specific to modified-LOE: add an `AgreementHistory.remote_addr` column, populated in `agreement_history_trigger_func` (`agreement_history.py:84`) from `event.event_details.get("request.remote_addr")` when each `AgreementHistory` row is built. Because every `AgreementHistory`-producing code path already goes through this one trigger function, this is a single, mechanical, one-place change — not something that needs to be re-solved per edit type (amount, CAN, add/delete BL, etc.) — but it is a schema change (new column + migration) and a decision about whether to backfill, both deliberately out of this slice's scope.

## Notes

### Open Questions

- [ ] **Decision 1's widening** — confirm with the team/product that a PLANNED/IN_EXECUTION amount CR on an already-awarded agreement *should* start reading as "requires a contract modification" today, not just newly-opened OBLIGATED edits. This has the biggest blast-radius-vs-design-cleanliness tradeoff in this plan.
- [ ] **UI pattern for the OBLIGATED-amount edit affordance** — reuse `BudgetLinesForm.jsx` with non-amount fields disabled, or a dedicated narrow "Edit Amount" control? The issue states Figma designs are already "Ready for Dev with necessary annotations" (linked in Additional Context) — check those before designing this in code.
- [ ] **Agreement-type scope** — Contract only, or Contract + AA (matching the Award & Modifications tab's existing scope)? Not stated in the issue; assumed Contract + AA for consistency with every other awarded-agreement feature, but not confirmed.
- [ ] **Exact feature-flag name** — placeholder reasoning uses `SKIP_CR_FOR_DRAFT_PLANNED`'s pattern; actual name TBD (e.g. `ENABLE_MODIFIED_LOE_EDITS`).
- [ ] **What happens to the agreement's `date_needed`/fiscal-year bookkeeping** when an Obligated BLI's amount changes — `_handle_award_approval` is noted elsewhere (OPS-5379 award-total-snapshot story, Future Improvements) to rewrite `date_needed` on IN_EXECUTION BLIs during award; worth confirming an OBLIGATED-amount-only edit doesn't interact with any similar award-time logic. Not investigated in this pass.
- [ ] **Exact seed-agreement number/name** for the new 3-OBLIGATED-BLI test fixture — TBD during implementation, following the existing `"CONTRACT #<N>: ..."` naming convention.
- [ ] **Should the new seed fixture's AWARD step be `award_approval_status: "APPROVED"` from the start** (so it also populates the Award & Modifications tab immediately), or left `null` like agreement 13 and only flipped later when AC9 is implemented? Leaning toward populating it now since it costs nothing extra and makes the fixture useful sooner, but not yet confirmed.
- [x] **(AC9) Decision 13: does approval apply the edit to the BLI right away?** Resolved (round 5): **yes**, per the Figma annotation on node `15119-128585` (quoted in Decision 13). The card is a reference for the gap between the OPS edit and the actual Contract Modification.
- [x] **(AC9) Who can see the list?** Resolved: normal agreement read permission (`PermissionType.GET, Permission.AGREEMENT`, same as `/award-history/`). Who may *start* a mod is #3268's call.
- [x] **(AC9) Netting (Decision 15):** Resolved (revised): store one row per approved CR, but list only the latest edit per (BL, field), shown as that edit's own From/To.
- [x] **(AC9) Ship a Start-modification endpoint now?** Resolved (round 6): **yes**. A minimal `POST /agreements/<id>/contract-modifications/` creates a bare `AgreementMod` and attaches the edits; #3268 extends it ([Decision 18](#key-decisions)).
- [ ] **(AC9) `ModType` for a modified-LOE mod:** add a new enum value, or reuse an existing one? Left NULL on the bare mod for now; #3268 decides.
- [ ] **Exact modal copy split between `heading` and `description`** — no existing modal in this codebase splits a message this long across both props (precedent always puts the whole block in `heading`); either approach works mechanically, this is a cosmetic choice for implementation to make.

### Future Improvements

- ~~A persisted "included in contract mod #N" marker (needed by AC9, deferred to #3268's implementation).~~ Now planned in this slice as `ContractModificationEdit.agreement_mod_id` (round 3). #3268 extends `start_modification` / `POST /agreements/<id>/contract-modifications/` (round 6) with `ProcurementAction` and tracker creation.
- AC9 frontend: the "Contract Modifications" section and "Edits That Require a Contract Modification" cards on `AgreementAwardModifications.jsx`, the RTK Query endpoint, and the "Start modification" button (wired to #3268).
- `AgreementHistory.remote_addr` (needed by a strict reading of AC10, deferred — see [AC10](#ac10--eventhistory-records-with-who-when-what-and-remote-ip)).
- Widening the field allowlist for ACs 2–7 once AC1 ships and is validated.
- Unify the two independent `CreateBLIsAndSCs` host sites (`EditAgreementAndBudgetLines.jsx` and `AgreementBudgetLines.jsx`'s inline wizard) behind one shared modal-triggering hook, instead of the duplicated wiring accepted in [Decision 11](#key-decisions).
- Revisit [Decision 6](#key-decisions) (blocking Planned→Executing outright) once #3268 ships, in case product wants it offered-but-flagged instead of blocked.

### References

- Issue: HHS/OPRE-OPS#3072
- Figma designs (linked in the issue's Additional Context, plus two screenshots reviewed directly in this planning session: the disabled "Request BL Status Change" button with its annotation, and the "already been awarded... requires a contract modification" confirmation modal) — consult the full Figma file before frontend implementation for any remaining visual detail not captured here.
- Related tab: [OPS-5379 Award & Modification History story](./OPS-5379-award-modification-history.md), [OPS-5379 Award Total Snapshot story](./OPS-5379-award-total-snapshot.md) — background on `agreement.is_awarded`, `ProcurementAction`, and the Award & Modifications tab's current data shape.
- Design PDF: `Agreements After Award/Modified LOE - Award & Modifications Tab.pdf` — "Contract Modifications" / "Edits That Require a Contract Modification" card + "Start modification" button (AC9 reference, round 3).
- `docs/TESTING.md` — test-type decision matrix.
- `backend/data_tools/CLAUDE.md` — seed/test-data load process.
