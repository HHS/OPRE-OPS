import pytest

from models import ProductServiceCode


@pytest.mark.usefixtures("app_ctx")
def test_get_product_service_code_list(auth_client):
    response = auth_client.get("/api/v1/product-service-codes/")
    assert response.status_code == 200
    assert len(response.json) == 2


@pytest.mark.usefixtures("app_ctx")
def test_product_service_code_lookup(loaded_db):
    psc = loaded_db.query(ProductServiceCode).filter(ProductServiceCode.id == 2).one()
    assert psc is not None
    assert psc.id == 2
    assert psc.name == "Convention and Trade Shows"
    assert psc.naics == 561920
    assert psc.display_name == psc.name
