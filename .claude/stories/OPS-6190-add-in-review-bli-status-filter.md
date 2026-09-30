---
issue: OPS-6190
branch: OPS-6190/add-in-review-bli-filter
---

# OPS-6190 — Add "In Review" as a 5th status option on the Budget Line List filter

## Context

The Budget Line List Table's status filter (the "Budget Lines Status" combobox inside the Filter
modal) currently offers 4 statuses: **Draft**, **Planned**, **Executing**, **Obligated** (a 5th,
**Overcome by Events**, already exists as a conditional pseudo-status — see below). The table itself
already renders an **"In Review"** tag on individual rows (`TableTag.jsx`), driven by the
`in_review` boolean the backend attaches to each serialized budget line. There is currently no way to
*filter* the list down to only those in-review rows.

This is harder than a normal status filter because **`in_review` is not a value of the `status`
column at all** — it's a computed flag on `BudgetLineItem.in_review`
(`backend/models/budget_line_items.py:354-356`), derived from whether there's a pending
(`ChangeRequestStatus.IN_REVIEW`) `BudgetLineItemChangeRequest` on the BLI itself, **or** a pending
`AgreementChangeRequest` on its parent Agreement (`change_requests_in_review`,
`backend/models/budget_line_items.py:324-352`). A BLI can be `DRAFT` and in-review at the same time.

**Existing precedent — "Overcome by Events" (OBE):** OBE is in the exact same situation — it isn't a
real `BudgetLineItemStatus` enum member either, it's a separate `BudgetLineItem.is_obe` boolean
column. It's handled today as a literal pseudo-string `"Overcome by Events"` that round-trips through
the same `budget_line_status` / `status` query params as real statuses, and is special-cased in
`BudgetLineItemService._obe_status_filter()`
(`backend/ops_api/ops/services/budget_line_items.py:361-375`) to OR an `is_obe` column check into the
`WHERE` clause instead of an `status.in_(...)` membership check. **"In Review" will follow this same
pattern**, except the OR'd condition is an `EXISTS` subquery against change-request tables instead of
a plain boolean column, because there is no `is_in_review` column to check.

**Caveat on the OBE comparison:** OBE's own visibility gate (`enable_obe`) is not actually observable
by a user of this page today — `frontend/src/pages/budgetLines/list/BudgetLineItemList.jsx` hardcodes
`enableObe: false` with no UI control to turn it on, so `"Overcome by Events"` never appears as a
selectable filter option here regardless of data. Per the (reversed) Decision 4 below, `"In Review"`
is now conditionally shown too — derived from `results` exactly the way every other status option is
— so there's no longer an "always vs. conditional" contrast with OBE to reconcile either way; both are
data-driven, OBE is additionally feature-flag-gated (invisibly, on this page), and `"In Review"` isn't.

### Decisions made during planning (see "Key Decisions" below for full rationale)

| Decision | Choice |
|---|---|
| SQL filtering strategy | `EXISTS` subquery in `filter_query`, parallel to `_obe_status_filter` |
| Scope of "in review" | Match `BudgetLineItem.in_review` exactly — BLI-level **or** agreement-level pending change requests |
| Wire value for the pseudo-status | `"IN_REVIEW"` (enum-style code, not a display string like OBE's) |
| Filter-options endpoint visibility | Conditionally include `"IN_REVIEW"` — only when at least one BLI in `results` is in review, derived the same way every other status option (and OBE's `has_obe`) already is |
| Query params to update | Both `budget_line_status` (used by the Filter button UI) and the generic `status` param, for parity |
| Dropdown display order | Draft, Planned, Planned Mod, Executing, Obligated, **In Review**, Overcome by Events |

**Important architectural note discovered during planning:** `BudgetLineItemService.get_list()`
(`backend/ops_api/ops/services/budget_line_items.py:218-296`) does **not** use SQL `LIMIT`/`OFFSET` —
it fetches *all* matching rows from Postgres (`self.db_session.scalars(query).all()`), then applies
Python-level filters (`_apply_python_filters`, for budget-range/CAN-active-period), computes
`count = len(results)`, and only then **slices in Python** for pagination
(`results[offset_value : offset_value + limit_value]`, line 292). So there's no pagination-correctness
argument either way between a SQL `EXISTS` filter and a pure Python post-filter — both run before the
Python-side slice. The SQL `EXISTS` approach was still chosen because (a) it mirrors the existing
`_obe_status_filter` pattern exactly, keeping all pseudo-status handling in one place, and (b) it
avoids pulling every non-matching row's full object graph (`selectinload`d agreement, CAN, portfolio,
etc.) into Python only to discard it.

## 1. `backend/ops_api/ops/services/budget_line_items.py` — SQL filtering

### 1a. Add an `EXISTS`-subquery helper for "in review" (new method)

Add near `_obe_status_filter` (around line 361). This mirrors
`BudgetLineItem.change_requests_in_review` (`backend/models/budget_line_items.py:324-352`) but as a
SQL expression instead of a Python property, since `in_review` is a plain `@property`
(not a `hybrid_property`) and therefore cannot be used inside `.where(...)` as-is:

```python
def _in_review_exists_clause(self):
    """SQL EXISTS clause mirroring BudgetLineItem.in_review (a non-SQL-filterable
    plain @property). True when the BLI has a pending BudgetLineItemChangeRequest,
    or its parent Agreement has a pending AgreementChangeRequest."""
    bli_cr_exists = (
        select(BudgetLineItemChangeRequest.id)
        .where(
            BudgetLineItemChangeRequest.status == ChangeRequestStatus.IN_REVIEW,
            BudgetLineItemChangeRequest.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            BudgetLineItemChangeRequest.budget_line_item_id == BudgetLineItem.id,
        )
        .exists()
    )
    agreement_cr_exists = (
        select(AgreementChangeRequest.id)
        .where(
            AgreementChangeRequest.status == ChangeRequestStatus.IN_REVIEW,
            AgreementChangeRequest.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
            AgreementChangeRequest.agreement_id == BudgetLineItem.agreement_id,
        )
        .exists()
    )
    return bli_cr_exists | agreement_cr_exists
```

`BudgetLineItemChangeRequest`, `AgreementChangeRequest`, `ChangeRequestStatus`, and `ChangeRequestType`
are already imported at the top of this file (lines 18, 22, 25, 26) — no new imports needed here.

### 1b. Generalize `_obe_status_filter` into a shared pseudo-status helper

Today `_obe_status_filter` (lines 361-375) only knows about one pseudo-value. Rename/replace it with a
version that strips out *both* pseudo-values and OR's in whichever ones were requested, alongside any
real `BudgetLineItemStatus` values:

```python
def _apply_pseudo_status_filter(self, query, status_list: list[str], enable_obe):
    """Applies a status filter that may include real BudgetLineItemStatus values
    plus either or both pseudo-statuses: "Overcome by Events" (is_obe column) and
    "IN_REVIEW" (EXISTS subquery against change requests)."""
    obe_requested = "Overcome by Events" in status_list
    in_review_requested = "IN_REVIEW" in status_list
    real_statuses = [s for s in status_list if s not in ("Overcome by Events", "IN_REVIEW")]
    obe_enabled = bool(enable_obe and True in enable_obe)

    # Validate real statuses against the enum before handing them to .in_(), mirroring the
    # existing _apply_agreement_type_filter pattern for AgreementType (line 453-466). Turns
    # an unrecognized status string into a clean 400 instead of a raw DB-level enum error —
    # and, combined with the always-include-the-condition fix below, means the "no real
    # statuses matched" case is always a deliberate, validated false predicate rather than
    # ever depending on unvalidated input reaching the database.
    enum_statuses = []
    for status in real_statuses:
        try:
            enum_statuses.append(BudgetLineItemStatus[status])
        except KeyError:
            logger.warning(f"Invalid budget line status: {status}")
            raise ValidationError({"status": f"Invalid budget line status: {status}"})

    # Always start with the real-status condition, even when enum_statuses is empty.
    # `.in_([])` compiles to a false predicate, so a request that resolves to no real
    # statuses and no *enabled* pseudo-status (e.g. only "Overcome by Events" was
    # requested but enable_obe is off) correctly filters to zero rows instead of an
    # empty `conditions` list skipping the WHERE clause entirely and returning every BLI.
    conditions = [BudgetLineItem.status.in_(enum_statuses)]
    if obe_requested and obe_enabled:
        conditions.append(BudgetLineItem.is_obe)
    if in_review_requested:
        conditions.append(self._in_review_exists_clause())

    combined = conditions[0]
    for condition in conditions[1:]:
        combined = combined | condition
    query = query.where(combined)

    return query
```

**Regression fix #1 vs. an earlier draft of this plan:** a version that only appended
`BudgetLineItem.status.in_(real_statuses)` when `real_statuses` was non-empty could leave `conditions`
completely empty whenever `"Overcome by Events"` was the *only* requested value and `enable_obe` was
off — skipping `.where()` entirely and returning **every** BLI unfiltered, instead of the "no-op for
existing OBE-only callers" this method is supposed to provide. Always including the (possibly
empty-list) `.in_()` condition closes that gap: it evaluates to a false predicate when there's nothing
else to OR it with, so an all-disabled-pseudo-status request now deterministically matches zero rows.
`"IN_REVIEW"` has **no such gate** — it is not behind any `enable_*` flag, matching the "always show as
an option" decision, so it can never be the thing that empties out `conditions`.

**Regression fix #2, per external review:** without the enum-validation step above, an unrecognized
real-status string (a typo, or any value that isn't a real enum member or one of the two known
pseudo-status literals) would flow straight into `BudgetLineItem.status.in_(real_statuses)` unvalidated
— against a native Postgres `ENUM` column, this raises a DB-level error today (an unhandled 500), and
would continue to do so after this refactor if left unvalidated. Converting `real_statuses` to
`BudgetLineItemStatus` enum members up front, exactly the way `_apply_agreement_type_filter` already
does for `AgreementType`, turns that entire class of bad input into a clean, expected `ValidationError`
(400) instead. This is what makes Regression fix #1 *fully* safe rather than merely less wrong: fix #1
guarantees the empty-conditions case is a deliberate false predicate, and fix #2 guarantees that
predicate is only ever built from validated enum members, never from arbitrary unvalidated strings.

### 1c. Update the two call sites

`_apply_status_filters` (line 405) and `_apply_status_filter` (line 438) both currently branch on
`enable_obe` to decide whether to call `_obe_status_filter` or fall back to a plain `.in_()`. Both
should now unconditionally delegate to `_apply_pseudo_status_filter`, since that method already
internally handles the "no pseudo-status requested" case (falls through to a plain `.in_()`-equivalent
via the `conditions` list) — this is a intentional behavior change but should be a no-op for existing
OBE-only callers:

```python
def _apply_status_filters(self, query, budget_line_statuses, enable_obe):
    """Apply budget line status filter, including pseudo-statuses."""
    if budget_line_statuses:
        query = self._apply_pseudo_status_filter(query, budget_line_statuses, enable_obe)
    return query

...

def _apply_status_filter(self, query, statuses, enable_obe):
    """Apply general status filter, including pseudo-statuses."""
    if statuses:
        query = self._apply_pseudo_status_filter(query, statuses, enable_obe)
    return query
```

Delete `_obe_status_filter` (superseded by `_apply_pseudo_status_filter`) — confirm no other call
sites reference it first (`grep -rn "_obe_status_filter" backend/`).

### 1d. Fix `_apply_obe_exclusion_filter` to stop silently dropping in-review OBE rows

**Confirmed, concrete bug — not a deferred maybe-test.** `_apply_obe_exclusion_filter`
(line 447-451) is called unconditionally from `filter_query` (line 395), *after* the status
OR-clause, independent of which statuses were requested. `BudgetLineItemChangeRequest` is
single-table inheritance under `AgreementChangeRequest` (`backend/models/change_requests.py`), and
`check_agreement_id` forces every change request — BLI-level or agreement-level — to carry a
populated `agreement_id`. So `BudgetLineItem.in_review` (`backend/models/budget_line_items.py:354-356`,
via `change_requests_in_review:324-352`) becomes `True` for **every** BLI on an agreement whenever
there's a pending agreement-level `AgreementChangeRequest` — regardless of that specific BLI's
`is_obe` flag or status. And `frontend/src/components/UI/TableTag/TableTag.jsx:19-44` checks
`inReview` before `isObe`, so wherever a BLI's row is rendered, a BLI that is both `is_obe=True` and
in-review already shows the "In Review" tag today, not "OBE."

Put together: an agreement with an OBE'd BLI gets an unrelated agreement-level change request
submitted → that BLI becomes `in_review=True` → wherever its row is rendered, it shows "In Review" →
but selecting the `IN_REVIEW` filter on this page would silently drop that exact row, because
`_apply_obe_exclusion_filter` unconditionally ANDs `is_obe = False` onto the query whenever
`enable_obe` is falsy (the default, and the only state reachable from this page's UI today) —
regardless of the status OR-clause that already matched the row via the `EXISTS` subquery. This
directly contradicts Decision 2's explicit promise: match `BudgetLineItem.in_review` exactly, "so the
filter's definition of in review never diverges from what the row-level tag already means." This is
reachable via a completely ordinary workflow (an agreement-level change request touching an agreement
that has an OBE'd line) — no exotic data required, and it holds regardless of where else in the app
`TableTag.jsx` renders that row.

**Fix:** make the OBE exclusion aware of whether `"IN_REVIEW"` was among the requested statuses, and
if so, spare only the rows that are actually in-review — not every OBE row, just because `IN_REVIEW`
happened to be one of the requested statuses:

```python
def _apply_obe_exclusion_filter(self, query, enable_obe, in_review_requested=False):
    """Exclude OBE items unless explicitly enabled, or unless the item is also
    in-review and the caller requested the IN_REVIEW pseudo-status (Decision 2):
    an OBE'd BLI that's genuinely in-review must still match the IN_REVIEW filter,
    matching BudgetLineItem.in_review exactly regardless of is_obe."""
    if not enable_obe or True not in enable_obe:
        exclusion = func.coalesce(BudgetLineItem.is_obe, False).is_(False)
        if in_review_requested:
            exclusion = exclusion | self._in_review_exists_clause()
        query = query.where(exclusion)
    return query
```

Update the call site in `filter_query` (line 395) to compute and pass `in_review_requested`:

```python
in_review_requested = "IN_REVIEW" in (filters.budget_line_statuses or []) or "IN_REVIEW" in (
    filters.statuses or []
)
query = self._apply_obe_exclusion_filter(query, filters.enable_obe, in_review_requested)
```

This only spares a row when it's *actually* in-review (via the same `EXISTS` clause used everywhere
else in this plan) — an OBE'd BLI that's `DRAFT` but *not* in-review is still excluded exactly as
before, whether or not the request happens to also include `"IN_REVIEW"` alongside `"DRAFT"`. The
new parameter defaults to `False`, so any other caller of `_apply_obe_exclusion_filter` (confirm via
`grep -rn "_apply_obe_exclusion_filter" backend/` before changing the signature — `filter_query` is
believed to be the only call site) is unaffected.

## 2. `backend/ops_api/ops/services/budget_line_items.py` — filter-options endpoint

`get_filter_options()` (lines 1104-1209) builds the `statuses` list purely from
`{result.status for result in results if result.status}` (line 1134), then conditionally appends
`"Overcome by Events"` only when `has_obe` and `enable_obe=True` (lines 1170-1171). Per the (reversed)
Decision 4, `"IN_REVIEW"` needs the same "derived from `results`" treatment as every other entry in
this list, including OBE's `has_obe` gate — it should only appear when at least one BLI in the current
result set is actually in review.

**Don't compute this with `any(result.in_review for result in results)`.** Unlike `is_obe` (a plain
mapped column, so `any(result.is_obe for result in results)` at line 1135 is free — pure Python
iteration over already-loaded scalar data), `in_review` is a computed `@property`
(`backend/models/budget_line_items.py:354-356`) that issues 1-2 fresh `SELECT` queries *per instance*
it's accessed on (via `change_requests_in_review`, lines 324-352). Calling it in a loop over `results`
here would be a textbook N+1.

Instead, reuse `batch_load_change_requests_in_review(db_session, bli_ids, agreement_ids)` — already
defined in this same file (line 1383-1425) and already used for exactly this reason by the BLI list
resource (`backend/ops_api/ops/resources/budget_line_items.py:160`) to avoid the same N+1 when
serializing `in_review` for a list of BLIs. It runs at most 2 extra queries total (one `IN` query per
change-request table), regardless of how many BLIs are in `results`:

```python
bli_ids = [result.id for result in results]
agreement_ids = [result.agreement_id for result in results]
change_requests_data = batch_load_change_requests_in_review(self.db_session, bli_ids, agreement_ids)
has_in_review = bool(change_requests_data["bli_change_requests"]) or bool(
    change_requests_data["agreement_change_requests"]
)

budget_line_statuses_list = [status.name for status in budget_line_statuses]
if has_in_review:
    budget_line_statuses_list.append("IN_REVIEW")
if has_obe and (enable_obe and True in enable_obe):
    budget_line_statuses_list.append("Overcome by Events")

status_sort_order = [
    BudgetLineItemStatus.DRAFT.name,
    BudgetLineItemStatus.PLANNED.name,
    BudgetLineItemStatus.PLANNED_MOD.name,
    BudgetLineItemStatus.IN_EXECUTION.name,
    BudgetLineItemStatus.OBLIGATED.name,
    "IN_REVIEW",
    "Overcome by Events",
]
```

No new import is needed — `batch_load_change_requests_in_review` is a module-level function already
defined further down in this same file.

**Resolved (previously an open question):** since `results` here is already the post-`only_my`-filtered
list (line 1126-1129 filters `all_results` down to `results` before any of this runs), deriving
`has_in_review` from `results` means `"IN_REVIEW"` correctly disappears when `only_my` (or any other
active filter) reduces the in-review BLIs to zero — exactly the same "derived from `results`" contract
every other entry in this list already has, including OBE's `has_obe`. There's no special-cased
"always present" behavior left to reconcile.

## 3. `backend/ops_api/ops/schemas/budget_line_items.py` — no changes needed

`QueryParametersSchema.budget_line_status` and `.status` (lines 187, 191) are both
`fields.List(fields.String())` — untyped strings, so they already accept the literal `"IN_REVIEW"`
value with no schema change. Confirmed by grepping for any enum-based validation on these fields (there
is none — validation of the *values* happens downstream in `_apply_pseudo_status_filter`, not in
Marshmallow).

`BudgetLineItemListFilterOptionResponseSchema.statuses` (line 393) is also `fields.List(fields.String())`
— no change needed there either.

## 4. `backend/models/budget_line_items.py` — no changes needed

`BudgetLineItemStatus` enum (lines 45-53) is intentionally **not** getting an `IN_REVIEW` member. It's
a real Postgres `ENUM` type backing the `status` column (line 114-116) — adding a member would need a
migration and would incorrectly imply a BLI's `status` column could literally hold the value
`"IN_REVIEW"`, which it never does. `"IN_REVIEW"` stays a plain string constant recognized only inside
the filter-building code, exactly like `"Overcome by Events"` today.

## 5. Frontend — `frontend/src/helpers/budgetLines.helpers.js` — no changes needed

`BLI_STATUS` (lines 16-22) mirrors the real `BudgetLineItemStatus` enum, so following the "no enum
change" decision, `IN_REVIEW` should NOT go into `BLI_STATUS` (that constant is used for real status
comparisons elsewhere, e.g. status badge coloring switches — adding a non-real status there risks it
leaking into code that assumes `BLI_STATUS` values are actual `status` column values).

No new constant is being added either: `"Overcome by Events"` has no dedicated constant on the
frontend today — it's passed around as a bare string literal wherever it's used (e.g.
`BLIStatusComboBox` option lists sourced straight from the API). Adding a one-off
`BLI_IN_REVIEW_FILTER_VALUE` constant for only the new value, while leaving OBE's literal alone, would
be an unused/inconsistent abstraction — steps 6 and 7 below use the raw `"IN_REVIEW"` string directly,
matching the existing convention. Confirmed by grep: `"Overcome by Events"` appears nowhere in
`frontend/src` except as release-note copy (`frontend/src/pages/home/release-notes/data.js:394`) — it
is a pure pass-through string with no constant anywhere for `IN_REVIEW` to sit next to, and
`convertCodeForDisplay` simply falls through to `return code` for it (no `codesToDisplayText` entry).
There is no consumer anywhere in this plan that would ever read `BLI_IN_REVIEW_FILTER_VALUE` even if it
existed — steps 6-10 are all "no changes needed" or reference the raw string directly.

## 6. Frontend — `frontend/src/helpers/utils.js`

Add a display-label entry to `codesToDisplayText.budgetLineStatus` (lines 127-133), used by
`convertCodeForDisplay("budgetLineStatus", ...)`. Without this, `"IN_REVIEW"` would render literally
in the dropdown (the function falls through to `return code` for unmapped codes):

```javascript
budgetLineStatus: {
    DRAFT: "Draft",
    PLANNED: "Planned",
    IN_EXECUTION: "Executing",
    OBLIGATED: "Obligated",
    PLANNED_MOD: "Planned Mod",
    IN_REVIEW: "In Review"
},
```

## 7. Frontend — `frontend/src/components/BudgetLineItems/BLIStatusComboBox/BLIStatusComboBox.jsx`

The component itself needs **no logic change** — it already maps whatever `statusOptions` array it's
given through `convertCodeForDisplay("budgetLineStatus", status)` (line 26), so once step 6 lands,
`"IN_REVIEW"` renders as `"In Review"` automatically.

Only the hardcoded fallback default (line 21) is stale:

```javascript
// Before
statusOptions = ["DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED"]

// After
statusOptions = ["DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED", "IN_REVIEW"]
```

This fallback is only used when no `statusOptions` prop is passed — in practice `BLIFilterButton.jsx`
always passes `filterOptions?.statuses ?? []` (sourced from the API), so this default is mostly a
safety net / Storybook/test default. Still worth updating for consistency once the backend always
returns `IN_REVIEW` (step 2).

## 8. Frontend — `frontend/src/pages/budgetLines/list/BLIFilterButton.jsx`

**No changes needed.** The `BLIStatusComboBox` fieldset (lines 153-165) already sources its option
list entirely from `filterOptions?.statuses` and passes through whatever the user selects via
`bliStatus`/`setSelectedBLIStatus` — it has no hardcoded knowledge of the 4 (soon 5) status values.
Once the backend returns `IN_REVIEW` in `filterOptions.statuses` (step 2) and the display-label map
knows how to render it (step 6), this component picks it up automatically.

## 9. Frontend — `frontend/src/api/opsAPI.js`

**No changes needed.** `getBudgetLineItems` (lines 355-433) already forwards every selected status
object's raw `.status` value as a `budget_line_status=` query param (line 382):
```javascript
if (bliStatus) {
    bliStatus.forEach((status) => queryParams.push(`budget_line_status=${status.status}`));
}
```
Selecting "In Review" produces `status.status === "IN_REVIEW"`, so this already sends
`budget_line_status=IN_REVIEW` with zero code changes here.

## 10. Frontend — `frontend/src/pages/budgetLines/list/BLIFilterTags.jsx`

**Likely no changes needed**, but needs verification during implementation: the tag-removal logic
(lines 32-39) and tag-derivation logic (lines 87-93) both key off `status.title`
(the already-converted display string), not the raw code. Since step 6 makes `convertCodeForDisplay`
return `"In Review"` for the `IN_REVIEW` code, the tag should render/remove correctly with no change —
this needs a test (see Testing Strategy) to confirm rather than an assumption.

## 11. `backend/ops_api/ops/services/agreements.py` — explicitly out of scope

`_apply_budget_line_filters()` (line 1253-1266) has its own, entirely separate implementation of the
`budget_line_status` param, used by the Agreements list endpoint: a bare
`query.where(BudgetLineItem.status.in_(budget_line_statuses))` (line 1262) with **no** pseudo-status
handling at all — not even today's OBE handling, let alone this ticket's `IN_REVIEW`. `opsAPI.js`'s
`getAgreements` (line 119-120 in the shared query-building code it uses) already forwards a
`budgetLineStatus` filter into `budget_line_status=` query params exactly like `getBudgetLineItems`
does — confirmed by an existing frontend unit test at `frontend/src/api/opsAPI.test.js:630-633` that
exercises `getAgreements` with `budgetLineStatus: [{ status: "IN_REVIEW" }]` and asserts
`budget_line_status=IN_REVIEW` on the resulting URL. So `GET /agreements/?budget_line_status=IN_REVIEW`
(or `=Overcome by Events`) would hit this same unvalidated `.in_()` against the native Postgres
`status` ENUM and 500 by the identical mechanism this plan's Regression fix #2 (step 1b) closes for the
budget-line-items endpoint.

**No UI currently sends a BLI status filter through this path.** Grepped `BLIStatusComboBox` usage
across `frontend/src`: it's rendered only by `BLIFilterButton.jsx` on the Budget Line List page, never
on the Agreements list page, so `getAgreements` is never actually called with a `budgetLineStatus`
filter by any real user flow today — only the `opsAPI.test.js` unit test above exercises this code
path, via a directly-constructed RTK Query call. This makes it a **latent** gap, not an active bug.

**This ticket does not fix it.** `_apply_budget_line_filters` in `agreements.py` is a separate service
module from `BudgetLineItemService` in `budget_line_items.py`, has no OBE precedent to generalize from
there, and no UI path currently reaches it — fixing it is out of scope for OPS-6190. Flagging it
explicitly so the next person who wires a BLI-status filter into the Agreements list doesn't silently
inherit a 500: that future work should mirror this ticket's `_apply_pseudo_status_filter` +
enum-validation pattern (step 1b) rather than extending the bare `.in_()` call at line 1262.

## Testing Strategy

### Backend (`backend/ops_api/tests/ops/budget_line_items/test_budget_line_item.py`)

Existing tests establish the pattern to follow:
- `test_budget_line_items_get_all_by_budget_line_status` (line 1144) — filters via `budget_line_status`
  for real statuses.
- `test_budget_line_items_get_all_obe_budget_lines` (line 1656) / `test_get_obe_budget_lines`
  (line 1670) — the OBE pseudo-status precedent, using `budget_line_status=Overcome by Events` /
  `status=Overcome by Events` with `enable_obe=True`.
- `test_get_budget_line_items_filter_options` (line 1511) — asserts
  `expected_statuses = {"DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED", "Overcome by Events"}` is a
  subset of the response.

New/changed tests needed:
- [ ] **New**: `test_budget_line_items_get_all_by_in_review_status` — create at least one BLI with a
  pending `BudgetLineItemChangeRequest` (status=`IN_REVIEW`) and at least one BLI with a pending
  `AgreementChangeRequest` on its parent agreement, plus at least one BLI with neither. Filter via
  `budget_line_status=IN_REVIEW`, and assert on the **specific returned BLI IDs** (not just a
  count/length check) — the existing precedent tests only assert `len(blis) == total_count`, which
  wouldn't catch the `EXISTS` clause matching the wrong rows. This covers the "match existing
  in_review property exactly" decision — both BLI-level and agreement-level pending change requests
  must be picked up.
- [ ] **New**: same as above but via the generic `status=IN_REVIEW` param, per the "both params"
  decision (parity with the existing `test_get_budget_line_items_list_by_status` /
  `test_get_obe_budget_lines` pairing). Also assert on specific BLI IDs.
- [ ] **New**: an agreement with **multiple** BLIs and a single pending `AgreementChangeRequest` on
  that agreement — assert **all** of that agreement's BLIs are returned as in-review, not just one.
  This is a more realistic and more targeted test of the `_in_review_exists_clause()` correlation
  (`AgreementChangeRequest.agreement_id == BudgetLineItem.agreement_id`) than a single-BLI-per-scenario
  test would be, since `change_requests_in_review` marks every sibling BLI in-review, not just one.
- [ ] **New**: combining `budget_line_status=DRAFT&budget_line_status=IN_REVIEW` should OR the two
  conditions — assert the result set is the union by BLI ID (a DRAFT-but-not-in-review BLI, plus an
  in-review-but-not-DRAFT BLI, both appear). Note: this test exercises OR-combination only — it does
  **not** exercise the separate OBE-exclusion-filter interaction described in the Risks table below;
  don't treat it as covering that risk too.
- [ ] **New**: `budget_line_status=IN_REVIEW` against a dataset with **zero** in-review BLIs — assert
  an empty result set (distinct from the filter-*options* presence/absence test below; this one is
  about the row-filtering path — a request can still explicitly filter by `IN_REVIEW` even when the
  filter-options endpoint wouldn't currently offer it as an option, and it should behave correctly).
- [ ] **Change**: `test_get_budget_line_items_filter_options` (line 1511) — add a case with at least
  one in-review BLI asserting `"IN_REVIEW"` is present in `expected_statuses`, **and** a case with zero
  in-review BLIs asserting it's **absent** — mirroring the existing conditional-presence pattern for
  `has_obe`/`"Overcome by Events"`, not an unconditional append. This also exercises the
  `has_in_review`/`batch_load_change_requests_in_review` computation from step 2.
- [ ] **New**: `test_budget_line_items_get_all_by_obe_status_when_obe_disabled` (or extend an existing
  OBE test) — filter via `budget_line_status=Overcome by Events` with `enable_obe` absent/`False`,
  and assert the result set is **empty**, not the full unfiltered list. This is a regression guard for
  the `_apply_pseudo_status_filter` refactor: an earlier draft of `_apply_pseudo_status_filter` left
  `conditions` empty in this exact case, which skipped the `WHERE` clause and returned every BLI. The
  fixed version (see step 1b) always includes `BudgetLineItem.status.in_(real_statuses)`, which
  compiles to a false predicate when `real_statuses` is also empty — this test locks that in.
- [ ] **New**: an `is_obe=True` BLI that also has a pending change request (cover both the BLI-level
  and agreement-level case) — filter via `budget_line_status=IN_REVIEW` with `enable_obe` absent/
  `False` — assert the row **is** returned. This locks in step 1d's fix for the confirmed OBE +
  in-review coexistence gap. Also assert the **same** BLI is excluded when filtering by its real
  `status` value alone (e.g. `budget_line_status=DRAFT`, no `IN_REVIEW`) — confirming the fix only
  spares rows that are genuinely in-review, not every OBE row whenever `IN_REVIEW` happens to be one
  of the requested statuses.
- [ ] **New**: `budget_line_status=<garbage-value>` (something that's neither a real
  `BudgetLineItemStatus` member nor one of the two pseudo-status literals) — assert a `400` with a
  `ValidationError` body, matching the existing precedent for invalid `agreement_type` values via
  `_apply_agreement_type_filter`. This locks in Regression fix #2 (enum validation of `real_statuses`
  in step 1b) and guards against a silent DB-level 500 regressing back in.
- [ ] **Skip**: a direct unit test for `BudgetLineItemService._apply_pseudo_status_filter` /
  `_in_review_exists_clause` in isolation. `_obe_status_filter` has no direct unit test today — it's
  only exercised through the resource-level tests above, which is the established convention in this
  codebase (real DB fixtures, real HTTP call through the endpoint, no mocking of the code under test).
  Only add one if implementation turns up a behavior unreachable from the resource-level tests.

### Frontend

- [ ] **New**: a `convertCodeForDisplay` test in `utils.test.js` asserting
  `convertCodeForDisplay("budgetLineStatus", "IN_REVIEW")` returns `"In Review"`. This is genuinely
  **new** coverage, not a change to an existing case — `utils.test.js`'s existing
  `"codes are converted for display correctly"` test has no assertions for the `budgetLineStatus` map
  at all today (not even for `DRAFT`/`PLANNED`), so there's no existing case to extend.
- [ ] **Change**: `BLIStatusComboBox.test.js` — add a 5th `"IN_REVIEW"` fixture alongside the existing
  `DRAFT`/`PLANNED` fixtures, assert it renders as `"In Review"` and is selectable. This is the file
  that can actually observe render-as-label + selectability. `BLIFilterButton.test.jsx` mocks
  `BLIStatusComboBox` entirely (lines 46-52), and the mock's "Set Status" button always emits a
  hardcoded `{ id: 1, title: "PLANNED" }` regardless of the `statusOptions` prop it's given — so that
  file can neither render options sourced from `filterOptions.statuses` nor produce an `IN_REVIEW`
  selection. `BLIStatusComboBox.test.js` is the right (and only) place this is testable.
- [ ] **New**: `opsAPI.test.js` — add a case for `getBudgetLineItems` confirming it forwards a selected
  `{ status: "IN_REVIEW" }` object as `budget_line_status=IN_REVIEW` on the request. There's already
  a directly analogous fixture for `getAgreements` at `frontend/src/api/opsAPI.test.js:630-633`
  (`budgetLineStatus: [{ status: "IN_REVIEW" }]` asserting `budget_line_status=IN_REVIEW` on the URL)
  to model this on.
- [ ] **Change**: `BLIFilterTags.test.jsx` — add a case selecting the "In Review" status tag, asserting
  it renders with label `"In Review"` and removes correctly (verifies step 10's "no change needed"
  assumption rather than just trusting it).

Deliberately **not** adding an `IN_REVIEW` case to `BLIFilterButton.test.jsx` or to
`BudgetLineItemList.test.jsx`:
- `BLIFilterButton.test.jsx`'s `BLIStatusComboBox` mock can't observe an `IN_REVIEW` selection or a
  `filterOptions.statuses` value containing it, as noted above — a case there would either exercise
  nothing new or require rewriting the mock, which is out of scope for a component with no logic
  change (step 8).
- `BudgetLineItemList.test.jsx` mocks out both `BLIFilterButton` and `AllBudgetLinesTable` as
  content-free stubs, so a test there can only assert that a query param was echoed back through the
  mocked hook — it cannot actually verify that selecting "In Review" filters the rendered rows, and
  would pass even if the real filtering were broken. The behavior that matters (does selecting the
  option produce the right query param; does the backend actually filter by it) is now covered by
  `opsAPI.test.js` above and the backend tests in this section.

### Manual/E2E

- [ ] No existing Cypress spec was confirmed to cover the BLI status filter end-to-end (only the
  research pass on unit/integration tests was done — check `frontend/cypress/e2e/` during
  implementation for a `budgetLine`/`agreement` list filter spec to extend, e.g. something analogous
  to `canList.cy.js`'s filter coverage referenced in the CANs filter story).
- [ ] Manual test: open the Budget Line List, open the Filter modal, confirm "In Review" appears as a
  5th checkbox option, select it, Apply, confirm only rows with the "In Review" tag show, confirm the
  filter tag renders "In Review" and is removable.

## Key Decisions

**Decision 1: How to filter in SQL, given `in_review` has no backing column.**
- Option A — SQL `EXISTS` subquery in `filter_query`, parallel to `_obe_status_filter`. Keeps all
  status/pseudo-status logic in one place; avoids materializing non-matching rows' full eager-loaded
  object graphs.
- Option B — Python post-filter reusing `batch_load_change_requests_in_review` (already exists for
  the item-level `in_review` computation in the resource layer). Would require moving that batching
  earlier in `get_list()`, splitting the existing "compute after fetching results" flow, and doing the
  count/slice math around it.
- **Chosen: Option A**, per team direction — mirrors the OBE precedent exactly and is cheaper (filters
  in the DB rather than in Python for a query that, per the architectural note above, already has no
  true SQL-level pagination to protect either way).

**Decision 2: Scope of "in review" match — BLI-level only vs. BLI-level + agreement-level.**
- **Chosen: match `BudgetLineItem.in_review` exactly** (both), per team direction — so the filter's
  definition of "in review" never diverges from what the row-level "In Review" tag already means to a
  user looking at the table. The `_in_review_exists_clause()` in step 1a implements both halves.
- **Consequence, fixed in step 1d:** matching `in_review` exactly means the filter must also survive
  its interaction with the *unrelated*, pre-existing `_apply_obe_exclusion_filter`, which otherwise
  unconditionally strips any `is_obe` row — including ones that are genuinely in-review — whenever
  `enable_obe` is off. Left unfixed, that would silently violate this exact promise for any OBE'd BLI
  that becomes in-review via an agreement-level change request. Step 1d closes that gap.

**Decision 3: Wire value for the pseudo-status.**
- Option A — `"In Review"` (display string), matching OBE's `"Overcome by Events"` convention exactly.
- Option B — `"IN_REVIEW"` (enum-style code), consistent with how real statuses (`DRAFT`, `PLANNED`,
  etc.) are already represented on the wire, relying on `convertCodeForDisplay` for the label.
- **Chosen: Option B**, per team direction. Note this makes "In Review" inconsistent with OBE's own
  convention (OBE uses its display string as the wire value with no `codesToDisplayText` entry) — a
  future OBE cleanup could align it to `IN_REVIEW`-style codes too, but that's out of scope here.

**Decision 4: Should the filter-options endpoint conditionally show "In Review" (like OBE's `has_obe`
gate), or always?**
- **Reversed on reflection — chosen: conditionally show**, only when at least one BLI in the current
  result set is actually in review, derived from `results` exactly the way every other status option
  (and OBE's `has_obe`) already is. An earlier draft of this plan chose "always show," but that would
  make `"In Review"` the *one* option in this dropdown that can appear with nothing behind it — every
  real status, and OBE, only show up when they already match something in `results`. Consistency with
  that existing behavior wins over the earlier "simpler, predictable UI" framing.
- Computing `has_in_review` without an N+1 requires reusing `batch_load_change_requests_in_review`
  rather than the naive `any(result.in_review for result in results)` — see step 2 for the mechanism
  and why `in_review` (a computed property, unlike `is_obe`'s plain column) can't be scanned the cheap
  way `has_obe` is.
- The Context caveat above (OBE's `enable_obe` gate being invisible to users of this page) is now moot
  for this decision either way, since `"In Review"` is data-driven too — it was never really a reason
  *for* "always show" in the first place, just a note that the original "always vs. conditional"
  contrast with OBE wasn't something a user could actually observe.
- **Retained: empty-result behavior.** Conditional visibility makes this rare rather than eliminating
  it entirely (e.g. a change request could resolve between the filter-options fetch and the list
  query). If a user does select "In Review" and it matches zero BLIs, the table shows the app's
  existing default empty-state for any filter combination that yields no rows — no special-cased
  messaging or UI is needed for this pseudo-status specifically.

**Decision 5: Should `IN_REVIEW` be supported on both `budget_line_status` and the generic `status`
param, or only `budget_line_status`?**
- **Chosen: both**, per team direction, for parity with how OBE's pseudo-value already works
  identically on both params today.

## Risks and Edge Cases

| Risk | Mitigation |
|---|---|
| `_apply_pseudo_status_filter` refactor changes OBE behavior unintentionally (it's a rename + generalization of `_obe_status_filter`) | All existing OBE backend tests (`test_budget_line_items_get_all_obe_budget_lines`, `test_get_obe_budget_lines`) must continue passing unmodified — treat any change to their expected output as a regression, not an intentional update. Additionally, an all-disabled-pseudo-status request (e.g. `budget_line_status=Overcome by Events` with `enable_obe` off) must filter to zero rows, not fall through to an unfiltered `.where()`-less query — see the new regression test in Testing Strategy and the fix in step 1b. |
| A BLI could theoretically have **both** a `BudgetLineItemChangeRequest` and be `is_obe`/any other status simultaneously — combining `IN_REVIEW` with other selected statuses must OR, not AND | Covered by the new "combining DRAFT + IN_REVIEW" test above. |
| `_in_review_exists_clause()` correlation inside the subquery `WHERE`, given the outer query may already `.join(Agreement, ...)` for sort/filter reasons | **Resolved, not a real risk** — see the compiled-SQL verification below the table. The combined-with-sort test is kept as cheap regression insurance, but the correlation-ambiguity concern that originally motivated it is unfounded. |
| Removing `_obe_status_filter` in favor of `_apply_pseudo_status_filter` could break something outside this file if it's imported/tested directly elsewhere | `grep -rn "_obe_status_filter"` across the whole repo before deleting it, not just within this file. |
| An OBE'd BLI (`is_obe=True`) that is also in-review would be silently excluded from `IN_REVIEW` filter results by `_apply_obe_exclusion_filter`'s unconditional `AND NOT is_obe` — contradicting Decision 2's "match `in_review` exactly" promise. Confirmed reachable via an ordinary agreement-level change request on an agreement with an OBE'd line — not a hypothetical needing confirmation first. | **Fixed, not deferred** — see step 1d: `_apply_obe_exclusion_filter` now spares genuinely-in-review rows when `"IN_REVIEW"` was requested, via `exclusion \| self._in_review_exists_clause()`. Locked in by a new backend test (Testing Strategy) asserting an `is_obe=True`, in-review BLI **is** returned when filtering by `IN_REVIEW` with `enable_obe` off, and is still excluded from a real-status-only filter. |

**Correlation risk resolved during review:** compiling `_in_review_exists_clause()` inside an outer
query that already joins `Agreement` confirms SQLAlchemy correlates each `EXISTS` subquery to the
outer `budget_line_item` row, never to the joined `agreement` table:

```sql
SELECT budget_line_item.id
FROM budget_line_item LEFT OUTER JOIN agreement ON agreement.id = budget_line_item.agreement_id
WHERE (EXISTS (SELECT change_request.id FROM change_request
        WHERE change_request.status = %(status_1)s
          AND change_request.change_request_type = %(change_request_type_1)s
          AND change_request.budget_line_item_id = budget_line_item.id
          AND change_request.change_request_type IN (...)))
   OR (EXISTS (SELECT change_request.id FROM change_request
        WHERE change_request.status = %(status_2)s
          AND change_request.change_request_type = %(change_request_type_3)s
          AND change_request.agreement_id = budget_line_item.agreement_id
          AND change_request.change_request_type IN (...)))
```

Also worth knowing: `BudgetLineItemChangeRequest` extends `AgreementChangeRequest` via single-table
inheritance on `change_request` (`backend/models/change_requests.py:28-96`), so SQLAlchemy appends a
redundant polymorphic `change_request_type IN (...)` predicate to each subquery — harmless, and it
makes this plan's explicit `change_request_type ==` filters in step 1a technically redundant too, but
keep them anyway so the clause reads as a literal mirror of `change_requests_in_review`. The
combined-with-sort test in Testing Strategy is still cheap insurance worth keeping; the correlation
worry that originally motivated it is not.

## Verification

- [ ] `cd backend/ops_api && pipenv run black --config ./pyproject.toml . && pipenv run nox -s lint && pipenv run pytest`
- [ ] `cd frontend && bun run format && bun run lint --fix && bun run test --watch=false`
- [ ] Manual verification per the "Manual/E2E" section above, against the local Docker stack.
- [ ] Confirm `backend/openapi.yml` doesn't need updating — the query params (`budget_line_status`,
  `status`) and response schema (`statuses`) are unchanged in *shape* (still `list[string]`), only in
  the set of accepted/returned string values, which OpenAPI's `string` type doesn't enumerate today
  for these fields. Run `/sync-openapi` anyway to double check nothing else drifted.

## Notes

### Resolved during review (previously listed as open questions)

- **Frontend constant precedent**: resolved — no new constant is being added (see step 5). OBE is a
  bare string literal everywhere on the frontend today, and `IN_REVIEW` will follow that same
  convention rather than introduce a one-off constant.
- **`only_my`-zero-results / filter-options visibility**: resolved — and reversed from "always appear"
  to "conditionally appear" (see the updated Decision 4). `has_in_review` is derived from the same
  post-`only_my`-filtered `results` list every other filter option comes from (step 2), so `only_my`
  reducing in-review BLIs to zero correctly hides `"IN_REVIEW"` from the options list, matching every
  other entry's behavior.
- **OBE + in-review coexistence**: reopened and fixed, not dropped. An earlier revision of this plan
  dropped this edge case as moot, reasoning that `enable_obe` is hardcoded `false` on this page, so
  OBE rows never appear regardless of `in_review` state. That reasoning was incomplete: `is_obe` and
  `in_review` can genuinely coexist via an ordinary agreement-level change request (single-table
  inheritance + `check_agreement_id` mean *every* BLI on the agreement becomes `in_review=True`, not
  just the change-requested one), `TableTag.jsx` renders "In Review" ahead of "OBE" wherever that row
  is shown, and this ticket's own Decision 2 explicitly promises the filter matches `in_review`
  exactly. Silently dropping such a row from the `IN_REVIEW` filter would violate that promise. Fixed
  in step 1d (a scoped change to `_apply_obe_exclusion_filter`) rather than left as a documented
  non-issue — see the reinstated row in the Risks and Edge Cases table.
- **Service-layer direct unit tests**: resolved — skipping a direct unit test for
  `_apply_pseudo_status_filter`/`_in_review_exists_clause`, matching the existing convention that
  `_obe_status_filter` has no direct unit test either (see Testing Strategy).

### References

- Existing OBE pseudo-status precedent: `backend/ops_api/ops/services/budget_line_items.py:361-375`
  (`_obe_status_filter`), `:1170-1171` and `:1179` (`get_filter_options`).
- `in_review` model definition: `backend/models/budget_line_items.py:324-356`.
- `batch_load_change_requests_in_review` (used by step 2 to compute `has_in_review` without an N+1):
  `backend/ops_api/ops/services/budget_line_items.py:1383-1425`, already consumed by
  `backend/ops_api/ops/resources/budget_line_items.py:160` for the same reason.
- Row-level "In Review" tag rendering: `frontend/src/components/UI/TableTag/TableTag.jsx:19-44`.
