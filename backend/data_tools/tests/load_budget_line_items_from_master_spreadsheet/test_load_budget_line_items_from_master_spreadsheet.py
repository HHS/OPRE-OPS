import csv

from data_tools.src.load_master_spreadsheet_budget_lines.utils import create_budget_line_item_data


def test_create_budget_line_item_data():
    test_data = list(csv.DictReader(open("./test_csv/master_spreadsheet_budget_lines.tsv"), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 30
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)
