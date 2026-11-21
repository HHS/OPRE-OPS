---
issue: 6570
branch: OPS-6570/behavior-based-unit-tests
---

# Tech debt: replace implementation-detail unit tests with behavior-based tests

## Goal

Rewrite the listed unit tests so they assert on observable behavior (rendered UI, persisted DB rows, API responses) instead of mock call counts, mocked-out private methods, or CSS class names. Where good tests already cover the behavior, delete the bad ones instead. This closes the real coverage gaps those tests hide in authorization, workflow, fee and notification logic.

## Acceptance Criteria

**Backend**
- [ ] `backend/ops_api/tests/ops/services/test_change_requests.py:42-63` (`test_update_change_request_authorized`) — mocks out `_is_division_director_of_change_request`, `_handle_review_action`, and the notifier, then only asserts `session.commit` was called. Rewrite against `loaded_db` to assert the real authorization/review outcome.
- [ ] `backend/ops_api/tests/ops/services/test_change_requests.py:20-39` (`test_create_agreement_change_request`) — asserts against a bare `MagicMock` result; proves mock wiring, not that `create()` builds a correct `ChangeRequest`.
- [ ] `backend/ops_api/tests/ops/events/test_procurement_tracker_events.py` (whole file) — verifies tracker/action creation purely via `session.add.call_count` on a mocked session. Rewrite against `loaded_db` and query the persisted rows.
- [ ] `backend/ops_api/tests/ops/services/test_notifications.py` (whole file) — same pattern; never persists/queries a real `Notification` row.
- [ ] `backend/ops_api/tests/ops/services/test_agreements.py:79-86` (`test_immediate_change_with_all_draft_and_update_fees`) — patches out `_update_draft_blis_proc_shop_fees`, the fee-recalculation logic the test name advertises, so the fee math itself is never exercised.
- [ ] `backend/data_tools/tests/disable_users/test_disable_users.py:27-35` — verifies deactivation via `session.merge`/`session.add` call counts on a mock instead of checking the real persisted `User.status`.
- [ ] `backend/data_tools/tests/cleanup_user_sessions/test_utils.py:28-61` — mocks collaborators and session; checks wiring, not that a real sys-admin user is persisted.
- [ ] Review `backend/ops_api/tests/ops/services/test_award_approval_service.py` (mocks `NotificationService`, borderline) and `backend/ops_api/tests/document/test_service.py::test_create_document` (patches `can_access_docs` — the authorization gate — directly on the instance under test) for a possible authorization test gap.

**Frontend**
- [ ] `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.test.jsx:5-110` — doesn't render the real component at all; defines a throwaway `TestComponent` and asserts on React effect-call counts. Rewrite against the real `AgreementEditForm`.
- [ ] `frontend/src/pages/portfolios/list/PortfolioFiscalYearSelect/PortfolioFiscalYearSelect.test.jsx:5-21,43-50` — mocks the real `FiscalYear` child with a fake `<select>` that echoes its own props back.
- [ ] `frontend/src/components/Projects/ProjectSummaryCardsSection/ProjectSummaryCardsSection.test.jsx:45-63` and the same pattern in `AgreementSummaryCardsSection.test.jsx` and `components/BudgetLineItems/SummaryCardsSection/SummaryCardsSection.test.jsx` — mocked card children just echo their own title prop back.
- [ ] `frontend/src/components/CANs/CANFundingReceivedForm/CanFundingReceivedForm.test.jsx:35-41` — asserts a mocked setter was called exactly 9 times (once per keystroke) instead of checking the resulting value.
- [ ] Tab "selected" state asserted via raw CSS class string instead of an accessible attribute (also an a11y gap in the components themselves — none expose `aria-selected`/`aria-current`): `components/UI/Tabs/Tabs.test.jsx:64`, `components/Agreements/DetailsTabs/DetailsTabs.test.js:288`, `pages/agreements/list/AgreementTabs.test.jsx:141`, `pages/home/HomeLanding.test.jsx:33`.
- [ ] `frontend/src/components/ChangeRequests/ApprovalFlowReviewCard/ApprovalFlowReviewCard.test.jsx:340-349` — redundant assertions that internal hooks were called with specific args, already covered by adjacent rendered-text assertions.

## Technical Details

### Approach

**Three PRs, in this order** (no test file spans two of them):
1. **Backend, small items:** change requests, notifications, fee test, data_tools, documents and award approval.
2. **Frontend:** all six frontend items, plus the `aria-current` change.
3. **Procurement tracker:** its own PR, last. The file is 1,609 lines with 44 tests, too much to review alongside anything else.

**Rewrite or delete:** delete a bad test when another test already guards the behavior; first confirm the guard by breaking the production code (see Testing Strategy) and seeing that test fail. Otherwise rewrite it. Mocks stay only at real boundaries:
- email/ACS
- `ResponsiveDonutWithInnerPercent`/`@nivo/pie`, which jsdom can't render
- `IntegrityError`/DB-error `side_effect`s, because their handlers call `session.rollback()`, which would undo the `loaded_db` savepoint

**Real-DB assertions:** after the call under test, run `flush()` then `expire_all()` (or `expire(obj)`) before reading saved state. `loaded_db.get` returns the cached object in the session, not the stored row. `commit()` can't be observed under the savepoint fixture, so no test should claim to guard it. Look rows up by attributes, never by hardcoded new IDs, because both ops_api and data_tools CI run `pytest -n 4`.

Per item:
- **Change requests (both AC items): delete; covered elsewhere.** Delete `test_create_agreement_change_request`, `test_update_change_request_authorized` and the neighbouring `test_update_change_request_unauthorized` (L66). They are covered by:
  - `tests/ops/workflows/test_change_requests.py:487` (`test_change_request_review_auth`), a real API test: a user with no permissions gets 403, a director from another division gets 403, and the right director gets 200.
  - `tests/ops/agreement/test_agreement_change_requests.py:94-195`: a real `ChangeRequestService(loaded_db)` creates an agreement change request (IN_REVIEW, notification to user 522), and approval gives APPROVED, `reviewed_by_id` and a notification to the submitter. This covers the agreement-type `get_division_directors_for_agreement` branch; the workflows test covers the budget-line `managing_division_id` branch.

  Before deleting, run the mutants below and confirm those tests fail. If a mutant survives, add the missing case to the covering test file instead of keeping the mocked test. Cite both covering tests in the PR.
- **Notifications:** rewrite on `NotificationService(loaded_db)`, querying `Notification` rows after flush and expire. `get_list` ignores its `filters` argument. Record that as a follow-up rather than fixing it here, and don't write a test that pins the bug.
- **Fee test (decided: assert the fees each draft budget line gets, no production change).** `_update_draft_blis_proc_shop_fees` is never called: the call at `ops/services/agreements.py:730-731` is commented out under a TODO, so the existing patch does nothing. Remove the patch and rename the test. Replace the `make_agreement` MagicMocks with real rows so the fee *must* change:
  - two procurement shops with different fees, and fee dates that are open-ended or cover today (`current_fee` filters on today's date)
  - one DRAFT budget line with a nonzero `amount` and `procurement_shop_fee_id = None`, since a locked-in fee would otherwise win
  - assert the baseline `fees` differs from the expected new value

  Call `_handle_proc_shop_change`, then `flush()` and `expire(agreement)`. Without the expire, `agreement.procurement_shop` keeps pointing at the old shop and correct code fails. Assert `awarding_entity_id` and `bli.fees == new_fee / 100 * amount`; fees are whole-number percentages, and `fees` returns a dollar amount, not a rate. Leave the dead method and its TODO alone.
- **data_tools disable_users:** use data_tools' Docker-Postgres `loaded_db`, which starts from an empty `create_all` schema with savepoint rollback. Seed a User with an active UserSession and call `disable_user`. Flush and expire, then assert `User.status`, `UserSession.is_active` and the OpsEvent row. `disable_user` doesn't call `setup_triggers`, so nothing needs patching here.
- **data_tools cleanup_user_sessions (`get_system_admin_id`):** keep `setup_triggers` patched. Under SQLAlchemy 2.0 its `handle_error` listener isn't allowed on the connection-bound session, and the fixture already sets up the same history tracking (comment at `test_disable_users.py:337-340`).
  - **Existing sys-admin user:** seed one, call the function, and assert the returned id matches and the user count is still 1.
  - **New user:** assert the count is 0 before the call, then that exactly one sys-admin `User` exists and its id is returned.

  Replace the never-failing `id is None or int` assertion.
- **Documents and award approval:**
  - **Documents:** `can_access_docs` is a `DocumentService` method (`ops/document/service.py:24`), and `is_user_linked_to_agreement` is in `ops/document/utils.py:17`. The success path for a system owner already runs unpatched in `test_contract_modification_requests.py:890`. The real gap is the denial path and the linked-but-not-system-owner path, so add two API tests:
    - `basic_user_auth_client` (user 521 has the documents permission, so the request reaches `can_access_docs`) on an agreement it isn't linked to gets rejected. Assert the status the endpoint actually returns; the service raises `AuthenticationError`, so expect 401.
    - A project officer or team member of the agreement succeeds.

    No system-owner test is needed.
  - **Award approval:** the denial cases are tested on the rule alone (`test_award_approval_validation.py:103-117`), not through the validator. Before closing this AC, remove `AwardApprovalResponseAuthorizationRule` from `procurement_tracker_steps_validator.py:81` and confirm some test fails. If none does, add an API-level denial test. Converting its 4 notification tests to query `Notification` rows is optional and low priority.
- **AgreementEditForm (rewrite, smallest version):** nothing guards the real `setHasAgreementChanged` effect (`AgreementEditForm.hooks.js:205-207`). The other `AgreementEditForm.*.test.jsx` files mock the hooks, and the Cypress unsaved-changes tests (`cypress/e2e/agreementDetails.cy.js:291`, `:338`) are `it.skip`.
  - Delete the whole 407-line `AgreementEditForm.test.jsx`; it imports no production code.
  - Add 2 cases to `AgreementEditForm.hooks.test.js` using its existing `renderUseAgreementEditForm` / `hasStateChangedMock` harness (L106-146). When the mock returns true, the passed `setHasAgreementChanged` gets `true`; when it returns false, it gets `false`. The setter is a public prop of the hook, so asserting on it here is fine.
- **PortfolioFiscalYearSelect:** drop the `FiscalYear` mock, since it's a native labelled `<select>`. Use `getByRole("combobox", { name: "Fiscal Year" })` and `userEvent.selectOptions`, and cut the 9 tests to 2-3.
- **Summary cards sections (3 files):** render the real child cards, mock only the donut chart, and assert headings and amounts with `getByText`.
- **CanFundingReceivedForm:** render inside a `useState` wrapper (see `CurrencyInput.test.jsx:9`) and assert `toHaveValue("Test note")`.
- **Tabs (decided: these 3 components only):** add `aria-current="page"` to the selected item. They are navigation tabs, so use `aria-current`, not `role="tab"`/`aria-selected`.
  - `UI/Tabs/Tabs.jsx`: one change covers HomeLanding, `CanDetailTabs` and `pages/help/HelpCenter`; run their tests too.
  - `Agreements/DetailsTabs/DetailsTabs.jsx`: the normal button branch only. The `DisabledButtonWithTooltip` branch doesn't need it, because a disabled tab can't be navigated to, so it is never the current page. That shared component doesn't pass extra props through, so don't touch it. If a disabled tab can be the selected one, stop and raise it.
  - `pages/agreements/list/AgreementsTabs.jsx`: on its `Link`s. `TabsSection` is a bare `<nav>` wrapper and doesn't change.

  In the 4 tests, assert the selected tab has `aria-current="page"` and the unselected tabs don't, on at least one route other than the default.
- **ApprovalFlowReviewCard:** in `beforeEach`, make the hook mocks ID-aware with `mockImplementation`, returning names only for the default IDs (123 and 456). Convert the per-test `mockReturnValue` overrides (L352+) the same way, so that rendered text proves the right ID was passed. Fix any test that relied on the old any-ID mocks. Then delete the two call-argument tests at L340-349.
- **Procurement tracker (PR 3):** call `procurement_tracker_trigger(event, loaded_db)` with real `OpsEvent`s, then query the `DefaultProcurementTracker`, `ProcurementAction` and `OpsEvent` rows and the links between budget lines and the action.
  - Write one test per scenario that checks all of those together, instead of one test per call. Parametrize the "ignores X" cases. Target about 15 tests instead of 44.
  - **"Ignores excluded status" cases:** seed real trackers and actions in each excluded status (INACTIVE/COMPLETED tracker; AWARDED/CERTIFIED/CANCELLED action) and assert a new one *is* created. Today the mock returns `None` no matter what, so the status filters in `_get_existing_tracker_and_action` are never exercised.
  - **"Skip" cases:** the trigger catches and logs every exception (`procurement_tracker_events.py:93-99`), so a "no row created" assertion passes even if the code crashed. Patch `logger` and also assert `logger.error` was not called.
  - **Idempotency:** convert L786 (it runs the trigger twice; it's not a concurrency test) to a real-DB test: run it twice and assert exactly one tracker and one action, with both budget lines linked.
  - **L1393:** a helper test for the FAILED event. Move it to the real DB.
  - **L345 and L756:** keep these failure-injection tests on the mock session.
  - **Row-lock tests at L711 and L732:** delete both. They assert `scalar.called` and `scalar.call_count >= 3`, which are pure implementation details.

### Key Files

Backend tests → source under test
- `backend/ops_api/tests/ops/services/test_change_requests.py` (delete) → covered by `backend/ops_api/tests/ops/workflows/test_change_requests.py:487` and `backend/ops_api/tests/ops/agreement/test_agreement_change_requests.py:94-195`; source `backend/ops_api/ops/services/change_requests.py`
- `backend/ops_api/tests/ops/services/test_notifications.py` → `backend/ops_api/ops/services/notifications.py`
- `backend/ops_api/tests/ops/services/test_agreements.py` → `backend/ops_api/ops/services/agreements.py` (L714-780), `backend/models/budget_line_items.py` (`fees` hybrid property, L164-199)
- `backend/data_tools/tests/disable_users/test_disable_users.py` → `backend/data_tools/src/disable_users/disable_users.py`
- `backend/data_tools/tests/cleanup_user_sessions/test_utils.py` → `backend/data_tools/src/cleanup_user_sessions/utils.py`
- `backend/ops_api/tests/document/test_service.py` + new API tests (alongside `backend/ops_api/tests/ops/agreement/test_contract_modification_requests.py:890`) → `backend/ops_api/ops/document/service.py` (`can_access_docs`, L24), `backend/ops_api/ops/document/utils.py` (L17)
- `backend/ops_api/tests/ops/services/test_award_approval_service.py`, `backend/ops_api/tests/ops/validation/test_award_approval_validation.py` → the validator in `procurement_tracker_steps_validator.py` (L81)
- `backend/ops_api/tests/ops/events/test_procurement_tracker_events.py` (PR 3) → `backend/ops_api/ops/events/procurement_tracker_events.py`

Frontend tests → source under test
- `frontend/src/components/Agreements/AgreementEditor/AgreementEditForm.test.jsx` (delete), `AgreementEditForm.hooks.test.js` (+2 cases) → `AgreementEditForm.hooks.js` (L201-207)
- `frontend/src/pages/portfolios/list/PortfolioFiscalYearSelect/PortfolioFiscalYearSelect.test.jsx` → `PortfolioFiscalYearSelect.jsx`, `frontend/src/components/UI/FiscalYear/`
- `frontend/src/components/Projects/ProjectSummaryCardsSection/ProjectSummaryCardsSection.test.jsx`, `AgreementSummaryCardsSection.test.jsx`, `frontend/src/components/BudgetLineItems/SummaryCardsSection/SummaryCardsSection.test.jsx`
- `frontend/src/components/CANs/CANFundingReceivedForm/CanFundingReceivedForm.test.jsx`
- `frontend/src/components/UI/Tabs/Tabs.jsx` + `.test.jsx`, `frontend/src/components/Agreements/DetailsTabs/DetailsTabs.jsx` + `.test.js`, `frontend/src/pages/agreements/list/AgreementsTabs.jsx` + `AgreementTabs.test.jsx`, `frontend/src/pages/home/HomeLanding.test.jsx`, plus the `CanDetailTabs` and `HelpCenter` tests
- `frontend/src/components/ChangeRequests/ApprovalFlowReviewCard/ApprovalFlowReviewCard.test.jsx`

Reference patterns
- `backend/ops_api/tests/ops/agreement/test_agreement_change_requests.py:94-195`: real `ChangeRequestService(loaded_db)` with `current_user` monkeypatched to User 522
- `backend/ops_api/tests/ops/agreement/test_skip_cr_proc_shop.py`: real `AgreementsService`, assertions on persisted rows
- `backend/ops_api/tests/ops/agreement/test_agreement_history.py:31`: trigger called with `loaded_db`, then flushed and queried
- `backend/data_tools/tests/disable_users/test_disable_users.py:314`: data_tools `loaded_db` plus the `setup_triggers` workaround
- Fixtures: `backend/ops_api/tests/conftest.py` (auth clients L308-366, `loaded_db` L373, `test_change_request` L406), `backend/data_tools/tests/conftest.py` (`loaded_db` ~L207)
- `frontend/src/test-utils.js` (`renderWithProviders`), `frontend/src/components/UI/Header/Breadcrumb.test.jsx:68` (`aria-current` assertion), `frontend/src/components/UI/Form/CurrencyInput/CurrencyInput.test.jsx:9` (stateful wrapper), `frontend/src/components/UI/Header/HeaderSearch/HeaderSearch.test.jsx` (MSW, role queries)

### Testing Strategy

The deliverable is the tests themselves, so the bar is that each new test, or each covering test relied on for a deletion, **fails when the behavior it guards breaks**.

- **Levels:**
  - **Backend:** service integration tests on `loaded_db` with real services; data_tools uses its own Docker `loaded_db`. Documents also gets API-level tests with the auth-client fixtures.
  - **Frontend:** Vitest + RTL, rendering the real children with `renderWithProviders`. Query with `getByRole`/`getByLabelText`, interact with `userEvent`, and use MSW `server.use` only where API data is needed.
  - **No new E2E tests.** The two skipped Cypress unsaved-changes tests stay out of scope.
- **Mutation check** (precedent: `.claude/skills/useblocker-bypass-regression-test/SKILL.md`): break the production line, confirm the relevant test fails, then restore with `git checkout <file>`. Each mutant targets the code the item guards:
  - **Change requests:** `_is_division_director_of_change_request` always returns True; `create()` drops a field. The covering tests must fail.
  - **Notifications:** `create()` doesn't set the recipient.
  - **Fee test:** delete `agreement.awarding_entity_id = new_value` (`agreements.py:729`).
  - **disable_users:** skip `status = INACTIVE`.
  - **cleanup_user_sessions:** always create a new sys-admin `User`; the count assertion must fail.
  - **Documents:** `can_access_docs` always returns True.
  - **Award approval:** remove `AwardApprovalResponseAuthorizationRule` from the validator.
  - **AgreementEditForm:** delete the effect at `AgreementEditForm.hooks.js:205-207`.
  - **Summary cards:** pass the wrong `summary` to a child.
  - **Tabs:** break the `tabSelected` check.
  - **ApprovalFlowReviewCard:** swap the two IDs passed to the hooks.
  - **Procurement tracker:** drop the status filter in `_get_existing_tracker_and_action`; return early before creating the `ProcurementAction`.

  Note the mutant results in the PR description, one short line per PR rather than a table.
- **Commands:**
  - Frontend: `bun run format`, `bun run lint --fix`, `bun run test --watch=false`.
  - ops_api: `pipenv run black --config ./pyproject.toml .`, `pipenv run nox -s lint`, `pipenv run pytest`.
  - data_tools (from `backend/data_tools`): `pipenv run nox -s black`, `pipenv run nox -s lint`, `pipenv run pytest`. pytest-docker starts Postgres, so check with the developer that Docker is running.

### Constraints

- No production behavior changes except adding `aria-current="page"` to the 3 tab components. The dead `_update_draft_blis_proc_shop_fees` method and its TODO stay as they are; `DisabledButtonWithTooltip` and `TabsSection` don't change.
- Don't run Docker commands; the developer manages Docker.
- Out of scope; record as follow-ups:
  - the same tab accessibility gap in `PortfolioTabsSection`, `PortfolioTabs`, `CanTabs`, `ProjectDetailTabs`, `BLITabs` and `ProcurementDashboardTabs`
  - the `NotificationService.get_list` filters bug
  - the same throwaway-component pattern in `pages/agreements/details/Agreement.test.js`
  - the two skipped Cypress unsaved-changes tests
