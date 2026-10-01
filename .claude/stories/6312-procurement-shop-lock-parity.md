# OPS-6312 — Procurement Shop dropdown is editable when the backend will always reject the change

> Revised after three sub-agent reviews (backend internals / frontend internals / adversarial). Every
> claim below was spot-checked against the code. Findings that reversed a design decision are marked
> **[rev]**.

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
through the UI.

### Root cause: the same rule is implemented four times

| # | Location | Conditions covered |
|---|---|---|
| 1 | `ProcurementShopChangeRule.validate` (`backend/ops_api/ops/validation/rules/agreement.py:67-90`) — source of truth, registered at `agreement_validator.py:49` | BLIs ≥ IN_EXECUTION (ordinal index); proc-shop CR in review. **No** superuser exemption. |
| 2 | `AgreementsService._handle_proc_shop_change` (`backend/ops_api/ops/services/agreements.py:623-633`) — defense in depth, unreachable today | BLIs in explicit `{IN_EXECUTION, OBLIGATED, PLANNED_MOD}` set |
| 3 | `isProcurementShopDisabled` (`frontend/.../AgreementEditForm.hooks.js:690-694`) | proc-shop CR in review; `isAgreementAwarded` — **and exempts superusers, which the backend does not** |
| 4 | `AWARDED_DISABLED_FIELDS[AgreementFields.ProcurementShop] → "awarding_entity_id"` (`frontend/.../AgreementEditForm.helpers.js:8`) | **Dead** — no call site ever passes `AgreementFields.ProcurementShop` to `isFieldDisabled` (only the map entry and its unit test at `AgreementEditForm.helpers.test.js:227-228`) |

Copy #3 never knew about the budget-line-status condition at all. Copy #2 already carries a comment
warning that the ordinal-index form used by copy #1 is fragile, because `PLANNED_MOD` sorts *after*
`OBLIGATED` in the enum declaration order (`backend/models/budget_line_items.py:44-48`). Copy #4 is a
latent superuser-exempt duplicate that would silently contradict the backend if anyone wired it up.

The parity gaps, precisely:

1. **Budget lines in execution or later — not checked by the frontend at all.** The backend blocks
   IN_EXECUTION, OBLIGATED **and PLANNED_MOD**.
2. **Superusers.** The frontend exempts superusers from both of its conditions; the backend rule has no
   superuser exemption (unlike `ImmutableAwardedFieldsRule`, `rules/awarded.py:25`).
3. **Edit wizard passes no award/BLI props.** `StepCreateAgreement.jsx` passes neither
   `isAgreementAwarded` nor `areAnyBudgetLinesPlanned`, so both default to `false`
   (`AgreementEditForm.jsx:68-69`).
4. **"Send to approval" modal that can never succeed.** `shouldRequestChange`
   (`AgreementEditForm.hooks.js:215-220`) shows the approval modal, but `services/agreements.py:425`
   validates *before* the change-request branch at `:462-463`, so confirming still 400s.

### Intended outcome

One backend-computed signal — `_meta.procurementShopLockedMessage` — consumed by the frontend, so the
dropdown is disabled with an explanatory tooltip in exactly the cases the backend rejects, and the rule
cannot drift again. Same pattern as `_meta.isEditable` / `_meta.lockedMessage`.

### Decisions confirmed with the requester

1. **Parity only.** Do *not* change `saveAgreement`'s catch block to surface backend field errors —
   that belongs to [#6291](https://github.com/HHS/OPRE-OPS/issues/6291), where it can be done once for
   every validation rule.
2. **One authoritative message** covering all three cases including awarded (superuser-exempt), since
   `_meta` is already computed per `current_user`. The frontend keeps zero rule logic.
3. **Reason in `utils/agreements_helpers.py`, UI copy on `AgreementsService`** — see §1.
4. **Wizard: procurement shop only.** Keep `isAgreementAwarded` as a prop; don't derive it in the hook.
5. **Copy:** reuse the existing in-review and awarded strings; one new string for the budget-line case.
6. **[rev] Awarded Direct Obligation / IAA must stay locked.** The AWARDED reason is
   `is_awarded and not user.is_superuser` — **without** an `immutable_awarded_fields` conjunct. See §1.

---

## Backend

### 1. Shared helpers — `backend/ops_api/ops/utils/agreements_helpers.py`

**[rev] Two functions, not one.** `_handle_proc_shop_change(self, agreement, new_value, commit=True)`
has **no user** (`services/agreements.py:619`), and two existing tests call it directly with a bare
transient `Agreement()` and no JWT context or `get_current_user` patch
(`tests/ops/services/test_agreements.py:69-86`). A user-aware helper there would raise `RuntimeError`.
So split it:

```python
# User-free predicate — safe to call from _handle_proc_shop_change.
def has_proc_shop_blocking_bli(agreement: Agreement) -> bool: ...


class ProcurementShopLockReason(str, Enum):
    BLI_IN_EXECUTION = "bli_in_execution"
    CHANGE_REQUEST_IN_REVIEW = "change_request_in_review"
    AWARDED = "awarded"


def get_procurement_shop_locked_reason(
    agreement: Agreement, user: User
) -> ProcurementShopLockReason | None: ...
```

**Why this module:** `rules/agreement.py` already imports from it (`check_user_association`, `:9`), and
it already imports `User` from `models` (`:8`), so no new import edge. It must **not** live on
`AgreementsService`, because `services/agreements.py:57` imports `rules.agreement` **eagerly**
(`from ops_api.ops.validation.rules.agreement import ServiceRequirementTypeRule`) — that direct
module-level edge, *not* the lazy import inside `_get_default_validators`, is what forbids `rules/`
importing `services/agreements.py`.

Precedence **must mirror the validator chain order** — `ProcurementShopChangeRule` is 4th in the base
chain (`agreement_validator.py:45-52`) and `AwardedAgreementValidator` appends
`ImmutableAwardedFieldsRule` after it (`awarded_agreement_validator.py:26-33`) — so an awarded
agreement with obligated BLIs reports the BLI reason, which is the error a superuser actually gets:

1. `BLI_IN_EXECUTION` — `has_proc_shop_blocking_bli(agreement)`: any BLI whose status is in an explicit
   `frozenset({IN_EXECUTION, OBLIGATED, PLANNED_MOD})`. Use the **explicit set**, lifted from
   `_handle_proc_shop_change`, not the ordinal-index comparison. Keys off BLI status directly, **never**
   off `is_awarded`.
   > **[rev] This is not behaviorally identical today.** `status` is nullable
   > (`models/budget_line_items.py:109`). The current rule's `list(...).index(bli.status)` raises
   > `ValueError` → unhandled 500 for a NULL-status BLI; the frozenset evaluates `None in {...}` →
   > `False` → allowed. The two existing copies already disagree here. The refactor adopts the
   > frozenset behavior (an improvement). State it in the PR and cover it with a test.
2. `CHANGE_REQUEST_IN_REVIEW` — any `has_proc_shop_change` among the in-review CRs.
   **Bind to a local first:** `change_requests_in_review` is a `@property` that runs a fresh SELECT on
   every access and returns `None` (not `[]`) when empty (`models/agreements.py:439-453`). The current
   rule accesses it twice in one expression = 2 queries; don't copy that shape.
3. `AWARDED` — `agreement.is_awarded and not user.is_superuser`.
   > **[rev] Deliberately *more* conservative than `ImmutableAwardedFieldsRule`.** Adding
   > `"awarding_entity_id" in agreement.immutable_awarded_fields` would match the backend exactly, but
   > that list is `[]` for Direct Obligation and IAA (`models/agreements.py:813`, `:900`), so an awarded
   > Direct/IAA would go from locked today to **editable and savable**. The earlier justification
   > ("the Vest suite rejects those types") is **false**: the suite only emits a message on the
   > `agreement_type` field (`AgreementEditFormSuite.js:14-21`), and in non-review edit mode the suite
   > is scoped via `only(fieldName)` (`hooks.js:222-226`) with only `project_id` /
   > `service_requirement_type` force-run, so `res.hasErrors()` is false and Save is enabled. Omitting
   > the conjunct keeps today's lock. Locking more than the backend rejects is the safe direction — a
   > disabled field can never produce an unsavable state — at the cost of one documented exemption in
   > the equivalence test. Awarded **AA** is unaffected either way: it *does* include
   > `awarding_entity_id` (`models/agreements.py:862-878`).
4. Otherwise `None`.

**Why BLI status, not `is_awarded`:** outside of OPS, any agreement with an OBLIGATED budget line *is*
awarded. When OPS shows `is_awarded = false` that reflects missing award data (no NEW_AWARD procurement
action), not a real-world state. Stakeholders are populating that data separately (follow-up
from #6291). Until then — and regardless of award data — the shop must be locked by budget-line status.
This combination is **not** bad test data.

### 2. Collapse the existing copies onto the helpers

- **`ProcurementShopChangeRule.validate`** — keep the "is `awarding_entity_id` actually changing" gate,
  then branch on the reason. Error strings stay **byte-for-byte identical**. `AWARDED` is deliberately
  *not* raised here — that is `ImmutableAwardedFieldsRule`'s job and it is superuser-exempt. Comment it.
- **`AgreementsService._handle_proc_shop_change`** — replace the inline `_blocked_statuses` block with
  `if has_proc_shop_blocking_bli(agreement):`. **No user, no test churn.** Keep its bare-string
  `ValidationError` (a different shape from the rule's dict — don't "fix" that here).
- **Frontend copy #4** — delete the `AgreementFields.ProcurementShop` entry from
  `AWARDED_DISABLED_FIELDS` and its assertion in `AgreementEditForm.helpers.test.js:227-228`. It is
  dead and would contradict the backend if wired up. Decide this explicitly rather than leaving it to
  the `dead-code-after-removal-sweep` skill.

### 3. UI copy mapper — `AgreementsService`

Alongside `_get_locked_message` (`services/agreements.py:883-916`), add
`_get_procurement_shop_locked_message(self, agreement, user) -> str | None`. The reason-code ↔
display-string split mirrors `_deletion_blocked_reason` → `_get_locked_message`, and is what lets the
validation rule keep its API error strings while the tooltip gets friendlier text:

- `BLI_IN_EXECUTION` → **[rev] new string:**
  `"The Procurement Shop cannot be edited because this agreement has budget lines in Executing, Obligated or Planned Mod status."`
  Uses the product's own status labels (`frontend/src/helpers/utils.js:127-134` →
  `Executing` / `Obligated` / `Planned Mod`) and matches established copy like "budget lines in
  Executing Status" (`ReviewExecutingTotalAccordion.jsx:16`, `BLIReviewRow.jsx:111`). The earlier
  draft said "Executing status or beyond", which asks the user to apply an ordering that appears
  nowhere in the UI and reads as wrong for Planned Mod. Still flag for copy review.
- `CHANGE_REQUEST_IN_REVIEW` → existing string verbatim, including the `\n`:
  `"There are pending edits In Review for the Procurement Shop.\n It cannot be edited until pending edits have been approved or declined."`
- `AWARDED` → `"The Procurement Shop cannot be edited on an awarded agreement."`

### 4. Expose in `_meta`

- **[rev] Do not add the field to the shared `MetaSchema`.** `services/budget_line_items.py:31` imports
  the *agreements* `MetaSchema` and dumps it in `get_is_editable_meta_data` (`:1366`, `:1403`), which is
  reached from `GET /budget-line-items/{id}` and from `_serialize_agreement_with_meta` itself. Because
  that call site sets only `isEditable`/`isDeletable`/`lockedMessage`, `dump_default=None` fields leak —
  `immutable_awarded_fields: null` already appears in every budget-line `_meta` today. Instead add
  `class AgreementMetaSchema(MetaSchema)` in `schemas/agreements.py` carrying
  `procurementShopLockedMessage = fields.Str(allow_none=True, load_default=None, dump_default=None)`,
  and use it at `resources/agreements.py:462` and in `AgreementResponse._meta` / `AgreementListResponse._meta`
  (`schemas/agreements.py:241`, `:270`). Leave `MetaSchema` untouched for budget line items.
  (`resources/budget_line_items.py` and `resources/projects.py` import their *own* `MetaSchema` — not
  affected.)
- `_serialize_agreement_with_meta` (`resources/agreements.py:430-471`): add
  `include_procurement_shop_lock: bool = False` and pass `True` only from `AgreementItemAPI.get` (`:79`).

  **Why gated:** the agreements *list* uses the same serializer (`:184`). `budget_line_items` and
  `procurement_actions` are eagerly loaded there (`services/agreements.py:1381-1390`) and
  `immutable_awarded_fields` is a static list, so those checks are free — but
  `change_requests_in_review` issues its own SELECT per access and is **absent** from
  `AgreementListResponse` (`schemas/agreements.py:244-270`). Computing it unconditionally would add a
  query per row to a hot path. Only the edit screens need it, and all three load via
  `useGetAgreementByIdQuery`.
- `backend/openapi.yml`: add the property to the `_meta` schema (`:9723`, `lockedMessage` at `:9738` —
  one block; the other four `_meta` blocks are `BudgetLineItemMeta` at `:9510` and two inline project
  objects, and must not be touched). Add a `description` stating it is populated only on
  `GET /agreements/{id}` and is always `null` in list responses. Also add a bullet to the PATCH/PUT
  `400` descriptions (`:473-478`, `:540-545`), which currently don't mention the procurement-shop rule
  at all. Run `/sync-openapi`, then `./backend/validate_openapi.sh`.

---

## Frontend

### 5. `AgreementEditForm.hooks.js`

- Destructure alongside the existing `_meta` read at `:159`:
  `_meta: { immutable_awarded_fields: immutableFields = [], procurementShopLockedMessage = null } = {}`.
  (Guards `undefined` only; `_meta: null` would throw — don't write test fixtures with `null`.)
- **[rev] Replace `:690-702`** (not `:686-701` — that range cuts into
  `handleOnChangeSelectedProcurementShop` and leaves a dangling `};`):

  ```js
  // The backend owns this rule (AgreementsService._get_procurement_shop_locked_message).
  // Re-deriving it here is what caused #6312 — do not add local conditions.
  const isProcurementShopDisabled = Boolean(procurementShopLockedMessage);
  const disabledMessage = () => procurementShopLockedMessage ?? "Disabled";
  ```

  Delete `hasProcurementShopChangeRequest` and the `isSuperUser` / `isAgreementAwarded` /
  `agreement.in_review` branches of `disabledMessage`. Both `isSuperUser` (`:70`, `:208`, `:813`) and
  `isAgreementAwarded` (`:218`) stay in use elsewhere — don't remove those bindings.

  > **[rev] Removing the `in_review` branch is a latent-bug fix, not a no-op.** `Agreement.in_review`
  > is true for *any* in-review CR including BLI change requests (`models/agreements.py:455-457`,
  > `change_requests.py:97`), while the disable gate checked `hasProcurementShopChangeRequest`. So today
  > an awarded agreement with an unrelated BLI CR in review shows "There are pending edits In Review for
  > the **Procurement Shop**" — the wrong reason. After this change it correctly shows the awarded
  > message. Call it out so QA doesn't log it as a regression.

- **[rev] `shouldRequestChange` DOES need a change** — add `&& !procurementShopLockedMessage`.
  The earlier claim that gap #4 self-resolves is wrong for the ticket's own production shape:
  `useHasStateChanged(null)` returns **true at mount** — `{...null}` is `{}`, so it compares `"{}"`
  against `"null"` (`hooks/useHasStateChanged.hooks.js:16-21`). Agreements 522/525/526 have
  `awarding_entity_id = NULL` → `procurement_shop: null` → `hasProcurementShopChanged` is true with
  zero user interaction, independent of the disabled dropdown. With a PLANNED BLI that still opens the
  "Send to Approval" modal and can fire a garbled
  `buildProcurementShopChangeAlert` ("undefined (undefined) to undefined (undefined)").
  (Fixing the null baseline in `useHasStateChanged` would be the deeper fix, but it is used by other
  callers — out of scope here.)

`AgreementEditForm.jsx` needs no edit — it already passes `isDisabled={isProcurementShopDisabled}` and
`disabledMessage={disabledMessage()}` (`:598-611`).

**No new props anywhere.** Verified: `_meta` survives into the editor context on all three entry points
(`EditAgreementProvider` spreads the whole agreement and deletes only `project` /
`product_service_code` / `status`, `AgreementEditorContext.jsx:69-89`); no reducer action replaces
`state.agreement` wholesale (`RESET_TO_INITIAL_STATE` would, but has zero call sites); and the create
flow falls through to `defaultState`, whose agreement has no `_meta`, so the destructuring default
applies without throwing.

### 6. [rev] `AgreementEditFormSuite.js` — prevent a new deadlock on the review page

`procurement-shop-select` is a **required** test for every non-grant (`:68-72`), and in review mode the
hook runs the **whole** suite unscoped (`hooks.js:238-245`). `res.hasErrors()` feeds `shouldDisableBtn`
(`:337-343`) → `onValidityChange(false)` → **Save Changes disabled**
(`EditAgreementAndBudgetLines.jsx:69`, `:358`, `:396`).

So on `/agreements/review/:id/edit` for an agreement with `awarding_entity_id = NULL` **and** a locking
BLI — the production shape again — the user would see "This is required information" under a greyed-out
dropdown with **no way to clear it**, blocking every other edit on the page. Today the dropdown is
enabled, so they can at least clear it (and then hit the 400).

Fix: pass a `procurementShopLocked` flag into the suite data (the same way `isNewAgreement` already is,
`hooks.js:226`, `:241`) and skip the required test when set. Add a suite test for it. Not applicable to
the details-edit page (`isReviewMode=false` → only touched fields validate).

### 7. `frontend/src/types/AgreementTypes.d.ts`

Line 11's `_meta` is already missing `immutable_awarded_fields` despite the hook reading it. Add both:

```ts
_meta: {
    isEditable: boolean;
    isDeletable?: boolean;
    lockedMessage?: string | null;
    immutable_awarded_fields?: string[];
    procurementShopLockedMessage?: string | null;
};
```

**[rev] This is editor-only documentation.** The repo has no typecheck: no `tsc` / `check-types` script,
`typescript` isn't a dependency, no `tsconfig.json`, and no CI workflow runs one. `jsconfig.json` sets
`checkJs: true` for editor diagnostics only. Don't expect a green typecheck as evidence.

---

## Tests

Per `docs/TESTING.md`: permission/business rules → backend unit (`:299`), and E2E's "When NOT to Use"
explicitly lists permission checks (`:285`). So **no new E2E** — but existing E2E must be maintained
(see "Existing Tests to Update").

### Regression Prevention — the actual gate

**[rev] Add one parametrized API-level test.** None of the per-layer tests below asserts the
*equivalence* that is the point of this ticket, and the `AWARDED` branch is still a hand-written
restatement of a rule that lives elsewhere. For each fixture shape × user role — draft-only,
planned-only, in-execution, obligated, planned-mod, NULL-status BLI, proc-shop-CR-in-review,
awarded-contract, awarded-contract-as-superuser, awarded-AA:

> `GET /agreements/{id}` → read `_meta.procurementShopLockedMessage`; then
> `PATCH {"awarding_entity_id": <different id>}`; assert
> `(message is None) == (status in (200, 202))`.

This catches drift in either helper, in either validation rule, in the precedence order, and in the
serializer gate. It is the test that would have caught #6312.

**One documented exemption:** awarded Direct Obligation / IAA with only Draft/Planned BLIs. Per
decision 6 the message is non-null while the backend accepts the PATCH — deliberately conservative.
Assert that shape explicitly with a comment pointing at §1, so it reads as intended, not as a bug.

### Behavior preservation — must be established *first*

**[rev] The existing tests are NOT a gate as written.** `grep "Cannot change Procurement Shop"` over the
backend hits only the two production files — zero tests. The three tests below assert `400` /
bare `pytest.raises` and never inspect the message:

- `test_agreement.py::test_update_agreement_procurement_shop_error_with_bli_in_execution` (`:1921-1922`)
- `test_agreement_change_requests.py::test_proc_shop_change_still_blocked_for_in_execution_bli` (`:318-323`)
- `test_skip_cr_proc_shop.py::test_proc_shop_change_still_blocked_for_in_execution_when_flag_on` (`:204-209`)

**Before refactoring**, add assertions on `response.json["errors"]["awarding_entity_id"]` (and on the
`ValidationError` payload for the two service-level ones), including the dict-vs-bare-string shape
difference between `rules/agreement.py:77-81` and `services/agreements.py:631-633`. Otherwise
"byte-for-byte identical" is unenforced.

### Existing Tests to Update

- **`frontend/cypress/e2e/agreementDetailsEdit.cy.js:427` and `:474`** — both assert
  `cy.get("#procurement-shop-select").should("not.be.disabled")` for `power-user` on awarded agreements
  10 and 12. Verified: `power-user` holds role 7 = `SUPER_USER` (`user_data.json5:718`, `:361`;
  `models/users.py:142-143`), and both agreements have OBLIGATED BLIs (10 also IN_EXECUTION). Since the
  BLI reason has no superuser exemption, both must flip to `should("be.disabled")`, with a comment
  citing #6312. Leave the surrounding field assertions alone — the awarded-immutable superuser
  exemption is unchanged. The companion `should("be.disabled")` assertions at `:411` and `:440`
  (non-superuser) still pass, but the *reason* for the lock changes from AWARDED to BLI.
- `AgreementEditForm.helpers.test.js:227-228` — drop with the dead `AWARDED_DISABLED_FIELDS` entry (§2).

### New Tests Added

**Backend unit — new `tests/ops/agreement/test_procurement_shop_lock.py`** (style of
`test_agreement_immutable_awarded_fields.py`):

- `BLI_IN_EXECUTION` for IN_EXECUTION / OBLIGATED / **PLANNED_MOD** — including on an agreement with
  **no award procurement action (`is_awarded = false`)**. The regression this ticket exists for.
- **NULL-status BLI → `None`** (documents the 500-to-allowed change, §1).
- `CHANGE_REQUEST_IN_REVIEW` when a proc-shop CR is in review; **not** for a CR without
  `has_proc_shop_change`.
- `AWARDED` for a non-superuser on an awarded contract; `None` for a **superuser** on the same
  agreement; `AWARDED` for an awarded Direct Obligation / IAA (decision 6 — the deliberate divergence).
- Precedence: awarded **and** obligated → `BLI_IN_EXECUTION`, not `AWARDED`.
- `None` for DRAFT-only and PLANNED-only.
- `has_proc_shop_blocking_bli` callable with **no user and a transient `Agreement()`** (guards the
  `_handle_proc_shop_change` call site).
- Copy mapper: each reason maps to its **exact string** (not merely "populated" — a copy change must
  not silently drop the tooltip); `None` → `None`.

**Backend serialization — `test_agreement.py`:** `GET /agreements/{id}` populates the field with the
exact string for an OBLIGATED agreement, `null` for DRAFT-only; `GET /agreements` (list) omits it or
returns `null`, confirming the gate.

**Frontend hook — new describe block in `AgreementEditForm.hooks.test.js`** (the existing
`makeAgreement` / `useEditAgreementMock` harness works as-is; `makeAgreement` produces no `_meta`, and
both `isProcurementShopDisabled` and `disabledMessage` are already on the hook's return at `:830-831`,
so nothing new needs exposing. New `beforeEach` must set `useLocationMock` / `hasStateChangedMock` /
`useGetVersionQueryMock` like the existing blocks):

- disabled + message when the field is set, **with `isAgreementAwarded = false`** — the production shape;
- still disabled with the same message **for a superuser** — the exemption is gone;
- enabled, `disabledMessage()` → `"Disabled"`, when `null`; enabled when `_meta` is absent (create flow);
- `disabledMessage()` no longer depends on `agreement.in_review` (§5 latent-bug fix);
- **`shouldRequestChange` is false when locked even though `procurement_shop` was `null` at mount** —
  guards the §5 fix; this test fails without the `&& !procurementShopLockedMessage` conjunct.

**Vest suite — `AgreementEditFormSuite.test.js`:** `procurement-shop-select` required test is skipped
when `procurementShopLocked` is set (§6).

### Why It Wasn't Caught

The rule had no single owner: four independent implementations, no test asserting any of their error
strings, no test comparing the UI's lock state against the API's acceptance, and two Cypress tests that
actively *encoded* the bug by asserting a superuser sees an enabled dropdown they could never save
through.

---

## Verification

```bash
# Backend
cd backend/ops_api
pipenv run pytest tests/ops/agreement/test_procurement_shop_lock.py \
                  tests/ops/agreement/test_agreement.py \
                  tests/ops/agreement/test_agreement_change_requests.py \
                  tests/ops/agreement/test_skip_cr_proc_shop.py \
                  tests/ops/services/test_agreements.py
pipenv run black --config ./pyproject.toml . && pipenv run nox -s lint
pipenv run pytest                      # full suite before pushing
cd ../.. && ./backend/validate_openapi.sh

# Frontend
cd frontend
bun run format && bun run lint --fix
bun run test --watch=false
bunx cypress run --spec cypress/e2e/agreementDetailsEdit.cy.js
```

**End-to-end manual check** (`podman compose up --build`):

1. Pick a seeded CONTRACT with `is_awarded = false`, `awarding_entity_id = NULL` and an OBLIGATED
   budget line. If the seed data has none, set a BLI's status to OBLIGATED directly in the DB rather
   than awarding the agreement — the lock must come from BLI status, *not* `is_awarded`.
2. `GET /api/v1/agreements/{id}` → confirm `_meta.procurementShopLockedMessage` is the budget-line
   string. (`PUT`/`PATCH` return only `{"message", "id"}`, so the locked state refreshes on refetch —
   confirm the RTK Query `Agreement` tag is invalidated after a save.)
3. Agreement details → **Edit**: dropdown greyed out. Repeat on `/agreements/edit/{id}?mode=edit` and on
   the review/edit page — all three must match, with no new props passed. On the review page confirm
   **Save Changes is still enabled** (§6) and no "This is required information" appears under the
   dropdown.
   > The tooltip may not open on hover: the select is disabled via an ancestor `<fieldset disabled>`
   > and browsers suppress mouse events on disabled controls. This is the repo-wide pattern, not a
   > regression — verify the `title`/tooltip content in the DOM rather than by hovering.
4. Log in as a superuser: dropdown still disabled, same message.
5. DRAFT-only agreement: dropdown enabled, change still saves. On a **PLANNED**-line agreement confirm
   the Change Request / approval modal still appears — **on the details-edit or review page, not the
   wizard** (the wizard passes no `areAnyBudgetLinesPlanned`, so `shouldRequestChange` is always false
   there; pre-existing).

---

## Out of scope — state explicitly in the PR description

- **Generic save-error banner.** Untouched; #6291 owns it. **[rev]** Don't claim it's now unreachable:
  `_meta` is a snapshot, so a time-of-check/time-of-use race remains — open Edit while BLIs are
  PLANNED, someone obligates a line before Save, the cached `_meta` still says unlocked, and the PATCH
  400s behind the generic banner. No other reachable path: `cleanAgreementForApi` preserves the
  unchanged `awarding_entity_id`, so the rule's change-gate suppresses the error on unrelated edits.
- **[rev] `_apply_agreement_changes` bypasses the rule entirely.**
  `services/change_requests.py:443` → `update_agreement()` writes `awarding_entity_id` with no
  validator, so an approved proc-shop CR applies even if a BLI has since moved to OBLIGATED.
  Pre-existing, but name it — it is the one remaining unguarded write path, and it qualifies the claim
  that "the rule cannot drift again."
- **The wizard's other awarded-immutable fields.** `StepCreateAgreement` still passes no
  `isAgreementAwarded`, so contract type / PSC / agreement reason / vendor / name remain unlocked there
  on an awarded agreement. Gated independently by `isFieldDisabled` and untouched by this change.
- **`useHasStateChanged(null)` returning true at mount.** Worked around in §5 rather than fixed, since
  the hook has other callers.
- **Whether `NULL → value` should count as a "change".** A stakeholder question. In the production
  incident the target shop's fee was 0% and every BLI had `procurement_shop_fee_id = NULL`, so the
  fill-in would have changed no dollar amounts. If the rule changes,
  `get_procurement_shop_locked_reason` is the single place to change it.
- **Direct Obligation / IAA backend immutability gap.** Those types' awarded-immutable field lists are
  empty, so the backend *would* accept a proc-shop change on an awarded one. §1 locks the UI anyway;
  whether the backend should reject it is a separate ticket.
- **No migration.** No model or column change, so no `*_history` table either.
