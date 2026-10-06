---
issue: 6331
branch: OPS-6329/whats-new-ops-benefits-tabs
---

# Homepage: determine how to feed data to cards & tabs (ops + code)

## Goal

Determine — and document — the best approach, from both an ops and a code perspective, for
feeding real data into the homepage cards and tabs (Release Notes Summary, Currently
Developing & Next Up, What's New, OPS at a Glance), replacing the mocked data used during
initial build (#6328, #6329, #6330). Folded into the OPS-6329 branch/PR (#6346) rather than
its own branch, same as #6330 was.

## Acceptance Criteria

- [x] A recommended approach is documented (this file)
- [x] Approach covers how release-note-driven updates feed OPS at a Glance / Release Notes
      Summary today, and what would change to make that live
- [x] Approach allows updates without a manual code change per release, or the process is
      clearly documented (documented here: still a manual edit for now, with JSON lowering
      the editing bar; live automation is the recommended follow-up)
- [ ] OPS at a Glance data viz updates bi-weekly and matches the release notes' new features
      — partially addressed. The "Currently Developing" bucket was two independently
      hand-authored lists that disagreed; they're now one shared source and their content
      was reconciled to match the mocked release notes' current themes. Keeping it in sync
      release-to-release is still a manual step — not fully solved, see Deferred below.
- [x] Mocked data for Currently Developing / Next Up / Not Started Yet is unified into one
      source instead of two disagreeing ones

## Technical Details

### What was found

Investigating the four data files feeding these surfaces surfaced a concrete bug: `homepageData.js`
(`CurrentlyDevelopingCard`, shown in the "OPS Updates" summary on every tab) and
`ops-at-a-glance/data.js` (`RoadmapStatusCard`, the OPS at a Glance tab) each independently
hand-authored a "Currently Developing" list — and they disagreed, showing different items for
the same conceptual real-world state. That's exactly the kind of drift this issue's AC is
trying to prevent.

Separately, release notes already have a live, structured upstream source that's half-wired
and simply never finished: `.github/workflows/release.yml` runs `semantic-release` on every
merge to `main` (see `docs/adr/028-semantic-releases.md`), which auto-creates a GitHub
Release with a Conventional-Commits-derived changelog. `frontend/src/api/github.js`'s
`useGetReleasesQuery` was already built to fetch this (registered in `store.js`'s reducer)
but is never called by any component — `release-notes/data.js` stays hardcoded instead.

### Decision

- **Release notes**: keep today's workflow for this PR — a human (UX) plus a Claude Code
  session edits `release-notes/data.js` by hand each release. Live-wiring to the GitHub
  Releases API is real, valuable follow-up work, but requires parsing semantic-release's
  generated markdown into this app's per-item `{subject, type, description}` shape and
  handling the public API's 60/hr unauthenticated rate limit (hit from every visitor's
  browser) — correctly out of scope for "replace mock data." Recommend a dedicated
  follow-up issue for this, rather than bundling it here.
- **Currently Developing / Next Up / Not Started Yet**: unify `homepageData.js` and
  `ops-at-a-glance/data.js` into one `frontend/src/pages/home/roadmapData.json`, converted
  from a JS module to JSON per the maintainer's comment on this issue — easier for a non-JS
  editor, no code deploy needed if later served statically, cleaner migration path to a
  backend endpoint. `CurrentlyDevelopingCard` and `RoadmapStatusCard` both now filter the
  same array by `status` (shared `roadmapStatus.constants.js`), so the two surfaces can't
  drift into disagreeing lists again.
  - Reconciling the two lists' disagreeing content: kept `ops-at-a-glance/data.js`'s "Done"
    list unchanged (`homepageData.js` had no "Done" bucket). For "Currently Developing",
    kept `homepageData.js`'s items ("Finish Procurement Tracker", "View & Edit Grants")
    since they thematically match the mocked release notes' current release (Procurement
    Tracker step 6, Grants) — discarded `ops-at-a-glance/data.js`'s disagreeing items. For
    "Not Started Yet", kept `ops-at-a-glance/data.js`'s fuller, consistently-worded 6-item
    list, since `homepageData.js`'s 3-item list was the same underlying items under
    slightly different wording.
- **`whats-next/data.js`**: left untouched. Legacy, flag-off-only page with an incompatible
  6-value status vocabulary (`priority`, `levelOfEffort`, `"In Progress-Development"`, etc.)
  — already deliberately kept separate from the 3-bucket model, per
  `.claude/stories/6330-ops-at-a-glance-tab.md`.

### Deferred to a follow-up issue

- Live-wire release notes to the GitHub Releases API via the existing (dormant)
  `useGetReleasesQuery`, including a markdown-section parser (`### Features` / `### Bug Fixes`
  → `type`/`subject`/`description`) and a caching/rate-limit strategy.
- Formalize "the UX team's Claude skill" that edits this data as an actual `.claude/skills/`
  entry, rather than an ad hoc Claude Code session each release.
- Decide whether/how to reconcile `whats-next/data.js`'s legacy vocabulary with the 3-bucket
  model, if the legacy flag-off homepage is ever retired.

### Key Files

- `frontend/src/pages/home/roadmapData.json` (new) — replaces `homepageData.js` and
  `ops-at-a-glance/data.js`
- `frontend/src/pages/home/roadmapStatus.constants.js` (new) — replaces
  `ops-at-a-glance/constants.js`
- `frontend/src/pages/home/CurrentlyDevelopingCard.jsx` (edited — repointed import, filters
  by status instead of importing pre-split lists)
- `frontend/src/pages/home/ops-at-a-glance/RoadmapStatusCard.jsx` (edited — repointed import
  only, column logic unchanged)

### Testing Strategy

`CurrentlyDevelopingCard.test.jsx` / `RoadmapStatusCard.test.jsx` already mocked their data
module with inline fixtures (not the real file) — repointed at the new shared module path,
same assertions. Added one new assertion to `CurrentlyDevelopingCard.test.jsx` confirming
"Done" items in the shared array are excluded from both of its columns, since that filtering
is now live behavior rather than a pre-split import.

### Constraints

- `roadmapData.json` is still manually authored/maintained — this issue reduces drift and
  lowers the editing bar (JSON, no JS syntax) but does not yet automate updates.
- Real data wiring for release notes is explicitly deferred, per the Decision above.
