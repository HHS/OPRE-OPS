from decimal import Decimal

from models import CAN, BudgetLineItem, BudgetLineItemStatus, CANFundingDetails
from ops_api.ops.resources.portfolio_cans import PortfolioCansAPI


def test_portfolio_cans(auth_client, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[1]["portfolio_id"] == 1


def test_portfolio_cans_with_year_2022(auth_client, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/cans/?year=2022")
    assert response.status_code == 200
    assert len(response.json) == 0


def test_portfolio_cans_with_year_2021(auth_client, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/cans/?year=2021&budgetFiscalYear=2021")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["portfolio_id"] == 1
    assert response.json[1]["portfolio_id"] == 1
    assert len(response.json[0]["budget_line_items"]) == 0
    assert len(response.json[1]["budget_line_items"]) == 0


def test_portfolio_cans_with_budget_fiscal_year_2044(auth_client, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2044")
    assert response.status_code == 200
    assert len(response.json) == 1
    can = response.json[0]
    assert can["portfolio_id"] == 1
    assert can["number"] == "G99AB14"
    assert can["active_period"] == 5
    assert can["funding_details"]["fiscal_year"] == 2044


def test_portfolio_cans_with_budget_bad_query_params(auth_client, app_ctx):
    response = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=test")
    assert response.status_code == 400

    response_2 = auth_client.get("/api/v1/portfolios/1/cans/?year=test")
    assert response_2.status_code == 400


def test_portfolio_cans_fiscal_year_2027_child_care(auth_client):
    child_care_portfolio_id = 3
    response = auth_client.get(f"/api/v1/portfolios/{child_care_portfolio_id}/cans/?year=2027")
    funding_budgets_2027 = [budget for budget in response.json[0]["funding_budgets"] if budget["fiscal_year"] == 2027]
    assert len(response.json) == 1
    assert response.json[0]["portfolio_id"] == child_care_portfolio_id
    assert len(funding_budgets_2027) == 1
    assert funding_budgets_2027[0]["budget"] == "500000.0"


def test_blis_on_child_wellfare_research_with_budget_fiscal_year_2021(auth_client):
    child_welfare_portfolio_id = 1
    response = auth_client.get(f"/api/v1/portfolios/{child_welfare_portfolio_id}/cans/?budgetFiscalYear=2023")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert all(can["portfolio_id"] == 1 for can in response.json)

    response_fy21 = auth_client.get("/api/v1/portfolios/1/cans/?budgetFiscalYear=2021")
    assert response_fy21.status_code == 200
    assert len(response_fy21.json) == 2
    assert response_fy21.json[0]["portfolio_id"] == 1
    assert response_fy21.json[1]["portfolio_id"] == 1


def test_bli_with_null_date_needed(app, auth_client, app_ctx):
    response = auth_client.get("/api/v1/portfolios/4/cans/?budgetFiscalYear=2022")
    assert response.status_code == 200

    budget_line_item_ids = response.json[0]["budget_line_items"]

    budget_line_items = [app.db_session.get(BudgetLineItem, bli_id) for bli_id in budget_line_item_ids]

    assert len(budget_line_items) == 6
    items_with_date = [bli for bli in budget_line_items if bli.date_needed is not None]
    items_without_date = [bli for bli in budget_line_items if bli.date_needed is None]

    assert len(items_without_date) == 3
    assert all(bli.date_needed is None for bli in items_without_date)
    assert sum(bli.amount for bli in items_without_date) == Decimal("12486075.60")
    assert all(bli.status == BudgetLineItemStatus.DRAFT for bli in items_without_date)

    assert len(items_with_date) == 3
    assert all(bli.date_needed is not None for bli in items_with_date)
    assert sum(bli.amount for bli in items_with_date if bli.amount) == Decimal("4162025.0") + Decimal("4172025")
    assert all(bli.status in [BudgetLineItemStatus.PLANNED, BudgetLineItemStatus.DRAFT] for bli in items_with_date)


def test_portfolio_5_cans_with_no_budgets_sorted_by_newest(auth_client):
    response = auth_client.get("/api/v1/portfolios/5/cans/?budgetFiscalYear=2025")
    assert response.status_code == 200

    # Expected order by newest (and then by number)
    expected_cans = [
        # Numer, Funding_Details.Fiscal Year, Active Period
        ("G991234", 2025, 1),  # 2025
        ("G995678", 2025, 1),  # 2025
        ("GE7RM25", 2025, 5),  # 2025, 2026, 2027, 2028, 2029
        ("GE7RM24", 2024, 5),  # 2024, 2025, 2026, 2027, 2028
        ("GE7RM23", 2023, 5),  # 2023, 2024, 2025, 2026, 2027
        ("GE7RM22", 2022, 5),  # 2022, 2023, 2024, 2025, 2026
    ]

    assert len(response.json) == len(expected_cans)

    for idx, (expected_number, expected_year, active_period) in enumerate(expected_cans):
        can = response.json[idx]
        assert can["number"] == expected_number
        assert can["display_name"] == expected_number
        assert can["funding_details"]["fiscal_year"] == expected_year
        assert can["active_period"] == active_period
        assert can["funding_details"]["fiscal_year"] + can["active_period"] >= 2025


def test_portfolio_5_active_cans(auth_client):
    fiscal_years = {
        2026: 4,
        2027: 3,
        2028: 2,
        2029: 1,
        2030: 0,
        2024: 3,
        2023: 2,
        2022: 1,
        2021: 0,
    }

    for year, expected_count in fiscal_years.items():
        resp = auth_client.get(f"/api/v1/portfolios/5/cans/?budgetFiscalYear={year}")
        assert resp.status_code == 200
        assert len(resp.json) == expected_count


def test_portfolio_5_cans_include_inactive(auth_client):
    """Test that includeInactive=true returns all CANs regardless of active period."""
    # Without includeInactive, for year 2030, no CANs are active
    response_without_inactive = auth_client.get("/api/v1/portfolios/5/cans/?budgetFiscalYear=2030")
    assert response_without_inactive.status_code == 200
    assert len(response_without_inactive.json) == 0

    # With includeInactive=true, all CANs for portfolio 5 should be returned
    response_with_inactive = auth_client.get("/api/v1/portfolios/5/cans/?budgetFiscalYear=2030&includeInactive=true")
    assert response_with_inactive.status_code == 200

    # Should return more CANs than without includeInactive (which returned 0)
    assert len(response_with_inactive.json) > 0

    # Verify all returned CANs belong to portfolio 5
    assert all(can["portfolio_id"] == 5 for can in response_with_inactive.json)

    # Compare with a year where some CANs are active (2025 returns 6 active CANs)
    # With includeInactive=true, we should get at least as many (or more) CANs
    response_active_year = auth_client.get("/api/v1/portfolios/5/cans/?budgetFiscalYear=2025")
    assert len(response_with_inactive.json) >= len(response_active_year.json)


test_cans = [
    CAN(  # expected active years: 2000
        id=1,
        number="CAN1",
        portfolio_id=1,
        funding_details=CANFundingDetails(
            fiscal_year=2000,
            fund_code="Xp9aTq20001DBD",
        ),
    ),
    CAN(  # expected active years: 2002
        id=2,
        number="CAN2",
        portfolio_id=1,
        funding_details=CANFundingDetails(
            fiscal_year=2002,
            fund_code="M4vZr820021DAD",
        ),
    ),
    CAN(  # expected active years: 2001, 2002, 2003, 2004, 2005
        id=3,
        number="CAN3",
        portfolio_id=1,
        funding_details=CANFundingDetails(
            fiscal_year=2001,
            fund_code="bK7dLx20125DBD",
        ),
    ),
    CAN(  # expected active years: 2000, 2001, 2002, 2003, 2004
        id=4,
        number="CAN4",
        portfolio_id=1,
        funding_details=CANFundingDetails(
            fiscal_year=2000,
            fund_code="W2fYn020005DBM",
        ),
    ),
    CAN(  # expected active years: 2003, 2004, 2005, 2006, 2007
        id=5,
        number="CAN5",
        portfolio_id=1,
        funding_details=CANFundingDetails(
            fiscal_year=2003,
            fund_code="Jc6Tu920035DAD",
        ),
    ),
]


def test_include_only_active_cans():
    fiscal_years = {
        2000: 2,
        2001: 2,
        2002: 3,
        2003: 3,
        2004: 3,
        2005: 2,
        2006: 1,
        2007: 1,
    }
    for year, expected_count in fiscal_years.items():
        result = PortfolioCansAPI._include_only_active_cans(test_cans, year)
        assert len(result) == expected_count


def test_sort_by_appropriation_year():
    sorted_cans = PortfolioCansAPI._sort_by_appropriation_year(set(test_cans))
    appropriation_years = [can.funding_details.fiscal_year for can in sorted_cans]
    expected_years = sorted(appropriation_years, reverse=True)
    assert appropriation_years == expected_years


def test_sort_by_appropriation_year_with_same_year():
    cans = [
        CAN(
            id=1,
            number="CAN1",
            portfolio_id=1,
            funding_details=CANFundingDetails(
                fiscal_year=2050,
                fund_code="abcdef20001DBD",
            ),
        ),
        CAN(
            id=2,
            number="CAN2",
            portfolio_id=1,
            funding_details=CANFundingDetails(
                fiscal_year=2050,
                fund_code="abcdef20501DAD",
            ),
        ),
        CAN(
            id=3,
            number="CAN3",
            portfolio_id=1,
            funding_details=CANFundingDetails(
                fund_code="abcdef20501DAD",
            ),
        ),
        CAN(id=4, number="CAN4", portfolio_id=1),
        CAN(
            id=5,
            number="CAN5",
            portfolio_id=1,
            funding_details=CANFundingDetails(
                fiscal_year=2045,
                fund_code="abcdef20451DAD",
            ),
        ),
    ]

    sorted_cans = PortfolioCansAPI._sort_by_appropriation_year(set(cans))
    assert [can.id for can in sorted_cans] == [1, 2, 5, 3, 4]
