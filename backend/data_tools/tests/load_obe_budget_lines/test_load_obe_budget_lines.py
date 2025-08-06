import csv
import os

import pytest
from data_tools.src.load_obe_budget_lines.utils import (
    OBEBudgetLineItemData,
    create_all_budget_line_item_data,
    create_budget_line_item_data,
    mark_budget_lines_as_obe,
    validate_data,
)
from data_tools.tests.conftest import loaded_db
from sqlalchemy import select, text

from models import AgreementType, BudgetLineItem, User

file_path = os.path.join(os.path.dirname(__file__), "../../test_csv/obe_budget_lines.tsv")

def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 6
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.SYS_BUDGET_ID == 25000

def test_validate_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))
    assert len(test_data) == 6
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 6

def test_create_models_no_sys_budget_id():
    with pytest.raises(ValueError):
        OBEBudgetLineItemData(
            SYS_BUDGET_ID=None,
        )

def test_mark_budget_lines_as_obe(loaded_db):
    """Test marking budget lines as OBE"""

    session = loaded_db
    sys_user = session.query(User).first()

    # Read the TSV file
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        tsv_budget_ids = [int(row['SYS_BUDGET_ID']) for row in reader]

    # Verify the expected IDs are in the TSV
    expected_ids = [25000, 25001, 25002, 25003, 25004, 25005]
    assert tsv_budget_ids == expected_ids

    # Test the function
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f, delimiter='\t')
        data = create_all_budget_line_item_data(list(reader))  # Ensure data is created
        mark_budget_lines_as_obe(data, session, sys_user)

    # Verify results
    for budget_id in tsv_budget_ids:
        bli = session.get(BudgetLineItem, budget_id)
        if bli:
            assert bli.date_needed is None
            assert bli.obligation_date is None
            assert bli.status is None
            assert bli.can_id is None
            assert bli.is_obe == True
        else:
            assert bli is None #Checks if non-existing BLIs are being handled correctly
