---
issue: N/A
branch: data/prod-to-maps-data-comparison-script
---

# Feature Story: Compare MAPS Budget Line Export Against Production

## Story Overview

**Ticket:** N/A (no ticket provided)
**Title:** Standalone data_tools script that splits a legacy MAPS budget-line TSV export into "still exists in OPS" and "not in OPS" CSV files, dropping rows for budget lines that were deleted from OPS after import.
**Story Points:** N/A

## Background

### Current State

The legacy MAPS system produced a tab-separated export of budget lines (columns: `Effective Date`, `Requested by`, `How Requested`, `Change Reason(s)`, `Who Updated`, `Fiscal Year`, `CAN`, `Sys_Budget_ID`, `Project Title`, `CIG Name`, `CIG Type`, `Line Desc`, `Date Needed`, `Amount`, `PROC Fee Amount`, `Status`, `Comments`, `New (N) vs. Continuing (C)`, `Applied Research (AR) vs. Evaluative (EV)`). Some of these `Sys_Budget_ID` values were imported into OPS as `BudgetLineItem.id`. Since then, some of those BudgetLineItems have been deleted from OPS (e.g. via `load_remove_budget_lines`). There's currently no tool to reconcile the MAPS export against current OPS state.

`data_tools/src/load_remove_budget_lines/utils.py` already defines a `BudgetLineItemData` dataclass with the exact 19 fields needed here (it's the "delete a budget line by Sys_Budget_ID" loader). This story reuses that class rather than duplicating it.

OPS does **not** have a table literally named `budget_line_item_version`. It uses `sqlalchemy-continuum` (`models/base.py`: `make_versioned(user_cls=None)`, `BaseModel.__versioned__ = {}`), which generates a shadow `<table>_version` table for every `BaseModel` table, including `budget_line_item_version`. This was confirmed empirically against the real test Postgres DB (via a temporary, since-reverted probe test using the `loaded_db`/`db_with_data` fixtures in `tests/load_remove_budget_lines/`):

- Inserting `ContractBudgetLineItem(id=15000, ...)` then deleting it produced two rows in `budget_line_item_version` for `id=15000`:
  - `transaction_id=5, operation_type=0 (INSERT), end_transaction_id=7`
  - `transaction_id=7, operation_type=2 (DELETE), end_transaction_id=None`
- An id that was never created produced **zero** rows in `budget_line_item_version`.

So: **the current/terminal version of a given `id` is the row where `end_transaction_id IS NULL`.** If that row's `operation_type == 2` (continuum's `Operation.DELETE`), the budget line was deleted. If no row exists at all, the id never existed in OPS.

**Correction found in review:** `end_transaction_id IS NULL` on its own is *not* deleted-specific — it also matches the terminal version of every **live** row (an insert that was never touched has `operation_type=0, end_transaction_id=NULL`; after an update, the *new* terminal row is `operation_type=1, end_transaction_id=NULL`, and only the *superseded* row gets `end_transaction_id` set). This was verified empirically the same way: seeding a live BLI and checking its version row before and after an in-place update, both terminal rows had `end_transaction_id=NULL`. The original plan's probe only ever exercised the deleted case, so this was missed. **The query must filter on `operation_type == Operation.DELETE` in addition to `end_transaction_id IS NULL`** — see the corrected `get_deleted_bli_ids` definition below.

Because `BudgetLineItem` uses joined-table inheritance (`ContractBudgetLineItem`, `GrantBudgetLineItem`, `IAABudgetLineItem`, `DirectObligationBudgetLineItem`, `AABudgetLineItem` all extend it), every insert/delete of a subclass row also inserts/deletes the shared parent-table row in the same flush. That means **only the base `budget_line_item_version` table needs to be queried** — no need to check the 5 subtype `_version` tables separately.

### Desired State

A standalone CLI script in `backend/data_tools/` that:
1. Reads the MAPS TSV/.txt export.
2. For each row's `Sys_Budget_ID`, determines whether it currently exists as a live `BudgetLineItem`, was deleted, or never existed in OPS.
3. Writes two CSVs:
   - **Existing** — rows whose `Sys_Budget_ID` matches a live `BudgetLineItem.id`, with one extra `OBE` column populated from `BudgetLineItem.is_obe`.
   - **Missing** — rows whose `Sys_Budget_ID` never matched any `BudgetLineItem.id` (including rows with a blank or non-numeric `Sys_Budget_ID`).
4. Silently drops rows whose `Sys_Budget_ID` matches a `BudgetLineItem.id` that was deleted (per the version-table check) — they appear in neither output file, only in the log.

### User Story

As a developer reconciling legacy MAPS data against OPS, I want a script that separates "still valid in OPS," "was deleted from OPS," and "never made it into OPS" budget lines so I can clean up the MAPS export / drive follow-up decisions.

### Acceptance Criteria
- [ ] Given the MAPS TSV, every row with a `Sys_Budget_ID` matching a live `BudgetLineItem` lands in the existing-lines CSV with a correct `OBE` column: `"True"`/`"False"` when `is_obe` is set, `""` (empty) when `is_obe` is `None`.
- [ ] Every row with a `Sys_Budget_ID` matching a **deleted** `BudgetLineItem` (per `budget_line_item_version`) is excluded from both output files.
- [ ] Every row with a `Sys_Budget_ID` that never existed in OPS, or with a blank or non-numeric `Sys_Budget_ID`, lands in the missing-lines CSV.
- [ ] Both output files use the original TSV header text as column headers (plus `OBE` on the existing file).
- [ ] The script connects to the DB the same way `load_data.py` does (env-driven config via `.env`), but performs no writes/commits.

## Technical Context

### Related Components
- `data_tools/src/load_remove_budget_lines/utils.py` — source of the reused `BudgetLineItemData` dataclass.
- `data_tools/src/common/utils.py` — `get_config(env)` for DB config.
- `data_tools/src/common/db.py` — `init_db_from_config(config)` returns `(engine, metadata)`, **not** a session (it even discards the session `init_db` builds internally: `_, engine = init_db(...)`). The script must build its own session the same way `load_data.py` does — `Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))`, used as `with Session() as session:` — just without calling `setup_triggers`/`get_or_create_sys_user`, since this script performs no writes.
- `data_tools/src/azure_utils/utils.py` — `get_csv(path, config, dialect="excel-tab")` returns a `csv.DictReader`, not a raw file handle (the `CLAUDE.md` "file-like object" phrasing is loose). This matters for header validation: `reader.fieldnames` must be read *before* the reader is consumed (e.g. before `list(reader)`), since `fieldnames` is only populated by reading the header row on first access/iteration and a `DictReader` can't be rewound. Reused so the input file can be a local path (per this task) or an Azure blob URL, matching the existing paradigm.
- `models/budget_line_items.py` — `BudgetLineItem` (base table, has `is_obe`). Note `is_obe: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)` (`models/budget_line_items.py:117`) — the column is **nullable**, unlike `on_hold`/`certified` next to it which are `Mapped[bool]`. `default=False` is an ORM-side default that only applies on new inserts through SQLAlchemy; migration `2025_07_17_1951-808b957abe3f` added the column `nullable=True` with no `server_default` and no backfill, so a live BLI created before that migration can have `is_obe = None`, distinct from an explicit `False`.
- `models/base.py` — `sqlalchemy-continuum` setup (`make_versioned`, `__versioned__`).
- `sqlalchemy_continuum.version_class(BudgetLineItem)` — returns the mapped class for `budget_line_item_version`. Requires SQLAlchemy's mappers to already be configured (continuum builds each version class lazily via the `mapper_configured` event); calling `version_class(...)` before that happens raises `ClassNotVersioned` (reproduced during this plan's own investigation). Nothing else in the repo calls `version_class` (confirmed via grep), so this module must call `sqlalchemy.orm.configure_mappers()` itself once, before the first `version_class(BudgetLineItem)` call, rather than assuming some other import path already triggered it.

### Dependencies
- `sqlalchemy-continuum==1.7.0` (already a dependency of `data_tools`).
- No new third-party packages needed.

### Assumptions
- All past BudgetLineItem deletions went through the SQLAlchemy ORM (e.g. `load_remove_budget_lines`, the API), so they're captured by continuum. A raw-SQL `DELETE` outside the ORM would bypass continuum and make that id look like "never existed" instead of "deleted." This is a known limitation, not fixed by this script.
- The input file's header row exactly matches the 19 expected column names (case/spacing as given in the task). The script validates this and fails fast on mismatch rather than silently mis-mapping columns.
- `Sys_Budget_ID` values are the same integer space as `BudgetLineItem.id` (confirmed: joined-table inheritance shares one `id` PK across all BLI subtypes).
- Duplicate `Sys_Budget_ID` values across multiple rows (multiple MAPS change-history rows for one budget line) are expected and are **not deduplicated** — each row is classified independently but consistently, since classification is keyed only on the id.

## Implementation Plan

### Approach

A new standalone module (not wired into `load_data.py`'s `--type` dispatcher, since this performs no DB writes and needs none of its `sys_user`/history-trigger scaffolding) with its own `click` CLI entrypoint, following `load_data.py`'s `.env`-driven connection pattern for the DB half only.

Column mapping (original TSV header → reused `BudgetLineItemData` field — the existing dataclass uses different field names than this file's headers, so a small mapping function is needed, mirroring the `create_budget_line_item_data` pattern already used in `load_master_spreadsheet_budget_lines_v2/utils.py`):

| TSV header | `BudgetLineItemData` field |
|---|---|
| `Effective Date` | `EFFECTIVE_DATE` |
| `Requested by` | `REQUESTED_BY` |
| `How Requested` | `HOW_REQUESTED` |
| `Change Reason(s)` | `CHANGE_REASONS` |
| `Who Updated` | `WHO_UPDATED` |
| `Fiscal Year` | `FISCAL_YEAR` |
| `CAN` | `CAN` |
| `Sys_Budget_ID` | `SYS_BUDGET_ID` |
| `Project Title` | `PROJECT_TITLE` |
| `CIG Name` | `CIG_NAME` |
| `CIG Type` | `CIG_TYPE` |
| `Line Desc` | `LINE_DESC` |
| `Date Needed` | `DATE_NEEDED` |
| `Amount` | `AMOUNT` |
| `PROC Fee Amount` | `PROC_FEE_AMOUNT` |
| `Status` | `STATUS` |
| `Comments` | `COMMENTS` |
| `New (N) vs. Continuing (C)` | `NEW_VS_CONTINUING` |
| `Applied Research (AR) vs. Evaluative (EV)` | `APPLIED_RESEARCH_VS_EVALUATIVE` |

Output rows are built from the **raw `DictReader` row dict** (original header keys, untouched string values), not from the dataclass's stringified fields — the dataclass instance is only used transiently to obtain a validated `int` `Sys_Budget_ID` for the DB lookup. This sidesteps any string round-tripping quirks in the dataclass's `__post_init__` and satisfies "same columns as input, pass-through."

### Files to Create
- `data_tools/src/compare_prod_to_maps_budget_lines/__init__.py` — empty.
- `data_tools/src/compare_prod_to_maps_budget_lines/utils.py` — core logic (pure functions, unit-testable):
  - `EXPECTED_HEADERS: list[str]` — the 19 original headers, in order (source of truth for both input validation and output headers).
  - `create_compare_budget_line_data(row: dict) -> BudgetLineItemData` — maps a raw TSV row dict to the reused dataclass (imported from `data_tools.src.load_remove_budget_lines.utils`). The dataclass's `__post_init__` raises a bare `ValueError` in two distinct cases that this function's caller must not conflate (see Decision 4a): a blank/falsy `Sys_Budget_ID` (`if not self.SYS_BUDGET_ID: raise ValueError("SYS_BUDGET_ID is required.")`), and a truthy-but-non-numeric value like `"ABC"` (passes that check, then fails inside `int(self.SYS_BUDGET_ID)`). Both are plain `ValueError` with only the message text to distinguish them.
  - `chunked(items, size)` — small batching helper for `IN (...)` queries.
  - `get_existing_bli_obe_map(session, ids: set[int]) -> dict[int, Optional[bool]]` — chunked `select(BudgetLineItem.id, BudgetLineItem.is_obe).where(BudgetLineItem.id.in_(chunk))` against the live table. Return type is `Optional[bool]`, not `bool` — `is_obe` is nullable (see Related Components), so a live BLI can map to `None`.
  - `get_deleted_bli_ids(session, ids: set[int]) -> set[int]` — chunked query against `sqlalchemy_continuum.version_class(BudgetLineItem)` filtering `.id.in_(chunk)`, `.end_transaction_id.is_(None)`, **and** `.operation_type == Operation.DELETE` (from `sqlalchemy_continuum.operation.Operation`). All three conditions together are required: `end_transaction_id IS NULL` alone also matches the terminal version of every live row (confirmed empirically — see Background), so without the `operation_type` filter this helper would return live ids and `classify_budget_lines` would silently drop them from both output files, violating AC #1. With the filter in place, the returned set is deleted-only by construction, so no anomaly logging is needed here.
  - `classify_budget_lines(session, rows: list[dict]) -> tuple[list[dict], list[dict]]` — orchestrates: parse each row, catching `ValueError` from `create_compare_budget_line_data` into the missing bucket directly (bypassing the DB-lookup step, since there's no valid id to look up). Per Decision 4a, this catch covers two distinct causes — blank `Sys_Budget_ID` and non-numeric `Sys_Budget_ID` (e.g. `"ABC"`) — and the row is logged with a label that names which one occurred (checking `row.get("Sys_Budget_ID")`/the mapped `Sys_Budget_ID` value truthiness directly, not by parsing the exception message) rather than a single generic "blank-id" label that would misdescribe the non-numeric case. Splits remaining ids into existing/deleted/missing via the two query helpers above, and builds `(existing_rows, missing_rows)` — `existing_rows` have an added `"OBE"` key, serialized as `"True"`/`"False"` when `is_obe` is set and `""` (empty string, not the literal text `"None"`) when `is_obe` is `None` (see Decision 7). Logs summary counts (total, existing, deleted-dropped, missing-unmatched-id, missing-blank-id, missing-non-numeric-id).
  - `write_rows_csv(path: str, rows: list[dict], headers: list[str]) -> None` — thin `csv.DictWriter` wrapper.
  - `run(input_path: str, existing_output_path: str, missing_output_path: str, session: Session, config) -> None` — calls `get_csv(input_path, config, dialect="excel-tab")` to get a `csv.DictReader`, reads `reader.fieldnames` immediately (before consuming any rows) and compares it **exactly** (`reader.fieldnames == EXPECTED_HEADERS`, not a set comparison — order matters too) against `EXPECTED_HEADERS`, raising/logging a clear error and stopping on any mismatch. Only after that check passes does it consume the rows (`list(reader)`), call `classify_budget_lines`, and write both output files. Note: a trailing tab in the real export would produce a `None` entry in `reader.fieldnames` (an extra, unnamed column), which this exact-match check correctly rejects rather than silently misaligning columns — that's desired fail-fast behavior, not a bug to work around.
- `data_tools/src/compare_prod_to_maps_budget_lines/main.py` — CLI entrypoint mirroring `load_data.py`'s boilerplate (dotenv load, loguru setup) but with its own `click.command()`:
  - `--env`
  - `--input-file` (path or Azure blob URL, passed to `get_csv`)
  - `--existing-output` (default `existing_budget_lines.csv`)
  - `--missing-output` (default `missing_budget_lines.csv`)
  - Mirrors `load_data.py`'s connection setup exactly (`db_engine, _ = init_db_from_config(script_config)` then `Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))`, used as `with Session() as session: run(...)`) — **no** `setup_triggers`, **no** `get_or_create_sys_user`, **no** `session.commit()` anywhere (read-only tool).
- `data_tools/test_csv/compare_prod_to_maps_budget_lines_sample.tsv` — fixture file for tests (5 rows, see Testing Strategy).
- `data_tools/tests/compare_prod_to_maps_budget_lines/__init__.py`
- `data_tools/tests/compare_prod_to_maps_budget_lines/test_compare_prod_to_maps_budget_lines.py`

### Files to Modify
- None. This is purely additive and intentionally *not* wired into `load_data.py`'s `--type` dispatcher.

### Implementation Steps

1. **`utils.py` — mapping + dataclass reuse**
   - Import `BudgetLineItemData` from `data_tools.src.load_remove_budget_lines.utils`.
   - Implement `EXPECTED_HEADERS` and `create_compare_budget_line_data`.

2. **`utils.py` — DB query helpers**
   - `get_existing_bli_obe_map`, `get_deleted_bli_ids`, `chunked` (batch size ~1000 to stay well under Postgres' parameter limits for large exports).
   - `get_deleted_bli_ids` must call `sqlalchemy.orm.configure_mappers()` once before its first `version_class(BudgetLineItem)` call (module-level, or guarded so it only runs once per process) — see Related Components for why this is required here specifically (no other code path in the repo triggers it).

3. **`utils.py` — classification + CSV writing**
   - `classify_budget_lines`, `write_rows_csv`, `run`.

4. **`main.py` — CLI**
   - Wire click options to `run(...)`.

5. **Tests**
   - Fixture TSV + `loaded_db`-based test exercising all four outcomes (see below).

### Key Decisions

**Decision 1: Standalone script vs. new `load_data.py` `--type`.**
- Option A: Wire into `load_data.py` — consistent invocation (`python data_tools/src/load_data.py --type ...`), but drags in `sys_user`/history-trigger setup that's meaningless for a read-only report.
- Option B: Standalone script with its own CLI, reusing only `get_config`/`init_db_from_config`.
- **Chosen:** Option B (per user preference) — this tool never writes to the DB, so the write-path scaffolding in `load_data.py` doesn't apply.

**Decision 2: Reuse `BudgetLineItemData` vs. define a local copy.**
- Option A: Import `load_remove_budget_lines.utils.BudgetLineItemData` — no duplication.
- Option B: Local copy — fully decoupled from the deletion loader.
- **Chosen:** Option A (per user preference). Tradeoff: a change to that dataclass (e.g. adding/renaming a field for the deletion loader's own needs) now also affects this script; acceptable since the 19 fields are a stable, already-fixed export format.

**Decision 3: Output CSV headers.**
- Option A: Original TSV header text (e.g. `Sys_Budget_ID`, `Change Reason(s)`) + `OBE`.
- Option B: Dataclass field names (`SYS_BUDGET_ID`, `CHANGE_REASONS`).
- **Chosen:** Option A (per user preference) — output stays comparable to the source file for non-engineer review.

**Decision 4: Blank `Sys_Budget_ID` rows.**
- Option A: Route to the missing-lines file (can't ever match a live BLI, so treat like "not found").
- Option B: Hard-fail the whole run, matching `load_remove_budget_lines`/`load_obe_budget_lines`'s strict `ValueError` convention.
- **Chosen:** Option A (per user preference). Implementation note: since the reused dataclass's `__post_init__` *raises* on a blank ID, `classify_budget_lines` must catch that `ValueError` per-row (not let it propagate) and route the raw row dict straight to the missing bucket with a logged warning, bypassing the DB-lookup step entirely for that row.

**Decision 4a (added after teammate review): a non-numeric `Sys_Budget_ID` (e.g. `"ABC"`) hits the same catch as a blank one, but must not be logged as "blank."**
- `BudgetLineItemData.__post_init__` (`data_tools/src/load_remove_budget_lines/utils.py:39-42`) raises a bare `ValueError` from two different lines: `if not self.SYS_BUDGET_ID: raise ValueError("SYS_BUDGET_ID is required.")` for a blank/falsy value, and `int(self.SYS_BUDGET_ID)` for a truthy-but-non-numeric value that passed that first check. Both are plain `ValueError`, distinguishable only by message text — there's no dedicated exception type per cause.
- Behaviorally, Option A from Decision 4 still applies to both: neither a blank nor a non-numeric id can ever match a live `BudgetLineItem.id`, so both correctly land in the missing-lines file with no DB lookup.
- What has to change: the *log label* must not call every one of these rows "blank-id," since that would misdescribe a genuinely malformed id like `"ABC"` as merely empty. `classify_budget_lines` checks the row's raw `Sys_Budget_ID` value for truthiness itself (not by inspecting the caught exception's message) to log it as blank vs. non-numeric distinctly, and the summary counters (`missing-blank-id` vs. `missing-non-numeric-id`) are tracked separately.

**Decision 5: Only query `budget_line_item_version` (base table), not the 5 subtype `_version` tables.**
- Confirmed empirically: joined-table inheritance means a subclass insert/delete always also inserts/deletes the shared parent-table row in the same flush, so the base version table alone reveals deletion regardless of BLI subtype (Contract/Grant/IAA/DirectObligation/AA).

**Decision 6 (added after teammate review): `get_deleted_bli_ids` must filter on `operation_type == Operation.DELETE`, not just `end_transaction_id IS NULL`.**
- The first draft of this plan filtered only on `end_transaction_id IS NULL`, reasoning that the terminal version row identifies the current state. That's true, but "terminal" doesn't mean "deleted" — every live row's current version is also terminal (`end_transaction_id IS NULL`) with `operation_type` 0 (INSERT) or 1 (UPDATE). Verified empirically by seeding a live BLI, checking its version row, updating it, and checking again: both the pre- and post-update terminal rows had `end_transaction_id=NULL`, only the *superseded* row got `end_transaction_id` set.
- **Fix (chosen):** add `version_cls.operation_type == Operation.DELETE` to the `WHERE` clause alongside `.id.in_(chunk)` and `.end_transaction_id.is_(None)`. This was the cleanest of the options a teammate raised — the returned id set is deleted-only by construction, no post-hoc filtering or anomaly logging needed.
- **Blast radius of the bug had it shipped:** every live `BudgetLineItem` id would have been misclassified as deleted and silently dropped from *both* output files — the existing-lines file would have come back empty, directly violating AC #1. Caught before implementation only because of teammate review.

**Decision 7 (added after teammate review): `is_obe` is nullable — `None` renders as an empty string, not `"False"` or `"None"`.**
- `is_obe: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)` is nullable at the DB level; its `default=False` only applies to new ORM inserts and was never backfilled onto pre-existing rows (migration `2025_07_17_1951-808b957abe3f` added the column `nullable=True` with no `server_default`). So a live BLI can legitimately have `is_obe = None`, meaning "never evaluated," which is a different fact than "evaluated and confirmed not OBE" (`False`).
- Option A (chosen): render `None` as `""` (empty string) in the `OBE` column — visibly distinct from both `"True"`/`"False"` and from a source field that was blank in the original TSV, so reviewers aren't misled into treating "never evaluated" as "confirmed not OBE."
- Option B (rejected): coerce `None` to `"False"` — simpler and keeps the column strictly `True`/`False`, but silently erases the "never evaluated" signal.
- Option C (rejected): write a literal marker like `"Unknown"` — unambiguous but adds a third value the AC didn't ask for and downstream consumers would need to special-case.
- Implementation consequence: `get_existing_bli_obe_map`'s return type is `dict[int, Optional[bool]]`, not `dict[int, bool]`, and the `OBE` serialization step (in `classify_budget_lines`) must explicitly map `True → "True"`, `False → "False"`, `None → ""`.

## Testing Strategy

### Test Data Needed
`data_tools/test_csv/compare_prod_to_maps_budget_lines_sample.tsv` with 7 rows:
1. `Sys_Budget_ID=15000` — exists live in the test DB, `is_obe=False`, never updated after creation (terminal version row is `operation_type=INSERT`).
2. `Sys_Budget_ID=15001` — exists live, `is_obe=True`, updated once after creation in the test setup (terminal version row is `operation_type=UPDATE`) — this is the case that the `end_transaction_id`-only bug (see Decision 6) would have misclassified as deleted, so it must be asserted into the existing-lines file, not just present in the seed data.
3. `Sys_Budget_ID=15002` — exists live, `is_obe=None` (constructed without passing `is_obe`, simulating a pre-migration row that was never backfilled) — must land in existing-lines with `OBE=""`, not `"False"` or `"None"` (see Decision 7).
4. `Sys_Budget_ID=88888` — created then deleted inside the test setup so it's a genuine continuum-tracked deletion: `session.add(bli); session.commit()` (records the continuum INSERT), then `session.delete(bli); session.commit()` (records the continuum DELETE). **Not** via `load_remove_budget_lines.utils.create_models` — that helper is the production delete-path (`session.get` + requires an `agreement` + fires `agreement_history_trigger_func`/`OpsEvent`), which is unrelated scaffolding this test doesn't need just to produce a version-table DELETE row. Plain `session.add`/`session.delete` + commits produces the identical continuum-tracked result with far less setup.
5. `Sys_Budget_ID=99999` — never created; must land in missing-lines.
6. `Sys_Budget_ID` blank — must land in missing-lines, and must not raise/crash the run.
7. `Sys_Budget_ID="ABC"` (non-numeric) — must land in missing-lines, must not raise/crash the run, and must not be logged/counted as a "blank-id" row (see Decision 4a).

### Unit Tests (`utils.py`, no DB)
- [ ] `create_compare_budget_line_data` maps every original header correctly to the dataclass field.
- [ ] `create_compare_budget_line_data` raises `ValueError` on a blank `Sys_Budget_ID`.
- [ ] `create_compare_budget_line_data` also raises `ValueError` on a non-numeric `Sys_Budget_ID` (e.g. `"ABC"`) — a distinct code path inside the dataclass (`int(self.SYS_BUDGET_ID)` failing) from the blank case, per Decision 4a.
- [ ] `classify_budget_lines` routes a blank-ID row and a non-numeric-ID row to the missing bucket via two different log labels/summary counters, not one shared "blank-id" bucket.
- [ ] `chunked` splits an iterable into correctly-sized batches, including a final partial batch.
- [ ] `write_rows_csv` writes the given headers in order and one row per dict.

### Integration Tests (`loaded_db`/`db_with_data`-style fixture, real Postgres via pytest-docker)
- [ ] Seed BLI 15000 (`is_obe=False`), left untouched after creation. Seed BLI 15001 (`is_obe=True`), then update one of its fields (e.g. `comments`) so its terminal version row is an `UPDATE`, not an `INSERT`. Seed BLI 15002 with `is_obe` left as `None` (don't pass it to the constructor). Create BLI 88888 via `session.add`/`commit`, then remove it via `session.delete`/`commit` (not `load_remove_budget_lines.utils.create_models` — see Test Data Needed above for why).
- [ ] Run `classify_budget_lines` (or `run(...)` end-to-end against the sample TSV) and assert:
  - Existing-lines output contains exactly rows for 15000, 15001, **and** 15002, with `OBE` = `"False"` / `"True"` / `""` respectively — 15001 must not be dropped, since its terminal version row also has `end_transaction_id IS NULL` (this is the exact scenario Decision 6's fix targets; asserting only on 15000 wouldn't catch a regression here) — and 15002's `OBE` must be exactly `""`, not `"None"` or `"False"` (Decision 7).
  - Missing-lines output contains exactly the blank-ID row, the `"ABC"` row, and the 99999 row.
  - Row for 88888 appears in neither output.
  - Output headers exactly match `EXPECTED_HEADERS` (+ `OBE` on the existing file).
- [ ] A second never-created id combined with a large-enough id set (e.g. 1500 fabricated ids) exercises the `chunked` batching path without error (can mock/stub the session query rather than seeding 1500 real rows).

### Manual Testing
- [ ] Run against a small real anonymized slice of the actual MAPS export (`--env dev`) and spot-check a handful of known-deleted OPS budget line ids land in neither output.

## Validation

### Code Quality
- [ ] `pipenv run black --config ../ops_api/pyproject.toml .` (or the data_tools equivalent) / `pipenv run nox -s black`
- [ ] `pipenv run nox -s lint`
- [ ] `pipenv run pytest` (new test module) passes
- [ ] Pre-commit hooks pass

### Functional Validation
- [ ] Script runs end-to-end against the sample fixture TSV with `--env pytest_data_tools` (or equivalent) and produces both CSVs with expected content.
- [ ] No rows are ever written/committed to the DB by this script (read-only session; confirm no `session.commit()` calls exist in the new module).

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `get_deleted_bli_ids` omits the `operation_type == Operation.DELETE` filter (regression risk during implementation/refactor) | Every live BLI id gets misclassified as deleted and dropped from both outputs — existing-lines file comes back empty | N/A (caught in review, not yet implemented) | Integration test explicitly asserts the never-deleted, never-updated id (15000) *and* an updated-but-not-deleted id both still land in the existing-lines file, not just that the deleted id (88888) is excluded |
| `is_obe` is `None` for a live BLI (pre-migration row, never backfilled) and the `OBE` serialization step isn't handled explicitly | `csv.DictWriter` writes the Python string `"None"` (or crashes, depending on how the value reaches the writer), breaking the `True`/`False`/`""` output contract | Medium (real prod rows predate the `is_obe` migration) | `get_existing_bli_obe_map` is typed/returns `Optional[bool]`; `classify_budget_lines` explicitly maps `True→"True"`, `False→"False"`, `None→""` before writing; integration test seeds a `None`-`is_obe` row (15002) and asserts its `OBE` cell is exactly `""` |
| A BLI was deleted via raw SQL outside the ORM (bypassing continuum) | That id is misclassified as "never existed" instead of "deleted," landing in the wrong output file | Low | Documented as a known limitation; revisit if a data audit surfaces mismatches |
| MAPS export's real header row doesn't exactly match the 19 expected names (casing, extra whitespace, reordering) | Silent column mis-mapping | Medium | `run()` validates the input header against `EXPECTED_HEADERS` and fails fast with a clear error instead of proceeding |
| Very large export → huge `IN (...)` clause | Query failure or slowness | Medium | Chunk id lookups (~1000 per batch) in both `get_existing_bli_obe_map` and `get_deleted_bli_ids` |
| Multiple MAPS rows share one `Sys_Budget_ID` (change-history rows) | None expected — each row classified independently but consistently since keyed on the same id | N/A | No dedup; call out explicitly in code comments/tests so it isn't "fixed" by a future reader |

## Notes

### Open Questions
- [ ] None outstanding — all four blocking design questions were resolved with the user before writing this plan (see Key Decisions).

### Future Improvements
- Could be wired into `load_data.py` later if it ever needs to gain write behavior (e.g. auto-flagging OBE, or writing the "missing" ids somewhere) — out of scope for this story.

### References
- `data_tools/src/load_remove_budget_lines/utils.py` (reused dataclass + delete-flow reference).
- `data_tools/src/load_master_spreadsheet_budget_lines_v2/utils.py` (reference for the header→dataclass mapping pattern).
- `models/base.py`, `models/budget_line_items.py` (continuum/versioning setup).
