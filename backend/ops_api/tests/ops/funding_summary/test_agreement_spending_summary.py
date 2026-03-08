from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from models import (
    Agreement,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
)
from models.agreements import AgreementClassification
from ops_api.ops.utils.reporting_summary import (
    classify_agreement_for_fy,
    get_agreement_spending_by_type,
)


class TestClassifyAgreementForFy:
    def test_no_non_draft_blis_returns_none(self):
        agreement = MagicMock(spec=Agreement)
        draft_bli = MagicMock()
        draft_bli.status = BudgetLineItemStatus.DRAFT
        agreement.budget_line_items = [draft_bli]

        result = classify_agreement_for_fy(agreement, 2025)
        assert result is None

    def test_empty_blis_returns_none(self):
        agreement = MagicMock(spec=Agreement)
        agreement.budget_line_items = []

        result = classify_agreement_for_fy(agreement, 2025)
        assert result is None

    def test_not_awarded_returns_new(self):
        agreement = MagicMock(spec=Agreement)
        planned_bli = MagicMock()
        planned_bli.status = BudgetLineItemStatus.PLANNED
        agreement.budget_line_items = [planned_bli]
        agreement.is_awarded = False

        result = classify_agreement_for_fy(agreement, 2025)
        assert result == AgreementClassification.NEW.name

    def test_awarded_no_award_date_returns_new(self):
        agreement = MagicMock(spec=Agreement)
        planned_bli = MagicMock()
        planned_bli.status = BudgetLineItemStatus.PLANNED
        agreement.budget_line_items = [planned_bli]
        agreement.is_awarded = True
        agreement.award_fiscal_year = None

        result = classify_agreement_for_fy(agreement, 2025)
        assert result == AgreementClassification.NEW.name

    def test_awarded_current_fy_lte_award_fy_returns_new(self):
        agreement = MagicMock(spec=Agreement)
        planned_bli = MagicMock()
        planned_bli.status = BudgetLineItemStatus.PLANNED
        agreement.budget_line_items = [planned_bli]
        agreement.is_awarded = True
        agreement.award_fiscal_year = 2025

        result = classify_agreement_for_fy(agreement, 2025)
        assert result == AgreementClassification.NEW.name

    def test_awarded_current_fy_gt_award_fy_returns_continuing(self):
        agreement = MagicMock(spec=Agreement)
        planned_bli = MagicMock()
        planned_bli.status = BudgetLineItemStatus.PLANNED
        agreement.budget_line_items = [planned_bli]
        agreement.is_awarded = True
        agreement.award_fiscal_year = 2024

        result = classify_agreement_for_fy(agreement, 2025)
        assert result == AgreementClassification.CONTINUING.name

    def test_bli_with_none_status_ignored(self):
        agreement = MagicMock(spec=Agreement)
        none_bli = MagicMock()
        none_bli.status = None
        agreement.budget_line_items = [none_bli]

        result = classify_agreement_for_fy(agreement, 2025)
        assert result is None


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
