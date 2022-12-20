from datetime import datetime

from ops import create_app
from ops.models.cans import Agreement
from ops.models.cans import BudgetLineItem
from ops.models.cans import BudgetLineItemStatus
from ops.models.cans import CAN
from ops.models.cans import CANFiscalYear
from ops.models.cans import CANFiscalYearCarryOver
from ops.models.cans import FundingPartner
from ops.models.cans import FundingSource
from ops.models.portfolios import Division
from ops.models.portfolios import Portfolio
from ops.models.portfolios import PortfolioDescriptionText
from ops.models.portfolios import PortfolioUrl
from ops.models.base import db
from ops.models.users import User
import pytest

TEST_DB_NAME = "testdb"


@pytest.fixture()
def app():
    app = create_app({"TESTING": True})
    # set up here
    yield app
    # tear down here


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


#
# @pytest.fixture(scope="session")
# def db_engine(request):
#     """yields a SQLAlchemy engine which is suppressed after the test session"""
#     db_url = request.config.getoption("--dburl")
#     engine_ = create_engine(db_url, echo=True)
#
#     yield engine_
#
#     engine_.dispose()


# @pytest.fixture(scope="session")
# def db_session_factory(db_engine):
#     """returns a SQLAlchemy scoped session factory"""
#     return scoped_session(sessionmaker(bind=db_engine))

#
# @pytest.fixture(scope="function")
# def db_session(db_session_factory):
#     """yields a SQLAlchemy connection which is rollbacked after the test"""
#     session_ = db_session_factory()
#
#     yield session_
#
#     session_.rollback()
#     session_.close()


# @pytest.fixture(scope="function")
# def db_tables(db_engine):
#     # AgreementType.metadata.create_all(db_engine)
#     # Agreement.metadata.create_all(db_engine)
#     # CAN.metadata.create_all(db_engine)
#     # CANFiscalYear.metadata.create_all(db_engine)
#     # BudgetLineItem.metadata.create_all(db_engine)
#     # Portfolio.metadata.create_all(db_engine)
#     BaseModel.metadata.create_all(db_engine)
#     yield
#     BaseModel.metadata.drop_all(db_engine)
#     # AgreementType.metadata.drop_all(db_engine)
#     # Agreement.metadata.drop_all(db_engine)
#     # CAN.metadata.drop_all(db_engine)
#     # CANFiscalYear.metadata.drop_all(db_engine)
#     # BudgetLineItem.metadata.drop_all(db_engine)
#     # Portfolio.metadata.drop_all(db_engine)


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
    # contract = AgreementType(name="Contract")
    # grant = AgreementType(name="Grant")
    # direct = AgreementType(name="Direct Allocation")
    # iaa = AgreementType(name="IAA")
    # misc = AgreementType(name="Miscellaneous")
    # opre_appropriation=CANArrangementType(name="OPRE Appropriation")
    # cost_share=CANArrangementType(name="Cost Share")
    # iaa_arrangement=CANArrangementType(name="IAA")
    # idda=CANArrangementType(name="IDDA")
    # mou=CANArrangementType(name="MOU")
    ag1 = Agreement(name="Agreement A11", agreement_type_id=2)

    p1 = Portfolio(name="WRGB (CCE)", status_id=1)
    p2 = Portfolio(name="WCCH (ABC)", status_id=2)

    p_url1 = PortfolioUrl(portfolio_id=1, url="/ops/portfolio/1")
    p_url2 = PortfolioUrl(portfolio_id=2, url="/ops/portfolio/2")

    p_description_1 = PortfolioDescriptionText(id=1, portfolio_id=1, text="blah blah")

    can1 = CAN(
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
    # pc1 = portfolio_cans.insert().values({"portfolio_id": "1", "can_id": "1"})
    # pc2 = portfolio_cans.insert().values({"portfolio_id": "1", "can_id": "2"})
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

    user1 = User(id=1, oidc_id="sadhfhdasgfhsadhughd", email="user1@example.com")

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

        db.session.add(p_description_1)
        db.session.flush()

        db.session.add(planned_status)
        db.session.add(in_execution_status)
        db.session.add(obligated_status)
        # db_session.add(contract)
        # db_session.add(grant)
        # db_session.add(direct)
        # db_session.add(iaa)
        # db_session.add(misc)
        db.session.flush()

        # db_session.add(opre_appropriation)
        # db_session.add(cost_share)
        # db_session.add(iaa_arrangement)
        # db_session.add(idda)
        # db_session.add(mou)
        # db_session.flush()

        db.session.add(can1)
        db.session.add(can2)
        db.session.flush()

        db.session.add(cfy1)
        db.session.add(cfy2)
        db.session.add(cfy3)
        db.session.add(cf42)
        db.session.flush()

        db.session.add(cfyco1)
        db.session.add(cfyco2)
        db.session.flush()

        db.session.add(bli1)
        db.session.add(bli2)
        # db_session.add(pc1)
        # db_session.add(pc2)
        db.session.commit()

        db.session.add(user1)
        db.session.commit()

        yield db


@pytest.fixture()
def app_ctx(app):
    with app.app_context():
        yield
