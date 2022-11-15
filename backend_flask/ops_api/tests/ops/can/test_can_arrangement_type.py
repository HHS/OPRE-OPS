from ops.can.models import CANArrangementType
import pytest


def test_can_arrangement_type_retrieve_all(db_session, init_database, db_tables):
    can_at = db_session.query(CANArrangementType).all()
    assert len(can_at) == 5


@pytest.mark.parametrize(
    "id,name",
    [(1, "OPRE Appropriation"), (2, "Cost Share"), (3, "IAA"), (4, "IDDA"), (5, "MOU")],
)
def test_can_arrangement_type_lookup(db_session, init_database, db_tables, id, name):
    can_at = db_session.query(CANArrangementType).get(id)
    assert can_at.name == name
