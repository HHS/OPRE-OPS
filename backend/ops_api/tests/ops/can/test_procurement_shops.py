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
