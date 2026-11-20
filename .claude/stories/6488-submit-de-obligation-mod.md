---
issue: 6488
branch: OPS-6488/submit-de-obligation-mod
---

# Submit a de-obligation contract modification for Obligated budget lines

## Goal

Let agreement team members (project officer, team member, Budget Team) on an awarded agreement edit an Obligated budget line to specify a de-obligated amount, and submit that as a contract modification recorded pending review — reusing the existing mod modal/mailbox-card/edit-tracking infrastructure, without touching the CAN balance or reducing any real funds. Review/approval of the submitted mod and actually applying it are a separate story (#6489) and out of scope here.

## Acceptance Criteria

- [ ] User can edit an obligated budget line to specify a de-obligated amount (no other edits on obligated budget lines)
- [ ] The de-obligated amount for a line must be greater than $0 and no more than that line's remaining obligated amount (so a line can be de-obligated in full). Amounts outside that range are rejected with a message that explains why.
- [ ] User can sees that their change will trigger a modification (mod modal & mailbox card)
- [ ] User can submit a de-obligation modification on an awarded agreement for one or more of its Obligated budget lines
- [ ] Only budget lines in Obligated status on an awarded agreement can be included in de-obligations. Lines in any other status, and lines on agreements that are not awarded, cannot.
- [ ] Only users who can already edit an agreement (team members, budget team, DDs, etc) can submit a de-obligation.
- [ ] An edited obligated budget line (de-ob) updates on the agreement right away. The change updates the budget line and agreement total, but **not** the CAN balance.
- [ ] A de-obligation modification is recorded as pending review once submitted for approval
- [ ] The original obligated amount and the requested de-obligated amount are viewable on the budget line's details (amount row and expanded details), in the agreement history, and on the modification record(mailbox card)
- [ ] There can be multiple de-obligating modifications existing concurrently for the same agreement, but not for the same budget line item(s) (multiple edits can be made, but only the last one persists). A de-obligating mod could exist and be active alongside a pending Modified-LOE modification, since the two types act on disjointed lines (Planned vs. Obligated).
- [ ] Submission is recorded with who, when, what, and the remote IP.
- [ ] The capability is fully usable by keyboard and screen-reader users. Validation errors and submission outcomes are announced to assistive technology, and the pending/de-obligated state and amounts are not conveyed by color alone.
- [ ] Once the mod is started, the pending modification shows up on the Division Directors For Review tab where they can choose to approve or decline (this is temporary until we implement the GH issue to review/approve mods)
- [ ] Editing an obligated budget line to specify a de-obligated amount and starting the de-obligated mod is consistent with the other types of modifications already implemented (modified LOE, Admin change, etc)(same mod modal, same alerts, same mod mailbox card, same for review card, etc)

## Technical Details

### Approach

This adds a dedicated write path for editing an Obligated budget line — parallel to, but distinct from, the existing Modified-LOE direct-edit path. `EDITABLE_STATUSES`/`DIRECT_BUDGET_EDIT_STATUSES` explicitly exclude `OBLIGATED`, and `BudgetLineItem.amount` must never be mutated by this story (mutating it directly would silently free CAN budget — that's reserved for #6489's approval/apply step).

Add a new `ModificationEditType.DE_OBLIGATION` alongside the existing edit types, written via a new `ContractModificationEditService.record_de_obligation_request()` mirroring `record_direct_edit()`'s merge/"last edit wins" semantics. The existing per-(budget_line_item_id, field) unique index already gives "one pending edit per line, last edit wins" for free as long as a distinct field name is used — this satisfies the per-line exclusivity half of the concurrency AC.

**Decision (confirmed with developer): Agreement Total updates immediately at submission time**, not only once #6489 applies the de-obligation. Since `Agreement.agreement_subtotal`/`agreement_total`/`lifetime_obligated`/`spending_by_fiscal_year` and every CAN/portfolio aggregate (`CAN.total_spent`, `calculate_can_funding`, etc.) all live-sum the exact same `BudgetLineItem.amount` column, there's no existing way to move one without moving the other. Add a new nullable `requested_de_obligation_amount` column on `BudgetLineItem`, net it into the Agreement-level aggregates above, and leave every CAN/portfolio aggregate reading the raw, untouched `amount` column unchanged. This is a real schema change, not a reuse of the diff-tracking audit pattern alone — but storing it on a tracked BLI column means SQLAlchemy-continuum history picks it up automatically, which covers the "visible in agreement history" AC without bespoke event wiring.

A new dedicated endpoint validates: agreement `is_awarded`, BLI `status == OBLIGATED`, `0 < amount <= bli.amount` (rejecting out-of-range amounts with an explanatory message), and the same agreement-edit authorization already used by `ContractModificationRequestService.submit()` (`check_user_association`/superuser) — not the `EDITABLE_STATUSES`-based editability check. On success it writes only the new `ContractModificationEdit` row, never `budget_line_item.amount` directly.

Submission reuses the existing generic `StartModification` flow (bundles all pending edits into one `ContractModificationRequest`), the existing mod modal/alerts, and `ContractModificationEditCard` (extended with a new render branch: From = original amount, To = requested amount). `OpsEventHandler` already captures who/when/what/remote IP for any wrapped mutation, so wrapping the new endpoint covers that AC for free.

Per the UX team's "Human-centered Context" doc: only `amount` can change on this path — Services Component, CLIN, CAN, Obligate By Date, Fee (rate/amount), and Status stay locked (matches the Figma mockup's disabled fields). A repeat edit updates the existing mailbox card to the latest requested amount rather than creating a second card (already covered by the "last edit wins" unique-index behavior above) — but **if the amount is edited back to the original obligated amount, the pending `ContractModificationEdit` row must be deleted entirely**, removing the mailbox card, not left as a zero-value edit. This is a new, specific rule `record_de_obligation_request()` needs to implement (delete-if-reverted), beyond plain upsert/merge. The doc also gives a more precise permission list than AC #6's "etc" — Division Directors, Team Leaders, CORs/ACORs/Project Officers, Team Members, Budget Team — which should already be exactly who passes the existing agreement-edit authorization check; worth confirming there's no gap (e.g. Team Leaders) when wiring up the new endpoint's `@is_authorized` scope.

The doc also describes an existing superuser exception: superusers can already correct any field on an Obligated BLI (data cleanup, not a de-obligation) without creating a mod card. This matches the established repo-wide pattern of superusers bypassing awarded-agreement locks (e.g. `sc_requires_approval_gate`, `validate_no_execution_status_change_on_awarded` in `budget_line_items_helpers.py` already special-case `is_super_user`) — so the new de-obligation path should follow the same convention rather than introducing a new one, but should NOT itself grant superusers a new "edit all fields" capability; that already exists elsewhere and is out of scope here.

**Decision (confirmed with developer): do NOT loosen the "one open mod per agreement" constraint** for this story. The existing unique index (`uq_contract_modification_request_one_in_review`) is scoped to `agreement_id` alone, not by type — so today a de-obligation submission is blocked while any other mod type (incl. Modified LOE) is already `IN_REVIEW` for the same agreement, same as every other mod type. The AC's "can coexist with a pending Modified-LOE mod" claim is deferred to a later story; only per-budget-line-item pending-edit exclusivity (already structurally supported) is in scope here.

**Update: the "For Review" tab is being wired up by a sibling PR, not deferred.** [PR #6548](https://github.com/HHS/OPRE-OPS/pull/6548) (issue OPS-6546, open/unmerged as of this writing) adds exactly this — a `ContractModificationRequest` card on the DDs' For Review list with quick approve/decline icons — via a new `ContractModificationRequestsPendingReviewAPI`/`get_pending_for_user()` (renamed from a private helper) and a new frontend `ContractModificationReviewCard` + `useContractModificationReview.hooks.js`. Per that PR's own description, `get_pending_for_user()` "filters only on status and reviewability, never mod type" and was **explicitly written to pick up the de-obligation mod type automatically once it exists** — so AC #13 should be satisfied for free once both PRs are merged, provided our new `ModificationEditType`/`mod_type()` branch (see below — `_mod_type()` was renamed to public `mod_type()` in #6548) integrates cleanly and has a human-readable label wherever `modification_type` is rendered. One real risk worth raising with the team: that PR's review endpoint lets a DD approve/decline *any* pending request regardless of type, but its own description notes the de-obligation `_approve()` branch "doesn't exist yet" — meaning once this story ships, a DD could click "Approve" on a pending de-obligation before #6489 implements the real apply logic. Confirm what the generic approve path does for a mod type with no `_approve()` branch (no-op that just flips status, or an error) before this story and #6548 are both live at the same time.

**Decision (confirmed with developer): this story also adds a minimal approval guard, not the real apply logic.** Rather than leaving the half-applied state below unguarded, or building #6489's actual apply/CAN-netting work early, `ContractModificationRequestService.review()`/`_approve()` gets an explicit check: if the request's `mod_type()` resolves to `DE_OBLIGATION`, reject `APPROVE` with a clear `ValidationError` (e.g. "De-obligation approval isn't supported yet.") rather than silently completing. `DECLINE` is unaffected — declining just needs to put the edit back to pending the same way a declined Modified-LOE edit does today (`_decline()`'s default branch, no special-case needed since nothing there mutates BLI state). This keeps the story scoped to submission while failing closed instead of open once PR #6548 makes approve/decline generically reachable.

**Decision (confirmed with developer): this story also fixes the `mod_type()` mislabeling bug**, independent of the guard above — it's a correctness issue regardless of whether approval is blocked, since the audit trail (`AgreementMod.mod_type`) must be right if the guard is ever removed or bypassed. Add an explicit `if all(edit.modification_type == ModificationEditType.DE_OBLIGATION for edit in request.edits): return ModType.DE_OBLIGATION` branch (checked before the `MODIFIED_LOE` catch-all) in `mod_type()`. (file `dsQFe6G2KjcTWNq7NNZujm`, node 15511-9503): frame "De-ob-8"'s tooltip over the edited line's Amount cell reads "Original obligated amount was $400,000.00 with $100,000.00 de-obligated" — but the expanded-row detail in frame "De-ob-6" correctly shows Original Obligated Amount = $500,000.00 and De-obligated Amount = ‑$100,000.00 (500k − 100k = 400k net, matching the Amount column). The tooltip has swapped net for original — use the real original ($500,000), not the net ($400,000), when implementing that label's copy.

### Key Files

**Backend — modify:**
- `backend/models/contract_modification_edits.py` — new `ModificationEditType.DE_OBLIGATION` value
- `backend/models/budget_line_items.py` — new `requested_de_obligation_amount` column; "remaining obligated amount" helper
- `backend/models/agreements.py` — net `agreement_subtotal`, `agreement_total`, `lifetime_obligated`, `spending_by_fiscal_year` against the new field
- `backend/ops_api/ops/utils/budget_line_items_helpers.py` — new eligibility/authorization helper (not `EDITABLE_STATUSES`-based)
- `backend/ops_api/ops/services/contract_modification_edits.py` — new `record_de_obligation_request()`, including delete-the-pending-edit-if-amount-reverted-to-original logic
- `backend/ops_api/ops/services/contract_modification_requests.py` — add an explicit `DE_OBLIGATION` branch to `mod_type()` (public, renamed from `_mod_type()` in #6548; currently a catch-all would mislabel it `MODIFIED_LOE`); add a guard in `review()`/`_approve()` that rejects `APPROVE` for a `DE_OBLIGATION` request until #6489 ships; must integrate with #6548's `get_pending_for_user()`
- `backend/ops_api/ops/services/budget_line_items.py` (or a new service) — submit/validate entry point
- `backend/ops_api/ops/resources/agreements.py` and/or `budget_line_items.py` — new route + `@is_authorized`
- `backend/ops_api/ops/schemas/contract_modification_edits.py`, `budget_line_items.py` — schema updates
- `backend/openapi.yml` — new endpoint/schema docs
- `backend/ops_api/ops/utils/cans.py` — verify CAN aggregates keep reading raw `amount` (no change expected, but confirm)

**Frontend — modify:**
- `frontend/src/helpers/utils.js` — `modificationEditType`/`changeToTypes` display maps
- `frontend/src/components/Agreements/ContractModificationEdits/ContractModificationEditCard.jsx` — new render branch for de-obligation (submitter-side mailbox card)
- `frontend/src/components/ChangeRequests/ContractModificationReviewCard/` (new in PR #6548) — reviewer-side For Review list card; confirm it renders a correct "De-obligation" label for the new mod type
- `frontend/src/api/opsAPI.js` — new mutation endpoint + cache invalidation tags
- Agreement/BLI detail components rendering the amount row + expanded details (`AgreementBLIAccordion`/`BLIReviewTable` family) — show original + requested
- New modal/form for "De-obligate funds" on an Obligated BLI (no existing edit UI for Obligated lines today)

**New:**
- Alembic migration for the new column + enum value (check sqlalchemy-continuum `*_version` table impact)
- Backend tests mirroring `tests/ops/budget_line_items/test_modified_loe_amount_edit.py`, `tests/ops/agreement/test_contract_modification_edits.py`, `tests/ops/agreement/test_contract_modification_requests.py`
- Frontend tests mirroring `StartModification.hooks.test.js` and `ContractModificationEditCard` tests, plus a Vest suite + co-located `suite.test.js` for amount validation

### Testing Strategy

**Automated** (lowest level that works, per `docs/TESTING.md`)

| Level | Positive | Negative |
|---|---|---|
| Backend pytest (integration) | Submit creates a pending modification with the requested amount per line and the original obligated amount retained; a full-amount request is accepted; multiple lines in one modification; editing the amount back to the original obligated amount deletes the pending edit/mailbox card; line amounts, agreement figures, and CAN funding summary behave per the decisions above (agreement total nets the pending de-ob, CAN stays on raw `amount`); the event record includes the remote IP (same pattern as `test_contract_modification_requests.py`); superuser direct-edit of an Obligated line's other fields still bypasses the mod system entirely and creates no mailbox card; `mod_type()` returns `DE_OBLIGATION` (not `MODIFIED_LOE`) for a request made up only of de-ob edits; declining a pending de-ob request puts the edit back to pending, same as Modified LOE | Amount ≤ $0 or > remaining → 400; non-Obligated line (Draft, Planned, In Execution) → 400, reusing the "not in an editable state" message convention from `test_modified_loe_amount_edit.py`; non-awarded agreement → 400; second pending mod of any type on the same agreement → 400 (constraint intentionally kept as one-at-a-time); user who cannot start a contract modification on the agreement → 403; **approving** a de-obligation request → 400 (new guard, not yet supported) |
| Frontend Vest suite unit test (`suite.test.js`) | Amount in `(0, remaining]` passes | Amount `<= 0` fails; amount `> remaining` fails |
| Frontend Vitest + RTL | `ContractModificationEditCard` and budget-line detail views show original and requested amounts | Out-of-range amount blocks submit (button-gating) |
| Cypress E2E (one critical path) | Start de-obligation → select Obligated line → enter amount → submit → pending state shows original and requested amounts; include `cy.checkA11y()` | n/a (permissions and validation stay at lower levels) |

No new BDD feature file: the existing `start_contract_modification.feature` already encodes the generic submit→DD-review journey (edit-type-agnostic), and this story's rules are edge-case/CRUD-shaped validation, which `docs/TESTING.md`'s BDD guidance says is a poor fit for Gherkin.

**Manual**
- Keyboard-only and screen-reader pass through the full flow; confirm errors/outcomes are announced and state isn't color-only.
- Cross-agreement-state exploratory pass (non-awarded, non-Obligated lines, outside-team user).
- Confirm a pending de-obligation and a pending Modified-LOE mod cannot both be submitted concurrently (per the "keep one-at-a-time" decision), and that submitting a second de-ob edit on the same line replaces the first.

### Constraints

- Approval/DD review of the submitted mod, and actually applying an approved de-obligation (reducing the real `amount`, netting CAN balance, etc.), are out of scope — tracked in issue #6489.
- Open questions OQ1 (fee handling on the de-obligated amount) and OQ2 (portfolio/reporting aggregate views) from the issue are explicitly unresolved and out of scope for this story unless they come up during implementation.
- Agreement Total updates immediately at submission (developer decision — see Approach); the issue's own "Key decision A1" text and the Figma mockup's static Agreement Total box suggested otherwise, but the developer confirmed the literal AC #7 reading.
- The "one open mod per agreement" DB constraint is NOT loosened in this story (developer decision) — a de-ob mod cannot be submitted while another mod type is already in review for the same agreement.
- **Depends on [PR #6548](https://github.com/HHS/OPRE-OPS/pull/6548) / OPS-6546 (open, unmerged):** that PR wires `ContractModificationRequest` into the DDs' For Review list generically and was built to auto-pick-up new mod types, including de-obligation — so AC #13 is expected to work "for free" once both PRs are merged, not something this story builds itself. Rebase onto main after #6548 merges and verify the new `ModificationEditType`/`mod_type()` branch integrates with its `get_pending_for_user()` and the new `ContractModificationReviewCard` label.
- **Confirmed risk, now guarded (developer decision — see Approach):** `ContractModificationRequestService._approve()`/`mod_type()` (as of main @ `48a5fe0`) has no de-obligation branch and never touches `BudgetLineItem.amount`/`requested_de_obligation_amount` — approving a de-ob request today would mislabel the `AgreementMod.mod_type` as `MODIFIED_LOE`, send a submitter notification worded for a procurement mod, and leave `requested_de_obligation_amount` permanently stranded on the BLI with no cleanup path until #6489 ships. This story fixes the `mod_type()` labeling and adds a guard that rejects `APPROVE` for a de-obligation request with a clear error, rather than building #6489's real apply logic early.
- The UX team's "Human-centered Context" doc confirms: only `amount` changes on this path (Services Component, CLIN, CAN, Obligate By Date, Fee, Status stay locked); eligible users are DDs, Team Leaders, CORs/ACORs/Project Officers, Team Members, and Budget Team (CORs are the intended primary owners, though not an enforced restriction); CAN balances are updated manually by the Budget Team, not automatically; and a de-obligation edited back to the original amount removes the mailbox card entirely (agreement history still shows every change).
- New open question surfaced by the UX doc, not in the GitHub issue, flagged for team discussion per the doc's own instruction: are de-obligations scoped to all agreement types, or only Contracts/AAs? Doesn't block starting backend/model work but affects which agreement types the new endpoint and UI should accept.
- The doc's fee-impact open question (does the fee shrink with the de-obligated amount, or stay keyed to the original?) matches the issue's OQ1 and remains unresolved — this story does not recalculate fees.
- **Mailbox card follows Figma, not AC #22's wording (developer decision):** the card reads "Change To: Amount, From <original obligated> To <net>" (De-ob-9), not "From <original> To <de-obligated amount>". The edit row still stores original + requested de-obligated amount; only the display computes the net, in the shared `renderChangeValues` helper the review cards also use.
- **Flow follows the revised Figma "Editing an Obligated BL (Contract Modification: De-Obligation)" (node 15511-9503), replacing the earlier Option 3 amount modal:** pencil → confirm modal → the regular budget line form, with Services Component, Obligate By Date and CAN disabled and the amount field relabeled "De-obligated Amount". Description stays editable, as Figma shows, over the AC's "no other edits" (decision recorded on the issue): it is sent as `line_description` with the de-obligation request and applies right away, outside the modification. Update Budget Line only stages the de-obligation in the editor; Save & Exit sends it to `POST /budget-line-items/<id>/de-obligation/` and keeps it out of the generic budget line update. Modification # and Modification Date in the expanded row stay "TBD" until approval creates the `AgreementMod` (#6489).
- **Known Figma discrepancy, left as is:** the disabled CAN field renders with a solid grey fill (react-select `ComboBox`), while Figma shows it outlined with grey text like the disabled Services Component and Obligate By Date. That is how it looks when disabled everywhere in the app, so the fix is a separate app-wide styling change tracked in [OPS-6566](https://github.com/HHS/OPRE-OPS/issues/6566) ("Disabled combo boxes and textareas don't match the disabled select style"). Until OPS-6566 lands, the disabled CAN field won't match Figma.
- **Pre-existing, separate bug found while testing:** opening the edit page directly via `?mode=edit` seeds the editor before services components load, so every line looks changed and Save & Exit sends them all with `services_component_id: null`. Entering edit mode through the Edit button works. Not caused or fixed by this story.
