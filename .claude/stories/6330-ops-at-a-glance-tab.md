---
issue: 6330
branch: OPS-6330/ops-at-a-glance-tab
---

# Homepage: OPS at a Glance tab (mocked data)

## Goal

Build the "OPS at a Glance" tab for the redesigned, feature-flagged homepage: a 3-column status board (Done / Currently Developing / Not Started Yet) using mocked data, per the Figma design.

## Acceptance Criteria

- [ ] "OPS at a Glance" tab renders per the updated Figma design
- [ ] Data viz displays using mocked data
- [ ] Layout matches design annotations across supported viewports

## Technical Details

### Approach

Replaces the placeholder stub at `OpsAtAGlanceContent.jsx` (cherry-picked scaffolding from OPS-6329/#6346, since #6338/#6346 aren't merged yet) with the real tab content.

Verified via a direct Figma frame screenshot (not raw metadata — the metadata contained orphaned, off-canvas donut-chart/line-graph/dropdown instances left over from a shared template that are **not** part of the actual rendered design): the tab is a header (h2 + subtitle) followed by one full-width card with 3 columns — "Done" (count + green `Tag` pills), "Currently Developing" (count + orange pills), "Not Started Yet" (count + blue pills), plus a footnote. No chart/graph component is used despite the issue's "data viz" wording; this is a deliberate, verified deviation from the literal ticket wording in favor of the actual design.

**Only "Not Started Yet" is alphabetically sorted** (per the footnote, which appears only under that column) — sorted at render time. "Done" and "Currently Developing" render in whatever order their items are authored in `data.js` (curated/UX-driven order, not sorted).

Reuses `RoundedBox` and `Tag` (both already used by `ReleaseNotesCards`/`ReleaseNote`) rather than `src/components/UI/DataViz/`. Counts/grouping derived at render time from mock data, same pattern as `ReleaseNotes.jsx`'s type-count derivation — no extracted pure-function helper needed (single-use display logic, not shared business logic like `computeDisplayPercents`). Status label strings centralized in a `constants.js`, mirroring `release-notes/constants.js`. The 3 columns use explicit USWDS responsive grid classes (`grid-row` + `tablet:grid-col-4`) so they stack on mobile instead of a plain flex row.

### Key Files

- `frontend/src/pages/home/ops-at-a-glance/OpsAtAGlanceContent.jsx` (replace placeholder)
- `frontend/src/pages/home/ops-at-a-glance/RoadmapStatusCard.jsx` (new, + test)
- `frontend/src/pages/home/ops-at-a-glance/data.js` (new, mocked `{ id, title, status }` items — "Done"/"Currently Developing" in curated order, "Not Started Yet" sorted alphabetically at render)
- `frontend/src/pages/home/ops-at-a-glance/constants.js` (new, status label strings)
- `frontend/src/pages/home/ops-at-a-glance/OpsAtAGlanceContent.test.jsx` (update from placeholder test)

### Testing Strategy

Vitest + RTL only, matching `ReleaseNotes.test.jsx`'s precedent: assert column headings, counts, curated order for Done/Currently Developing, and alphabetical order for Not Started Yet. No Cypress CT — this codebase has zero existing CT specs, and a static tag/count display doesn't meet TESTING.md's "complex interactive component" bar. No new E2E — same build-time-flag constraint tracked in #6345.

The "renders per Figma design" and "layout matches across viewports" ACs have **no automated test path** — not because `docs/TESTING.md` explicitly excludes them, but because this repo has no visual-regression or viewport-automation tooling at all (verified: zero `cy.viewport` usage anywhere). These are accepted manual-QA risk, same as the sibling story, stated plainly rather than implied as "covered."

### Constraints

- Real data wiring is explicitly out of scope — deferred to #6331.
- Branch scaffolding (`featureFlags.js`, `HomeLanding.jsx`, routing, the placeholder this story replaces) was cherry-picked byte-identical from OPS-6329 (#6346) to minimize rebase conflict once that PR (and #6338) merge.
- `whats-next/data.js` already models a roadmap-ish dataset but with a different, incompatible vocabulary (`priority`, `levelOfEffort`, 6-value status enum) — intentionally not reused/shared with this tab's simpler 3-bucket model.
