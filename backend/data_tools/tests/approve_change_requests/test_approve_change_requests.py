from datetime import datetime

import pytest
from click.testing import CliRunner
from loguru import logger
from sqlalchemy import func, select, text

from data_tools.src.approve_change_requests import approve_change_request, main, warn_if_not_division_director
from data_tools.src.common.utils import commit_or_rollback, get_or_create_sys_user
from models import *  # noqa: F403, F401
from models.change_requests import ChangeRequestStatus, ChangeRequestType


@pytest.fixture()
def db_with_change_requests(loaded_db):
    """Set up a Division/Portfolio/CAN/Agreement/BLI plus three ChangeRequest shapes
    (status-change, budget-change, procurement-shop-change) for out-of-band approval tests.
    """
    sys_user = get_or_create_sys_user(loaded_db)
    loaded_db.add(sys_user)
    loaded_db.commit()
    uid = sys_user.id

    # ---- Users ----
    # Director of the managing division — NOT the approving user in tests, so tests
    # can verify the warn-only behavior when the approving user isn't the director.
    director = User(id=90001, email="oob.director@example.com", first_name="Dana", last_name="Director")
    # Requestor — created_by on the change requests below.
    requestor = User(id=90002, email="oob.requestor@example.com", first_name="Remy", last_name="Requestor")
    # Approving user passed into approve_change_request in tests — distinct from the director.
    approving_user = User(id=90003, email="oob.approver@example.com", first_name="Ana", last_name="Approver")
    loaded_db.add_all([director, requestor, approving_user])
    loaded_db.commit()

    # ---- Division / Portfolio / CAN ----
    division = Division(
        id=9100,
        name="OOB Test Division",
        abbreviation="OOBTD",
        division_director_id=director.id,
        created_by=uid,
    )
    loaded_db.add(division)
    loaded_db.commit()

    portfolio = Portfolio(
        id=9100,
        name="OOB Test Portfolio",
        abbreviation="OOBTP",
        division_id=division.id,
        created_by=uid,
    )
    loaded_db.add(portfolio)
    loaded_db.commit()

    can = CAN(
        id=9100,
        number="OOBTEST001",
        portfolio_id=portfolio.id,
        created_by=uid,
    )
    loaded_db.add(can)
    loaded_db.commit()

    # ---- Procurement shops: a "first" shop (unused by the agreement, present just so a
    # second, distinct shop id is available) and the "new" shop the change request targets.
    # The agreement's awarding_entity_id starts as None to match this fixture's
    # requested_change_diff old value below (old=None, new=<proc_shop_new.id>).
    proc_shop_old = ProcurementShop(id=9100, name="OOB Test PSC Old", abbr="OOBOLD", created_by=uid)
    proc_shop_new = ProcurementShop(id=9101, name="OOB Test PSC New", abbr="OOBNEW", created_by=uid)
    loaded_db.add_all([proc_shop_old, proc_shop_new])
    loaded_db.commit()

    # ---- Project / Agreement / BLI ----
    project = ResearchProject(id=9100, title="OOB Approval Test Project", short_title="OOBP")
    loaded_db.add(project)
    loaded_db.commit()

    agreement = ContractAgreement(
        id=9101,
        name="OOB Approval Test Contract",
        project_id=project.id,
        awarding_entity_id=None,
        created_by=uid,
        updated_by=uid,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        id=91001,
        agreement_id=agreement.id,
        can_id=can.id,
        amount=1000,
        status=BudgetLineItemStatus.PLANNED,
        created_by=uid,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    # ---- Change requests: one per shape ----
    # 1. BLI status-change CR
    cr_status = BudgetLineItemChangeRequest(
        id=91101,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        managing_division_id=division.id,
        created_by=requestor.id,
        requested_change_data={"status": "IN_EXECUTION"},
        requested_change_diff={"status": {"old": "PLANNED", "new": "IN_EXECUTION"}},
    )
    # 2. BLI budget (amount)-change CR
    cr_amount = BudgetLineItemChangeRequest(
        id=91102,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        managing_division_id=division.id,
        created_by=requestor.id,
        requested_change_data={"amount": 5000.0},
        requested_change_diff={"amount": {"old": 1000.0, "new": 5000.0}},
    )
    # 3. Agreement procurement-shop-change CR
    cr_proc_shop = AgreementChangeRequest(
        id=91103,
        change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        agreement_id=agreement.id,
        managing_division_id=division.id,
        created_by=requestor.id,
        requested_change_data={"awarding_entity_id": proc_shop_new.id},
        requested_change_diff={"awarding_entity_id": {"old": None, "new": proc_shop_new.id}},
    )
    loaded_db.add_all([cr_status, cr_amount, cr_proc_shop])
    loaded_db.commit()

    yield loaded_db

    # Redundant with loaded_db's savepoint rollback today, but kept because Task 6+ may
    # exercise the real CLI's own session/engine outside this savepoint — revisit if that
    # never ends up happening.
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM notification"))
    loaded_db.execute(text("DELETE FROM notification_version"))
    loaded_db.execute(text("DELETE FROM change_request"))
    loaded_db.execute(text("DELETE FROM change_request_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM procurement_tracker_step"))
    loaded_db.execute(text("DELETE FROM procurement_tracker_step_version"))
    loaded_db.execute(text("DELETE FROM default_procurement_tracker"))
    loaded_db.execute(text("DELETE FROM default_procurement_tracker_version"))
    loaded_db.execute(text("DELETE FROM procurement_tracker"))
    loaded_db.execute(text("DELETE FROM procurement_tracker_version"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM contract_budget_line_item"))
    loaded_db.execute(text("DELETE FROM contract_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM procurement_action"))
    loaded_db.execute(text("DELETE FROM procurement_action_version"))
    loaded_db.execute(text("DELETE FROM agreement_history"))
    loaded_db.execute(text("DELETE FROM agreement_history_version"))
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM procurement_shop_fee"))
    loaded_db.execute(text("DELETE FROM procurement_shop_fee_version"))
    loaded_db.execute(text("DELETE FROM procurement_shop"))
    loaded_db.execute(text("DELETE FROM procurement_shop_version"))
    loaded_db.execute(text("DELETE FROM can"))
    loaded_db.execute(text("DELETE FROM can_version"))
    loaded_db.execute(text("DELETE FROM portfolio"))
    loaded_db.execute(text("DELETE FROM portfolio_version"))
    loaded_db.execute(text("DELETE FROM division"))
    loaded_db.execute(text("DELETE FROM division_version"))
    loaded_db.execute(
        text("DELETE FROM ops_user_version WHERE id IN (:director_id, :requestor_id, :approving_user_id)"),
        {
            "director_id": director.id,
            "requestor_id": requestor.id,
            "approving_user_id": approving_user.id,
        },
    )
    loaded_db.execute(
        text("DELETE FROM ops_user WHERE id IN (:director_id, :requestor_id, :approving_user_id)"),
        {
            "director_id": director.id,
            "requestor_id": requestor.id,
            "approving_user_id": approving_user.id,
        },
    )
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_fixture_loads(db_with_change_requests):
    # Guards against the sys user's id resolving to None (get_or_create_sys_user returns a
    # transient object when no sys user exists yet; it must be session.add()-ed before
    # commit for the id to populate) — a regression here would silently null out
    # created_by/updated_by on every infra row the fixture builds.
    division = db_with_change_requests.get(Division, 9100)
    assert division.created_by is not None


@pytest.fixture()
def captured_log_messages():
    """Loguru's own sink-capture pattern (there is no caplog<->loguru bridge configured
    in this codebase): add a temporary sink that appends formatted records to a list,
    yield the list, then remove the temporary sink in teardown so it can't leak into
    other tests even if an assertion in the test body fails.
    """
    messages: list[str] = []
    handler_id = logger.add(lambda message: messages.append(message.record["message"]), level="WARNING")
    try:
        yield messages
    finally:
        logger.remove(handler_id)


def test_warn_if_not_division_director_bli_change_request_director_no_warning(
    db_with_change_requests, captured_log_messages
):
    """The actual division director approving a BLI ChangeRequest should never trigger
    a warning — the fixture's Division(id=9100).division_director_id is director.id."""
    session = db_with_change_requests
    director = session.get(User, 90001)
    change_request = session.get(ChangeRequest, 91101)  # BLI status-change CR

    warn_if_not_division_director(session, change_request, director)

    assert captured_log_messages == []


def test_warn_if_not_division_director_bli_change_request_non_director_warns(
    db_with_change_requests, captured_log_messages
):
    """A non-director approving user should produce a warning (never raise, never
    block) when approving a BudgetLineItemChangeRequest."""
    session = db_with_change_requests
    approving_user = session.get(User, 90003)
    change_request = session.get(ChangeRequest, 91101)  # BLI status-change CR

    # Calling this must not raise — if it did, the test would error out here, which is
    # itself sufficient proof the function "never blocks".
    warn_if_not_division_director(session, change_request, approving_user)

    assert len(captured_log_messages) == 1
    assert "not the division director" in captured_log_messages[0]
    assert "ChangeRequest 91101" in captured_log_messages[0]


def test_warn_if_not_division_director_agreement_change_request_director_no_warning(
    db_with_change_requests, captured_log_messages
):
    """AgreementChangeRequest branch: walks agreement.budget_line_items -> can ->
    portfolio -> division to collect director/deputy ids. The fixture's single BLI
    (id=91001) is linked to CAN(id=9100) -> Portfolio(id=9100) -> Division(id=9100),
    whose director is `director`, so no warning should be logged."""
    session = db_with_change_requests
    director = session.get(User, 90001)
    change_request = session.get(ChangeRequest, 91103)  # AgreementChangeRequest (procurement shop)

    warn_if_not_division_director(session, change_request, director)

    assert captured_log_messages == []


def test_warn_if_not_division_director_agreement_change_request_non_director_warns(
    db_with_change_requests, captured_log_messages
):
    """AgreementChangeRequest branch with a non-director/non-deputy approving user
    should warn, and must not raise."""
    session = db_with_change_requests
    approving_user = session.get(User, 90003)
    change_request = session.get(ChangeRequest, 91103)  # AgreementChangeRequest (procurement shop)

    warn_if_not_division_director(session, change_request, approving_user)

    assert len(captured_log_messages) == 1
    assert "not a division director" in captured_log_messages[0]
    assert "ChangeRequest 91103" in captured_log_messages[0]


def test_warn_if_not_division_director_agreement_change_request_missing_agreement_no_warning(
    db_with_change_requests, captured_log_messages
):
    """Edge case: an AgreementChangeRequest whose agreement_id points at a non-existent
    Agreement should just return silently (no warning, no crash) per the function's
    early-return branch."""
    session = db_with_change_requests
    approving_user = session.get(User, 90003)
    change_request = session.get(ChangeRequest, 91103)
    change_request.agreement_id = 999999  # no such Agreement

    warn_if_not_division_director(session, change_request, approving_user)

    assert captured_log_messages == []


def test_warn_if_not_division_director_bli_change_request_missing_managing_division_no_warning(
    db_with_change_requests, captured_log_messages
):
    """Edge case: a BudgetLineItemChangeRequest with managing_division_id=None should
    just return silently (no warning, no crash) per the function's early-return branch."""
    session = db_with_change_requests
    approving_user = session.get(User, 90003)
    change_request = session.get(ChangeRequest, 91101)
    change_request.managing_division_id = None

    warn_if_not_division_director(session, change_request, approving_user)

    assert captured_log_messages == []


# Fixture ids, named for readability in the approve_change_request tests below.
APPROVING_USER_ID = 90003
REQUESTOR_USER_ID = 90002
STATUS_CR_ID = 91101


def test_approve_status_change_request_applies_change_and_creates_history(db_with_change_requests):
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    result = approve_change_request(session, STATUS_CR_ID, approving_user, sys_user)
    session.commit()

    assert result is True
    cr = session.get(ChangeRequest, STATUS_CR_ID)
    assert cr.status == ChangeRequestStatus.APPROVED
    assert cr.reviewed_by_id == approving_user.id
    assert cr.reviewed_on is not None
    assert "[Approved via out-of-band script" in cr.reviewer_notes

    bli = session.get(BudgetLineItem, 91001)
    assert bli.status == BudgetLineItemStatus.IN_EXECUTION

    history = (
        session.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == 9101)).scalars().all()
    )
    assert len(history) == 1
    assert approving_user.full_name in history[0].history_message

    notif = session.execute(
        select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == STATUS_CR_ID)
    ).scalar_one()
    assert notif.recipient_id == REQUESTOR_USER_ID


AMOUNT_CR_ID = 91102
PROC_SHOP_CR_ID = 91103
AGREEMENT_ID = 9101
BLI_ID = 91001


def test_approve_status_change_request_creates_procurement_tracker_and_action(db_with_change_requests):
    """Approving the status-change CR (new status IN_EXECUTION) on an agreement that is
    not yet awarded and has no existing procurement tracker/action should create a
    DefaultProcurementTracker + ProcurementAction (NEW_AWARD) for the agreement, and link
    the BLI to that new action."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    agreement = session.get(Agreement, AGREEMENT_ID)
    assert agreement.is_awarded is False

    result = approve_change_request(session, STATUS_CR_ID, approving_user, sys_user)
    session.commit()

    assert result is True

    tracker = session.execute(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.agreement_id == AGREEMENT_ID)
    ).scalar_one_or_none()
    assert tracker is not None

    action = session.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == AGREEMENT_ID)
    ).scalar_one_or_none()
    assert action is not None
    assert action.award_type == AwardType.NEW_AWARD

    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.procurement_action_id == action.id


def test_approve_amount_change_request_does_not_create_procurement_tracker_or_action(db_with_change_requests):
    """The budget-field-change CR (amount only, no status key) must NOT trigger the
    procurement tracker/action side effect."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    result = approve_change_request(session, AMOUNT_CR_ID, approving_user, sys_user)
    session.commit()

    assert result is True

    tracker = session.execute(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.agreement_id == AGREEMENT_ID)
    ).scalar_one_or_none()
    assert tracker is None

    action = session.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == AGREEMENT_ID)
    ).scalar_one_or_none()
    assert action is None

    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.procurement_action_id is None


def test_approve_amount_change_request_applies_change_and_creates_history(db_with_change_requests):
    """The budget-field-change CR (amount only) should apply the new amount to the BLI,
    create exactly one AgreementHistory row with the amount-change wording, and create
    exactly one notification addressed to the requestor."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    result = approve_change_request(session, AMOUNT_CR_ID, approving_user, sys_user)
    session.commit()

    assert result is True

    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.amount == 5000.0

    history = (
        session.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == AGREEMENT_ID))
        .scalars()
        .all()
    )
    assert len(history) == 1
    assert history[0].history_title == "Budget Change to Amount Approved"
    assert history[0].history_message == (
        "Ana Approver approved the budget change on BL 91001 from $1,000.00 to $5,000.00 as requested by "
        "Remy Requestor."
    )

    notif = session.execute(
        select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == AMOUNT_CR_ID)
    ).scalar_one()
    assert notif.recipient_id == REQUESTOR_USER_ID
    assert notif.title == "Budget Change Request APPROVED"
    assert notif.message == "Your budget change request has been approved."


def test_approve_procurement_shop_change_request_applies_change_and_creates_history(db_with_change_requests):
    """The AgreementChangeRequest (procurement-shop-change) CR should apply the new
    awarding_entity_id to the Agreement, create exactly one AgreementHistory row with
    the procurement-shop-change wording, and create exactly one notification addressed
    to the requestor."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    result = approve_change_request(session, PROC_SHOP_CR_ID, approving_user, sys_user)
    session.commit()

    assert result is True

    agreement = session.get(Agreement, AGREEMENT_ID)
    assert agreement.awarding_entity_id == 9101

    history = (
        session.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == AGREEMENT_ID))
        .scalars()
        .all()
    )
    assert len(history) == 1
    assert history[0].history_title == "Change to Procurement Shop Approved"
    assert history[0].history_message == (
        "Ana Approver approved the change on the Procurement Shop from TBD to OOBNEW as requested by "
        "Remy Requestor. This changes the fee rate from 0% to 0% and the fee total from $0.00 to $0.00."
    )

    notif = session.execute(
        select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == PROC_SHOP_CR_ID)
    ).scalar_one()
    assert notif.recipient_id == REQUESTOR_USER_ID
    assert notif.title == "Procurement Shop Change Approved"
    assert notif.message == "Your procurement shop change request has been approved."


def test_approve_procurement_shop_change_request_does_not_create_procurement_tracker_or_action(
    db_with_change_requests,
):
    """The AgreementChangeRequest (procurement-shop-change) CR is not a BLI change
    request at all, and must NOT trigger the procurement tracker/action side effect."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    result = approve_change_request(session, PROC_SHOP_CR_ID, approving_user, sys_user)
    session.commit()

    assert result is True

    tracker = session.execute(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.agreement_id == AGREEMENT_ID)
    ).scalar_one_or_none()
    assert tracker is None

    action = session.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == AGREEMENT_ID)
    ).scalar_one_or_none()
    assert action is None

    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.procurement_action_id is None


def test_approve_change_request_returns_false_for_missing_id(db_with_change_requests):
    """Step 1 guard in approve_change_request: session.get(ChangeRequest, id) returning
    None must short-circuit with no mutation and no side-effect rows — the guard logic
    itself is already implemented (Task 6); this is new coverage for it."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    history_count_before = session.execute(select(func.count()).select_from(AgreementHistory)).scalar()
    notif_count_before = session.execute(select(func.count()).select_from(ChangeRequestNotification)).scalar()

    result = approve_change_request(session, 999999999, approving_user, sys_user)  # nonexistent id

    assert result is False

    history_count_after = session.execute(select(func.count()).select_from(AgreementHistory)).scalar()
    notif_count_after = session.execute(select(func.count()).select_from(ChangeRequestNotification)).scalar()
    assert history_count_after == history_count_before
    assert notif_count_after == notif_count_before


def test_approve_change_request_returns_false_for_missing_budget_line_item_target(db_with_change_requests, monkeypatch):
    """Step 7 guard in approve_change_request: if a BudgetLineItemChangeRequest's
    budget_line_item_id points at a BLI that no longer exists, the function must skip
    (return False) rather than raise — this is the exact failure mode the CLI's
    per-record error isolation relies on surviving without aborting the whole batch.

    change_request.budget_line_item_id has an ondelete=CASCADE FK, so a real BLI
    deletion would cascade-delete the ChangeRequest too — this scenario can't be
    constructed via a live FK value. We monkeypatch Session.get to simulate the
    target genuinely being gone by the time this function looks it up, which is the
    condition the guard defends against."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    real_get = session.get

    def fake_get(model, ident, *args, **kwargs):
        if model is BudgetLineItem and ident == BLI_ID:
            return None
        return real_get(model, ident, *args, **kwargs)

    monkeypatch.setattr(session, "get", fake_get)

    history_count_before = session.execute(select(func.count()).select_from(AgreementHistory)).scalar()
    notif_count_before = session.execute(select(func.count()).select_from(ChangeRequestNotification)).scalar()

    result = approve_change_request(session, STATUS_CR_ID, approving_user, sys_user)

    assert result is False

    history_count_after = session.execute(select(func.count()).select_from(AgreementHistory)).scalar()
    notif_count_after = session.execute(select(func.count()).select_from(ChangeRequestNotification)).scalar()
    assert history_count_after == history_count_before
    assert notif_count_after == notif_count_before


def test_approve_change_request_returns_false_for_missing_agreement_target(db_with_change_requests, monkeypatch):
    """Step 7 guard in approve_change_request: if an AgreementChangeRequest's
    agreement_id points at an Agreement that no longer exists, the function must skip
    (return False) rather than raise. Same CASCADE-FK caveat as the missing-BLI test
    above — simulated via monkeypatching Session.get rather than a live FK value."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    real_get = session.get

    def fake_get(model, ident, *args, **kwargs):
        if model is Agreement and ident == AGREEMENT_ID:
            return None
        return real_get(model, ident, *args, **kwargs)

    monkeypatch.setattr(session, "get", fake_get)

    history_count_before = session.execute(select(func.count()).select_from(AgreementHistory)).scalar()
    notif_count_before = session.execute(select(func.count()).select_from(ChangeRequestNotification)).scalar()

    result = approve_change_request(session, PROC_SHOP_CR_ID, approving_user, sys_user)

    assert result is False

    history_count_after = session.execute(select(func.count()).select_from(AgreementHistory)).scalar()
    notif_count_after = session.execute(select(func.count()).select_from(ChangeRequestNotification)).scalar()
    assert history_count_after == history_count_before
    assert notif_count_after == notif_count_before


def test_approve_change_request_returns_false_for_unsupported_change_request_type(db_with_change_requests):
    """Step 3 guard in approve_change_request: a base ChangeRequest (neither a
    BudgetLineItemChangeRequest nor an AgreementChangeRequest) must be skipped."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    unsupported_cr = ChangeRequest(
        id=91199,
        change_request_type=ChangeRequestType.CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        created_by=REQUESTOR_USER_ID,
        requested_change_data={"note": "unsupported shape"},
    )
    session.add(unsupported_cr)
    session.flush()

    result = approve_change_request(session, 91199, approving_user, sys_user)

    assert result is False

    session.refresh(unsupported_cr)
    assert unsupported_cr.status == ChangeRequestStatus.IN_REVIEW
    assert unsupported_cr.reviewed_by_id is None


def test_approve_change_request_skips_already_approved(db_with_change_requests):
    """Step 2 guard in approve_change_request: a ChangeRequest whose status is not
    IN_REVIEW must be skipped before any mutation happens — proven here by manually
    approving the status-change CR with disposition values that are obviously distinct
    from what a fresh approval by `approving_user` would produce, then confirming those
    exact values (not just "some" values) survive the call untouched."""
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    cr = session.get(ChangeRequest, STATUS_CR_ID)
    original_reviewed_by_id = 90001  # director.id — distinct from approving_user.id (90003)
    original_reviewed_on = datetime(2020, 1, 1, 12, 0, 0)
    original_reviewer_notes = "Pre-existing approval, not touched by this call."
    cr.status = ChangeRequestStatus.APPROVED
    cr.reviewed_by_id = original_reviewed_by_id
    cr.reviewed_on = original_reviewed_on
    cr.reviewer_notes = original_reviewer_notes
    session.flush()

    result = approve_change_request(session, STATUS_CR_ID, approving_user, sys_user)

    assert result is False

    session.refresh(cr)
    assert cr.status == ChangeRequestStatus.APPROVED
    assert cr.reviewed_by_id == original_reviewed_by_id
    assert cr.reviewed_by_id != approving_user.id
    assert cr.reviewed_on == original_reviewed_on
    assert cr.reviewer_notes == original_reviewer_notes

    # The underlying BLI must also be untouched — proves the guard fired before the
    # BLI-mutation step, not just before the reviewed_by_id/reviewed_on writes.
    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.status == BudgetLineItemStatus.PLANNED


def test_approve_change_request_respects_dry_run(db_with_change_requests, monkeypatch):
    """DRY_RUN is not part of approve_change_request itself — it's commit_or_rollback's
    job (data_tools.src.common.utils), already used by other scripts in this codebase
    (e.g. backfill_procurement_tracker.py's main()). approve_change_request should still
    report success (it only mutates in-memory/flushed state); commit_or_rollback is what
    decides whether that mutation is persisted or rolled back."""
    monkeypatch.setenv("DRY_RUN", "1")
    session = db_with_change_requests
    sys_user = get_or_create_sys_user(session)
    approving_user = session.get(User, APPROVING_USER_ID)

    result = approve_change_request(session, STATUS_CR_ID, approving_user, sys_user)
    assert result is True

    # Sanity check the mutation actually happened in-session before the rollback, so the
    # rollback assertion below is proof of an undo, not proof that nothing ever changed.
    bli_before_rollback = session.get(BudgetLineItem, BLI_ID)
    assert bli_before_rollback.status == BudgetLineItemStatus.IN_EXECUTION

    # agreement_history_trigger_func is called with a static dry_run=True inside
    # approve_change_request regardless of the DRY_RUN env var — that only suppresses
    # its own internal session.commit(), not the AgreementHistory row itself, which
    # add_history_events() stages via session.add() unconditionally. So the staged
    # history row must already be visible in-session here, before commit_or_rollback
    # runs, confirming the rollback below actually has something to undo.
    history_before_rollback = (
        session.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == AGREEMENT_ID))
        .scalars()
        .all()
    )
    assert len(history_before_rollback) == 1

    commit_or_rollback(session)  # DRY_RUN=1 -> rolls back instead of committing

    cr = session.get(ChangeRequest, STATUS_CR_ID)
    assert cr.status == ChangeRequestStatus.IN_REVIEW
    assert cr.reviewed_by_id is None
    assert cr.reviewed_on is None

    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.status == BudgetLineItemStatus.PLANNED

    # The staged AgreementHistory row must not survive the rollback either — it's part
    # of the same unit of work as the CR/BLI mutations, discarded by the same
    # session.rollback() call inside commit_or_rollback.
    history_after_rollback = (
        session.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == AGREEMENT_ID))
        .scalars()
        .all()
    )
    assert len(history_after_rollback) == 0


@pytest.fixture()
def cli_ready_db(db_with_change_requests, db_service, monkeypatch):
    """Patch approve_change_requests' own init_db_from_config/setup_triggers/scoped_session
    references (mirroring conftest.py's loaded_db pattern, which only patches load_data's
    names) so a CliRunner invocation of this module's main() reuses the fixture's
    SAVEPOINT-wrapped session instead of opening a brand-new DB connection."""
    session = db_with_change_requests
    _, engine = db_service

    monkeypatch.setattr(
        "data_tools.src.approve_change_requests.init_db_from_config",
        lambda config: (engine, None),
    )
    monkeypatch.setattr(
        "data_tools.src.approve_change_requests.setup_triggers",
        lambda session, sys_user: None,
    )

    class _CliSessionProxy:
        """Stand-in for scoped_session that yields the test session to CLI code."""

        def __init__(self, *args, **kwargs):
            pass

        def __call__(self):
            return self

        def __enter__(self):
            return session

        def __exit__(self, *args):
            pass

        def __getattr__(self, name):
            return getattr(session, name)

    monkeypatch.setattr("data_tools.src.approve_change_requests.scoped_session", _CliSessionProxy)

    return session


def test_main_approves_and_skips_in_one_mixed_batch(cli_ready_db):
    """Task 10.6 dispatch-loop coverage: a single invocation of main() with one valid,
    approvable ChangeRequest id and one nonexistent id must approve the former, skip the
    latter, log the right summary counts, and exit 0 without letting the nonexistent id's
    False return (or any exception) propagate or abort the batch.

    The summary is asserted via a temporary loguru sink (INFO level — captured_log_messages
    is scoped to WARNING+ for the director-check tests above and would swallow this INFO
    line) rather than result.output/result.stderr: the module's logger.add(sys.stderr, ...)
    sink is bound at import time, before CliRunner.invoke() swaps sys.stderr, so Click's
    output capture never sees it."""
    session = cli_ready_db
    approving_user = session.get(User, APPROVING_USER_ID)

    info_messages: list[str] = []
    handler_id = logger.add(lambda message: info_messages.append(message.record["message"]), level="INFO")
    try:
        result = CliRunner().invoke(
            main,
            [
                "--env",
                "pytest_data_tools",
                "--approving-user-email",
                approving_user.email,
                "--change-request-id",
                str(STATUS_CR_ID),
                "--change-request-id",
                "999999999",  # nonexistent — approve_change_request returns False
            ],
        )
    finally:
        logger.remove(handler_id)

    assert result.exit_code == 0, result.output
    assert any("Approved 1 change request(s). Skipped 1." in message for message in info_messages)

    cr = session.get(ChangeRequest, STATUS_CR_ID)
    assert cr.status == ChangeRequestStatus.APPROVED
    assert cr.reviewed_by_id == approving_user.id

    bli = session.get(BudgetLineItem, BLI_ID)
    assert bli.status == BudgetLineItemStatus.IN_EXECUTION
