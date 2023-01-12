from ops.models.cans import CANArrangementType
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_can_arrangement_type_retrieve_all(loaded_db):
    can_at = loaded_db.session.query(CANArrangementType).all()
    assert len(can_at) == 5


@pytest.mark.parametrize(
    "id,name",
    [(1, "OPRE Appropriation"), (2, "Cost Share"), (3, "IAA"), (4, "IDDA"), (5, "MOU")],
)
@pytest.mark.usefixtures("app_ctx")
def test_can_arrangement_type_lookup(loaded_db, id, name):
    can_at = loaded_db.session.query(CANArrangementType).get(id)
    assert can_at.name == name
