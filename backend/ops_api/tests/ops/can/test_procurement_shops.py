from datetime import date, timedelta
from decimal import Decimal

import pytest

from models.procurement_shops import ProcurementShop, ProcurementShopFee


@pytest.mark.usefixtures("app_ctx")
def test_procurement_shop_lookup(loaded_db):
    ps = loaded_db.get(ProcurementShop, 1)
    assert ps is not None
    assert ps.id == 1
    assert ps.name == "Product Service Center"
    assert ps.abbr == "PSC"
    assert 0 in [f.fee for f in ps.procurement_shop_fees]
    assert ps.display_name == ps.name


@pytest.mark.usefixtures("app_ctx")
def test_procurement_shop_creation(loaded_db):
    ps = ProcurementShop(
        name="Whatever",
        abbr="WHO",
    )

    loaded_db.add(ps)
    loaded_db.commit()
    loaded_db.refresh(ps)

    psf = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=0.1,
    )

    ps.procurement_shop_fees.append(psf)

    loaded_db.add(psf)
    loaded_db.commit()

    assert loaded_db.get(ProcurementShopFee, ps.to_dict()["procurement_shop_fees"][0]).fee == Decimal("0.10")

    # Clean up
    loaded_db.delete(ps)
    loaded_db.delete(psf)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_shops_list(auth_client):
    response = auth_client.get("/api/v1/procurement-shops/")
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["id"] == 1
    assert response.json[1]["id"] == 2


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_shops_list_by_id(auth_client):
    response = auth_client.get("/api/v1/procurement-shops/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


@pytest.mark.usefixtures("app_ctx")
def test_fee_percentage_with_active_fee(loaded_db):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee with current date range
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id, fee=Decimal("0.05"), start_date=yesterday, end_date=tomorrow  # 5% fee
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the hybrid property
    assert ps.fee_percentage == Decimal("0.05")

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_fee_percentage_with_no_end_date(loaded_db):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee with open-ended date range
    last_week = date.today() - timedelta(days=7)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id, fee=Decimal("0.10"), start_date=last_week, end_date=None  # 10% fee  # Open-ended
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the hybrid property
    assert ps.fee_percentage == Decimal("0.10")

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_fee_percentage_with_multiple_fees(loaded_db):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create multiple fees with different date ranges
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    last_month = today - timedelta(days=30)
    next_month = today + timedelta(days=30)

    # Past fee (already ended)
    past_fee = ProcurementShopFee(
        procurement_shop_id=ps.id, fee=Decimal("0.03"), start_date=last_month, end_date=yesterday
    )

    # Current fee (active now)
    current_fee = ProcurementShopFee(
        procurement_shop_id=ps.id, fee=Decimal("0.05"), start_date=yesterday, end_date=tomorrow
    )

    # Future fee (not active yet)
    future_fee = ProcurementShopFee(
        procurement_shop_id=ps.id, fee=Decimal("0.07"), start_date=tomorrow, end_date=next_month
    )

    loaded_db.add_all([past_fee, current_fee, future_fee])
    loaded_db.commit()

    # Test the hybrid property - should get the current active fee
    assert ps.fee_percentage == Decimal("0.05")

    # Clean up
    loaded_db.delete(past_fee)
    loaded_db.delete(current_fee)
    loaded_db.delete(future_fee)
    loaded_db.delete(ps)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_fee_percentage_with_no_fees(loaded_db):
    # Create a procurement shop with no fees
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.commit()

    # Test the hybrid property - should default to 0
    assert ps.fee_percentage == Decimal("0.0")

    # Clean up
    loaded_db.delete(ps)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_fee_percentage_expression(loaded_db):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    fee = ProcurementShopFee(procurement_shop_id=ps.id, fee=Decimal("5.0"), start_date=yesterday, end_date=tomorrow)
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the expression by querying
    from sqlalchemy import select

    query = select(ProcurementShop.fee_percentage).where(ProcurementShop.id == ps.id)
    result = loaded_db.execute(query).first()

    assert result is not None
    assert result[0] == Decimal("5.0")

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()
