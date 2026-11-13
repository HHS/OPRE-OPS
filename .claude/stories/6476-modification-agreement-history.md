---
issue: 6476
branch: OPS-6476/modification-agreement-history
---

# Modification history on Agreement Details tab

## Goal

Add and align the Agreement History messages users need to track modifications to awarded agreements — covering budget-line field edits that already require Division Director approval, edits that apply immediately but still produce an approvable Contract Modification, and the Contract Modification review lifecycle (start/approve/decline) — per the Figma design linked on #6476.

## Acceptance Criteria

The issue itself had no acceptance-criteria checkboxes — only a Goals/Tasks/Resources section pointing at a Figma design. The items below were reconstructed from that design plus developer clarification; see Constraints for the design's own inconsistencies and what's still open.

- [ ] Changing the CAN, Amount, or Obligate By date, or changing the status (e.g. Draft → Planned), of a Draft/Planned budget line on an awarded agreement goes through the existing Contract-Modification approval flow (OPS-3072) and is recorded in Agreement History; message wording matches the Figma design's "...this agreement is awarded and will require a contract modification in order to make changes to the contract" framing
- [ ] Deleting a Draft budget line, adding a new budget line, adding/deleting a grant number, changing a grant number's Period of Performance start/end date, changing the agreement title/nickname/description, changing the NOFO number, changing the grant funding period, adding/removing ALN numbers, adding/removing team members, and changing the project specialist — each, on an awarded agreement, applies immediately with no approval needed for the edit itself, but produces a Contract Modification that requires Division Director approval, and is recorded in Agreement History
- [ ] Starting a contract modification is recorded in Agreement History with message text matching the Figma design ("...requested to start a contract modification for this agreement and it's currently In Review for approval") — updates existing message wording
- [ ] Approving a contract modification is recorded with message text matching the Figma design ("...approved the contract modification for this agreement as requested by {user} and the procurement process has started") — updates existing message wording
- [ ] Declining a contract modification is recorded with message text matching the Figma design ("...declined the contract modification for this agreement as requested by {user}") — updates existing message wording

## Technical Details

### Approach

Extend `backend/models/agreement_history.py`'s `agreement_history_trigger_func` dispatcher (and its per-field helpers — `create_agreement_update_history_event`, `create_bli_update_history_events`, `create_grant_number_history_event`) to add the awarded-agreement-aware message text for the fields above.

- For the fields already gated by OPS-3072's Change-Request flow (CAN, Amount, Obligate By, status), align the existing message wording with the Figma text rather than building new gating logic — the approval gate already exists.
- For the "applies immediately but produces an approvable Contract Modification" fields, confirm with the team (see Constraints) whether this needs new logic to actually generate a Contract Modification record, or is a copy-only change to messages already produced by existing, ungated edit paths.
- Update the existing `START_CONTRACT_MODIFICATION` / `REVIEW_CONTRACT_MODIFICATION` message text in the same file to match the Figma wording — confirmed in scope by the developer.

### Key Files

- `backend/models/agreement_history.py` — the message-generation dispatcher; primary file for this story (confirmed directly by the developer)
- `backend/ops_api/ops/services/contract_modification_requests.py` — submit/approve/decline logic; existing message calls needing wording updates
- `backend/ops_api/ops/services/change_requests.py` — Change-Request message data assembly for the CAN/Amount/Obligate-By/status flow
- `backend/ops_api/ops/utils/budget_line_items_helpers.py` — existing `agreement_tracks_contract_modifications` / `tracks_contract_modifications` awarded-gating logic
- `backend/ops_api/ops/services/budget_line_items.py` — Draft budget line delete path (currently unconditional, no Contract Modification linkage; may need new logic — see Constraints)

### Testing Strategy

Backend-only — `AgreementHistoryPanel.jsx` already renders any history entry generically (`frontend/src/components/Agreements/AgreementDetails/AgreementHistoryPanel.jsx`), so no frontend change is expected.

- **Unit tests** on the message-building helper functions in `agreement_history.py`, with a mocked `OpsEvent`/session/user — following `backend/ops_api/tests/ops/agreement/test_award_history.py`'s pattern — asserting exact `history_title` / `history_message` text for both the awarded and not-awarded branches of each field.
- **Integration tests** through the real event trigger and/or the actual service/API calls, asserting the persisted `AgreementHistory` row's message — following `test_agreement_history.py` and `test_contract_modification_requests.py`'s existing patterns, including the latter's requestor/reviewer-name assertions already established for approve/decline messages.
- No new E2E or frontend component tests — the display layer is unchanged.

### Constraints

- **The Figma design has an internal inconsistency.** Every example message in the "Changes that never require approval (regardless of BL status)" column also carries the same "...this agreement is awarded and will require a contract modification..." text used in the approval-required column — directly contradicting that column's own header. Confirmed by re-inspecting the design at higher resolution (not a misread). Developer clarification: this is intentional in spirit — these edits don't need approval themselves, but they do generate a Contract Modification that itself needs Division Director approval. That's a different thing from the edit being blocked pending approval.
- **Open/pending with the team:** whether deleting a Draft budget line on an awarded agreement should newly produce an approval-needing Contract Modification. Today this delete is unconditional and produces nothing (see `.claude/stories/6195-executing-bl-edits-no-approval.md`, which treats BLI deletes — on Planned/Executing — as explicitly out of scope for its own no-approval work, and confirms Planned/Executing deletes still go through a change request while Draft deletes don't). Developer's instruction for now: treat Draft-BL-delete as "approval not required, but does generate a contract modification" until further clarified.
- **Open, affects scope size:** for the ~10 other "applies immediately" fields (grant numbers, title/nickname/description, NOFO, funding period, ALN numbers, team members, project specialist, new BL), confirm whether "produces a Contract Modification requiring approval" means building new backend logic to actually create/queue an approvable Contract Modification record, or is a copy-only addition to messages on already-ungated edit paths — this materially changes the size of the implementation.
- "Agreement Created" messages aren't affected by this story in practice — a brand-new agreement can't yet be awarded, so the "awarded" condition can't be true for it. Likely leftover placeholder text in the Figma mockup; excluded from the AC list above.
- Wording updates for the Contract Modification start/approve/decline messages (last AC group) are explicitly in scope and one of this story's goals, per the developer.
