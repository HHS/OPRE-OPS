---
issue: 6457
branch: OPS-6457/division-staffing-filter  # current; the first branch, OPS-6457/agreements-cor-division-filter, merged as PR #6480 on 2026-11-03
status: IN PROGRESS. PR #6480 (COR's division backend + wiring) merged 2026-11-03. Draft PR **#6495** (`OPS-6457/division-staffing-filter`) carries the "Division & Staffing" work from the UX prototype: the backend (`cor_id` OR'd with `division`, `cors` options), the frontend wiring, and the control + tags on Agreements and Budget Lines. Pick up at "Start here next session (2026-11-04)".
---

# OPS-6457: Filter by the COR's division (Agreements, Budget Lines, Procurement Dashboard)

## Context

GitHub issue [#6457](https://github.com/HHS/OPRE-OPS/issues/6457) asks for a filter on the **COR's division**,
meaning `User.division` of the agreement's primary COR (`Agreement.project_officer_id`). It is separate from the
portfolio's division.

### What changed in the 2026-10-29 refinement
- **Struck out:** the Projects list (including project amount scoping) and the whole Budget Reporting page
  (spending, counts, funding not changing).
- **Added:** a FigJam workflow diagram
  ([OPS-Diagrams, node 4770-9171](https://www.figma.com/board/ZclJ07uGZKS4pTwM006kg8/OPS-Diagrams?node-id=4770-9171&t=63CGZumh1HStIcyk-1)).
  It hasn't been reviewed for this plan, so check it before slicing tickets.
- **Not yet updated in the issue:** the Testing section still mentions projects, reporting spending and counts,
  "funding unchanged", the Reporting E2E journey, and Reporting figure markers. Treat those as stale and ask the
  author to remove them, so QA doesn't test out-of-scope pages.

### Scope now
| Page | Work |
|---|---|
| Agreements list | New filter (the backend param already exists), filter options, export, COR name |
| Budget Lines list | New filter end to end (backend + frontend), filter options, export |
| Procurement Dashboard | Existing filter: clarify its name; possibly narrow its options (see §3, Q3) |

### What exists today (verified on `main` @ `de6eec01f`)
- **Agreements API:**
  - `GET /agreements/` already accepts `division` (`backend/ops_api/ops/schemas/agreements.py:187`) and filters
    with `project_officer_id IN (users whose User.division IN …)`
    (`backend/ops_api/ops/services/agreements.py:1472-1477`).
  - That already means: primary COR only; agreements with no COR, or a COR with a null division, are excluded;
    multiple divisions are OR'd; the filter is ANDed with every other filter and with `only_my`; totals,
    procurement aggregates, `count` and paging are computed over the filtered set.
  - Covered by `TestAgreementDivisionFilter` (`backend/ops_api/tests/ops/services/test_agreements.py:2190-2360`).
- **Agreements filter options:** `/agreements-filters/` (`services/agreements.py:693-796`) respects `only_my` and
  returns **no divisions**.
- **Agreements list page:**
  - There is no division control and no `division` key in `sessionUISlice` (`frontend/src/store/sessionUISlice.js:29-40`).
  - The page spreads `...filters` into `getAgreements` (`frontend/src/pages/agreements/list/AgreementsList.jsx:86-97`),
    and `getAgreements` expects division **ids** (`frontend/src/api/opsAPI.js:108,161-163`). Storing Division
    objects there unmapped would send `division=[object Object]`.
  - The table has no COR column (`AgreementsTable.constants.js:13-18`). The **export already has a "COR" column**,
    built from one user lookup per row (`AgreementsList.jsx:215-228, 285`).
  - Export re-fetches every page with the page's filters (`AgreementsList.jsx:183-310`), so a filter in state
    reaches it automatically once it maps correctly.
- **Budget Lines API:**
  - There is no COR-division param. `QueryParametersSchema` has `unknown = EXCLUDE`
    (`backend/ops_api/ops/schemas/budget_line_items.py:183-202`), so the param would be **silently ignored** if
    the schema isn't updated.
  - `filter_query` is at `services/budget_line_items.py:498-525`.
  - `count`, `_meta.total_*` and paging are computed after the SQL and Python filters, over the full filtered set
    (`:354-366`).
  - `only_my` is applied in Python after the SQL (`:368-383`).
- **Budget Lines filter options:** `/budget-line-items-filters/` (`services/budget_line_items.py:1301-1419`)
  applies `only_my` and returns no divisions.
- **Budget Lines list page:**
  - `getBudgetLineItems` destructures a **fixed list of keys** (`opsAPI.js:377-387`), so a new key is dropped
    unless it is added there.
  - Modal buffer state is in `BLIFilterButton.jsx:23-118`; tags in `BLIFilterTags.jsx` (removal `:19-75`, group
    order `:162+`).
  - Export is `handleExport` in `frontend/src/helpers/budgetLines.helpers.js:465+`.
- **Procurement Dashboard:**
  - The "Division" filter uses `FilterComboBox` (`ProcurementDashboardFilterButton.jsx:53-67`).
  - Options come from `/divisions/` (all divisions, unfiltered; `ProcurementDashboardPage.jsx:38`).
  - Ids are mapped at the call site (`:46`).
  - E2E coverage is in `procurementDashboard.cy.js:113-193`.
- **Tabs:** both lists have All / My tabs (`onlyMy`), which are passed to the list query and the filter-options
  query (`AgreementsList.jsx:68,92`; `BudgetLineItemList.jsx:47,77`).
- **a11y:**
  - No page has an `aria-live` region announcing filter changes.
  - Tags carry text plus a "Remove {tag} filter" button label (`components/UI/FilterTags/FilterTags.jsx:24-29`),
    so applied state is already conveyed in text, not only color.

---

## Progress: where to pick up (updated 2026-11-03, end of day)

### ▶ Start here next session (2026-11-04)
**State at end of 2026-11-03:**
- Branch `OPS-6457/division-staffing-filter`, pushed. **Draft PR #6495**, description up to date. It has three
  commits: the backend, the frontend wiring, and the control + tags.
- Done and green:
  - backend full suite (2,732 passed), lint;
  - frontend full unit suite (5,282 passed), lint;
  - Cypress `agreementList` + `budgetLineItemsList`.
- Not done yet: a visual check, the CI run on #6495, and `/ops-pr-review`.
- The local Docker stack was started with `docker compose up --build -d` and may still be running. Backend pytest
  needs port 5432 free, so run `docker compose stop db` first (see "Local environment gotchas").

**Do next, in order:**
1. **Check CI on #6495** (`.claude/actions/quick-ci-status.sh`) and fix anything red.
2. **Visual check** of the "Division & Staffing" field (`/visual-check`, or the running app at
   http://localhost:3000) on the Agreements and Budget Lines filter modals, at desktop and mobile widths. Look for:
   - the field after Portfolio;
   - the grouped order, and no-division CORs last;
   - chips and tags, and the "Remove … filter" buttons;
   - long COR lists scrolling inside the menu.
3. **Step 4: "Portfolio (funding stream)" label** on every portfolio filter. Start from `PortfoliosComboBox`
   (it owns the label; check whether other pages pass their own) and grep for the other portfolio filter labels
   (Agreements, Budget Lines, Projects, CANs, Portfolios list). Update the unit and Cypress tests that find the field
   by its "Portfolio" label.
4. **Step 5: announcer** (`role="status"`, polite) on Agreements and Budget Lines. It announces that filters were
   applied, removed or reset, and the new result count (C1). Check `docs/TESTING.md` and existing live regions
   first; none exists on these pages today.
5. **Step 7: Procurement Dashboard relabel.** It's blocked on **Q7** (the label wording); ask Kim. Then it's a label
   change in `ProcurementDashboardFilterButton.jsx` plus its unit and Cypress tests.
6. Then: mark #6495 ready, run `/ops-pr-review 6495`, and check the boxes the merged UI satisfies on the issue
   (the two "I can filter" ACs, clearing, "divisions offered" for the lists, keyboard/AT once the announcer lands,
   and the distinct name).

**Still open (not code):** Q2 (COR on Budget Lines?), Q6 (FigJam), Q7 (Dashboard label), T0 (CORs-without-
division counts on staging/prod), Q5 (stale Projects/Reporting testing text in the issue).

### Update 2026-11-03: PR #6480 merged, prototype landed
- **PR #6480 merged to `main` on 2026-11-03.** It carried everything under "Done on the branch" below. New work
  goes on **`OPS-6457/division-staffing-filter`**, branched from `main` after the merge.
- **Acceptance criteria checked off on the issue (2026-11-03):** union of divisions; works with other
  filters/tabs/FY; export uses the filter; primary COR only; no COR / no-division COR excluded only when filtering;
  only narrows. Still open: the two "I can filter" ACs (no UI), clearing (counts/totals/paging are done, UI clearing
  isn't), COR's name on the list (backend done, no column), divisions offered (backend done, nothing consumes it
  yet, and the Dashboard still lists all divisions), keyboard/AT, the distinct name, and the Dashboard relabel.
- **UX prototype** (Kim's comment on the issue, `staffing-division-filter.html`; mock data, client-side only).
  It shows the workflow; build it from the existing USWDS components and introduce no new elements.
  - **Name:** "Division & Staffing" (the prototype says "Division (People)"; Kim's comment overrides it).
  - **Placement:** in the filter modal, right after Portfolio.
  - **Options:** for each division, a whole-division option (`DCFD - Division of Child & Family Development`)
    followed by that division's CORs/POs (`DCFD - Hank Smith`). Picking the division matches all its CORs.
  - **Matching:** every choice in the control is OR'd (division A + person from division B → both sets). The
    control as a whole is ANDed with the other filters.
  - **Focus:** highlight a single row, not the whole division group the prototype highlights (Kim: a long staff
    list would hide the end of the group highlight). Indenting staff rows under their division is optional.
  - **Tags/reset/close:** the same as the other filters. A tag shows the option's label.
  - **Portfolio label:** becomes **"Portfolio (funding stream)"** on every page that filters by portfolio
    (new scope; not in the original ACs).
  - **No COR column** in the prototype's table. That conflicts with the "include the COR's name" AC (see Q4).
- **Decisions (2026-11-03, from the dev lead):**
  - A COR with **no division** is listed **without a group** (no division header above them). Choosing that person
    matches their agreements directly; choosing a division still never matches them.
  - **Procurement Dashboard:** only relabel the existing filter (A4); no people options. Proposed label:
    "Division & Staffing", for consistency. ⚠️ Confirm with UX: the Dashboard offers divisions only, so "Staffing"
    may suggest people can be picked there. See Q7.

### Done on `OPS-6457/division-staffing-filter` (backend for the prototype, 2026-11-03)
- **`cor_id` param** (list of user ids) on `GET /agreements/` and `GET /budget-line-items/`: keeps items whose
  primary COR is one of those users. It is **OR'd with `division`** (one control); the pair is ANDed with
  everything else. The alternate COR is ignored.
  - Agreements: `_apply_cor_filter` in `services/agreements.py` (pulled out of `_apply_agreement_filters`, which
    otherwise trips flake8 C901). BLIs: `_apply_cor_division_filter` became `_apply_cor_filter(divisions, cor_ids)`.
  - A new param, not a change to the existing `project_officer_id`: that one is ANDed like every other filter, and
    changing its meaning would surprise any caller.
- **`cors` in both filter-options responses:** `[{id, name, division_id}]`. These are the primary CORs on ≥1
  agreement in the (`only_my`-scoped) set. `name` is the full name, else the email (the same as
  `project_officer_name`). `division_id` is null when unset. Sorted by name. The frontend groups by `division_id`
  against `cor_divisions`.
- `openapi.yml` documents both. Spectral (`spectral:oas`) findings are unchanged before and after (23 errors and
  212 warnings, all pre-existing).
- **Tests:**
  - Service level, both endpoints: a single COR; division + COR = union; a COR with no division chosen directly;
    an alternate-only COR excluded; the group ANDed with another filter (awarding entity / portfolio); BLIs with and
    without the Agreement join; `only_my` intersection; options (primary only, null `division_id`, sorted, `only_my`).
  - API level: `cor_id` narrows the list (and `_meta` for BLIs); a non-integer `cor_id` returns 400; the `cors`
    shape.
  - All 20 new behavior tests failed before the implementation.

**No rendered UI until designs exist (decided 2026-11-02).** This branch carries backend code and frontend code that
renders nothing: session state, the `opsAPI` layer, page → query/export wiring, and types. No modal fields, tags,
columns, labels or placeholder copy, and no hook/buffer state for controls that don't exist yet. A "COR's Division"
combobox and tags were built as placeholders and then **removed** on 2026-11-02 for this reason.

**Working agreement (superseded 2026-11-03):** code work for #6457 was done on
`OPS-6457/agreements-cor-division-filter`, behind one PR (#6480, merged). The work that remains goes on
`OPS-6457/division-staffing-filter`. The sub-tasks in §2 are still ordered work items, not separate branches.

### Done on the branch (T1: Agreements list filter + export)
- **Backend:** `/agreements-filters/` returns `cor_divisions` (`[{id, name, abbreviation}]`). It lists only
  divisions with a primary COR on ≥1 agreement, ignores the alternate COR, is scoped by `only_my`, and is
  sorted by name. The response schema and `openapi.yml` are updated.
  - **Param name kept as `division`** on `GET /agreements/`; no rename (decision Q1 is settled for now).
- **Frontend (non-rendering only):**
  - `agreements.filters.division` in `sessionUISlice` flows into both the list query and the export.
  - `opsAPI.getAgreements` now maps Division **objects** to ids. `ProcurementDashboardPage.jsx` was adjusted to
    pass objects, with no behavior change.
  - The modal field, tags and modal buffer state were removed on 2026-11-02 (no designs yet).
- **Tests:**
  - Backend: `TestAgreementDivisionFilter` covers single, union, no COR, a null-division COR, alternate-only,
    portfolio-division ≠ COR-division, `only_my` intersection, **portfolio + FY intersection** (mutation-checked),
    and options (only primary CORs, `only_my` scoping). API tests check the `cor_divisions` shape and that a
    non-integer division returns 400.
  - Frontend: `opsAPI.test.js` query string; the list page query and export (`AgreementsList.test.jsx`, seeding
    `division` through the mocked filter button). The modal/tag/keyboard tests and the Cypress journey were removed
    with the UI on 2026-11-02.
  - Backend `test_division_count_totals_and_paging_cover_only_filtered_set` (added 2026-10-30): `count`,
    `totals` (amounts and type counts) and `limit`/`offset` paging cover only the filtered set.
- **All green as of 2026-10-29:** backend full suite (2,682 passed), frontend full suite, Cypress `agreementList`
  + `procurementDashboard`.

### Done on the branch (T3 backend: Budget Lines filter, 2026-10-30)
- `GET /budget-line-items/` accepts `division` (added to `QueryParametersSchema` and `BudgetLineItemFilters`).
  `_apply_cor_division_filter` adds `BudgetLineItem.agreement_id IN (agreements whose primary COR is in …)` in
  `filter_query`. No shared helper was extracted; the predicate is one line on each side.
  - `.correlate(None)` was tried and dropped: when the outer query joins Agreement, the correlated form checks the
    same agreement row, so results are identical (mutation-checked).
- `/budget-line-items-filters/` returns `cor_divisions`, built from the agreements of the post-`only_my` BLI set and
  sorted by name.
- `openapi.yml`: the `division` param and `cor_divisions` are documented. (The filter-options response there was
  already missing `agreement_types`, `agreement_names` and `can_active_periods`; that gap is pre-existing.)
- Tests in `tests/ops/budget_line_items/test_budget_line_item_cor_division.py`: the T1 matrix (single, union, no
  COR, null-division COR, alternate-only, portfolio-division ≠ COR-division, unknown id, portfolio + FY
  intersection, `only_my` intersection), both query shapes (default sort joins Agreement, `ID_NUMBER` doesn't),
  count/totals/paging, options (primary only, `only_my`, sorted), and API tests for `_meta` (`total_count`,
  `number_of_pages`, `total_amount`), a 400 on a non-integer id, and the `cor_divisions` shape. Removing the schema
  field makes the API tests fail (mutation-checked).
- **All green as of 2026-10-30:** backend full suite (2,700 passed, 9 skipped), lint.

### Done on the branch (T2 backend: COR name on the Agreements list, 2026-10-30)
- `AgreementListResponse.project_officer_name`: the primary COR's `display_name` (full name, else email; the same
  value the export's "COR" column uses), `None` with no COR. Every list subclass inherits it.
- `_get_page_agreements` eager-loads `Agreement.project_officer` (`joinedload`).
- `openapi.yml` documents the field.
- Tests: an API test (named COR, COR with no name → email, no COR → null) and
  `TestGetPageAgreements.test_eager_loads_project_officer`, which fails without the `joinedload` (mutation-checked).
- Not done: sorting by COR (waits on Q4). The export switch to the new field was done on 2026-11-02.

### Pick up here, in order (updated 2026-11-02)
**All backend work is done and pushed** (T1, T3 backend, T2 backend). All the frontend work that renders nothing is
done too. Everything else waits on designs, plus the T0 data check and the PR write-up.

**Done 2026-11-02 (non-rendering frontend):**
1. ~~**T3 frontend wiring: Budget Lines.**~~
   - `budgetLines.filters.division: []` default in `sessionUISlice`.
   - `division` added to `getBudgetLineItems`'s destructured key list and mapped to ids.
   - `cor_divisions` added to the `Filters` options type.
   - Export: `handleExport` already passes `resolvedFilters` through unchanged.
   - Tests: `opsAPI.test.js` query string (with a filter and cleared); `BudgetLineItemList.test.jsx` list query +
     export.
   - **Not built (needs designs):** the modal field, tags, buffer state, and a Cypress journey.
2. ~~**T2 frontend, export only.**~~ The Agreements export's "COR" column (which already existed) reads
   `agreement.project_officer_name`, with a `"TBD"` fallback. The per-row `useLazyGetUserQuery` lookups are gone.
   A test in `AgreementsList.test.jsx` covers a named COR and no COR.
- **All green as of 2026-11-02:** frontend lint; frontend unit tests for `opsAPI`, Agreements, Budget Lines,
  Procurement Dashboard and the export helpers; backend `tests/ops/agreement`, `tests/ops/budget_line_items` and the
  agreement/BLI service tests (1,130 passed); Cypress `agreementList`, `budgetLineItemsList`, `procurementDashboard`.

**Pick up here (2026-11-03), in order:**
1. ~~**Backend for the prototype:** `cor_id` + `cors` on both endpoints.~~ Done; see above.
2. ~~**Frontend wiring that renders nothing** for `cor_id`/`cors`.~~ Done 2026-11-03:
   - the state key is **`cor`** (COR objects `{id, name, division_id}`), with `cor: []` defaults in `sessionUISlice`
     for agreements and budgetLines (not the Procurement Dashboard, which only gets a relabel);
   - `opsAPI.getAgreements` and `getBudgetLineItems` send `cor_id=<id>` per COR (`cor` was added to the BLI
     destructured key list);
   - types: `CorFilterOption` + `Filters.cor` (`AgreementsFilterTypes.d.ts`), `cors` (`BudgetLineTypes.d.ts`);
   - tests: `opsAPI.test.js` query strings for both endpoints (with `division`, and cleared); list query + export
     pass-through on both pages. The two `opsAPI` tests failed before the change. The page tests passed from the
     start, because filters are spread through; they guard against regressions.
   - All green: the frontend lint and the full unit suite (5,261 passed).
3. ~~**"Division & Staffing" control**~~ Done 2026-11-03 (details below the list). Original plan:
   - in the modal after Portfolio; reuse `FilterComboBox`/react-select (no new elements);
   - options built from `cor_divisions` + `cors`: for each division, the division option, then its CORs
     (`ABBR - Name`); CORs with a null `division_id` last, ungrouped;
   - selections split into `division` (Division objects) and `cor_id` (COR objects) state, or one list mapped to
     both params in `opsAPI`; decide when building;
   - single-row focus; optional indent;
   - buffer state (apply, reset, sync, `null` → `[]`); tags labeled like the options, remove-by-id;
   - component, keyboard and Cypress tests. Reference: the 2026-11-02 removal commit.
4. **"Portfolio (funding stream)" label** on every portfolio filter (Agreements, Budget Lines, and any other page
   with a portfolio filter; grep `PortfoliosComboBox` and other portfolio labels). Update the tests that query by
   label.
5. **Announcer** (`role="status"`) for filter changes and result counts (C1).
6. ~~**COR column**~~ **Not for now (decided 2026-11-03):** the prototype has no COR column, so none is added.
   `project_officer_name` stays in the API and the export. Revisit if UX adds one.
7. **Procurement Dashboard (T4):** relabel only (`ProcurementDashboardFilterButton.jsx`), with the wording from
   Q7. Update its unit and Cypress tests.
8. **Open questions:** Q2, Q6, Q7.

**Step 3 as built (2026-11-03):**
- `components/Agreements/DivisionStaffingComboBox/`: a thin wrapper over `ComboBox` (react-select, the same as
  every other filter), labelled **"Division & Staffing"**. No new elements.
  - `DivisionStaffingComboBox.helpers.js` builds the options from `cor_divisions` + `cors`:
    - each division (`ABBR - Name`, by abbreviation), then its CORs (`ABBR - Person`, by name);
    - then CORs with no division, ungrouped (`Person`).
  - The order is kept with `ComboBox`'s existing `order` field.
  - Option ids are prefixed (`division-1`, `cor-21`), because a division and a user can share an id.
  - The control splits its selection back into the `division` and `cor` state; a cleared box (`null`) becomes `[]`.
  - Stored COR objects get a frontend-only `division_abbreviation`, so tags can show the division without
    the filter options.
  - Focus is react-select's default single-row highlight, which matches Kim's call. Staff rows are **not
    indented** (optional in the comment; react-select would need a custom option renderer).
- **Agreements:** the field sits after Portfolio in `AgreementsFilterButton.jsx`. `division`/`cor` buffers are in
  `AgreementsFilterButton.hooks.js` (reseed on open, sync on tag removal, apply, reset). Tags are in
  `AgreementsFilterTags.hooks.js`, labelled like the options and removed by id.
- **Budget Lines:** the same in `BLIFilterButton.jsx` / `BLIFilterTags.jsx`. Tag order: portfolios, then
  divisions, then CORs.
- **Tests:**
  - the component (grouped order, distinct ids, keyboard pick of a division + a COR from another division, a
    no-division COR, chips, Backspace removal);
  - the Agreements hook (apply, `null` → `[]`, reset, sync) and tags (labels; removal by id when a division and
    a COR share an id);
  - the Agreements modal by keyboard;
  - the BLI modal by keyboard, plus reset;
  - BLI tags (labels, order, removal by id);
  - a Cypress journey in `agreementList.cy.js` (pick the first option, see rows, remove the tag, back to
    unfiltered).
- Frontend lint is clean, and the full unit suite passes (5,282).
- Not in step 3: the "Portfolio (funding stream)" label (step 4), the announcer (step 5), and the Dashboard relabel
  (step 7).

**Before release / review:**
9. **T0:** run the CORs-without-a-division query (§2, T0) on staging and prod and share the counts with the PO.
10. ~~**PR description**~~ ~~`/ops-pr-review`~~ PR #6480 merged 2026-11-03. Open a new PR from
    `OPS-6457/division-staffing-filter`.
11. Ask the issue author to remove the stale Projects/Reporting testing text (Q5), and review the FigJam diagram (Q6).

### Known issues that are not acceptance-criteria gaps
- The issue's Testing section still lists Projects/Reporting items; ask the author to remove them (Q5).
- The FigJam diagram hasn't been reviewed yet (Q6).

### Local environment gotchas (hit on 2026-10-29)
- Backend tests (`pytest-docker`) need port 5432. Run `docker compose stop db` first, then `docker compose start db`.
- The `backend` container mounts only `ops/`, and `models/` is baked into the image. After pulling `main`, run
  `docker compose up --build -d backend`, or it crashes with an `ImportError`.
- The local DB schema can lag `main`. To apply migrations without reseeding, run
  `docker compose --profile setup build data-import && docker compose --profile setup run --rm --no-deps data-import /bin/sh -c ". .venv/bin/activate && alembic upgrade head"`.
  Don't run the full `data-import` script for this; it drops and reseeds the `ops` schema.
- In `useTagsList` hook tests, pass a **stable** `filters` object. Building it inline in the render callback
  loops the effects until the Vitest worker crashes.

---

## 1. Acceptance criteria → where each one is satisfied

The issue's ACs fall into three kinds. Each kind needs a different split.

**A. Page-specific ACs:** each belongs to exactly one sub-task.

| # | AC | Sub-task |
|---|---|---|
| A1 | Agreements list: limit to agreements whose COR is in the chosen division(s) | **T1** |
| A2 | Budget Lines list: limit to BLIs on agreements whose COR is in the chosen division(s) | **T3** |
| A3 | Agreements list includes the COR's name | **T2** |
| A4 | Procurement Dashboard filter keeps working but is clarified as the COR's division | **T4** |

**B. Behavioral rules:** these hold *per page* and are verified again in every sub-task that adds the filter
(T1, T3, and T4 where it applies).

| # | AC | What it means in code |
|---|---|---|
| B1 | Multiple divisions = union | `IN (…)`; backend test per endpoint |
| B2 | Works with every other filter, tab and FY; independent of portfolio | SQL `AND`; tests combining it with portfolio + FY + `only_my` |
| B3 | Clearing returns unfiltered results; counts, totals and paging match | backend totals/count over the filtered set; frontend reset/remove tests |
| B4 | Exportable lists export the filtered results | frontend export test per page |
| B5 | Primary COR only; the alternate COR is ignored | shared predicate; negative test per endpoint |
| B6 | No COR / COR without division: excluded when filtered, included when not | negative test per endpoint |
| B7 | Divisions offered = only those with ≥1 agreement with a COR in them | `cor_divisions` in each filter-options response |
| B8 | Only narrows; never reveals more | predicate ANDed after the visibility/`only_my` scope; options scoped the same way |

**C. UI-wide rules:** these depend on UX and apply wherever the filter appears.

| # | AC | Sub-task |
|---|---|---|
| C1 | Keyboard: find, set, clear; AT users can tell it's applied and that results changed; not color alone | Built once in **T1** (announcer), reused in T3/T4 |
| C2 | Its name tells it apart from the portfolio's division | Label chosen by UX; applied in T1/T3/T4 |

---

## 2. Proposed sub-tasks

Each sub-task is one vertical slice (backend + frontend + tests) that is shippable and QA-able by itself. Except
where noted, every slice also carries rules B1–B8 and C1–C2 for its page.

### T1: Agreements list: COR's division filter + export  *(blocked on UX for label/control)*
**ACs:** A1, B1–B8, C1, C2
- **Backend** (no UX dependency, can start now):
  - Add `cor_divisions: [{id, name, abbreviation}]` to `/agreements-filters/`. It lists divisions with ≥1
    agreement in the current (`only_my`-scoped) base set whose primary COR is in that division. Update the
    response schema (`schemas/agreements.py:379-388`) and `openapi.yml`.
  - Extract the predicate into a shared helper, `cor_division_agreement_ids(divisions)` /
    `cor_division_options(agreement_scope)`, so T3 reuses it.
  - Param naming: see Q1.
- **Frontend:**
  - `sessionUISlice` gets an `agreements.filters.division: []` default.
  - `opsAPI.getAgreements` maps Division objects to ids **inside the API layer**. Update the dashboard's
    call-site mapping (`ProcurementDashboardPage.jsx:46`) to match.
  - Filter modal fieldset (`AgreementsFilterButton.jsx` / `.hooks.js:11-91`), tags
    (`AgreementsFilterTags.hooks.js:53-176`), and types (`AgreementsFilterTypes.d.ts`).
  - Export: check that `handleExport` passes the filter through (`AgreementsList.jsx:193-207`).
  - **Shared pieces built here, reused later:**
    - a COR's-division combobox, as a thin wrapper over `FilterComboBox` with an `isLoading` prop;
    - a `role="status"` live-region announcer for applied/removed filters and the new result count.
- **Tests:**
  - Backend: filter-options API test (an alternate-only division and a division with no COR are both absent;
    `only_my` scoping holds).
  - Backend: extend `TestAgreementDivisionFilter` with alternate-only, a null-division COR, portfolio-division ≠
    COR-division, and the `only_my` + FY + portfolio intersection.
  - Frontend: `opsAPI.test.js` query string with and without the filter (none exists for `division` today).
  - Frontend: filter-button hooks (apply/reset/reseed), tags (render/remove), page query args, export pass-through.
  - Frontend: announcer text and keyboard set/clear.
  - E2E (thin, the issue's single list journey): choose a division → matching rows; clear → full count.

### T2: Agreements list: show the COR's name  *(small; UX decides column vs. elsewhere)*
**ACs:** A3
- **Backend:** add `project_officer_name` (or nested `{id, full_name}`) to `AgreementListResponse`
  (`schemas/agreements.py:266-292`). Eager-load `project_officer` in `_get_page_agreements`
  (`services/agreements.py:1384-1419`) to avoid N+1. Test that it is null-safe when there is no COR.
- **Frontend:** a column in `AgreementsTable.constants.js` / `AgreementTableRow.jsx`, and whether it is sortable
  (a backend sort is extra work; see Q4).
  - Optional: switch the export's per-row `useLazyGetUserQuery` lookups to the new field.
- **Independent of T1**, so it can ship before or after. The backend half has no UX dependency.

### T3: Budget Lines list: COR's division filter + export  *(depends on T1's shared pieces)*
**ACs:** A2, B1–B8, C1, C2
- **Backend** (no UX dependency):
  - Add the param to `QueryParametersSchema` and `BudgetLineItemFilters` (`services/budget_line_items.py:66-111`).
  - In `filter_query`, add `BudgetLineItem.agreement_id.in_(cor_division_agreement_ids(divs))`. Use a subquery,
    not the conditional Agreement join at `:323-343`.
  - Add `cor_divisions` to `/budget-line-items-filters/`, scoped to the BLIs it already loads after `only_my`.
  - Update `openapi.yml`.
- **Frontend:**
  - `budgetLines.filters.division: []` default.
  - **Add the key to the destructured list in `getBudgetLineItems`** (`opsAPI.js:377-387`).
  - Fieldset and buffer in `BLIFilterButton.jsx`; tag group, removal case and group order in `BLIFilterTags.jsx`.
  - Export pass-through in `budgetLines.helpers.js:465+`.
  - Reuse the combobox and announcer from T1.
- **Tests:**
  - Backend: same matrix as T1, plus `_meta.total_count`, `number_of_pages` and total amounts matching the
    filtered set; BLIs whose agreement has no COR are excluded.
  - Backend: `only_my` intersection, since it is applied in Python after the SQL filter.
  - Frontend: same as T1, minus the announcer unit tests.

### T4: Procurement Dashboard: clarify the existing filter  *(blocked on UX label)*
**ACs:** A4, C2 (and B7 if Q3 = yes)
- Relabel "Division" → the UX-chosen name (`ProcurementDashboardFilterButton.jsx:53-67`), and the tag text if it
  includes a prefix.
- If Q3 = yes: source the options from `/agreements-filters/` `cor_divisions` (from T1) instead of `/divisions/`.
- Adopt the shared announcer from T1 so C1 holds here too.
- Update `ProcurementDashboardPage.test.jsx` and `procurementDashboard.cy.js` (the label and any selector changes).
- Regression check: the same results as today for the same selection.
- **Depends on T1** for the shared pieces; tiny otherwise.

### T0 (pre-release, non-code): data readiness
- Run against staging and prod and share the result with the PO before T1/T3 release:
  ```sql
  SELECT count(DISTINCT a.project_officer_id) FILTER (WHERE u.division IS NULL) AS cors_without_division,
         count(DISTINCT a.project_officer_id)                                    AS cors_total
  FROM agreement a JOIN ops_user u ON u.id = a.project_officer_id;
  ```
  The issue calls this out. User divisions aren't synced at login, so a high count means filtered results
  silently miss agreements.

### Dependency and readiness overview

```
T0 (data check) ── anytime, before release
T2 (COR name)   ── independent; backend can start now
T1 (Agreements) ── backend can start now ─┬─► T3 (Budget Lines)  — backend can start now, frontend after T1
                                          └─► T4 (Dashboard)     — after T1 + UX label
```

| Task | Backend start now? | Frontend blocked on UX? | Size |
|---|---|---|---|
| T0 | n/a | no | XS |
| T1 | yes (options + shared helper) | yes (label, control, announcement copy) | M |
| T2 | yes | yes (column placement) | S |
| T3 | yes (param + options) | yes (same UX as T1) | M |
| T4 | none needed | yes (label) | S |

**Alternative split, layered instead of per page:** one backend PR for T1 + T2 + T3 now, then frontend PRs per
page once UX lands. It gets more done before the designs arrive, but each piece isn't QA-able by itself until its
frontend ships. That works well if the team wants backend progress immediately.

---

## 3. Open questions (decide before ticketing)

1. ~~**Param name.**~~ **Settled 2026-10-29:** keep `division` on Agreements, as T1 shipped it, and use
   `division` on Budget Lines too, for consistency and no churn. The UI label carries the "COR's" distinction (C2).
2. **Should T3 also show the COR on the Budget Lines table or export?** Not required by any AC. Without it, a
   user can't see *why* a BLI matched. Ask UX/PO.
3. ~~**Should the dashboard narrow its options to divisions with a COR (B7)?**~~ **Settled 2026-11-03:** no. The
   Dashboard only gets the relabel (A4), as the story says.
4. ~~**COR column on Agreements**~~ **Settled 2026-11-03:** not for now; the prototype has none.
5. **Stale testing text** in the issue (Projects/Reporting): ask the author to clean it up.
6. **FigJam diagram:** review it for anything that changes the slicing (e.g., a different control or placement).
7. **Procurement Dashboard label wording.** The dev lead proposed "Division & Staffing" for consistency. It offers
   divisions only, though, so "Staffing" may suggest people can be picked. Confirm with UX; an alternative is
   "COR's Division".
8. ~~**Where does a COR with no division go?**~~ **Settled 2026-11-03:** listed without a group.

## 4. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Many CORs have a null division, so filtered results silently drop agreements | High | T0 before release |
| BLI param silently ignored (schema `EXCLUDE`, opsAPI's fixed key list) | Med | Backend API test that the param narrows results; `opsAPI.test.js` query-string test |
| `division=[object Object]` from unmapped Division objects | Med | Map inside `opsAPI` and test it |
| BLI `only_my` runs in Python after SQL, so options and results could disagree | Low | Scope `cor_divisions` from the same post-`only_my` BLI set; test the intersection |
| Renaming the dashboard param breaks it on out-of-order deploys | Low | Keep the `division` alias until T4 |
