import pytest

from models import CANHistory

# from ops.services.can_history import CANHistoryService

# from sqlalchemy import select


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history(loaded_db):
    loaded_db.query(CANHistory)
