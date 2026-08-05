"""
Regression tests for BudgetLineItemService._validate_agreement_for_status_change.

Test Philosophy: Integration tests (medium speed, real database)
- Tests service layer business logic with database access
- Reproduces a specific ORM-timing bug: a BLI whose ``agreement_id`` was just set
  in the same call but whose ``agreement`` relationship has not been refreshed
  from the session yet.
"""

import datetime

import pytest

from models import Agreement, BudgetLineItemStatus, ContractBudgetLineItem
from ops_api.ops.services.budget_line_items import BudgetLineItemService
from ops_api.ops.services.ops_service import ValidationError


@pytest.fixture(scope="function", autouse=True)
def mock_current_user(mocker, loaded_db):
    """Mock JWT authentication for all tests in this module."""
    from models import User

    test_user = loaded_db.query(User).first()
    if not test_user:
        test_user = type("MockUser", (), {"id": 500})()

    mocker.patch(
        "flask_jwt_extended.utils.get_jwt",
        return_value={"sub": str(test_user.id)},
    )
    mock_g = mocker.MagicMock()
    mock_g.get.return_value = {"loaded_user": test_user}
    mocker.patch("flask_jwt_extended.utils.g", mock_g)
    mocker.patch("flask_jwt_extended.get_current_user", return_value=test_user)
    mocker.patch("ops_api.ops.services.budget_line_items.get_current_user", return_value=test_user)
    mocker.patch("ops_api.ops.services.budget_line_items.current_user", test_user)

    return test_user


def test_validate_agreement_for_status_change_resolves_agreement_id_not_yet_on_relationship(loaded_db, app_ctx):
    """
    GIVEN a BLI whose agreement_id is present in updated_fields but whose
    ``agreement`` relationship has not been loaded/flushed yet (e.g. a PATCH that
    sets agreement_id and transitions status in the same request)
    WHEN _validate_agreement_for_status_change runs
    THEN it resolves the agreement via agreement_id from the session instead of
    raising AttributeError on None.__class__.get_required_fields_for_status_change()
    """
    agreement = loaded_db.query(Agreement).filter(Agreement.id == 1).one()

    bli = ContractBudgetLineItem(
        agreement_id=None,
        status=BudgetLineItemStatus.PLANNED,
        can_id=500,
        amount=100,
        date_needed=datetime.date(2044, 1, 1),
        services_component_id=None,
    )
    assert bli.agreement is None

    updated_fields = {"agreement_id": agreement.id}

    # Should not raise AttributeError; missing services_component_id on the BLI
    # itself is a separate, expected validation failure.
    BudgetLineItemService._validate_agreement_for_status_change(bli, updated_fields, loaded_db)


def test_validate_agreement_for_status_change_without_agreement_id_still_raises(loaded_db, app_ctx):
    """
    GIVEN a BLI with no agreement relationship and no agreement_id in updated_fields
    WHEN _validate_agreement_for_status_change runs
    THEN it raises a clean ValidationError instead of an AttributeError
    """
    bli = ContractBudgetLineItem(
        agreement_id=None,
        status=BudgetLineItemStatus.PLANNED,
        can_id=500,
        amount=100,
        date_needed=datetime.date(2044, 1, 1),
    )
    assert bli.agreement is None

    with pytest.raises(ValidationError) as exc_info:
        BudgetLineItemService._validate_agreement_for_status_change(bli, {}, loaded_db)

    assert "status" in exc_info.value.validation_errors
