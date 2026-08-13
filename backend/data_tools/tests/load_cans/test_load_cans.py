import csv

import pytest
from click.testing import CliRunner
from sqlalchemy import and_, text

from data_tools.environment.dev import DevConfig
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.import_static_data.import_data import get_config
from data_tools.src.load_cans.utils import (
    CANData,
    create_can_data,
    create_models,
    get_or_create_funding_details,
    validate_all,
    validate_data,
    validate_fund_code,
)
from data_tools.src.load_data import main
from models import *  # noqa: F403, F401


@pytest.fixture()
def db_with_divisions(loaded_db):
    division = loaded_db.get(Division, 999)

    if not division:
        division = Division(
            id=999,
            name="Fake Division",
            abbreviation="FD",
        )
        loaded_db.merge(division)
        loaded_db.commit()

    yield loaded_db


@pytest.fixture()
def db_with_portfolios(db_with_divisions):
    portfolio_1 = Portfolio(
        id=1,
        abbreviation="HMRF",
        name="Healthy Marriages Responsible Fatherhood",
        division_id=999,
    )

    portfolio_2 = Portfolio(
        id=2,
        abbreviation="CC",
        name="Child Care",
        division_id=999,
    )

    portfolio_3 = Portfolio(
        id=3,
        abbreviation="NON-OPRE",
        name="Non OPRE",
        division_id=999,
    )

    if not db_with_divisions.get(Portfolio, 1):
        db_with_divisions.add(portfolio_1)

    if not db_with_divisions.get(Portfolio, 2):
        db_with_divisions.add(portfolio_2)

    if not db_with_divisions.get(Portfolio, 3):
        db_with_divisions.add(portfolio_3)

    db_with_divisions.commit()

    # Persist the system user so it has a real id — CANHistory event recording needs to look
    # it up by id, which fails on a transient (unpersisted) User.
    sys_user = get_or_create_sys_user(db_with_divisions)
    if sys_user.id is None:
        db_with_divisions.add(sys_user)
        db_with_divisions.commit()

    yield db_with_divisions

    # Cleanup
    db_with_divisions.execute(text("DELETE FROM can_history"))
    db_with_divisions.execute(text("DELETE FROM can_history_version"))
    db_with_divisions.execute(text("DELETE FROM can"))
    db_with_divisions.execute(text("DELETE FROM can_funding_details"))
    db_with_divisions.execute(text("DELETE FROM can_version"))
    db_with_divisions.execute(text("DELETE FROM can_funding_details_version"))
    db_with_divisions.execute(text("DELETE FROM ops_db_history"))
    db_with_divisions.execute(text("DELETE FROM ops_db_history_version"))

    db_with_divisions.execute(text("DELETE FROM portfolio"))
    db_with_divisions.execute(text("DELETE FROM portfolio_version"))


def test_get_config_default():
    assert isinstance(get_config(), DevConfig)


def test_create_can_data():
    test_data = list(csv.DictReader(open("test_csv/can_invalid.tsv"), dialect="excel-tab"))

    assert len(test_data) == 17

    assert create_can_data(test_data[0]).SYS_CAN_ID == 500
    assert create_can_data(test_data[0]).CAN_NBR == "G99HRF2"
    assert create_can_data(test_data[0]).CAN_DESCRIPTION == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert create_can_data(test_data[0]).FUND == "AAXXXX20231DAD"
    assert create_can_data(test_data[0]).ALLOWANCE == "0000000001"
    assert create_can_data(test_data[0]).ALLOTMENT_ORG == "YZC6S1JUGUN"
    assert create_can_data(test_data[0]).SUB_ALLOWANCE == "9KRZ2ND"
    assert create_can_data(test_data[0]).CURRENT_FY_FUNDING_YTD == 880000.0
    assert create_can_data(test_data[0]).APPROP_PREFIX == "XX"
    assert create_can_data(test_data[0]).APPROP_POSTFIX == "XXXX"
    assert create_can_data(test_data[0]).APPROP_YEAR == "23"
    assert create_can_data(test_data[0]).PORTFOLIO == "HMRF"
    assert create_can_data(test_data[0]).FUNDING_SOURCE is None
    assert create_can_data(test_data[0]).METHOD_OF_TRANSFER == "DIRECT"
    assert create_can_data(test_data[0]).NICK_NAME == "HMRF-OPRE"


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/can_invalid.tsv"), dialect="excel-tab"))
    assert len(test_data) == 17
    count = sum(1 for data in test_data if validate_data(create_can_data(data)))
    assert count == 17


def test_validate_all():
    test_data = list(csv.DictReader(open("test_csv/can_invalid.tsv"), dialect="excel-tab"))
    assert len(test_data) == 17
    can_data = [create_can_data(data) for data in test_data]
    assert validate_all(can_data) is True


def test_validate_data_requires_portfolio_when_sys_can_id_blank():
    """A row with no SYS_CAN_ID can only create a brand-new CAN, so PORTFOLIO must be present at
    validation time — a batch with such a row should fail atomically before any row is processed,
    rather than partway through after preceding rows have already been committed."""
    data = CANData(FISCAL_YEAR=2023, CAN_NBR="G99NEW1", FUND="AAXXXX20231DAD", PORTFOLIO=None)
    assert validate_data(data) is False


def test_validate_data_allows_blank_portfolio_when_sys_can_id_present():
    """A row with a SYS_CAN_ID may be updating an existing CAN, where a blank PORTFOLIO is
    legitimate (the existing portfolio is left untouched) — validate_data should not reject it."""
    data = CANData(FISCAL_YEAR=2023, SYS_CAN_ID=500, CAN_NBR="G99HRF2", FUND="AAXXXX20231DAD", PORTFOLIO=None)
    assert validate_data(data) is True


def test_create_models_no_can_nbr():
    with pytest.raises(ValueError):
        CANData(
            FISCAL_YEAR=2023,
            SYS_CAN_ID=500,
            CAN_NBR=None,
            CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
            FUND="AAXXXX20231DAD",
            ALLOWANCE="0000000001",
            ALLOTMENT_ORG="YZC6S1JUGUN",
            SUB_ALLOWANCE="9KRZ2ND",
            CURRENT_FY_FUNDING_YTD=880000.0,
            APPROP_PREFIX="XX",
            APPROP_POSTFIX="XXXX",
            APPROP_YEAR="23",
            PORTFOLIO="HMRF",
            FUNDING_SOURCE="OPRE",
            METHOD_OF_TRANSFER="DIRECT",
            NICK_NAME="HMRF-OPRE",
        )

    with pytest.raises(ValueError):
        CANData(
            FISCAL_YEAR=2023,
            SYS_CAN_ID=500,
            CAN_NBR="",
            CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
            FUND="AAXXXX20231DAD",
            ALLOWANCE="0000000001",
            ALLOTMENT_ORG="YZC6S1JUGUN",
            SUB_ALLOWANCE="9KRZ2ND",
            CURRENT_FY_FUNDING_YTD=880000.0,
            APPROP_PREFIX="XX",
            APPROP_POSTFIX="XXXX",
            APPROP_YEAR="23",
            PORTFOLIO="HMRF",
            FUNDING_SOURCE="OPRE",
            METHOD_OF_TRANSFER="DIRECT",
            NICK_NAME="HMRF-OPRE",
        )


def test_create_models(db_with_portfolios):
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_with_portfolios)

    can_model = db_with_portfolios.get(CAN, 500)
    can_funding_details = db_with_portfolios.execute(
        select(CANFundingDetails).where(CANFundingDetails.fund_code == "AAXXXX20231DAD")
    ).scalar()

    assert can_model.id == 500
    assert can_model.number == "G99HRF2"
    assert can_model.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_model.nick_name == "HMRF-OPRE"
    assert (
        can_model.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()
    )
    assert can_model.funding_details == can_funding_details

    assert can_funding_details.fiscal_year == 2023
    assert can_funding_details.fund_code == "AAXXXX20231DAD"
    assert can_funding_details.allowance == "0000000001"
    assert can_funding_details.sub_allowance == "9KRZ2ND"
    assert can_funding_details.allotment == "YZC6S1JUGUN"
    assert can_funding_details.appropriation == "XX-23-XXXX"
    assert can_funding_details.method_of_transfer == CANMethodOfTransfer.DIRECT
    assert can_funding_details.funding_source == CANFundingSource.OPRE
    assert can_funding_details.active_period == 1
    assert can_funding_details.funding_method == "Direct"
    assert can_funding_details.funding_received == "Quarterly"
    assert can_funding_details.funding_type == "Discretionary"
    assert can_funding_details.obligate_by == 2023


def test_main(db_with_portfolios):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "cans",
            "--input-csv",
            "test_csv/can_valid.tsv",
        ],
    )

    assert result.exit_code == 0

    # make sure the data was loaded
    can_1 = db_with_portfolios.get(CAN, 500)
    assert can_1.number == "G99HRF2"
    assert can_1.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.nick_name == "HMRF-OPRE"
    assert (
        can_1.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()
    )
    assert (
        can_1.funding_details
        == db_with_portfolios.execute(
            select(CANFundingDetails).where(CANFundingDetails.fund_code == "AAXXXX20231DAD")
        ).scalar()
    )
    assert can_1.funding_details.fiscal_year == 2023
    assert can_1.funding_details.fund_code == "AAXXXX20231DAD"
    assert can_1.funding_details.allowance == "0000000001"
    assert can_1.funding_details.sub_allowance == "9KRZ2ND"
    assert can_1.funding_details.allotment == "YZC6S1JUGUN"
    assert can_1.funding_details.appropriation == "XX-23-XXXX"
    assert can_1.funding_details.method_of_transfer == CANMethodOfTransfer.DIRECT
    assert can_1.funding_details.funding_source == CANFundingSource.OPRE
    assert can_1.funding_details.funding_partner == "partner 1"
    assert can_1.funding_details.created_by == get_or_create_sys_user(db_with_portfolios).id

    can_2 = db_with_portfolios.get(CAN, 505)
    assert can_2.number == "G994648"
    assert can_2.description == "Kinship Navigation"
    assert can_2.nick_name == "Kin-Nav"
    assert (
        can_2.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "NON-OPRE")).scalar()
    )
    assert (
        can_2.funding_details
        == db_with_portfolios.execute(
            select(CANFundingDetails).where(CANFundingDetails.fund_code == "FFXXXX20215DAD")
        ).scalar()
    )
    assert can_2.funding_details.fiscal_year == 2021
    assert can_2.funding_details.fund_code == "FFXXXX20215DAD"
    assert can_2.funding_details.allowance == "0000000006"
    assert can_2.funding_details.sub_allowance == "G4N2ZIV"
    assert can_2.funding_details.allotment == "KCTQYEKJ4F6"
    assert can_2.funding_details.appropriation == "XX-2125-XXXX"
    assert can_2.funding_details.method_of_transfer == CANMethodOfTransfer.IAA
    assert can_2.funding_details.funding_source == CANFundingSource.OPRE
    assert can_2.funding_details.funding_partner == "partner 2"
    assert can_2.funding_details.created_by == get_or_create_sys_user(db_with_portfolios).id

    history_objs = (
        db_with_portfolios.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "CAN")).scalars().all()
    )
    assert len(history_objs) == 13

    can_1_history = (
        db_with_portfolios.execute(
            select(OpsDBHistory).where(and_(OpsDBHistory.row_key == "500", OpsDBHistory.class_name == "CAN"))
        )
        .scalars()
        .all()
    )
    assert len(can_1_history) == 1


@pytest.mark.skip(reason="Need to update the test data")
def test_create_models_upsert(db_with_portfolios):
    sys_user = get_or_create_sys_user(db_with_portfolios)

    data_1 = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )

    data_2 = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF3",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )

    data_3 = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF3",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAM",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )

    create_models(data_1, sys_user, db_with_portfolios)

    # make sure the data was loaded
    can_1 = db_with_portfolios.get(CAN, 500)
    assert can_1.number == "G99HRF2"
    assert can_1.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.nick_name == "HMRF-OPRE"
    assert (
        can_1.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()
    )
    assert (
        can_1.funding_details.id
        == db_with_portfolios.execute(select(CANFundingDetails).where(CANFundingDetails.fund_code == "AAXXXX20231DAD"))
        .scalar()
        .id
    )
    assert can_1.created_by == sys_user.id

    # make sure the version records were created
    assert can_1.versions[0].number == "G99HRF2"
    assert can_1.versions[0].description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.versions[0].nick_name == "HMRF-OPRE"
    assert (
        can_1.versions[0].portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar().versions[0]
    )
    assert (
        can_1.versions[0].funding_details
        == db_with_portfolios.execute(select(CANFundingDetails).where(CANFundingDetails.fund_code == "AAXXXX20231DAD"))
        .scalar()
        .versions[0]
    )
    assert can_1.versions[0].created_by == sys_user.id

    # make sure the history records are created
    history_record = db_with_portfolios.execute(
        select(OpsDBHistory).where(OpsDBHistory.class_name == "CAN").order_by(OpsDBHistory.id.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == "500"
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the CAN number
    create_models(data_2, sys_user, db_with_portfolios)
    can_1 = db_with_portfolios.get(CAN, 500)
    assert can_1.number == "G99HRF3"
    assert can_1.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.nick_name == "HMRF-OPRE"
    assert (
        can_1.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()
    )
    assert (
        can_1.funding_details.id
        == db_with_portfolios.execute(select(CANFundingDetails).where(CANFundingDetails.fund_code == "AAXXXX20231DAD"))
        .scalar()
        .id
    )
    assert can_1.created_by == sys_user.id

    # upsert the same data - change the fund code
    create_models(data_3, sys_user, db_with_portfolios)
    can_1 = db_with_portfolios.get(CAN, 500)
    assert can_1.number == "G99HRF3"
    assert can_1.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.nick_name == "HMRF-OPRE"
    assert (
        can_1.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()
    )
    assert (
        can_1.funding_details.id
        == db_with_portfolios.execute(select(CANFundingDetails).where(CANFundingDetails.fund_code == "AAXXXX20231DAM"))
        .scalar()
        .id
    )
    assert can_1.created_by == sys_user.id

    assert len(db_with_portfolios.execute(select(CAN)).scalars().all()) == 1
    assert len(db_with_portfolios.execute(select(CANFundingDetails)).scalars().all()) == 2


def test_validate_fund_code():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    validate_fund_code(data)


def test_validate_fund_code_length():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DADDDDDDD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    with pytest.raises(ValueError) as e_info:
        validate_fund_code(data)
    assert e_info.value.args[0] == "Invalid fund code length AAXXXX20231DADDDDDDD"


def test_validate_fund_code_fy():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20FY1DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    with pytest.raises(ValueError) as e_info:
        validate_fund_code(data)
    assert e_info.value.args[0] == "invalid literal for int() with base 10: '20FY'"


def test_validate_fund_code_length_of_appropriation():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20236DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    with pytest.raises(ValueError) as e_info:
        validate_fund_code(data)
    assert e_info.value.args[0] == "Invalid length of appropriation 6"


def test_validate_fund_code_direct_or_reimbursable():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231OAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    with pytest.raises(ValueError) as e_info:
        validate_fund_code(data)
    assert e_info.value.args[0] == "Invalid direct or reimbursable O"


def test_validate_fund_code_category():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DDD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    with pytest.raises(ValueError) as e_info:
        validate_fund_code(data)
    assert e_info.value.args[0] == "Invalid category D"


def test_validate_fund_code_discretionary_or_mandatory():
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAR",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )
    with pytest.raises(ValueError) as e_info:
        validate_fund_code(data)
    assert e_info.value.args[0] == "Invalid discretionary or mandatory R"


def test_appropriation_one_year_can(mocker):
    """One-year CAN: APPROP_YEAR is 2 digits (e.g. '25')."""
    data = CANData(
        FISCAL_YEAR=2025,
        SYS_CAN_ID=600,
        CAN_NBR="G99TEST1",
        CAN_DESCRIPTION="One Year CAN",
        FUND="AAXXXX20251DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=100000.0,
        APPROP_PREFIX="75",
        APPROP_POSTFIX="0401",
        APPROP_YEAR="25",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="One-Year",
        FUNDING_PARTNER="partner 1",
    )

    sys_user = mocker.MagicMock()
    sys_user.id = 1

    funding_details = get_or_create_funding_details(data, sys_user, None)

    assert funding_details.appropriation == "75-25-0401"


def test_appropriation_multi_year_can(mocker):
    """Multi-year CAN: APPROP_YEAR is 4 digits (e.g. '2526')."""
    data = CANData(
        FISCAL_YEAR=2025,
        SYS_CAN_ID=601,
        CAN_NBR="G99TEST2",
        CAN_DESCRIPTION="Multi Year CAN",
        FUND="AAXXXX20252DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=200000.0,
        APPROP_PREFIX="75",
        APPROP_POSTFIX="0401",
        APPROP_YEAR="2526",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="Multi-Year",
        FUNDING_PARTNER="partner 1",
    )

    sys_user = mocker.MagicMock()
    sys_user.id = 1

    funding_details = get_or_create_funding_details(data, sys_user, None)

    assert funding_details.appropriation == "75-2526-0401"


def test_appropriation_zero_year_can(mocker):
    """Zero-year (no-year) CAN: APPROP_YEAR is 'X'."""
    data = CANData(
        FISCAL_YEAR=2025,
        SYS_CAN_ID=602,
        CAN_NBR="G99TEST3",
        CAN_DESCRIPTION="Zero Year CAN",
        FUND="AAXXXX20250DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=300000.0,
        APPROP_PREFIX="75",
        APPROP_POSTFIX="0401",
        APPROP_YEAR="X",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="Zero-Year",
        FUNDING_PARTNER="partner 1",
    )

    sys_user = mocker.MagicMock()
    sys_user.id = 1

    funding_details = get_or_create_funding_details(data, sys_user, None)

    assert funding_details.appropriation == "75-X-0401"


def test_appropriation_missing_prefix_and_postfix(mocker):
    """APPROP_PREFIX and APPROP_POSTFIX are None — appropriation still includes the year."""
    data = CANData(
        FISCAL_YEAR=2025,
        SYS_CAN_ID=603,
        CAN_NBR="G99TEST4",
        CAN_DESCRIPTION="No Prefix/Postfix CAN",
        FUND="AAXXXX20251DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=400000.0,
        APPROP_PREFIX=None,
        APPROP_POSTFIX=None,
        APPROP_YEAR="25",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="No-Prefix",
        FUNDING_PARTNER="partner 1",
    )

    sys_user = mocker.MagicMock()
    sys_user.id = 1

    funding_details = get_or_create_funding_details(data, sys_user, None)

    assert funding_details.appropriation == "-25-"


def test_appropriation_missing_year(mocker):
    """APPROP_YEAR is None — appropriation uses empty string for the year component."""
    data = CANData(
        FISCAL_YEAR=2025,
        SYS_CAN_ID=604,
        CAN_NBR="G99TEST5",
        CAN_DESCRIPTION="No Year CAN",
        FUND="AAXXXX20251DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=500000.0,
        APPROP_PREFIX="75",
        APPROP_POSTFIX="0401",
        APPROP_YEAR=None,
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="No-Year",
        FUNDING_PARTNER="partner 1",
    )

    sys_user = mocker.MagicMock()
    sys_user.id = 1

    funding_details = get_or_create_funding_details(data, sys_user, None)

    assert funding_details.appropriation == "75--0401"


def test_create_models_fallback_lookup_by_number(db_with_portfolios):
    """When SYS_CAN_ID doesn't match but CAN_NBR does, the existing CAN is updated."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    data_initial = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Original description",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )
    create_models(data_initial, sys_user, db_with_portfolios)

    can = db_with_portfolios.get(CAN, 500)
    assert can is not None
    assert can.number == "G99HRF2"

    data_different_id = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=9999,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Updated via number fallback",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE-Updated",
        FUNDING_PARTNER="partner 1",
    )
    create_models(data_different_id, sys_user, db_with_portfolios)

    can = db_with_portfolios.get(CAN, 500)
    assert can is not None
    assert can.number == "G99HRF2"
    assert can.description == "Updated via number fallback"
    assert can.nick_name == "HMRF-OPRE-Updated"

    all_cans = db_with_portfolios.execute(select(CAN).where(CAN.number == "G99HRF2")).scalars().all()
    assert len(all_cans) == 1


def _make_can_data(**overrides):
    """Build a fully-populated CANData, with any field overridden by kwargs."""
    defaults = dict(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )
    defaults.update(overrides)
    return CANData(**defaults)


def test_create_models_update_preserves_blank_nick_name_and_portfolio(db_with_portfolios):
    """Blank NICK_NAME/PORTFOLIO on an update leave the existing values untouched."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)
    can = db_with_portfolios.get(CAN, 500)
    assert can.nick_name == "HMRF-OPRE"
    original_portfolio_id = can.portfolio_id

    create_models(_make_can_data(NICK_NAME="", PORTFOLIO=""), sys_user, db_with_portfolios)
    can = db_with_portfolios.get(CAN, 500)
    assert can.nick_name == "HMRF-OPRE"
    assert can.portfolio_id == original_portfolio_id


def test_create_models_update_portfolio_change_records_history(db_with_portfolios):
    """Changing PORTFOLIO on an update persists the new portfolio and records a matching
    OpsEvent/CANHistory row — the diff must not read the CAN's portfolio_id FK before flush,
    which would still show the old value and silently drop the change from the event."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)
    can = db_with_portfolios.get(CAN, 500)
    original_portfolio_id = can.portfolio_id

    create_models(_make_can_data(PORTFOLIO="CC"), sys_user, db_with_portfolios)

    can = db_with_portfolios.get(CAN, 500)
    new_portfolio = db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "CC")).scalar()
    assert can.portfolio_id == new_portfolio.id
    assert can.portfolio_id != original_portfolio_id

    update_events = (
        db_with_portfolios.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_CAN))
        .scalars()
        .all()
    )
    assert len(update_events) == 1
    changes = update_events[0].event_details["can_updates"]["changes"]
    assert changes["portfolio_id"] == {"old_value": original_portfolio_id, "new_value": new_portfolio.id}

    history_events = (
        db_with_portfolios.execute(select(CANHistory).where(CANHistory.ops_event_id == update_events[0].id))
        .scalars()
        .all()
    )
    assert any(e.history_type == CANHistoryType.CAN_PORTFOLIO_EDITED for e in history_events)


def test_create_models_update_preserves_blank_method_of_transfer_and_funding_source(db_with_portfolios):
    """Blank METHOD_OF_TRANSFER/FUNDING_SOURCE on an update leave the existing funding_details values untouched."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)

    create_models(
        _make_can_data(METHOD_OF_TRANSFER="", FUNDING_SOURCE=""),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 500)
    assert can.funding_details.method_of_transfer == CANMethodOfTransfer.DIRECT
    assert can.funding_details.funding_source == CANFundingSource.OPRE


def test_create_models_update_preserves_blank_funding_partner(db_with_portfolios):
    """Blank FUNDING_PARTNER on an update leaves the existing funding_details value untouched."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)

    create_models(_make_can_data(FUNDING_PARTNER=""), sys_user, db_with_portfolios)

    can = db_with_portfolios.get(CAN, 500)
    assert can.funding_details.funding_partner == "partner 1"


def test_create_models_new_can_blank_funding_partner_creates_funding_details(db_with_portfolios):
    """FUNDING_PARTNER is never required — a blank value on a brand-new CAN still creates
    funding_details, unlike METHOD_OF_TRANSFER/FUNDING_SOURCE."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(
        _make_can_data(SYS_CAN_ID=600, CAN_NBR="G99NEW1", FUNDING_PARTNER=""),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 600)
    assert can is not None
    assert can.funding_details is not None
    assert can.funding_details.funding_partner is None


def test_create_models_new_can_blank_portfolio_raises(db_with_portfolios):
    """Creating a brand-new CAN with a blank PORTFOLIO is a hard failure."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    with pytest.raises(ValueError, match="PORTFOLIO is required"):
        create_models(
            _make_can_data(SYS_CAN_ID=600, CAN_NBR="G99NEW1", PORTFOLIO=""),
            sys_user,
            db_with_portfolios,
        )


def test_create_models_new_can_blank_method_of_transfer_skips_funding_details(db_with_portfolios):
    """Creating a brand-new CAN with blank METHOD_OF_TRANSFER still creates the CAN, but skips funding_details."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(
        _make_can_data(SYS_CAN_ID=600, CAN_NBR="G99NEW1", METHOD_OF_TRANSFER=""),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 600)
    assert can is not None
    assert can.number == "G99NEW1"
    assert can.funding_details is None


def test_create_models_new_can_blank_funding_source_skips_funding_details(db_with_portfolios):
    """Creating a brand-new CAN with blank FUNDING_SOURCE still creates the CAN, but skips funding_details."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(
        _make_can_data(SYS_CAN_ID=600, CAN_NBR="G99NEW1", FUNDING_SOURCE=""),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 600)
    assert can is not None
    assert can.number == "G99NEW1"
    assert can.funding_details is None


def test_create_models_existing_can_first_funding_details_blank_required_field_skips(db_with_portfolios):
    """An existing CAN with no prior funding_details still requires METHOD_OF_TRANSFER/FUNDING_SOURCE
    for its first funding_details record; if blank, funding_details creation is skipped but the CAN
    itself still updates normally."""
    sys_user = get_or_create_sys_user(db_with_portfolios)
    portfolio = db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()

    bare_can = CAN(
        id=700,
        number="G99BARE1",
        description="Original description",
        portfolio=portfolio,
        created_by=sys_user.id,
        updated_by=sys_user.id,
    )
    db_with_portfolios.add(bare_can)
    db_with_portfolios.commit()

    create_models(
        _make_can_data(
            SYS_CAN_ID=700,
            CAN_NBR="G99BARE1",
            CAN_DESCRIPTION="Updated description",
            METHOD_OF_TRANSFER="",
        ),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 700)
    assert can.description == "Updated description"
    assert can.funding_details is None


def test_create_models_existing_can_first_funding_details_forces_history_event(db_with_portfolios):
    """When an existing CAN gets its first-ever funding_details record and no other CAN column
    changes, an UPDATE_CAN OpsEvent is still recorded."""
    sys_user = get_or_create_sys_user(db_with_portfolios)
    portfolio = db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()

    bare_can = CAN(
        id=700,
        number="G99BARE1",
        description="Healthy Marriages Responsible Fatherhood - OPRE",
        nick_name="HMRF-OPRE",
        portfolio=portfolio,
        created_by=sys_user.id,
        updated_by=sys_user.id,
    )
    db_with_portfolios.add(bare_can)
    db_with_portfolios.commit()

    create_models(
        _make_can_data(SYS_CAN_ID=700, CAN_NBR="G99BARE1"),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 700)
    assert can.funding_details is not None

    update_events = (
        db_with_portfolios.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_CAN))
        .scalars()
        .all()
    )
    assert len(update_events) == 1
    assert update_events[0].event_details["can_updates"]["owner_id"] == 700
    assert "funding_details.fund_code" in update_events[0].event_details["can_updates"]["changes"]


def test_create_models_update_method_of_transfer_and_funding_source_records_history(db_with_portfolios):
    """Changing METHOD_OF_TRANSFER/FUNDING_SOURCE on an update stores the new/old enum values as
    their `.name` strings (not enum reprs) in the OpsEvent, and produces a matching CANHistory row."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)

    create_models(
        _make_can_data(METHOD_OF_TRANSFER="IAA", FUNDING_SOURCE="ACF"),
        sys_user,
        db_with_portfolios,
    )

    can = db_with_portfolios.get(CAN, 500)
    assert can.funding_details.method_of_transfer == CANMethodOfTransfer.IAA
    assert can.funding_details.funding_source == CANFundingSource.ACF

    update_events = (
        db_with_portfolios.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_CAN))
        .scalars()
        .all()
    )
    assert len(update_events) == 1
    changes = update_events[0].event_details["can_updates"]["changes"]
    assert changes["funding_details.method_of_transfer"] == {"old_value": "DIRECT", "new_value": "IAA"}
    assert changes["funding_details.funding_source"] == {"old_value": "OPRE", "new_value": "ACF"}

    history_events = (
        db_with_portfolios.execute(select(CANHistory).where(CANHistory.ops_event_id == update_events[0].id))
        .scalars()
        .all()
    )
    method_event = next(e for e in history_events if "method of transfer" in e.history_message)
    assert method_event.history_type == CANHistoryType.CAN_FUNDING_DETAILS_EDITED
    assert "DIRECT" in method_event.history_message
    assert "IAA" in method_event.history_message


def test_create_models_update_bad_portfolio_hard_fails(db_with_portfolios):
    """A mistyped PORTFOLIO abbreviation on an update still hard-fails the batch."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)

    with pytest.raises(ValueError, match="Portfolio not found"):
        create_models(_make_can_data(PORTFOLIO="BOGUS"), sys_user, db_with_portfolios)


def test_create_models_update_bad_method_of_transfer_hard_fails(db_with_portfolios):
    """A mistyped METHOD_OF_TRANSFER on an update still hard-fails the batch."""
    sys_user = get_or_create_sys_user(db_with_portfolios)

    create_models(_make_can_data(), sys_user, db_with_portfolios)

    with pytest.raises(KeyError):
        create_models(_make_can_data(METHOD_OF_TRANSFER="BOGUS"), sys_user, db_with_portfolios)


@pytest.mark.skip(reason="Need to update the test data")
def test_create_models_invalid_fund_code(db_with_portfolios):
    data = CANData(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DADDDDDD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        CURRENT_FY_FUNDING_YTD=880000.0,
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )

    sys_user = User(
        email="system.admin@localhost",
    )
    create_models(data, sys_user, db_with_portfolios)

    can_model = db_with_portfolios.get(CAN, 500)

    assert can_model.id == 500
    assert can_model.number == "G99HRF2"
    assert can_model.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_model.nick_name == "HMRF-OPRE"
    assert (
        can_model.portfolio
        == db_with_portfolios.execute(select(Portfolio).where(Portfolio.abbreviation == "HMRF")).scalar()
    )
    assert can_model.funding_details is None
