from ops.portfolio.models import Division
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_division_lookup(loaded_db):
    division = loaded_db.session.query(Division).get(1)
    assert division is not None
    assert division.name == "Division-1"
    assert division.abbreviation == "DV1"


def test_division_create():
    division = Division(name="Division-3", abbreviation="DV3")
    assert division.to_dict()["name"] == "Division-3"
    assert division.to_dict()["abbreviation"] == "DV3"
