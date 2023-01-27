from datetime import date, datetime

import pytest
from models.base import db
from models.cans import (
    CAN,
    Agreement,
    BudgetLineItem,
    BudgetLineItemStatus,
    CANFiscalYear,
    CANFiscalYearCarryOver,
    FundingPartner,
    FundingSource,
)
from models.portfolios import Division, Portfolio, PortfolioUrl, portfolio_team_leaders
from models.research_projects import MethodologyType, PopulationType, ResearchProject
from models.users import User
from ops import create_app

TEST_DB_NAME = "testdb"


@pytest.fixture()
def app():
    app = create_app({"TESTING": True})
    # set up here
    yield app  # tear down here


@pytest.fixture()
def client(app, loaded_db):
    return app.test_client()


def pytest_addoption(parser):
    parser.addoption(
        "--dburl",
        action="store",
        default=f"sqlite:///{TEST_DB_NAME}.db",
        help="url of the database to use for tests",
    )


@pytest.fixture()
def loaded_db(app):
    # Using the db_session fixture, we have a session, with a SQLAlchemy db_engine
    # binding.

    division1 = Division(name="Division-1", abbreviation="DV1")
    division2 = Division(name="Division-2", abbreviation="DV2")
    funding_source1 = FundingSource(name="Funding-Source-1", nickname="FS1")
    funding_source2 = FundingSource(name="Funding-Source-2", nickname="FS2")
    funding_partner1 = FundingPartner(name="Funding-Partner-1", nickname="FP1")
    planned_status = BudgetLineItemStatus(status="Planned")
    in_execution_status = BudgetLineItemStatus(status="In Execution")
    obligated_status = BudgetLineItemStatus(status="Obligated")
    ag1 = Agreement(name="Agreement A11", agreement_type_id=2)

    p1 = Portfolio(name="WRGB (CCE)", status_id=1, description="blah blah")
    p2 = Portfolio(name="WCCH (ABC)", status_id=2, description="blah blah")

    p_url1 = PortfolioUrl(portfolio_id=1, url="/ops/portfolio/1")
    p_url2 = PortfolioUrl(portfolio_id=2, url="/ops/portfolio/2")

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
    cfy4 = CANFiscalYear(
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
        name="Grant Expendeture GA112",
        fiscal_year=2022,
        agreement_id=1,
        can=can1,
        funding=850450.00,
        status_id=2,
    )
    bli2 = BudgetLineItem(
        name="Line-Item-1",
        fiscal_year=2023,
        agreement_id=1,
        can=can1,
        funding=22222,
        status_id=1,
    )

    user1 = User(
        id=1,
        oidc_id="sadhfhdasgfhsadhughd",
        email="user1@example.com",
        first_name="Mister",
        last_name="Nobody",
    )

    team_leader1 = db.insert(portfolio_team_leaders).values(
        portfolio_id=1,
        team_lead_id=1,
    )

    proj_1 = ResearchProject(
        id=1,
        title="Project 1",
        short_title="ABC",
        description="Vae, salvus orexis!",
        portfolio_id=1,
        url="https://example.com",
        origination_date=date(2000, 1, 1),
    )

    method_1 = MethodologyType(name="type 1", description="Cursuss mori in tolosa!")

    pop_1 = PopulationType(name="pop 1", description="Emeritis parmas ducunt ad rumor.")

    can = CAN(id=3, number="ABCDEFG", expiration_date=date(2000, 1, 1))

    cfy5 = CANFiscalYear(
        can_id=3,
        fiscal_year=2023,
        total_fiscal_year_funding=1233123,
        current_funding=1000000,
        expected_funding=233123,
        potential_additional_funding=89000,
        can_lead="Tim",
        notes="No notes here.",
    )

    proj_1.methodologies.append(method_1)
    proj_1.populations.append(pop_1)
    proj_1.cans.append(can)

    with app.app_context():
        db.session.add(division1)
        db.session.add(division2)
        db.session.flush()

        db.session.add(funding_source1)
        db.session.add(funding_source2)
        db.session.flush()

        db.session.add(funding_partner1)
        db.session.flush()

        db.session.add(p1)
        db.session.add(p2)
        db.session.flush()

        db.session.add(p_url1)
        db.session.add(p_url2)
        db.session.flush()

        db.session.add(planned_status)
        db.session.add(in_execution_status)
        db.session.add(obligated_status)
        db.session.flush()

        db.session.add(can1)
        db.session.add(can2)
        db.session.flush()

        db.session.add(cfy1)
        db.session.add(cfy2)
        db.session.add(cfy3)
        db.session.add(cfy4)
        db.session.add(cfy5)
        db.session.flush()

        db.session.add(cfyco1)
        db.session.add(cfyco2)
        db.session.flush()

        db.session.add(bli1)
        db.session.add(bli2)
        db.session.commit()

        db.session.add(user1)
        db.session.commit()

        db.session.execute(team_leader1)
        db.session.commit()

        db.session.add(proj_1)
        db.session.flush()

        yield db


@pytest.fixture()
def app_ctx(app):
    with app.app_context():
        yield
