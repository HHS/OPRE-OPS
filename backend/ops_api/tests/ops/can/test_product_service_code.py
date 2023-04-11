import pytest
from models.cans import ProductServiceCode


@pytest.mark.usefixtures("app_ctx")
def test_agreement_type_retrieve_all(loaded_db):
    assert len(ProductServiceCode) == 6


@pytest.mark.usefixtures("app_ctx")
def test_product_service_code_lookup(loaded_db):
    psc = loaded_db.query(ProductServiceCode).filter(ProductServiceCode.id == 1).one()
    assert psc is not None
    assert psc.id == 1
    assert psc.name == "Service-Code-1"
    assert psc.description == ""
