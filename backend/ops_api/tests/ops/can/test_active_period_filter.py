"""Tests for the shared active-period filtering utility.

The functions ``is_can_active_for_year`` and ``filter_active_cans`` in
``ops_api.ops.utils.cans`` are the single source of truth for determining
whether a CAN is active for a given fiscal year. Both the nested endpoint
(``GET /portfolios/{id}/cans/``) and the flat endpoint (``GET /cans/``) rely
on these functions.

These tests verify the correctness of the shared logic independent of any
endpoint so that changes to either endpoint cannot silently break active-period
semantics.
"""

import pytest

from models import CAN, CANFundingDetails
from ops_api.ops.utils.cans import filter_active_cans, is_can_active_for_year

# ---------------------------------------------------------------------------
# Fixtures: reusable CAN objects with known active-period characteristics
# ---------------------------------------------------------------------------


def _make_can(id, number, fiscal_year, fund_code_active_period_char, portfolio_id=1):
    """Helper to build a CAN with a funding_details whose fund_code encodes the active period.

    The fund_code is 14 characters.  Character at index 10 (11th) is the active period digit.
    """
    # Template: "XXXXXXXXXX<ap>DBD" — positions 0-9 are filler, 10 is active period, 11-13 are method/freq/type
    base = f"XX{str(fiscal_year).zfill(4)}XXXX"  # 10 chars
    fund_code = f"{base}{fund_code_active_period_char}DBD"
    assert len(fund_code) == 14, f"fund_code must be 14 chars, got {len(fund_code)}: {fund_code}"
    return CAN(
        id=id,
        number=number,
        portfolio_id=portfolio_id,
        funding_details=CANFundingDetails(
            fiscal_year=fiscal_year,
            fund_code=fund_code,
        ),
    )


@pytest.fixture
def one_year_can():
    """A CAN with active_period=1, fiscal_year=2025. Active only in 2025."""
    return _make_can(1, "CAN-1YR", 2025, "1")


@pytest.fixture
def five_year_can():
    """A CAN with active_period=5, fiscal_year=2020. Active 2020-2024 (inclusive)."""
    return _make_can(2, "CAN-5YR", 2020, "5")


@pytest.fixture
def perpetual_can():
    """A CAN with active_period=0, fiscal_year=2020. Active for any year >= 2020."""
    return _make_can(3, "CAN-PERP", 2020, "0")


@pytest.fixture
def no_funding_details_can():
    """A CAN without funding_details — should never be considered active."""
    return CAN(id=4, number="CAN-NOFUND", portfolio_id=1)


@pytest.fixture
def all_cans(one_year_can, five_year_can, perpetual_can, no_funding_details_can):
    return [one_year_can, five_year_can, perpetual_can, no_funding_details_can]


# ---------------------------------------------------------------------------
# Tests for is_can_active_for_year
# ---------------------------------------------------------------------------


class TestIsCanActiveForYear:
    """Unit tests for the per-CAN active-period predicate."""

    def test_no_funding_details(self, no_funding_details_can):
        assert is_can_active_for_year(no_funding_details_can, 2025) is False

    # -- 1-year CAN --

    def test_one_year_can_before_start(self, one_year_can):
        assert is_can_active_for_year(one_year_can, 2024) is False

    def test_one_year_can_at_start(self, one_year_can):
        assert is_can_active_for_year(one_year_can, 2025) is True

    def test_one_year_can_after_end(self, one_year_can):
        assert is_can_active_for_year(one_year_can, 2026) is False

    # -- 5-year CAN (2020-2024 inclusive) --

    def test_five_year_can_before_start(self, five_year_can):
        assert is_can_active_for_year(five_year_can, 2019) is False

    def test_five_year_can_at_start(self, five_year_can):
        assert is_can_active_for_year(five_year_can, 2020) is True

    def test_five_year_can_midrange(self, five_year_can):
        assert is_can_active_for_year(five_year_can, 2022) is True

    def test_five_year_can_last_year(self, five_year_can):
        assert is_can_active_for_year(five_year_can, 2024) is True

    def test_five_year_can_just_expired(self, five_year_can):
        """2020 + 5 = 2025, so 2025 is NOT active (half-open interval)."""
        assert is_can_active_for_year(five_year_can, 2025) is False

    # -- Perpetual CAN (active_period=0, fiscal_year=2020) --

    def test_perpetual_can_before_start(self, perpetual_can):
        assert is_can_active_for_year(perpetual_can, 2019) is False

    def test_perpetual_can_at_start(self, perpetual_can):
        assert is_can_active_for_year(perpetual_can, 2020) is True

    def test_perpetual_can_far_future(self, perpetual_can):
        assert is_can_active_for_year(perpetual_can, 2099) is True


# ---------------------------------------------------------------------------
# Tests for filter_active_cans
# ---------------------------------------------------------------------------


class TestFilterActiveCans:
    """Unit tests for the bulk filtering function."""

    def test_none_cans_returns_empty_set(self):
        assert filter_active_cans(None, 2025) == set()

    def test_empty_cans_returns_empty_set(self):
        assert filter_active_cans([], 2025) == set()

    def test_no_fiscal_year_returns_all(self, all_cans):
        result = filter_active_cans(all_cans, None)
        assert result == set(all_cans)

    def test_filters_by_active_period(self, all_cans, one_year_can, five_year_can, perpetual_can):
        # 2022: five_year_can (2020-2024) and perpetual_can (2020+) are active
        result = filter_active_cans(all_cans, 2022)
        assert result == {five_year_can, perpetual_can}

    def test_all_inactive_year(self, all_cans):
        # 2019: nobody is active (all start at 2020 or later)
        result = filter_active_cans(all_cans, 2019)
        assert result == set()

    def test_only_one_year_active(self, all_cans, one_year_can, perpetual_can):
        # 2025: one_year_can (2025) and perpetual_can (2020+)
        result = filter_active_cans(all_cans, 2025)
        assert result == {one_year_can, perpetual_can}

    def test_only_perpetual_active(self, all_cans, perpetual_can):
        # 2030: only perpetual_can (2020+) is still active
        result = filter_active_cans(all_cans, 2030)
        assert result == {perpetual_can}

    def test_fiscal_year_as_string_is_cast_to_int(self, all_cans, perpetual_can):
        """The function should handle string fiscal years (from query params)."""
        result = filter_active_cans(all_cans, "2030")
        assert result == {perpetual_can}

    def test_matches_existing_test_data(self):
        """Verify against the same test data used in test_portfolio_cans.py test_include_only_active_cans."""
        test_cans = [
            _make_can(1, "CAN1", 2000, "1"),  # active: 2000
            _make_can(2, "CAN2", 2002, "1"),  # active: 2002
            _make_can(3, "CAN3", 2001, "5"),  # active: 2001-2005
            _make_can(4, "CAN4", 2000, "5"),  # active: 2000-2004
            _make_can(5, "CAN5", 2003, "5"),  # active: 2003-2007
        ]

        expected_counts = {
            2000: 2,  # CAN1, CAN4
            2001: 2,  # CAN3, CAN4
            2002: 3,  # CAN2, CAN3, CAN4
            2003: 3,  # CAN3, CAN4, CAN5
            2004: 3,  # CAN3, CAN4, CAN5
            2005: 2,  # CAN3 (2001+5=2006, so 2005 is in), CAN5
            2006: 1,  # CAN5
            2007: 1,  # CAN5
        }

        for year, expected_count in expected_counts.items():
            result = filter_active_cans(test_cans, year)
            assert (
                len(result) == expected_count
            ), f"Year {year}: expected {expected_count} active CANs, got {len(result)}"

    def test_perpetual_fund_consistency_with_active_years(self):
        """Verify that is_can_active_for_year agrees with CANFundingDetails.active_years
        for perpetual funds."""
        can = _make_can(10, "CAN-PERP-CHECK", 2020, "0")
        active_years = can.funding_details.active_years

        # Every year in active_years should pass the predicate
        for year in active_years:
            assert (
                is_can_active_for_year(can, year) is True
            ), f"Year {year} is in active_years but is_can_active_for_year returned False"

        # Years before fiscal_year should fail
        assert is_can_active_for_year(can, 2019) is False
