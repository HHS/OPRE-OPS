# Plan — Skip Change Request review for Draft→Planned and in-Planned budget edits (flagged)

GH issue: #6094 — "Skip Change Request review for Draft→Planned and in-Planned budget edits (flagged)"

## Goal

Add a single, per-environment on/off capability that, **when ON**, makes two specific
budget-line changes apply immediately instead of creating a Change Request for a
Division Director to review:

1. **Draft → Planned** status change on a budget line.
2. **Budget-detail edits** (amount `amount`, funding source `can_id`, need-by date
   `date_needed`) on a budget line that is **already Planned and stays Planned**.

When the flag is **OFF**, behavior is exactly as today (both route through review/approval).

## Confirmed decisions (from user)

- **Keep the Review Agreement page**; do not redesign the flow.
- **Button relabel:** "Send to Approval" → **"Complete Status Change"**, shown **only when
  the flag is ON** (conditional). When OFF, keep "Send to Approval".
- **Frontend learns the flag via the existing `/version` endpoint** (extended to also
  return the flag). No build-time VITE flag.
- **Rollout:** ON in lower environments (dev/staging), OFF in production initially.
- **Env var (resolved):** plain `SKIP_CR_FOR_DRAFT_PLANNED`, read via `os.getenv` in
  `default_settings.py` with a `.lower() == "true"` parse. NOT the `FLASK_`-prefixed path.
- **Label scope (resolved):** "Complete Status Change" applies to **Draft→Planned only**.
  Planned→Executing keeps "Send to Approval" (still requires approval).
- **In-Planned edit copy (resolved):** reuse the existing "Changes Saved"-style
  applied-immediately copy, and suppress the "requires DD approval" pre-submit modal when
  the flag is ON. No new status-change copy for that path.

## Key findings (verified in code)

- **The entire routing decision lives in one function:**
  `backend/ops_api/ops/services/budget_line_items.py` →
  `update_with_change_request_ids` (line 518). The seam is the `directly_editable`
  boolean at **lines 552–556**:
  ```python
  budget_team_can_bypass = (
      is_budget_team(current_user)
      and not has_status_change
      and is_award_approval_requested(budget_line_item.agreement)
  )
  directly_editable = (
      is_super_user(current_user, current_app)
      or budget_team_can_bypass
      or (not has_status_change and budget_line_item.status in [BudgetLineItemStatus.DRAFT])
  )
  ```
- The function already returns `(bli, 202-if-CR-else-200, change_request_ids)` — so the
  200/202 distinction is available, but the button label must be decided **before**
  submit, hence the frontend needs the flag up front (via `/version`).
- The "status change cannot be combined with other edits" constraint is enforced at
  lines 538–540, **before** `directly_editable` — so it is automatically preserved.
- All existing validation runs in `self._validation(...)` at line 527, **before** the
  routing decision — so validation/completeness rules are unaffected by the flag.
- Existing bypasses (superuser, budget-team + award-approval-in-flight) are separate
  clauses in the same OR — leaving them intact means no duplication/conflict.
- **Per-environment config mechanism already exists:** `default_settings.py` reads
  `os.getenv(...)` and `app.config.from_prefixed_env()` overlays `FLASK_*` env vars
  (`backend/ops_api/ops/__init__.py:70–79`). A new env-var-driven boolean satisfies
  "no code change per environment."
- `/version` endpoint: `backend/ops_api/ops/utils/version.py` (`VersionAPI.get`) currently
  returns `{"version": ...}`. Frontend does **not** consume it yet.
- Frontend status submit: `frontend/src/pages/agreements/review/ReviewAgreement.{jsx,hooks.js,constants.js}`.
  Submit uses `updateBudgetLineItem` (PATCH). Success copy is hardcoded
  ("sent to your Division Director to review").
- **Pre-award context uses the SAME seam.** The pre-award pages
  (`frontend/src/pages/agreements/pre-award-approval/`) render BLIs read-only; the "Edit"
  button navigates to `/agreements/review/:id/edit` → `PATCH /agreements/:id/edit-bundle` →
  `AgreementEditBundleService` → `update_with_change_request_ids`. There is NO
  pre-award-specific BLI service. Pre-award operates on **PLANNED** lines
  (`pre-award-approval/constants.js:9` `VALIDATABLE_BLI_STATUSES = [PLANNED, EXECUTING]`),
  so an edit launched from pre-award IS an in-Planned edit the flag targets.

## Scope guardrails (from acceptance criteria)

- ONLY `Draft → Planned` status changes are affected — **not** any other transition
  (e.g. `Planned → Executing`, `Planned → later`). The flag must gate on the specific
  transition, not merely `has_status_change`.
- ONLY the three budget-detail fields on an **already-Planned** line
  (`amount`, `can_id`, `date_needed`) apply immediately — matching
  `BudgetLineItemChangeRequest.budget_field_names`.
- The always-direct fields (`services_component_id`, `grant_number_id`,
  `line_description`, `clin_id`) already apply directly today — unchanged.
- Existing bypasses (superuser, budget-team) unchanged.
- **Pre-award-context edits are IN SCOPE (resolved decision #5).** In-Planned edits launched
  from the pre-award Request page apply immediately when the flag is ON, exactly like any
  other in-Planned edit — no carve-out. The existing pre-award edit locks still apply
  (see next point) because `_validation` runs before the routing decision. This means the
  pre-award "pending DD approval" alert / "Send to Approval" gating (which keys off
  `bli.in_review`) simply won't trigger for these edits — accepted as intended.
- **Pre-award locks are preserved by ordering, NOT by the flag.** `_validation` (line 527)
  runs BEFORE `directly_editable` (line 552). So `is_pre_award_in_review` (blocks
  non-budget-team edits while pre-award is in review, `_validation` ~line 815) and
  `is_post_pre_award_locked` (blocks edits after pre-award approval, ~line 823) still raise
  before the flag's branch is reached. The flag must NOT be moved ahead of `_validation`.
- **Mixed-status submissions route PER-LINE (verified).** The edit-bundle loops over each
  BLI independently (`_update_budget_line_items`, `agreement_edit_bundle.py:326-367`), calling
  `update_with_change_request_ids` once per line, then commits the whole bundle atomically
  once (`:145`). So a submission touching BOTH a PLANNED and an IN_EXECUTION line SPLITS:
  - PLANNED budget edit → applies immediately, no CR (flag ON).
  - IN_EXECUTION budget edit → still creates a CR (`is_in_planned_budget_edit` requires
    `status == PLANNED`; IN_EXECUTION never matches the flag, and IN_EXECUTION is not a
    bypass path) — unchanged from today. IN_EXECUTION IS editable (`_bli_has_editable_status`
    allows DRAFT/PLANNED/IN_EXECUTION) so these edits reach the routing decision.
  - **Atomicity holds:** both the applied PLANNED edits and the CR-creating IN_EXECUTION
    edits are in the SAME `db_session.commit()`. If any line fails validation, the entire
    bundle (including the "applied immediately" PLANNED edits) rolls back — no half-writes.
  - **Frontend messaging is the catch (see step 9 + open question):** the bundle returns a
    NON-empty `change_request_ids` (from the IN_EXECUTION lines), so
    `EditAgreementAndBudgetLines.jsx:180` (`result?.change_request_ids?.length`) shows
    "Changes Sent to Approval" even though the PLANNED edits already applied. The
    exact copy for this mixed case is an OPEN QUESTION for product/UX (below).

---

## ⚠️ Critical defects found in adversarial review (must be designed around)

These were verified against the code — the naive "just widen `directly_editable` and reuse
`_apply_direct_edits`" approach is **wrong**:

- **DEFECT A — data loss (blocker).** The PATCH schema sets `load_default=None` for
  `can_id`, `amount`, `date_needed`
  (`backend/ops_api/ops/schemas/budget_line_items.py:52-54`). The resource loads the full
  body (`data = self._patch_schema.load(request.json)`,
  `resources/budget_line_items.py:90`) and passes `data | updated_fields` to the service.
  The Draft→Planned submit sends only `{status, requestor_notes}`
  (`ReviewAgreement.hooks.js:250-252`), so `amount/can_id/date_needed` arrive as `None`.
  `_apply_direct_edits` writes the **whole** dict via `update_data`, which unconditionally
  `setattr`s every column attr (`budget_line_items_helpers.py:49-52`) — **nulling the
  financials** on the very transition being "completed." The CR path is safe today because
  `_handle_change_requests` writes only whitelisted fields and builds the CR from raw
  `request.json`. **Fix: the direct-apply path must write only the explicitly-sent,
  allowed fields — never the None-filled `updated_fields`.**
- **DEFECT B — over-broad in-Planned predicate.** `has_non_status_change` is true for ANY
  non-status field (`_has_non_status_change`, lines 607-628), including `comments` and
  `proc_shop_fee_percentage`, which are neither in `budget_field_names` nor
  `ALWAYS_DIRECT_EDIT_FIELDS` and are silently dropped today. Gating direct-apply on
  `has_non_status_change` would newly persist them. **Fix: gate on the changed keys
  intersected with `BudgetLineItemChangeRequest.budget_field_names` = `["amount","can_id","date_needed"]`.**
- **DEFECT C — edit-bundle shares the seam.** `agreement_edit_bundle.py` calls
  `self._blis.update_with_change_request_ids(bli_id, updated_fields, commit=False)`. So the
  in-Planned budget-edit flow (`EditAgreementAndBudgetLines` → `CreateBLIsAndSCs` →
  `useUpdateAgreementEditBundleMutation`) routes through the same function — good for
  enforcement, but it inherits Defect A inside a `commit=False` transaction. Must be tested.
- **DEFECT D — frontend copy spread across 5+ sites, not one button.** "Send to Approval" /
  "sent to your Division Director" / the "requires DD approval" confirmation modal appear in
  `ReviewAgreement.jsx` (two branches, :378/:388), `ReviewAgreement.hooks.js`,
  `EditAgreementAndBudgetLines.jsx`, and `CreateBLIsAndSCs.hooks.js` (multiple). The
  in-Planned edit flow shows an explicit "Budget changes require approval from your Division
  Director" modal **before** submit — which, with the flag ON, tells the user review is
  required when it isn't. Both violate the "user cannot tell review was skipped" and "no
  approval sent" ACs unless addressed.
- **DEFECT E — label semantics.** "Complete Status Change" is meaningless for the in-Planned
  budget-**edit** case (no status change). Confirm copy for that path separately.

## Implementation

### Backend

**1. Add the flag to config (env-var driven).**
`backend/ops_api/ops/environment/default_settings.py`:
```python
# When True, Draft→Planned status changes and in-Planned budget-detail edits apply
# immediately instead of creating a Change Request. Per-environment via env var.
SKIP_CR_FOR_DRAFT_PLANNED = os.getenv("SKIP_CR_FOR_DRAFT_PLANNED", "false").lower() == "true"
```
Default OFF everywhere via the default. **Resolved: use the plain env var read in
`default_settings.py`** (case-robust, matches the `RUNNING_IN_AZURE` precedent). Set
`SKIP_CR_FOR_DRAFT_PLANNED=true` on the Container App per environment — no code change to flip.
Do NOT use the `FLASK_`-prefixed `from_prefixed_env()` path (JSON-parses values; `1`/`on`
would not be real bools) — and do not set the key in both places.

**2. Gate the routing decision — with a precise predicate.**
`backend/ops_api/ops/services/budget_line_items.py`, `update_with_change_request_ids`.
Parse the target status ONCE into a local (the function already loads the partial body at
line 535 — factor `parsed = schema.load(request.json, partial=True)` into a variable and
reuse it for both `has_status_change` and the target-status read). Then:
```python
skip_cr_enabled = current_app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False)

# Exactly Draft -> Planned (enum comparison; status is BudgetLineItemStatus(str, Enum)).
is_draft_to_planned = (
    has_status_change
    and budget_line_item.status == BudgetLineItemStatus.DRAFT
    and parsed.get("status") == BudgetLineItemStatus.PLANNED
)

# In-Planned budget-detail edit: ONLY the three budget fields, matching the CR path's
# budget_field_names. NOT has_non_status_change (Defect B).
BUDGET_FIELDS = set(BudgetLineItemChangeRequest.budget_field_names)  # {"amount","can_id","date_needed"}
changed_budget_keys = {
    k for k in BUDGET_FIELDS
    if k in diff_data and diff_data.get(k) != getattr(budget_line_item, k, None)
    # (use the same float-aware amount compare as _has_non_status_change)
}
is_in_planned_budget_edit = (
    not has_status_change
    and budget_line_item.status == BudgetLineItemStatus.PLANNED
    and bool(changed_budget_keys)
)

flag_allows_direct = skip_cr_enabled and (is_draft_to_planned or is_in_planned_budget_edit)

directly_editable = (
    is_super_user(current_user, current_app)
    or budget_team_can_bypass
    or (not has_status_change and budget_line_item.status in [BudgetLineItemStatus.DRAFT])
    or flag_allows_direct
)
```
Notes:
- Mixed status+edit is already blocked at 538–540, so `is_in_planned_budget_edit` can't
  collide with a status change.
- When the flag is OFF, `flag_allows_direct` is `False` → the expression is equivalent to
  today.

**3. Fix the direct-apply write set (Defect A — REQUIRED).**
Do NOT feed the None-filled `updated_fields` to `_apply_direct_edits` for the flagged paths.
Instead build the write set from the fields the client actually sent, intersected with the
allowed set for that path:
- Draft→Planned: write only `{"status": PLANNED}` (plus `updated_on`/`updated_by`).
- In-Planned edit: write only the `changed_budget_keys` present in `request.json`.

Options (pick during implementation):
- Add a `fields_to_apply: set[str] | None` param to `_apply_direct_edits` that, when set,
  filters `updated_fields` to those keys before `update_data`; OR
- Derive the write dict from `request.json` keys ∩ allowed set (mirrors how
  `_handle_change_requests` builds change data from raw `request.json`, lines 747-769).
Add a unit test asserting `amount/can_id/date_needed` are UNCHANGED after a status-only
Draft→Planned direct apply.

**4. Confirm no CR + no notification, audit preserved.** `_apply_direct_edits` creates no CR
and calls no reviewer-notification path (notifications live only on the CR path via
`ChangeRequestService.add_bli_change_requests`). Model history still fires via
`before_commit`/`after_flush`, and the resource wraps the call in
`OpsEventHandler(UPDATE_BLI)` — so the edit is recorded in the normal audit trail. Verified
in review.

**5. Extend `/version` to expose the flag.**
`backend/ops_api/ops/utils/version.py` `VersionAPI.get`:
```python
from flask import current_app, jsonify
return jsonify({
    "version": self.get_api_version(),
    "skip_cr_for_draft_planned": current_app.config.get("SKIP_CR_FOR_DRAFT_PLANNED", False),
})
```
Read the flag from `current_app.config` per request (only the version string is module-cached;
the flag must reflect the running env). Verified safe in review.

**6. `/sync-openapi`** — update `openapi.yml` for the `/version` response shape change.

### Frontend

**7. Add an RTK Query endpoint** in `frontend/src/api/opsAPI.js` to `GET /version`
(e.g. `getVersion` → `useGetVersionQuery`). Returns `{ version, skip_cr_for_draft_planned }`.
Handle the transient `undefined`-while-fetching state (Defect D / flicker risk): default the
flag to `false` (safe = "Send to Approval") until the query resolves, and gate the action
button's render on the version query having loaded to avoid a label flip.

**8. Draft→Planned flow — `ReviewAgreement.{jsx,hooks.js,constants.js}`.**
- Read `skip_cr_for_draft_planned` via the new query.
- **Button label (both branches — `ReviewAgreement.jsx:378` AND `:388`):** when flag ON,
  render **"Complete Status Change"**; else "Send to Approval". Apply to the
  `CHANGE_DRAFT_TO_PLANNED` action **only** — `CHANGE_PLANNED_TO_EXECUTING` still requires
  approval, so its label is unchanged (resolved decision #2).
- **Success message (`ReviewAgreement.hooks.js:291-301`):** currently hardcoded "sent to your
  Division Director." `handleSendToApproval` uses `.unwrap()` + `Promise.allSettled` and does
  NOT inspect HTTP status today. Rework to detect the applied-immediately case — the cleanest
  signal is the response body / status (200 vs 202) or absence of `change_request_ids`; if
  that's awkward with `.unwrap()`, key the message off the flag. Show an "applied
  immediately" success variant. This is more than a copy swap — scope it as a small logic change.

**9. In-Planned budget-edit flow — `EditAgreementAndBudgetLines.jsx` + `CreateBLIsAndSCs.hooks.js` (Defect D — was missing).**
This flow uses `useUpdateAgreementEditBundleMutation` (not `updateBudgetLineItem`) but routes
through the SAME backend seam (Defect C). It has its own approval UX that must be corrected
when flag ON:
- **Pre-submit confirmation modal** — `EditAgreementAndBudgetLines.jsx:~289` /
  `CreateBLIsAndSCs.hooks.js:~479` shows "Budget changes require approval from your Division
  Director." When flag ON, suppress or reword this for the in-Planned budget-edit case (it
  falsely tells the user review is required — violates the "cannot tell review was skipped" AC).
- **Success copy** — `EditAgreementAndBudgetLines.jsx:183-189` keys off
  `result?.change_request_ids?.length`; with the flag ON the backend returns no CR ids, so it
  should fall through to the "Changes Saved" branch — VERIFY this. The three hardcoded "sent to
  your Division Director" messages in `CreateBLIsAndSCs.hooks.js` (~446, ~503, ~549) are gated
  on `canEditDirectly` (superuser/budget-team) + `financialSnapshotChanged`, NOT the flag —
  they must also account for the flag so a normal user editing a Planned line isn't told it
  went to review.
- Note the copy semantics (Defect E): the in-Planned edit is not a status change, so reuse
  "Changes Saved"-style copy, not "Complete Status Change."
- **Mixed-status submission (PLANNED + IN_EXECUTION in one save).** The bundle returns a
  non-empty `change_request_ids` from the IN_EXECUTION line(s), so the current
  `change_request_ids.length` check shows "Sent to Approval" even though the PLANNED edits
  applied immediately. Backend behavior is correct (split, atomic); the SUCCESS COPY for this
  case is an open question for product/UX (below). Implement the backend split now; when the
  copy is decided, the frontend can distinguish applied-vs-pending lines from the response.

**10. In-review / pending indicators — verify, don't assume (Defect D).**
When the backend applies directly it creates no CR and the BLI returns `in_review: false`, so
these should show no pending state — but the plan must verify each, not hand-wave:
`components/UI/TableTag/TableTag.jsx` ("In Review" tag), `ChangeIcons/ChangeIcons.jsx` (locked
controls), `BudgetLinesTable/BLIRow.jsx`, `AgreementChangesAlert/AgreementsChangesAlert.jsx`,
and the reviewer queue (`ChangeRequests` list + `ApproveAgreement`). Confirm the edit-bundle
response marks `in_review: false` for the directly-applied line.

### Config / deploy

**11. Set the env var per environment** (ops task, outside repo for Azure): ON in dev/staging,
absent/false in prod. Document in the PR. If the team prefers the value be visible in-repo
per environment, it could also be set in `environment/azure/{dev,stg}.py` — but that is a
code change to flip, which conflicts with the AC; env var is preferred.

---

## Testing

**Aligned with `docs/TESTING.md`** (test pyramid; test at the lowest appropriate level;
favor integration over E2E; change-request approval chain is a documented BDD candidate).

### ⚠️ Auth-client fixture discipline (critical for this story)
The routing decision has **superuser and budget-team bypass clauses**. If a flag test runs
as the default `auth_client` (SYSTEM_OWNER id 503) it passes `is_super_user` and **never
exercises the flag** — a false green. Therefore:
- **Flag ON/OFF behavior** → `basic_user_auth_client` (id 521, BASIC_USER) — a user with no
  bypass, so the flag is the only thing that changes routing.
- **Bypass regression** (must be identical flag ON/OFF) → `division_director_auth_client`,
  `budget_team_auth_client`, and a superuser client.
- Set the flag via `app.config` override / monkeypatch on the `app` fixture per test.

### Backend — Integration tests (service layer + DB) — `tests/ops/services/test_budget_line_items.py` and `tests/ops/budget_line_items/`
These are the primary tests (service business logic with DB access = integration per the
decision matrix). Use `loaded_db` + rollback isolation.
Positive (flag ON, `basic_user_auth_client`):
- Complete Draft BLI → Planned applies immediately: new status readable, **no CR row created**, 200.
- **Data-loss guard (Defect A):** status-only Draft→Planned PATCH (body = `{status, requestor_notes}`)
  leaves `amount`, `can_id`, `date_needed` UNCHANGED after apply.
- Planned BLI budget-detail field changed (amount / can_id / date_needed): applies
  immediately, no CR, 200; other budget fields untouched.
- **Defect B guard:** editing `comments` / `proc_shop_fee_percentage` on a Planned line does
  NOT get newly persisted via the flag (behavior matches flag-OFF today).
- **Defect C:** edit-bundle PATCH containing a Draft→Planned BLI applies directly under the
  flag inside the bundle transaction, with no CR and no financial-field wipe.
Negative / regression:
- Flag OFF: both above still create a CR (202) — regression guard.
- Incomplete Draft → Planned still blocked with existing validation message (flag ON and OFF).
- Status change + budget edit combined still rejected (flag ON and OFF).
- `Planned → Executing` (and any non-Draft→Planned status change) still creates a CR even
  when flag ON — proves scope isn't broader than intended.
- **Pre-award lock preserved (resolved #5):** flag ON, agreement pre-award **in review**,
  non-budget-team user edits a PLANNED line → still BLOCKED by `_validation`
  (`is_pre_award_in_review`), not silently applied. Same for `is_post_pre_award_locked`
  after pre-award approval. Confirms the flag doesn't re-open locked edits.
- **Pre-award pre-request window (resolved #5):** flag ON, PLANNED line, pre-award NOT yet
  requested → in-Planned edit applies immediately, no CR (same as any in-Planned edit).
- **Mixed-status bundle (verified behavior):** flag ON, one edit-bundle updating a PLANNED
  line AND an IN_EXECUTION line → PLANNED edit applied directly (no CR), IN_EXECUTION edit
  creates a CR; both persisted in one commit. Assert the PLANNED line has new values and
  `in_review == False`, the IN_EXECUTION line is unchanged with a CR + `in_review == True`,
  and `change_request_ids` contains only the IN_EXECUTION CR.
- **Mixed-status rollback:** flag ON, bundle where the IN_EXECUTION line fails validation →
  the entire bundle rolls back, including the PLANNED edit (no half-write).
- Superuser and budget-team+award-approval bypasses behave identically flag ON/OFF
  (`division_director_auth_client` / `budget_team_auth_client` / superuser) — no
  duplicate/conflicting handling.
- Use `@pytest.mark.parametrize` over the three budget fields and over agreement types
  (contract/grant/IAA) for the type-parity AC (parameterized-fixture pattern in TESTING.md).

### Backend — Unit tests (fast, isolated, no DB)
- If the predicate is factored into a pure helper (`is_draft_to_planned` / the changed-
  budget-keys intersection), unit-test it directly: enum equality, partial-load / missing-
  status edge cases. Keeps edge-case coverage at the lowest layer per the decision matrix.

### Backend — BDD / feature test (documented candidate)
`docs/TESTING.md` lists the **change-request approval chain** as a good BDD candidate, and an
`api_version.feature` already exists. Add
`tests/ops/features/skip_change_request_draft_planned.feature` for the stakeholder-facing
behavior:
- Scenario: capability enabled → complete Draft line moves to Planned immediately, no CR.
- Scenario: capability disabled → same change routed for DD review (regression).
- Scenario: Planned→Executing still requires review with the capability enabled.
Reuse shared auth `given`s from `features/conftest.py`; add a `given` that sets the flag.
Keep pure edge/negative cases in the integration/unit tests above (per TESTING.md "when NOT
to use BDD"). Extend the existing `/version` feature for the new `skip_cr_for_draft_planned`
field rather than adding a separate BDD test for a simple field.

### Frontend — Integration tests (RTK Query + MSW) per decision matrix
- `getVersion` endpoint: MSW handler returns `{ version, skip_cr_for_draft_planned }`;
  assert the query wiring / URL (RTK Query integration pattern, `opsAPI.test.js` style).
- Edit-bundle / update mutations already covered; add a case confirming the applied-
  immediately response (no `change_request_ids`) is handled.

### Frontend — Unit/component tests (Vitest + RTL)
- Button reads "Complete Status Change" when flag ON (BOTH `ReviewAgreement.jsx` branches),
  "Send to Approval" when OFF; no flicker before the version query resolves.
- Draft→Planned success copy is the applied-immediately variant when flag ON.
- In-Planned edit flow: with flag ON, the "requires DD approval" pre-submit modal is
  suppressed/reworded and success copy is "Changes Saved", not "sent for approval".
- After an immediate-apply, no "In Review" tag / no locked controls (`TableTag`,
  `ChangeIcons`, `BLIRow`).
- Flicker guard: while the version query is loading, the button shows the safe default
  ("Send to Approval") and does not flip mid-render.

### E2E (Cypress) — minimal, only if justified
Per TESTING.md, reserve E2E for critical journeys and don't duplicate what integration/unit
covers. The label/copy/pending behavior is better covered by the Vitest + backend integration
tests above. If an E2E is added, keep it to ONE happy-path spec: flag ON → complete a
Draft→Planned and assert it lands Planned with no "In Review" tag and no reviewer-queue entry
(`cy.FakeAuth("basic")`). Note the flag must be ON in the E2E stack's backend env for this to
pass — otherwise skip the E2E and rely on the layers below.

### Manual (per issue)
- Lower env flag ON: complete a fully-qualified Draft→Planned, confirm no review step /
  reviewer notification / no pending indicator anywhere (including reviewer queue).
- Flag ON: edit budget details on a Planned line — applies, no pending state.
- Flag ON: incomplete Draft→Planned still blocked with existing messaging.
- Flag OFF: both change types still route through review; reviewers still see/act on them.
- Planned→later status still requires approval regardless of flag.

## Pre-commit
- Backend: `black`, `nox -s lint`, `pytest`.
- Frontend: `bun run format`, `bun run lint --fix`, `bun run test --watch=false`.
- `/sync-openapi` + `validate_openapi.sh` for the `/version` change.

---

## Risks to watch

0. **Financial data loss (Defect A) — highest severity, VERIFIED.** Reusing
   `_apply_direct_edits` with the None-filled `updated_fields` nulls `amount/can_id/date_needed`
   on Draft→Planned. The implementation MUST restrict the write set to explicitly-sent allowed
   fields, with a regression test. This is the single most important thing to get right.
0b. **Over-broad in-Planned predicate (Defect B).** Must intersect changed keys with
   `budget_field_names`, not use `has_non_status_change`.
0c. **Frontend approval UX left stale (Defect D).** The in-Planned edit flow's confirmation
   modal + success copy live outside `ReviewAgreement`; if not updated they tell the user
   review happened when it didn't.

1. **Scope creep on the status predicate.** Gating on `has_status_change` alone would
   wrongly let `Planned→Executing` (and every other transition) skip review. Must gate on
   the exact `DRAFT→PLANNED` pair. (Highest-impact correctness risk.)
2. **Double schema.load / target-status parsing.** The function already parses request
   JSON; re-parsing to read the target status is fragile if partial/unknown handling
   differs. Factor the parsed target status into one local and reuse.
3. **Flag caching.** `/version` caches the *version* at import; the flag must be read live
   from `current_app.config` each request, or a running env that flips the env var (or tests
   that override config) will see a stale value.
4. **Frontend/backend flag drift.** Backend is the enforcement authority; the frontend flag
   is display-only. If the frontend can't reach `/version`, default the label to the safe
   "Send to Approval" so copy never over-promises immediate apply.
5. **"Applies immediately" vs. success copy honesty.** If the frontend shows "Complete
   Status Change" but the backend (flag OFF, or non-qualifying transition) still creates a
   CR, the user is misled. Keying success messaging off the actual 200/202 response (not
   just the flag) closes this gap.
6. **In-Planned edit path also covers other callers.** `update_with_change_request_ids` is
   used by the edit-bundle orchestrator too; confirm the widened `directly_editable` doesn't
   unexpectedly change bundle behavior for Planned lines when the flag is ON.
7. **Env var wiring in Azure.** The deploy workflows push images but don't set app env vars;
   someone must set `SKIP_CR_FOR_DRAFT_PLANNED` on the Container App per environment.
   Without it, the flag is OFF (safe default) but the feature won't turn on.
8. **History/audit expectations.** AC says the change should be visible only via normal
   history. Confirm `_apply_direct_edits` triggers the standard model-history/event so the
   audit trail is still populated (no CR, but the edit itself is recorded).
9. **OBE / non-editable statuses.** Ensure the flag doesn't accidentally allow edits on a
   BLI that `is_bli_editable` would otherwise block; the flag should only widen the CR-vs-direct
   choice for already-editable lines, not override editability gating.
10. **Pre-award flow interaction (resolved #5).** Pre-award budget-line edits route through
    the same seam. Two things to watch: (a) the flag branch must stay AFTER `_validation` so
    `is_pre_award_in_review` / `is_post_pre_award_locked` still block edits in those states;
    (b) the pre-award "pending DD approval" alert and "Send to Approval" gating in
    `RequestPreAwardApproval.jsx` key off `bli.in_review` — with the flag ON these edits
    produce no CR, so that gating won't fire for them. Accepted as intended, but confirm the
    pre-award page has no *other* dependence on those edits having created a CR.

## Resolved decisions (were open questions)

1. **Env var name/mechanism** — plain `SKIP_CR_FOR_DRAFT_PLANNED` via `os.getenv` in
   `default_settings.py` (not `FLASK_`-prefixed). ✅
2. **Button relabel scope** — "Complete Status Change" applies to **Draft→Planned only**;
   Planned→Executing keeps "Send to Approval". ✅
3. **In-Planned edit success copy** — reuse existing "Changes Saved"-style copy; suppress the
   "requires DD approval" pre-submit modal when the flag is ON. ✅
4. **Config channel** — extend `/version` (per user decision), not a new `/config` endpoint. ✅
5. **Pre-award-context edits** — in-Planned edits launched from the pre-award Request page
   apply immediately when the flag is ON (no carve-out), same as any in-Planned edit. Existing
   pre-award edit locks stay intact via `_validation` ordering; the pre-award "pending DD
   approval" gating simply won't trigger for these edits. ✅

## Open questions (for product / UX — do not guess)

1. **Mixed-status submission copy.** When one edit-bundle save touches both a PLANNED line
   (applied immediately) and an IN_EXECUTION line (still creates a CR), what should the
   success message say? Backend behavior is settled (split + atomic); only the user-facing
   copy is open. Options surfaced: a split message ("some applied, some sent for review") vs.
   keeping "Sent to Approval" whenever any CR exists. **Decision deferred to product/UX;
   implement the backend split now, wire the exact copy once decided.**

## Non-blocking assumptions

- Whether the flag value should be exposed in-repo per environment anywhere, or set
  exclusively on the Azure Container App (plan assumes Azure-only, default OFF in code).
