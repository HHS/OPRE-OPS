# Performance Results — 2026-09-24

## DB-Level Pagination Implementation

**Branch:** OPS-6140/backend-performance-improvements
**Changes:** UNION ALL ID query, `_get_all_matching_ids`, `_get_page_agreements`, `only_my` pushed to SQL

### Load Test Results

| Endpoint | Baseline (2026-09-23) | After DB Pagination | Δ |
|---|---|---|---|
| `GET /agreements/` median | 1,000ms | 1,000ms | 0ms |
| `GET /agreements/` p95 | 1,500ms | 1,500ms | 0ms |
| `GET /budget-line-items/` median | 82ms | 84ms | +2ms (noise) |

### Why No Local Improvement

The load test shows no change because the local dataset has only **24 agreements** — all of which fit within the `limit=25` page. The DB pagination code runs correctly (`count: 24, data len: 24` confirmed), but with 24 total rows the `page_ids = all_ids[0:25]` slice equals `all_ids`. Same work as before.

**The benefit is at production scale.** With ~200+ agreements:
- Old path: fetch all 200+ agreements + all their BLIs into Python, sort/filter, then slice to 25
- New path: SQL UNION ALL returns 25 IDs, then fetch only those 25 rows with eager loads

The totals query (for summary cards) still loads all matching agreements, but that's bounded by filters (FY, portfolio, etc.) and much lighter than the old full serialization path.

### What Was Changed

1. **`get_list()`** restructured to use ID-based pagination
2. **`_get_all_matching_ids()`** — UNION ALL across 5 subclass tables, SQL ORDER BY for AGREEMENT/TYPE sorts, SQL ownership filter via existing `_apply_user_association_filter()`
3. **`_get_page_agreements()`** — fetches only the page of IDs with full eager loads for serialization
4. **Totals query** — separate lightweight fetch with only BLI/procurement_actions/procurement_shop eager loads
5. **`check_user_association` fix** — `_is_editable` no longer does a redundant `db_session.get(Agreement, id)`

### Next Steps

- Verify on staging/dev with production data volume (100+ agreements)
- Add eager loading back to `_get_page_agreements` now that it's scoped to the page (already done)
- BLI list DB-level pagination (separate PR)
