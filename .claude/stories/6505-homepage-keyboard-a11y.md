---
issue: 6505
branch: OPS-6505/homepage-keyboard-a11y
---

# a11y: Homepage keyboard navigation and focus management fixes

## Goal

Fix the focus-management defects a keyboard-only audit found on the homepage (`/`) — "Return to top" not moving focus, no skip link, and unverified header control names/dropdown keyboard behavior — and make a focus-order decision for the header, so a full keyboard-only pass is clean with no regressions.

## Acceptance Criteria

- [x] A full keyboard-only pass of the homepage (Tab and Shift+Tab) shows a visible focus ring on every stop and no focus traps.
- [x] "Return to top" moves focus along with the view.
- [x] The skip link works and is visible on focus.
- [x] VoiceOver announces every header control with a name and role.
- [x] No visual design changes beyond focus styles for the skip link.
- [x] Audit re-run with no regressions.

## Technical Details

### Approach

Five fix areas from the issue, investigated in the actual codebase (no developer-supplied approach — all inferred):

1. **"Return to top" doesn't move focus.** `Footer.jsx`'s `scrollToTop` handler only calls `window.scrollTo(...)`, never `.focus()`. Fix: after scrolling, focus a stable top-of-page target — add `tabIndex={-1}` to the existing `<main id="main-content">` in `DefaultLayout.jsx` and call `.focus({ preventScroll: true })` on it from the footer's click handler (`preventScroll` matters because `html { scroll-behavior: smooth }` is set globally — without it, focusing refights the scroll). Consider focusing the new skip link (item 2) instead once it exists, to avoid two separate "top of page" anchors — these two fixes should land together.
2. **No skip link.** Doesn't exist anywhere in the codebase. USWDS already ships a fully-styled, already-correct `.usa-skipnav` utility class in the compiled `src/uswds/css/styles.css` (off-screen until focus, `#005ea2` underlined link, no new SCSS needed) — just unused today. `DefaultLayout.jsx` already renders `<main id="main-content">` as the landmark target. Fix: add `<a className="usa-skipnav" href="#main-content">Skip to main content</a>` as the first element (in `Header.jsx` or immediately before it), and add `tabIndex={-1}` to the existing `<main id="main-content">`. No client-side-routing wiring needed — `DefaultLayout` wraps every route, and it's a same-page anchor, not a route change.
3. **Header buttons with no accessible name — verify first.** Static read of every header control (`NavMenu.jsx` Reporting/Create toggles, `AuthSection.jsx` Sign-Out, `HeaderSearch.jsx` submit/clear/input, `SearchInfoTip.jsx`, `NotificationCenter.jsx` bell/close) found every one already has visible text or an explicit `aria-label`. **The issue's premise likely doesn't hold** — treat this as a live VoiceOver/inspector verification step expected to close with no code change, per the issue's own "confirm first, close if already exposed" instruction. Only write a fix if the live pass finds something static reading can't see.
4. **Header focus order — design decision, not an engineering task.** Confirmed DOM/tab order matches the issue exactly: logo → nav (Home…Help Center, incl. Reporting/Create toggles) → email → Sign-Out → notification bell → search input → search submit → info button (`Header.jsx` → `NavMenu.jsx` → `AuthSection.jsx` → `HeaderSearch.jsx`, in that render order). The issue names 3 options and explicitly says to revisit after the skip link ships, since it reduces the impact. **Carry this as an open decision for the developer/designer, not a task to implement yet** — don't guess an order.
5. **Verify tooltip, dropdown, and landmark behavior.**
   - Info tooltip Esc + hover-persistence (WCAG 1.4.13): already implemented in `SearchInfoTip.jsx` (tracks hover/focus state, capture-phase Esc handler with `stopPropagation`). Verify only, no fix expected.
   - Landmarks (`header`, `nav aria-label`, search `role="search"`): already present and labeled in `Header.jsx` / `HeaderSearch.jsx`. Verify only, no fix expected.
   - **Reporting/Create dropdowns — real gap found.** `NavMenu.jsx` has no `onKeyDown` for Escape and no focus-return-to-toggle logic at all (confirmed reading the full file). USWDS's own JS (which would normally supply this) is commented out at `src/index.jsx:66`, so there's no "just re-enable it" shortcut — this needs hand-coded Esc-close + focus-return in React for both submenus (`reporting-nav-section`, `basic-mega-nav-section-two`).

**Additional defect found during investigation, not in the original issue**: `frontend/src/components/UI/Tabs/Tabs.module.scss` sets `outline: none` on `.listItemSelected`/`.listItemNotSelected` (lines 45, 53) with no replacement focus style. `HomeLanding.jsx` renders `<Tabs>` directly for the What's New / OPS at a Glance / OPS Benefits tabs — tabbing to them today shows **no visible focus indicator at all**, directly violating AC1. Add a `:focus-visible` ring (matching USWDS's `#2491ff`) to both classes without changing their unfocused appearance.

### Key Files

- `frontend/src/components/UI/Footer/Footer.jsx` — fix 1 (add focus call after scroll)
- `frontend/src/components/Layouts/DefaultLayout/DefaultLayout.jsx` — fix 1 & 2 (`tabIndex={-1}` on `#main-content`)
- `frontend/src/components/UI/Header/Header.jsx` — fix 2 (skip link markup), fix 4 (tab-order source)
- `frontend/src/components/UI/Header/NavMenu.jsx` — fix 4 (tab-order source), fix 5 (Esc-close + focus-return for Reporting/Create dropdowns — real work)
- `frontend/src/components/Auth/AuthSection.jsx` — fix 4 (tab-order source), fix 3 (verify Sign-Out already labeled)
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.jsx` — fix 4 (tab-order source), fix 3 (verify already labeled)
- `frontend/src/components/UI/Header/HeaderSearch/SearchInfoTip.jsx` — fix 5 (verify only, already implemented), fix 3 (verify already labeled)
- `frontend/src/components/UI/NotificationCenter/NotificationCenter.jsx` — fix 3 (verify bell/close already labeled)
- `frontend/src/components/UI/Tabs/Tabs.module.scss` — new finding: missing focus style on homepage tab buttons (AC1)
- `frontend/src/components/UI/Tabs/Tabs.jsx` / `frontend/src/pages/home/HomeLanding.jsx` — where the Tabs component is rendered on the homepage
- `frontend/src/index.jsx:66` — context: USWDS JS import is commented out, explains why fix 5's dropdown behavior isn't free
- `frontend/src/hooks/useScrollToTop.js`, `frontend/src/helpers/scrollToTop.helper.js` — existing route-change scroll behavior; confirms `preventScroll` need for fix 1, not itself a fix target
- `frontend/src/uswds/css/styles.css` / `sass/uswds/styles.scss` — confirms `.usa-skipnav` is already compiled in, ready to reuse for fix 2 (no new SCSS)

### Testing Strategy

- **Extend `frontend/cypress/e2e/mainPage.cy.js`** (already covers `/`, runs `cy.injectAxe(); cy.checkA11y();` in `afterEach`) with new keyboard-interaction assertions, following this repo's existing `.focus()`/`.click()`/`.type("{esc}")` + `cy.focused()` pattern (already used in `agreementsPaginationAccessibility.cy.js`, `saveChangesToEdits.cy.js` — no new Cypress plugin needed):
  - Return-to-top click → `cy.focused()` lands on `#main-content`.
  - Skip link is reachable as the first focusable element, visible on focus, activating it moves focus to `#main-content`.
  - Once fix 4's order is decided: sequential Tab-order assertions for the header (not written until the decision is made).
  - If the live audit confirms a Reporting/Create dropdown Esc/focus-return defect and it's fixed: a targeted assertion for that interaction.
- **New `Tabs.test.jsx` (or extend existing) RTL assertion** that the tab buttons have a visible focus style — or cover this via the Cypress a11y pass since it's a CSS-only fix; prefer whichever is already established for `Tabs.jsx` (check for an existing test file first).
- **Confirm `mainPage.cy.js` is covered by the a11y regression gate or allowlist** (`cypress/support/commands.js` / `a11yAllowlist.js`) — today a new axe violation on `/` could pass silently depending on gate state; this affects whether axe's `button-name`/`landmark-*` rules actually enforce anything for fix 3/5's verify-only items.
- **Fix 3 (header button names) and fix 4 (focus order, once decided)**: axe via the Cypress check is the backstop; a dedicated RTL `Header.test.jsx`/`NavMenu.test.jsx` assertion (`getByRole("button", {name: ...})`) is the "lowest appropriate level" primary test if fix 3 does turn out to need a code change.
- **Stays manual-only**: the full keyboard-only Tab/Shift+Tab/Enter/Space/Esc pass with a screenshot per stop, and VoiceOver/Safari testing — per the issue's own "Test method" section; axe does not catch focus-order or focus-movement-after-interaction issues, and screen-reader announcement correctness isn't something this repo's tooling can assert.
- Fix 4 has no automated test until the design decision is made — that's inherent to it being undecided, not a testing gap.

### Constraints

None noted — developer had nothing to add beyond the issue and asked for the codebase investigation to fill in the rest.

## Resolution

Implemented against the actual running app (Playwright, real Tab/Enter/Esc key events — not simulated) and verified each AC directly:

1. **Skip link (AC3).** Added `<a className="usa-skipnav" href="#main-content">Skip to main content</a>` as the first element in `DefaultLayout.jsx`, and `tabIndex={-1}` on the existing `<main id="main-content">`. Live-verified: it's the literal first Tab stop on page load, visible on focus (screenshotted), and activating it moves `document.activeElement` to `#main-content`. No new SCSS — reused USWDS's already-compiled `.usa-skipnav`, so AC5 (no visual changes beyond focus styles) holds.
2. **Return to top (AC2).** `Footer.jsx`'s `scrollToTop` now also calls `document.getElementById("main-content")?.focus({ preventScroll: true })`. Live-verified: scroll settles at `scrollY: 0`, focus lands on `#main-content`, and the next Tab continues to the "What's New" tab (top of the page) — not back to the footer logo as before.
3. **Header button names (AC4) — verified, no code change.** The issue's own premise didn't hold: a live axe scan (0 violations) and a direct read of the Chromium accessibility tree showed every header control already correctly named — Reporting, Create, Sign-Out, View notifications, Search, What can I search for?. Closed as "verified, no defect" per the issue's own "confirm first" instruction.
4. **Header focus order — left as an open decision**, per the issue's explicit instruction to revisit after the skip link ships. Not implemented; flagging for the developer/designer to pick one of the 3 named options in a follow-up.
5. **Verify-only items — confirmed working as-is**: the info tooltip shows on focus and is fully removed (not just hidden) on Esc (live-verified); landmarks (`banner`, `nav` with `aria-label`, `search`) are present and correctly labeled (confirmed in the accessibility tree). **Reporting/Create dropdowns — real fix needed and applied**: added an Esc handler (`closeMenuOnEscape` in `NavMenu.jsx`) wired to both toggle buttons and every link inside their submenus (not the `<ul>` itself — `jsx-a11y/no-noninteractive-element-interactions` correctly flags attaching keyboard handlers to a non-interactive list; moved the handler onto each interactive `NavLink` instead). Live-verified for both "Reporting" and "Create": Esc from either the toggle or any item inside the open submenu closes it and returns focus to the toggle.
6. **Visible focus ring, no traps (AC1).** Found and fixed one additional defect beyond the original issue: `Tabs.module.scss` set `outline: none` on the homepage's What's New/OPS at a Glance/OPS Benefits tab buttons with no replacement, so they had **zero visible focus indicator**. Added a `:focus-visible` ring matching USWDS's `#2491ff` outline. Live-verified via computed style (`outline-style: solid`, `outline-width: 4px`, `outline-color: rgb(36, 145, 255)`) and screenshot.

**Testing**: `mainPage.cy.js` extended with 4 new keyboard-interaction assertions (skip link, return-to-top focus, tab focus ring, Create-dropdown Esc/focus-return), following the repo's existing `.focus()`/`.click()`/`.type("{esc}")` + `cy.focused()` house style — no new Cypress plugin needed. Run 3x clean, 0 flakiness. Added unit tests for `Footer.jsx` (new file) and extended `NavMenu.test.jsx` with 6 new Esc-close/focus-return cases — confirmed each fails without its corresponding fix (regression-tested the regression tests) before restoring the fix. `mainPage.cy.js` is not in the CI a11y regression-gate's spec list, but that's moot: the gate only matters for allowlisted violations, and the plain `cy.checkA11y()` assertion already hard-fails on any violation regardless of gate state (confirmed from OPS-3801's investigation of the same mechanism).

Full frontend unit suite: 5395 passing, 0 failures. Spot-checked `headerSearch.cy.js` and `agreementList.cy.js` (other pages sharing `Header`/`NavMenu`/`Footer`) for regressions: all passing.
