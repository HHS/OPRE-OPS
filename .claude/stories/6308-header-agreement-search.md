---
issue: 6308
branch: OPS-6308/header-agreement-search
---

# Header Agreement Search

## Story Overview

**Ticket:** OPS-6308
**Title:** Replace the "Find by ODN" modal with a type-ahead agreement search in the site header
**Story Points:** TBD

## Background

### Current State
- The Agreements list has a "Find by ODN" button (`AgreementOdnLookupButton.jsx`) that opens a modal (`AgreementOdnLookup.jsx`).
- The modal does an **exact**, case-insensitive match on the ODN field only, and only when the user submits:
  - Contract → `po_number`
  - Assisted Acquisition (AA) → `task_order_number`
  - Grant → `awarded_grant_number`
  - IAA / Direct Obligation → never match
- Results: 1 match navigates to the agreement, several matches show an `AgreementsTable` in the modal, and no matches shows a message.
- Backend: `_apply_odn_filter` in `backend/ops_api/ops/services/agreements.py`. The existing `search` param is a name-only alias that ANDs its terms together. The frontend doesn't use it, but backend tests do.

### Desired State
This matches the "Prototype – Header Search | OPS" artifact with **option A** (the explanation lives in the placeholder):
- A persistent search input in the header, on every authenticated page.
- Placeholder: `ODN, agreement title, or nickname`.
- Matching is case-insensitive and **partial** on three things: the agreement's ODN, its title, and its nickname. The ODN uses the same per-type field as today's lookup (Contract → `po_number`, AA → `task_order_number`, Grant → `awarded_grant_number`; IAA and Direct Obligation have none).
- **Scope note:** the prototype also matches Contract #, PO #/Task order # on every type, and `grant_numbers`. That's deliberately out of scope for now (see Future Improvements).

The user can get to an agreement three ways (all verified by clicking through the prototype):
1. **Type-ahead → details.** Typing shows a dropdown under the input. Each row has the agreement name, a type tag, and a secondary line: "<matched field label>: <value>" with the match highlighted, then " · Nickname: <nick>". When the match is the nickname, the line is just "Nickname: <nick>"; when the match is the title, the highlight is in the name. Footer: "N results · Press **Enter** to see all". **Clicking a row goes straight to that agreement's details page.**
2. **Enter or magnifier → results page → details.** Enter (with no row active) or the magnifier button opens a **Search results** page: "N agreements matching "<q>"" and a table of Agreement (link) · Type · Matched on (e.g. "ODN: **PO-2024**-00871", "Title: Early **Head Start** Family…"). **Clicking an agreement link goes to its details page.**
3. **Keyboard.** ↓/↑ highlight dropdown rows; Enter on a highlighted row opens that agreement.
- On the results page the header input is pre-filled with the query. After navigating to a details page the input starts empty (the header remounts on every page; product decision).
- No matches: the dropdown shows "No agreements match "<q>"." and "Try an ODN, agreement title, or nickname."
- Esc closes the dropdown **and clears the input** on the first press (prototype behavior, confirmed by product).
- The modal and its button are removed from the Agreements list.

### User Story
As an OPS user, I want to search for an agreement by its ODN, title or nickname from anywhere in the app so that I can jump straight to it without opening the Agreements list and filtering.

### Acceptance Criteria
- [ ] The header shows a search input with placeholder `ODN, agreement title, or nickname` and a search button on every page that shows the header **for a logged-in user**. It is not rendered for logged-out users (e.g. on the error page).
- [ ] The input has a persistent accessible name. The placeholder isn't the only label (use `aria-label="Search agreements"`).
- [ ] After a short delay (debounced, about 300 ms) once the user has typed at least 2 characters, a dropdown shows up to 5 matching agreements.
- [ ] Matching is case-insensitive and partial across title (`name`), `nick_name`, and the ODN: Contract → `po_number`, AA → `task_order_number`, Grant → `awarded_grant_number`. IAA and Direct Obligation agreements match on title and nickname only. No other identifier fields are searched.
- [ ] Each dropdown row shows the name, a type tag, and a secondary line "<label>: <value> · Nickname: <nick>", with the matched substring highlighted wherever it appears (name, ODN or nickname).
- [ ] **Clicking a dropdown row navigates directly to `/agreements/:id`.**
- [ ] **Pressing Enter (no row highlighted) or clicking the magnifier button navigates to `/search?q=<q>`**, including when the value is unchanged since the last search.
- [ ] Enter with no highlighted row opens the results page **even when there's exactly one match** (including a single exact ODN match). No row is highlighted automatically when the dropdown opens.
- [ ] **Each agreement name on the results page links to `/agreements/:id`.**
- [ ] Keyboard: ↓/↑ move through the rows, Enter on a highlighted row opens that agreement, Esc (handled on the input only) closes the dropdown and clears the input, and Tab moves on and closes it.
- [ ] The results page lists **all** matches (paginated), with Agreement link · Type · Matched on ("ODN", "Title" or "Nickname" plus the highlighted value), and a "No agreements match" empty state.
- [ ] No-match dropdown text: "No agreements match "<q>"." plus "Try an ODN, agreement title, or nickname."
- [ ] On `/search?q=…` the header input is pre-filled from `q`. (After navigating to a details page the input starts empty; product decision.)
- [ ] Reloading `/search?q=…` reproduces the results, and the header input is pre-filled from `q`.
- [ ] The clear (×) button empties the input, closes the dropdown and returns focus to the input.
- [ ] While a query is loading the previous results stay visible (busy state); a failed request shows "Search is unavailable. Press Enter to try again." in the dropdown and announces it.
- [ ] The input has `maxLength` 100 and `autocomplete="off"`. `/search` with no `q` shows a prompt and sends no request.
- [ ] The existing accessibility regression gate (10 specs in `ci.yml`) still passes with the header search present.
- [ ] Wildcard characters in user input (`%`, `_`, `\`) are matched literally, not as SQL wildcards.
- [ ] The "Find by ODN" button, modal, hook, their tests and the related E2E spec are removed.

## Technical Context

### Related Components
- `frontend/src/components/UI/Header/Header.jsx`: where the search goes. `usa-navbar` holds only the logo; `AuthSection` and `NavMenu` sit in `<nav aria-label="Primary navigation">` (`usa-nav__inner` / `usa-nav__secondary`). The header renders through `App` → `DefaultLayout`, and **each page wraps itself in `<App>`** (there is no shared layout route), so `Header` and `HeaderSearch` **unmount and remount on every route change**.
- `frontend/src/components/Auth/AuthSection.jsx`: the email, Sign-Out and bell area; reads `state.auth.isLoggedIn`.
- `frontend/src/pages/ErrorPage.jsx` also wraps in `<App>` and sits outside `ProtectedRoute`, so a logged-out user can see the header there.
- `frontend/src/api/opsAPI.js`: gets a new `searchAgreements` endpoint. Hyphenated sibling pattern: `agreements-filters` (around line 325).
- `frontend/src/index.jsx`: route table. `/search` goes **inside** the `ProtectedRoute` block, and the page wraps itself in `<App breadCrumbName="Search">`.
- `frontend/src/components/UI/Tag/Tag.jsx` (and the code → display-label converter the Agreements list uses): reuse for the type tag so labels match the list.
- `frontend/src/components/UI/Pagination/PaginationNav` and `ITEMS_PER_PAGE` in `src/constants.js`: reuse on the results page.
- `frontend/src/hooks/useNavigationBlocker.hooks.js`: unsaved-changes blocker; search navigation must work with it.
- `frontend/src/pages/agreements/list/AgreementOdnLookup/*`: being removed. Its stale-response guard and unmount invalidation pattern should be reused.
- `frontend/src/pages/agreements/list/AgreementsList.jsx`: renders `<AgreementOdnLookupButton />` (around line 371).
- `frontend/cypress.config.js` (line 14) and `cypress.config.ci.js` (line 17): list `cypress/e2e/agreementOdnLookup.cy.js` **explicitly**; both need the old spec replaced with `headerSearch.cy.js`.
- `.github/workflows/ci.yml` (around lines 84–95): the **accessibility regression gate** (`A11Y_REGRESSION_GATE=true`) runs 10 specs (agreementList, agreementsPagination, agreementDetails, portfolioList, portfolioDetail, budgetLineItemsList, createAgreement, createAgreementWithValidations, uploadDocument, notificationCenter). `cypress/support/a11yAllowlist.js` is empty, so any axe violation fails CI. The header is on every one of these pages.
- `backend/ops_api/ops/resources/agreements.py`: `AgreementListFilterOptionAPI` (around line 356) is the pattern to copy. It uses `@is_authorized(PermissionType.GET, Permission.AGREEMENT)` with no `OpsEventHandler`, and is registered at a hyphenated sibling path (`/agreements-filters/`).
- `backend/ops_api/ops/schemas/pagination.py`: `PaginationSchema` (scalar `limit` 1–50 default 10, `offset` ≥ 0, `unknown = EXCLUDE`) is the base for the request schema.
- `backend/ops_api/ops/services/agreements.py`: `_apply_odn_filter` (the type → ODN column mapping to share).
- `backend/ops_api/ops/urls.py`, `views.py`: route and view registration (view name `agreements-search`).
- `backend/openapi.yml` and `backend/validate_openapi.sh`; the `sync-openapi` skill.
- `backend/ops_api/tests/ops/agreement/conftest.py`: `loaded_db`, `auth_client`, `no_perms_auth_client` fixtures.
- `frontend/cypress/e2e/agreementOdnLookup.cy.js`: replaced.

### Dependencies
- No new libraries. USWDS `usa-combo-box` only supports a fixed list of options, so build the combobox by hand following the WAI-ARIA combobox pattern.

### Assumptions
- OPS doesn't support mobile, so there's no mobile layout or collapsed-nav placement in scope. Desktop widths 1024–1440 px are checked.
- The ODN lookup modal isn't used in production, so removing it ships in the same PR as the new search, with no transition period. The whole story ships as **one PR** (product decision).
- Agreements only for this story; CANs and projects aren't searched.
- **Visibility:** `GET /agreements/` and `GET /agreements/:id` do no per-user row filtering; access is only `@is_authorized(GET, AGREEMENT)` (`only_my` is an opt-in filter). The search endpoint uses the same decorator, so it returns what any `GET AGREEMENT` holder can already see in the Agreements list, including nickname and ODN. A result link will not lead to a 403 on the details page. (Not audited: whether any role is deliberately excluded from `GET AGREEMENT`; the decorator handles that identically for all three endpoints.)
- Matching is a single case-insensitive substring of the trimmed `q`. Internal whitespace is literal, so "Head Start" does not match "Head  Start" and word order matters. This is intentional and differs from the old `search` param, which ANDs its terms.
- With a few thousand agreements, `ILIKE '%q%'` on 3 columns doesn't need a trigram index. Step 1 records timing; fail the check if p95 for a 2-character query is above 200 ms.

## Implementation Plan

### Approach
Add a dedicated, lightweight `GET /agreements-search/?q=&limit=&offset=` endpoint. It runs **one** query: `agreement` outer-joined to `contract_agreement`, `aa_agreement` and `grant_agreement` by primary key (`name`, `nick_name` and `agreement_type` live on the base table; only the three ODN columns live on subclass tables). No budget-line or CAN joins, no totals, no per-row values like `fy_obligated` or `_meta`, no event-log write. It returns only what the UI needs: `id`, `name`, `nick_name`, `agreement_type` and `odn` (resolved per type). The header type-ahead (`limit=5`) and the `/search` results page (paginated) both use it. The frontend works out "Matched on" from those fields. Delete the ODN modal in the same PR.

### Files to Create
- `backend/ops_api/tests/ops/agreement/test_agreement_search.py`: endpoint tests.
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.jsx`: input, clear button, submit button and listbox.
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.hooks.js`: debounce, lazy query, abort and stale-response guard, active-option index, open/close state.
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.helpers.js`: `getMatchedField(result, q)` and `splitHighlight(text, q)`.
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.module.scss`: dropdown positioning and highlight (CSS Modules, like `Tabs.module.scss`; check whether the gulp step is needed at all for module SCSS before running `bun run uswds:update`).
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.stories.jsx`: required for `components/UI` (see `frontend/CLAUDE.md`).
- `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.test.jsx`, `HeaderSearch.helpers.test.js`
- `frontend/src/pages/search/SearchResults.jsx` + `SearchResults.test.jsx`: the `/search?q=` page.
- `frontend/cypress/e2e/headerSearch.cy.js` (2 tests, see step 10).

### Files to Modify
- `backend/ops_api/ops/schemas/agreements.py`: add `AgreementSearchRequestSchema` (inherits `PaginationSchema`, adds `q`), `AgreementSearchResultSchema` and `AgreementSearchResponseSchema`.
- `backend/ops_api/ops/services/agreements.py`: move the ODN column mapping into `_odn_column(agreement_cls)` and add `search_agreements(session, q, limit, offset)`.
- `backend/ops_api/ops/resources/agreements.py`: add `AgreementSearchAPI`.
- `backend/ops_api/ops/views.py`, `urls.py`: register `/agreements-search/`.
- `backend/openapi.yml`: document the endpoint next to `/agreements-filters/` (around line 879).
- `frontend/src/api/opsAPI.js`: add the `searchAgreements` endpoint.
- `frontend/src/components/UI/Header/Header.jsx`: render `<HeaderSearch />` when logged in.
- `frontend/src/components/UI/Header/Header.stories.jsx`: add a logged-in variant with search.
- `frontend/src/index.jsx`: add the `/search` route inside `ProtectedRoute`.
- `frontend/src/pages/agreements/list/AgreementsList.jsx`: remove the ODN button.
- `frontend/cypress.config.js`, `cypress.config.ci.js`: replace `agreementOdnLookup.cy.js` with `headerSearch.cy.js`.

### Implementation Steps

1. **Backend: `GET /agreements-search/`**
   - **Request schema:** inherit the scalar `PaginationSchema` (`limit` 1–50 default 10, `offset` ≥ 0, `unknown = EXCLUDE`) and load from flat `request.args`. `q = fields.String(required=True)`, stripped in a `pre_load`/`post_load`, then validated `Length(min=1, max=100)`. Blank after stripping, or over 100 characters → 400 (the global `ValidationError` handler maps to 400). Set `allow_none=False` on `limit`/`offset` so `limit=` doesn't pass as `None`. The 2-character minimum is a frontend rule only (a 1-character query is bounded by `limit`).
   - **ODN mapping:** refactor the class → ODN column mapping out of `_apply_odn_filter` into `_odn_column(agreement_cls)` (Contract → `po_number`, AA → `task_order_number`, Grant → `awarded_grant_number`, IAA/Direct → `None`). `_apply_odn_filter` must keep returning `false()` for IAA/Direct; the search leaves the ODN term out. The 22 existing `odn` tests guard this, and a regression check is part of the PR.
   - **Query:** `select(Agreement.id, Agreement.name, Agreement.nick_name, Agreement.agreement_type, odn_expr)` from `Agreement` with outer joins to the three subclass tables on `id`. `odn_expr` is a `CASE` on `agreement_type` (or `coalesce` of the three columns). Filter with `or_(name.icontains(q, autoescape=True), nick_name.icontains(q, autoescape=True), odn_expr.icontains(q, autoescape=True))` (SQLAlchemy 2.x) so `%`, `_` and `\` are matched literally. Confirm it renders as `ILIKE … ESCAPE` against the real DB with a literal-backslash test. Order by `lower(name) COLLATE "C"` (copy the idiom at `services/agreements.py:1365-1380`), then `id`, for stable pagination. No `DISTINCT` is needed: each agreement exists in exactly one subclass table.
   - **Count:** a separate `select(count())` over the same filtered subquery. Don't use `count(*) OVER ()` with `LIMIT/OFFSET`: an offset past the end returns no rows, so the count would read 0.
   - **Resource:** `AgreementSearchAPI.get` with `@is_authorized(PermissionType.GET, Permission.AGREEMENT)` and **no `OpsEventHandler`**, matching `AgreementListFilterOptionAPI`. Response envelope matches `GET /agreements/`: `{"data": [{"id", "name", "nick_name", "agreement_type", "odn"}], "count", "limit", "offset"}`. `agreement_type` uses `fields.Enum(AgreementType)` (same wire format as the list endpoint), and `nick_name` and `odn` use `allow_none=True`.
   - **Tests** (create their own rows; don't rely on shared seed data that other tests mutate):
     - Each type's ODN column matches, partially and case-insensitively.
     - Wrong-field negatives: a Contract whose `task_order_number` matches, an AA whose `po_number` matches, and any `contract_number` match → **no hit**.
     - Name and nickname match; IAA/Direct match on name/nickname only with `odn: null`.
     - An agreement matching on both ODN and name is returned once.
     - `%`, `_` and a literal `\` in input are matched literally.
     - Validation: blank/whitespace `q` → 400; `q` of 101 chars → 400; 100 chars → 200; `limit=0`, `limit=51`, `limit=` and non-integer → 400; `offset=-1` → 400.
     - Pagination: correct `count` when the offset is past the end; order is stable; case-insensitive ordering ("apple" before "Banana"); `id` tie-break for equal names.
     - No auth token → 401; `no_perms_auth_client` → 403.
     - **No `OpsEvent` row is written.**
     - The exact response key set (`id`, `name`, `nick_name`, `agreement_type`, `odn`).
     - Regression: the exact `odn` filter on `GET /agreements/` still behaves as before after the refactor.
   - **Seed values** for local/manual and E2E use (`backend/data_tools/data/agreements_and_blin_data.json5`): `PO-TEST-0001`, `PO-TEST-0002` (used by two contracts, a useful multi-result fixture), `TO-TEST-0001` (AA), `GRANT-AWD-0001` (Grant). Several nicknames start with `PT-FY26-STEP1` (a partial query returns 5, so don't assert a single hit on that prefix).
   - **Docs/lint:** add the endpoint to `openapi.yml` (use the `sync-openapi` skill) and run `backend/validate_openapi.sh`; run Black and the nox lint session.
   - **Timing:** run the endpoint against staging-sized data (or a local DB with production-like counts) and record p50/p95 for a 2-character query in the PR.

2. **API wiring**
   - Add `searchAgreements: builder.query({ query: ({ q, limit, offset }) => ... })` to `opsAPI.js`. Build the query string with `URLSearchParams` (or `encodeURIComponent` exactly once, never both) and test that `&`, `#`, `%` and `+` in `q` round-trip.
   - **No `providesTags`**, so agreement mutations don't trigger background re-fetches of old searches. Set `keepUnusedDataFor: 30` (a new per-endpoint option; nothing else in `src` sets it).
   - Export `useLazySearchAgreementsQuery` for the header and `useSearchAgreementsQuery` for the results page. Call the lazy trigger with `preferCacheValue = false` so a repeated query isn't served stale.

3. **Helpers (TDD first)**
   - `getMatchedField(result, q)`: pick the first field whose value contains `q` case-insensitively, in the order `odn` → `name` → `nick_name`. Return `{ label, value }` with the labels `ODN`, `Title` or `Nickname`. Return a fallback (`Title`, the name, no highlight) if no field matches client-side, so a row never renders blank (e.g. accent/collation differences from Postgres).
   - `splitHighlight(text, q)`: return `[before, match, after]` for rendering with `<mark>`; highlights the first occurrence. Use `indexOf` on a lowercased copy, never a regex built from `q`, and never `dangerouslySetInnerHTML`. If lowercasing changes the string length (e.g. `İ`, `ß`), skip highlighting for that text rather than mis-slicing.
   - The type label comes from the same converter the Agreements list uses.

4. **`useHeaderSearch` hook**
   - State: `inputValue`, `results`, `count`, `isOpen`, `activeIndex`, `status` (`idle` | `loading` | `success` | `empty` | `error`).
   - Wait 300 ms after the last keystroke and only search at 2+ trimmed characters (`maxLength={100}` on the input matches the backend cap). Call `trigger({ q, limit: 5, offset: 0 })`.
   - **Cancel the previous in-flight request** with the promise's `.abort()` when a new one starts. Treat the abort rejection as non-error. Keep the `latestSubmissionRef` guard as a second line of defense.
   - **Clearing, Esc, or dropping below 2 characters** cancels the pending debounce timer, aborts the in-flight request, empties `results` and sets `status` to `idle`, so a late response can't reopen the dropdown.
   - **Unmount** (every navigation, because the header remounts) cancels the timer and invalidates in-flight requests.
   - **Loading:** keep the previous results visible with `aria-busy="true"` on the listbox (no flicker); show nothing extra on the first request.
   - **Error:** show an inline row "Search is unavailable. Press Enter to try again." (a status message, not an option) and announce it in the live region. No global alert.
   - Navigation always closes the dropdown first, then calls `navigate()`; use `replace` when already on `/search`, `push` otherwise.

5. **`HeaderSearch` component (ARIA combobox, follow the WAI-ARIA APG editable combobox with list autocomplete)**
   - Render only when `state.auth.isLoggedIn` is true (never on the logged-out error page).
   - `<form role="search">` containing an `input type="text"` with `role="combobox"`, `autocomplete="off"`, `maxLength={100}`, `aria-label="Search agreements"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and `aria-activedescendant`. Use `type="text"`, not `type="search"`, to avoid WebKit's native clear control. Place the form as its own landmark, not nested inside the "Primary navigation" `<nav>`.
   - `<ul role="listbox">` is always mounted (hidden when closed) so `aria-controls` never points at a missing element. Options are plain `<li role="option">` with stable `id`s, `aria-selected="true"` only on the active one, and `tabIndex={-1}`. The footer ("N results · Press Enter to see all") and the no-match/error messages sit **outside** the `role="listbox"` element (or are `role="presentation"`), because they aren't options.
   - `aria-activedescendant` is removed when no row is active. ↓ opens a closed list that has results. ↓ on the last row stays on the last row; ↑ on the first row returns to "no row" (focus stays in the input). No row is highlighted automatically, so Enter with no active row always submits the form.
   - **Enter:** with an active row, `preventDefault()`, then navigate to that agreement and don't submit the form. With no active row, submit to `/search?q=`. Ignore Enter while IME composition is in progress (`event.nativeEvent.isComposing`).
   - **Click on a row:** `onMouseDown={(e) => e.preventDefault()}` on the listbox so the input keeps focus and doesn't `blur` first, then navigate on `click`. Close on `focusout` only when `relatedTarget` is outside the component, plus on outside click and Tab.
   - **Esc:** a single press closes the dropdown and clears the input (product decision; a documented deviation from the APG, which clears on the second press). The handler is the input's own `onKeyDown`, not a document-level listener, so it can't interact with the modals' document-level Escape handlers.
   - **Live region:** one persistent, always-mounted `role="status"` (`aria-live="polite"`) announcing "N results" or "No results" once per settled query (not per keystroke) and the error message.
   - **Footer:** "N results · Press Enter to see all", as in the prototype (shown for any result count, since the results page also shows what each agreement matched on).
   - Buttons have `aria-label` only (no visible text): "Search" (magnifier) and "Clear search" (×, shown only when the input has text, returns focus to the input). Reuse the `icons#search` sprite the old button used.
   - Pre-fill from `useSearchParams().get("q")` on `/search` only.

6. **`/search` results page**
   - Inside `ProtectedRoute`, wrapped in `<App breadCrumbName="Search">`.
   - URL state: `q` (trimmed on read) and `page` (follow `PaginationNav`'s convention). Reset `page` when `q` changes. No `q` (or blank) → an empty prompt ("Enter an ODN, agreement title, or nickname") and **no request** (`skip: true`). 1+ characters are allowed on this page. A 400 shows the error state.
   - Page size is `ITEMS_PER_PAGE` (≤ 50).
   - Table: Agreement (link to `/agreements/:id`) · Type · Matched on, highlighted with the same helpers. Heading "Search results" and "N agreements matching "<q>"". Move focus to the heading after the results load for keyboard/screen-reader users.
   - Empty state, error state, and the existing loading pattern.

7. **Header placement and styles**
   - Placement (as built): `HeaderSearch` is rendered by `Header.jsx` in an absolutely positioned, zero-height layer (inline styles, no header SCSS) outside `.usa-navbar`, so the dropdown is not clipped. The layer is as wide as the 1024 px page column and right-aligned, so the search sits directly under the email / Sign-Out links, which are lifted one row via an inline `top` on `.usa-nav__secondary`. `HeaderSearch.module.scss` styles the input (about 22 rem wide, 36 px tall, per the prototype) and the dropdown.
   - Layout spec: must not wrap or push `NavMenu` at 1024, 1280 and 1440 px. The search layer has no `z-index`, so DOM order paints it under `ReactModal` overlays (portaled to `<body>`, later in the DOM). Only the open dropdown carries `z-index: 100` (to clear positioned page content); opening a modal moves focus away, which closes the dropdown.
   - Add Storybook variants (logged in; open dropdown; no results; error).

8. **Remove the ODN modal**
   - Delete `AgreementOdnLookup/` (5 files) and its use in `AgreementsList.jsx`, plus `agreementOdnLookup.cy.js`, and update both Cypress configs (step 10).
   - Remove the now-unused `odn` param plumbing from `getAgreements` in `opsAPI.js` (the destructured `odn` and its query-string branch). **Keep** the backend `odn` filter on `GET /agreements/` and its tests: it's documented in `openapi.yml` and stays a stable API.
   - Run the `dead-code-after-removal-sweep` skill.

9. **Unit tests that render the real header**
   - Run the full suite first. Tests that render a page wrapping `<App>` (e.g. `Home.test.jsx`, `ErrorPage.test.jsx`) now mount `HeaderSearch`, which needs the `opsApi` reducer/middleware in the test store and could throw otherwise (not just duplicate roles). Default to mocking `HeaderSearch` in those tests. Count the real set from the test run rather than assuming "about 5".

10. **E2E (kept deliberately small, per `docs/TESTING.md`)**
    - `headerSearch.cy.js` with 2 tests, creating their own agreement via API with a unique `Date.now()` name and ODN (`po_number`) and deleting it in `afterEach`:
      - Type a partial ODN, **click a dropdown row**, and land on the details page.
      - Press Enter, land on `/search?q=…`, **click a result**, land on the details page; reload `/search` keeps the query.
    - Run `cy.checkA11y()` with the dropdown **open** and on `/search`, as the old spec did in `afterEach`.
    - Title, nickname, no-match, keyboard and magnifier paths are covered by component tests and backend tests, not E2E.
    - Replace `agreementOdnLookup.cy.js` with `headerSearch.cy.js` in `cypress.config.js` and `cypress.config.ci.js`, otherwise the new spec never runs in CI.
    - The 10 specs in the CI accessibility gate must still pass with the header search present.

11. **Release notes**
    - Add an entry via the `update-release-notes` skill (confirm timing with product).

### Key Decisions

**Decision 1:** How to explain what's searchable
- A: Placeholder text. B: Helper text below. C: Info icon with tooltip.
- **Chosen:** A, per product/UX. The input still gets an `aria-label`, because a placeholder disappears once the user types and isn't a reliable accessible name.

**Decision 2:** A dedicated search endpoint, or a `q` param on `GET /agreements/`
- List endpoint + `q`: the least new code, but every keystroke would compute totals over all matches, compute `fy_obligated` and `_meta` per row, outer-join budget lines and CANs with `DISTINCT`, and write an `OpsEvent` row. Its cache tags would also re-fetch the last search on any agreement edit.
- Dedicated endpoint: about half a day more backend work and a second read path to maintain, but it runs one lean query, sends a 5-field response, writes nothing, and is independent of list-endpoint changes (e.g. OPS-6140).
- **Chosen:** A dedicated `/agreements-search/` endpoint. It uses the same authorization decorator as the list endpoint, so what users can see doesn't drift.

**Decision 3:** Where "Matched on" is worked out
- Backend: the endpoint would return a `matched_field`.
- Frontend: the response already has `odn`, `name` and `nick_name`.
- **Chosen:** The frontend, because it's a pure helper that's easy to unit-test. The backend resolves `odn` per type, so the frontend needs no type → column knowledge.

**Decision 4:** Label for an ODN match
- Per type: PO # / Task order # / Grant #, as the prototype styles it.
- Generic: "ODN" for every type.
- **Chosen:** Generic "ODN" (product decision), because it matches the placeholder and the no-match hint.

**Decision 5:** What Enter does when there's a single exact ODN match
- Jump to the agreement, as today's modal does.
- Always open the results page, as the prototype does.
- **Chosen:** Always open the results page (product decision). Enter goes to an agreement's details page only when the user has highlighted a dropdown row with ↓/↑ first. No row is highlighted automatically when the dropdown opens, so Enter with no highlighted row always opens `/search?q=`, whatever the match count.

**Decision 6:** Should searches be logged as events?
- **Chosen:** No `OpsEvent`, matching `/agreements-filters/`. A type-ahead would otherwise write 1–3 event rows per query.

**Decision 7:** One query or a `UNION ALL` of five subclass selects
- Union: mirrors `_get_all_matching_ids`, but needs `DISTINCT`, careful branch typing and a subquery wrapper to order and paginate.
- Outer joins from `agreement` to the three ODN tables: one query, no duplicates, and the ODN mapping lives in one place.
- **Chosen:** Outer joins (found in adversarial review).

## Testing Strategy

Check `docs/TESTING.md` for the test-type matrix before adding tests. E2E is for critical journeys only.

### Unit Tests
- [ ] Helpers: `getMatchedField` priority order (`odn` → `name` → `nick_name`), `odn: null`, a no-match fallback, a query matching both ODN and name, case-insensitive `splitHighlight`, regex-special characters in `q`, and a Unicode length-change case.
- [ ] `opsAPI`: `searchAgreements` builds the URL with `&`, `#`, `%` and `+` in `q` encoded exactly once (follow the existing `opsAPI.test.js` pattern).
- [ ] Hook (use `vi.useFakeTimers` with `act`): nothing below 2 characters, debounce collapses fast typing into one call, the previous request is aborted, a stale response is ignored, clearing or Esc cancels the timer and in-flight request and empties results, unmount invalidates the in-flight request, error and loading states.
- [ ] Component (mock the network with MSW or the hook, and use `userEvent`, not `fireEvent`, so the blur/click ordering is exercised): ARIA attributes; **clicking a row navigates to `/agreements/:id`** without losing the click to blur; ↓/↑ move and `aria-activedescendant` updates; Enter on a row navigates to the agreement **and does not also submit the form**; Enter with no row, or **clicking the magnifier**, navigates to `/search?q=`; Enter during IME composition does nothing; Esc closes and clears; the clear button resets and returns focus; footer count text ("N results · Press Enter to see all"); no-match hint; error row; the secondary line shows the nickname; not rendered when logged out; rows are not tab stops.
- [ ] Results page: rows, **agreement links point to `/agreements/:id`**, Matched on labels, pagination via the URL `page`, empty prompt with no request when `q` is blank, empty state, error state, `q` from the URL.
- [ ] Navigation blocker: from a page with unsaved changes, selecting a result triggers the blocker modal and the dropdown is closed.

### Integration Tests
- [ ] Backend endpoint tests (step 1).

### Manual Testing
- [ ] Try the prototype's sample queries against local seed data: `PO-TEST-000` (multiple results), `TO-TEST-0001`, `GRANT-AWD-0001`, a name word, a `PT-FY26-STEP1` nickname prefix, and `zzz` (no match).
- [ ] Screen reader (VoiceOver): the combobox announces options and the result count.
- [ ] Open a modal and press Esc: the modal closes. After the modal restores focus to the header input, check Esc doesn't clear a query unexpectedly.
- [ ] Network tab: typing a query sends at most about one request per pause, and superseded requests show as cancelled.
- [ ] Header layout at 1024, 1280 and 1440 px, with and without a long email address.
- [ ] Logged-out error page (`/error`): no search box.

### Test Data Needed
- Backend tests create their own agreements. For manual and E2E use, the seed values listed in step 1.

## Validation

### Code Quality
- [ ] All tests pass (unit + integration + E2E)
- [ ] The CI accessibility gate's 10 specs pass with the header search present
- [ ] `backend/validate_openapi.sh` passes
- [ ] ESLint and Prettier (`bun run format`, `bun run lint --fix`)
- [ ] Black and the nox lint session for the backend
- [ ] Frontend coverage ≥ 90%
- [ ] Branch cut from `main` (not from `OPS-6221/homepage-fixes`); single-line conventional commits with no trailers (per `CLAUDE.md`)

### Functional Validation
- [ ] Acceptance criteria met in local dev
- [ ] No regressions in the Agreements list or its exact `odn` filter
- [ ] Endpoint timing recorded in the PR (step 1)

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| The header combobox fails the CI accessibility gate on all 10 gated specs | High | Med | Always-mounted listbox, labelled buttons, one `role="search"` landmark outside the nav, `cy.checkA11y()` with the dropdown open; run the gated specs locally before pushing |
| A hand-built combobox has other a11y or focus gaps (blur/click race, double submit on Enter, IME) | High | Med | Follow the APG pattern; the listed `userEvent` tests; VoiceOver pass |
| Header remounts per page, so any in-component state (query, open list, timers) is lost on navigation | Med | High (certain) | Pre-fill only from the URL on `/search` (product decision); cancel timers and in-flight requests on unmount |
| Search shows for logged-out users on the error page and 401s | Med | Med | Render only when `isLoggedIn`; test the logged-out case |
| Search visibility drifts from the Agreements list | Med | Low | Same `@is_authorized` decorator; a 403 test; revisit if the list endpoint adds row-level filtering |
| Type-ahead request volume | Low | Med | 300 ms debounce, 2-character minimum, abort superseded requests, lean single-query endpoint, no event writes |
| `ILIKE '%q%'` slows down as data grows | Low | Low | Timing recorded in the PR (fail above 200 ms p95); add `pg_trgm` GIN indexes if it degrades |
| Page unit tests that render the real header break (missing `opsApi` store) | Low | Med | Mock `HeaderSearch` in those tests (step 9) |
| New E2E spec never runs in CI, or the old one breaks it | Med | Med | Update both Cypress configs (step 10) |
| The header gets crowded at 1024–1440 px | Med | Med | Layout spec and Storybook variants (step 7) |

## Notes

### Open Questions
- None. (Two issues found in review were fixed: the search layer no longer paints above `ReactModal` overlays, and a search resolving after focus leaves the box no longer re-opens the dropdown.)

### Future Improvements
- Search the other identifier fields the prototype shows: Contract #, and PO #/Task order # regardless of type, plus `grant_numbers` (needs an EXISTS subquery). Settle whether Direct Obligations get a PO # field.
- Search CANs and projects too, either by extending `/agreements-search/` into a cross-entity `/search/` endpoint or by adding sibling endpoints.
- Recent searches.

### References
- Prototype: "Prototype – Header Search | OPS" (claude.ai artifact `Tk5Jg9scwxahzSkzEcMAVd`)
- Replaced implementation (removed in this PR): `frontend/src/pages/agreements/list/AgreementOdnLookup/`
