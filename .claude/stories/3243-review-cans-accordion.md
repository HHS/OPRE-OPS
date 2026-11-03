---
issue: 3243
branch: OPS-3243/review-cans-accordion
---

# Update Review CANs Accordion on Status Change

## Goal

Fix the Review CANs accordion (used on the BLI "Change BL Status" page) so it shows no misleading content until there are budget lines selected with CANs to actually review, and remove/clean up caption and footnote clutter that currently shows regardless of whether it's relevant.

## Acceptance Criteria

- [ ] When there is no data to review (no budget lines selected yet, or selected lines have no CAN), nothing should show in the Review CANs accordion body
- [ ] update dev to match designs
- [ ] caption text should be attached/associated to the CAN Card, not by itself
- [ ] Portfolios and/or CANs Outside Your Division should be hidden if there is no data to display

## Technical Details

### Approach

Root cause of the primary bug, confirmed in `AgreementCANReviewAccordion.jsx` lines 201–208: whenever `cansWithPendingAmount.length === 0`, it renders "The budget lines you selected do not have a CAN." — a condition that fires identically whether nothing has been selected yet or selected lines simply have no CAN. `ReviewAgreement.jsx` (the "Change BL Status" page) hits this on every load since its `selectedBudgetLines` starts empty. Fix: remove that message so nothing renders in the body for that case — only the heading stays.

Visual QA against the running app (Playwright, logged in as System Owner, `/agreements/review/14`) surfaced a related gap: the `<p>{instructions}</p>` line (e.g. "The budget lines you've selected are using funds from the CANs displayed below.") renders unconditionally, outside the `cansWithPendingAmount.length > 0` block, so it keeps showing — and remains misleading ("...displayed below" with nothing below) — even with nothing selected. This was initially moved inside the conditional, but UX gave feedback to leave the instructions text as-is for now; a more comprehensive fix for it is tracked as a separate ticket. **This story leaves `<p>{instructions}</p>` unconditional.**

Separately (confirmed via screenshot + code read), in the normal case where a CAN *is* being reviewed, three more things currently show that shouldn't:
1. `BudgetCard.jsx`'s baked-in `"*Spending is the sum of BLs in Planned, Executing and Obligated Status"` footnote (lines 85–96) — this is the "caption ... by itself" problem. `BudgetCard` is shared with `CANSummaryCards.jsx`, so add an optional prop (e.g. `showSpendingNote`, default `true`) so `CANFundingCard.jsx` can opt out without affecting `CANSummaryCards`. Confirmed: `BudgetCard` has no PropTypes (JSDoc typedef only), only 2 consumers exist (`CANFundingCard.jsx`, `CANSummaryCards.jsx`), and the footnote block (lines 85–96) is self-contained — its conditional margin class depends on the LineGraph above it, not on anything outside the block, so gating the whole thing behind one prop has no side effects.
2. The "Portfolios:" caption — today the `<span>` label always renders whenever `cansWithPendingAmount.length > 0`, even if `canPortfolios` (the matched list) is empty; only the inner `.map()` of tags is guarded. Fix: wrap the whole block (label + tags) in `canPortfolios.length > 0 && (...)`.
3. The "Other CANs Outside Your Division:" caption — same label-guard gap, plus `cansOutsideDivision` is a hardcoded 3-item placeholder (`"Not"`, `"Yet"`, `"Implemented"` — the literal garbage tags visible in production today) that's never actually empty. Change it to an empty array (`[]`) so the same hide-when-empty guard actually suppresses it until real data replaces it in a separate ticket. Confirmed `cansOutsideDivision` is referenced nowhere else in the file, so this is a safe, self-contained change.

### Key Files

- `frontend/src/components/Agreements/AgreementCANReviewAccordion/AgreementCANReviewAccordion.jsx` — remove the "do not have a CAN" message (lines 201–208); `<p>{instructions}</p>` stays unconditional per UX feedback (tackled in a separate ticket); wrap the full Portfolios caption block (not just its tag list) in `canPortfolios.length > 0`; set `cansOutsideDivision` to `[]` and wrap its full caption block the same way (drop the now-redundant `cansWithPendingAmount.length > 0` inner check).
- `frontend/src/components/Agreements/AgreementCANReviewAccordion/AgreementCANReviewAccordion.test.jsx` — currently zero coverage of the empty-state message, Portfolios caption, or Outside-Division caption (confirmed via grep: every existing fixture has at least one budget line with a non-null `can`); add cases for all three, nothing currently asserted will break.
- `frontend/src/components/UI/Cards/BudgetCard/BudgetCard.jsx` — add an optional prop (default `true`) to conditionally render the spending footnote block.
- `frontend/src/components/UI/Cards/BudgetCard/BudgetCard.test.jsx` — existing test at line 56 asserts the footnote text with no prop passed, so it keeps passing unmodified under the new default; add a case for the prop set to hide it.
- `frontend/src/components/CANs/CANFundingCard/CANFundingCard.jsx` — pass the new prop as `false` to `BudgetCard`. Confirmed `CANFundingCard` has only one consumer (`AgreementCANReviewAccordion.jsx`), so hardcoding this is safe.
- `frontend/src/components/CANs/CANFundingCard/CanFundingCard.test.jsx` — add a case confirming the footnote is not rendered via `CANFundingCard`.
- `frontend/src/components/CANs/CANSummaryCards/CANSummaryCards.jsx` — reference only; confirmed zero changes needed, no existing prop name collides with the new one, keeps the default (footnote still shows there).
- `frontend/src/pages/agreements/review/ReviewAgreement.jsx` — the "Change BL Status" page where the primary bug is user-visible; no code change expected, but verify against it.
- `frontend/src/pages/agreements/modifications/StartModification.jsx` — has a pre-existing workaround for the same root-cause bug; not required to touch, but worth a look since the fix may make its custom fallback redundant.

### Testing Strategy

Vitest + RTL unit tests only (per `docs/TESTING.md`'s decision matrix: "Component rendering" → Unit). No Cypress component test or E2E needed — this is conditional-rendering logic with no multi-step state or complex DOM interaction.

- `AgreementCANReviewAccordion.test.jsx`: add cases for (1) `selectedBudgetLines=[]` — assert the "do not have a CAN" text is absent, instructions paragraph still renders, heading still renders; (2) selected lines present but none carry a `can` — same assertion; (3) `canPortfolios` empty — assert the "Portfolios:" label is entirely absent, not just the tags; (4) **with `cansWithPendingAmount.length > 0` (an actual CAN selected)** — assert "Other CANs Outside Your Division:" is absent, so the test exercises the inner caption-block guard directly rather than trivially passing via the outer empty-state guard; (5) positive case — assert "Portfolios:" **does** render (label + tags) when `canPortfolios` is non-empty, so an inverted guard condition can't slip through unnoticed.
- `BudgetCard.test.jsx`: assert the spending footnote renders by default and is absent when the new prop opts out.
- `CanFundingCard.test.jsx`: assert the footnote is not rendered when going through `CANFundingCard`.
- Prefer a single text-based query over combining it with an `id`-selector check (e.g. `#can-review-zero-results`) — the latter is an implementation detail once the whole element is removed.
- Avoid CSS-class/style-only assertions; assert on rendered text/role content, per the existing files' pattern.

### Constraints

- No Figma design is attached to the issue; scope decisions in this story were confirmed directly with the developer instead.
- Wiring real "CANs outside your division" data stays out of scope — this story only empties the stub array so the existing hide-when-empty guard behaves correctly until a real data source lands.
- The new `BudgetCard` prop must default to showing the footnote, so `CANSummaryCards.jsx` (and any other future consumer) is unaffected.
- Accordion heading and the instructions paragraph always render regardless of data, per UX feedback; only the "do not have a CAN" body message and the Portfolios/Outside-Division label gaps are fixed. A more comprehensive fix for the instructions text is tracked as a separate ticket.
- `StartModification.jsx`'s existing workaround is not required to be removed/simplified by this story, even though the root-cause fix may make it redundant.
