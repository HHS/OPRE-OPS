from unittest.mock import Mock, patch

import pytest

from models import (
    AgreementChangeRequest,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
    Division,
    User,
)
from ops_api.ops.utils import change_requests_helpers as cr_helpers


def test_get_model_class_by_type_valid():
    assert cr_helpers.get_model_class_by_type(ChangeRequestType.CHANGE_REQUEST) is ChangeRequest
    assert cr_helpers.get_model_class_by_type(ChangeRequestType.AGREEMENT_CHANGE_REQUEST) is AgreementChangeRequest
    assert (
        cr_helpers.get_model_class_by_type(ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST)
        is BudgetLineItemChangeRequest
    )


def test_get_model_class_by_type_invalid():
    with pytest.raises(ValueError, match="Unsupported change request type"):
        cr_helpers.get_model_class_by_type("INVALID_TYPE")


@pytest.mark.parametrize(
    "attrs,expected_type",
    [
        ({"has_status_change": True}, "status-change"),
        ({"has_budget_change": True}, "budget-change"),
        ({"has_proc_shop_change": True}, "procurement-shop-change"),
    ],
)
def test_build_approve_url_change_types(attrs, expected_type):
    cr = Mock(spec=ChangeRequest, id=123, requested_change_data={})
    for k, v in attrs.items():
        setattr(cr, k, v)

    url = cr_helpers.build_approve_url(cr, agreement_id=42, fe_url="http://test")
    assert url.startswith("http://test/agreements/approve/42")
    assert f"type={expected_type}" in url


def test_build_approve_url_status_param():
    cr = Mock(
        spec=ChangeRequest,
        id=1,
        has_status_change=True,
        requested_change_data={"status": BudgetLineItemStatus.PLANNED.name},
    )
    url = cr_helpers.build_approve_url(cr, agreement_id=1, fe_url="http://localhost")
    assert "&to=planned" in url


def test_build_approve_url_raises_on_unrecognized():
    cr = Mock(spec=ChangeRequest, id=1)
    with pytest.raises(ValueError, match="Unrecognized change request type"):
        cr_helpers.build_approve_url(cr, agreement_id=1, fe_url="http://localhost")


def test_find_in_review_requests_by_user_with_pagination(loaded_db, app_ctx):
    dave_director = loaded_db.get(User, 522)  # Dave Director — division 4
    director_derrek = loaded_db.get(User, 525)  # Director Derrek

    # Assign Derrek as director of division 6
    division_6: Division = loaded_db.get(Division, 6)
    division_6.division_director_id = director_derrek.id
    loaded_db.flush()

    bli = loaded_db.get(BudgetLineItem, 15000)

    def make_bli_cr(division_id: int) -> BudgetLineItemChangeRequest:
        cr = BudgetLineItemChangeRequest()
        cr.status = ChangeRequestStatus.IN_REVIEW
        cr.budget_line_item_id = bli.id
        cr.agreement_id = bli.agreement_id
        cr.created_by = dave_director.id
        cr.managing_division_id = division_id
        cr.requested_change_data = {"amount": 100}
        loaded_db.add(cr)
        return cr

    cr1 = make_bli_cr(4)
    cr2 = make_bli_cr(4)
    cr3 = make_bli_cr(4)
    cr4 = make_bli_cr(6)
    loaded_db.flush()

    # Derrek can only review division 6; with a page size of 3 his lone CR still appears
    results, total = cr_helpers.find_in_review_requests_by_user(user_id=director_derrek.id, limit=3, offset=0)
    result_ids = [r.id for r in results]
    assert cr1.id not in result_ids
    assert cr2.id not in result_ids
    assert cr3.id not in result_ids
    assert cr4.id in result_ids
    assert len(results) == 1
    assert total == 1


def test_get_division_ids_user_can_review_for(loaded_db, app_ctx):
    director = User(
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
    )
    loaded_db.add(director)
    loaded_db.flush()
    assert director.id is not None

    division = Division(
        name="Health Division",
        abbreviation="HLTH",
        division_director_id=director.id,
    )
    loaded_db.add(division)
    loaded_db.flush()

    result = cr_helpers.get_division_ids_user_can_review_for(user_id=director.id)
    assert result == {division.id}

    deputy = User(
        first_name="John",
        last_name="Smith",
        email="john.smith@example.com",
    )
    loaded_db.add(deputy)
    loaded_db.flush()
    assert deputy.id is not None

    division_2 = Division(
        name="Finance Division",
        abbreviation="FIN",
        deputy_division_director_id=deputy.id,
    )
    loaded_db.add(division_2)
    loaded_db.flush()

    result = cr_helpers.get_division_ids_user_can_review_for(user_id=deputy.id)
    assert result == {division_2.id}


@patch("ops_api.ops.utils.change_requests_helpers.current_app", new_callable=Mock)
@patch("ops_api.ops.utils.change_requests_helpers.get_division_ids_user_can_review_for")
def test_find_in_review_requests_by_user(mock_get_division_ids, mock_app, app_ctx):
    cr1 = Mock(spec=BudgetLineItemChangeRequest, managing_division_id=1)
    cr2 = Mock(spec=AgreementChangeRequest, agreement_id=42)

    # execute is called twice: first for COUNT, then for the paginated results
    count_result = Mock()
    count_result.scalar.return_value = 2
    rows_result = Mock()
    rows_result.scalars.return_value.all.return_value = [cr1, cr2]
    mock_app.db_session.execute.side_effect = [count_result, rows_result]

    mock_get_division_ids.return_value = {1}

    result, total = cr_helpers.find_in_review_requests_by_user(user_id=123)
    assert cr1 in result
    assert cr2 in result
    assert total == 2


@pytest.mark.parametrize(
    "req_type,has_status_change,status,diff,expected_title,expected_msg",
    [
        (
            ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
            False,
            ChangeRequestStatus.APPROVED,
            {},
            "Procurement Shop Change Approved",
            "Your procurement shop change request has been approved.",
        ),
        (
            ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            True,
            ChangeRequestStatus.REJECTED,
            {"status": {"old": "DRAFT", "new": "PLANNED"}},
            "Budget Lines Declined from Draft to Planned Status",
            "The status change you submitted was rejected: Draft → Planned.",
        ),
        (
            ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            False,
            ChangeRequestStatus.APPROVED,
            {},
            "Budget Change Request APPROVED",
            "Your budget change request has been approved.",
        ),
    ],
)
@patch(
    "ops_api.ops.utils.change_requests_helpers.convert_BLI_status_name_to_pretty_string",
    side_effect=lambda s: s.capitalize(),
)
def test_build_review_outcome_title_and_message(
    mock_convert,
    req_type,
    has_status_change,
    status,
    diff,
    expected_title,
    expected_msg,
):
    cr = Mock(
        change_request_type=req_type,
        has_status_change=has_status_change,
        status=status,
        requested_change_diff=diff,
    )

    title, msg = cr_helpers.build_review_outcome_title_and_message(cr)
    assert title == expected_title
    assert msg == expected_msg


def test_build_review_outcome_title_and_message_invalid_status():
    cr = Mock(
        change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        has_status_change=False,
        status=ChangeRequestStatus.IN_REVIEW,  # Not APPROVED or REJECTED
        requested_change_diff={},
    )

    with pytest.raises(ValueError, match="Unsupported status: IN_REVIEW"):
        cr_helpers.build_review_outcome_title_and_message(cr)
