import pytest

from models import (
    CAN,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    Division,
    Portfolio,
    User,
    UserStatus,
)
from ops_api.ops.utils.budget_line_items_helpers import (
    convert_BLI_status_name_to_pretty_string,
    get_division_for_budget_line_item,
    update_data,
)


@pytest.mark.parametrize(
    "input_status,expected",
    [
        ("DRAFT", str(BudgetLineItemStatus.DRAFT)),
        ("PLANNED", str(BudgetLineItemStatus.PLANNED)),
        ("IN_EXECUTION", str(BudgetLineItemStatus.IN_EXECUTION)),
        ("OBLIGATED", str(BudgetLineItemStatus.OBLIGATED)),
        ("UNKNOWN", str(BudgetLineItemStatus.DRAFT)),
    ],
)
def test_convert_bli_status_name_to_pretty_string(input_status, expected):
    assert convert_BLI_status_name_to_pretty_string(input_status) == expected


def test_get_division_for_budget_line_item_real_query(loaded_db, app_ctx):
    director = User(
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
        status=UserStatus.ACTIVE,
    )
    loaded_db.add(director)
    loaded_db.flush()  # to assign director.id

    division = Division(name="Health Division", abbreviation="HLTH", division_director_id=director.id)
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(
        name="COVID Portfolio",
        description="Portfolio for COVID related projects",
        abbreviation="COVID",
        division_id=division.id,
    )
    loaded_db.add(portfolio)
    loaded_db.flush()

    can = CAN(number="CAN-2025", portfolio_id=portfolio.id)
    loaded_db.add(can)
    loaded_db.flush()

    bli = ContractBudgetLineItem(
        line_description="COVID Supplies",
        agreement_id=1,
        can_id=can.id,
        amount=123456.78,
        status=BudgetLineItemStatus.DRAFT,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    try:
        result = get_division_for_budget_line_item(bli.id)

        assert result is not None
        assert isinstance(result, Division)
        assert result.id == division.id
        assert result.name == "Health Division"
        assert result.abbreviation == "HLTH"
        assert result.division_director_full_name == "Jane Doe"
    finally:
        loaded_db.delete(bli)
        loaded_db.delete(can)
        loaded_db.delete(portfolio)  # must delete this before division
        loaded_db.flush()
        loaded_db.delete(division)
        loaded_db.delete(director)
        loaded_db.commit()


def test_update_data_only_valid_fields():
    bli = ContractBudgetLineItem(
        line_description="Original Description",
        agreement_id=1,
        can_id=500,
        amount=1000.0,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )

    data = {
        "line_description": "Updated Description",  # valid
        "amount": 2000.0,  # valid
        "status": BudgetLineItemStatus.PLANNED,  # valid
        "invalid_field": "should be ignored",  # invalid
    }

    update_data(bli, data)

    assert bli.line_description == "Updated Description"
    assert bli.amount == 2000.0
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert not hasattr(bli, "invalid_field")


def test_update_data_empty_dict():
    bli = ContractBudgetLineItem(
        line_description="Test Description",
        agreement_id=1,
        can_id=500,
        amount=100.0,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.0,
        created_by=1,
    )

    original_values = bli.to_dict()
    update_data(bli, {})  # Nothing should change
    assert bli.to_dict() == original_values
