import csv

import pytest
from click.testing import CliRunner
from data_tools.environment.dev import DevConfig
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.import_static_data.import_data import get_config
from data_tools.src.load_cans.utils import (
    CANData,
    create_can_data,
    create_models,
    validate_all,
    validate_data,
    validate_fund_code,
)
from data_tools.src.load_data import main
from sqlalchemy import and_, text

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
    assert count == 10


def test_validate_all():
    test_data = list(csv.DictReader(open("test_csv/can_invalid.tsv"), dialect="excel-tab"))
    assert len(test_data) == 17
    can_data = [create_can_data(data) for data in test_data]
    assert validate_all(can_data) is False


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
    assert can_funding_details.obligate_by == 2024


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
    assert can_2.funding_details.appropriation == "XX-21-XXXX"
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
        select(OpsDBHistory).where(OpsDBHistory.class_name == "CAN").order_by(OpsDBHistory.created_on.desc())
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
        FUND="AAXXXX20233DAD",
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
    assert e_info.value.args[0] == "Invalid length of appropriation 3"


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
