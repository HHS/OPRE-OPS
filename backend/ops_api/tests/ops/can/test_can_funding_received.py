from decimal import Decimal

from sqlalchemy import select

from models import CANFundingReceived
from ops_api.ops.services.can_funding_received import CANFundingReceivedService
from ops_api.tests.utils import DummyContextManager

input_data = {
    "can_id": 500,
    "fiscal_year": 2024,
    "funding": 123456.12,
    "notes": "Test Note",
}


def test_funding_received_get_all(auth_client, mocker, test_can, app_ctx):
    mocker_get_can = mocker.patch("ops_api.ops.services.can_funding_received.CANFundingReceivedService.get_list")
    mocker_get_can.return_value = [test_can]
    response = auth_client.get("/api/v1/can-funding-received/")
    assert response.status_code == 200
    assert len(response.json) == 1
    mocker_get_can.assert_called_once()


def test_funding_received_service_get_all(auth_client, loaded_db):
    count = loaded_db.query(CANFundingReceived).count()
    can_funding_received_service = CANFundingReceivedService()
    response = can_funding_received_service.get_list()
    assert len(response) == count


def test_funding_received_get_by_id(auth_client, mocker, test_can, app_ctx):
    mocker_get_can = mocker.patch("ops_api.ops.services.can_funding_received.CANFundingReceivedService.get")
    mocker_get_can.return_value = test_can
    response = auth_client.get(f"/api/v1/can-funding-received/{test_can.id}")
    assert response.status_code == 200


def test_funding_received_service_get_by_id(test_can):
    service = CANFundingReceivedService()
    can = service.get(test_can.id)
    assert test_can.id == can.id


# Testing CANFundingReceived Creation
def test_funding_received_post_400_missing_funding(budget_team_auth_client):
    response = budget_team_auth_client.post(
        "/api/v1/can-funding-received/",
        json={"can_id": 500, "fiscal_year": 2024, "notes": "Test Note"},
    )

    assert response.status_code == 400
    assert response.json["funding"][0] == "Missing data for required field."


# Testing CANFundingReceived Creation
def test_funding_received_post_creates_funding_received(budget_team_auth_client, mocker, app_ctx):
    mock_output_data = CANFundingReceived(can_id=500, fiscal_year=2024, funding=Decimal("123456.12"), notes="Test Note")
    mocker_create_funding_received = mocker.patch(
        "ops_api.ops.services.can_funding_received.CANFundingReceivedService.create"
    )
    mocker_create_funding_received.return_value = mock_output_data
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.post("/api/v1/can-funding-received/", json=input_data)

    assert response.status_code == 201
    assert context_manager.metadata["new_can_funding_received"] is not None
    assert context_manager.metadata["new_can_funding_received"]["can_id"] == mock_output_data.can_id
    assert context_manager.metadata["new_can_funding_received"]["funding"] == float(mock_output_data.funding)
    assert context_manager.metadata["new_can_funding_received"]["id"] == mock_output_data.id
    mocker_create_funding_received.assert_called_once_with(
        {
            "can_id": 500,
            "fiscal_year": 2024,
            "funding": Decimal("123456.12"),
            "notes": "Test Note",
        }
    )
    assert response.json["id"] == mock_output_data.id
    assert response.json["can_id"] == mock_output_data.can_id
    assert response.json["fiscal_year"] == mock_output_data.fiscal_year
    assert response.json["funding"] == float(mock_output_data.funding)


def test_basic_user_cannot_post_funding_received(basic_user_auth_client, app_ctx):
    response = basic_user_auth_client.post("/api/v1/can-funding-received/", json=input_data)

    assert response.status_code == 403


def test_service_create_funding_received(loaded_db):
    service = CANFundingReceivedService()

    new_funding = service.create(input_data)

    funding_received = loaded_db.execute(
        select(CANFundingReceived).where(CANFundingReceived.id == new_funding.id)
    ).scalar_one()

    assert funding_received is not None
    assert funding_received.can_id == 500
    assert funding_received.notes == "Test Note"
    assert funding_received.fiscal_year == 2024
    assert funding_received.id == new_funding.id
    assert funding_received == new_funding

    loaded_db.delete(new_funding)
    loaded_db.commit()


# Testing updating CANs by PATCH
def test_funding_received_patch(budget_team_auth_client, mocker, app_ctx):
    test_funding_id = 600
    update_data = {
        "notes": "Fake test update",
    }

    old_funding_received = CANFundingReceived(can_id=500, fiscal_year=2024, funding=123456, notes="Test Note")
    funding_received = CANFundingReceived(can_id=500, fiscal_year=2024, funding=123456, notes="Fake test update")

    mocker_update_funding_received = mocker.patch(
        "ops_api.ops.services.can_funding_received.CANFundingReceivedService.update"
    )
    mocker_get_funding_received = mocker.patch(
        "ops_api.ops.services.can_funding_received.CANFundingReceivedService.get"
    )
    mocker_get_funding_received.return_value = old_funding_received
    mocker_update_funding_received.return_value = funding_received
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.patch(f"/api/v1/can-funding-received/{test_funding_id}", json=update_data)

    assert context_manager.metadata["funding_received_updates"]["changes"] is not None
    changes = context_manager.metadata["funding_received_updates"]["changes"]
    assert len(changes.keys()) == 1
    # assert that new data we expect is on the context manager
    assert changes["notes"]["new_value"] == update_data["notes"]
    assert changes["notes"]["old_value"] == old_funding_received.notes
    assert response.status_code == 200
    mocker_update_funding_received.assert_called_once_with(update_data, test_funding_id)
    assert response.json["funding"] == funding_received.funding
    assert response.json["notes"] == funding_received.notes


def test_funding_received_patch_404(budget_team_auth_client, app_ctx):
    test_funding_id = 600
    update_data = {
        "notes": "Test CANFundingReceived Created by unit test",
    }

    response = budget_team_auth_client.patch(f"/api/v1/can-funding-received/{test_funding_id}", json=update_data)

    assert response.status_code == 404


def test_basic_user_cannot_patch_funding_received(basic_user_auth_client, app_ctx):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.patch("/api/v1/can-funding-received/517", json=data)

    assert response.status_code == 403


def test_service_patch_funding_received(loaded_db):
    update_data = {
        "notes": "Test Test Test",
    }

    input_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "funding": 123456,
        "notes": "Test Note",
    }

    funding_received_service = CANFundingReceivedService()

    new_funding_received = funding_received_service.create(input_data)

    updated_funding_received = funding_received_service.update(update_data, new_funding_received.id)

    funding_received = loaded_db.execute(
        select(CANFundingReceived).where(CANFundingReceived.id == new_funding_received.id)
    ).scalar_one()

    assert funding_received is not None
    assert funding_received.funding == 123456
    assert updated_funding_received.funding == 123456
    assert funding_received.notes == "Test Test Test"
    assert updated_funding_received.notes == "Test Test Test"

    loaded_db.delete(new_funding_received)
    loaded_db.commit()


# Testing updating CANFundingReceived by PUT
def test_funding_received_put(budget_team_auth_client, mocker, app_ctx):
    test_funding_received_id = 517
    update_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "funding": Decimal("234567.89"),
    }

    old_funding_received = CANFundingReceived(
        can_id=500, fiscal_year=2024, funding=Decimal("123456.12"), notes="Test Note"
    )
    funding_received = CANFundingReceived(can_id=500, fiscal_year=2024, funding=Decimal("234567.89"))

    mocker_update_funding_received = mocker.patch(
        "ops_api.ops.services.can_funding_received.CANFundingReceivedService.update"
    )
    mocker_get_funding_received = mocker.patch(
        "ops_api.ops.services.can_funding_received.CANFundingReceivedService.get"
    )
    mocker_get_funding_received.return_value = old_funding_received
    mocker_update_funding_received.return_value = funding_received
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.put(f"/api/v1/can-funding-received/{test_funding_received_id}", json=update_data)

    assert context_manager.metadata["funding_received_updates"]["changes"] is not None
    changes = context_manager.metadata["funding_received_updates"]["changes"]
    assert len(changes.keys()) == 2
    # assert that new data we expect is on the context manager
    assert changes["funding"]["new_value"] == 234567.89
    assert changes["funding"]["old_value"] == 123456.12
    update_data["notes"] = None
    assert response.status_code == 200
    mocker_update_funding_received.assert_called_once_with(update_data, test_funding_received_id)
    assert response.json["funding"] == 234567.89
    assert response.json["can_id"] == funding_received.can_id


def test_basic_user_cannot_put_funding_received(basic_user_auth_client, app_ctx):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.put("/api/v1/can-funding-received/517", json=data)

    assert response.status_code == 403


def test_funding_received_put_404(budget_team_auth_client, app_ctx):
    test_funding_received_id = 600

    response = budget_team_auth_client.put(f"/api/v1/can-funding-received/{test_funding_received_id}", json=input_data)

    assert response.status_code == 404


def test_service_update_funding_received_with_nones(loaded_db):
    update_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "funding": 123456.12,
        "notes": None,
    }

    funding_received_service = CANFundingReceivedService()

    new_funding_received = funding_received_service.create(input_data)

    updated_funding_received = funding_received_service.update(update_data, new_funding_received.id)

    funding_received = loaded_db.execute(
        select(CANFundingReceived).where(CANFundingReceived.id == updated_funding_received.id)
    ).scalar_one()

    assert funding_received is not None
    assert funding_received.can_id == 500
    assert updated_funding_received.can_id == 500
    assert funding_received.notes is None
    assert updated_funding_received.notes is None
    assert funding_received.fiscal_year == 2024
    assert updated_funding_received.fiscal_year == 2024
    assert funding_received.funding == Decimal("123456.12")
    assert updated_funding_received.funding == Decimal("123456.12")

    loaded_db.delete(new_funding_received)
    loaded_db.commit()


# Testing deleting CANFundingReceived
def test_funding_received_delete(budget_team_auth_client, mocker, test_budget_team_user, app_ctx):
    test_funding_received_id = 517

    mocker_delete_funding_received = mocker.patch(
        "ops_api.ops.services.can_funding_received.CANFundingReceivedService.delete"
    )
    funding_received = CANFundingReceived(
        can_id=test_funding_received_id,
        fiscal_year=2024,
        funding=Decimal("123456.12"),
        notes="Test Note",
        created_by=test_budget_team_user.id,
    )
    mocker_delete_funding_received.return_value = funding_received
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")

    response = budget_team_auth_client.delete(f"/api/v1/can-funding-received/{test_funding_received_id}")

    assert context_manager.metadata["deleted_can_funding_received"] is not None
    assert context_manager.metadata["deleted_can_funding_received"]["can_id"] == test_funding_received_id
    assert context_manager.metadata["deleted_can_funding_received"]["funding"] == float(funding_received.funding)
    assert context_manager.metadata["deleted_can_funding_received"]["created_by"] == test_budget_team_user.id

    assert response.status_code == 200
    mocker_delete_funding_received.assert_called_once_with(test_funding_received_id)
    assert response.json["message"] == "CANFundingReceived deleted"
    assert response.json["id"] == test_funding_received_id


def test_can_delete_404(budget_team_auth_client, mocker, app_ctx):
    test_can_id = 600
    response = budget_team_auth_client.delete(f"/api/v1/can-funding-received/{test_can_id}")

    assert response.status_code == 404


def test_basic_user_cannot_delete_cans(basic_user_auth_client, mocker, app_ctx):
    response = basic_user_auth_client.delete("/api/v1/can-funding-received/517")
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    assert response.status_code == 403


def test_service_delete_can(loaded_db):
    funding_received_service = CANFundingReceivedService()

    new_funding_received = funding_received_service.create(input_data)

    funding_received_service.delete(new_funding_received.id)

    stmt = select(CANFundingReceived).where(CANFundingReceived.id == new_funding_received.id)
    can = loaded_db.scalar(stmt)

    assert can is None


def test_funding_received_list_uses_lightweight_schema(auth_client, app_ctx):
    """
    Test that the list endpoint returns lightweight schema without expensive nested relationships.
    This verifies the performance optimization that excludes: can, created_by_user, updated_by_user.
    """
    response = auth_client.get("/api/v1/can-funding-received/")
    assert response.status_code == 200
    assert len(response.json) > 0

    funding_received = response.json[0]

    # Verify required fields are present
    assert "id" in funding_received
    assert "can_id" in funding_received
    assert "fiscal_year" in funding_received
    assert "funding" in funding_received
    assert "notes" in funding_received
    assert "created_on" in funding_received
    assert "updated_on" in funding_received

    # Verify expensive nested fields are NOT present (performance optimization)
    assert "can" not in funding_received, "Nested 'can' object should not be in list response (causes N+1 queries)"
    assert (
        "created_by_user" not in funding_received
    ), "Nested 'created_by_user' should not be in list response (causes N+1 queries)"
    assert (
        "updated_by_user" not in funding_received
    ), "Nested 'updated_by_user' should not be in list response (causes N+1 queries)"
    assert "display_name" not in funding_received, "Unused 'display_name' field should not be in list response"
    assert "created_by" not in funding_received, "Unused 'created_by' field should not be in list response"
    assert "updated_by" not in funding_received, "Unused 'updated_by' field should not be in list response"
