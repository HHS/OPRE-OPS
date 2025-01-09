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


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api(auth_client, mocker):
    test_can_id = 500

    mocker_get_can_history = mocker.patch("ops_api.ops.services.can_history.CANHistoryService.get")

    mock_can_history_list = []
    for x in range(1, 10):
        # These should be CanHistoryItem objects and not JSON objects ******
        mock_can_history_list.append(
            {
                "can_id": 500,
                "ops_event_id": x,
                "history_title": "CAN Imported!",
                "history_message": "CAN Imported by Reed on Wednesdsay January 1st",
                "timestamp": "2025-01-01T00:07:00.000000Z",
                "history_type": "CAN_DATA_IMPORT",
            }
        )

    mocker_get_can_history.return_value(mock_can_history_list)

    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}")
    assert response.status_code == 200
    assert len(response.json) == 10

    # response_2 = auth_client.get("/api/v1/can-history/?can_id=501")
    # assert response_2.status_code == 200
    # assert len(response_2.json) == 1
