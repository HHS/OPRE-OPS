import pytest
from models.procurement_shops import ProcurementShop


@pytest.mark.usefixtures("app_ctx")
def test_procurement_shop_lookup(loaded_db):
    ps = loaded_db.get(ProcurementShop, 1)
    assert ps is not None
    assert ps.id == 1
    assert ps.name == "Product Service Center"
    assert ps.abbr == "PSC"
    assert ps.fee == 0


def test_procurement_shop_creation():
    ps = ProcurementShop(
        name="Whatever",
        abbr="WHO",
        fee=0.1,
    )
    assert ps.to_dict()["fee"] == 0.1


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
    print(response.data)
    assert response.json["id"] == 1
