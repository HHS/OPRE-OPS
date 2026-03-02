from datetime import date


def date_to_fiscal_year(d: date) -> int:
    """Convert a date to its federal fiscal year (Oct 1 = start of next FY)."""
    return d.year + 1 if d.month >= 10 else d.year


def get_current_fiscal_year() -> int:
    """Return the current federal fiscal year."""
    return date_to_fiscal_year(date.today())
