import pytest

from models.cans import CLIN, ServicesComponent


@pytest.mark.usefixtures("app_ctx")
def test_clin_retrieve(loaded_db):
    clin = loaded_db.query(CLIN).filter(CLIN.name == "CLIN 1").one()

    assert clin is not None
    assert clin.name == "CLIN 1"
    assert clin.services_component is not None


def test_clin_creation(loaded_db):
    services_component = ServicesComponent(
        # Assuming a ServicesComponent object is required
        number=1,
        optional=False,
        description="Test Services Component",
    )

    clin = CLIN(name="456", source_id=789, services_component=services_component)

    # we technically don't need to add these to the DB, but if we change this
    # and need to test the loading, then we can still utilize it.
    # loaded_db.add(clin)
    # loaded_db.commit()

    assert clin is not None
    assert clin.name == "456"
    assert clin.services_component == services_component


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
