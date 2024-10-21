import csv

import pytest
from data_tools.environment.dev import DevConfig
from data_tools.src.import_static_data.import_data import get_config
from data_tools.src.load_cans.utils import (
    CANData,
    create_can_data,
    create_models,
    persist_models,
    validate_all,
    validate_data,
)
from sqlalchemy.orm import configure_mappers

from models import *  # noqa: F403, F401


def test_get_config_default():
    assert isinstance(get_config(), DevConfig)


def test_create_can_data():
    test_data = list(csv.DictReader(open("test_csv/can.tsv"), dialect="excel-tab"))

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
    test_data = list(csv.DictReader(open("test_csv/can.tsv"), dialect="excel-tab"))
    assert len(test_data) == 17
    count = sum(1 for data in test_data if validate_data(create_can_data(data)))
    assert count == 10

def test_validate_all():
    test_data = list(csv.DictReader(open("test_csv/can.tsv"), dialect="excel-tab"))
    assert len(test_data) == 17
    can_data = [create_can_data(data) for data in test_data]
    assert validate_all(can_data) == False

def test_create_models_no_can_nbr():
    with pytest.raises(ValueError):
        CANData(
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

def test_create_models(etl_user):
    portfolios = [
        Portfolio(
            abbreviation="HMRF",
            name="Healthy Marriages Responsible Fatherhood",
        ),
        Portfolio(
            abbreviation="CC",
            name="Child Care",
        ),
    ]


    data = CANData(
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

    models = create_models(data, etl_user, portfolios)

    assert len(models) == 2

    can_model = next(m for m in models if isinstance(m, CAN))
    assert can_model.id == 500
    assert can_model.number == "G99HRF2"
    assert can_model.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_model.nick_name == "HMRF-OPRE"
    assert can_model.portfolio == next(p for p in portfolios if p.abbreviation == "HMRF")
    assert can_model.funding_details == next(m for m in models if isinstance(m, CANFundingDetails))

    funding_details_model = next(m for m in models if isinstance(m, CANFundingDetails))
    assert funding_details_model.fiscal_year == 2023
    assert funding_details_model.fund_code == "AAXXXX20231DAD"
    assert funding_details_model.allowance == "0000000001"
    assert funding_details_model.sub_allowance == "9KRZ2ND"
    assert funding_details_model.allotment == "YZC6S1JUGUN"
    assert funding_details_model.appropriation == "XX-23-XXXX"
    assert funding_details_model.method_of_transfer == CANMethodOfTransfer.DIRECT
    assert funding_details_model.funding_source == CANFundingSource.OPRE
    assert funding_details_model.active_period == 1
    assert funding_details_model.obligate_by == 2024

def test_persist_models(loaded_db, etl_user):
    division = Division(
        name="Child Care",
        abbreviation="CC",
    )
    loaded_db.add(division)
    loaded_db.commit()

    portfolios = [
        Portfolio(
            abbreviation="HMRF",
            name="Healthy Marriages Responsible Fatherhood",
            division_id=division.id,
        ),
        Portfolio(
            abbreviation="CC",
            name="Child Care",
            division_id=division.id,
        ),
    ]

    loaded_db.add_all(portfolios)
    loaded_db.commit()

    data_1 = CANData(
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

    data_2 = CANData(
        SYS_CAN_ID=501,
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
        PORTFOLIO="CC",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
    )

    models = create_models(data_1, etl_user, portfolios) + create_models(data_2, etl_user, portfolios)

    persist_models(models, loaded_db)

    can_1 = loaded_db.get(CAN, 500)
    assert can_1.number == "G99HRF2"
    assert can_1.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.nick_name == "HMRF-OPRE"
    assert can_1.portfolio == loaded_db.execute(select(Portfolio).filter(Portfolio.abbreviation == "HMRF")).scalar()
    assert can_1.funding_details == loaded_db.execute(select(CANFundingDetails).filter(CANFundingDetails.fund_code == "AAXXXX20231DAD")).scalar()
    assert can_1.created_by == etl_user.id

    # make sure the version records were created
    assert can_1.versions[0].number == "G99HRF2"
    assert can_1.versions[0].description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can_1.versions[0].nick_name == "HMRF-OPRE"
    assert can_1.versions[0].portfolio == loaded_db.execute(select(Portfolio).filter(Portfolio.abbreviation == "HMRF")).scalar().versions[0]
    assert can_1.versions[0].funding_details == loaded_db.execute(select(CANFundingDetails).filter(CANFundingDetails.fund_code == "AAXXXX20231DAD")).scalar().versions[0]
    assert can_1.versions[0].created_by == etl_user.id

    # make sure the history records are created
    history_records = loaded_db.execute(select(OpsDBHistory).filter(OpsDBHistory.class_name == "CAN").order_by(OpsDBHistory.created_on.desc())).scalars().all()
    assert len(history_records) == 2
    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == "500"
    assert history_records[1].event_type == OpsDBHistoryType.NEW
    assert history_records[1].row_key == "501"
    assert history_records[0].created_by == etl_user.id
    assert history_records[1].created_by == etl_user.id


    # Cleanup
    for model in models:
        loaded_db.delete(model)
        loaded_db.commit()
