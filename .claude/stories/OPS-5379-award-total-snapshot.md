---
issue: TBD
branch: OPS-5379/award-data-feedback
---

# Snapshot agreement total at time of award

> **Revision note:** this plan was adversarially reviewed by three independent reviewers after the first draft. Six defects were confirmed and corrected — most importantly, a proposed second (legacy) write site has been **removed**, and an overflow guard was added. Corrections are marked ⚠️ throughout.

## Story Overview

**Ticket:** OPS-5379 (follow-up feedback on [Award & Modification History](./OPS-5379-award-modification-history.md))
**Title:** Capture and display the Contract Total snapshot at time of award

## Background

### Current State

The **Contract Total** field on the Awards & Modifications tab **always displays "TBD"**, because the column it reads from is never written.

The feature is **already scaffolded end to end except for a single missing write** (all verified against the code):

- `ProcurementAction.agreement_total` (`backend/models/procurement_action.py:131-133`) exists as `Numeric(12, 2)`, commented *"Cumulative agreement total after this action"*. Already migrated in alembic revision `5b89d517ea94` (on both `procurement_action` and `procurement_action_version`). **No migration needed.**
- Read path works: `agreement_award_history.py:200` maps `action.agreement_total` → `contract_total` → `AgreementAwardHistoryRecordSchema` → `GET /agreements/<id>/award-history/` → the "Contract Total" label at `awardModificationHistory.helpers.js:48`.
- `openapi.yml` already documents it (`:8703`; `contract_total` at `:7000`; a `ProcurementActionAwarded` example at `:10776` showing `agreement_total: "500000.00"`).
- The original OPS-5379 story specified `contract_total` reads from this column — the read side was built expecting it populated; only the write was never implemented.

**No production, ETL, or migration code assigns `ProcurementAction.agreement_total`** (exhaustive sweep; `grep -rn "agreement_total" backend/data_tools/` returns zero hits). That is the entire bug.

### Desired State

The right aggregate already exists: `Agreement.agreement_total` (`backend/models/agreements.py:317`) = `agreement_subtotal` + `total_agreement_fees` (`:285`, `:301`), each summing `amount`/`fees` over `self.budget_line_items` where `bli.is_obe or bli.status != BudgetLineItemStatus.DRAFT` — agreement-wide, with **no fiscal-year or procurement-action scoping**, exactly as required.

Awarding an agreement freezes its total onto the award's procurement action, and the tab shows a real Contract Total instead of TBD.

> ⚠️ **Naming landmine:** `Agreement.agreement_total` is the **live computed property**; `ProcurementAction.agreement_total` is the **frozen snapshot column**. Same name, different models. A third unrelated `agreement_total` (`schemas/procurement_tracker_steps.py:29`, `fields.Float`) serializes the live property — leave it alone.

### User Story

As a user viewing an agreement's Awards & Modifications tab, I want to see the Contract Total as it stood when the agreement was awarded, so that I have an accurate historical record of what was awarded rather than a figure that shifts as budget lines are later edited.

### Acceptance Criteria

- [x] Approving an award writes a snapshot of the agreement total to `ProcurementAction.agreement_total`
- [x] The snapshot sums **amount + fees** across budget lines where `is_obe or status != DRAFT` — **agreement-wide, not limited to the awarded fiscal year**
- [x] ⚠️ Non-OBE draft lines are excluded. (An `is_obe` line that is *also* DRAFT **is included** — that is the existing predicate's behavior, deliberately reused. The first draft's ACs contradicted each other here.)
- [x] The snapshot is **write-once** — later budget line edits never change it
- [x] A non-zero snapshot renders on the tab with two decimals instead of "TBD"; a zero total leaves TBD
- [x] Modification rows are unaffected (see [Future Improvements](#future-improvements))

### Scope decisions (confirmed with user)

- **Initial award only** (`AwardType.NEW_AWARD`). Modifications deferred.
- **No backfill.** Pre-existing awarded agreements keep showing TBD.
- **Write-once / immutable.** Never recomputed; later budget line edits must not change it.
- ⚠️ **Zero total ⇒ skip the write.** Leave NULL (renders TBD) and log a warning, rather than storing `0.00`. Reason: `formatCurrency` renders zero as **`$0`** (`currencyFormat.helpers.js:14`, `num === 0 ? 0 : 2`), which reads as "this award was worth nothing" — strictly worse than "unknown" — and write-once + no-backfill would make it permanent, correctable only by manual SQL.
- ⚠️ **Single write site.** Only `_handle_award_approval`. See Decision 2.

## Technical Context

### Related Components

- `backend/ops_api/ops/services/procurement_tracker_steps.py` — **the only production file changed**
- `backend/models/agreements.py:317` — `Agreement.agreement_total`, the live computed property supplying the value
- `backend/models/procurement_action.py:131-133` — the target snapshot column
- `backend/ops_api/ops/services/agreement_award_history.py:200` — read path (no change)
- `frontend/src/helpers/awardModificationHistory.helpers.js:48` — render (no change)

### Dependencies

None. No new packages, no migration, no schema/resource/frontend/`openapi.yml` change.

### Assumptions

Verified available at module scope in `procurement_tracker_steps.py` already: `Agreement`, `ProcurementAction`, `logger` (loguru). `Decimal` is **not** imported, so the new import is a clean addition. No `from __future__ import annotations`, so annotations evaluate eagerly — fine, both names are real imports.

## Implementation Plan

### Approach

Add one write-once helper to `ProcurementTrackerStepService` and call it from the single place that assigns `ProcurementActionStatus.AWARDED` on the semantic approval path.

### Files to Create

None.

### Files to Modify

- `backend/ops_api/ops/services/procurement_tracker_steps.py` — import, new helper, one call site
- `backend/ops_api/tests/ops/services/test_award_approval_service.py` — two new unit tests
- `backend/ops_api/tests/ops/procurement_tracker/test_award_approval_review_card.py` — five new integration tests, no new fixture needed for the DRAFT-exclusion case
- `frontend/src/helpers/awardModificationHistory.helpers.test.js` — one new case for the zero/TBD distinction

### Implementation Steps

1. **Add the import** — alongside the existing `from datetime import date`:

   ```python
   from decimal import ROUND_HALF_UP, Decimal
   ```

2. **Add the write-once helper** — insert immediately before `_handle_award_approval` (currently line 1012):

   ```python
   # Numeric(12, 2) → 10 integer digits. BudgetLineItem.amount is itself Numeric(12, 2),
   # so a handful of large lines can exceed the column. Exceeding it must cost us the
   # snapshot, never the award (see below).
   _AGREEMENT_TOTAL_MAX = Decimal("9999999999.99")

   @staticmethod
   def _snapshot_agreement_total(procurement_action: ProcurementAction, agreement: Agreement) -> None:
       """Capture the agreement's dollar total onto the procurement action, once.

       Write-once by design: a point-in-time snapshot of every non-DRAFT budget line
       (amount + fees) at the moment of award, surfaced as "Contract Total" on the
       Awards & Modifications tab. Never recomputed — later BLI edits must not
       retroactively change what was awarded.

       Note the deliberate name collision: Agreement.agreement_total is the *live*
       computed property; ProcurementAction.agreement_total is this frozen snapshot.
       """
       if procurement_action.agreement_total is not None:
           logger.debug(
               f"ProcurementAction {procurement_action.id} already has agreement_total "
               f"{procurement_action.agreement_total} — leaving the existing snapshot untouched"
           )
           return

       # Quantize explicitly rather than letting Numeric(12, 2) round implicitly on INSERT:
       # BudgetLineItem.fees is (fee_rate / 100) * amount, which routinely yields sub-cent
       # values (e.g. 4.8% of $1,000.33 = $48.01584), so the raw sum can carry 4+ decimals.
       total = agreement.agreement_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

       # A zero snapshot is indistinguishable to a reader from "we know it was $0", and
       # formatCurrency renders it "$0". Leaving NULL keeps the field honest ("TBD") and,
       # critically, still correctable — write-once would otherwise make $0 permanent.
       if total == 0:
           logger.warning(
               f"Agreement {agreement.id} has a zero non-DRAFT total at award; "
               f"leaving ProcurementAction {procurement_action.id}.agreement_total NULL"
           )
           return

       # Overflow must not abort the award. db_session.commit() covers the whole award
       # transaction (BLI obligations, status, date, notifications), and the resource's
       # patch has no try/except — so a DataError here would roll ALL of that back and
       # return a 500, silently un-awarding the agreement.
       if total > ProcurementTrackerStepService._AGREEMENT_TOTAL_MAX:
           logger.error(
               f"agreement_total {total} exceeds Numeric(12, 2) for ProcurementAction "
               f"{procurement_action.id}; skipping snapshot to protect the award transaction"
           )
           return

       procurement_action.agreement_total = total
       logger.debug(f"Snapshotted agreement_total {total} onto ProcurementAction {procurement_action.id}")
   ```

   ⚠️ Dropped `or Decimal("0")` from the first draft: `Agreement.agreement_total` can never be `None` (both components early-return `Decimal("0")` and both `sum()` calls are seeded), so it was dead code that *read* as a `None`-guard while actually being a falsiness-guard. The explicit `total == 0` check now carries that intent.

3. **Single call site** — append as the **last** statement in the existing `award_type == NEW_AWARD` / `obligated_date is not None` block in `_handle_award_approval` (after the `status = ProcurementActionStatus.AWARDED` log line):

   ```python
                       self._snapshot_agreement_total(procurement_action, agreement)
   ```

   `agreement` is already bound earlier in the method, and `agreement.budget_line_items` is already warm (the `IN_EXECUTION` loop iterated it), so no eager-loading change is needed. Placed inside the existing guards, so the snapshot fires exactly when `status` is set to `AWARDED`.

### Key Decisions

**Decision 1: Which budget lines does the snapshot cover?**
- **Chosen:** All non-draft budget lines on the agreement (reusing `Agreement.agreement_total`) — explicitly required by the feedback; agreement-wide, not fiscal-year-scoped.

**Decision 2: Should the snapshot also be written from the legacy `_advance_active_step_if_needed` call site?**
- Option A: Only `_handle_award_approval` (the semantic approval path)
- Option B: Mirror the write at both `AWARDED`-assignment sites
- **Chosen: Option A. ⚠️ This reverses the first draft's decision, which chose Option B.** Adversarial review found a concrete failure: an existing BDD test (`test_validate_procurement_tracker_steps.py`) builds a real `ContractAgreement` with **zero budget lines** and reaches the legacy branch as the sole award path. A mirrored write there would snapshot `Decimal("0")` and, under write-once + no-backfill, **permanently block** the later, semantically correct Budget Team approval from ever setting the real value. Mirroring also contradicted Decision 3 (see below): the legacy site runs *before* the `IN_EXECUTION → OBLIGATED` transition, so write-once would let the pre-transition value win — nullifying the exact future-proofing Decision 3 was written to buy.

**Decision 3: Snapshot before or after the `IN_EXECUTION` → `OBLIGATED` transition?**
- **Chosen:** After. ⚠️ Corrected rationale: the value is identical either way, but *not* because `fees` is status-independent by design — rather because branch 3 of `BudgetLineItem.fees` (`budget_line_items.py:189-196`) returns `Decimal("0")` exactly as branch 4 does, making its DRAFT check **currently inert**. Snapshotting after the flip is the defensible position precisely because that coincidence could be fixed someday.

**Decision 4: Quantize the Decimal before assignment?**
- **Chosen:** Yes, `ROUND_HALF_UP` to 2 places. `BudgetLineItem.fees` is `(fee_rate / 100) * amount`, and fee rates are whole-number percentages, so sub-cent residue is normal. Without quantizing, Postgres rounds silently on INSERT and the in-memory value diverges from the stored one.

**Decision 5: Backfill existing awarded agreements?**
- **Chosen:** No. True historical budget-line state at each past award moment isn't reconstructable from `OpsDBHistory` (field-level row diffs, not aggregates); a backfill would fabricate plausible-but-wrong history.

**Decision 6: What should a zero-total award store?**
- Option A: Write `0.00` — honest, but `formatCurrency` renders it as `$0`, which under write-once + no-backfill is permanently uncorrectable and reads as "worth nothing"
- Option B: Skip the write, leave NULL/TBD
- **Chosen:** Option B.

**Decision 7: OBE + DRAFT lines — include or exclude?**
- Option A: Introduce a new aggregate that excludes all DRAFT lines regardless of `is_obe`
- Option B: Reuse `Agreement.agreement_total` as-is (an OBE line that is also DRAFT is included)
- **Chosen:** Option B — no code divergence from every other place this aggregate is used; the acceptance criteria wording was corrected to match instead.

## Correction: the "AWARDED ⟹ snapshot set" invariant is narrower than first claimed

The first draft asserted this invariant held everywhere, backed by "only two code paths assign `AWARDED`." **Both claims are false.** Four paths produce `AWARDED` with `agreement_total` NULL, and only one is touched by this change:

| Path | Location | Note |
|---|---|---|
| ETL backfill | `data_tools/src/backfill_procurement_tracker.py:136` | `action_status=AWARDED` via constructor kwarg. **Live and re-runnable** — keeps minting TBD rows. |
| Data migration | `alembic/.../bb8606c2308b:82` | Raw `INSERT ... 'AWARDED'`; version-row INSERT names `agreement_total` as literal NULL. |
| Seed data | `data_tools/data/agreements_and_blin_data.json5:1121-1183` | 7 seeded `AWARDED` actions, no total. |
| Service layer | `procurement_tracker_steps.py` (`_handle_award_approval`, `_advance_active_step_if_needed`) | The only two that *could* snapshot; after Decision 2, only `_handle_award_approval` does. |

The real invariant: **service-layer awards approved through `_handle_award_approval` get a snapshot; ETL/migration/seeded/legacy-path awards do not.** `test_agreement_award_history_service.py` already pins the negation (`status=AWARDED`, no total, `contract_total is None`) and stays green.

⚠️ **Compounding defect worth noting in the PR (not fixed here):** `ProcurementTracker.mark_completed`, used by the ETL backfill, never sets `award_approval_status`. Since `_approved_trackers_by_action` (`agreement_award_history.py`) gates on `award_approval_status == "APPROVED"`, ETL-awarded cycles **render no row at all** — not even a TBD one. Don't let anyone debug that as a regression of this change.

## Testing Strategy

### Unit Tests

`backend/ops_api/tests/ops/services/test_award_approval_service.py` — added `TestHandleAwardApprovalAgreementTotalSnapshot`:

- [x] **Quantize** — live total `Decimal("1234.5678")`, action's is `None` → asserts `Decimal("1234.57")`
- [x] **Zero total skipped** — live total `Decimal("0")` → asserts `agreement_total` stays `None`

> Regression note (verified): existing tests build `proc_action = MagicMock()`, so `agreement_total` is a truthy mock and the `is None` guard short-circuits. No existing test broke.

### Integration Tests

`backend/ops_api/tests/ops/procurement_tracker/test_award_approval_review_card.py`. Reused the existing `test_pending_award_step` fixture (tied to seeded tracker 1 → agreement 13, "CONTRACT #13: Procurement Tracker Test Contract") — no new fixture needed for the main cases:

- [x] **Snapshot + DRAFT exclusion** — approving snapshots `Decimal("366800.00")` = `(150,000 PLANNED + 200,000 IN_EXECUTION) × 1.048` (IBC shop, 4.8% fee), excluding the $250,000 DRAFT line. Verified directly against seed data and confirmed live against an isolated container (a naive all-BLI sum would be $628,800.00).
- [x] **Write-once at DB level** — after approving, edit a non-draft BLI's amount and commit; snapshot is unchanged. This is DB-testable without a second approve (the first draft wrongly claimed otherwise).
- [x] **Zero total leaves NULL** — new fixture `test_zero_bli_award_step` (a fresh agreement with no budget lines at all) → approve → `agreement_total is None`.
- [x] **Multi-fiscal-year + quantize exercised at the DB level** — added a BLI in a different fiscal year with a fractional-cent-producing amount (`$1,000.33` at 4.8% = `$48.01584`); asserts the exact quantized total, proving the snapshot spans fiscal years and that `ROUND_HALF_UP` actually fires (the seeded whole-dollar amounts alone never exercise it).
- [x] **Surfaces as Contract Total in award history** — approves the *seeded* AWARD step directly (not a newly created one), because `ProcurementTracker.get_step(AWARD)` returns steps ordered by `step_number` and always resolves to the seeded step first; then asserts `GET /agreements/13/award-history/` returns `contract_total == "366800.00"`.

### Manual Testing

- [x] Verified via isolated Docker test run: agreement 13 → award approval → Contract Total displays $366,800.00 with the DRAFT line excluded, confirmed through the full stack (API → schema → history service → snapshot column).

### Test Data Needed

None beyond what's already seeded (agreement 13 / tracker 1 / action 100) for four of five integration tests; one new self-contained fixture for the zero-BLI case.

## Validation

### Code Quality

```bash
cd backend/ops_api
pipenv run pytest tests/ops/services/test_award_approval_service.py \
                  tests/ops/procurement_tracker/test_award_approval_review_card.py \
                  tests/ops/features/test_validate_procurement_tracker_steps.py
pipenv run black --config ./pyproject.toml .
pipenv run nox -s lint
cd ../../frontend && bun run test --watch=false && bun run lint
```

- [x] All tests pass: 18 backend unit, 11 integration, 25 BDD regression, 13 frontend
- [x] Black formatting applied
- [x] `nox -s lint` passes
- [x] Frontend lint passes

### Functional Validation

- [x] Feature verified against an isolated Docker DB (agreement 13 walkthrough above)
- [x] Acceptance criteria met
- [x] No regressions — the BDD suite (25 tests) exercises the legacy path this change deliberately left untouched and stays green

### Documentation

- [x] `openapi.yml` — no change needed; already documents both `agreement_total` and `contract_total`
- [x] Frontend: added a `displayCurrency(0)` / `displayCurrency("0.00")` case pinning the `$0`-vs-TBD distinction Decision 6 rests on

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Total exceeds `Numeric(12,2)` → `DataError` at commit rolls back the **entire award** (obligations, status, notifications) and returns 500 | High | Low | `_AGREEMENT_TOTAL_MAX` bound check skips the snapshot instead. Quantize does **not** catch this — it only trips above ~28 significant digits |
| QA sees an empty tab / TBD on pre-existing awards and reads it as the fix failing | Med | High | Called out in PR description (see below) |
| Zero total permanently stored as `$0`, uncorrectable under write-once | Med | Low | Zero-skip guard leaves NULL (Decision 6) |
| Sub-cent fee residue makes stored value diverge from computed | Low | High | Explicit `ROUND_HALF_UP` quantize (Decision 4) |

## Notes

### PR description callouts

- **The Awards & Modifications tab is empty — not "TBD" — for every seeded agreement out of the box.** The 7 seeded `AWARDED` actions have no `procurement_tracker` rows, so `get_award_history` returns `[]`.
- **No backfill**, by decision: pre-existing awarded agreements stay NULL.
- **ETL-awarded cycles render no row at all** (`mark_completed` never sets `award_approval_status`) — pre-existing, not caused by this change.

### Side effects (no action needed)

- **`OpsDBHistory`** — reflects generically over `mapper.columns`, so the change is captured on the `ProcurementAction` UPDATE row for free, in the same transaction. The snapshot becomes independently auditable.
- **`AgreementHistory`** (user-facing log) — dispatches on `OpsEventType`, not column diffs; no raw key leaks into the feed.
- **sqlalchemy-continuum** — `procurement_action_version` already tracks the column. With write-once, exactly one version row bears a non-null value.

### Open Questions

None — scope, backfill, mutability, zero-total behavior, and the OBE/DRAFT predicate were all confirmed before implementation.

### Future Improvements

- **Per-modification snapshots.** `MODIFICATION` actions never reach a terminal status (both `AWARDED` service sites gate on `NEW_AWARD`; `get_or_create_procurement_records_for_modification` hardcodes `PLANNED`), and `get_or_create_for_agreement` matches on `(agreement_id, award_type)` excluding terminal statuses — so every mod collapses into one perpetually-`PLANNED` row with `agreement_mod_id` never set. `_build_record` keys `is_modification` off that FK, so mod rows can't render correctly until this is fixed. The `NEW_AWARD` gate keeps this change safe meanwhile.
- **`ProcurementAction.award_total` is also never written in production** — sole assignment is in a test file. Distinct field (the tab's Award Amount reads `award_step.award_amount`). Same class of gap.
- **`_handle_award_approval` rewrites `date_needed` on every `IN_EXECUTION` BLI to the obligated date**, collapsing their fiscal years. Surfaced while designing the multi-FY test; likely unintended, out of scope here.
- **The legacy award branch discards the caller's `obligated_date`** — it falls back to `date.today()`, after which the primary path's `is None` check fails on a later PATCH. Pre-existing bug in a path this change no longer touches.
- **Test infra note:** `backend/ops_api/tests/conftest.py`'s `db_service` fixture hardcodes `127.0.0.1:5432` for its SQLAlchemy connection, ignoring the `DB_PORT` env var the compose file itself honors. If the dev stack (`docker compose up`) is running on port 5432, Docker-backed integration tests silently connect to the real dev database instead of the isolated test container. Discovered while debugging this change's integration tests; unrelated to it, worth its own ticket.

### References

- [OPS-5379 Award & Modification History story](./OPS-5379-award-modification-history.md) — original tab implementation; specified `contract_total` reads from `ProcurementAction.agreement_total`
- `backend/alembic/versions/2025_12_11_1746-5b89d517ea94_add_procurement_actions.py` — created the column
