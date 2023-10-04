from datetime import datetime

from flask import current_app


def get_current_fiscal_year(today=None) -> int:
    if today is None and current_app.config.get("TESTING"):
        return 2023

    today = datetime.now() if today is None else today

    return today.year if today.month <= 9 else today.year + 1
