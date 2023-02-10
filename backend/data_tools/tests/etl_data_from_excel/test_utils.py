from data_tools.src.etl_data_from_excel.utils import clean_rows


def test_clean_rows_happy():
    data = [[1, 2, 3, 4, 5], ["blah", "blah"], [], [None, None, None], None]
    result = clean_rows(data)
    assert result == [[1, 2, 3, 4, 5], ["blah", "blah"]]
