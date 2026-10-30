---
issue: 6457
branch: OPS-6457/agreements-cor-division-filter  # all code work for the issue lands here (see "Progress")
status: IN PROGRESS. The issue is still labeled `draft` + `design` (refined 2026-10-29: Projects & Reporting removed). All backend work (T1, T3, T2) and the T1 frontend are done and pushed; what is left is mostly frontend (see "Pick up here"). The draft PR has no description yet.
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

## Progress: where to pick up (updated 2026-10-30)

**Working agreement:** all code work for #6457 is done on `OPS-6457/agreements-cor-division-filter`, behind one
draft PR. Frontend work for slices other than T1 may happen here too, or move to a separate sub-task later;
decide once the UX designs land. The sub-tasks in §2 are now **ordered work items on this branch**, not
separate branches.

### Done on the branch (T1: Agreements list filter + export)
- **Backend:** `/agreements-filters/` returns `cor_divisions` (`[{id, name, abbreviation}]`). It lists only
  divisions with a primary COR on ≥1 agreement, ignores the alternate COR, is scoped by `only_my`, and is
  sorted by name. The response schema and `openapi.yml` are updated.
  - **Param name kept as `division`** on `GET /agreements/`; no rename (decision Q1 is settled for now).
- **Frontend:**
  - A "COR's Division" `FilterComboBox` in the Agreements filter modal. **The label is a placeholder pending UX**;
    the comment in the code marks it.
  - Tags read `COR's Division: <name>` and are removed by id.
  - `agreements.filters.division` in `sessionUISlice` flows into both the list query and the export.
  - `opsAPI.getAgreements` now maps Division **objects** to ids. `ProcurementDashboardPage.jsx` was adjusted to
    pass objects, with no behavior change.
  - A cleared combobox (`null`) is stored as `[]`.
- **Tests:**
  - Backend: `TestAgreementDivisionFilter` covers single, union, no COR, a null-division COR, alternate-only,
    portfolio-division ≠ COR-division, `only_my` intersection, **portfolio + FY intersection** (mutation-checked),
    and options (only primary CORs, `only_my` scoping). API tests check the `cor_divisions` shape and that a
    non-integer division returns 400.
  - Frontend: `opsAPI.test.js` query string; filter-button hook (apply / reset / sync / null); tags; a keyboard
    component test (`AgreementsFilterButton.test.jsx`); the list page query and export.
  - Cypress: a journey in `agreementList.cy.js`.
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
- Not done: sorting by COR (waits on Q4); switching the export's per-row `useLazyGetUserQuery` lookups to the new
  field (frontend, no UX dependency).

### Pick up here, in order (updated 2026-10-30)
**All backend work is done and pushed** (T1, T3 backend, T2 backend). Everything left is frontend, the T0 data
check, and the PR write-up. Done items: T1 totals/paging test, T3 backend, T2 backend (see "Done on the branch").

**Can start now (no UX dependency):**
1. **T3 frontend: Budget Lines filter.** Reuse T1's pattern, including its placeholder "COR's Division" label.
   - `sessionUISlice`: a `budgetLines.filters.division: []` default.
   - `getBudgetLineItems` (`opsAPI.js:377-387`): **add `division` to the destructured key list** (it is dropped
     otherwise), and map Division objects to ids as `getAgreements` does. Add an `opsAPI.test.js` query-string test.
   - `BLIFilterButton.jsx` (modal buffer `:23-118`): a `FilterComboBox` fed by `cor_divisions` from
     `/budget-line-items-filters/`; a cleared combobox stores `[]`.
   - `BLIFilterTags.jsx`: the tag group, the removal case (`:19-75`) and the group order (`:162+`).
   - Export: check that `handleExport` (`budgetLines.helpers.js:465+`) passes the filter through.
   - Tests: the same set as T1 (hook apply/reset/sync/null, tags, keyboard component test, page query, export),
     plus a thin Cypress journey in the Budget Lines spec.
2. **T2 frontend, export only:** switch the export's per-row `useLazyGetUserQuery` lookups
   (`AgreementsList.jsx:215-228`) to `agreement.project_officer_name`, keeping the `"TBD"` fallback; update the
   export test.

**Blocked on UX / PO answers (§3):**
3. **T2 frontend: COR column** on the Agreements table (`AgreementsTable.constants.js`, `AgreementTableRow.jsx`)
   using `project_officer_name`. Placement and sortability wait on Q4; a sortable column also needs a backend sort.
4. **T4: Procurement Dashboard.** Relabel "Division" (`ProcurementDashboardFilterButton.jsx:53-67`) once UX picks
   the name. If Q3 = yes, source options from `/agreements-filters/` `cor_divisions` instead of `/divisions/`.
   Update `ProcurementDashboardPage.test.jsx` and `procurementDashboard.cy.js`.
5. **Final filter label:** replace the "COR's Division" placeholder (Agreements, and Budget Lines once built).
6. **Screen-reader announcer** (`role="status"`) for filter changes and result counts, shared across the list
   pages; the wording comes from UX.

**Before release / review:**
7. **T0:** run the CORs-without-a-division query (§2, T0) on staging and prod and share the counts with the PO.
8. **PR description** for the draft PR. Don't use `Closes`/`Fixes`. Call out the placeholder label, the deferred
   announcer, and any UX-blocked items still open. Then run `/ops-pr-review`.
9. Ask the issue author to remove the stale Projects/Reporting testing text (Q5), and review the FigJam diagram (Q6).

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
  - `sessionUISlice` gets an `agreements.corDivisions: []` default.
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
  - `budgetLines.corDivisions: []` default.
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
3. **Should the dashboard narrow its options to divisions with a COR (B7)?** B7 says "the divisions offered",
   which reads as everywhere. A4 says "keeps working as it does today". Recommendation: yes, it's a tiny change
   in T4.
4. **COR column on Agreements:** visible column vs. expanded row; sortable or not.
5. **Stale testing text** in the issue (Projects/Reporting): ask the author to clean it up.
6. **FigJam diagram:** review it for anything that changes the slicing (e.g., a different control or placement).

## 4. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Many CORs have a null division, so filtered results silently drop agreements | High | T0 before release |
| BLI param silently ignored (schema `EXCLUDE`, opsAPI's fixed key list) | Med | Backend API test that the param narrows results; `opsAPI.test.js` query-string test |
| `division=[object Object]` from unmapped Division objects | Med | Map inside `opsAPI` and test it |
| BLI `only_my` runs in Python after SQL, so options and results could disagree | Low | Scope `cor_divisions` from the same post-`only_my` BLI set; test the intersection |
| Renaming the dashboard param breaks it on out-of-order deploys | Low | Keep the `division` alias until T4 |
