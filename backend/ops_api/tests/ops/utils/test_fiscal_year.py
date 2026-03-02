import datetime
from unittest.mock import patch

from models.utils.fiscal_year import date_to_fiscal_year, get_current_fiscal_year


def test_date_to_fiscal_year():
    """Test the shared date_to_fiscal_year utility."""
    # Jan-Sep → same calendar year
    assert date_to_fiscal_year(datetime.date(2024, 1, 1)) == 2024
    assert date_to_fiscal_year(datetime.date(2024, 9, 30)) == 2024
    # Oct-Dec → next calendar year
    assert date_to_fiscal_year(datetime.date(2024, 10, 1)) == 2025
    assert date_to_fiscal_year(datetime.date(2024, 12, 31)) == 2025


@patch("models.utils.fiscal_year.date")
def test_get_current_fiscal_year(mock_date):
    """Test get_current_fiscal_year delegates to date_to_fiscal_year(date.today())."""
    mock_date.today.return_value = datetime.date(2025, 3, 15)
    mock_date.side_effect = lambda *args, **kw: datetime.date(*args, **kw)
    assert get_current_fiscal_year() == 2025

    mock_date.today.return_value = datetime.date(2025, 11, 1)
    assert get_current_fiscal_year() == 2026
