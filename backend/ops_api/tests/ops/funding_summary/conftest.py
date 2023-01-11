from datetime import datetime

from ops.models.cans import Agreement
from ops.models.cans import BudgetLineItem
from ops.models.cans import BudgetLineItemStatus
from ops.models.cans import CAN
from ops.models.cans import CANFiscalYear
from ops.models.cans import CANFiscalYearCarryOver
from ops.models.cans import FundingPartner
from ops.models.cans import FundingSource
import pytest

TEST_DB_NAME = "testdb"


@pytest.fixture()
def loaded_db_with_cans(app, loaded_db):
    funding_source1 = FundingSource(id=1, name="Funding-Source-1", nickname="FS1")
    funding_source2 = FundingSource(id=2, name="Funding-Source-2", nickname="FS2")
    funding_partner1 = FundingPartner(id=1, name="Funding-Partner-1", nickname="FP1")
    planned_status = BudgetLineItemStatus(id=1, status="Planned")
    in_execution_status = BudgetLineItemStatus(id=2, status="In Execution")
    obligated_status = BudgetLineItemStatus(id=3, status="Obligated")
    ag1 = Agreement(id=1, name="Agreement A11", agreement_type_id=2)
    can1 = CAN(
        id=1,
        number="G99WRGB",
        description="Secondary Analyses Data On Child Care & Early Edu",
        purpose="Secondary Analyses of Child Care and Early Education Data (2022)",
        nickname="CCE",
        arrangement_type_id=3,
        authorizer_id=1,
        managing_portfolio_id=1,
        agreements=[ag1],
        funding_sources=[funding_source1],
        expiration_date=datetime.strptime("1/1/2025", "%d/%m/%Y"),
        appropriation_term=1,
    )
    can2 = CAN(
        id=2,
        number="G990205",
        description="Secondary Analyses Data On Child Care & Early Edu",
        purpose="Secondary Analyses of Child Care and Early Education Data (2022)",
        nickname="ABCD",
        arrangement_type_id=2,
        authorizer_id=1,
        managing_portfolio_id=2,
        agreements=[ag1],
        expiration_date=datetime.strptime("1/1/2025", "%d/%m/%Y"),
        appropriation_term=1,
    )
    cfy1 = CANFiscalYear(
        can_id=1,
        fiscal_year=2022,
        total_fiscal_year_funding=1233123,
        current_funding=1000000,
        expected_funding=233123,
        potential_additional_funding=89000,
        can_lead="Tim",
        notes="No notes here.",
    )
    cfy2 = CANFiscalYear(
        can_id=1,
        fiscal_year=2023,
        total_fiscal_year_funding=4333123,
        current_funding=4000000,
        expected_funding=333123,
        potential_additional_funding=12000,
        can_lead="John",
        notes="No notes here.",
    )
    cfy3 = CANFiscalYear(
        can_id=2,
        fiscal_year=2022,
        total_fiscal_year_funding=123123,
        current_funding=1000000,
        expected_funding=233123,
        potential_additional_funding=89000,
        can_lead="Tim",
        notes="No notes here.",
    )
    cf42 = CANFiscalYear(
        can_id=2,
        fiscal_year=2023,
        total_fiscal_year_funding=4433123,
        current_funding=4000000,
        expected_funding=233123,
        potential_additional_funding=12000,
        can_lead="John",
        notes="No notes here.",
    )

    cfyco1 = CANFiscalYearCarryOver(
        can_id=1,
        from_fiscal_year=2022,
        to_fiscal_year=2023,
        amount=10,
    )

    cfyco2 = CANFiscalYearCarryOver(
        can_id=1,
        from_fiscal_year=2023,
        to_fiscal_year=2024,
        amount=5,
    )

    bli1 = BudgetLineItem(
        id=1,
        name="Grant Expendeture GA112",
        fiscal_year=2022,
        agreement_id=1,
        can=can1,
        funding=850450.00,
        status_id=2,
    )
    bli2 = BudgetLineItem(
        id=2,
        name="Line-Item-1",
        fiscal_year=2023,
        agreement_id=1,
        can=can1,
        funding=22222,
        status_id=1,
    )

    with app.app_context():
        loaded_db.session.add(funding_source1)
        loaded_db.session.add(funding_source2)
        loaded_db.session.flush()

        loaded_db.session.add(funding_partner1)
        loaded_db.session.flush()

        loaded_db.session.add(planned_status)
        loaded_db.session.add(in_execution_status)
        loaded_db.session.add(obligated_status)
        loaded_db.session.flush()

        loaded_db.session.add(can1)
        loaded_db.session.add(can2)
        loaded_db.session.flush()

        loaded_db.session.add(cfy1)
        loaded_db.session.add(cfy2)
        loaded_db.session.add(cfy3)
        loaded_db.session.add(cf42)
        loaded_db.session.flush()

        loaded_db.session.add(cfyco1)
        loaded_db.session.add(cfyco2)
        loaded_db.session.flush()

        loaded_db.session.add(bli1)
        loaded_db.session.add(bli2)
        loaded_db.session.commit()

        yield loaded_db
