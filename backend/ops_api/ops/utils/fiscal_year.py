from datetime import datetime


def get_current_fiscal_year(today=datetime.now()) -> int:
    return today.year if today.month <= 9 else today.year + 1
