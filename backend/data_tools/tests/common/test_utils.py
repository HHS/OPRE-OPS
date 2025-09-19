import datetime
from decimal import Decimal

import pytest
import sqlalchemy
from data_tools.environment.pytest import PytestConfig
from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import (
    calculate_proc_fee_percentage,
    convert_master_budget_amount_string_to_date,
    convert_master_budget_amount_string_to_float,
    get_bli_status,
)

from models import BudgetLineItemStatus


def test_init_db(db_service):
    _, engine = db_service
    engine, metadata_obj = init_db_from_config(PytestConfig(), engine)
    assert isinstance(engine, sqlalchemy.engine.Engine)
    assert isinstance(metadata_obj, sqlalchemy.MetaData)


def test_convert_master_budget_amount_string_to_float():
    # Test standard format with dollar sign, spaces and commas
    assert convert_master_budget_amount_string_to_float("$ 234,1552,303.08") == 2341552303.08

    # Test simple numeric string
    assert convert_master_budget_amount_string_to_float("73364.08") == 73364.08

    # Test string with dollar sign only
    assert convert_master_budget_amount_string_to_float("$42750.00") == 42750.00

    # Test string with comma separators
    assert convert_master_budget_amount_string_to_float("35,558.43") == 35558.43

    # Test string with spaces
    assert convert_master_budget_amount_string_to_float(" 10216.43 ") == 10216.43

    # Test string with negative value (function removes the '-')
    assert convert_master_budget_amount_string_to_float("-2916.56") == 2916.56

    # Test string with mixed formats
    assert convert_master_budget_amount_string_to_float("$ 4,715.33") == 4715.33

    # Test empty string
    assert convert_master_budget_amount_string_to_float("") is None

    # Test invalid string
    assert convert_master_budget_amount_string_to_float("not a number") is None

    # Test edge cases
    assert convert_master_budget_amount_string_to_float("$0.00") == 0.0
    assert convert_master_budget_amount_string_to_float("$,,,") is None

def test_convert_master_budget_amount_string_to_date():
    # Test standard date format
    assert convert_master_budget_amount_string_to_date("2023-10-15") == datetime.date(2023, 10, 15)
    assert convert_master_budget_amount_string_to_date("10/15/2023") == datetime.date(2023, 10, 15)
    assert convert_master_budget_amount_string_to_date("10-15-2023") == datetime.date(2023, 10, 15)
    assert convert_master_budget_amount_string_to_date("10/15/23") == datetime.date(2023, 10, 15)
    assert convert_master_budget_amount_string_to_date("10-15-23") == datetime.date(2023, 10, 15)
    assert convert_master_budget_amount_string_to_date("15 Oct 2023") is None


@pytest.mark.parametrize(
    "pro_fee_amount, amount, expected_result",
    [
        (Decimal("1087.49"), Decimal("15203.08"), Decimal("0.07153")),
        (Decimal("100.00"), Decimal("0.00"), None),
        (Decimal("0.00"), Decimal("5000.00"), None),
        (None, Decimal("1000.00"), None),
        (Decimal("100.00"), None, None),
        (None, None, None),
        (Decimal("1"), Decimal("3"), Decimal("0.33333")),
    ],
)
def test_calculate_proc_fee_percentage(pro_fee_amount, amount, expected_result):
    result = calculate_proc_fee_percentage(pro_fee_amount, amount)
    assert result == expected_result


@pytest.mark.parametrize(
    "status_input, expected_status",
    [
        ("OPRE - CURRENT", BudgetLineItemStatus.PLANNED),
        ("PSC - EXECUTION", BudgetLineItemStatus.IN_EXECUTION),
        ("OBL", BudgetLineItemStatus.OBLIGATED),
        ("COM", BudgetLineItemStatus.IN_EXECUTION),
        ("unknown", None),
        ("", None),
        (None, None),
    ],
)
def test_get_bli_status(status_input, expected_status):
    assert get_bli_status(status_input) == expected_status
