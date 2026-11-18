---
issue: 6546
branch: OPS-6546/dd-mod-approval-bullet-tracer
---

# Functional bullet tracer: Division Director quick approve/decline for a Contract Modification request

## Why this is a separate story from #3331, not a flesh-out of it

**[#3331](https://github.com/HHS/OPRE-OPS/issues/3331)** ("Review/Approve an edit that requires a
contract modification") is the issue UX is actively using to track the *full* Modification
Approval design — the dedicated page seen in the "Mod Approval" mockup (Review Contract
Modification accordion, Review Agreement Details, Select Budget Lines, Review Services
Components, Review CANs, Review Documents, Submitter/Reviewer Notes, and distinct
Approve/Decline/Cancel confirmation modals). That design isn't finished, and this story must not
rewrite #3331's scope, overwrite its (currently TBD) acceptance criteria, or be mistaken for
delivering it.

This story is a **functional bullet tracer** — the thinnest possible end-to-end path through the
system (submit → notify → act → outcome), wired entirely out of pieces that already exist, built
only to close the loop and keep mods moving while UX polishes the real design in #3331. It is not
itself the feature. It should be filed as its **own new GitHub issue**, cross-linked to #3331 as
"functional bullet tracer, superseded once #3331 ships" — not as a comment or AC edit on #3331
itself.

## Goal

Add a card for a submitted (`IN_REVIEW`) Contract Modification request to the Agreements › For
Review list — any mod type — with quick approve (✓) / decline (✕) icons in the top right, matching
the pattern already used for budget/status/procurement-shop change requests. This reuses existing
backend and frontend building blocks end to end; it does not design or build anything resembling
the full page in the #3331 mockup.

### What makes this a bullet tracer, specifically

- No new visual design. The card and its icons reuse existing patterns/components as-is, even
  where they're an imperfect fit for a Contract Modification (see Constraints).
- **No "Review agreement" link, and no detail page, in this version.** The quick approve (✓) /
  decline (✕) icons *are* the entire interaction — the DD acts straight from the summary fields on
  the card itself. This is itself temporary: once #3331's dedicated review page exists, these
  icons are expected to be **replaced by** a "Review agreement" link to that page (the
  `AwardReviewCard` pattern), not supplemented by one now. Do not add a link to
  `ContractModificationRequestReviewCard`, or render that card anywhere, as part of this story —
  that inline card stays unused exactly as it is today.
- Anything that would require new design decisions (card layout for a mod-specific field set,
  reviewer-notes-from-the-list, de-obligation's three-value display) is deferred — this story
  moves only what's needed to stop mods from stalling with zero DD-facing UI, and no more.

## Background (current state)

- **Submit already works end-to-end.** `ContractModificationRequestService.submit()` covers every
  mod type (Modified LOE, Admin Change/COR, As-Is), notifies the Division Director
  (`CONTRACT_MODIFICATION_REQUEST_NOTIFICATION`), and blocks a second request while one is
  `IN_REVIEW`.
- **Approve/decline already works end-to-end.** `PATCH /contract-modification-requests/<id>/`
  (`ContractModificationRequestItemAPI` → `ContractModificationRequestService.review()`),
  authorized to the agreement's Division Director, deputy, or a superuser (`can_review()`), with
  an already-reviewed guard, rollback on failure, reviewer notes, and a submitter-facing outcome
  notification. Review is **not** gated by `ENABLE_MODIFIED_LOE_EDITS` (fixed in #6525) — only
  *starting* a new request is.
- **A frontend Approve/Decline card already exists but is never rendered.**
  `ContractModificationRequestReviewCard.jsx` has Approve/Decline buttons, a confirmation modal,
  optional reviewer notes, and the "Contract Modification Approved"/"Declined" alerts. Its own doc
  comment says it's deliberately unrendered "until the review UI ships (#3331)." This story does
  **not** change that — it stays unrendered. It's mentioned here only because it's where the exact
  approve/decline mutation and alert copy this story reuses already live, not because this story
  links to it.
- `ContractModificationEdits.jsx` (Award & Modifications tab) only shows a read-only "Contract
  Modification In Review" alert today, to everyone including the DD, with a comment confirming the
  card above is a placeholder.
- The requester-facing outcome message already works today: `ReviewOutcomeAlert` in the same file
  renders the Approved/Declined alert (with reviewer notes on decline) from the notification,
  whenever the requester next visits the agreement.
- **The For Review list has no entry for Contract Modification requests at all.**
  [`ChangeRequestsList.jsx`](../../frontend/src/components/ChangeRequests/ChangeRequestsList/ChangeRequestsList.jsx)
  only assembles `budgetRequisition`, `preAward`, `award`, and `ChangeRequest`-backed cards
  (`crProcShop`, `crBudget`, `crServicesComponent`, `crStatus`).
- The quick check/x icons referenced in the ask are
  [`ReviewCard.jsx`](../../frontend/src/components/ChangeRequests/ReviewCard/ReviewCard.jsx)'s
  `actionIcons` prop (`faCheck`/`faXmark`, shown on hover), used by `BudgetChangeReviewCard`,
  `ProcurementShopReviewCard`, `ServicesComponentChangeReviewCard`, and `StatusChangeReviewCard`.
  They all call `handleReviewChangeRequest(id, action, notes, reviewData)` from
  [`ChangeRequests.hooks.js`](../../frontend/src/components/ChangeRequests/ChangeRequests.hooks.js),
  which opens a confirmation modal and calls `useUpdateChangeRequestMutation`. **That mutation hits
  the `ChangeRequest` model — a different model from `ContractModificationRequest`.** `AwardReviewCard`
  is a different pattern again: no quick icons, just a "Review Agreement" link (award approval has
  its own dedicated page).
- **No backend endpoint exists for "Contract Modification requests pending my review across all
  agreements."** Only per-agreement (`GET /agreements/<id>/contract-modifications/`) and
  per-request (`PATCH /contract-modification-requests/<id>/`) endpoints exist today. A
  division-scoped "reviewable agreements" subquery already exists for this exact purpose on the
  `ChangeRequest` side — `_get_reviewable_agreement_ids_subquery(user_id)` /
  `get_division_ids_user_can_review_for(user_id)` in
  [`change_requests_helpers.py`](../../backend/ops_api/ops/utils/change_requests_helpers.py) — and
  should be reused, not re-derived.
- The For Review tab's badge count comes from a **separate** hook, `useChangeRequestTotal()` in
  [`useChangeRequests.hooks.js`](../../frontend/src/hooks/useChangeRequests.hooks.js), which sums
  four independent counts and doesn't know about Contract Modification requests either — easy to
  miss when only looking at `ChangeRequestsList.jsx`.

### User Story

As a Division Director, I want to see and quickly approve or decline a submitted Contract
Modification request from my For Review list — for any modification type — so that mods don't sit
stalled with no way for me to act, while the real review-page design is still being built.

## Acceptance Criteria

- [ ] A Contract Modification request in `IN_REVIEW` status appears as a card on the Agreements ›
      For Review tab for any user who can review it (the agreement's Division Director, deputy, or
      a superuser) — Agreement name, Modification Type, Requested by, request date. **No "Review
      agreement" link or detail view** — the icons are the only interaction.
- [ ] This applies to every existing mod type the backend already supports (Modified LOE, Admin
      Change/COR, As-Is) with no mod-type filtering — if `review()` already knows how to approve
      it, it shows up here.
- [ ] The new list query, the new card, and `useChangeRequestTotal()` key off
      `ContractModificationRequest.status == IN_REVIEW` and `can_review` only — never off
      `modification_type` or `edit.field` — so that a future de-obligation mod (#6488/#6489) is
      picked up automatically with no changes to anything built here.
- [ ] The card has approve/decline icons in the top right (matching the existing
      `ReviewCard`/`actionIcons` check/x pattern), with a confirmation step before submitting
      (matching every other quick-approve card, and `ContractModificationRequestReviewCard`).
- [ ] Approving shows the existing "Agreement Approved for Contract Modification" success alert;
      declining shows the existing decline alert. No new alert copy is written for this story.
- [ ] After either action, the card leaves the For Review list and the tab's badge count drops
      accordingly.
- [ ] The requester still sees the existing approve/decline outcome alert (`ReviewOutcomeAlert`)
      on the agreement — a no-regression check, since it's driven by the backend notification, not
      by which UI triggered the review.
- [ ] Only a Division Director, deputy, or superuser for the agreement sees the quick-action icons
      or can successfully call approve/decline — enforced by the existing backend `can_review()`
      check, not just hidden in the UI.
- [ ] A second review attempt on an already-decided request is rejected and changes nothing
      (already enforced backend-side; confirm no new race from exposing a second entry point).

**Explicitly out of scope:**
- A "Review agreement" link or any detail/drill-down view. The icons are the entire interaction
  for this version; the DD decides from the card's summary fields alone. A link is expected to
  **replace** the icons once #3331's page exists, not accompany them now.
- Any part of the #3331 page design (the accordions, budget-line/CAN/services-component review,
  documents, the three distinct Approve/Decline/Cancel modals shown in the mockup). This story
  does not touch, replace, or partially build that design.
- De-obligation mod submission or its backend `_approve()` branch (#6488/#6489) — not built here;
  only guaranteed not to be blocked here (see AC above).
- Alternate/deputy-approver management (#3460).
- Rendering or changing `ContractModificationRequestReviewCard` in any way — it stays exactly as
  unused as it is today.
- Per-edit or per-budget-line approval granularity — approve/decline stays whole-request.

## Technical Details

### Approach

1. **Backend: new "pending Contract Modification requests for me" endpoint.** A query analogous
   to the existing pending pre-award/award/budget-requisition queries, scoped the same way
   `ChangeRequest` review-eligibility already is: superuser sees all `IN_REVIEW` requests;
   everyone else sees requests whose agreement is in
   `get_division_ids_user_can_review_for(user_id)`'s agreements (reuse
   `_get_reviewable_agreement_ids_subquery`, don't duplicate the BLI→CAN→Portfolio→Division join).
   Register a new list route (currently only an item route exists).
2. **Frontend: new card + wiring into the existing list.**
   - New card component for the For Review list — summary fields only, no link, no detail view.
     Its quick-action icons must call a handler wired to
     `useReviewContractModificationMutation` (already used by
     `ContractModificationRequestReviewCard`), **not** `handleReviewChangeRequest`/
     `useUpdateChangeRequestMutation` — those hit a different backend model. This is the most
     likely implementation mistake here.
   - New RTK Query hook for the new endpoint; a new `_type: "contractMod"` branch in
     `ChangeRequestsList.jsx`, sorted into `allItems` the same way the other "pending for me"
     sources are.
   - Update `useChangeRequestTotal()` to include the new count.

### Key Files

- `backend/ops_api/ops/resources/contract_modification_edits.py` — add the new list route/view;
  `AgreementContractModificationsAPI` and `ContractModificationRequestItemAPI` show the pattern
- `backend/ops_api/ops/services/contract_modification_requests.py` — `can_review()` (~L306),
  `review()` (~L133); add a "pending for user" query alongside `get_for_agreement()`
- `backend/ops_api/ops/utils/change_requests_helpers.py` — `get_division_ids_user_can_review_for()`
  (~L72), `_get_reviewable_agreement_ids_subquery()` (~L83) — reuse, don't duplicate
- `backend/ops_api/ops/views.py` (~L162) — route registration
- `frontend/src/api/opsAPI.js` — add the new query hook; `useReviewContractModificationMutation`
  already exists
- `frontend/src/components/ChangeRequests/ChangeRequestsList/ChangeRequestsList.jsx` — add the
  `contractMod` branch (~L162 onward shows the per-type dispatch pattern)
- `frontend/src/hooks/useChangeRequests.hooks.js` — `useChangeRequestTotal()` (~L44)
- `frontend/src/components/ChangeRequests/ReviewCard/ReviewCard.jsx` and `AwardReviewCard.jsx` —
  the two existing list-card patterns to choose between for the new card's shape (note:
  `AwardReviewCard`'s "Review Agreement" link is explicitly **not** wanted here — see AC)

### Testing Strategy

Per `docs/TESTING.md`:

- **Backend integration tests** (`test_contract_modification_requests.py`): the new pending-list
  query returns a DD's/deputy's own agreements' `IN_REVIEW` requests and no others; a superuser
  sees all; a non-reviewer gets none; an already-decided request never appears.
- **Frontend Vitest + RTL**: new card renders the mockup's fields; quick-icon approve/decline calls
  `useReviewContractModificationMutation` (not the `ChangeRequest` mutation); confirmation required
  before the mutation fires; `ChangeRequestsList` includes/excludes the card correctly; badge count
  reflects the new total.
- **Cypress E2E (one critical path)**: submit a mod → DD approves from the list via the quick
  icons → success alert → card gone from the list → requester sees the outcome alert on the
  agreement. Include an axe check.

### Constraints / decisions

- **This story needs its own GitHub issue, not a comment on #3331.** Filed as
  [#6546](https://github.com/HHS/OPRE-OPS/issues/6546), labeled a functional bullet tracer,
  cross-linked to #3331. #3331's acceptance criteria are not edited to match this story's scope —
  UX owns that issue for the full design.
- **Card shape: extend `AwardReviewCard`, not `ReviewCard`.** `AwardReviewCard` is the closer
  starting shape (simple summary fields, no detail accordion). Strip its "Review Agreement"
  link/footer entirely and add `ReviewCard`-style quick icons in its place, rather than keeping
  both a link and icons on the same card.
- **Confirmation step: a small shared hook, not a third copy.** `ContractModificationRequestReviewCard`
  already builds its own `ConfirmationModal` inline (local `useState`/`modalProps`, no shared
  hook). Extract that into a small shared hook used by both it and the new list card, rather than
  writing a third copy — and do not reach for `ChangeRequests.hooks.js`'s `useChangeRequest`,
  which is tied to the `ChangeRequest` model and its own alert-copy branching.
- **Reviewer notes: omitted entirely from this version.** Matches every other quick-icon card
  (none of them collect notes before calling their handler), and there's no "Review agreement"
  destination to redirect a note-leaving DD to in this version. A DD who wants to leave notes has
  no path to do so until #3331 ships — an accepted bullet-tracer tradeoff, stated here explicitly
  rather than left implicit.
- **De-obligation forward-compatibility has a limit.** The generic list/card/count work here only
  needs `status`/`can_review` — untyped, so it picks up a de-obligation request automatically. But
  `ContractModificationEditCard.jsx` (inside the inline detail card) dispatches display by
  `edit.field`/`modification_type` (`ModificationEditType` today only has `MODIFIED_LOE` and
  `ADMIN_CHANGE`) and shows a simple From/To pair — de-obligation needs three values (original
  obligated, amount requested, resulting remainder, per #6489's own AC). That display branch, and
  any new `ModificationEditType` member, is #6488/#6489's work, not this story's.

## Related GitHub Issues (overlap found during investigation)

- **[#3331](https://github.com/HHS/OPRE-OPS/issues/3331)** — "Review/Approve an edit that requires
  a contract modification." **This is UX's tracking issue for the full Modification Approval
  page** (the "Mod Approval" mockup: accordions for the modification, agreement details, budget
  lines, services components, CANs, documents, notes; distinct Approve/Decline/Cancel
  confirmation modals). Do not conflate this story with it or edit its AC — this story exists only
  because that design isn't ready yet, and should state plainly it will be superseded once #3331
  ships.
- **[#3332](https://github.com/HHS/OPRE-OPS/issues/3332)** — "Review/approve to start a contract
  modification." Reads as an earlier, narrower framing of the same need as #3331: in this
  codebase there's no separate "request to start" step before the modification content itself is
  reviewed — submitting *is* what gets reviewed. Worth confirming with the team whether #3332
  should close as superseded by #3331, independent of this stopgap story.
- **[#6489](https://github.com/HHS/OPRE-OPS/issues/6489)** — "Review and approve or decline a
  de-obligation contract modification." Its own write-up independently concludes "No Division
  Director review screen was found in the frontend, so one is likely needed" and names the same
  `PATCH /contract-modification-requests/<id>/` endpoint. This story is built so #6488/#6489's
  de-obligation requests flow through this same stopgap card/list/endpoint automatically (see AC
  above); #6489 should add only its backend logic and the edit-card display branch, not a second
  review screen — and should also expect to be superseded by #3331's eventual page like this
  story is.
- **[#3460](https://github.com/HHS/OPRE-OPS/issues/3460)** — "Alternate Designated Approvers."
  Broader than this story; `can_review()` already covers the one deputy-director field that
  exists today. Not a conflict.
- **[#2403](https://github.com/HHS/OPRE-OPS/issues/2403) / [#2993](https://github.com/HHS/OPRE-OPS/issues/2993)** (closed) —
  established the existing check/x hover-icon convention on For Review cards and division-scoped
  reviewer filtering. Precedent to follow, not overlap to resolve.
