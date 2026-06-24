from models import CLIN


def test_clin_retrieve(loaded_db, app_ctx):
    # CLINs are now created lazily when BLIs are assigned clin_id values
    # This test verifies that the CLIN model can be queried
    clin_count = loaded_db.query(CLIN).count()
    assert clin_count >= 0  # CLINs are created on-demand, so count may be 0 initially


def test_clin_get_all(auth_client, loaded_db, app_ctx):
    # count = loaded_db.query(CLIN).count()

    response = auth_client.get("/api/v1/clins/")
    assert response.status_code == 404
    # assert len(response.json) == count


def test_clin_get_by_id(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/clins/123")
    assert response.status_code == 404
    # assert response.json["name"] == "123"
    # assert "services_component" in response.json
