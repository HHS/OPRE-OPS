import pytest
from sqlalchemy import select

from models import CANHistory, CANHistoryType, OpsEvent, Portfolio
from ops_api.ops.services.can_history import CANHistoryService
from ops_api.ops.services.can_messages import can_history_trigger


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history(loaded_db):
    test_can_id = 500
    count = loaded_db.query(CANHistory).where(CANHistory.can_id == test_can_id).count()
    can_history_service = CANHistoryService()
    # Set a limit higher than our test data so we can get all results
    response = can_history_service.get(test_can_id, 1000, 0, 2025)
    assert len(response) == count


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_custom_length():
    test_can_id = 500
    test_limit = 5
    can_history_service = CANHistoryService()
    # Set a limit higher than our test data so we can get all results
    response = can_history_service.get(test_can_id, test_limit, 0, 2025)
    assert len(response) == test_limit


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_custom_offset():
    test_can_id = 500
    can_history_service = CANHistoryService()
    # Set a limit higher than our test data so we can get all results
    response = can_history_service.get(test_can_id, 4, 1, 2025)
    offset_first_CAN = response[0]  # CANHistory#26
    offset_second_CAN = response[1]  # CANHistory#28
    # The CAN with ID 500 has ops events with id 1, then starting at ops event id 18 and moving forward
    # Therefore, we expect the ops_event_id to be 18 for the first item in the list offset by 1
    assert offset_first_CAN.ops_event_id == 26
    assert offset_first_CAN.history_type == CANHistoryType.CAN_NICKNAME_EDITED
    assert offset_second_CAN.ops_event_id == 28
    assert offset_second_CAN.history_type == CANHistoryType.CAN_FUNDING_CREATED


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_custom_fiscal_year():
    test_can_id = 516
    can_history_service = CANHistoryService()
    # Set a fiscal year which returns no cans
    response = can_history_service.get(test_can_id, 5, 0, 2025)
    assert len(response) == 0

    # Set a fiscal year which returns one can
    response_2 = can_history_service.get(test_can_id, 5, 0, 2026)
    assert len(response_2) == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_nonexistent_can():
    test_can_id = 300
    can_history_service = CANHistoryService()
    # Try to get a non-existent CAN and return an empty result instead of throwing any errors.
    response = can_history_service.get(test_can_id, 10, 0, 2025)
    assert len(response) == 0


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_ascending_sort():
    test_can_id = 501
    can_history_service = CANHistoryService()
    ascending_sort_response = can_history_service.get(test_can_id, 10, 0, 2025, True)
    oldest_can_history_event = ascending_sort_response[0]
    assert len(ascending_sort_response) == 2
    assert oldest_can_history_event.history_type == CANHistoryType.CAN_DATA_IMPORT

    descending_sort_response = can_history_service.get(test_can_id, 10, 0, 2025, False)
    assert len(descending_sort_response) == 2
    newest_can_history_event = descending_sort_response[0]
    assert newest_can_history_event.history_type == CANHistoryType.CAN_NICKNAME_EDITED


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api(auth_client, mocker):
    test_can_id = 500
    mock_can_history_list = []
    for x in range(1, 11):
        # These should be CanHistoryItem objects and not JSON objects ******
        mock_can_history_list.append(
            CANHistory(
                can_id=500,
                ops_event_id=x,
                history_title="CAN Imported!",
                history_message="CAN Imported by Reed on Wednesdsay January 1st",
                timestamp="2025-01-01T00:07:00.000000Z",
                history_type=CANHistoryType.CAN_DATA_IMPORT,
                fiscal_year=2025,
            )
        )

    mocker_get_can_history = mocker.patch("ops_api.ops.services.can_history.CANHistoryService.get")
    mocker_get_can_history.return_value = mock_can_history_list

    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}&fiscal_year=2025")
    assert response.status_code == 200
    assert len(response.json) == 10


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api_with_params(auth_client, mocker):
    test_can_id = 500
    mock_can_history_list = []
    for x in range(1, 6):
        # These should be CanHistoryItem objects and not JSON objects ******
        mock_can_history_list.append(
            CANHistory(
                can_id=500,
                ops_event_id=x,
                history_title="CAN Imported!",
                history_message="CAN Imported by Reed on Wednesdsay January 1st",
                timestamp="2025-01-01T00:07:00.000000Z",
                history_type=CANHistoryType.CAN_DATA_IMPORT,
                fiscal_year=2025,
            )
        )

    mocker_get_can_history = mocker.patch("ops_api.ops.services.can_history.CANHistoryService.get")
    mocker_get_can_history.return_value = mock_can_history_list

    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}&fiscal_year=2025&limit=5&offset=1")
    assert response.status_code == 200
    assert len(response.json) == 5


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api_with_bad_limit(auth_client):
    test_can_id = 500
    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}&fiscal_year=2025&limit=0")
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api_with_bad_offset(auth_client):
    test_can_id = 500
    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}&fiscal_year=2025&offset=-1")
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api_with_no_can_id(auth_client):
    response = auth_client.get("/api/v1/can-history/")
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_from_api_no_fiscal_year(auth_client, mocker):
    test_can_id = 500
    mock_can_history_list = []
    mocker_get_can_history = mocker.patch("ops_api.ops.services.can_history.CANHistoryService.get")
    mocker_get_can_history.return_value = mock_can_history_list
    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}")
    mocker_get_can_history.assert_called_once_with(test_can_id, 10, 0, 0, False)
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_from_api_asc_sort(auth_client, mocker):
    test_can_id = 500
    mock_can_history_list = []
    mocker_get_can_history = mocker.patch("ops_api.ops.services.can_history.CANHistoryService.get")
    mocker_get_can_history.return_value = mock_can_history_list
    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}&sort_asc=true")
    mocker_get_can_history.assert_called_once_with(test_can_id, 10, 0, 0, True)
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_get_can_history_list_from_api_with_nonexistent_can(auth_client, mocker):
    test_can_id = 400
    mock_can_history_list = []
    mocker_get_can_history = mocker.patch("ops_api.ops.services.can_history.CANHistoryService.get")
    mocker_get_can_history.return_value = mock_can_history_list

    response = auth_client.get(f"/api/v1/can-history/?can_id={test_can_id}&limit=5&offset=1")
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_create_can_can_history_event(loaded_db, test_create_can_history_item):
    before_can_history_count = loaded_db.query(CANHistory).count()
    can_history_trigger(test_create_can_history_item, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    can_history_list = loaded_db.query(CANHistory).all()
    after_can_history_count = len(can_history_list)
    assert after_can_history_count == before_can_history_count + 1

    new_can_history_item = can_history_list[after_can_history_count - 1]
    event_details = test_create_can_history_item.event_details
    assert new_can_history_item.can_id == event_details["new_can"]["id"]
    assert new_can_history_item.ops_event_id == test_create_can_history_item.id
    assert new_can_history_item.history_type == CANHistoryType.CAN_DATA_IMPORT
    assert new_can_history_item.history_title == "FY 2025 Data Import"
    assert new_can_history_item.history_message == "FY 2025 CAN Funding Information imported from CANBACs"
    assert new_can_history_item.timestamp == test_create_can_history_item.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    assert new_can_history_item.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_create_can_can_history_next_fiscal_year(loaded_db):
    next_fy_can_ops_event = loaded_db.get(OpsEvent, 17)
    can_history_trigger(next_fy_can_ops_event, loaded_db)

    loaded_db.flush()  # Ensure items are visible to queries
    # Filter for history items created by this specific ops event
    can_history_list = (
        loaded_db.query(CANHistory)
        .where(CANHistory.ops_event_id == next_fy_can_ops_event.id)
        .order_by(CANHistory.id)
        .all()
    )
    can_history_count = len(can_history_list)
    new_can_history_item = can_history_list[can_history_count - 1]

    assert new_can_history_item.history_type == CANHistoryType.CAN_DATA_IMPORT
    assert new_can_history_item.history_title == "FY 2026 Data Import"
    assert new_can_history_item.history_message == "FY 2026 CAN Funding Information imported from CANBACs"
    assert new_can_history_item.fiscal_year == 2026


@pytest.mark.usefixtures("app_ctx")
def test_create_can_history_create_can_funding_budget(loaded_db):
    funding_budget_created_event = loaded_db.get(OpsEvent, 20)
    can_history_trigger(funding_budget_created_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_history_list = loaded_db.query(CANHistory).where(CANHistory.ops_event_id == 20).all()
    can_history_count = len(can_history_list)
    new_can_history_item = can_history_list[can_history_count - 1]

    assert new_can_history_item.history_type == CANHistoryType.CAN_FUNDING_CREATED
    assert new_can_history_item.history_title == "FY 2025 Budget Entered"
    assert new_can_history_item.history_message == "System Owner entered a FY 2025 budget of $10,000.00"
    assert (
        new_can_history_item.can_id == funding_budget_created_event.event_details["new_can_funding_budget"]["can"]["id"]
    )
    assert new_can_history_item.timestamp == funding_budget_created_event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    assert new_can_history_item.fiscal_year == 2025

    funding_budget_created_event_2 = loaded_db.get(OpsEvent, 25)
    can_history_trigger(funding_budget_created_event_2, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    history_list = loaded_db.query(CANHistory).where(CANHistory.ops_event_id == 25).all()
    history_count = len(history_list)
    new_can_history_item_2 = history_list[history_count - 1]

    assert new_can_history_item_2.history_type == CANHistoryType.CAN_FUNDING_CREATED
    assert new_can_history_item_2.history_title == "FY 2025 Budget Entered"
    assert new_can_history_item_2.history_message == "Cliff Hill entered a FY 2025 budget of $30,000.00"
    assert (
        new_can_history_item_2.can_id
        == funding_budget_created_event_2.event_details["new_can_funding_budget"]["can"]["id"]
    )
    assert new_can_history_item_2.timestamp == funding_budget_created_event_2.created_on.strftime(
        "%Y-%m-%dT%H:%M:%S.%fZ"
    )
    assert new_can_history_item_2.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_create_create_can_funding_received(loaded_db):
    funding_received_created_event = loaded_db.get(OpsEvent, 21)
    can_history_trigger(funding_received_created_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_history_list = loaded_db.query(CANHistory).all()
    can_history_count = len(can_history_list)
    new_can_history_item = can_history_list[can_history_count - 1]

    assert new_can_history_item.history_type == CANHistoryType.CAN_RECEIVED_CREATED
    assert new_can_history_item.history_title == "Funding Received Added"
    assert (
        new_can_history_item.history_message
        == "Steve Tekell added funding received to funding ID 526 in the amount of $250,000.00"
    )
    assert (
        new_can_history_item.can_id
        == funding_received_created_event.event_details["new_can_funding_received"]["can_id"]
    )
    assert new_can_history_item.timestamp == funding_received_created_event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    assert new_can_history_item.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_create_can_history_delete_can_funding_received(loaded_db):
    funding_received_deleted_event = loaded_db.get(OpsEvent, 24)
    can_history_trigger(funding_received_deleted_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_history_list = loaded_db.query(CANHistory).all()
    can_history_count = len(can_history_list)
    new_can_history_item = can_history_list[can_history_count - 1]

    assert new_can_history_item.history_type == CANHistoryType.CAN_RECEIVED_DELETED
    assert new_can_history_item.history_title == "Funding Received Deleted"
    assert (
        new_can_history_item.history_message
        == "Steve Tekell deleted funding received for funding ID 526 in the amount of $1,000.00"
    )
    assert (
        new_can_history_item.can_id
        == funding_received_deleted_event.event_details["deleted_can_funding_received"]["id"]
    )
    assert new_can_history_item.timestamp == funding_received_deleted_event.created_on.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    assert new_can_history_item.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_can_can_history(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 26)
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_update_history_events = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 26)).scalars().all()
    )
    assert len(can_update_history_events) == 4

    nickname_can_history_event = can_update_history_events[0]
    assert nickname_can_history_event.history_title == "Nickname Edited"
    assert nickname_can_history_event.history_message == "Steve Tekell edited the nickname from New CAN to HMRF-OPRE"
    assert nickname_can_history_event.history_type == CANHistoryType.CAN_NICKNAME_EDITED
    assert nickname_can_history_event.fiscal_year == 2025
    description_can_history_event = can_update_history_events[1]
    assert description_can_history_event.history_title == "Description Edited"
    assert description_can_history_event.history_message == "Steve Tekell edited the description"
    assert description_can_history_event.history_type == CANHistoryType.CAN_DESCRIPTION_EDITED
    assert description_can_history_event.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_can_funding_budget_can_history(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 22)
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_funding_budget_updates = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 22)).scalars().all()
    )
    assert len(can_funding_budget_updates) == 2

    funding_budget_history_event = can_funding_budget_updates[1]
    assert funding_budget_history_event.history_title == "FY 2025 Budget Edited"
    assert (
        funding_budget_history_event.history_message
        == "Steve Tekell edited the FY 2025 budget from $1,000,000.00 to $1,140,000.00"
    )
    assert funding_budget_history_event.history_type == CANHistoryType.CAN_FUNDING_EDITED
    assert funding_budget_history_event.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_can_funding_received_can_history(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 23)
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_funding_received_updates = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 23)).scalars().all()
    )
    assert len(can_funding_received_updates) == 2

    funding_received_history_event = can_funding_received_updates[1]
    assert funding_received_history_event.history_title == "Funding Received Edited"
    assert (
        funding_received_history_event.history_message
        == "Steve Tekell edited funding received for funding ID 500 from $880,000.00 to $1,000,000.00"
    )
    assert funding_received_history_event.history_type == CANHistoryType.CAN_RECEIVED_EDITED
    assert funding_received_history_event.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_can_portfolio_can_history_regular_user(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 27)
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_update_history_events = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 27)).scalars().all()
    )
    assert len(can_update_history_events) == 4
    portfolio_4 = loaded_db.get(Portfolio, 4)
    portfolio_1 = loaded_db.get(Portfolio, 1)
    can_portfolio_event = can_update_history_events[2]
    can_division_event = can_update_history_events[3]
    assert can_portfolio_event.history_title == "CAN Portfolio Edited"
    assert (
        can_portfolio_event.history_message
        == f"Steve Tekell changed the portfolio from {portfolio_4.name} to {portfolio_1.name}"
    )
    assert can_portfolio_event.history_type == CANHistoryType.CAN_PORTFOLIO_EDITED
    assert can_portfolio_event.fiscal_year == 2025

    assert can_division_event.history_title == "CAN Division Edited"
    assert (
        can_division_event.history_message
        == f"Steve Tekell changed the division from {portfolio_4.division.name} to {portfolio_1.division.name}"
    )
    assert can_division_event.history_type == CANHistoryType.CAN_DIVISION_EDITED
    assert can_division_event.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_can_portfolio_can_history_system_user(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 29)
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_update_history_events = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 29)).scalars().all()
    )
    assert len(can_update_history_events) == 4
    portfolio_1 = loaded_db.get(Portfolio, 1)
    portfolio_6 = loaded_db.get(Portfolio, 6)
    can_portfolio_event = can_update_history_events[2]
    can_division_event = can_update_history_events[3]
    assert can_portfolio_event.history_title == "CAN Portfolio Edited"
    assert (
        can_portfolio_event.history_message
        == f"CAN portfolio changed from {portfolio_1.name} to {portfolio_6.name} during FY 2025 data import"
    )
    assert can_portfolio_event.history_type == CANHistoryType.CAN_PORTFOLIO_EDITED
    assert can_portfolio_event.fiscal_year == 2025

    assert can_division_event.history_title == "CAN Division Edited"
    assert (
        can_division_event.history_message
        == f"CAN division changed from {portfolio_1.division.name} to {portfolio_6.division.name} during FY 2025 data import"
    )
    assert can_division_event.history_type == CANHistoryType.CAN_DIVISION_EDITED
    assert can_division_event.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_can_nickname_system_user(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 30)
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_update_history_events = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 30)).scalars().all()
    )
    assert len(can_update_history_events) == 2

    nickname_event = can_update_history_events[1]

    assert nickname_event.history_title == "Nickname Edited"
    assert (
        nickname_event.history_message
        == "Nickname changed from Interagency Agreements to IAA-Incoming during FY 2025 data import"
    )
    assert nickname_event.history_type == CANHistoryType.CAN_NICKNAME_EDITED
    assert nickname_event.fiscal_year == 2025


@pytest.mark.usefixtures("app_ctx")
def test_update_no_duplicate_messages(loaded_db):
    update_can_event = loaded_db.get(OpsEvent, 30)
    can_history_trigger(update_can_event, loaded_db)
    # trigger can history call a second time, which is occasionally possible during normal run of the test
    can_history_trigger(update_can_event, loaded_db)
    loaded_db.flush()  # Ensure items are visible to queries
    can_update_history_events = (
        loaded_db.execute(select(CANHistory).where(CANHistory.ops_event_id == 30)).scalars().all()
    )
    assert len(can_update_history_events) == 2
