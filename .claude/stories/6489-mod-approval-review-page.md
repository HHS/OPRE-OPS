---
issue: 6489
branch: OPS-6489/mod-approval-review-page
---

# Review and approve or decline a de-obligation contract modification

## Goal

Give a Division Director (or deputy) a dedicated "Mod Approval" review page to approve or decline
a submitted Contract Modification request — the first real review UI for any mod type, replacing
the For Review list's quick-icon-only stopgap — and implement the backend logic so a de-obligation
request can actually be approved: reducing the line's obligated amount while keeping the CAN's
balance and the line's original amount intact.

## Acceptance Criteria

- [ ] I am notified when a de-obligation modification is submitted on an agreement I oversee, and I can find the requests awaiting my review.
- [ ] For each line in the request I can see the original obligated amount, the amount requested to be de-obligated, and what would remain obligated afterward, along with the agreement under review.
- [ ] I can approve or decline the request as a whole, with optional notes.
- [ ] Only a Division Director or deputy of the agreement (and superusers, as with other modification reviews) can approve or decline. Anyone else is rejected.
- [ ] A request can be decided only once. A second attempt on an already-decided request is rejected and changes nothing.
- [ ] On approval, each included line's current obligated amount is reduced by its de-obligated amount. A line reduced to $0 remains Obligated.
- [ ] Approval is all-or-nothing. If applying it fails for any line, no line changes and the request stays pending.
- [ ] On decline, no amounts change.
- [ ] The submitter is notified of the outcome, with any reviewer notes, and can submit a new request after a decline.
- [ ] After approval, the original obligated amount and the total de-obligated to date remain viewable on the line's details, the modification record, and the agreement history.
- [ ] After approval, a line's remaining obligated amount (not its original) is the limit for any later de-obligation of that line.
- [ ] After approval, the agreement's total and its spending by fiscal year reflect the net amount, with the reduction attributed to the line's original obligation fiscal year. (A1/A2, OQ1)
- [ ] A CAN's balance is the same before and after approval. The original obligated amount remains deducted and consumed, and no funds are returned to it.
- [ ] The decision is recorded with who, when, what, and the remote IP. The modification record shows its outcome, and the decision appears in the agreement history.
- [ ] The capability is fully usable by keyboard and screen-reader users. Errors and outcomes are announced to assistive technology, and approved/declined state is not conveyed by color alone.

## Technical Details

### Approach

**Developer-set scope (overrides the issue where they conflict):** build one dedicated review
page, used for every Contract Modification Request type (Modified LOE, Admin/COR, As-Is,
De-obligation) — right now they all render the same generic layout. This story is on the hook for
a de-obligation-specific submitter outcome notification only; other types keep the existing
generic/placeholder message. Figma: file `dsQFe6G2KjcTWNq7NNZujm`, node `19052:48981` ("Mod
Approval" — ignore the sibling "Mod Approval (less effort option)", `19104:36662`). This page is
effectively most of issue #3331's long-planned full review design; #3331 stays open as UX's
design record and its AC isn't touched, but expect this PR to close most of that gap.

**Backend — the blocked approve branch:**
- `ContractModificationRequestService._approve()` currently excludes `DE_OBLIGATION` edits from
  `approvable_edits` and raises a `ValidationError` ("tracked separately (OPS-6489)") when a
  request is de-obligation-only. Remove that guard; attach all edits (including de-obligation) to
  the new `AgreementMod` via the existing generic `attach_pending_edits_to_mod`, then for each
  `DE_OBLIGATION` edit: re-validate the line is still Obligated and `new_value <= amount` (mirrors
  the existing re-check for executable budget lines), `amount -= new_value`,
  `requested_de_obligation_amount = None`. No status change — "$0 remains Obligated" is then free.
  Any failure must raise before any flush so the existing rollback-on-exception in `review()`
  keeps this all-or-nothing with no new infrastructure.
- **Schema change (new migration):** add a single nullable `BudgetLineItem.original_obligated_amount`
  column, set once — to the current `amount` — the first time a de-obligation is approved for that
  line, and never changed again. This single column resolves two things at once:
  - "Original + total de-obligated to date remain viewable": original = the column; total-to-date
    = `original_obligated_amount - amount` (only meaningful once the column is set). The
    `ContractModificationEdit.old_value`/`new_value` row already permanently retains the original
    and the delta for "the modification record" — no change needed there.
  - **A real bug the investigation surfaced**: `get_funding_by_budget_line_item_status`/
    `calculate_can_funding` (`backend/ops_api/ops/utils/cans.py`) sum **live** `BudgetLineItem.amount`
    by status, not the netted `net_amount`. Reducing `amount` in place (as the approval AC requires)
    would otherwise shrink the CAN's obligated total and incorrectly inflate its available balance
    — exactly the risk the issue's own "Technical context" section warns about. Fix: that function
    sums `COALESCE(original_obligated_amount, amount)` for Obligated-status lines instead of raw
    `amount`. Lines never de-obligated have a null column, so existing CAN behavior is unaffected.
  - **This is the highest-risk, most novel part of this story** — it touches CAN balance math
    (S0-severity per `docs/REVIEW.md`) and a fresh migration. Give it extra review attention.
  - Agreement total / FY spending already reflects net correctly once this lands: `net_amount`
    (`amount - requested_de_obligation_amount`) is numerically invariant across the
    amount-reduction + requested-amount-reset transition, and FY attribution already comes from
    the line's own `fiscal_year` (derived from `date_needed`, untouched by approval) — so AC12's
    core wording is already satisfied by existing plumbing.
- **`ModType` needs a `DE_OBLIGATION` value** (`backend/models/agreements.py`, a Postgres ENUM —
  needs its own migration step, use `/db-migrations`). `mod_type()` in
  `contract_modification_requests.py` currently strips de-obligation edits before classifying, so
  a pure de-obligation request would otherwise be mis-tagged `AS_IS`; add a branch that returns
  `ModType.DE_OBLIGATION` when the non-de-obligation edit list is empty but de-obligation edits
  exist. `AgreementMod.mod_type` isn't rendered anywhere in the frontend today, so this is low-risk.
- **Audit trail needs no new infrastructure.** `OpsEventHandler` already captures
  `request.remote_addr`/who/when for every `REVIEW_CONTRACT_MODIFICATION` event, and
  `OpsDBHistory` (sqlalchemy-continuum) versions every row change automatically. Only the history
  *message text* needs a de-obligation-aware branch (the `REVIEW_CONTRACT_MODIFICATION` composer in
  `backend/models/agreement_history.py` is generic today), phrased like the existing submit-time
  `_de_obligation_history_event`.
- **Submitter notification gap**: `_notify_submitter()` sends a fixed string today and never
  interpolates `reviewer_notes` for any mod type (a pre-existing gap, not this story's to fix
  generally) — but AC9 explicitly requires notes to reach the submitter, so the new
  de-obligation-specific branch in `_notify_submitter()` must include them, along with per-line
  before/after amounts. Other types keep the existing generic message as-is.
- **OQ1 (fees)**: unresolved per the issue, needs Procurement/fiscal SME confirmation. Default
  behavior needs no extra code — `BudgetLineItem.fees` is a hybrid property derived live from
  `amount`, so it recomputes (shrinks) automatically once `amount` is reduced. Flag this default
  for sign-off rather than building a "retain the original fee" path speculatively.
- **OQ2 (project/reporting/portfolio aggregate views)** is already out of scope per the issue's own
  "Out of scope" list — nothing to do here.

**Frontend — the new page:**
- Extend `frontend/src/pages/agreements/pre-award-approval/ApprovePreAwardApproval.jsx`'s shell
  (closer analog than the Award-approval version: no obligated-date picker, no vendor-specific
  accordions, and its Notes accordion already matches Figma pixel-for-pixel — read-only
  Submitter's Notes + a reviewer `TextArea`, maxLength 150). Reuse `AgreementMetaAccordion` and
  `AgreementCANReviewAccordion` as-is — they're already generic over "an agreement," not
  award-specific.
- New page `frontend/src/pages/agreements/mod-approval/ApproveModApproval.jsx` + `.hooks.js`, new
  route `/agreements/:id/review-modification` (matches the existing `/agreements/:id/review-pre-award`
  / `/agreements/:id/review-award` naming). Fetch via the existing
  `useGetAgreementContractModificationsByIdQuery(agreementId)` and find the `IN_REVIEW` request —
  only one can be in review per agreement (DB unique index), so no separate request-id routing.
- **BLI section — developer correction, replacing the plain checkboxed table shown in the "Mod
  Approval" Figma frame with the read-only pattern from the "BLI Status Change approval" Figma
  screen** (node `9533:231489`, "Review Agreement - Executing Status"): no checkboxes, and the
  specific cell that changed (Status for a status-change edit, Amount for a de-obligation edit)
  gets a blue bottom-border. All other sections stay exactly as in the original "Mod Approval"
  Figma frame — this change is scoped to the budget-lines table only.
  - **Checkboxes are already hidden for free.** `BudgetLinesReviewAccordion` calls
    `AgreementBLIReviewTable` without a `setSelectedBLIs` prop, and `BLIReviewTable.jsx` computes
    `showCheckboxes = !!setSelectedBLIs` — so reusing `BudgetLinesReviewAccordion` as already
    planned already renders the plain-text "BL ID #" column with no checkbox, matching the
    reference screen exactly. No change needed here.
  - **New work: a changed-cell highlight.** No existing component has a "this value changed"
    blue-border treatment today (confirmed by grep — nothing in the codebase does this yet). Add a
    highlight prop threaded `BudgetLinesReviewAccordion` → `AgreementBLIReviewTable`
    (`BLIReviewTable.jsx`) → `BLIReviewRow.jsx` (e.g. a map of `budgetLineItemId → "status" |
    "amount"`), and apply a blue-bottom-border class to that row's Status `<td>` or Amount `<td>`
    when present. Derive the map from `request.edits`: a `MODIFIED_LOE`/status-field edit
    highlights that line's Status cell; a `DE_OBLIGATION` edit highlights that line's Amount cell.
  - **The "D" icon and its tooltip are already free.** `BLIReviewRow.jsx`'s Amount cell already
    renders `<PendingDeObligationIcon budgetLine={budgetLine} />` unconditionally whenever
    `budgetLine.requested_de_obligation_amount` is set — the exact same icon and "Original
    obligated amount was $X with $Y de-obligated" tooltip used on the de-obligation submit form.
    Since an in-review de-obligation request's budget line still carries that field, this renders
    with zero extra work; the only new visual addition on top of it is the blue-border highlight
    above.
- Add a "Review Contract Modification" accordion that reuses `ContractModificationEditCard` (one
  per `request.edits` row) plus the budget-lines-to-execute `TermTag` list — promote that markup
  out of the now-superseded `ContractModificationRequestReviewCard.jsx` rather than keeping a
  second copy. Reuse `useContractModificationReview` as-is for the approve/decline
  mutation/confirmation-modal/alert plumbing (shared by both existing cards already).
- **De-obligation's third value**: `ContractModificationEditCard.jsx`'s generic branch (via
  `changeRequests.helpers.js`'s `renderChangeValues`) already renders a 2-value From/To for a
  de-obligation edit (original → remaining). Add one more branch keyed on
  `edit.field === "requested_de_obligation_amount"` rendering three `TermTag`s: Original Amount,
  Requested De-obligation, Remaining Amount.
- **List-card link swap (in scope, not deferred)**: `ContractModificationReviewCard.jsx`'s own doc
  comment says its quick icons are "expected to be replaced once the real review page ships" —
  that's now. Swap the check/x icons for a "Review agreement" link + eye icon to the new route,
  copying the `AwardReviewCard.jsx` pattern (matches the Figma "Agreement List — For Review" card,
  node `19052:48961`, which already shows the link form).
- `ContractModificationApprovalAlert.jsx` needs no change — it renders whatever `title`/`message`
  the backend notification carries, so the de-obligation-specific text lands there for free.

### Key Files

**Backend**
- `backend/ops_api/ops/services/contract_modification_requests.py` — `_approve()`, `mod_type()`, `_notify_submitter()`
- `backend/models/agreements.py` — `ModType` enum
- `backend/models/budget_line_items.py` — new `original_obligated_amount` column (+ a `total_de_obligated_to_date`-style derived property)
- `backend/ops_api/ops/utils/cans.py` — `get_funding_by_budget_line_item_status()` / `calculate_can_funding()`
- `backend/models/agreement_history.py` — `REVIEW_CONTRACT_MODIFICATION` history composer, `_de_obligation_history_event`
- `backend/ops_api/ops/resources/contract_modification_edits.py` — `ContractModificationRequestItemAPI.patch` (event metadata)
- `backend/alembic/versions/` — new migration (ModType value + BLI column)
- `backend/ops_api/ops/schemas/` — expose the new original/total-to-date values on the relevant BLI/mod schemas

**Frontend**
- New: `frontend/src/pages/agreements/mod-approval/ApproveModApproval.jsx` + `.hooks.js`
- `frontend/src/index.jsx` — new `/agreements/:id/review-modification` route
- Reused as-is: `AgreementMetaAccordion`, `AgreementCANReviewAccordion`, `frontend/src/hooks/useContractModificationReview.hooks.js`; `PendingDeObligationIcon.jsx` (no change — already renders on any BLI with `requested_de_obligation_amount` set)
- `frontend/src/pages/agreements/pre-award-approval/BudgetLinesReviewAccordion/BudgetLinesReviewAccordion.jsx`, `frontend/src/components/BudgetLineItems/BLIReviewTable/BLIReviewTable.jsx`, `frontend/src/components/BudgetLineItems/BLIReviewTable/BLIReviewRow.jsx` — thread the new changed-cell highlight prop (checkboxes already come out "free" via the existing `showCheckboxes = !!setSelectedBLIs` behavior)
- `frontend/src/components/Agreements/ContractModificationEdits/ContractModificationEditCard.jsx` + `frontend/src/helpers/changeRequests.helpers.js` (`renderChangeValues`) — 3-value de-obligation branch
- `frontend/src/components/Agreements/ContractModificationEdits/ContractModificationRequestReviewCard.jsx` — markup promoted into the new page, then retired
- `frontend/src/components/ChangeRequests/ContractModificationReviewCard/ContractModificationReviewCard.jsx` — swap quick icons for a "Review agreement" link (`AwardReviewCard.jsx` pattern)

### Testing Strategy

**Backend** — extend `backend/ops_api/tests/ops/budget_line_items/test_de_obligation.py` (OPS-6488's
submit-side fixtures/assertion style already live here, and its `# ---=== Approval is not yet
supported (OPS-6489) ===---` section is written to be flipped by this ticket):
- Rewrite `test_approving_a_de_obligation_request_is_rejected` →
  `..._reduces_the_obligated_amount`: `amount` drops, `requested_de_obligation_amount` clears,
  edit's `agreement_mod_id` is set.
- New: full de-obligation to $0 stays Obligated.
- Rewrite `test_approving_a_mixed_request_executes_the_rest_and_leaves_the_de_obligation_pending`:
  the de-obligation edit is now also applied, not left pending.
- New: all-or-nothing rollback (mirror `test_failed_approval_leaves_nothing_behind` in
  `test_contract_modification_requests.py`).
- New: submitter notification (with reviewer notes) + audit trail/history text names the
  de-obligation amounts.
- `test_declining_a_de_obligation_request_puts_the_edit_back_to_pending` needs no change.
- New: CAN funding summary identical before/after approval (the bug this story fixes).
- Don't duplicate the generic DD/deputy/superuser-403 and already-reviewed-400 suites in
  `test_contract_modification_requests.py` — add one parametrized de-obligation case there instead.
- No new BDD `.feature` file — OPS-6488 set the precedent of going straight to integration tests
  for this family of flows; this is the same state machine, not a new business process.

**Frontend**:
- `ApproveModApproval.test.jsx` — mirror `ApprovePreAwardApproval.test.jsx` (loading, access-denied,
  per-mod-type rendering) and `ContractModificationRequestReviewCard.test.jsx` (approve/decline →
  confirm → mutation → success/error alert, submit-disable-after-success).
- `ApproveModApproval.a11y.test.jsx` — mirror `ContractModificationRequestReviewCard.a11y.test.jsx`'s
  real-Redux-`Alert` pattern (`role="alert"`/`role="status"` on outcome).
- `BLIReviewRow.test.jsx` — add cases for the new changed-cell highlight (status vs. amount) and
  confirm no checkbox renders when `setSelectedBLIs` is omitted (already true today, worth locking
  in since this story is the first caller relying on it for a review-only page); the highlight
  itself is a visual/color cue, so pair it with a non-visual signal (e.g. an `aria-label` or
  visible text like "Updated") per AC15's "not color alone" requirement.
- No Cypress component test — the repo has no actual CT setup (`cypress.config.js` has no
  `component` key); the working precedent for a complex accordion review page is Vitest+RTL.
- Extend `frontend/cypress/e2e/reviewContractModificationFromList.cy.js` with a de-obligation case
  (seed an Obligated BLI, submit a de-obligation, approve via the new page, confirm `amount` and
  CAN balance) rather than writing a new spec; touch up `startContractModification.cy.js`'s
  now-stale "review UI is #3331" comment.

### Constraints

- Scope and Figma source are as stated by the developer in Approach above — see there for the
  exact node ID and the "generic page, de-obligation-only notification" framing.
- OQ1 (fee release/retention) and the `original_obligated_amount` + CAN-balance-fix design are the
  two biggest judgment calls in this story; both are spelled out above with a concrete
  recommendation, but confirm them during implementation review rather than treating them as settled.
- OQ2 (project/reporting/portfolio aggregate views) is explicitly out of scope per the issue text.
- The BLI table's checkbox-free, changed-cell-highlighted pattern is scoped to this page's budget
  lines section only (per the "BLI Status Change approval" Figma reference, node `9533:231489`).
  Every other section of the page follows the original "Mod Approval" Figma frame (`19052:48981`)
  as described above — this is a correction to one section, not a new overall layout.
