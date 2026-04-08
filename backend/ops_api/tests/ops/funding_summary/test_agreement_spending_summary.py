from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from models import (
    AgreementClassification,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
)
from ops_api.ops.utils.reporting_summary import (
    _accumulate_agreement_spending,
    get_agreement_spending_by_type,
)


@pytest.fixture()
def db_with_agreement_spending_data(app, loaded_db, app_ctx):
    from models import CAN, CANFundingBudget, CANFundingDetails, Portfolio, ResearchProject

    portfolio = Portfolio(name="SPENDING TEST PORTFOLIO", division_id=1)
    can = CAN(number="SPEND_TEST_CAN")
    portfolio.cans.append(can)
    loaded_db.add(portfolio)
    loaded_db.commit()

    can_funding_details = CANFundingDetails(fiscal_year=2025, fund_code="SPENDTEST2025")
    can.funding_details = can_funding_details
    loaded_db.add(can_funding_details)
    loaded_db.commit()

    can_funding_budget = CANFundingBudget(can_id=can.id, fiscal_year=2025, budget=Decimal(50000000))
    loaded_db.add(can_funding_budget)
    loaded_db.commit()

    # Research project for the contract agreement
    project = ResearchProject(title="Test Research Project", short_title="TRP", description="Test project")
    loaded_db.add(project)
    loaded_db.commit()

    # Contract agreement (NEW - not awarded)
    contract = ContractAgreement(name="Test Contract", agreement_type=AgreementType.CONTRACT, project_id=project.id)
    loaded_db.add(contract)
    loaded_db.commit()

    bli_contract = ContractBudgetLineItem(
        line_description="Contract BLI",
        amount=Decimal("10000000"),
        status=BudgetLineItemStatus.PLANNED,
        can_id=can.id,
        date_needed=date(2025, 3, 1),
        agreement_id=contract.id,
    )
    loaded_db.add(bli_contract)
    loaded_db.commit()

    # Grant agreement (NEW - not awarded)
    grant = GrantAgreement(name="Test Grant", agreement_type=AgreementType.GRANT, project_id=project.id)
    loaded_db.add(grant)
    loaded_db.commit()

    bli_grant = GrantBudgetLineItem(
        line_description="Grant BLI",
        amount=Decimal("5000000"),
        status=BudgetLineItemStatus.OBLIGATED,
        can_id=can.id,
        date_needed=date(2025, 6, 1),
        agreement_id=grant.id,
    )
    loaded_db.add(bli_grant)
    loaded_db.commit()

    # Contract with DRAFT BLI only (should be excluded)
    contract_draft = ContractAgreement(
        name="Draft Only Contract", agreement_type=AgreementType.CONTRACT, project_id=project.id
    )
    loaded_db.add(contract_draft)
    loaded_db.commit()

    bli_draft = ContractBudgetLineItem(
        line_description="Draft BLI",
        amount=Decimal("1000000"),
        status=BudgetLineItemStatus.DRAFT,
        can_id=can.id,
        date_needed=date(2025, 1, 1),
        agreement_id=contract_draft.id,
    )
    loaded_db.add(bli_draft)
    loaded_db.commit()

    yield loaded_db

    loaded_db.rollback()
    for obj in [
        bli_draft,
        bli_grant,
        bli_contract,
        contract_draft,
        grant,
        contract,
        project,
        can_funding_budget,
        can_funding_details,
        can,
        portfolio,
    ]:
        loaded_db.delete(obj)
    loaded_db.commit()


def test_get_agreement_spending_by_type(app, db_with_agreement_spending_data, app_ctx):
    result = get_agreement_spending_by_type(app.db_session, 2025)

    assert result["total_spending"] > 0
    assert len(result["agreement_types"]) == 4

    type_map = {at["type"]: at for at in result["agreement_types"]}
    assert "CONTRACT" in type_map
    assert "PARTNER" in type_map
    assert "GRANT" in type_map
    assert "DIRECT_OBLIGATION" in type_map

    # Contract should have spending from the PLANNED BLI
    assert type_map["CONTRACT"]["total"] > 0
    assert type_map["CONTRACT"]["new"] > 0

    # Grant should have spending from the OBLIGATED BLI
    assert type_map["GRANT"]["total"] > 0
    assert type_map["GRANT"]["new"] > 0


def test_get_agreement_spending_empty_fy(app, loaded_db, app_ctx):
    result = get_agreement_spending_by_type(app.db_session, 9999)

    assert result["total_spending"] == 0.0
    assert len(result["agreement_types"]) == 4
    for at in result["agreement_types"]:
        assert at["total"] == 0.0
        assert at["new"] == 0.0
        assert at["continuing"] == 0.0


def test_draft_blis_excluded(app, db_with_agreement_spending_data, app_ctx):
    """Draft BLIs should not count as spending."""
    result = get_agreement_spending_by_type(app.db_session, 2025)
    # The draft-only contract should not contribute to spending
    # We can verify total doesn't include the 1M draft BLI
    type_map = {at["type"]: at for at in result["agreement_types"]}
    # We know there's a 10M planned contract BLI and a 5M obligated grant BLI
    # Total should NOT include the 1M draft
    assert type_map["CONTRACT"]["new"] >= 10000000.0


@patch("ops_api.ops.resources.reporting_summary.get_current_fiscal_year", return_value=2025)
def test_endpoint_default_fy(mock_fy, auth_client, db_with_agreement_spending_data, app_ctx):
    response = auth_client.get("/api/v1/reporting-summary/")
    assert response.status_code == 200
    data = response.json
    assert "spending" in data
    assert "counts" in data
    assert "total_spending" in data["spending"]
    assert "agreement_types" in data["spending"]
    assert len(data["spending"]["agreement_types"]) == 4


def test_endpoint_explicit_fy(auth_client, db_with_agreement_spending_data, app_ctx):
    response = auth_client.get("/api/v1/reporting-summary/?fiscal_year=2025")
    assert response.status_code == 200
    data = response.json
    assert data["spending"]["total_spending"] > 0


def test_endpoint_unauthorized(client):
    response = client.get("/api/v1/reporting-summary/")
    assert response.status_code == 401


def test_get_agreement_spending_with_portfolio_ids(app, db_with_agreement_spending_data, app_ctx):
    from models import CAN

    can = app.db_session.execute(app.db_session.query(CAN).filter(CAN.number == "SPEND_TEST_CAN").statement).scalar()
    portfolio_id = can.portfolio_id

    result = get_agreement_spending_by_type(app.db_session, 2025, portfolio_ids=[portfolio_id])

    assert result["total_spending"] > 0
    type_map = {at["type"]: at for at in result["agreement_types"]}
    assert type_map["CONTRACT"]["total"] > 0
    assert type_map["GRANT"]["total"] > 0


def test_get_agreement_spending_with_nonexistent_portfolio_id(app, db_with_agreement_spending_data, app_ctx):
    result = get_agreement_spending_by_type(app.db_session, 2025, portfolio_ids=[999999])

    assert result["total_spending"] == 0.0
    for at in result["agreement_types"]:
        assert at["total"] == 0.0


def test_endpoint_with_portfolio_ids(auth_client, db_with_agreement_spending_data, app_ctx):
    from flask import current_app

    from models import CAN

    can = current_app.db_session.execute(
        current_app.db_session.query(CAN).filter(CAN.number == "SPEND_TEST_CAN").statement
    ).scalar()
    portfolio_id = can.portfolio_id

    response = auth_client.get(f"/api/v1/reporting-summary/?fiscal_year=2025&portfolio_ids={portfolio_id}")
    assert response.status_code == 200
    data = response.json
    assert data["spending"]["total_spending"] > 0


@pytest.fixture()
def db_with_cross_portfolio_agreement(app, loaded_db, app_ctx):
    """Agreement with BLIs spanning two different portfolios."""
    from models import CAN, CANFundingBudget, CANFundingDetails, Portfolio, ResearchProject

    portfolio_a = Portfolio(name="CROSS PORTFOLIO A", division_id=1)
    can_a = CAN(number="CROSS_CAN_A")
    portfolio_a.cans.append(can_a)
    loaded_db.add(portfolio_a)

    portfolio_b = Portfolio(name="CROSS PORTFOLIO B", division_id=1)
    can_b = CAN(number="CROSS_CAN_B")
    portfolio_b.cans.append(can_b)
    loaded_db.add(portfolio_b)
    loaded_db.commit()

    funding_objects = []
    for can in [can_a, can_b]:
        details = CANFundingDetails(fiscal_year=2025, fund_code=f"CROSS{can.number[-1]}2025")
        can.funding_details = details
        loaded_db.add(details)
        budget = CANFundingBudget(can_id=can.id, fiscal_year=2025, budget=Decimal(50000000))
        loaded_db.add(budget)
        funding_objects.extend([budget, details])
    loaded_db.commit()

    project = ResearchProject(title="Cross Portfolio Project", short_title="CPP", description="Test")
    loaded_db.add(project)
    loaded_db.commit()

    contract = ContractAgreement(
        name="Cross Portfolio Contract", agreement_type=AgreementType.CONTRACT, project_id=project.id
    )
    loaded_db.add(contract)
    loaded_db.commit()

    bli_a = ContractBudgetLineItem(
        line_description="BLI in portfolio A",
        amount=Decimal("1000000"),
        status=BudgetLineItemStatus.PLANNED,
        can_id=can_a.id,
        date_needed=date(2025, 3, 1),
        agreement_id=contract.id,
    )
    bli_b = ContractBudgetLineItem(
        line_description="BLI in portfolio B",
        amount=Decimal("2000000"),
        status=BudgetLineItemStatus.PLANNED,
        can_id=can_b.id,
        date_needed=date(2025, 3, 1),
        agreement_id=contract.id,
    )
    loaded_db.add_all([bli_a, bli_b])
    loaded_db.commit()

    yield {
        "portfolio_a_id": portfolio_a.id,
        "portfolio_b_id": portfolio_b.id,
        "bli_a_amount": 1000000.0,
        "bli_b_amount": 2000000.0,
    }

    loaded_db.rollback()
    for obj in [bli_b, bli_a, contract, project] + funding_objects + [can_a, can_b, portfolio_a, portfolio_b]:
        loaded_db.delete(obj)
    loaded_db.commit()


def test_portfolio_filter_excludes_other_portfolio_blis(app, db_with_cross_portfolio_agreement, app_ctx):
    """Filtering by portfolio A should only include spending from BLIs in portfolio A, not B."""
    data = db_with_cross_portfolio_agreement

    result_a = get_agreement_spending_by_type(app.db_session, 2025, portfolio_ids=[data["portfolio_a_id"]])
    type_map_a = {at["type"]: at for at in result_a["agreement_types"]}
    # Should only include the 1M BLI from portfolio A, not the 2M from portfolio B
    assert type_map_a["CONTRACT"]["total"] == data["bli_a_amount"]

    result_b = get_agreement_spending_by_type(app.db_session, 2025, portfolio_ids=[data["portfolio_b_id"]])
    type_map_b = {at["type"]: at for at in result_b["agreement_types"]}
    # Should only include the 2M BLI from portfolio B
    assert type_map_b["CONTRACT"]["total"] == data["bli_b_amount"]


class TestAccumulateAgreementSpendingNoCan:
    """Tests for _accumulate_agreement_spending when BLIs have no CAN."""

    def _make_totals(self):
        return {
            "CONTRACT": {"new": Decimal(0), "continuing": Decimal(0)},
            "PARTNER": {"new": Decimal(0), "continuing": Decimal(0)},
            "GRANT": {"new": Decimal(0), "continuing": Decimal(0)},
            "DIRECT_OBLIGATION": {"new": Decimal(0), "continuing": Decimal(0)},
        }

    def test_skips_bli_with_no_can(self):
        """A BLI with can=None should not contribute to totals."""
        agreement = MagicMock()
        agreement.agreement_type = AgreementType.CONTRACT
        agreement.is_awarded = False

        bli = MagicMock()
        bli.fiscal_year = 2025
        bli.status = BudgetLineItemStatus.PLANNED
        bli.can = None
        bli.total = Decimal("10000")

        planned_bli = MagicMock()
        planned_bli.status = BudgetLineItemStatus.PLANNED
        agreement.budget_line_items = [bli, planned_bli]

        totals = self._make_totals()
        _accumulate_agreement_spending(agreement, 2025, totals)

        assert totals["CONTRACT"]["new"] == Decimal(0)
        assert totals["CONTRACT"]["continuing"] == Decimal(0)

    def test_processes_mix_of_blis_with_and_without_can(self):
        """Only BLIs with a CAN should contribute to totals."""
        agreement = MagicMock()
        agreement.agreement_type = AgreementType.CONTRACT
        agreement.award_type = AgreementClassification.NEW.name

        bli_no_can = MagicMock()
        bli_no_can.fiscal_year = 2025
        bli_no_can.status = BudgetLineItemStatus.PLANNED
        bli_no_can.can = None
        bli_no_can.total = Decimal("5000")

        bli_with_can = MagicMock()
        bli_with_can.fiscal_year = 2025
        bli_with_can.status = BudgetLineItemStatus.PLANNED
        bli_with_can.can = MagicMock()
        bli_with_can.can.portfolio_id = 1
        bli_with_can.total = Decimal("8000")

        planned_bli = MagicMock()
        planned_bli.status = BudgetLineItemStatus.PLANNED
        agreement.budget_line_items = [bli_no_can, bli_with_can, planned_bli]

        totals = self._make_totals()
        _accumulate_agreement_spending(agreement, 2025, totals)

        assert totals["CONTRACT"]["new"] == Decimal("8000")
        assert totals["CONTRACT"]["continuing"] == Decimal(0)
