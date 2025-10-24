import datetime
from decimal import Decimal

import pytest
import sqlalchemy
from sqlalchemy import text

from data_tools.environment.pytest import PytestConfig
from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import (
    calculate_proc_fee_percentage,
    convert_master_budget_amount_string_to_date,
    convert_master_budget_amount_string_to_float,
    get_bli_status,
    get_or_create_sys_user,
    get_sc,
)
from models import BudgetLineItemStatus, ContractAgreement, ServiceRequirementType, ServicesComponent, User


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


@pytest.fixture()
def db_for_test_utils(loaded_db):
    contract = ContractAgreement(
        id=1,
        name="Test Contract",
        maps_sys_id=1,
    )

    severable_contract = ContractAgreement(
        id=2,
        name="Severable Contract",
        maps_sys_id=2,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
    )

    loaded_db.add(contract)
    loaded_db.add(severable_contract)
    loaded_db.commit()

    user = User(
        id=1,
        email="test.user@localhost",
    )

    loaded_db.add(user)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.delete(contract)
    loaded_db.delete(severable_contract)
    loaded_db.delete(user)
    loaded_db.commit()


def test_get_sc_create_new(db_for_test_utils):
    """
    Test creating a new ServicesComponent for the BLI.
    """
    sys_user = get_or_create_sys_user(db_for_test_utils)
    sc = get_sc("SC1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is False
    assert sc.display_name_for_sort == "SC1"

    sc = get_sc("OSC1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is True
    assert sc.display_name_for_sort == "OSC1"

    sc = get_sc("OY1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is True
    assert sc.display_name_for_sort == "OSC1"

    sc = get_sc("Base Period 1", 2, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is not None
    assert sc.number == 1
    assert sc.sub_component is None
    assert sc.optional is False
    assert sc.display_name_for_sort == "Base Period 1"

    sc = get_sc("Optional Period 2", 2, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is not None
    assert sc.number == 2
    assert sc.sub_component is None
    assert sc.optional is True
    assert sc.display_name_for_sort == "Optional Period 2"


def test_get_sc_get_existing(db_for_test_utils):
    """
    Test getting an existing ServicesComponent for the BLI.
    """
    existing_sc = ServicesComponent(
        number=1,
        agreement_id=1,
        optional=False,
    )
    db_for_test_utils.add(existing_sc)
    db_for_test_utils.commit()
    sys_user = get_or_create_sys_user(db_for_test_utils)

    sc = get_sc("SC1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    sc = get_sc("SC 1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    db_for_test_utils.delete(existing_sc)
    db_for_test_utils.commit()


def test_get_sc_get_existing_optional(db_for_test_utils):
    """
    Test getting an existing ServicesComponent for the BLI.
    """
    existing_sc = ServicesComponent(
        number=1,
        agreement_id=1,
        optional=True,
    )
    db_for_test_utils.add(existing_sc)
    db_for_test_utils.commit()
    sys_user = get_or_create_sys_user(db_for_test_utils)

    sc = get_sc("OSC1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    sc = get_sc("OY 1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    sc = get_sc("OT1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    sc = get_sc("OS 1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    db_for_test_utils.delete(existing_sc)
    db_for_test_utils.commit()


def test_get_sc_create_none(db_for_test_utils):
    sys_user = get_or_create_sys_user(db_for_test_utils)

    sc = get_sc(None, 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is None


def test_get_sc_get_existing_sub_component(db_for_test_utils):
    existing_sc = ServicesComponent(
        number=1,
        agreement_id=1,
        optional=False,
        sub_component="SC 1A",
    )
    db_for_test_utils.add(existing_sc)
    db_for_test_utils.commit()
    sys_user = get_or_create_sys_user(db_for_test_utils)

    sc = get_sc("SC 1A", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc == existing_sc

    db_for_test_utils.delete(existing_sc)
    db_for_test_utils.commit()


def test_get_sc_get_new_sub_component(db_for_test_utils):
    sys_user = get_or_create_sys_user(db_for_test_utils)

    sc = get_sc("SC 12.1.1", 1, ContractAgreement, session=db_for_test_utils, sys_user=sys_user)
    assert sc is not None
    assert sc.number == 12
    assert sc.sub_component == "SC 12.1.1"
    assert sc.optional is False
