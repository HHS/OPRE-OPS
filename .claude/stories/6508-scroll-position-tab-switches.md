---
issue: 6508
branch: OPS-6508/tab-scroll-restore
---

# Keep scroll position on tab switches; restore it on Back/Forward

## Goal

Tab switches (homepage, CAN details, Help Center) currently reset page scroll to the top; this story stops that for tab switches while keeping scroll-to-top on real page changes, restoring scroll position on Back/Forward, and respecting `prefers-reduced-motion`.

## Acceptance Criteria

- [ ] Replace the app-wide `useScrollToTop()` call in `frontend/src/App.jsx` with React Router's `<ScrollRestoration />` (we already use `createBrowserRouter`, so it's supported). Delete `frontend/src/hooks/useScrollToTop.js` if nothing else uses it.
- [ ] In `frontend/src/components/UI/Tabs/Tabs.jsx`, navigate with `{ preventScrollReset: true }` (`useTrailNavigate` passes options through). If the tab nav's top is above the viewport, call `scrollIntoView({ block: "start" })` on it.
- [ ] Remove the `scrollToTopOnChange` prop and its scroll-wait/rAF polling logic from `Tabs.jsx`, and drop the prop from `frontend/src/pages/home/HomeLanding.jsx`.
- [ ] Use `behavior: "auto"` when `prefers-reduced-motion: reduce` matches.
- [ ] Update `Tabs.test.jsx` for the new behavior (no reset when the tabs are visible, scroll the tabs into view when they're off-screen, `preventScrollReset` passed).
- [ ] Manually check: homepage tabs, CAN detail tabs, Help Center tabs, a list page to a detail page (top), Back from a detail page (position restored).

## Technical Details

### Approach

As implemented (deviations from the issue text are called out):

- **`<ScrollRestoration />` lives in a new root layout route** (`RootLayout`, wired in `src/index.jsx`), not in `App.jsx`. `App` is re-rendered per page, and `<ScrollRestoration />` turns off the router's position saving when it unmounts, so mounting it in `App` broke Back/Forward restoration (verified in the browser: Back landed at 0). `App.jsx` just drops the `useScrollToTop()` call; `useScrollToTop.js` is deleted.
- `Tabs.jsx` navigates with `{ preventScrollReset: true }` through `useTrailNavigate`. A layout effect brings the tab bar back with `scrollIntoView({ block: "start" })` only when the tab bar ends up above the viewport after a tab click (tracked by the clicked path, so Back/Forward and blocked navigations never trigger it). The `scrollToTopOnChange` prop and its rAF/timeout polling are gone, and `HomeLanding.jsx` no longer passes it.
- **Reduced motion is handled in CSS**, not with `behavior: "auto"` in JS: the global `html { scroll-behavior: smooth }` rule animated every scroll (including `behavior: "auto"`), so the rule now switches to `auto` under `prefers-reduced-motion: reduce` (`sass/uswds/styles.scss`, recompiled `styles.css`). `scrollIntoView` passes no `behavior` and follows the CSS.
- **Query-only navigations now pass `preventScrollReset`**, because `<ScrollRestoration />` resets on every new history entry while the old hook only reset on pathname changes. Without this, these would have started jumping to the top: Agreements / Budget Lines / Procurement Dashboard filter tabs, Portfolio list tabs, the detail-page fiscal-year `?fy=` sync, and search pagination.

### Key Files

- `frontend/src/components/Layouts/RootLayout/` (new) and `frontend/src/index.jsx` — root route with `<ScrollRestoration />`
- `frontend/src/App.jsx` — `useScrollToTop()` removed; `frontend/src/hooks/useScrollToTop.js` deleted
- `frontend/src/components/UI/Tabs/Tabs.jsx` and `Tabs.test.jsx`
- `frontend/src/pages/home/HomeLanding.jsx` — `scrollToTopOnChange` dropped
- `frontend/sass/uswds/styles.scss`, `frontend/src/uswds/css/styles.css` — reduced-motion `scroll-behavior`
- `preventScrollReset` on query-only navigations: `AgreementsTabs.jsx`, `BLITabs.jsx`, `ProcurementDashboardTabs.jsx`, `PortfolioList.hooks.js`, `useDetailFiscalYear.hooks.js`, `SearchResults.hooks.js`
- Test assertions updated: `CanDetailTabs.test.jsx`, `PortfolioList.hooks.test.js`
- `frontend/CLAUDE.md` — scrollToTop note points at the new location

### Testing Strategy

- Vitest + RTL in `Tabs.test.jsx`: `preventScrollReset` passed (with and without breadcrumb trail state); tab bar in view → no scroll; tab bar above viewport after a click → `scrollIntoView({ block: "start" })`; route change without a click (Back/Forward) → no scroll. The old `scrollToTopOnChange` tests are removed.
- No unit test for reduced motion (pure CSS; jsdom can't evaluate it) or for `<ScrollRestoration />` itself (library behavior). Both were verified in the browser.
- No new Cypress spec; the AC's manual checks were run in the browser (see story progress).

### Constraints

None noted.
