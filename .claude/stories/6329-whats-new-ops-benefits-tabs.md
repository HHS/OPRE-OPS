---
issue: 6329
branch: OPS-6329/whats-new-ops-benefits-tabs
---

# Homepage: What's New tab & OPS Benefits tab

## Goal

Build the "What's New" and "OPS Benefits" tabs for the redesigned, feature-flagged homepage, reusing as much of the existing Release Notes and OPS Benefits content as possible to minimize rework against the not-yet-merged homepage-redesign PR (#6338).

## Acceptance Criteria

- [x] "What's New" tab renders per the updated Figma design
- [x] User can see information related to what's new
- [ ] User can easily discern the status of OPS development
- [x] "OPS Benefits" tab renders per the updated Figma design
- [x] User can see information related to OPS's benefits

## Technical Details

### Approach

Gated behind the same `isHomepageRedesignEnabled()` flag (`VITE_FEATURE_HOMEPAGE_REDESIGN`) introduced by PR #6338. To minimize conflicts/rework whichever PR merges first, this story recreates that flag helper and the `HomeIndex`/`HomeLanding` shape identically if #6338 hasn't merged yet, so a rebase in either direction is close to a no-op.

Tabs nav (reusing `src/components/UI/Tabs`) lives inside a new intermediate layout — `HomeLanding` renders the welcome message + OPS Updates cards + Tabs nav, then an `<Outlet/>` for the active tab, nested one level deeper than the existing `/` → `Home` → children pattern already in `index.jsx`. The feature-flag branch (redesign vs. legacy) moves to this new layout layer rather than being duplicated per-route.

- **What's New tab**: reuses `ReleaseNotes.jsx`'s data (`data.js`) and list-rendering, extracted into a shared piece with a mode flag — legacy keeps the latest release always-expanded (unchanged), the new tab wraps it in the existing `Accordion` component like the older releases already are.
- **OPS Benefits tab**: reuses the existing `HoverCard` grid from `BenefitsGrid.jsx` (extracted into a shared sub-component), paired with a new left-aligned "OPS Benefits" h2 + subtitle ("OPS brings everyone together for transparent and collaborative budget planning and tracking. Explore more details below.") replacing the legacy centered header + flourish-image divider.
- **OPS at a Glance tab**: out of scope (owned by sibling issue #6330) — this story only adds a minimal placeholder route so the tab nav has somewhere to go.

### Key Files

- `frontend/src/helpers/featureFlags.js` (new, or reused if #6338 lands first)
- `frontend/src/pages/home/HomeIndex.jsx`, `HomeLanding.jsx` (new/edited — layout + tabs nav + Outlet)
- `frontend/src/pages/home/whats-new/WhatsNewContent.jsx` (+ test) — new
- `frontend/src/pages/home/ops-benefits/OpsBenefitsContent.jsx` (+ test) — new
- `frontend/src/pages/home/ops-at-a-glance/OpsAtAGlanceContent.jsx` (+ test) — new, placeholder only
- `frontend/src/pages/home/release-notes/ReleaseNotes.jsx` — edited, extract shared list rendering with an accordion-mode flag
- `frontend/src/pages/home/BenefitsGrid.jsx` — edited, extract shared `HoverCard` grid
- `frontend/src/index.jsx` — new nested routes for the tabs

### Testing Strategy

- Vitest + RTL unit/component tests, co-located `.test.jsx`, for all new and edited components — matches the existing pattern (`BenefitsGrid.test.jsx`, `ReleaseNotes.test.jsx`). No Cypress CT: tab-switching between static panels and reuse of the already-tested `Accordion`/`Tabs` components don't meet the "complex interactive component" bar.
- **E2E deferred**: `VITE_FEATURE_HOMEPAGE_REDESIGN` is a Vite build-time flag and CI builds the E2E app once per run, so `mainPage.cy.js` can't toggle it per-spec. Flipping it on would also require rewriting that spec's existing legacy `/` assertions in the same change. Tracked separately in #6345 (sub-issue of #6221), to be done once the whole redesign (this story + #6330 + #6328/#6338) is merged and the flag flips for good. Noted on #6221 as a dev requirement.
- "Renders per the updated Figma design" and "user can easily discern the status of OPS development" are visual/UX-fidelity criteria that `docs/TESTING.md` excludes from automated testing (visual styling without regression tooling) — verified via manual/visual check against Figma rather than an automated assertion.

### Constraints

- Depends partly on #6338's "OPS Updates" summary cards for the "status of OPS development" AC — if #6338 isn't merged when this work starts, minimal equivalents will be stubbed to unblock, per the approach above.
- OPS at a Glance tab content is explicitly out of scope (#6330); only a placeholder route is added here.
- `Tabs` component uses buttons + `navigate()` with exact-path matching, not `<Link>`/`NavLink` — consistent with existing usage, not a blocker.
- E2E coverage for these new routes is tracked in #6345, not this story.
