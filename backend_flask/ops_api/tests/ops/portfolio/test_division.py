from ops.portfolio.models import Division


def test_division_lookup(db_session, init_database, db_tables):
    division = db_session.query(Division).get(1)
    assert division is not None
    assert division.name == "Division-1"
    assert division.abbreviation == "DV1"
    assert division.portfolio != []


def test_division_create():
    division = Division(name="Division-3", abbreviation="DV3")
    assert division.to_dict()["name"] == "Division-3"
    assert division.to_dict()["abbreviation"] == "DV3"
