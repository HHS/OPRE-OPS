---
issue: 6221
branch: OPS-6221/homepage-fixes
---

# Redo OPS home page to focus on whats new/next

## Goal

Address UX review feedback on the already-implemented homepage redesign: add a missing caption, fix incorrect caption copy, and correct a misused chart color on status/type tags across the homepage.

## Acceptance Criteria

- [ ] "What's New" summary card (left-hand side of homepage) has a caption, matching Figma
- [ ] "OPS at a Glance" caption text is corrected to match Figma
- [ ] "Done" status tag green color is fixed (currently reuses a budget-chart color instead of a semantic color)
- [ ] "Improvements" tag color in the homepage summary card matches Figma
- [ ] "Improvements" tag color on the full release-notes list (What's New tab) matches Figma, for consistency with the summary card
- [ ] "OPS at a Glance" alphabetical-order footnote is positioned below all three roadmap columns (left-aligned under "Done"), not nested under "Not Started Yet"

## Technical Details

### Approach

This story is mostly already implemented — these are targeted fixes. Only 3 of the 5 AC items (left-card caption, roadmap caption text, "done" tag color) come directly from the UX reviewer's GitHub comment; the other 2 (both "Improvements" tag color fixes) are a developer extrapolation — same wrong CSS class reused for a different, un-reviewed tag — explicitly confirmed in-scope rather than deferred for separate UX sign-off. Explicitly out of scope: global spacing between instruction text and summary cards, testing the "update-release-notes" skill's data accuracy, and a global tag text/background-color fix — all tracked as separate GH issues.

### Key Files

- `frontend/src/pages/home/release-notes/ReleaseNotesCards.jsx` — `LeftCard` (lines ~20-73) needs a caption added; "Improvements" tag color (~line 63) needs fixing
- `frontend/src/pages/home/release-notes/ReleaseNotesSummaryCard.jsx` — thin wrapper that's the actual integration point rendered on the homepage (`HomeLanding.jsx:38`); check its test file too when adding the caption
- `frontend/src/pages/home/ops-at-a-glance/OpsAtAGlanceContent.jsx` (lines ~9-18) — caption text needs correcting
- `frontend/src/pages/home/roadmapStatus.constants.js` (lines ~13-20) — `ROADMAP_STATUS_TAG_CLASSES[DONE]` currently uses `bg-brand-can-budget-by-fy-graph-4`; shared by `RoadmapStatusCard.jsx` and `CurrentlyDevelopingCard.jsx` (note: `CurrentlyDevelopingCard` never renders the DONE status, so it isn't visually affected by this particular fix). Lines 13-17 have a comment claiming axe-core verified WCAG AA contrast for the current combos — must be re-verified and updated once the color changes
- `frontend/src/pages/home/release-notes/ReleaseNote.jsx` (line ~15) — independent `typeClasses` map also uses the same wrong green for the "Improvements" tag on the full release-notes list page
- `frontend/sass/uswds/styles.scss` (lines ~34-36, ~81) — defines the semantic `--feedback-success` family as a candidate alternative to the misused `--can-budget-by-fy-graph-4` chart color, which is also legitimately used by actual CAN budget-by-FY charts (`frontend/src/constants.js:33`, `CanCard.jsx`, `CanFunding.jsx`) — fix must stay at the `bg-brand-*` utility-class level, not touch the shared SCSS var
- `frontend/src/pages/home/CurrentlyDevelopingCard.jsx` — has the identical no-caption pattern as `LeftCard` and sits as its sibling under the same "OPS Updates" heading in `HomeLanding.jsx`; confirm against Figma whether it needs a caption too for parity (not assumed in scope)
- `frontend/src/pages/home/ops-at-a-glance/OpsAtAGlanceContent.test.jsx` (line 9) — asserts `/This is an overview of OPS development/`, a partial regex, not the full caption verbatim. It only breaks if the leading clause changes; update it regardless so it matches the new copy exactly

### Testing Strategy

Visual check against Figma (node-id=36712-59056) for all caption and color changes. Color-class swaps (`roadmapStatus.constants.js`, `ReleaseNotesCards.jsx` Improvements tag, `ReleaseNote.jsx`) need no new tests — no existing test asserts `className` or color, and `docs/TESTING.md` exempts CSS-only changes. The new `LeftCard` caption is different: `ReleaseNotesCards.test.jsx` already asserts every other visible string in that component (headings, counts, pluralization), so add a matching assertion for the new caption text to stay consistent with this file's own convention — don't skip it as "just styling." Update `OpsAtAGlanceContent.test.jsx:9` to match the new caption copy. No E2E coverage needed (no existing Cypress spec asserts caption/color here).

### Constraints

- Ignore (tracked as separate GH issues): global spacing adjustment between instruction text and summary cards; testing the "update-release-notes" Claude skill for data accuracy; global tag text/background-color fix (should be `#264A64`)
- Exact caption wording and exact color values should be confirmed against Figma during implementation, not guessed from code
- When changing the "done" tag color, re-verify WCAG AA contrast (e.g. with axe-core) and update the stale comment at `roadmapStatus.constants.js:13-17` — don't assume a semantic-sounding class like `feedback-success-light` passes contrast with `text-ink` without checking
