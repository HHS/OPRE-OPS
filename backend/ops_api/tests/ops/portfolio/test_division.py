from models.portfolios import Division


def test_division_lookup(loaded_db, app_ctx):
    division = loaded_db.get(Division, 1)
    assert division is not None
    assert division.name == "Child Care"
    assert division.abbreviation == "CC"
    assert division.display_name == division.name


def test_division_create():
    division = Division(name="Division-3", abbreviation="DV3")
    assert division.to_dict()["name"] == "Division-3"
    assert division.to_dict()["abbreviation"] == "DV3"


def test_get_divisions_list(auth_client, app_ctx):
    response = auth_client.get("/api/v1/divisions/")
    assert response.status_code == 200
    assert len(response.json) == 9


def test_get_divisions_by_id(auth_client, app_ctx):
    response = auth_client.get("/api/v1/divisions/1")
    assert response.status_code == 200
    assert response.json["id"] == 1
