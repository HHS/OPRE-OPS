# flake8: noqa F405
import csv
from unittest.mock import patch

import pytest
from click.testing import CliRunner
from sqlalchemy import and_
from sqlalchemy.sql.expression import text

from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_procurement_shops.utils import (
    ProcurementShopData,
    create_models,
    create_procurement_shop_data,
    validate_data,
)
from models import *


@pytest.fixture()
def db_with_cleanup(loaded_db):
    yield loaded_db

    # Cleanup
    loaded_db.execute(text("DELETE FROM procurement_shop_fee"))
    loaded_db.execute(text("DELETE FROM procurement_shop_fee_version"))
    loaded_db.execute(text("DELETE FROM procurement_shop"))
    loaded_db.execute(text("DELETE FROM procurement_shop_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))


def test_create_procurement_shop_data():
    test_data = list(csv.DictReader(open("test_csv/procurement_shop.tsv"), dialect="excel-tab"))

    assert len(test_data) == 11

    # Test first shop with only name and abbreviation
    psc_data = create_procurement_shop_data(test_data[0])
    assert psc_data.NAME == "Product Service Center"
    assert psc_data.ABBREVIATION == "PSC"
    assert psc_data.FEE == Decimal("0")
    assert psc_data.START_DATE is None
    assert psc_data.END_DATE is None

    # Test NIH with fee and start date but no end date
    nih_data = create_procurement_shop_data(test_data[2])
    assert nih_data.NAME == "National Institute of Health"
    assert nih_data.ABBREVIATION == "NIH"
    assert nih_data.FEE == Decimal("0.5")
    assert nih_data.START_DATE == datetime.strptime("2025-10-01", "%Y-%m-%d").date()
    assert nih_data.END_DATE is None

    # Test DOE with same start and end date (zero-length range)
    doe_data = create_procurement_shop_data(test_data[8])
    assert doe_data.NAME == "Department of Energy"
    assert doe_data.ABBREVIATION == "DOE"
    assert doe_data.FEE == Decimal("1.75")
    assert doe_data.START_DATE == datetime.strptime("2025-07-15", "%Y-%m-%d").date()
    assert doe_data.END_DATE == datetime.strptime("2025-07-15", "%Y-%m-%d").date()


def test_validate_data():
    test_data = list(csv.DictReader(open("test_csv/procurement_shop.tsv"), dialect="excel-tab"))
    assert len(test_data) > 0
    count = sum(1 for data in test_data if validate_data(create_procurement_shop_data(data)))
    assert count == len(test_data)


def test_invalid_data():
    with pytest.raises(ValueError):
        ProcurementShopData(
            NAME="",
            ABBREVIATION="ABC",
        )

    with pytest.raises(ValueError):
        ProcurementShopData(
            NAME="Test Shop",
            ABBREVIATION="",
        )


def test_create_models(db_with_cleanup):
    data = ProcurementShopData(
        NAME="Test Procurement Shop",
        ABBREVIATION="TPS",
        FEE="2.5",
        START_DATE="2024-01-01",
        END_DATE="2025-12-31",
    )

    sys_user = get_or_create_sys_user(db_with_cleanup)
    create_models(data, sys_user, db_with_cleanup)

    # Query the shop
    shop = db_with_cleanup.execute(
        select(ProcurementShop).where(ProcurementShop.name == "Test Procurement Shop")
    ).scalar_one()

    assert shop.name == "Test Procurement Shop"
    assert shop.abbr == "TPS"
    assert shop.created_by == sys_user.id
    assert shop.updated_by == sys_user.id

    # Query the fee
    fee = db_with_cleanup.execute(
        select(ProcurementShopFee).where(ProcurementShopFee.procurement_shop_id == shop.id)
    ).scalar_one()

    assert fee.fee == Decimal("2.5")
    assert fee.start_date == date(2024, 1, 1)
    assert fee.end_date == date(2025, 12, 31)
    assert fee.created_by == sys_user.id
    assert fee.updated_by == sys_user.id

    # cleanup
    db_with_cleanup.delete(shop)
    db_with_cleanup.delete(fee)
    db_with_cleanup.commit()


def test_main(db_with_cleanup):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "procurement_shops",
            "--input-csv",
            "test_csv/procurement_shop.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = get_or_create_sys_user(db_with_cleanup)

    # Check if shops are loaded
    shops = db_with_cleanup.execute(select(ProcurementShop)).scalars().all()
    assert len(shops) == 8  # Based on the test data, we expect 8 shops

    # Check GSA specifically
    gsa = db_with_cleanup.execute(select(ProcurementShop).where(ProcurementShop.abbr == "GSA")).scalar_one()
    assert gsa.name == "General Services Administration"
    assert gsa.abbr == "GSA"
    assert gsa.created_by == sys_user.id

    # Check GSA fee
    gsa_fee = db_with_cleanup.execute(
        select(ProcurementShopFee).where(ProcurementShopFee.procurement_shop_id == gsa.id)
    ).scalar_one()
    assert gsa_fee.fee == Decimal("3.5")
    assert gsa_fee.start_date == date(2020, 1, 1)
    assert gsa_fee.end_date == date(2022, 12, 31)

    # Verify history records were created
    history_objs = (
        db_with_cleanup.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "ProcurementShop"))
        .scalars()
        .all()
    )
    assert len(history_objs) > 0


def test_create_models_upsert(db_with_cleanup):
    sys_user = get_or_create_sys_user(db_with_cleanup)

    # Create initial shop with fee
    data_1 = ProcurementShopData(
        NAME="Test Shop",
        ABBREVIATION="TS",
        FEE="1.5",
        START_DATE="2024-01-01",
        END_DATE="2024-12-31",
    )
    create_models(data_1, sys_user, db_with_cleanup)

    # Check shop was created
    shop = db_with_cleanup.execute(select(ProcurementShop).where(ProcurementShop.name == "Test Shop")).scalar_one()
    assert shop.name == "Test Shop"
    assert shop.abbr == "TS"

    # Check fee was created
    fee = db_with_cleanup.execute(
        select(ProcurementShopFee).where(ProcurementShopFee.procurement_shop_id == shop.id)
    ).scalar_one()
    assert fee.fee == Decimal("1.5")
    assert fee.start_date == date(2024, 1, 1)
    assert fee.end_date == date(2024, 12, 31)

    # Add another fee with different date range
    data_2 = ProcurementShopData(
        NAME="Test Shop",
        ABBREVIATION="TS",
        FEE="2.0",
        START_DATE="2025-01-01",
        END_DATE="2025-12-31",
    )
    create_models(data_2, sys_user, db_with_cleanup)

    # Check that we now have two fees
    fees = (
        db_with_cleanup.execute(select(ProcurementShopFee).where(ProcurementShopFee.procurement_shop_id == shop.id))
        .scalars()
        .all()
    )
    assert len(fees) == 2

    # Update fee for existing date range
    data_3 = ProcurementShopData(
        NAME="Test Shop",
        ABBREVIATION="TS",
        FEE="1.75",
        START_DATE="2024-01-01",
        END_DATE="2024-12-31",
    )
    create_models(data_3, sys_user, db_with_cleanup)

    # Check that fee was updated
    updated_fee = db_with_cleanup.execute(
        select(ProcurementShopFee).where(
            and_(
                ProcurementShopFee.procurement_shop_id == shop.id,
                ProcurementShopFee.start_date == date(2024, 1, 1),
                ProcurementShopFee.end_date == date(2024, 12, 31),
            )
        )
    ).scalar_one()
    assert updated_fee.fee == Decimal("1.75")


def test_overlapping_date_ranges(db_with_cleanup):
    sys_user = get_or_create_sys_user(db_with_cleanup)

    # Test the overlapping date ranges from case #4
    data_1 = ProcurementShopData(
        NAME="Department of Defense",
        ABBREVIATION="DOD",
        FEE="2.5",
        START_DATE="2024-01-01",
        END_DATE="2026-12-31",
    )
    data_2 = ProcurementShopData(
        NAME="Department of Defense",
        ABBREVIATION="DOD",
        FEE="3.0",
        START_DATE="2025-01-01",
        END_DATE="2025-12-31",
    )

    create_models(data_1, sys_user, db_with_cleanup)
    create_models(data_2, sys_user, db_with_cleanup)

    # Get the shop
    dod = db_with_cleanup.execute(select(ProcurementShop).where(ProcurementShop.abbr == "DOD")).scalar_one()

    with patch("models.procurement_shops.date") as mock_date:
        mock_date.today.return_value = date(2025, 6, 15)
        mock_date.side_effect = lambda *args, **kw: date(*args, **kw)

        # The current_fee property should return the fee with the most recent start date
        assert dod.current_fee.fee == Decimal("3.0")
