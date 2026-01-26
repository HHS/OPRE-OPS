import datetime
from unittest.mock import patch

from ops_api.ops.utils.fiscal_year import get_current_fiscal_year


def test_get_current_fiscal_year(app_ctx):
    assert get_current_fiscal_year() == 2023

    # simulate running outside of unit tests - getenv is used in is_unit_test
    with patch("os.getenv", return_value=""):
        assert get_current_fiscal_year(datetime.date(2023, 9, 30)) == 2023
        assert get_current_fiscal_year(datetime.date(2023, 10, 1)) == 2024
