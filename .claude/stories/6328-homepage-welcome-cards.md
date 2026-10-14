---
issue: 6328
branch: OPS-6328/homepage-welcome-cards
---

# Homepage welcome text logic + Release Notes Summary & Currently Developing cards (mocked data)

## Goal

Build the welcome message logic and two new homepage cards (Release Notes Summary and
Currently Developing & Next Up) with mocked data, feature-locked behind an env var so
the full homepage redesign ships to users all at once.

## Acceptance Criteria

- [ ] User sees a "Welcome [first name]" message at the top of the homepage after logging in for the **first time**
- [ ] User sees a "Welcome back [first name]" message at the top of the homepage on **subsequent** logins
- [ ] If first name doesn't exist, user sees a generic "Welcome" / "Welcome back" message depending on first vs. subsequent login
- [ ] Release Notes Summary Card renders per design (mocked data)
- [ ] "Currently Developing & Next Up" Card renders per design (mocked data)

## Technical Details

### Approach

Adapt `ReleaseNotesCards.jsx` for the Release Notes Summary Card. Build the Currently
Developing & Next Up card with its own curated data file (not a filter on the existing
`whats-next/data.js` — content is selectively highlighted, not status-driven). Detect
first login via `localStorage` keyed per user (`hasVisited_<userId>`), read after
`activeUser` hydrates. Feature-lock all new UI behind `VITE_FEATURE_HOMEPAGE_REDESIGN`.

### Key Files

- `frontend/src/pages/home/Home.jsx` — add welcome message (guards on `activeUser?.id`)
- `frontend/src/pages/home/BenefitsGrid.jsx` — current default `""` child route; will be displaced or modified by new homepage content
- `frontend/src/pages/home/release-notes/ReleaseNotesCards.jsx` — adapt for homepage summary card; `LeftCard` is currently unexported, will need to be exported or extracted
- `frontend/src/pages/home/release-notes/data.js` — existing release notes data (card reads `data[0]`)
- `frontend/src/pages/home/whats-next/WhatsNextTableRow.jsx` — reuse for card row rendering
- New: `frontend/src/pages/home/whats-next/homepage-card-data.js` (or similar) — curated "Currently Developing & Next Up" entries, separate from the full What's Next table
- New: `frontend/src/pages/home/WelcomeMessage.jsx` — isolated component for testability
- `frontend/.env.local` — add `VITE_FEATURE_HOMEPAGE_REDESIGN=true`

### Testing Strategy

- **Welcome message logic** — Vitest unit tests for the first-login detection helper and name fallback. Follow `MultiAuthSection.test.jsx` localStorage mock-wiring pattern (`vi.fn()` stubs wired to a real Map in `beforeEach`).
- **New card components** — Vitest + RTL with `renderWithProviders` and `preloadedState`. Follow `Home.test.jsx` pattern.
- **Feature flag conditional rendering** — Vitest + RTL. No prior art for `vi.stubEnv('VITE_...', ...)` in this repo — spike first to confirm it works, or extract the flag read into `src/helpers/featureFlags.js` and `vi.mock` it (safer, consistent with existing patterns).
- No E2E, no Cypress CT — cards are presentational with static/mocked data.

### Constraints

- `activeUser` is null during auth hydration — read and write the `localStorage` key only inside a `useEffect` watching `activeUser?.id`, otherwise the key becomes `hasVisited_null`.
- `LeftCard` in `ReleaseNotesCards.jsx` is unexported — export it or extract a new shared component before reuse.
- The Currently Developing & Next Up card must use its **own curated data file**, not a filter on `whats-next/data.js`. UX content is selectively highlighted, not status-driven. The UX team's Claude skill will need to manage two separate lists.
- Data format: consider JSON over a JS module for the curated card data — same effort now, easier for the skill to edit (no JS syntax), and cleaner migration path to an API later. Decision and format should be coordinated with #6331 (data wiring follow-up) to avoid throwing away work.
- No `.env.example` exists in the repo — document `VITE_FEATURE_HOMEPAGE_REDESIGN` in the PR description and check CI/deployment configs for any `VITE_*` injection points.
