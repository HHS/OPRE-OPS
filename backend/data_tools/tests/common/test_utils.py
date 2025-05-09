import sqlalchemy
from data_tools.environment.pytest import PytestConfig
from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import convert_master_budget_amount_string_to_float


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
