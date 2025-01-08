import pytest

from models import CANHistory
from ops.services.can_history import CANHistoryService

# from sqlalchemy import select


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history(loaded_db):
    test_can_id = 500
    count = loaded_db.query(CANHistory).where(CANHistory.can_id == test_can_id).count()
    can_history_service = CANHistoryService()
    # Set a limit higher than our test data so we can get all results
    response = can_history_service.get(test_can_id, 1000, 0)
    assert len(response) == count
