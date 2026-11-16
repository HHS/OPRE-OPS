---
issue: 6525
branch: OPS-6525/fix-stuck-in-review-loe-flag
---

# Contract-mod request can get stuck IN_REVIEW if ENABLE_MODIFIED_LOE_EDITS is off

## Goal

`ContractModificationRequestService.submit()` and `.review()` both call `self._check_enabled()` unconditionally, first thing, so when `ENABLE_MODIFIED_LOE_EDITS` is off there's no way to approve/decline a request that's already `IN_REVIEW` — it's stuck until the flag is flipped back on or the DB is edited directly. Fix the ordering so the flag only blocks *starting* a new contract-modification workflow, never resolving one already in flight.

## Acceptance Criteria

- [x] `submit()` checks request/BLI state and authorization before `_check_enabled()`
- [x] `review()` checks the request's status and `can_review` before `_check_enabled()`
- [x] A test confirms an `IN_REVIEW` request can still be approved/declined with the flag off

## Technical Details

### Approach

**`submit()` — pure reorder.** Move the `self._check_enabled()` call from its current position (first statement) to immediately after the "nothing to modify" check, right before the `ContractModificationRequest(...)` is built. Everything that currently runs after it — resource-exists check, authorization (`user.is_superuser or check_user_association`), `agreement.is_awarded`, already-in-review, and BLI-executable/non-empty checks — now runs first. No other behavior changes: the flag still unconditionally blocks starting a new workflow. The only user-visible effect is which error wins when multiple things are wrong (e.g. an unauthorized submit now reports the authorization error instead of "not enabled") — confirmed no regression against the existing `test_submit_flag_off_returns_400`, which still gets a 400 post-reorder (now from the "nothing to modify" check instead, since that fixture has no pending edits/BLIs).

**`review()` — the check is removed, not reordered.** `_check_enabled()` is unconditional and doesn't depend on anything the status/`can_review` checks produce, so simply moving it after those checks still raises whenever the flag is off — it would never let a legitimate `IN_REVIEW` request be resolved, which fails AC #3 outright. Confirmed with the developer: the correct fix is to drop `self._check_enabled()` from `review()`'s success path entirely. `review()` only ever acts on a request that's already been submitted, never starts a new one, so there's nothing left for the flag to gate there. This is the one intentional functional change in this story — scoped narrowly to "the flag no longer gates resolving an in-flight request" — everything else is a reorder.

### Key Files

- `backend/ops_api/ops/services/contract_modification_requests.py` — the fix: `submit()` (~L75–131), `review()` (~L133–177), `_check_enabled()` (~L311–314, unconditional config check, no state dependency)
- `backend/ops_api/ops/resources/contract_modification_edits.py` — API layer; `submit()` is called from the list resource's `post` (~L117), `review()` from `ContractModificationRequestItemAPI.patch` (~L148–164)
- `backend/ops_api/tests/ops/agreement/test_contract_modification_requests.py` — existing integration tests for this service (`test_submit_flag_off_returns_400` ~L458, review tests like `test_review_twice_returns_400` ~L582); new tests go here, near `# ---=== Review ===---`
- `backend/ops_api/tests/ops/agreement/test_contract_modification_edits.py` — defines the reusable `modified_loe_enabled`/`modified_loe_disabled` fixtures (toggle `app.config["ENABLE_MODIFIED_LOE_EDITS"]`, restore on teardown)
- `backend/models/contract_modification_requests.py` — `ContractModificationRequestStatus` enum (`IN_REVIEW`, `APPROVED`, `DECLINED`); `can_review` is a static method on the service itself (~L302–309), not a model field
- `backend/ops_api/ops/environment/default_settings.py:106` — `ENABLE_MODIFIED_LOE_EDITS` flag definition

### Testing Strategy

Integration tests through the Flask test client (real app, real DB) in `test_contract_modification_requests.py` — this service has no direct unit tests anywhere in the suite; every existing test drives it via the `_submit()`/`_review_mod()` helpers hitting the real API, which matches `docs/TESTING.md`'s Integration tier for service-layer logic with DB access.

Two tests to add:

1. **`test_review_succeeds_when_flag_is_off_for_an_in_review_request`** (AC #3 — the core fix). Use `awarded_with_edit` + `_submit(...)` while the flag is still on to get a real `IN_REVIEW` request, then set `app.config["ENABLE_MODIFIED_LOE_EDITS"] = False` and call `_review_mod(...)`. Parametrize over `["APPROVE", "DECLINE"]`. Assert `response.status_code == 200` and the resulting status (`APPROVED`/`DECLINED`) — proving the flag no longer blocks resolving it.
2. **`test_submit_still_blocked_by_flag_when_status_checks_pass`** (regression guard, closes a gap in the existing coverage). Use `awarded_with_edit` so every other `submit()` check passes (authorization, `is_awarded`, no existing in-review request, something to modify), flip the flag off, then call `_submit(...)`. Assert `400` with the "not enabled" error. The existing `test_submit_flag_off_returns_400` is not sufficient post-reorder — its fixture (`make_agreement`, no pending edits/BLIs) will now 400 on "nothing to modify" first and never actually reach `_check_enabled()`.

### Constraints

No functional changes beyond what's needed to fix this bug — no refactors of surrounding logic. `submit()` is a pure statement reorder; the flag must keep unconditionally blocking new workflows there. `review()`'s only functional change is dropping the `_check_enabled()` call from its success path, confirmed with the developer as the intended, scoped fix for this issue.
