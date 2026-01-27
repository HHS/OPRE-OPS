from sqlalchemy import select

from models import CANFundingDetails, CANMethodOfTransfer
from ops.services.can_funding_details import CANFundingDetailsService


def test_funding_details_get_all(auth_client, mocker, test_can_funding_details, app_ctx):
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


def test_funding_details_get_by_id(auth_client, mocker, test_can_funding_details, app_ctx):
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
    funding_details = service.get(test_can_funding_details.id)
    assert test_can_funding_details.id == funding_details.id
    assert test_can_funding_details.fund_code == funding_details.fund_code
    assert test_can_funding_details.method_of_transfer == funding_details.method_of_transfer


# Testing CANFundingDetails Creation
def test_funding_details_post_creates_funding_details(budget_team_auth_client, mocker, app_ctx):
    input_data = {
        "fund_code": "AAXXXX20241DAD",
        "fiscal_year": 2024,
        "method_of_transfer": "DIRECT",
    }

    mock_output_data = CANFundingDetails(
        fund_code="AAXXXX20241DAD",
        fiscal_year=2024,
        method_of_transfer=CANMethodOfTransfer.DIRECT,
    )
    mocker_create_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.create"
    )
    input_data["allotment"] = None
    input_data["allowance"] = None
    input_data["display_name"] = None
    input_data["funding_partner"] = None
    input_data["funding_source"] = None
    input_data["sub_allowance"] = None
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


def test_basic_user_cannot_post_funding_details(basic_user_auth_client, app_ctx):
    input_data = {
        "fund_code": "AAXXXX20241DAD",
        "fiscal_year": 2024,
        "method_of_transfer": "DIRECT",
    }
    response = basic_user_auth_client.post("/api/v1/can-funding-details/", json=input_data)

    assert response.status_code == 403


def test_service_create_funding_details(loaded_db):
    input_data = {
        "fund_code": "AAXXXX20241DAD",
        "fiscal_year": 2024,
        "method_of_transfer": CANMethodOfTransfer.DIRECT,
    }

    service = CANFundingDetailsService()

    new_budget = service.create(input_data)

    funding_details = loaded_db.execute(
        select(CANFundingDetails).where(CANFundingDetails.id == new_budget.id)
    ).scalar_one()

    assert funding_details is not None
    assert funding_details.fund_code == "AAXXXX20241DAD"
    assert funding_details.method_of_transfer == CANMethodOfTransfer.DIRECT
    assert funding_details.fiscal_year == 2024
    assert funding_details.active_period == 1
    assert funding_details.funding_method == "Direct"
    assert funding_details.funding_received == "Quarterly"
    assert funding_details.funding_type == "Discretionary"
    assert funding_details == new_budget

    loaded_db.delete(new_budget)
    loaded_db.commit()


# Testing updating CANs by PATCH
def test_funding_details_patch(budget_team_auth_client, mocker, app_ctx):
    test_details_id = 1
    update_data = {
        "method_of_transfer": "COST_SHARE",
    }

    funding_details = CANFundingDetails(
        fund_code="AAXXXX20241DAD",
        fiscal_year=2024,
        method_of_transfer=CANMethodOfTransfer.DIRECT,
    )
    mocker_update_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.update"
    )
    funding_details.method_of_transfer = CANMethodOfTransfer.COST_SHARE
    mocker_update_funding_details.return_value = funding_details
    response = budget_team_auth_client.patch(f"/api/v1/can-funding-details/{test_details_id}", json=update_data)

    deserialized_update_data = {"method_of_transfer": CANMethodOfTransfer.COST_SHARE}
    assert response.status_code == 200
    mocker_update_funding_details.assert_called_once_with(deserialized_update_data, test_details_id)
    assert response.json["method_of_transfer"] == "COST_SHARE"
    assert response.json["fund_code"] == funding_details.fund_code


def test_funding_details_patch_404(budget_team_auth_client, app_ctx):
    test_details_id = 518
    update_data = {
        "method_of_transfer": "COST_SHARE",
    }

    response = budget_team_auth_client.patch(f"/api/v1/can-funding-details/{test_details_id}", json=update_data)

    assert response.status_code == 404


def test_basic_user_cannot_patch_funding_detailss(basic_user_auth_client, app_ctx):
    update_data = {
        "method_of_transfer": "COST_SHARE",
    }
    response = basic_user_auth_client.patch("/api/v1/can-funding-details/517", json=update_data)

    assert response.status_code == 403


def test_service_patch_funding_details(loaded_db):
    update_data = {
        "method_of_transfer": CANMethodOfTransfer.COST_SHARE,
    }

    input_data = {
        "fund_code": "AAXXXX20241DAD",
        "fiscal_year": 2024,
        "method_of_transfer": CANMethodOfTransfer.DIRECT,
    }

    budget_service = CANFundingDetailsService()

    new_funding_details = budget_service.create(input_data)

    updated_funding_details = budget_service.update(update_data, new_funding_details.id)

    funding_details = loaded_db.execute(
        select(CANFundingDetails).where(CANFundingDetails.id == new_funding_details.id)
    ).scalar_one()

    assert funding_details is not None
    assert funding_details.fund_code == "AAXXXX20241DAD"
    assert updated_funding_details.fund_code == "AAXXXX20241DAD"
    assert funding_details.method_of_transfer == CANMethodOfTransfer.COST_SHARE
    assert updated_funding_details.method_of_transfer == CANMethodOfTransfer.COST_SHARE

    loaded_db.delete(new_funding_details)
    loaded_db.commit()


# Testing updating CANFundingDetailss by PUT
def test_funding_details_put(budget_team_auth_client, mocker, app_ctx):
    test_funding_details_id = 1
    update_data = {
        "method_of_transfer": "COST_SHARE",
        "fiscal_year": 2024,
        "fund_code": "AAXXXX20241DAD",
    }

    funding_details = CANFundingDetails(
        fund_code="AAXXXX20241DAD",
        fiscal_year=2024,
        method_of_transfer=CANMethodOfTransfer.DIRECT,
    )

    mocker_update_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.update"
    )
    funding_details.method_of_transfer = CANMethodOfTransfer.COST_SHARE
    mocker_update_funding_details.return_value = funding_details
    response = budget_team_auth_client.put(f"/api/v1/can-funding-details/{test_funding_details_id}", json=update_data)

    update_data["method_of_transfer"] = CANMethodOfTransfer.COST_SHARE
    update_data["allotment"] = None
    update_data["allowance"] = None
    update_data["display_name"] = None
    update_data["funding_partner"] = None
    update_data["funding_source"] = None
    update_data["sub_allowance"] = None
    assert response.status_code == 200
    mocker_update_funding_details.assert_called_once_with(update_data, test_funding_details_id)
    assert response.json["method_of_transfer"] == "COST_SHARE"
    assert response.json["fund_code"] == funding_details.fund_code


def test_basic_user_cannot_put_funding_details(basic_user_auth_client, app_ctx):
    update_data = {
        "method_of_transfer": "COST_SHARE",
        "fiscal_year": 2024,
        "fund_code": "AAXXXX20241DAD",
    }
    response = basic_user_auth_client.put("/api/v1/can-funding-details/517", json=update_data)

    assert response.status_code == 403


def test_funding_details_put_404(budget_team_auth_client, app_ctx):
    test_funding_details_id = 900
    update_data = {
        "method_of_transfer": "COST_SHARE",
        "fiscal_year": 2024,
        "fund_code": "AAXXXX20241DAD",
    }

    response = budget_team_auth_client.put(f"/api/v1/can-funding-details/{test_funding_details_id}", json=update_data)

    assert response.status_code == 404


def test_service_update_funding_details_with_nones(loaded_db):
    update_data = {
        "method_of_transfer": CANMethodOfTransfer.COST_SHARE,
        "fiscal_year": 2024,
        "fund_code": "AAXXXX20241DAD",
        "allotment": None,
    }

    test_data = {
        "fund_code": "AAXXXX20241DAD",
        "fiscal_year": 2024,
        "method_of_transfer": CANMethodOfTransfer.DIRECT,
        "allotment": "abcd",
    }

    funding_details_service = CANFundingDetailsService()

    new_funding_details = funding_details_service.create(test_data)

    updated_funding_details = funding_details_service.update(update_data, new_funding_details.id)

    funding_details = loaded_db.execute(
        select(CANFundingDetails).where(CANFundingDetails.id == updated_funding_details.id)
    ).scalar_one()

    assert funding_details is not None
    assert funding_details.method_of_transfer == CANMethodOfTransfer.COST_SHARE
    assert updated_funding_details.method_of_transfer == CANMethodOfTransfer.COST_SHARE
    assert funding_details.allotment is None
    assert updated_funding_details.allotment is None
    assert funding_details.fiscal_year == 2024
    assert updated_funding_details.fiscal_year == 2024
    assert funding_details.fund_code == "AAXXXX20241DAD"
    assert updated_funding_details.fund_code == "AAXXXX20241DAD"

    loaded_db.delete(new_funding_details)
    loaded_db.commit()


# Testing deleting CANFundingDetailss
def test_funding_details_delete(budget_team_auth_client, mocker, app_ctx):
    test_funding_details_id = 517

    mocker_delete_funding_details = mocker.patch(
        "ops_api.ops.services.can_funding_details.CANFundingDetailsService.delete"
    )
    response = budget_team_auth_client.delete(f"/api/v1/can-funding-details/{test_funding_details_id}")

    assert response.status_code == 200
    mocker_delete_funding_details.assert_called_once_with(test_funding_details_id)
    assert response.json["message"] == "CANFundingDetails deleted"
    assert response.json["id"] == test_funding_details_id


def test_can_delete_404(budget_team_auth_client, app_ctx):
    test_can_id = 900

    response = budget_team_auth_client.delete(f"/api/v1/can-funding-details/{test_can_id}")

    assert response.status_code == 404


def test_basic_user_cannot_delete_cans(basic_user_auth_client, app_ctx):
    response = basic_user_auth_client.delete("/api/v1/can-funding-details/517")

    assert response.status_code == 403


def test_service_delete_can(loaded_db):
    test_data = {
        "fund_code": "AAXXXX20241DAD",
        "fiscal_year": 2024,
        "method_of_transfer": CANMethodOfTransfer.DIRECT,
        "allotment": "abcd",
    }

    funding_details_service = CANFundingDetailsService()

    new_funding_details = funding_details_service.create(test_data)

    funding_details_service.delete(new_funding_details.id)

    stmt = select(CANFundingDetails).where(CANFundingDetails.id == new_funding_details.id)
    can = loaded_db.scalar(stmt)

    assert can is None
