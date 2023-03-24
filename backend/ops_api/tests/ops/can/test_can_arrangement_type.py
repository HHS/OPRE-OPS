import pytest
from models.cans import CANArrangementType


@pytest.mark.usefixtures("app_ctx")
def test_can_arrangement_type_retrieve_all(loaded_db):
    assert len(CANArrangementType) == 5
