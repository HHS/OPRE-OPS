from datetime import date, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import select

from models.procurement_shops import ProcurementShop, ProcurementShopFee


def test_procurement_shop_lookup(loaded_db, app_ctx):
    ps = loaded_db.get(ProcurementShop, 1)
    assert ps is not None
    assert ps.id == 1
    assert ps.name == "Product Service Center"
    assert ps.abbr == "PSC"
    assert ps.fee_percentage == Decimal("0")
    assert ps.display_name == ps.name


def test_procurement_shop_creation(loaded_db, app_ctx):
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

    first_fee_id = ps.procurement_shop_fees[0].id
    assert loaded_db.get(ProcurementShopFee, first_fee_id).fee == Decimal("0.10")

    # Clean up
    loaded_db.delete(ps)
    loaded_db.delete(psf)
    loaded_db.commit()


def test_get_procurement_shops_list(auth_client, app_ctx):
    response = auth_client.get("/api/v1/procurement-shops/")
    assert response.status_code == 200
    assert len(response.json) == 4
    assert response.json[0]["id"] == 1
    assert response.json[1]["id"] == 2


def test_get_procurement_shops_list_by_id(auth_client, app_ctx):
    response = auth_client.get("/api/v1/procurement-shops/1")
    assert response.status_code == 200
    assert response.json["id"] == 1


def test_fee_percentage_with_active_fee(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee with current date range
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("0.05"),
        start_date=yesterday,
        end_date=tomorrow,  # 5% fee
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the hybrid property
    assert ps.fee_percentage == Decimal("0.05")

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_fee_percentage_with_no_end_date(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee with open-ended date range
    last_week = date.today() - timedelta(days=7)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("0.10"),
        start_date=last_week,
        end_date=None,  # 10% fee  # Open-ended
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the hybrid property
    assert ps.fee_percentage == Decimal("0.10")

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_fee_percentage_with_multiple_fees(loaded_db, app_ctx):
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
        procurement_shop_id=ps.id,
        fee=Decimal("0.03"),
        start_date=last_month,
        end_date=yesterday,
    )

    # Current fee (active now)
    current_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("0.05"),
        start_date=yesterday,
        end_date=tomorrow,
    )

    # Future fee (not active yet)
    future_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("0.07"),
        start_date=tomorrow,
        end_date=next_month,
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


def test_fee_percentage_with_no_fees(loaded_db, app_ctx):
    # Create a procurement shop with no fees
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.commit()

    # Test the hybrid property - should default to 0
    assert ps.fee_percentage == Decimal("0.0")

    # Clean up
    loaded_db.delete(ps)
    loaded_db.commit()


def test_fee_percentage_expression(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("5.0"),
        start_date=yesterday,
        end_date=tomorrow,
    )
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


def test_current_fee_with_active_fee(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee with current date range
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("5.0"),
        start_date=yesterday,
        end_date=tomorrow,
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the current_fee property
    assert ps.current_fee is not None
    assert ps.current_fee.fee == Decimal("5.0")
    assert ps.current_fee.id == fee.id

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_current_fee_with_no_end_date(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee with open-ended date range
    last_week = date.today() - timedelta(days=7)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("10.0"),
        start_date=last_week,
        end_date=None,
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the current_fee property
    assert ps.current_fee is not None
    assert ps.current_fee.fee == Decimal("10.0")
    assert ps.current_fee.id == fee.id

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_current_fee_with_multiple_fees(loaded_db, app_ctx):
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
        procurement_shop_id=ps.id,
        fee=Decimal("3.0"),
        start_date=last_month,
        end_date=yesterday,
    )

    # Current fee (active now)
    current_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("5.0"),
        start_date=yesterday,
        end_date=tomorrow,
    )

    # Future fee (not active yet)
    future_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("7.0"),
        start_date=tomorrow,
        end_date=next_month,
    )

    loaded_db.add_all([past_fee, current_fee, future_fee])
    loaded_db.commit()

    # Test the current_fee property - should get the current active fee
    assert ps.current_fee is not None
    assert ps.current_fee.fee == Decimal("5.0")
    assert ps.current_fee.id == current_fee.id

    # Clean up
    loaded_db.delete(past_fee)
    loaded_db.delete(current_fee)
    loaded_db.delete(future_fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_current_fee_with_no_fees(loaded_db, app_ctx):
    # Create a procurement shop with no fees
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.commit()

    # Test the current_fee property - should be None
    assert ps.current_fee is None

    # Clean up
    loaded_db.delete(ps)
    loaded_db.commit()


def test_current_fee_expression(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Test Shop", abbr="TS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create fee
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("5.0"),
        start_date=yesterday,
        end_date=tomorrow,
    )
    loaded_db.add(fee)
    loaded_db.commit()

    # Test the expression by querying
    from sqlalchemy import select

    query = select(ProcurementShop.id, ProcurementShop.current_fee).where(ProcurementShop.id == ps.id)
    result = loaded_db.execute(query).first()

    assert result is not None
    # The current_fee expression returns a subquery result which we need to fetch
    loaded_fee = loaded_db.get(ProcurementShopFee, fee.id)
    assert result[1] == loaded_fee.id  # Compare IDs since the objects themselves might differ

    # Clean up
    loaded_db.delete(fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_overlapping_date_ranges_current_fee(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Overlapping Test Shop", abbr="OTS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create overlapping fees with different start dates
    today = date.today()
    start_date1 = today - timedelta(days=100)  # Older start date
    start_date2 = today - timedelta(days=50)  # More recent start date
    end_date = today + timedelta(days=100)  # Both end in the future

    # Fee with older start date but longer range
    older_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("2.5"),
        start_date=start_date1,
        end_date=end_date,
    )

    # Fee with more recent start date (should be selected)
    newer_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("3.0"),
        start_date=start_date2,
        end_date=end_date,
    )

    loaded_db.add_all([older_fee, newer_fee])
    loaded_db.commit()

    # Test the current_fee property - should select the fee with more recent start date
    assert ps.current_fee is not None
    assert ps.current_fee.fee == Decimal("3.0")
    assert ps.current_fee.id == newer_fee.id

    # Clean up
    loaded_db.delete(older_fee)
    loaded_db.delete(newer_fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_overlapping_date_ranges_fee_percentage(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Overlapping Test Shop", abbr="OTS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create overlapping fees with different start dates
    today = date.today()
    start_date1 = today - timedelta(days=100)  # Older start date
    start_date2 = today - timedelta(days=50)  # More recent start date
    end_date = today + timedelta(days=100)  # Both end in the future

    # Fee with older start date but longer range
    older_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("2.5"),
        start_date=start_date1,
        end_date=end_date,
    )

    # Fee with more recent start date (should be selected)
    newer_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("3.0"),
        start_date=start_date2,
        end_date=end_date,
    )

    loaded_db.add_all([older_fee, newer_fee])
    loaded_db.commit()

    # Test the fee_percentage property - should use the fee with more recent start date
    assert ps.fee_percentage == Decimal("3.0")

    # Clean up
    loaded_db.delete(older_fee)
    loaded_db.delete(newer_fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_overlapping_date_ranges_expression(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Overlapping Test Shop", abbr="OTS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create overlapping fees with different start dates
    today = date.today()
    start_date1 = today - timedelta(days=100)  # Older start date
    start_date2 = today - timedelta(days=50)  # More recent start date
    end_date = today + timedelta(days=100)  # Both end in the future

    # Fee with older start date but longer range
    older_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("2.5"),
        start_date=start_date1,
        end_date=end_date,
    )

    # Fee with more recent start date (should be selected)
    newer_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("3.0"),
        start_date=start_date2,
        end_date=end_date,
    )

    loaded_db.add_all([older_fee, newer_fee])
    loaded_db.commit()

    # Test the expressions by querying
    from sqlalchemy import select

    # Test fee_percentage expression
    fee_query = select(ProcurementShop.fee_percentage).where(ProcurementShop.id == ps.id)
    fee_result = loaded_db.execute(fee_query).scalar_one()
    assert fee_result == Decimal("3.0")

    # Test current_fee expression
    current_fee_query = select(ProcurementShop.current_fee).where(ProcurementShop.id == ps.id)
    current_fee_id = loaded_db.execute(current_fee_query).scalar_one()
    assert current_fee_id == newer_fee.id

    # Clean up
    loaded_db.delete(older_fee)
    loaded_db.delete(newer_fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_null_start_dates_with_overlapping_ranges(loaded_db, app_ctx):
    # Create a procurement shop
    ps = ProcurementShop(name="Null Date Test Shop", abbr="NTS")
    loaded_db.add(ps)
    loaded_db.flush()

    # Create overlapping fees, one with NULL start date
    today = date.today()
    start_date = today - timedelta(days=50)  # Explicit start date
    end_date = today + timedelta(days=100)  # Both end in the future

    # Fee with NULL start date
    null_start_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("1.5"),
        start_date=None,
        end_date=end_date,
    )

    # Fee with explicit start date (should be selected)
    explicit_start_fee = ProcurementShopFee(
        procurement_shop_id=ps.id,
        fee=Decimal("2.0"),
        start_date=start_date,
        end_date=end_date,
    )

    loaded_db.add_all([null_start_fee, explicit_start_fee])
    loaded_db.commit()

    # Test the current_fee property - should select the fee with explicit start date
    assert ps.current_fee is not None
    assert ps.current_fee.fee == Decimal("2.0")
    assert ps.current_fee.id == explicit_start_fee.id

    # Test the fee_percentage property
    assert ps.fee_percentage == Decimal("2.0")

    # Clean up
    loaded_db.delete(null_start_fee)
    loaded_db.delete(explicit_start_fee)
    loaded_db.delete(ps)
    loaded_db.commit()


def test_get_procurement_shop_fees_history(auth_client, loaded_db, app_ctx):
    """Test retrieving historical procurement shop fees."""
    # Find a procurement shop with fee history
    procurement_shop = loaded_db.scalars(
        select(ProcurementShop).where(ProcurementShop.procurement_shop_fees.any()).limit(1)
    ).first()

    if not procurement_shop:
        pytest.skip("No procurement shop with fee history found")

    # Get fees for the procurement shop
    shop_fees = loaded_db.scalars(
        select(ProcurementShopFee).where(ProcurementShopFee.procurement_shop_id == procurement_shop.id)
    ).all()

    assert len(shop_fees) > 0

    # Test API endpoint for getting procurement shop with fees
    response = auth_client.get(f"/api/v1/procurement-shops/{procurement_shop.id}")
    assert response.status_code == 200
    assert "procurement_shop_fees" in response.json
    assert len(response.json["procurement_shop_fees"]) == len(shop_fees)


def test_get_all_procurement_shops(auth_client, app_ctx):
    """Test retrieving all procurement shops."""
    response = auth_client.get("/api/v1/procurement-shops/")
    assert response.status_code == 200
    assert len(response.json) > 0

    # Verify schema structure
    for shop in response.json:
        assert "id" in shop
        assert "name" in shop
        assert "abbr" in shop
        assert "fee_percentage" in shop
        assert "current_fee" in shop
        assert "procurement_shop_fees" in shop
