# Agreements List Performance Investigation — OPS-6140

## Background

The agreements list page (`GET /api/v1/agreements/`) was changed to default the fiscal year filter
to "All FYs" instead of the current fiscal year. This investigation was triggered by concerns that
the "All" default would hurt initial load performance.

---

## Baseline Measurements

All tests run locally with 124 agreements (24 original + 100 load test) and ~1,200 BLIs.
Load tests: 10 concurrent users, 5 min, `limit=25&offset=0&include_fees=true`.

| Scenario                                            | Median  | Avg     | p95     |
| --------------------------------------------------- | ------- | ------- | ------- |
| Original baseline (24 agreements, old locustfile)   | 880ms   | 968ms   | 1,500ms |
| Realistic baseline (24 agreements, frontend params) | 1,000ms | 1,088ms | 1,500ms |
| Main branch (124 agreements, "All" filter)          | 1,200ms | 1,226ms | 1,600ms |

**Direct single-request timings (124 agreements):**

| Filter      | Response time (3 runs avg) |
| ----------- | -------------------------- |
| All FYs     | ~950ms                     |
| FY2026 only | ~345ms                     |

The FY filter is **~3× faster** despite matching 110/124 agreements. The speedup comes from
fewer BLIs loaded during totals computation — not from fewer agreements.

---

## Root Cause Analysis

### The bottleneck: `_compute_agreement_totals()`

`AgreementsService.get_list()` in `backend/ops_api/ops/services/agreements.py`:

1. Fetches ALL matching agreement IDs via SQL
2. Loads ALL matching agreements + their BLIs/procurement_actions into Python (for totals)
3. Computes `total_contract_amount`, `total_partner_amount`, `award_type` counts, etc.
4. **Then** slices to the requested page

Step 2 is the bottleneck. With "All FYs", it loads every agreement's BLIs for every request.
With a FY filter, the same code runs but the BLIs are filtered to that year — far fewer rows.

`agreement_total` and `award_type` are Python computed properties (not DB columns), which is
why they can't be replaced with a simple `SELECT SUM(...)` aggregate query without significant
reimplementation.

### Why the old FY default masked this

Before "All FYs" became the default, the fiscal year WHERE clause acted as an implicit
performance guard — users saw only agreements with BLIs in the current year, and the totals
computation touched a small slice of the data. No one noticed the bottleneck because the
filter was always applied.

---

## Changes Tried and Their Impact

### 1. Locustfile — realistic frontend params ✅ Kept

**Commits:** `095c233fd`, `51f832843`

Updated the Locust load test to send `limit=25&offset=0&include_fees=true` matching what the
real frontend sends, rather than no params at all. Also fixed BLI sort param (was sending
invalid `sort_conditions=AGREEMENT` to the BLI endpoint), separated cache-population from
test stats. Added gitignore for HTML/CSV result files.

**Impact:** Made load test results meaningful. Prior results were measuring an unpaginated
call that didn't reflect real user behavior.

---

### 2. Eager loading for agreements list ↩️ Reverted

**Commits:** `bec9d4974`, `e30345db9` → reverted in `bd7e0d74b`

Added `selectinload` for `budget_line_items`, `procurement_actions`, `procurement_shop`,
`project`, `team_members`, and the `BLI→CAN→Portfolio` chain to `_build_base_query()`.

**What worked:** Eliminated N+1 lazy loads per agreement. Correct in principle.

**Why reverted:** With "All FYs" and no DB-level pagination, the eager loads still touch
every BLI for every agreement before the page is sliced. At 124 agreements it added ~120ms
overhead vs. the baseline. The eager loading will be re-added **after** DB pagination is in
place, scoped to only the page rows.

---

### 3. `check_user_association` fix ✅ Kept

**Commit:** `e30345db9` (kept in the revert `bd7e0d74b`)

`_is_editable()` was calling `associated_with_agreement(agreement.id)` which did a redundant
`db_session.get(Agreement, id)` re-fetch per serialized page item, then walked
`BLI→CAN→Portfolio→team_leaders` via lazy loads.

Changed to call `check_user_association(agreement, user)` directly using the already-loaded
agreement object. Genuine saving per page item with no downside.

---

### 4. DB-level pagination via UNION ALL ↩️ Reverted (pending decision)

**Commits:** `e371cba68`, `553d0ebab`, `48ebb077b`

Replaced the 5 per-subclass Python-paginated queries with a `UNION ALL` ID query, then two
targeted fetches: one for totals (all matching agreements, lightweight), one for the page
(25 rows, full eager loads).

**What worked:** Pagination is architecturally correct — `count: 124, data len: 25` confirmed.
The page fetch is fast. `only_my` filter pushed to SQL via existing `_apply_user_association_filter`.

**Why it doesn't help the "All" case:** The totals query still loads all 124 agreements' BLIs.
Load test showed identical 1,200ms median on both branches. The fix is correct for production
scale with FY/portfolio filters applied, but can't be proven locally and doesn't address
the specific scenario (All FYs, unfiltered).

---

### 5. Load test fixture expansion ✅ Kept

**Commits:** `b75e8fbcc`, `77f0989d7`

Added 100 load test agreements (IDs 25–124) with 10 BLIs each to the fixture, enabling
meaningful local benchmarking with a dataset that exceeds the page size.

---

### 5. SQL aggregates for `_compute_agreement_totals` ↩️ Reverted (pending decision)

**Commits:** `5fe477193`, `0486f697a`, `75ae4ebf8`

Replaced the Python loop in `_compute_agreement_totals()` with SQL queries:
- Query 0: `(id, agreement_type)` — drives `type_counts` including all-DRAFT agreements
- Query 1: Per-agreement `SUM(amount + fees)` — one SQL aggregate per agreement
- Query 2: CASE-based `award_type` (NEW/CONTINUING/None) via correlated EXISTS subqueries

**What worked:** Endpoint no longer 500s, returns correct data (`count: 124, data len: 25`,
all 10 totals keys populated with correct values).

**Implementation challenges encountered:**
- `BudgetLineItem.fees` SQL expression contains correlated subqueries that break when used
  in a multi-agreement GROUP BY — required switching to per-agreement queries
- SQLAlchemy auto-correlation on the `has_non_draft`/`awarded_date` EXISTS subqueries
  required explicit `.correlate(Agreement)` to fix a runtime `InvalidRequestError`

**Single-request timing (124 agreements):**

| Filter | Before | After SQL aggregates | Δ |
|---|---|---|---|
| All FYs | ~950ms | ~1,020ms | +70ms (slightly worse) |
| FY2026 | ~345ms | ~420ms | +75ms (slightly worse) |

**Load test results (10 users, 5 min, 124 agreements):**

| Metric | Main baseline | SQL aggregates |
|---|---|---|
| `GET /agreements/` median | 1,200ms | 1,200ms |
| `GET /agreements/` p95 | 1,600ms | 2,800ms |

**Why it didn't improve:** The per-agreement query loop (one SQL `SUM` per agreement)
trades BLI row loading for N round-trips. With 124 agreements that's 124 extra queries
per request — worse under concurrent load (p95 degraded from 1,600ms to 2,800ms).

The award_type SQL (Query 2) is efficient — one query for all agreements. The amount
computation (Query 1) is the bottleneck. A true GROUP BY approach would fix it but
requires rewriting the `fees` expression to avoid the correlation issue, which is
non-trivial (the expression was designed for per-BLI context, not bulk aggregation).

---

## Options to Make "All FYs" Faster

The core problem: **the summary cards need totals across all agreements, but computing those
totals requires loading all agreements' BLIs into Python.** Any solution must either reduce
that load or defer it.

---

### Option A: Revert "All" default → current FY default (UX change) ⚡ Fastest

**What:** Change the frontend default back to current FY. "All FYs" remains available
as an explicit user choice.

**Performance:** ~3× faster on initial load (345ms vs 950ms measured locally).

**UX tradeoff:** Users who want to see all agreements must click to change the filter.
May surprise users who expected the "All" change and now don't see certain agreements.

**Engineering effort:** 1-line frontend change.

---

### Option B: Replace totals computation with SQL aggregates 🔧 High effort

**What:** Rewrite `_compute_agreement_totals()` and `award_type` classification as SQL
`SUM`/`COUNT GROUP BY` queries that run at the DB level instead of iterating Python objects.

**Performance:** Totals query would run in milliseconds regardless of agreement count or
BLI count. Eliminates the Python iteration bottleneck entirely.

**Technical challenge (discovered):** The `award_type` CASE expression was successfully
implemented in SQL (correlated EXISTS + CASE). The blocking problem is `agreement_total`:

- `BudgetLineItem.fees` has a SQL expression (`@fees.expression`) but it contains
  correlated subqueries (`Agreement.id == cls.agreement_id`) designed for per-BLI context.
- When used inside a multi-agreement `GROUP BY`, SQLAlchemy auto-correlates and strips the
  FROM clause → `InvalidRequestError: no FROM clauses`.
- Per-agreement queries (N queries for N agreements) fix the correlation but trade BLI row
  loading for N DB round-trips — under concurrent load, p95 degraded from 1,600ms → 2,800ms.

**The actual fix needed:** Rewrite the `fees` SQL expression to work in a bulk GROUP BY
context — either by using a lateral join, a CTE, or by inlining the fee lookup without
relying on SQLAlchemy's correlated subquery mechanism. This is the remaining hard work.

**Engineering effort:** High. `BudgetLineItem.fees` is used in many places; changing its
SQL expression has broad impact. A safe path: add a separate `fees_bulk_expr` class method
that works in aggregate context, keeping the existing expression for per-row use.

---

### Option C: Lazy-load totals (UX change) 🎨 Moderate effort

**What:** Return the page data immediately without totals. Fetch totals in a separate
subsequent API call that the frontend fires asynchronously after first render.

**Performance:** Initial render shows the agreement rows instantly (~200ms for 25 rows).
Summary cards show a loading state, then populate ~1s later.

**UX tradeoff:** Summary cards (Total Contract Amount, etc.) load after the table, which
may feel like a regression if users rely on them for decision-making on the first view.
Standard pattern used by many analytics dashboards.

**Engineering effort:** Medium. Backend: add a `/agreements/totals` or query param to
skip totals. Frontend: decouple totals fetch from the list fetch, add skeleton state to
summary cards.

---

### Option D: Cache totals server-side 📦 Moderate effort

**What:** Cache `_compute_agreement_totals()` results per user/filter combination with a
short TTL (e.g. 30s). Subsequent requests within the window return cached totals instantly.

**Performance:** First request still slow. Repeated requests (navigating away and back,
page refresh, concurrent users with same filter) hit the cache.

**Tradeoff:** Totals may be slightly stale. Acceptable for summary cards, not for
transaction-critical data.

**Engineering effort:** Medium. Redis or in-process cache. Cache key = hash of filter
params + user ID.

---

### Option E: Keep "All" but add a smart default via URL param 🎨 Low-medium effort

**What:** Keep "All FYs" as the visible default but send `fiscal_year=<current>` on
the initial API call. The filter UI shows "All" but the API call is scoped. A "Load all
fiscal years" action triggers the unfiltered call.

**Performance:** Initial load fast (FY-scoped). "All" feels available but actual full
load is deferred to explicit user action.

**UX tradeoff:** The filter shows "All" but data is actually scoped — this is misleading
unless the UX communicates "showing FY2026, click to load all."

**Engineering effort:** Low-medium. Frontend change only.
