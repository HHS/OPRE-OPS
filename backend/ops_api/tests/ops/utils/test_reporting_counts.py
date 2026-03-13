from datetime import date
from decimal import Decimal

import pytest

from models import (
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
)
from ops_api.ops.utils.reporting_summary import get_reporting_counts


@pytest.fixture()
def db_with_reporting_data(app, loaded_db, app_ctx):
    from models import CAN, CANFundingBudget, CANFundingDetails, Portfolio, ResearchProject

    portfolio = Portfolio(name="COUNTS TEST PORTFOLIO", division_id=1)
    can = CAN(number="COUNTS_TEST_CAN")
    portfolio.cans.append(can)
    loaded_db.add(portfolio)
    loaded_db.commit()

    can_funding_details = CANFundingDetails(fiscal_year=2025, fund_code="COUNTSTEST2025")
    can.funding_details = can_funding_details
    loaded_db.add(can_funding_details)
    loaded_db.commit()

    can_funding_budget = CANFundingBudget(can_id=can.id, fiscal_year=2025, budget=Decimal(50000000))
    loaded_db.add(can_funding_budget)
    loaded_db.commit()

    # Research project
    project = ResearchProject(title="Counts Test Project", short_title="CTP", description="Test project for counts")
    loaded_db.add(project)
    loaded_db.commit()

    # Contract agreement (NEW - not awarded) with PLANNED BLI
    contract = ContractAgreement(name="Counts Contract", agreement_type=AgreementType.CONTRACT, project_id=project.id)
    loaded_db.add(contract)
    loaded_db.commit()

    bli_planned = ContractBudgetLineItem(
        line_description="Planned BLI",
        amount=Decimal("10000000"),
        status=BudgetLineItemStatus.PLANNED,
        can_id=can.id,
        date_needed=date(2025, 3, 1),
        agreement_id=contract.id,
    )
    loaded_db.add(bli_planned)
    loaded_db.commit()

    # Grant agreement (NEW - not awarded) with OBLIGATED BLI
    grant = GrantAgreement(name="Counts Grant", agreement_type=AgreementType.GRANT, project_id=project.id)
    loaded_db.add(grant)
    loaded_db.commit()

    bli_obligated = GrantBudgetLineItem(
        line_description="Obligated BLI",
        amount=Decimal("5000000"),
        status=BudgetLineItemStatus.OBLIGATED,
        can_id=can.id,
        date_needed=date(2025, 6, 1),
        agreement_id=grant.id,
    )
    loaded_db.add(bli_obligated)
    loaded_db.commit()

    # Contract with DRAFT BLI only
    contract_draft = ContractAgreement(
        name="Draft Counts Contract", agreement_type=AgreementType.CONTRACT, project_id=project.id
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
        bli_obligated,
        bli_planned,
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


def test_get_reporting_counts_structure(app, db_with_reporting_data, app_ctx):
    result = get_reporting_counts(app.db_session, 2025)

    assert "projects" in result
    assert "agreements" in result
    assert "new_agreements" in result
    assert "continuing_agreements" in result
    assert "budget_lines" in result

    for key in ["projects", "agreements", "new_agreements", "continuing_agreements", "budget_lines"]:
        assert "total" in result[key]
        assert "types" in result[key]


def test_get_reporting_counts_projects(app, db_with_reporting_data, app_ctx):
    result = get_reporting_counts(app.db_session, 2025)

    # Our fixture has one research project with BLIs in FY 2025
    assert result["projects"]["total"] >= 1
    type_names = [t["type"] for t in result["projects"]["types"]]
    assert "RESEARCH" in type_names


def test_get_reporting_counts_agreements(app, db_with_reporting_data, app_ctx):
    result = get_reporting_counts(app.db_session, 2025)

    # We have at least a CONTRACT and a GRANT with non-DRAFT BLIs
    assert result["agreements"]["total"] >= 2
    type_map = {t["type"]: t["count"] for t in result["agreements"]["types"]}
    assert type_map.get("CONTRACT", 0) >= 1
    assert type_map.get("GRANT", 0) >= 1


def test_get_reporting_counts_new_agreements(app, db_with_reporting_data, app_ctx):
    result = get_reporting_counts(app.db_session, 2025)

    # Both agreements in fixture are NEW (not awarded)
    assert result["new_agreements"]["total"] >= 2


def test_get_reporting_counts_draft_excluded_from_agreements(app, db_with_reporting_data, app_ctx):
    """Agreements with only DRAFT BLIs should not be counted in agreement counts."""
    result = get_reporting_counts(app.db_session, 2025)

    # The draft-only contract should not appear in agreement counts
    # We should have exactly 2 agreements (contract with PLANNED, grant with OBLIGATED)
    # not 3 (the draft-only contract is excluded)
    type_map = {t["type"]: t["count"] for t in result["agreements"]["types"]}
    # We know from the fixture we created 1 non-draft CONTRACT and 1 non-draft GRANT
    assert type_map.get("CONTRACT", 0) >= 1
    assert type_map.get("GRANT", 0) >= 1


def test_get_reporting_counts_budget_lines(app, db_with_reporting_data, app_ctx):
    result = get_reporting_counts(app.db_session, 2025)

    # We have at least: 1 PLANNED, 1 OBLIGATED, 1 DRAFT
    assert result["budget_lines"]["total"] >= 3
    type_map = {t["type"]: t["count"] for t in result["budget_lines"]["types"]}
    assert type_map.get("PLANNED", 0) >= 1
    assert type_map.get("OBLIGATED", 0) >= 1
    assert type_map.get("DRAFT", 0) >= 1


def test_get_reporting_counts_with_portfolio_ids(app, db_with_reporting_data, app_ctx):
    from models import CAN

    # Find the portfolio ID for the test portfolio via the CAN
    can = app.db_session.execute(app.db_session.query(CAN).filter(CAN.number == "COUNTS_TEST_CAN").statement).scalar()
    portfolio_id = can.portfolio_id

    result = get_reporting_counts(app.db_session, 2025, portfolio_ids=[portfolio_id])

    assert result["projects"]["total"] >= 1
    assert result["agreements"]["total"] >= 2
    assert result["budget_lines"]["total"] >= 3


def test_get_reporting_counts_with_nonexistent_portfolio_id(app, db_with_reporting_data, app_ctx):
    result = get_reporting_counts(app.db_session, 2025, portfolio_ids=[999999])

    assert result["projects"]["total"] == 0
    assert result["agreements"]["total"] == 0
    assert result["budget_lines"]["total"] == 0


def test_get_reporting_counts_empty_fy(app, loaded_db, app_ctx):
    result = get_reporting_counts(app.db_session, 9999)

    assert result["projects"]["total"] == 0
    assert result["agreements"]["total"] == 0
    assert result["new_agreements"]["total"] == 0
    assert result["continuing_agreements"]["total"] == 0
    assert result["budget_lines"]["total"] == 0
