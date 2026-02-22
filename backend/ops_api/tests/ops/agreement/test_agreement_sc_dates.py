from datetime import date
from unittest.mock import MagicMock

from ops_api.ops.services.agreements import end_date_sort, start_date_sort


def test_sc_start_date_returns_min_of_period_starts():
    sc1 = MagicMock(period_start=date(2025, 3, 1), period_end=date(2025, 12, 31))
    sc2 = MagicMock(period_start=date(2025, 1, 15), period_end=date(2025, 6, 30))
    sc3 = MagicMock(period_start=date(2025, 6, 1), period_end=date(2026, 5, 31))

    agreement = MagicMock()
    agreement.services_components = [sc1, sc2, sc3]
    # Use the real property logic
    from models.agreements import Agreement

    agreement.sc_start_date = Agreement.sc_start_date.fget(agreement)

    assert agreement.sc_start_date == date(2025, 1, 15)


def test_sc_end_date_returns_max_of_period_ends():
    sc1 = MagicMock(period_start=date(2025, 3, 1), period_end=date(2025, 12, 31))
    sc2 = MagicMock(period_start=date(2025, 1, 15), period_end=date(2025, 6, 30))
    sc3 = MagicMock(period_start=date(2025, 6, 1), period_end=date(2026, 5, 31))

    agreement = MagicMock()
    agreement.services_components = [sc1, sc2, sc3]
    from models.agreements import Agreement

    agreement.sc_end_date = Agreement.sc_end_date.fget(agreement)

    assert agreement.sc_end_date == date(2026, 5, 31)


def test_sc_start_date_returns_none_when_no_services_components():
    agreement = MagicMock()
    agreement.services_components = []
    from models.agreements import Agreement

    result = Agreement.sc_start_date.fget(agreement)

    assert result is None


def test_sc_end_date_returns_none_when_no_services_components():
    agreement = MagicMock()
    agreement.services_components = []
    from models.agreements import Agreement

    result = Agreement.sc_end_date.fget(agreement)

    assert result is None


def test_sc_start_date_returns_none_when_scs_have_no_period_start():
    sc1 = MagicMock(period_start=None, period_end=date(2025, 12, 31))
    sc2 = MagicMock(period_start=None, period_end=date(2025, 6, 30))

    agreement = MagicMock()
    agreement.services_components = [sc1, sc2]
    from models.agreements import Agreement

    result = Agreement.sc_start_date.fget(agreement)

    assert result is None


def test_sc_end_date_returns_none_when_scs_have_no_period_end():
    sc1 = MagicMock(period_start=date(2025, 1, 1), period_end=None)
    sc2 = MagicMock(period_start=date(2025, 6, 1), period_end=None)

    agreement = MagicMock()
    agreement.services_components = [sc1, sc2]
    from models.agreements import Agreement

    result = Agreement.sc_end_date.fget(agreement)

    assert result is None


def test_sc_start_date_ignores_scs_with_no_period_start():
    sc1 = MagicMock(period_start=None, period_end=date(2025, 12, 31))
    sc2 = MagicMock(period_start=date(2025, 6, 1), period_end=date(2025, 12, 31))

    agreement = MagicMock()
    agreement.services_components = [sc1, sc2]
    from models.agreements import Agreement

    result = Agreement.sc_start_date.fget(agreement)

    assert result == date(2025, 6, 1)


def test_sc_end_date_ignores_scs_with_no_period_end():
    sc1 = MagicMock(period_start=date(2025, 1, 1), period_end=None)
    sc2 = MagicMock(period_start=date(2025, 1, 1), period_end=date(2025, 12, 31))

    agreement = MagicMock()
    agreement.services_components = [sc1, sc2]
    from models.agreements import Agreement

    result = Agreement.sc_end_date.fget(agreement)

    assert result == date(2025, 12, 31)


def test_start_date_sort_with_sc_start_date():
    agreement = MagicMock()
    agreement.sc_start_date = date(2025, 3, 1)

    result = start_date_sort(agreement)

    assert result == date(2025, 3, 1)


def test_start_date_sort_with_no_sc_start_date():
    agreement = MagicMock()
    agreement.sc_start_date = None

    result = start_date_sort(agreement)

    assert result == date.max


def test_end_date_sort_with_sc_end_date():
    agreement = MagicMock()
    agreement.sc_end_date = date(2026, 5, 31)

    result = end_date_sort(agreement)

    assert result == date(2026, 5, 31)


def test_end_date_sort_with_no_sc_end_date():
    agreement = MagicMock()
    agreement.sc_end_date = None

    result = end_date_sort(agreement)

    assert result == date.max
