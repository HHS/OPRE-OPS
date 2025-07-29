from unittest.mock import MagicMock, patch

import pytest

from models import Agreement, BudgetLineItem, BudgetLineItemStatus, ChangeRequestType
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.ops_service import ValidationError


@pytest.fixture
def service(loaded_db):
    return AgreementsService(loaded_db)


def make_agreement(awarding_entity_id, blis):
    agreement = Agreement()
    agreement.awarding_entity_id = awarding_entity_id
    agreement.budget_line_items = blis
    return agreement


def make_bli(status):
    bli = BudgetLineItem()
    bli.status = status
    return bli


def test_no_change_if_same_awarding_entity(service):
    agreement = make_agreement(awarding_entity_id=1, blis=[])
    result = service._handle_proc_shop_change(agreement, new_value=1)
    assert result is None


@pytest.mark.parametrize(
    "status",
    [
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_raise_error_if_bli_status_is_execution_or_higher(service, status):
    blis = [make_bli(status)]
    agreement = make_agreement(awarding_entity_id=1, blis=blis)
    with pytest.raises(ValidationError):
        service._handle_proc_shop_change(agreement, new_value=2)


def test_immediate_change_with_all_draft_and_update_fees(service):
    blis = [make_bli(BudgetLineItemStatus.DRAFT), make_bli(BudgetLineItemStatus.DRAFT)]
    agreement = make_agreement(awarding_entity_id=1, blis=blis)

    with patch.object(service, "_update_draft_blis_proc_shop_fees"):
        result = service._handle_proc_shop_change(agreement, new_value=5)

    assert agreement.awarding_entity_id == 5
    assert result is None


@patch("ops_api.ops.services.agreements.get_current_user")
@patch("ops_api.ops.services.agreements.ChangeRequestService")
@patch("ops_api.ops.services.agreements.OpsEventHandler")
def test_creates_change_request_when_planned_bli(mock_event_handler, mock_cr_service, mock_get_user, service):
    blis = [make_bli(BudgetLineItemStatus.PLANNED), make_bli(BudgetLineItemStatus.DRAFT)]
    agreement = make_agreement(awarding_entity_id=1, blis=blis)

    mock_user = MagicMock()
    mock_user.id = 99
    mock_get_user.return_value = mock_user

    mock_cr = MagicMock()
    mock_cr.create.return_value.id = 101
    mock_cr_service.return_value = mock_cr

    mock_cm = MagicMock(metadata={})
    mock_event_handler.return_value.__enter__.return_value = mock_cm
    mock_event_handler.return_value.__exit__.return_value = False

    result = service._handle_proc_shop_change(agreement, new_value=7)

    mock_cr.create.assert_called_once_with(
        {
            "agreement_id": agreement.id,
            "requested_change_data": {"awarding_entity_id": 7},
            "requested_change_diff": {"awarding_entity_id": {"new": 7, "old": 1}},
            "created_by": 99,
            "change_request_type": ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        }
    )
    assert result == 101
