# Local Performance Baseline — 2026-09-23

**Branch:** OPS-6140/backend-performance-improvements
**Purpose:** Pre-improvement baseline to measure against after backend performance fixes
**Environment:** Local Docker stack (`http://localhost:8080`)
**Test config:** 10 users, spawn rate 2/s, 5 min run, default 1–3s throttle between requests

## How to Re-run

```bash
export JWT_TOKEN="<token from localhost:3000 DevTools → Local Storage → access_token>"
cd backend/ops_api
pipenv run locust \
  -f ../../performance_tests/locustfile.py \
  --host=http://localhost:8080 \
  --users 10 \
  --spawn-rate 2 \
  --run-time 5m \
  --headless \
  --html ../../performance_tests/results/$(date +%Y-%m-%d)/local-baseline.html \
  --csv ../../performance_tests/results/$(date +%Y-%m-%d)/local-baseline
```

---

## Overall Results

| Metric | Value |
|---|---|
| Total requests | 1,379 |
| Failures | 75 (5.4%) |
| Requests/s | 4.64 |
| Median response time | 25ms |
| Average response time | 87ms |
| p95 | 230ms |
| p99 | 1,100ms |
| Max | 3,924ms |

> **Note on failures:** All 75 failures are data-related 404s — the locustfile hits IDs that don't exist in local test data (`administrative-and-support-projects/`, `research-projects/`, `agreement-history/[id]`, `can-history/[id]`). This is consistent with all prior test runs and is not a performance issue.

---

## Key Endpoints

These are the endpoints most relevant to the planned improvements.

### Agreements List — Primary Concern

| Metric | Value |
|---|---|
| Request count | 58 |
| Failures | 0 |
| Median | 880ms |
| Average | 968ms |
| p90 | 1,400ms |
| p95 | 1,500ms |
| p99 | 1,600ms |
| Max | 1,576ms |

**Root causes:** No DB-level LIMIT/OFFSET (5 full-table scans, Python slice), N+1 lazy loads in `_compute_agreement_totals()` before pagination.

### Agreement Detail

| Metric | Value |
|---|---|
| Request count | 33 |
| Failures | 0 |
| Median | 57ms |
| Average | 377ms |
| p95 | 3,400ms |
| p99 | 3,900ms |
| Max | 3,924ms |

High variance — occasional very slow outliers.

### Budget Line Items List — Healthy Baseline

| Metric | Value |
|---|---|
| Request count | 117 |
| Failures | 0 |
| Median | 62ms |
| Average | 74ms |
| p90 | 110ms |
| p95 | 170ms |
| p99 | 210ms |
| Max | 231ms |

Already well-optimized via eager loading (`selectinload`/`joinedload`). Still no DB-level LIMIT/OFFSET but less impactful due to single query.

### Other Notable Endpoints

| Endpoint | Median | Avg | p95 |
|---|---|---|---|
| `GET /cans/` | 72ms | 84ms | 160ms |
| `GET /cans/[id]` | 110ms | 127ms | 300ms |
| `GET /portfolios/` | 77ms | 81ms | 120ms |
| `GET /projects/` | 86ms | 92ms | 130ms |
| `GET /agreements-filters/` | 15ms | 22ms | 68ms |
| `GET /budget-line-items-filters/` | 78ms | 91ms | 180ms |

---

## Investigation Results (2026-09-23)

After adding eager loading for `budget_line_items`, `procurement_actions`, `procurement_shop`,
`project`, `team_members`, and the deep `BLI→CAN→Portfolio→[team_leaders, division]` chain,
and fixing `_is_editable` to skip a redundant `db_session.get(Agreement, id)` re-fetch,
the agreements list remained at ~900ms median. Investigation revealed:

- The locustfile calls `/api/v1/agreements/` with **no params** — returns all 24 agreements
  with all their BLIs fully serialized (470KB response)
- Even the realistic frontend call (`limit=25&offset=0&include_fees=true`) is ~900ms
- With 1,095 BLIs in local test data, `selectinload` fires a single `WHERE agreement_id IN (...)`
  returning all 1,095 rows just to compute totals for 24 agreements before slicing to a page

**Conclusion:** The dominant cost is the work done *before* pagination — loading all BLIs for
all agreements to compute summary card totals. The eager loading PRs were correct fixes (they
eliminate real N+1 queries that would worsen at scale), but DB-level LIMIT/OFFSET and moving
totals computation to a separate aggregate query are what will move the needle on response time.

## Planned Improvements (revised priority)

1. **DB-level LIMIT/OFFSET on agreements list** — avoid loading all BLIs for all agreements;
   requires either moving totals to a separate aggregate query or accepting totals-only-for-page
2. **Eager load `budget_line_items` + chain** ✅ — done; correct but not yet measurably impactful
   at local data scale; will prevent regression at production scale
3. **Functional index on `fiscal_year` expression** — one migration; helps FY-filtered queries
4. **DB-level LIMIT/OFFSET on BLI list** — simpler, one query path

---

## Comparison Target

After each improvement, re-run this same test and compare `GET /agreements/` median and p95 against the baseline values above (880ms median, 1,500ms p95).

Prior production results for reference (Feb 2026, staging normal load, 10 users):
- `GET /agreements/` avg: 1,824ms
- `GET /budget-line-items/` avg: 415ms (already improved)
