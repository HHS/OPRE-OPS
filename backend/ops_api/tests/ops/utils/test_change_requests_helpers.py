from unittest.mock import Mock, patch

import pytest

from models import (
    AgreementChangeRequest,
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
@patch("ops_api.ops.utils.change_requests_helpers.get_division_directors_for_agreement")
def test_find_in_review_requests_by_user(mock_get_division_directors, mock_get_division_ids, mock_app, app_ctx):
    # Mocks 3 change requests
    cr1 = Mock(spec=BudgetLineItemChangeRequest, managing_division_id=1)
    cr2 = Mock(spec=AgreementChangeRequest, agreement="AGREEMENT")
    cr3 = Mock(spec=BudgetLineItemChangeRequest, managing_division_id=999)  # Should be filtered out

    # Mock the return values for the database session to return the 3 change requests
    mock_app.db_session.execute.return_value.scalars.return_value.all.return_value = [
        cr1,
        cr2,
        cr3,
    ]

    # Mocks the helper functions
    mock_get_division_ids.return_value = {1}
    mock_get_division_directors.return_value = ([123], [])

    result = cr_helpers.find_in_review_requests_by_user(user_id=123)
    assert cr1 in result
    assert cr2 in result
    assert cr3 not in result  # cr3 should be filtered out due to managing_division_id not being in {1}


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
