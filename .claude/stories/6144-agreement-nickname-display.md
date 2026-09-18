# Issue #6144 — Show agreement nickname instead of full name

**Status:** Ready for developer review (revised after 3-reviewer adversarial pass — see below)
**Issue:** [HHS/OPRE-OPS#6144](https://github.com/HHS/OPRE-OPS/issues/6144)
**Suggested branch:** `OPS-6144/agreement-nickname-display`

> **Revision note:** this plan was independently reviewed by three adversarial passes (technical correctness, requirements coverage, risk/regressions) against the live codebase. Fixes folded in: trap 4 (string-keyed dedupe collisions in F2/B10, now keyed by `id`), a corrected fixture citation, a corrected/removed open question (AA nicknames are in fact editable), added negative-case unit tests for the details page and meta-accordion, a whitespace-parametrization fix for the SQL/Python guardrail test, and clarifying notes on B2/B3's actual (non-)role in AC 3, `ProcurementAction.display_name`'s exception to the "single chokepoint" claim, two more schemas that silently inherit the change, the `AgreementSelect` native-`<select>` limitation, and the feature-flag DoD item. Everything else in the three reviews checked out against the real code and needed no change.

---

## Context

OPS users refer to agreements by a short nickname/acronym, but the UI shows the full agreement title everywhere. Today `nick_name` exists on the model, is editable, and is unique — but it is only ever rendered as its own labeled field on the agreement details page. Everywhere else (tables, dropdowns, filters, notifications, exports) shows the long title.

This story makes the nickname the primary display string in read-only contexts, while keeping the full title on the agreement's own details page and in the agreements-list export.

The change is mostly a *display* change. No new columns, no new permissions, no migration. The nickname is already editable after award (it is in no awarded-lock list on either side), so AC 6/7/8 are satisfied by construction and need regression tests rather than new code.

### Decisions made during planning

| # | Decision | Rationale |
|---|---|---|
| 1 | Redefine `Agreement.display_name` to prefer the nickname, and add a documented `full_name` alias for `name` | `display_name` is the single chokepoint that fixes 3 notification messages, all response schemas, and both frontend name helpers at once. The `full_name` alias + docstrings remove the ambiguity for future call sites. |
| 2 | Filter dropdown shows the nickname alone; a widened matcher also searches the hidden full name | Satisfies "nickname displays instead of the full name" in filters *and* "find by typing either". |
| 3 | Nickname preference is **type-agnostic** — not gated on `isFieldVisible(AgreementFields.NickName)` | Keeps the rule in one place (backend). Gating would require duplicating the agreement-type list server-side and let the two drift. |
| 4 | The 8 review/approval page sub-titles change, but in a **separate, revertable commit pending UX sign-off** | The AC's only stated exception is the details page, but these are headings rather than list rows. |

### Why the details page is safe by construction

The three surfaces the issue explicitly protects all read raw `agreement.name`, never `display_name`:

- `pages/agreements/details/Agreement.jsx:232` (`breadCrumbName`) and `:302` (`<h1>`)
- `components/Agreements/AgreementMetaAccordion/AgreementMetaAccordion.jsx:73-74` (side-by-side Name / Nickname)
- `pages/agreements/details/AgreementDetailsView.jsx:87-98` (nickname `Tag`)

Every other agreement-page breadcrumb is a static string. Redefining `display_name` cannot reach any of them.

---

## Four traps to know before you start

**1. The BLI filter round trip will silently return zero rows.** *(verified)*
`services/budget_line_items.py:1157-1163` emits BLI filter options as `{"id", "name": agreement.display_name}`. The frontend posts that string straight back as `agreement_name=`, and `_apply_agreement_name_filter` (`:468-471`) matches it against `Agreement.name`. The moment `display_name` becomes the nickname, **the BLI agreement filter returns nothing for every nicknamed agreement** — no error, no failing test. Steps **B1, B6, B7, F5 must land in the same commit.**

**2. Do NOT add `nick_name` to the *exact-match* branch of the `name` filter.** *(verified)*
`AgreementEditForm.hooks.js:272-276` implements agreement-title uniqueness as `GET /agreements?name=<typed>&agreement_type=<type>&limit=1`, with `exact_match` defaulting to `True`. If that branch ORs `nick_name`, typing a title that happens to equal a *different* agreement's nickname returns `count >= 1` → spurious "title must be unique" → blocked save. Add `nick_name` to the `ilike` (partial) branch only, and leave a comment on the exact branch saying why. **Note:** verified that `exact_match=false` is never actually sent by any current frontend caller, so this branch is inert from the product's perspective today — see the callout on B2/B3 below. The fix still belongs in the plan as hardening against the next caller that does flip it.

**3. Inserting an export column shifts `currencyColumns`.** `AgreementsList.jsx:303` hard-codes `[4,5,8,9,10]`. Forget to shift it and the export silently loses currency formatting.

**4. String-keyed dedupe lets one agreement silently disappear from a picker.** *(found in adversarial review — not covered by trap 1–3 or by B13)*
`AgreementNameComboBox.jsx:61-72`'s derived-fetch path dedupes options with `new Map()` keyed by the **rendered display string**, and `services/projects.py:729-737` (B10's target) keys its options dict the same way. Neither `nick_name` (`unique=True` column constraint) nor `name` (`func.lower(name)` index) is checked against *the other field on a different agreement* — so agreement A's nickname can collide with agreement B's full name (or vice versa), and whichever loses the Map/dict key silently vanishes from the dropdown. No error, no test. This is a distinct bug from B13's nickname-uniqueness gaps (which are about two nicknames colliding with each other). **Fix: key F2's and B10's dedupe structures by agreement `id`, not by the display string.** See F2 and B10 below — both must be built this way from the start, not patched later.

---

## Phase 1 — Backend

### B1. The chokepoint (`backend/models/agreements.py:264-266`)

```python
@BaseModel.display_name.getter
def display_name(self):
    """Nickname-preferred label for READ-ONLY references (tables, dropdowns,
    filters, notifications). Do NOT use for the agreement's own page heading
    or breadcrumb — use `name` / `full_name` there. Ref: issue #6144."""
    return (self.nick_name or "").strip() or self.name

@property
def full_name(self):
    """The agreement's full title, never the nickname."""
    return self.name

@classmethod
def display_name_expression(cls):
    """SQL analogue of `display_name`, for ORDER BY / WHERE."""
    return func.coalesce(func.nullif(func.trim(cls.nick_name), ""), cls.name)
```

- The `.strip()` handles blank-vs-null: `None`, `""`, and `"   "` all fall back to `name`; `"  HS  "` renders as `"HS"`. The `@pre_load normalize_nick_name` (`schemas/agreements.py:77-81`) already blanks-to-`None` on writes, but the model must be defensive because `data_tools/src/load_aas/utils.py:264` copies `nick_name` directly, bypassing the schema.
- `func` is already imported in this file (used by `ix_agreement_name_type_lower` at `:392`).
- **Do not make `display_name` a `hybrid_property`.** `models/base.py:189-198` defines it as a plain property *with a deliberate no-op setter* that marshmallow binding relies on, and `to_dict()` (`base.py:145`) reads the instance value. The classmethod keeps the SQL and Python definitions adjacent without touching the descriptor contract.
- `full_name` is **not** added to response schemas — `name` is already dumped by `AgreementData:49`. The alias exists for backend-internal intent clarity, so the API surface is unchanged.
- **`func.trim()` and Python `.strip()` are not the same operation.** Postgres's `TRIM()` strips only spaces by default; Python's `.strip()` strips all whitespace (tabs, newlines, etc.). A `nick_name` of `"\t"` would fall back to `name` in the Python property but survive as a truthy `"\t"` through `display_name_expression()`. Low real-world likelihood (nicknames are short human-typed acronyms), but the guardrail test below must include a non-space whitespace case, not just `"   "`, or it won't catch this drift.
- **`ProcurementAction.display_name`** (`models/procurement_action.py:197-203`) is a separate `@BaseModel.display_name.getter` override that builds its string from `self.agreement.name` directly, not `self.agreement.display_name` — so it does **not** pick up this change. This means the "single chokepoint" framing in the decisions table above is narrower than it sounds: it's the single chokepoint for `Agreement.display_name`, not for every place a display name touches an agreement. No live frontend renderer of this field was found (only `frontend/src/mocks/handlers.js`), so this is a documentation note rather than a fix — flag it in the PR description so nobody is later surprised that an Award/Mod-history string still shows the full title.

### B2–B9. Remaining backend changes

> **B2 and B3 are hardening, not the AC 3 delivery mechanism.** Verified: no current frontend caller ever sends `exact_match=false` or `search=` to `/agreements` (`opsAPI.js` builds only `name=` / `nick_name=`; the only `search=` calls target the unrelated `/projects/` endpoint). So today, B2's `ilike` branch and B3's widened `ilike` branch are exercised only by the new backend tests below, not by any live UI path. **AC 3 is satisfied entirely by F3** (client-side `createFilter`). Keep B2/B3 — they're the correct API-surface hardening for the next caller that does flip `exact_match` — but don't describe them to a reviewer as "how AC 3 works today," and don't expect step 3 of the manual smoke test to exercise them.

| # | File / location | Change |
|---|---|---|
| **B2** | `services/agreements.py:1313-1324` `_apply_search_filter` | `or_(name.ilike(...), nick_name.ilike(...))`. Keep the falsy-term → `name.is_(None)` sentinel branch. `or_` already imported. |
| **B3** | `services/agreements.py:1260-1278` `name` filter | Add `nick_name` to the **`ilike` branch only**. Add a comment on the exact branch citing trap 2. |
| **B4** | `services/agreements.py:1336-1339` `_sort_agreements` | `key=lambda a: (a.display_name or "").casefold()`. Python sort over materialized rows, so the property works directly. The `or ""` also fixes a latent `AttributeError` on a null name. |
| **B5** | `services/agreements.py:734-743` (filter options, Step 6) | Select `id, name, nick_name`; emit `{"id", "name": <full>, "nick_name", "display_name": <nick or name>}`; sort by `display_name` casefolded. **Keep `name` = the full name** — that is what the frontend posts back as `name=`, which is what makes B3's strict branch safe. No schema change needed: `schemas/agreements.py:361` is already `fields.List(fields.Dict(values=fields.Raw()))`, so extra keys pass through. |
| **B6** | `services/budget_line_items.py:1157-1163` | Same four-key shape as B5. **This is the trap-1 fix.** |
| **B7** | `services/budget_line_items.py:468-471` | `or_(Agreement.name.in_(names), Agreement.nick_name.in_(names))`. Safe here — no uniqueness-check caller. Verify `or_` is imported. |
| **B8** | `services/budget_line_items.py:265-270` and `:487-492` (`AGREEMENT_NAME` sort) | Use `Agreement.display_name_expression()` so SQL sort matches the rendered column and the client-side sort (F6). |
| **B9** | `schemas/budget_line_items.py:266-282` `SimpleAgreementSchema` | Add `nick_name = fields.String(allow_none=True)` and `display_name = fields.String(dump_only=True)`. Keep `name`. **One schema unlocks three surfaces** — `BudgetLineItemResponseSchema.agreement` (`:343`) is nested by both the BLI list *and* `schemas/cans.py:268`. |

**Two more nested-agreement schemas already have a `display_name` field and need zero code change to start returning the nickname:** `MinimalAgreementSchema` (`schemas/procurement_actions.py:12-17`, nested at `:59` and `:111`) and `NestedAgreementSchema` (`schemas/procurement_tracker_steps.py:23-30`). Unlike B9, these aren't missing a field — they'll pick up the new value automatically the instant B1 ships. Call this out in the PR description and add them to the Phase 4 OpenAPI-description sweep; neither is currently covered by a test in either direction.

**Do not reuse `add_search_list_multi_column`** (`ops_api/ops/utils/query_helpers.py:32-54`) despite its `[Agreement.name, Agreement.nick_name]` docstring. It is a method on `QueryHelper`, which `services/agreements.py` does not use at all — wrapping the `Select` for one clause is more code than the inline `or_`. It has zero call sites; leave it dead or delete it separately.

### B10. Projects filter options — needs product confirmation

`services/projects.py:723-743` currently inserts **both** the name and the nickname as *separate options for the same agreement* (verified: two `if` blocks keyed by string into `agreement_values_dict`). That contradicts "the nickname displays instead of the full agreement name … in dropdowns and filters."

Collapse to one nickname-preferred entry per agreement, **keyed by agreement `id`, not by the name/nickname string** — see trap 4 above. Keying by the display string is what causes the current double-entry bug in the first place, and reusing that same kind of string key for the "collapsed" version would just trade a visible duplicate for an invisible collision (agreement A's nickname silently overwriting agreement B's entry if the strings happen to match). Emit the same four-key shape as B5/B6. Downstream is already compatible — `opsAPI.js:548-551` sends `agreement_search=${agreement.title}`, `services/projects.py:317,403` already `or_` both fields, and `ProjectFilterTags.hooks.js:25,66-69` keys off `title` for both tag text and removal. **Zero frontend edits.** ~15 lines; roughly halves the option count.

This is beyond the literal issue text but required by the AC. Flag it on the issue rather than shipping silently.

### B11–B12. No code change, tests only

- **Notifications:** `services/procurement_tracker_steps.py:581`, `:1149`, `:1176` already interpolate `agreement.display_name` and inherit the new behavior for free. There is no email layer in the backend — notifications are in-app only.
- **Awarded lock (AC 6/7/8):** `nick_name` appears in **no** `get_required_fields_for_awarded_agreement()` list (Contract `:713-728`, Aa `:851-868`; Grant/Iaa/Direct return `[]`), so `immutable_awarded_fields` never contains it and `ImmutableAwardedFieldsRule` never blocks it. Frontend: the nickname `Input` (`AgreementEditForm.jsx:331-346`) has no `isDisabled` prop and no `AWARDED_DISABLED_FIELDS` entry. `_apply_proposed_agreement_title` (`procurement_tracker_steps.py:1017-1049`) is untouched and its pin test keeps passing.

### B13. Pre-existing gaps — flag, do not fix

Both become more likely once nicknames are the primary display string. Companion ticket:

- `nick_name`'s `unique=True` has no friendly handler. `is_agreement_name_unique_violation` (`ops_api/ops/utils/agreements_helpers.py:39-47`) covers only the name index, so a duplicate nickname raises a raw `IntegrityError` → 500 instead of 400.
- `nick_name` uniqueness is case-**sensitive** (plain constraint), unlike `name` (functional `lower()` index). `"HS"` and `"hs"` can coexist and would render as two near-identical rows.

**Checked and ruled out during adversarial review:** whether AA agreements can carry ETL-copied nicknames they can't edit through the UI. Confirmed false — the nickname `Input` in `AgreementEditForm.jsx:331-346` has no `isDisabled` prop and no `isFieldVisible`/`AGREEMENT_TYPE_VISIBLE_FIELDS` gate; it renders unconditionally for all 5 agreement types. `isFieldVisible` only gates the **read-only** meta-accordion display (`agreement.helpers.js:258-318`), not this edit form. No further action needed; don't re-investigate.

---

## Phase 2 — Frontend

### Group A — fixed for free by B1. Verify, do not edit.

- `components/Agreements/AgreementsTable/AgreementsTable.helpers.js:9-12` `getAgreementName` → agreements table row (`AgreementTableRow.jsx:39`), `ProjectSpendingAgreementRow.jsx:53`, `ProcurementDetailsTableRow.jsx:29`
- `hooks/lookup.hooks.js:75-86` `useGetAgreementName` → all three review cards (`ReviewCard.jsx:48`, `AwardReviewCard.jsx:27`, `ApprovalFlowReviewCard.jsx:59`)
- `hooks/use-sortable-data.hooks.js:125` — procurement-details sort
- Alert copy already on `display_name`: `ApproveAgreement.hooks.js:463-523`, `ApproveAwardApproval.hooks.js:151`, `ApprovePreAwardApproval.hooks.js:182,185`, `CreateBLIsAndSCs.hooks.js:664`, `ChangeIcons.jsx:87`
- **Already satisfies AC 5, independent of this whole change:** `pages/projects/list/ProjectsList.helpers.js:105-107` builds its "Agreements" export column from the backend's `agreement_name_list` (`models/projects.py:232-238`), which already prefers `nick_name` over `name`. This predates this story and isn't touched by it — but it has no regression test today, and none is added anywhere else in this plan. Add one alongside the other AC 5 test in Phase 3 (`helpers/budgetLines.helpers.test.js`'s neighbor, or a new case in `pages/projects/list/ProjectsList.test.jsx`) so a future refactor of `agreement_name_list` can't silently regress this AC.

### Group B — explicit edits

**F1. Shared helper** in `frontend/src/helpers/agreement.helpers.js`:

```js
export const getAgreementDisplayName = (agreement) =>
    agreement?.display_name ?? (agreement?.nick_name?.trim() || agreement?.name) ?? "";
```

Lenient on null by design — it is called on `budgetLine.agreement`, which can be absent. Do **not** route it through the throwing `handleAgreementProp`. Then make `AgreementsTable.helpers.js#getAgreementName` delegate to it, preserving every Group-A call site and the existing named export. No circular import risk. The local `nick_name` fallback matters because ~30 fixtures in `src/tests/data.js` set `name`/`nick_name` but not `display_name`.

**F2. `AgreementNameComboBox.jsx:47-73`** — make both option-building paths produce one shape:

```js
{ id, title: display, name, nick_name, display_name: display,
  searchText: [name, nick_name].filter(Boolean).join(" ") }
```

where `display = option.display_name ?? (option.nick_name?.trim() || option.name)`. In the derived path (`:61-72`) change the dedupe key from `agreement.display_name` to **`agreement.id`** — not to `display` — and carry `name` / `nick_name` through. See trap 4 above: keying by the rendered string (even the corrected nickname-preferred string) still lets one agreement's nickname collide with a different agreement's full name and silently disappear from the `Map`. Keying by `id` removes the collision entirely, since duplicate labels among distinct ids are a legitimate (if confusing) UI state, not a data-loss bug.

> Keeping `title` === the visible label is load-bearing: it is exactly what `AgreementsFilterTags.hooks.js:70-73` (`tagText: item.title`) and `:142-145` (removal on `name.title !== tag.tagText`) key on — **so that file and `ProjectFilterTags.hooks.js` need zero edits.**

**F3. Type-either-and-still-match** — two additive edits to the shared ComboBox (used by every combobox in the app, so keep it strictly opt-in):

- `components/UI/Form/ComboBox/ComboBox.hooks.js` (options mapper, `:43-52`): mirror the existing `if (item.order !== undefined)` pattern with `if (item.searchText !== undefined) option.searchText = item.searchText;` — `useComboBox` currently drops all fields except `value`/`label`, which is why this is required.
- `components/UI/Form/ComboBox/ComboBox.jsx`: import `createFilter` from `react-select` (confirmed exported by 5.10.2) and pass:

```js
filterOption={createFilter({ stringify: (o) => `${o.label} ${o.data?.searchText ?? ""}` })}
```

Using `createFilter` rather than a hand-rolled predicate preserves react-select's exact default semantics (ignoreCase, ignoreAccents, trim, substring) and only widens the haystack — options without `searchText` behave identically to today. All three `AgreementNameComboBox` call sites pre-fetch the complete option list (`AgreementsFilterButton.jsx:107-115`, `BLIFilterButton.jsx:220-227`, `ProjectFilterButton.jsx:108-117`), so this filtering is client-side with no round trip. **This is what satisfies AC 3 in the UI.**

**F4. `pages/budgetLines/list/BLIFilterTags.jsx` — two lines that must change together.** `:128` `tagText: title.name` → `title.title ?? title.display_name ?? title.name`, and the `:66` removal predicate to the *identical* expression. Change only one and the X button silently stops removing the tag.

**F5. `frontend/src/api/opsAPI.js`**

- `getAgreements` `:124-128`: invert precedence to `name.name ?? name.display_name ?? name.title` so `name=` stays a strict full-name param, upholding B3.
- BLI `:400-404`: `agreement_name=${title.name ?? title.display_name ?? title.title}`. B7 makes either work; prefer `name` for symmetry.
- `nickName` param (`:99`, `:132-133`) — untouched; nickname uniqueness depends on it.
- Projects `agreement_search` `:548-551` — untouched.

**F6. Raw `.name` reads that become nickname-preferred**, all via `getAgreementDisplayName`:

- `components/BudgetLineItems/AllBudgetLinesTable/AllBLIRow.jsx:47-49` — both `agreementName` and `agreementLinkLabel`
- `components/CANs/CANBudgetLineTable/CANBudgetLineTable.jsx:62` — the `agreementName` prop (row component needs no edit)
- `components/Agreements/AgreementSelect/AgreementSelect.jsx:142` — native `<select>` option text. **Known limitation, not fixable by this change:** native `<select>` type-ahead jumps to an option by matching its *rendered* text. Once the option text is nickname-preferred, typing the full title will no longer jump to it — only typing the nickname will. This is a real, narrower reading of AC 3 for this one surface; call it out in the PR description rather than silently accepting it, since `AgreementNameComboBox`/`ComboBox` (F2/F3) don't have this limitation and a reviewer may reasonably ask why this surface is different.
- `hooks/use-sortable-data.hooks.js:23` **and** `:65` — so client sort matches the rendered column and B8
- `pages/procurementDashboard/ProcurementDashboardPage.jsx:93` — export cell (no column inserted, currency indices untouched)
- `helpers/budgetLines.helpers.js:563` — the "Agreement" cell of the BLI export (**AC 5**: other exports show a single nickname-preferred value). Header at `:526` unchanged.

**F6b. The 8 review/approval `subTitle` props — separate, revertable commit pending UX sign-off:**
`ReviewAgreement.jsx:163`, `ApproveAgreement.jsx:116`, `RequestPreAwardApproval.jsx:135`, `ApprovePreAwardApproval.jsx:101`, `ReviewBudgetTeamRequisition.jsx:83`, `RequestAwardApproval.jsx:118`, `EditAwardApproval.jsx:135`, `ApproveAwardApproval.jsx:105`

**F7. Must NOT change — add a one-line comment at each so a future sweep doesn't "fix" them:**

- `pages/agreements/details/Agreement.jsx:232`, `:302` — the explicit AC exception
- `AgreementMetaAccordion.jsx:73-74` and `AgreementDetailsView.jsx:87-98` — the labeled Name/Nickname pair
- `ApproveAwardApproval.jsx:253` — "Current Agreement Title", rendered *beside* the proposed `step6?.agreement_title` for comparison. Must stay raw `name`.
- `AgreementEditForm.hooks.js:450` — success alert echoing the field just edited

**F8. Agreements-list export** (`pages/agreements/list/AgreementsList.jsx`) — **AC 4**:

- headers `:246-262` → insert `"Agreement Nickname"` at index 1
- rowMapper `:265-300` → column 0 becomes `agreement.name ?? ""` (**changed from `getAgreementName`**, which is now the nickname); new column 1 is `agreement.nick_name ?? ""`
- `currencyColumns` `:303` → `[4,5,8,9,10]` becomes **`[5,6,9,10,11]`**. Strongly consider deriving these from the header array (`tableHeader.indexOf("Total")` etc.) so the next insert can't break it — 5 lines, permanent fix.
- the `getAgreementName` import at `:17` may become unused; ESLint will flag it

**F9. Types.** `types/AgreementTypes.d.ts:24-28` needs no change. Add `nick_name` / `display_name` to whatever typedef backs the nested BLI agreement (`types/BudgetLineTypes.d.ts`) so JSDoc checks pass after B9/F6.

---

## Phase 3 — Tests

Per [`docs/TESTING.md`](../../docs/TESTING.md): test at the lowest appropriate level, favor integration over E2E.

### Backend

**New — `tests/ops/agreement/test_agreement_display_name.py`** (pure unit): nickname preferred; falls back to name for `None` / `""` / whitespace-only; strips surrounding whitespace; plus `test_display_name_expression_matches_python_property`, parametrized over those nick_name shapes — **this is the only thing keeping B1's SQL and Python definitions from drifting.** The parametrization **must include a non-space whitespace value (e.g. `"\t"` or `"\n"`)**, not just `"   "` — Postgres `TRIM()` strips only spaces by default while Python `.strip()` strips all whitespace, so a space-only test case would pass even if the SQL and Python definitions silently disagree on tabs/newlines.

**Extend — `tests/ops/agreement/test_agreement.py`**
- `test_agreements_search_matches_nick_name` / `..._matches_name` (B2)
- `test_agreements_name_filter_exact_does_not_match_nick_name` — **the important negative; pins trap 2 and protects title uniqueness**
- `test_filter_options_agreement_names_include_nick_name_and_display_name` (extends `:3687`)
- **Update** `test_filter_options_agreement_names_sorted_by_name` (`:3698-3704`) — sort key becomes `display_name`

**Extend — `tests/ops/budget_line_items/test_budget_line_item.py`**
- `test_bli_agreement_name_filter_matches_nick_name` — **the trap-1 regression test** (nickname *and* full name both return the BLI)
- `test_bli_filter_options_agreement_names_include_name_and_nick_name` (extends `:1554-1559`)
- `test_bli_agreement_sort_uses_display_name` (B8), `test_bli_response_agreement_includes_nick_name_and_display_name` (B9)

**Extend — `tests/ops/agreement/test_agreement_sort.py`:** `test_sort_agreements_by_agreement_uses_display_name`, with two agreements whose nickname ordering inverts their name ordering. File already calls into `services.agreements` with MagicMocks — keep it a unit test.

**Extend — `tests/ops/agreement/test_agreement_immutable_awarded_fields.py`:** `test_nick_name_is_not_an_immutable_awarded_field`, parametrized over all five types. **AC 6 guard.** The existing exact-list/count assertions at `:41-50` should pass untouched — resist any suggestion to add `nick_name` to them.

**Notifications — `tests/ops/procurement_tracker/`:** `test_pre_award_approval_request_notification_uses_nick_name` and `test_award_approved_notification_uses_nick_name`. Cheap, and the **only** automated coverage of the "system notifications" AC (no test currently asserts an agreement name inside a message body).

**Existing asserts — let failures drive it, don't blanket-edit.** `test_agreement.py:48, 1204, 1230, 1256, 1306, 1335, 1355, 1382, 1719, 2035, 2071` assert `display_name == name`; these only break for fixtures that actually have a nickname. Where the assert is incidental to a create/update test, delete it and let the new file own the behavior; where it is the point, change to `== (nick_name or name)`. Note `:191` (`response.json["display_name"] == agreement.display_name`) stays valid and is a useful contract check. Run `pytest tests/ops/agreement tests/ops/budget_line_items tests/ops/procurement_tracker` first and work the list.

### Frontend (Vitest)

| File | Tests |
|---|---|
| `helpers/agreement.helpers.test.js` | `getAgreementDisplayName`: nickname preferred; falls back for `null`/`""`/whitespace; prefers server `display_name`; returns `""` for null agreement without throwing |
| `components/Agreements/AgreementsTable/AgreementsTable.helpers.test.js` | `getAgreementName` (currently uncovered): nickname-preferred, name fallback |
| `components/UI/Form/ComboBox/ComboBox.test.js` | **AC 3**: matches when typed text appears only in `searchText`; typing the nickname and typing the full name both resolve to the *same single* option; **filtering unchanged for options without `searchText`** (regression guard for every other ComboBox); unrelated text does not match |
| `components/Agreements/AgreementNameComboBox/AgreementNameComboBox.test.js` | nickname as label when present, full name when absent; finds the option by typing the full name; **`setSelectedAgreementNames` receives `{name, nick_name, title === display}`** — F4 and F5 both depend on this shape. Update `sampleAgreements` (`:19-23`), which sets only `display_name`. |
| `pages/budgetLines/list/BLIFilterTags.test.jsx` | tag shows the nickname **and** removal works when tag text is the nickname (both — a text-only test lets the F4 bug through) |
| `pages/agreements/list/AgreementsFilterTags/` | tagText is the nickname and removal still works (locks in that F2 keeps `title` === label) |
| `pages/agreements/list/AgreementsList.test.jsx` | **AC 4**: mock `exportTableToXlsx`; assert headers contain `"Agreement"` then `"Agreement Nickname"`, row has `name` at index 0 and `nick_name` at index 1, **and `currencyColumns === [5,6,9,10,11]`** |
| `helpers/budgetLines.helpers.test.js` | **AC 5**: nickname in the Agreement column; full-name fallback |
| `hooks/useSortableData.test.js` | sorts all-BLI rows by nickname when present |
| `components/Agreements/AgreementEditor/AgreementEditForm.helpers.test.js` + one component test | **AC 6**: `isFieldDisabled(NickName, ["name"], false, true) === false`; and with `is_awarded: true` + `immutable_awarded_fields: ["name"]`, the title input is disabled while the nickname input is **enabled** |
| `pages/agreements/details/Agreement.test.js` | **Negative AC — details page.** Render with a nicknamed agreement; assert the `<h1>` text and the `breadCrumbName` prop passed to `App` both equal `agreement.name`, never `agreement.nick_name` or `display_name`. F7's source comment alone doesn't fail CI if a future edit routes this through `getAgreementDisplayName` — this test does. |
| `components/Agreements/AgreementMetaAccordion/AgreementMetaAccordion.test.jsx` | **Negative AC — side-by-side fields unchanged.** With a nicknamed agreement, assert the "Agreement" term renders `agreement.name` and the nickname term renders `agreement.nick_name`, not a nickname-preferred value in either slot. |
| `pages/agreements/details/AgreementDetailsView.test.jsx` | **Negative AC — nickname Tag unchanged.** Assert the nickname `Tag` (`dataCy="agreement-nickname-tag"`) still renders raw `agreement.nick_name`. |

Without these three, the only coverage for the issue's explicitly-named negative cases ("details page heading/breadcrumb continues to show the full name," "the existing side-by-side Name and Nickname fields... are unchanged") is a source comment and one Cypress assertion on the `<h1>` alone — neither the breadcrumb nor the meta-accordion pair nor the details-view Tag is locked in by a fast test.

**Fixture fix — `frontend/src/tests/data.js`:** the main `agreement` fixture (`:65-216`) has `nick_name: "AACFRC"` *and* `display_name: "Contract #1: African American Child and Family Research Center"`, which after B1 is an impossible server response. Set `display_name: "AACFRC"`. That flips expectations in `ProjectSpendingAgreementRow.test.jsx`.

**Correction — there is no existing blank-nickname Agreement fixture.** An earlier draft of this plan pointed at `:699`'s `nick_name: ""` as "the blank-fallback fixture" — verified wrong: that line belongs to a nested **CAN** object inside a budget-line fixture, not an Agreement (same for the only other bare `nick_name: ""` in the file, on a nested CAN at `:2424`). There is currently no Agreement fixture anywhere in `data.js` with a blank or whitespace-only nickname. Add one — e.g. clone the main `agreement` fixture with `nick_name: null` (or `nick_name: "   "` for the whitespace case) — so the None/blank/whitespace fallback path in the `getAgreementDisplayName` tests above is actually exercised against a fixture, not just against inline test literals.

### E2E — no new spec

Every AC is reachable at unit/component/API level. One worthwhile addition: ~10 lines appended to the **existing** `cypress/e2e/agreementList.cy.js` — after creating an agreement with a nickname, assert the list row shows the nickname and the details-page `<h1>` shows the full name. Round-trips the headline AC through the whole stack.

**Seed-data check (done):** in `data_tools/data/agreements_and_blin_data.json5`, only the AA and Procurement-Tracker agreements carry nicknames. Agreements 1–4 have none, so `agreementList.cy.js`, `budgetLineItemsList.cy.js`, and `editAgreement.cy.js` are unaffected. `agreementDetails.cy.js:80` asserts the `<h1>` for a nicknamed agreement — passes, since the `<h1>` keeps the full name. `editBudgetLineByPowerUser.cy.js` (`:161` etc.) asserts on `testAgreement.display_name`, and its fixture sets no `nick_name` — verify `testIaaAgreement` likewise, then move on. The one order-dependent sort spec (`agreementList.cy.js:501`) is already `it.skip`ped.

---

## Phase 4 — Docs

**Run `/sync-openapi --branch`**, then hand-verify these five spots — a purely semantic change to an existing field is invisible to a shape-based sync:

- `openapi.yml:954-969` — agreements filter-options item: add `nick_name` (nullable) + `display_name`; fix the "sorted by name" description
- `openapi.yml:4069-4088` — projects filter-options: rewrite the "names and nicknames" description if B10 lands
- `openapi.yml:7772-7793` `SimpleAgreementSchema` — add `nick_name` (nullable) + `display_name`
- `MinimalAgreementSchema` (`schemas/procurement_actions.py:12-17`) and `NestedAgreementSchema` (`schemas/procurement_tracker_steps.py:23-30`) — both already document a `display_name` field; update the description on each to note it is now nickname-preferred. No shape change, so `/sync-openapi` won't flag these on its own.
- the `display_name` property on each agreement response schema — add `description: Nickname if set, otherwise the full name`. **The only place the semantic change is discoverable.**
- `openapi.yml:104` (`nick_name` param) and the `/agreements/` `name` / `search` params — document that `search` matches name **or** nickname while `name` is name-only. This is where the next developer looks before re-breaking trap 2.

**No Alembic migration.** No column or index changes; `display_name` stays a Python property and `display_name_expression()` is a classmethod returning an expression, not a mapped column. Confirm with an empty autogenerate diff via the `/db-migrations` skill. (The two excluded follow-ups from B13 *would* need one.)

**Definition of Done — "Feature flags/toggles created."** Record the decision explicitly rather than letting the checklist item go unaddressed: this plan proposes **no feature flag**. The change ships as a single coordinated release (commit-ordering constraint from trap 1 already requires B1/B6/B7/F5 together), it's a display-only change with no data loss on rollback, and a flag would add branching complexity to a `display_name` property that's read in dozens of places for no corresponding benefit — reverting the commits is the rollback plan. State this in the PR description so the DoD box is checked with a reason, not silently skipped.

---

## Commit ordering

1. **B1 + B6 + B7 + F5** — one commit. B1 alone silently breaks the BLI agreement filter (trap 1).
2. **B2, B3, B4, B5, B8, B9** + backend tests
3. **F1** + Group-A verification
4. **F2 + F3 + F4** — the combobox/filter/tag triangle (F2 and F4 are coupled; F3 is independently testable)
5. **F6** minus subtitles — table / select / sort / export cells
6. **F8** — export column + `currencyColumns`
7. **F6b** — the 8 subtitles, separate and revertable, pending UX sign-off
8. **B10** — projects filter options, separate, pending product confirmation
9. `/sync-openapi --branch` + the five manual spots

Per `CLAUDE.md`: conventional commits, single line, under 100 chars, no trailers. No `Closes #6144` in the PR body.

---

## Verification

```bash
# Backend
cd backend/ops_api
pipenv run pytest tests/ops/agreement tests/ops/budget_line_items tests/ops/procurement_tracker
pipenv run pytest                                    # full suite
pipenv run black --config ./pyproject.toml . && pipenv run nox -s lint

# Migration must be a no-op
cd .. && alembic revision --autogenerate -m "verify no schema change"   # expect empty; then delete

# Frontend
cd frontend
bun run test --watch=false
bun run format && bun run lint --fix

# OpenAPI
./backend/validate_openapi.sh
```

### Manual smoke test

```bash
docker compose up --build
```

1. **Nickname appears** — add a nickname to an agreement that lacks one (`/agreements/:id` → Edit). Confirm it now shows in the agreements table, the Agreement Title filter dropdown, the all-budget-lines table, and the CAN detail budget-line table.
2. **Details page unchanged** — that agreement's own page still shows the full title in the `<h1>` and breadcrumb, and the Name/Nickname fields still render side by side.
3. **Filter by either string** (AC 3) — open the agreements-list filter, type the nickname → option appears; clear, type a distinctive word from the full title → the *same* option appears. Select it and confirm the table filters and the chip reads the nickname. Click the chip's X and confirm it clears. Repeat on the budget-lines list.
4. **Agreements export** (AC 4) — export the list; confirm "Agreement" (full title) and "Agreement Nickname" are separate columns, blank nickname for agreements without one, and that Total / FY Obligated / Subtotal / Fees / Lifetime Obligated are still currency-formatted.
5. **BLI export** (AC 5) — export budget lines; the Agreement column shows the single nickname-preferred value.
6. **Notifications** — trigger a pre-award or award approval request; confirm the notification body names the agreement by nickname.
7. **Post-award nickname edit** (AC 6/7) — on an awarded agreement, confirm the Title input is disabled while the Nickname input is editable; change the nickname and save successfully.
8. **Removal** — clear the nickname; confirm the full title reappears everywhere in step 1.

### Open questions for the issue thread

- **F6b** — do the 8 review/approval page sub-titles count as "the agreement's own page"? Needs UX sign-off. **Note the consequence of deferring:** the issue's out-of-scope list names exactly two exceptions (the details page heading/breadcrumb; the side-by-side Name/Nickname fields) — these 8 subtitles aren't among them. If F6b ships as a separate, later, sign-off-gated commit and that sign-off doesn't happen promptly, AC 1 ("everywhere... except the agreement's own page") remains genuinely unsatisfied for these 8 surfaces, not just conservatively scoped. Get the sign-off before merge if at all possible, rather than treating this as a nice-to-have follow-up.
- **B10** — the projects filter currently lists the name *and* the nickname as separate options for one agreement. The AC requires collapsing it, but it isn't in the issue text. Same consequence as F6b: if deferred past this PR, AC 1 is unsatisfied for the projects filter specifically.
- **B13** — duplicate-nickname 500 and case-sensitive nickname uniqueness. Both get more likely once nicknames are the primary display string. Separate ticket?
- **`AgreementSelect.jsx`'s native `<select>`** — see the F6 note above. Once its option text is nickname-preferred, browser type-ahead can no longer jump to an option by typing its full title. Worth a line in the PR description acknowledging this is a narrower AC 3 outcome for this one surface.
