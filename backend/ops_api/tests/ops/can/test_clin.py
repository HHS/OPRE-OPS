import pytest

from models import CLIN


@pytest.mark.usefixtures("app_ctx")
def test_clin_retrieve(loaded_db):
    clin = loaded_db.query(CLIN).filter(CLIN.name == "CLIN 1").one()

    assert clin is not None
    assert clin.name == "CLIN 1"
    assert clin.number == 1
    assert len(clin.budget_line_items) > 0


@pytest.mark.usefixtures("app_ctx")
def test_clin_get_all(auth_client, loaded_db):
    # count = loaded_db.query(CLIN).count()

    response = auth_client.get("/api/v1/clins/")
    assert response.status_code == 404
    # assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_clin_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/clins/123")
    assert response.status_code == 404
    # assert response.json["name"] == "123"
    # assert "services_component" in response.json
