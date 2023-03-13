import datetime

from ops_api.ops.utils.fiscal_year import get_current_fiscal_year


def test_get_current_fiscal_year():
    assert get_current_fiscal_year(datetime.date(2023, 9, 30)) == 2023
    assert get_current_fiscal_year(datetime.date(2023, 10, 1)) == 2024
