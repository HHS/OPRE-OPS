def test_apply_change_request_data_sets_mapped_columns(loaded_db):
    from data_tools.src.approve_change_requests import apply_change_request_data
    from models import BudgetLineItemStatus, ContractBudgetLineItem

    bli = ContractBudgetLineItem(amount=100, status=BudgetLineItemStatus.PLANNED)
    apply_change_request_data(bli, {"amount": 500.0, "not_a_real_column": "ignored"})
    assert bli.amount == 500.0
    assert not hasattr(bli, "not_a_real_column") or getattr(bli, "not_a_real_column", None) != "ignored"


def test_apply_change_request_data_coerces_status_string_to_enum(loaded_db):
    from data_tools.src.approve_change_requests import apply_change_request_data
    from models import BudgetLineItemStatus, ContractBudgetLineItem

    bli = ContractBudgetLineItem(status=BudgetLineItemStatus.PLANNED)
    apply_change_request_data(bli, {"status": "IN_EXECUTION"})
    assert bli.status == BudgetLineItemStatus.IN_EXECUTION
    assert isinstance(bli.status, BudgetLineItemStatus)


def test_apply_change_request_data_coerces_date_needed_string_to_date(loaded_db):
    import datetime

    from data_tools.src.approve_change_requests import apply_change_request_data
    from models import ContractBudgetLineItem

    bli = ContractBudgetLineItem()
    apply_change_request_data(bli, {"date_needed": "2043-02-02"})
    assert bli.date_needed == datetime.date(2043, 2, 2)
    assert isinstance(bli.date_needed, datetime.date)


# ---------------------------------------------------------------------------
# build_reviewer_notes
# ---------------------------------------------------------------------------


def test_build_reviewer_notes_with_operator_note():
    from data_tools.src.approve_change_requests import build_reviewer_notes

    assert (
        build_reviewer_notes("Confirmed with COR via email")
        == "Confirmed with COR via email [Approved via out-of-band script on behalf of assigned reviewer]"
    )


def test_build_reviewer_notes_with_none():
    from data_tools.src.approve_change_requests import OUT_OF_BAND_MARKER, build_reviewer_notes

    assert build_reviewer_notes(None) == OUT_OF_BAND_MARKER


def test_build_reviewer_notes_with_empty_string():
    from data_tools.src.approve_change_requests import OUT_OF_BAND_MARKER, build_reviewer_notes

    assert build_reviewer_notes("") == OUT_OF_BAND_MARKER


# ---------------------------------------------------------------------------
# build_change_request_history_dict
# ---------------------------------------------------------------------------


def test_build_change_request_history_dict_budget_line_item_change_request(loaded_db):
    from data_tools.src.approve_change_requests import build_change_request_history_dict
    from models import BudgetLineItemChangeRequest, ChangeRequestStatus, User

    requestor_user = User(first_name="Remy", last_name="Requestor", email="remy.requestor@example.com")
    loaded_db.add(requestor_user)
    loaded_db.flush()

    change_request = BudgetLineItemChangeRequest(
        id=1,
        requested_change_data={"status": "IN_EXECUTION"},
        requested_change_diff={"status": {"old": "PLANNED", "new": "IN_EXECUTION"}},
        reviewed_by_id=42,
        status=ChangeRequestStatus.APPROVED,
        budget_line_item_id=91001,
        agreement_id=9101,
    )

    result = build_change_request_history_dict(change_request, requestor_user)

    assert set(result.keys()) == {
        "id",
        "requested_change_data",
        "requested_change_diff",
        "reviewed_by_id",
        "status",
        "budget_line_item_id",
        "agreement_id",
        "created_by_user",
    }
    assert result["id"] == 1
    assert result["requested_change_data"] == {"status": "IN_EXECUTION"}
    assert result["requested_change_diff"] == {"status": {"old": "PLANNED", "new": "IN_EXECUTION"}}
    assert result["reviewed_by_id"] == 42
    assert result["status"] == "APPROVED"
    assert result["budget_line_item_id"] == 91001
    assert result["agreement_id"] == 9101
    assert result["created_by_user"] == {"full_name": "Remy Requestor"}


def test_build_change_request_history_dict_agreement_change_request_has_no_bli_id():
    from data_tools.src.approve_change_requests import build_change_request_history_dict
    from models import AgreementChangeRequest, ChangeRequestStatus, User

    requestor_user = User(first_name="Remy", last_name="Requestor")
    change_request = AgreementChangeRequest(
        id=2,
        requested_change_data={"awarding_entity_id": 5},
        requested_change_diff={"awarding_entity_id": {"old": 1, "new": 5}},
        reviewed_by_id=42,
        status=ChangeRequestStatus.APPROVED,
        agreement_id=9101,
    )

    assert not hasattr(change_request, "budget_line_item_id")

    result = build_change_request_history_dict(change_request, requestor_user)

    assert result["budget_line_item_id"] is None
    assert result["agreement_id"] == 9101


def test_build_change_request_history_dict_no_requestor_user():
    from data_tools.src.approve_change_requests import build_change_request_history_dict
    from models import AgreementChangeRequest, ChangeRequestStatus

    change_request = AgreementChangeRequest(
        id=3,
        requested_change_data={"awarding_entity_id": 5},
        requested_change_diff={"awarding_entity_id": {"old": 1, "new": 5}},
        reviewed_by_id=42,
        status=ChangeRequestStatus.APPROVED,
        agreement_id=9101,
    )

    result = build_change_request_history_dict(change_request, None)

    assert result["created_by_user"] == {"full_name": "Unknown User"}


# ---------------------------------------------------------------------------
# convert_bli_status_to_pretty_string
# ---------------------------------------------------------------------------


def test_convert_bli_status_to_pretty_string_valid_status():
    from data_tools.src.approve_change_requests import convert_bli_status_to_pretty_string

    assert convert_bli_status_to_pretty_string("IN_EXECUTION") == "IN_EXECUTION"


def test_convert_bli_status_to_pretty_string_none_falls_back_to_draft():
    from data_tools.src.approve_change_requests import convert_bli_status_to_pretty_string

    assert convert_bli_status_to_pretty_string(None) == "DRAFT"


def test_convert_bli_status_to_pretty_string_unrecognized_falls_back_to_draft():
    from data_tools.src.approve_change_requests import convert_bli_status_to_pretty_string

    assert convert_bli_status_to_pretty_string("NOT_A_REAL_STATUS") == "DRAFT"


# ---------------------------------------------------------------------------
# build_review_outcome_notification
# ---------------------------------------------------------------------------


def test_build_review_outcome_notification_agreement_change_request():
    from data_tools.src.approve_change_requests import build_review_outcome_notification
    from models import AgreementChangeRequest, ChangeRequestStatus

    change_request = AgreementChangeRequest(
        requested_change_data={"awarding_entity_id": 5},
        status=ChangeRequestStatus.APPROVED,
        agreement_id=9101,
    )

    title, message = build_review_outcome_notification(change_request)

    assert title == "Procurement Shop Change Approved"
    assert message == "Your procurement shop change request has been approved."


def test_build_review_outcome_notification_bli_status_change():
    from data_tools.src.approve_change_requests import build_review_outcome_notification
    from models import BudgetLineItemChangeRequest, ChangeRequestStatus

    change_request = BudgetLineItemChangeRequest(
        requested_change_data={"status": "IN_EXECUTION"},
        requested_change_diff={"status": {"old": "PLANNED", "new": "IN_EXECUTION"}},
        status=ChangeRequestStatus.APPROVED,
        budget_line_item_id=91001,
        agreement_id=9101,
    )

    title, message = build_review_outcome_notification(change_request)

    assert title == "Budget Lines Approved from PLANNED to IN_EXECUTION Status"
    assert message == "The status change you submitted was approved: PLANNED → IN_EXECUTION."


def test_build_review_outcome_notification_bli_amount_change():
    from data_tools.src.approve_change_requests import build_review_outcome_notification
    from models import BudgetLineItemChangeRequest, ChangeRequestStatus

    change_request = BudgetLineItemChangeRequest(
        requested_change_data={"amount": 5000.0},
        status=ChangeRequestStatus.APPROVED,
        budget_line_item_id=91001,
        agreement_id=9101,
    )

    title, message = build_review_outcome_notification(change_request)

    assert title == "Budget Change Request APPROVED"
    assert message == "Your budget change request has been approved."


def test_build_review_outcome_notification_bli_can_id_change():
    from data_tools.src.approve_change_requests import build_review_outcome_notification
    from models import BudgetLineItemChangeRequest, ChangeRequestStatus

    change_request = BudgetLineItemChangeRequest(
        requested_change_data={"can_id": 123},
        status=ChangeRequestStatus.APPROVED,
        budget_line_item_id=91001,
        agreement_id=9101,
    )

    title, message = build_review_outcome_notification(change_request)

    assert title == "Budget Change Request APPROVED"
    assert message == "Your budget change request has been approved."


def test_build_review_outcome_notification_bli_date_needed_change():
    from data_tools.src.approve_change_requests import build_review_outcome_notification
    from models import BudgetLineItemChangeRequest, ChangeRequestStatus

    change_request = BudgetLineItemChangeRequest(
        requested_change_data={"date_needed": "2043-02-02"},
        status=ChangeRequestStatus.APPROVED,
        budget_line_item_id=91001,
        agreement_id=9101,
    )

    title, message = build_review_outcome_notification(change_request)

    assert title == "Budget Change Request APPROVED"
    assert message == "Your budget change request has been approved."


def test_build_review_outcome_notification_bli_unmatched_returns_none_none():
    from data_tools.src.approve_change_requests import build_review_outcome_notification
    from models import BudgetLineItemChangeRequest, ChangeRequestStatus

    change_request = BudgetLineItemChangeRequest(
        requested_change_data={},
        status=ChangeRequestStatus.APPROVED,
        budget_line_item_id=91001,
        agreement_id=9101,
    )

    title, message = build_review_outcome_notification(change_request)

    assert (title, message) == (None, None)
