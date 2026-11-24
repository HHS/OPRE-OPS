---
issue: 6513
branch: OPS-6513/mod-procurement-tracker
---

# Procurement Tracker for a Contract Mod

## Story Overview

**Ticket:** [OPS-6513](https://github.com/HHS/OPRE-OPS/issues/6513)
**Title:** Give each approved contract modification its own Procurement Tracker
**Status:** Planning. The open questions below must be answered before implementation.

## Background

### Current State
- The Division Director approves a contract mod in `ContractModificationRequestService._approve` (`backend/ops_api/ops/services/contract_modification_requests.py:218`). Approval:
  - creates an `AgreementMod`, with `mod_type` set to AS_IS, ADMIN or MODIFIED_LOE by `mod_type()` at L356, and **`number` left unset**;
  - attaches the edits;
  - sets the request's BLIs to IN_EXECUTION directly;
  - creates **no ProcurementAction and no tracker**. The submitter's notification already says "the procurement process has started" (L322).
- The live tracker trigger (`backend/ops_api/ops/events/procurement_tracker_events.py:66`) skips awarded agreements, so an awarded agreement never gets a second tracker.
- The data model already supports one tracker per mod:
  - Agreement → many `ProcurementAction`s → one tracker each.
  - `ProcurementAction.agreement_mod_id` and `AwardType.MODIFICATION` already exist.
  - `ProcurementTrackerStepStatus.SKIPPED` exists but nothing uses it.
- `get_or_create_procurement_records_for_modification` (`backend/models/procurement_workflow.py:411`) is used only by data_tools. It does not set `agreement_mod_id`, and it reuses any open MODIFICATION action. Both behaviours are wrong for a per-mod tracker.
- Several step-service paths are NEW_AWARD-only:
  - `_advance_active_step_if_needed` (`backend/ops_api/ops/services/procurement_tracker_steps.py:395`)
  - `_handle_award_approval` (L1146), which also obligates **every** IN_EXECUTION BLI on the agreement.

  So a mod action would never become AWARDED or get a `date_awarded_obligated`.
- The Award & Modification History (`backend/ops_api/ops/services/agreement_award_history.py:164`) adds one entry per ProcurementAction whose AWARD step the Budget Team has **approved**. It does not wait for the tracker to be COMPLETED. An entry counts as a mod when `action.agreement_mod_id` is set, and its label uses `AgreementMod.number`.
- The frontend Procurement Tracker tab (`frontend/src/pages/agreements/details/AgreementProcurementTracker.jsx:93`) picks `trackers.find(ACTIVE) || trackers.find(COMPLETED)`, in no defined order. The same "first ACTIVE" pick is repeated in:
  - `Agreement.jsx:243`
  - `RequestAwardApproval.hooks.js:92`
  - `EditAwardApproval.hooks.js:130`
  - `usePreAwardApprovalData.js:80`

  The tab also hardcodes 6 steps and treats step 6 as the last one.

### Desired State
- Approving a contract mod creates a MODIFICATION ProcurementAction linked to the new `AgreementMod`, plus a fresh tracker.
- An As-Is mod's tracker needs only steps 1, 5 and 6. Every other mod needs all 6.
- The Procurement Tracker tab shows the most recent tracker, which belongs to the most recent mod.
- Declining a mod changes nothing.
- When a mod's tracker reaches award, it adds a mod entry to the Award & Modification History.

### Acceptance Criteria (from issue)
- [ ] Users can see and update procurement/award info in the Procurement Tracker as an awarded agreement's active mod proceeds
- [ ] An "As is" mod requires only steps 1, 5, 6
- [ ] Other mod types and combinations require all steps
- [ ] The Procurement Tracker tab defaults to the most recent modification's tracker
- [ ] The tracker is triggered when the Division Director approves the mod
- [ ] If the Division Director rejects it, the tracker is unchanged (it still shows the most recent one)
- [ ] A completed tracker adds an entry to the Award & Modification History

## Implementation Plan

### Backend

1. **Create the tracker on approval.**
   - Add `create_procurement_records_for_contract_mod(session, agreement, agreement_mod, mod_type, created_by)` to `procurement_workflow.py`.
   - It **always creates** a new MODIFICATION action, with `agreement_mod_id` set, and a new tracker. It never reuses an existing one.
   - Call it from `_approve`, inside the existing all-or-nothing transaction.
   - Leave the data_tools helper alone, or fix its `agreement_mod_id` gap separately.
2. **Step shape by mod type.**
   - `create_with_steps` gains a `skipped_step_types` argument.
   - For AS_IS, steps 2–4 are created with status SKIPPED (decided).
   - `_advance_active_step_if_needed` jumps past SKIPPED steps (1 → 5).
   - `Step4CompletionRequiredForApprovalRequestRule` (`backend/ops_api/ops/validation/rules/procurement_tracker_step.py:660`) accepts COMPLETED **or SKIPPED**.
   - PATCH must reject updates to a SKIPPED step.
3. **Award for mods.**
   - Lift the NEW_AWARD-only gates so a MODIFICATION action also gets `date_awarded_obligated` and AWARDED.
   - Limit the IN_EXECUTION→OBLIGATED transition to the mod's own BLIs (`ContractModificationRequest.budget_line_items`, reached via the action's `agreement_mod_id`).
   - On award approval, copy step 6 `award_modification_number` to `AgreementMod.number`.
4. **Tracker API.**
   - Order `ProcurementTrackerService.get_list` newest first, by `created_on desc, id desc`.
   - Add these fields to `ProcurementTrackerResponseSchema`: `award_type`, `agreement_mod_id`, `mod_type`, `mod_number`, `created_on`, and the mod's `budget_line_item_ids`.

   These are enough for the default selection now and for a dropdown later.
5. **Single-tracker assumptions.** Review `is_post_pre_award_locked` and `is_award_approval_requested` (`backend/ops_api/ops/utils/budget_line_items_helpers.py:285,318`). They must key off the **current** tracker, not any ACTIVE one, and decide whether a mod's step-5 lock should lock the whole agreement's BLIs.
6. **No migration expected**: the columns and enum values already exist. Use the db-migrations skill if a uniqueness constraint on `procurement_action.agreement_mod_id` is wanted.

### Frontend

1. Add a shared helper, `getCurrentProcurementTracker(trackers)`, that returns the newest tracker. Use it in the tab and in the 4 other "first ACTIVE" spots.
2. Make `AgreementProcurementTracker.jsx` derive its step list and final step from `tracker.steps`, not from hardcoded `WIZARD_STEPS` and `6`. How SKIPPED steps look **needs a UX design** (the issue's UX task); until then, build only the data and state wiring.
3. Steps 5 and 6 get the mod's BLIs, not every BLI on the agreement.
4. Show which mod the tracker is for (e.g. "Mod 2 – As Is") only once there is a design.

### Future (noted, not in scope)
- **Tracker selector dropdown**, like the FY select (`frontend/src/components/UI/FiscalYear/FiscalYear.jsx`), for switching between an agreement's trackers.
  - The selection state would live in `AgreementProcurementTracker.jsx`, defaulting to `getCurrentProcurementTracker`.
  - The schema fields from backend step 4 are enough for its option labels.
- Fix the data_tools `get_or_create_procurement_records_for_modification` gaps.

## Testing Strategy
Follow `docs/TESTING.md`. This change touches workflow state, data writes and money-adjacent status transitions, so tests are required.
- Backend service tests (`test_contract_modification_requests.py`):
  - approval creates the action and tracker, with `agreement_mod_id` linked;
  - AS_IS has 2–4 SKIPPED, ADMIN and MODIFIED_LOE have all 6 active-able;
  - decline creates nothing;
  - a failed approval rolls everything back.
- Step-service tests:
  - 1 → 5 skip;
  - the step-4 rule passes when step 4 is SKIPPED;
  - PATCHing a SKIPPED step is rejected;
  - mod award obligates only the mod's BLIs and marks the action AWARDED.
- Award-history tests: a mod entry appears with the right label once the mod's award is approved.
- Frontend Vitest: tracker selection picks the newest; the tab renders from `tracker.steps`.

## Progress (2026-11-20)
Backend steps 1–4 are implemented on this branch, with tests (`backend/ops_api/tests/ops/agreement/test_contract_mod_procurement_tracker.py`).
- `create_procurement_records_for_contract_mod` (`backend/models/procurement_workflow.py`) is called from `ContractModificationRequestService._approve`.
- `create_with_steps(skipped_step_types=...)` creates steps 2–4 as SKIPPED for an As-Is mod.
- Step advance jumps past SKIPPED steps. A SKIPPED step can't be updated, and a skipped step 4 satisfies the pre-award request rule.
- A contract mod's award obligates only its own budget lines, marks its action AWARDED with `date_awarded_obligated`, and copies step 6's Modification # to `AgreementMod.number`.
- `GET /procurement-trackers/` returns trackers newest first and adds `created_on`, `award_type`, `agreement_mod_id`, `mod_type`, `mod_number` and `budget_line_item_ids`.

- **Seed data:** CONTRACT #523 has an approved As-Is mod (`agreement_mod` id 1). It comes with MODIFICATION action 117, an Executing budget line "LI 9" linked to it, and tracker 18, whose steps 2–4 are SKIPPED. `agreement_mod` is now in the data_tools `ALLOWED_TABLES`. No `contract_modification_request` row is seeded, because that table isn't loadable.

- **Locks (2026-11-23):** a contract mod's tracker locks only the budget lines linked to its procurement action. The initial award's tracker still locks the whole agreement (`backend/ops_api/ops/utils/budget_line_items_helpers.py`).
- **Frontend (2026-11-23):** shared helpers are in `frontend/src/helpers/procurementTracker.helpers.js`.
  - The Procurement Tracker tab opens on the newest tracker.
  - An As-Is mod's tracker shows only its three required steps: Acquisition Planning, Pre-Award and Award, numbered 1–3 of 3, in both the step indicator and the accordions (UX direction from the product owner).
  - Steps 5 and 6, and the pre-award requisition total, use only the mod's budget lines.
  - A mod's step 6 Modification # starts on the next P number. If every number is used, it starts blank with a "- Select -" option.
  - The award and pre-award approval pages use the same tracker as the tab.
  - The agreement-level Pre-Award banner ignores mod trackers.

- **OpenAPI (2026-11-24):** `ProcurementTrackerResponse` in `backend/openapi.yml` documents the new fields and the newest-first order.
- **E2E (2026-11-24):** `frontend/cypress/e2e/contractModProcurementTracker.cy.js`.
  - One test needs no feature flag, so it also runs in CI: the tab opens on 523's newest tracker and shows only its non-skipped steps.
  - Three tests skip when `ENABLE_MODIFIED_LOE_EDITS` is off, as `startContractModification.cy.js` does:
    - an approved Admin mod gets all six steps;
    - an approved As-Is mod shows three steps (1–3 of 3), and completing step 1 moves to Pre-Award;
    - a declined mod leaves the tab on the newest tracker.

- **Pre-Award request on an As-Is mod (2026-11-24, found in manual testing):** the Request Pre-Award Approval page had its own frontend check that required step 4 to be COMPLETED. It now also accepts SKIPPED, matching the backend rule. The page's budget line validation now covers only a contract mod's own lines, so unrelated Planned lines on the agreement (e.g. 523's past-dated LI 8) no longer block the mod's request. The initial award still validates every line.

Still to do:
- **Future:** a tracker selector dropdown, and putting a tracker id in the approval pages' URLs.
- **Not covered by E2E:** the Award & Modification History entry. It needs the full pre-award, requisition and award approval flow; backend tests cover it (`test_awarding_a_mod_obligates_only_its_budget_lines_and_records_its_number`).

## Decisions
- **De-obligation + executed lines → As-Is tracker, for now (2026-11-24).** AC 3 says any combination that includes a de-obligation needs all six steps. Today, approving a mod doesn't apply its de-obligation; that's OPS-6489. The de-obligation stays pending, and `mod_type()` (OPS-6488) leaves it out. So a request with executed lines plus a pending de-obligation is approved as As-Is and gets the 3-step tracker, which matches what the mod actually procures. Once OPS-6489 applies de-obligations at approval and `mod_type()` counts them, these mods get all six steps with no change here. Counting pending de-obligations now was rejected: the mod would run steps 2–4 for work it doesn't contain, and the next mod would count the same de-obligation again. *(Add to the PR description.)*
- **Which mods get a tracker:** every approved mod. An **As-Is** mod is one whose only change moves BLIs from Planned to Executing, which is what `mod_type()` already returns as AS_IS when there are no edits. It gets steps 1, 5 and 6. Every other combination gets all 6 steps, including Admin-only mods such as a COR change, and Modified LOE mods, with or without executed BLIs.
- **As-Is storage:** keep 6 steps, with steps 2–4 created as SKIPPED.
- **Mod number:** comes from step 6's Modification # field (`award_modification_number`; options are "Base" and P00001–P00020, kept the same in `AWARD_MODIFICATION_NUMBERS` and `MODIFICATION_NUMBER_OPTIONS`). It is copied to `AgreementMod.number` at award approval. History labels then read "FY 2026 P00001". The "Mod 1" text in the `build_fiscal_year_label` docstring is a placeholder, so update the docstring.
- **Seed data:** add a mod-tracker fixture for local and E2E testing (done; see Progress).
- **No feature flag:** the feature ships complete.
- **Dashboard:** mod trackers count in the Procurement Dashboard's per-step agreement counts.
- **De-obligate:** not merged yet but coming soon. Key step-shape logic off "is As-Is" vs. everything else, so a new mod type gets all 6 steps automatically.
- **Step 6 Modification # default for a mod:** never "Base". Start on the next P0000N, one after the highest number already used on the agreement's awarded mods. Leave it blank when that can't be worked out. Today the frontend `getSeededAwardFields` (`frontend/src/components/Agreements/AwardRequestForm/awardForm.helpers.js:69`) falls back to `DEFAULT_MODIFICATION_NUMBER`, so it needs the tracker's award type or mod info.
- **Parallel trackers (team answer, 2026-11-23):** approving a new mod never blocks or closes another tracker. Each mod's tracker runs independently and can stay ACTIVE alongside the others.
- **Lock scope:** a mod's tracker locks only the budget lines that mod executed, both after Pre-Award approval and while its award approval is pending. The initial award's tracker still locks the whole agreement, as today. This changes `is_post_pre_award_locked` and `is_award_approval_requested` (`backend/ops_api/ops/utils/budget_line_items_helpers.py`) from agreement-level to per-budget-line checks for mod trackers.
- **Tab default:** everyone opens on the newest tracker for now (prototype/MVP). There is no per-user default; the future dropdown lets anyone switch trackers.
- **Step wording:** mods reuse the current step copy for now (prototype phase).
- **History entry trigger:** the Budget Team's award approval on step 6, the same as the initial award. The tracker does not need to be COMPLETED.

## Open Questions
None. Both team questions were answered on 2026-11-23 (see Decisions).

### Reference: the step-wording question as sent to the team

> For contract mods, each approved mod will get its own Procurement Tracker. As-Is mods use steps 1, 5 and 6, and every other mod uses all 6 steps. The current step instructions are written for a new award going out for solicitation. A mod is on an awarded contract that already has a vendor, so some of this wording may not fit. Should mods reuse this copy, or do they need mod-specific wording? Wording in question:
>
> - **Step 1 – Acquisition Planning:** "Once the pre-solicitation package is sufficiently drafted and signed by all parties, send it to the Procurement Shop and check this step as complete."
> - **Step 2 – Pre-Solicitation:** "Edit the pre-solicitation package in collaboration with the Procurement Shop. Once the documents are finalized, go to the Documents Tab, upload the final and signed versions, and check this step as complete. If you have a target completion date for when the package will be finalized, enter it below."
> - **Step 3 – Solicitation:** "Once the Procurement Shop has posted the Solicitation and it's "on the street", enter the Solicitation Start and End Dates. After all proposals are received, vendor questions have been answered, and evaluations are starting, check this step as complete."
> - **Step 4 – Evaluation:** "Complete the technical evaluations and any potential negotiations. If you have a target completion date for when evaluations will be complete, enter it below. Once you internally select a vendor check this task as complete (Internally means internal to OPRE, before you send the Final Consensus Memo to the Procurement Shop)."
> - **Step 5 – Pre-Award (As-Is mods use this step too):** "All agreements need Pre-Award Approval before the Final Consensus Memo can be sent to the Procurement Shop. Review the Vendor Price Sheet and make any edits or budget line status changes as needed. After final edits are approved by the Division Director(s), come back here and click Request Pre-Award Approval." and "Once you receive Pre-Award Approval, and the Budget Team submits the requisition, upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS), and check this step as complete. If you have a target completion date for when the Final Consensus Memo will be sent, enter it below."

Source files: `frontend/src/components/Agreements/ProcurementTracker/ProcurementTrackerStep{One..Five}/ProcurementTrackerStep{One..Five}.jsx`. Step 1 is at L82 (L119 has the same text), step 2 at L118, step 3 at L115, step 4 at L100, and step 5 at L151 and L157.
