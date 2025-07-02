import csv
import os

import pytest
from data_tools.src.load_obe_budget_lines.utils import (
    OBEBudgetLineItemData,
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
    assert data.SYS_BUDGET_ID == 15000

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

def test_mark_budget_lines_as_obe_with_file(loaded_db):
    """Test marking budget lines as OBE"""

    session = loaded_db
    sys_user = session.query(User).first()

    existing_blis = session.query(BudgetLineItem).limit(6).all()

    test_data = [{'SYS_BUDGET_ID': str(bli.id)} for bli in existing_blis[:6]]

    mark_budget_lines_as_obe(test_data, session, sys_user)

    # Verify results
    for bli in existing_blis[:6]:
        session.refresh(bli)
        assert bli.is_obe == True

# def test_mark_budget_lines_as_obe_with_actual_tsv_file_simple(loaded_db):
#     """Test marking specific budget lines as OBE using actual TSV file - requires existing data"""

#     session = loaded_db
#     sys_user = session.query(User).first()

#     # Read the TSV file
#     with open(file_path, 'r') as f:
#         reader = csv.DictReader(f, delimiter='\t')
#         tsv_budget_ids = [int(row['SYS_BUDGET_ID']) for row in reader]

#     # Verify the expected IDs are in the TSV
#     expected_ids = [15000, 15001, 15002, 15003, 15004, 15005]
#     assert tsv_budget_ids == expected_ids

#     # Ensure these records exist in the database (setup phase)
#     for budget_id in tsv_budget_ids:
#         bli = session.query(BudgetLineItem).filter(BudgetLineItem.id == budget_id).first()
#         if not bli:
#             # Create the record if it doesn't exist
#             bli = BudgetLineItem(id=budget_id, is_obe=False, created_by=sys_user.id, updated_by=sys_user.id)
#             session.add(bli)
#         else:
#             # Reset to False for testing
#             bli.is_obe = False

#     session.commit()

#     # Test the function
#     with open(file_path, 'r') as f:
#         data = csv.DictReader(f, delimiter='\t')
#         mark_budget_lines_as_obe(data, session, sys_user)

#     # Verify results - all IDs from TSV should now have is_obe=True
#     for budget_id in [15000, 15001, 15002, 15003, 15004, 15005]:
#         bli = session.query(BudgetLineItem).filter(BudgetLineItem.id == budget_id).first()
#         assert bli.is_obe == True, f"Budget line {budget_id} should be marked as OBE"
