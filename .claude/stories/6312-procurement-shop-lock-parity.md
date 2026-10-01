# OPS-6312 — Procurement Shop dropdown is editable when the backend will always reject the change

## Context

GitHub issue [#6312](https://github.com/HHS/OPRE-OPS/issues/6312) (`bug-medium`, `OPS-support`).

The Procurement Shop dropdown on the agreement edit screens is left **enabled** in situations the
backend will **always reject**. The user picks a shop, saves, and gets only the generic
"An error occurred while saving the agreement." banner — the backend's actual reason is never shown.

Confirmed in production 2026-09-28: `PATCH /api/v1/agreements/{id}` on agreements **522, 525 and 526**
each returned 400 with

```json
{"errors": {"awarding_entity_id": "Cannot change Procurement Shop for an Agreement if any Budget Lines are in Execution or higher."}, "message": "Validation failed"}
```

8 attempts across 3 agreements, no explanation shown. All three have `awarding_entity_id = NULL`,
`is_awarded = false`, and at least one OBLIGATED budget line. Blast radius: **24 contracts** reachable
through the UI (the field only renders for non-grants — `AgreementEditForm.jsx:531` `{!isGrant && (` —
and the edit form's Vest suite rejects Direct Obligation / IAA outright).

### Root cause: the same rule is implemented three times

| # | Location | Conditions covered |
|---|---|---|
| 1 | `ProcurementShopChangeRule.validate` (`backend/ops_api/ops/validation/rules/agreement.py:67-90`) — source of truth, registered at `agreement_validator.py:49` | BLIs ≥ IN_EXECUTION (ordinal index); proc-shop CR in review. **No** superuser exemption. |
| 2 | `AgreementsService._handle_proc_shop_change` (`backend/ops_api/ops/services/agreements.py:623-633`) — defense in depth, unreachable today | BLIs in explicit `{IN_EXECUTION, OBLIGATED, PLANNED_MOD}` set |
| 3 | `isProcurementShopDisabled` (`frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.hooks.js:690-694`) | proc-shop CR in review; `isAgreementAwarded` — **and exempts superusers, which the backend does not** |

Copy #3 never knew about the budget-line-status condition at all. Copy #2 already carries a comment
warning that the ordinal-index form used by copy #1 is fragile, because `PLANNED_MOD` sorts *after*
`OBLIGATED` in the enum declaration order (`backend/models/budget_line_items.py:45-53`).

The parity gaps, precisely:

1. **Budget lines in execution or later — not checked by the frontend at all.** The backend's
   "index ≥ IN_EXECUTION" check blocks IN_EXECUTION, OBLIGATED **and PLANNED_MOD**.
2. **Superusers.** The frontend exempts superusers from both of its conditions (`!isSuperUser && ...`).
   `ProcurementShopChangeRule` has no superuser exemption (unlike `ImmutableAwardedFieldsRule`,
   `rules/awarded.py:25`).
3. **Edit wizard passes no award/BLI props.** `AgreementDetailsEdit.jsx:33-34` and
   `EditAgreementAndBudgetLines.jsx:315-316` pass `isAgreementAwarded` / `areAnyBudgetLinesPlanned`;
   `StepCreateAgreement.jsx:41-47` passes neither, so both default to `false`
   (`AgreementEditForm.jsx:68`) and even the awarded lock is missing there.
4. **"Send to approval" modal that can never succeed.** `shouldRequestChange`
   (`AgreementEditForm.hooks.js:215-220`) shows the approval modal, but `services/agreements.py:422`
   validates *before* the change-request branch at `:458`, so confirming still 400s.

### Intended outcome

One backend-computed signal — `_meta.procurementShopLockedMessage` — consumed by the frontend, so the
dropdown is disabled with an explanatory tooltip in exactly the cases the backend rejects, and the rule
cannot drift again. This is the pattern already used for `_meta.isEditable` / `_meta.lockedMessage` and
the per-budget-line `_meta`.

### Decisions confirmed before planning

1. **Parity only.** Do *not* change `saveAgreement`'s catch block to surface backend field errors —
   that belongs to [#6291](https://github.com/HHS/OPRE-OPS/issues/6291) (still open), where it can be
   done once for every validation rule rather than just this one.
2. **One authoritative message.** `_meta.procurementShopLockedMessage` covers all three cases
   *including* awarded (superuser-exempt), since `_meta` is already computed per `current_user`
   (`resources/agreements.py:462-470`). The frontend keeps zero rule logic.
3. **Service-method home for the UI copy.** The message mapper lives on `AgreementsService` next to
   `_get_locked_message` / `_deletion_blocked_reason` (`services/agreements.py:882-915`), which it
   mirrors exactly. The *reason* lives in `utils/agreements_helpers.py` — see §1 for why.
4. **Wizard: procurement shop only.** Keep `isAgreementAwarded` as a prop; do not derive it inside the
   hook. The wizard gets correct *procurement shop* behavior for free via the backend message. Its
   other unlocked awarded fields stay a known separate bug — see "Out of scope".
5. **Copy:** reuse the two existing frontend strings verbatim; one new string for the budget-line case,
   flagged for copy review in the PR.

---

## Backend

### 1. Shared reason helper — `backend/ops_api/ops/utils/agreements_helpers.py`

The *reason* lives in this module because `rules/agreement.py` already imports from it
(`check_user_association`), so there is no import-cycle risk. `services/agreements.py` →
`validation/agreement_validator.py` → (lazily, inside `_get_default_validators`) `rules/agreement.py`
means `rules/` must **not** import `services/agreements.py` at module level.

```python
class ProcurementShopLockReason(str, Enum):
    BLI_IN_EXECUTION = "bli_in_execution"
    CHANGE_REQUEST_IN_REVIEW = "change_request_in_review"
    AWARDED = "awarded"


def get_procurement_shop_locked_reason(
    agreement: Agreement, user: User
) -> ProcurementShopLockReason | None:
    ...
```

Precedence **must mirror the validator chain order** — `ProcurementShopChangeRule` runs before
`ImmutableAwardedFieldsRule` in `AwardedAgreementValidator` — so an awarded agreement with obligated
BLIs reports the BLI reason, which is the error a superuser actually receives:

1. `BLI_IN_EXECUTION` — any BLI whose status is in an explicit
   `frozenset({IN_EXECUTION, OBLIGATED, PLANNED_MOD})`. Use the **explicit set**, lifted from
   `_handle_proc_shop_change`, not the ordinal-index comparison: behaviorally identical today and no
   longer order-dependent. Keys off BLI status directly, **never** off `is_awarded` — see the note
   below on agreements with obligated BLIs that OPS shows as not awarded.
2. `CHANGE_REQUEST_IN_REVIEW` — `agreement.change_requests_in_review` is truthy and any has
   `has_proc_shop_change`.
3. `AWARDED` — `agreement.is_awarded` **and** `not user.is_superuser` **and**
   `"awarding_entity_id" in agreement.immutable_awarded_fields`. All three conjuncts are required to
   match `ImmutableAwardedFieldsRule` exactly (`rules/awarded.py:22-30`).
   > `get_required_fields_for_awarded_agreement` returns `[]` for Grant, IAA and Direct
   > (`models/agreements.py:775`, `:813`, `:900`), so an awarded Direct/IAA no longer reports locked.
   > That is *correct* parity — the backend wouldn't block it either — and unreachable in practice,
   > since the field is hidden for grants and the Vest suite rejects Direct Obligation / IAA.
4. Otherwise `None`.

**Why BLI status, not `is_awarded`:** outside of OPS, any agreement with an OBLIGATED budget line *is*
awarded. When OPS shows such an agreement as `is_awarded = false` that reflects missing award data
(no NEW_AWARD procurement action), not a real-world state. Business stakeholders are separately
populating that data (follow-up from #6291). Until then — and regardless of award data — the shop must
be locked because of the budget-line statuses themselves. This combination is **not** bad test data.

### 2. Collapse both existing backend copies onto the helper

- **`ProcurementShopChangeRule.validate`** — keep the existing "is `awarding_entity_id` actually
  changing" gate, then branch on the reason. Error strings stay **byte-for-byte identical** so the
  existing API tests pass unmodified. `AWARDED` is deliberately *not* raised here — that is
  `ImmutableAwardedFieldsRule`'s job and it is superuser-exempt. Add a comment saying so.
- **`AgreementsService._handle_proc_shop_change`** — replace the inline `_blocked_statuses` block with
  `if get_procurement_shop_locked_reason(...) is ProcurementShopLockReason.BLI_IN_EXECUTION`. Keep its
  bare-string `ValidationError` (a different shape from the rule's dict — don't "fix" that here).

### 3. UI copy mapper — `AgreementsService`

Alongside `_get_locked_message`, add:

```python
def _get_procurement_shop_locked_message(self, agreement, user) -> str | None:
```

The reason-code ↔ display-string split is the same pattern as `_deletion_blocked_reason` →
`_get_locked_message`, and is what lets the validation rule keep its API error strings while the
tooltip gets friendlier text:

- `BLI_IN_EXECUTION` → **new string, flag for copy review:**
  `"The Procurement Shop cannot be edited because one or more budget lines are in Executing status or beyond."`
- `CHANGE_REQUEST_IN_REVIEW` → existing frontend string verbatim, including the `\n`:
  `"There are pending edits In Review for the Procurement Shop.\n It cannot be edited until pending edits have been approved or declined."`
- `AWARDED` → `"The Procurement Shop cannot be edited on an awarded agreement."`

### 4. Expose in `_meta`

- `MetaSchema` (`backend/ops_api/ops/schemas/agreements.py:34-40`): add
  `procurementShopLockedMessage = fields.Str(allow_none=True, load_default=None, dump_default=None)`
  (camelCase, matching `lockedMessage`).
- `_serialize_agreement_with_meta` (`backend/ops_api/ops/resources/agreements.py:430-471`): add an
  `include_procurement_shop_lock: bool = False` parameter and pass `True` only from
  `AgreementItemAPI.get` (`:79`).

  **Why gated:** the agreements *list* uses the same serializer (`:184`). `budget_line_items`,
  `procurement_actions` and `team_members` are all eagerly loaded for the list
  (`services/agreements.py:1380-1395`), so the BLI and awarded checks are free — but
  `Agreement.change_requests_in_review` is a **property that issues its own SELECT**
  (`models/agreements.py:440-453`) and is *not* a field on `AgreementListResponse`. Computing it
  unconditionally would add one query per row to a hot path. Only the edit screens need the field, and
  all three load the agreement via `useGetAgreementByIdQuery`.
- `backend/openapi.yml`: add `procurementShopLockedMessage` to the `_meta` schema (~line 9738, next to
  `lockedMessage`). Run the `/sync-openapi` skill, then `./backend/validate_openapi.sh`.

---

## Frontend

### 5. `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.hooks.js`

- Destructure the new field alongside the existing `_meta` read at `:159`:
  `_meta: { immutable_awarded_fields: immutableFields = [], procurementShopLockedMessage = null } = {}`.
- Replace `:686-701`:

  ```js
  // The backend owns this rule (AgreementsService._get_procurement_shop_locked_message).
  // Re-deriving it here is what caused #6312 — do not add local conditions.
  const isProcurementShopDisabled = Boolean(procurementShopLockedMessage);
  const disabledMessage = () => procurementShopLockedMessage ?? "Disabled";
  ```

  Delete `hasProcurementShopChangeRequest` (now redundant) and the local `isSuperUser` /
  `isAgreementAwarded` / `agreement.in_review` branches of `disabledMessage`. Both `isSuperUser` and
  `isAgreementAwarded` stay in use elsewhere in the hook — don't remove those bindings. Run the
  `dead-code-after-removal-sweep` skill afterwards.
- `shouldRequestChange` (`:215`) needs **no change**: gap #4 resolves itself, because
  `hasProcurementShopChanged` can no longer become true while the shop is locked.

`AgreementEditForm.jsx` needs no edit — it already passes `isDisabled={isProcurementShopDisabled}` and
`disabledMessage={disabledMessage()}` to `ProcurementShopSelectWithFee` (`:598-611`).

**No new props anywhere.** `_meta` already survives into the editor context (`EditAgreementProvider`
spreads the whole API agreement and deletes only `project` / `product_service_code` / `status`), the
hook already reads `_meta.immutable_awarded_fields` from it, and `cleanAgreementForApi` already strips
`_meta` from the save payload (`frontend/src/helpers/agreement.helpers.js:328`). That is what gives the
edit wizard correct behavior with zero changes to `StepCreateAgreement.jsx`.

### 6. `frontend/src/types/AgreementTypes.d.ts`

Line 11 is already missing `immutable_awarded_fields` despite the hook reading it. Fix both:

```ts
_meta: {
    isEditable: boolean;
    isDeletable?: boolean;
    lockedMessage?: string | null;
    immutable_awarded_fields?: string[];
    procurementShopLockedMessage?: string | null;
};
```

---

## Tests

Per `docs/TESTING.md`: business/permission rules → backend; hook state → hook tests; **no E2E**.

**Backend unit — new `backend/ops_api/tests/ops/agreement/test_procurement_shop_lock.py`** (mirrors the
style of the existing `test_agreement_immutable_awarded_fields.py`):

- `BLI_IN_EXECUTION` for each of IN_EXECUTION / OBLIGATED / **PLANNED_MOD** — including on an agreement
  with **no award procurement action (`is_awarded = false`)**. This is the regression the ticket exists for.
- `CHANGE_REQUEST_IN_REVIEW` when a proc-shop CR is in review; **not** returned for a CR in review
  without `has_proc_shop_change`.
- `AWARDED` for a non-superuser on an awarded contract; `None` for a **superuser** on the same
  agreement; `None` for an awarded Grant (empty `immutable_awarded_fields`).
- Precedence: awarded **and** obligated BLIs → `BLI_IN_EXECUTION`, not `AWARDED`.
- `None` for DRAFT-only and PLANNED-only agreements.
- Copy mapper: each reason maps to its string; `None` → `None`.

**Backend API — existing tests must pass unmodified.** This is the behavior-preservation gate; do not
edit them:

- `test_agreement.py::test_update_agreement_procurement_shop_error_with_bli_in_execution` (~1898)
- `test_agreement_change_requests.py::test_proc_shop_change_still_blocked_for_in_execution_bli` (~301)
- `test_skip_cr_proc_shop.py::test_proc_shop_change_still_blocked_for_in_execution_when_flag_on` (~184)

**Backend serialization — add to `test_agreement.py`:**

- `GET /api/v1/agreements/{id}` → `_meta.procurementShopLockedMessage` populated for an agreement with
  an OBLIGATED BLI; `null` for a DRAFT-only agreement.
- `GET /api/v1/agreements` (list) → the field is `null`, confirming the gate in §4.

**Frontend hook — add a describe block to `AgreementEditForm.hooks.test.js`** (reuse the existing
`makeAgreement` / `useEditAgreementMock` harness; `useSelectorMock` drives `is_superuser`):

- disabled + message shown when `_meta.procurementShopLockedMessage` is set, **with
  `isAgreementAwarded = false`** — the production scenario;
- still disabled with the same message **for a superuser** — the exemption is gone;
- enabled, `disabledMessage()` → `"Disabled"`, when the field is `null`;
- enabled when `_meta` is entirely absent (wizard create flow).

---

## Verification

```bash
# Backend
cd backend/ops_api
pipenv run pytest tests/ops/agreement/test_procurement_shop_lock.py \
                  tests/ops/agreement/test_agreement.py \
                  tests/ops/agreement/test_agreement_change_requests.py \
                  tests/ops/agreement/test_skip_cr_proc_shop.py
pipenv run black --config ./pyproject.toml . && pipenv run nox -s lint
pipenv run pytest                      # full suite before pushing
cd ../.. && ./backend/validate_openapi.sh

# Frontend
cd frontend
bun run format && bun run lint --fix
bun run test --watch=false
```

**End-to-end manual check** (`podman compose up --build`):

1. Pick a seeded CONTRACT with `is_awarded = false`, `awarding_entity_id = NULL` and an OBLIGATED
   budget line — the production shape. If the seed data has none, set a BLI's status to OBLIGATED
   directly in the DB rather than awarding the agreement: the point is that the lock must come from
   BLI status and *not* from `is_awarded`.
2. `GET /api/v1/agreements/{id}` → confirm `_meta.procurementShopLockedMessage` is the budget-line string.
3. Agreement details → **Edit**: dropdown greyed out, tooltip shows that message. Repeat on
   `/agreements/edit/{id}?mode=edit` (the wizard) and on the review/edit page — all three must now
   match, with no new props passed.
4. Log in as a superuser: dropdown still disabled, same message.
5. Open a DRAFT-only agreement: dropdown enabled, change still saves. A PLANNED-line agreement still
   produces the Change Request / approval modal as before.

---

## Out of scope — state explicitly in the PR description

- **Generic save-error banner.** `saveAgreement`'s catch block is untouched; #6291 owns it.
- **The wizard's other awarded-immutable fields.** `StepCreateAgreement` still passes no
  `isAgreementAwarded`, so contract type / PSC / agreement reason / vendor / name remain unlocked there
  on an awarded agreement (`isFieldDisabled` short-circuits on `!isAgreementAwarded`,
  `AgreementEditForm.helpers.js:22-24`). Pre-existing; worth its own ticket.
- **Whether `NULL → value` should count as a "change".** A stakeholder rule question, not a parity bug.
  In the production incident the target shop's fee rate was 0% and every BLI had
  `procurement_shop_fee_id = NULL`, so the fill-in would have changed no dollar amounts. If the rule
  changes, `get_procurement_shop_locked_reason` is the single place to change it and the UI follows.
- **No migration.** All three inputs (`budget_line_items.status`, `change_requests_in_review`,
  `procurement_actions`) already exist.
