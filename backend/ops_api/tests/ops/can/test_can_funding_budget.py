import pytest
from sqlalchemy import select

from models import CANFundingBudget
from ops.services.can_funding_budget import CANFundingBudgetService


@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_get_all(auth_client, mocker, test_can_funding_budget):
    mocker_get_funding_budget = mocker.patch("ops_api.ops.services.can_funding_budget.CANFundingBudgetService.get_list")
    mocker_get_funding_budget.return_value = [test_can_funding_budget]
    response = auth_client.get("/api/v1/can-funding-budgets/")
    assert response.status_code == 200
    assert len(response.json) == 1
    mocker_get_funding_budget.assert_called_once()


def test_service_can_get_all(auth_client, loaded_db):
    count = loaded_db.query(CANFundingBudget).count()
    budget_service = CANFundingBudgetService()
    response = budget_service.get_list()
    assert len(response) == count


@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_get_by_id(auth_client, mocker, test_can_funding_budget):
    mocker_get_funding_budget = mocker.patch("ops_api.ops.services.can_funding_budget.CANFundingBudgetService.get")
    mocker_get_funding_budget.return_value = test_can_funding_budget
    response = auth_client.get(f"/api/v1/can-funding-budgets/{test_can_funding_budget.id}")
    assert response.status_code == 200
    assert response.json["fiscal_year"] == 2023
    assert response.json["budget"] == 1140000
    assert response.json["can_id"] == 500


def test_funding_budget_service_get_by_id(test_can_funding_budget):
    service = CANFundingBudgetService()
    funding_budget = service.get(test_can_funding_budget.id)
    assert test_can_funding_budget.id == funding_budget.id
    assert test_can_funding_budget.budget == funding_budget.budget
    assert test_can_funding_budget.can_id == funding_budget.can_id


# Testing CANFundingBudget Creation
@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_post_creates_funding_budget(budget_team_auth_client, mocker, loaded_db):
    input_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "This is a note"}

    mock_output_data = CANFundingBudget(can_id=500, fiscal_year=2024, budget=123456, notes="This is a note")
    mocker_create_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.create"
    )
    mocker_create_funding_budget.return_value = mock_output_data
    response = budget_team_auth_client.post("/api/v1/can-funding-budgets/", json=input_data)

    assert response.status_code == 201
    mocker_create_funding_budget.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["can_id"] == mock_output_data.can_id
    assert response.json["fiscal_year"] == mock_output_data.fiscal_year
    assert response.json["budget"] == mock_output_data.budget


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_post_funding_budget(basic_user_auth_client):
    input_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "This is a note"}
    response = basic_user_auth_client.post("/api/v1/can-funding-budgets/", json=input_data)

    assert response.status_code == 401


def test_service_create_funding_budget(loaded_db):
    input_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "This is a note"}

    service = CANFundingBudgetService()

    new_budget = service.create(input_data)

    funding_budget = loaded_db.execute(
        select(CANFundingBudget).where(CANFundingBudget.id == new_budget.id)
    ).scalar_one()

    assert funding_budget is not None
    assert funding_budget.can_id == 500
    assert funding_budget.notes == "This is a note"
    assert funding_budget.fiscal_year == 2024
    assert funding_budget.id == new_budget.id
    assert funding_budget == new_budget

    loaded_db.delete(new_budget)
    loaded_db.commit()


# Testing updating CANs by PATCH
@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_patch(budget_team_auth_client, mocker):
    test_budget_id = 600
    update_data = {
        "notes": "Fake test update",
    }

    funding_budget = CANFundingBudget(can_id=500, fiscal_year=2024, budget=123456, notes="This is a note")
    mocker_update_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.update"
    )
    funding_budget.notes = update_data["notes"]
    mocker_update_funding_budget.return_value = funding_budget
    response = budget_team_auth_client.patch(f"/api/v1/can-funding-budgets/{test_budget_id}", json=update_data)

    assert response.status_code == 200
    mocker_update_funding_budget.assert_called_once_with(update_data, test_budget_id)
    assert response.json["budget"] == funding_budget.budget
    assert response.json["notes"] == funding_budget.notes


@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_patch_404(budget_team_auth_client):
    test_budget_id = 518
    update_data = {
        "notes": "Test CANFundingBudget Created by unit test",
    }

    response = budget_team_auth_client.patch(f"/api/v1/can-funding-budgets/{test_budget_id}", json=update_data)

    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_patch_funding_budgets(basic_user_auth_client):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.patch("/api/v1/can-funding-budgets/517", json=data)

    assert response.status_code == 401


def test_service_patch_funding_budget(loaded_db):
    update_data = {
        "notes": "Test Test Test",
    }

    input_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "This is a note"}

    budget_service = CANFundingBudgetService()

    new_funding_budget = budget_service.create(input_data)

    updated_funding_budget = budget_service.update(update_data, new_funding_budget.id)

    funding_budget = loaded_db.execute(
        select(CANFundingBudget).where(CANFundingBudget.id == new_funding_budget.id)
    ).scalar_one()

    assert funding_budget is not None
    assert funding_budget.budget == 123456
    assert updated_funding_budget.budget == 123456
    assert funding_budget.notes == "Test Test Test"
    assert updated_funding_budget.notes == "Test Test Test"

    loaded_db.delete(new_funding_budget)
    loaded_db.commit()


# Testing updating CANFundingBudgets by PUT
@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_put(budget_team_auth_client, mocker):
    test_funding_budget_id = 517
    update_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 234567,
    }

    funding_budget = CANFundingBudget(can_id=500, fiscal_year=2024, budget=123456, notes="This is a note")

    mocker_update_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.update"
    )
    funding_budget.budget = update_data["budget"]
    mocker_update_funding_budget.return_value = funding_budget
    response = budget_team_auth_client.put(f"/api/v1/can-funding-budgets/{test_funding_budget_id}", json=update_data)

    update_data["notes"] = None
    assert response.status_code == 200
    mocker_update_funding_budget.assert_called_once_with(update_data, test_funding_budget_id)
    assert response.json["budget"] == funding_budget.budget
    assert response.json["can_id"] == funding_budget.can_id


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_put_funding_budget(basic_user_auth_client):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.put("/api/v1/can-funding-budgets/517", json=data)

    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_put_404(budget_team_auth_client):
    test_funding_budget_id = 518
    update_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "Test test test"}

    response = budget_team_auth_client.put(f"/api/v1/can-funding-budgets/{test_funding_budget_id}", json=update_data)

    assert response.status_code == 404


def test_service_update_funding_budget_with_nones(loaded_db):
    update_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": None}

    test_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "Test Notes"}

    funding_budget_service = CANFundingBudgetService()

    new_funding_budget = funding_budget_service.create(test_data)

    updated_funding_budget = funding_budget_service.update(update_data, new_funding_budget.id)

    funding_budget = loaded_db.execute(
        select(CANFundingBudget).where(CANFundingBudget.id == updated_funding_budget.id)
    ).scalar_one()

    assert funding_budget is not None
    assert funding_budget.can_id == 500
    assert updated_funding_budget.can_id == 500
    assert funding_budget.notes is None
    assert updated_funding_budget.notes is None
    assert funding_budget.fiscal_year == 2024
    assert updated_funding_budget.fiscal_year == 2024
    assert funding_budget.budget == 123456
    assert updated_funding_budget.budget == 123456

    loaded_db.delete(new_funding_budget)
    loaded_db.commit()


# Testing deleting CANFundingBudgets
@pytest.mark.usefixtures("app_ctx")
def test_funding_budget_delete(budget_team_auth_client, mocker):
    test_funding_budget_id = 517

    mocker_delete_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.delete"
    )
    response = budget_team_auth_client.delete(f"/api/v1/can-funding-budgets/{test_funding_budget_id}")

    assert response.status_code == 200
    mocker_delete_funding_budget.assert_called_once_with(test_funding_budget_id)
    assert response.json["message"] == "CANFundingBudget deleted"
    assert response.json["id"] == test_funding_budget_id


@pytest.mark.usefixtures("app_ctx")
def test_can_delete_404(budget_team_auth_client):
    test_can_id = 500

    response = budget_team_auth_client.delete(f"/api/v1/can-funding-budgets/{test_can_id}")

    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_delete_cans(basic_user_auth_client):
    response = basic_user_auth_client.delete("/api/v1/can-funding-budgets/517")

    assert response.status_code == 401


def test_service_delete_can(loaded_db):
    test_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": "Test Notes"}

    funding_budget_service = CANFundingBudgetService()

    new_funding_budget = funding_budget_service.create(test_data)

    funding_budget_service.delete(new_funding_budget.id)

    stmt = select(CANFundingBudget).where(CANFundingBudget.id == new_funding_budget.id)
    can = loaded_db.scalar(stmt)

    assert can is None
