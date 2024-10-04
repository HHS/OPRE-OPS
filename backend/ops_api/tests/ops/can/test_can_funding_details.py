import pytest
from sqlalchemy import select

from models import CANFundingDetails, CANMethodOfTransfer
from ops.services.can_funding_details import CANFundingDetailsService


@pytest.mark.usefixtures("app_ctx")
def test_funding_details_get_all(auth_client, mocker, test_can_funding_details):
    mocker_get_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.get_list"
    )
    mocker_get_funding_details.return_value = [test_can_funding_details]
    response = auth_client.get("/api/v1/can-funding-details/")
    assert response.status_code == 200
    assert len(response.json) == 1
    mocker_get_funding_details.assert_called_once()


def test_service_can_get_all(loaded_db):
    count = loaded_db.query(CANFundingDetails).count()
    budget_service = CANFundingDetailsService()
    response = budget_service.get_list()
    assert len(response) == count


@pytest.mark.usefixtures("app_ctx")
def test_funding_details_get_by_id(auth_client, mocker, test_can_funding_details):
    mocker_get_funding_details = mocker.patch("ops_api.ops.services.can_funding_details.CANFundingDetailsService.get")
    mocker_get_funding_details.return_value = test_can_funding_details
    response = auth_client.get(f"/api/v1/can-funding-details/{test_can_funding_details.id}")
    assert response.status_code == 200
    assert response.json["fiscal_year"] == 2023
    assert response.json["fund_code"] == "AAXXXX20231DAD"
    assert response.json["method_of_transfer"] == "DIRECT"
    assert response.json["funding_source"] == "OPRE"


def test_funding_details_service_get_by_id(test_can_funding_details):
    service = CANFundingDetailsService()
    funding_budget = service.get(test_can_funding_details.id)
    assert test_can_funding_details.id == funding_budget.id
    assert test_can_funding_details.fund_code == funding_budget.fund_code
    assert test_can_funding_details.method_of_transfer == funding_budget.method_of_transfer


# Testing CANFundingDetails Creation
@pytest.mark.usefixtures("app_ctx")
def test_funding_details_post_creates_funding_details(budget_team_auth_client, mocker):
    input_data = {"fund_code": "AAXXXX20241DAD", "fiscal_year": 2024, "method_of_transfer": "DIRECT"}

    mock_output_data = CANFundingDetails(
        fund_code="AAXXXX20241DAD", fiscal_year=2024, method_of_transfer=CANMethodOfTransfer.DIRECT
    )
    mocker_create_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.create"
    )
    mocker_create_funding_details.return_value = mock_output_data
    response = budget_team_auth_client.post("/api/v1/can-funding-details/", json=input_data)

    assert response.status_code == 201
    # Changing the value after the call to the deserialized verison of the ENUM.
    input_data["method_of_transfer"] = CANMethodOfTransfer.DIRECT
    mocker_create_funding_details.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["fund_code"] == mock_output_data.fund_code
    assert response.json["fiscal_year"] == mock_output_data.fiscal_year
    assert response.json["method_of_transfer"] == "DIRECT"


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_post_funding_details(basic_user_auth_client):
    input_data = {"fund_code": "AAXXXX20241DAD", "fiscal_year": 2024, "method_of_transfer": "DIRECT"}
    response = basic_user_auth_client.post("/api/v1/can-funding-details/", json=input_data)

    assert response.status_code == 401


def test_service_create_funding_details(loaded_db):
    input_data = {"fund_code": "AAXXXX20241DAD", "fiscal_year": 2024, "method_of_transfer": CANMethodOfTransfer.DIRECT}

    service = CANFundingDetailsService()

    new_budget = service.create(input_data)

    funding_budget = loaded_db.execute(
        select(CANFundingDetails).where(CANFundingDetails.id == new_budget.id)
    ).scalar_one()

    assert funding_budget is not None
    assert funding_budget.fund_code == "AAXXXX20241DAD"
    assert funding_budget.method_of_transfer == CANMethodOfTransfer.DIRECT
    assert funding_budget.fiscal_year == 2024
    assert funding_budget.active_period == 1
    assert funding_budget == new_budget

    loaded_db.delete(new_budget)
    loaded_db.commit()


# Testing updating CANs by PATCH
@pytest.mark.usefixtures("app_ctx")
def test_funding_details_patch(budget_team_auth_client, mocker):
    test_budget_id = 600
    update_data = {
        "notes": "Fake test update",
    }

    funding_budget = CANFundingDetails(can_id=500, fiscal_year=2024, budget=123456, notes="This is a note")
    mocker_update_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.update"
    )
    funding_budget.notes = update_data["notes"]
    mocker_update_funding_details.return_value = funding_budget
    response = budget_team_auth_client.patch(f"/api/v1/can-funding-details/{test_budget_id}", json=update_data)

    assert response.status_code == 200
    mocker_update_funding_details.assert_called_once_with(update_data, test_budget_id)
    assert response.json["budget"] == funding_budget.budget
    assert response.json["notes"] == funding_budget.notes


@pytest.mark.usefixtures("app_ctx")
def test_funding_details_patch_404(budget_team_auth_client):
    test_budget_id = 518
    update_data = {
        "notes": "Test CANFundingDetails Created by unit test",
    }

    response = budget_team_auth_client.patch(f"/api/v1/can-funding-details/{test_budget_id}", json=update_data)

    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_patch_funding_detailss(basic_user_auth_client):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.patch("/api/v1/can-funding-details/517", json=data)

    assert response.status_code == 401


def test_service_patch_funding_details(loaded_db):
    update_data = {
        "notes": "Test Test Test",
    }

    input_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "This is a note"}

    budget_service = CANFundingDetailsService()

    new_funding_details = budget_service.create(input_data)

    updated_funding_details = budget_service.update(update_data, new_funding_details.id)

    funding_budget = loaded_db.execute(
        select(CANFundingDetails).where(CANFundingDetails.id == new_funding_details.id)
    ).scalar_one()

    assert funding_budget is not None
    assert funding_budget.budget == 123456
    assert updated_funding_details.budget == 123456
    assert funding_budget.notes == "Test Test Test"
    assert updated_funding_details.notes == "Test Test Test"

    loaded_db.delete(new_funding_details)
    loaded_db.commit()


# Testing updating CANFundingDetailss by PUT
@pytest.mark.usefixtures("app_ctx")
def test_funding_details_put(budget_team_auth_client, mocker):
    test_funding_details_id = 517
    update_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 234567,
    }

    funding_budget = CANFundingDetails(can_id=500, fiscal_year=2024, budget=123456, notes="This is a note")

    mocker_update_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.update"
    )
    funding_budget.budget = update_data["budget"]
    mocker_update_funding_details.return_value = funding_budget
    response = budget_team_auth_client.put(f"/api/v1/can-funding-details/{test_funding_details_id}", json=update_data)

    update_data["notes"] = None
    assert response.status_code == 200
    mocker_update_funding_details.assert_called_once_with(update_data, test_funding_details_id)
    assert response.json["budget"] == funding_budget.budget
    assert response.json["can_id"] == funding_budget.can_id


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_put_funding_details(basic_user_auth_client):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.put("/api/v1/can-funding-details/517", json=data)

    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_funding_details_put_404(budget_team_auth_client):
    test_funding_details_id = 518
    update_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "Test test test"}

    response = budget_team_auth_client.put(f"/api/v1/can-funding-details/{test_funding_details_id}", json=update_data)

    assert response.status_code == 404


def test_service_update_funding_details_with_nones(loaded_db):
    update_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": None}

    test_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "Test Notes"}

    funding_budget_service = CANFundingDetailsService()

    new_funding_details = funding_budget_service.create(test_data)

    updated_funding_details = funding_budget_service.update(update_data, new_funding_details.id)

    funding_budget = loaded_db.execute(
        select(CANFundingDetails).where(CANFundingDetails.id == updated_funding_details.id)
    ).scalar_one()

    assert funding_budget is not None
    assert funding_budget.can_id == 500
    assert updated_funding_details.can_id == 500
    assert funding_budget.notes is None
    assert updated_funding_details.notes is None
    assert funding_budget.fiscal_year == 2024
    assert updated_funding_details.fiscal_year == 2024
    assert funding_budget.budget == 123456
    assert updated_funding_details.budget == 123456

    loaded_db.delete(new_funding_details)
    loaded_db.commit()


# Testing deleting CANFundingDetailss
@pytest.mark.usefixtures("app_ctx")
def test_funding_details_delete(budget_team_auth_client, mocker):
    test_funding_details_id = 517

    mocker_delete_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.delete"
    )
    response = budget_team_auth_client.delete(f"/api/v1/can-funding-details/{test_funding_details_id}")

    assert response.status_code == 200
    mocker_delete_funding_details.assert_called_once_with(test_funding_details_id)
    assert response.json["message"] == "CANFundingDetails deleted"
    assert response.json["id"] == test_funding_details_id


@pytest.mark.usefixtures("app_ctx")
def test_can_delete_404(budget_team_auth_client):
    test_can_id = 500

    response = budget_team_auth_client.delete(f"/api/v1/can-funding-details/{test_can_id}")

    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_delete_cans(basic_user_auth_client):
    response = basic_user_auth_client.delete("/api/v1/can-funding-details/517")

    assert response.status_code == 401


def test_service_delete_can(loaded_db):
    test_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "Test Notes"}

    funding_budget_service = CANFundingDetailsService()

    new_funding_details = funding_budget_service.create(test_data)

    funding_budget_service.delete(new_funding_details.id)

    stmt = select(CANFundingDetails).where(CANFundingDetails.id == new_funding_details.id)
    can = loaded_db.scalar(stmt)

    assert can is None
