from datetime import datetime

from ops_api.ops.utils.core import is_unit_test


def get_current_fiscal_year(today=None) -> int:
    if is_unit_test():  # the fiscal year for unit tests is always 2023
        return 2023

    today = datetime.now() if today is None else today
    return today.year if today.month <= 9 else today.year + 1
