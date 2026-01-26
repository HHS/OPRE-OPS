from flask import url_for
from sqlalchemy import select

from models import CAN, CANFundingBudget, CANHistory
from ops_api.ops.services.can_funding_budget import CANFundingBudgetService
from ops_api.tests.utils import DummyContextManager


def test_funding_budget_get_all(auth_client, mocker, test_can_funding_budget, app_ctx):
    mocker_get_funding_budget = mocker.patch("ops_api.ops.services.can_funding_budget.CANFundingBudgetService.get_list")
    mocker_get_funding_budget.return_value = [test_can_funding_budget]
    response = auth_client.get(url_for("api.can-funding-budget-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    mocker_get_funding_budget.assert_called_once()


def test_service_can_get_all(auth_client, loaded_db):
    count = loaded_db.query(CANFundingBudget).count()
    budget_service = CANFundingBudgetService(loaded_db)
    response = budget_service.get_list()
    assert len(response) == count


def test_funding_budget_get_by_id(auth_client, mocker, test_can_funding_budget, app_ctx):
    mocker_get_funding_budget = mocker.patch("ops_api.ops.services.can_funding_budget.CANFundingBudgetService.get")
    mocker_get_funding_budget.return_value = test_can_funding_budget
    response = auth_client.get(url_for("api.can-funding-budget-item", id=test_can_funding_budget.id))
    assert response.status_code == 200
    assert response.json["fiscal_year"] == 2023
    assert response.json["budget"] == 1140000
    assert response.json["can_id"] == 500


def test_funding_budget_service_get_by_id(test_can_funding_budget, loaded_db):
    service = CANFundingBudgetService(loaded_db)
    funding_budget = service.get(test_can_funding_budget.id)
    assert test_can_funding_budget.id == funding_budget.id
    assert test_can_funding_budget.budget == funding_budget.budget
    assert test_can_funding_budget.can_id == funding_budget.can_id


# Testing CANFundingBudget Creation
def test_funding_budget_post_creates_funding_budget(budget_team_auth_client, mocker, test_budget_team_user, app_ctx):
    input_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "This is a note",
    }

    mock_output_data = CANFundingBudget(
        can_id=500,
        fiscal_year=2024,
        budget=123456,
        notes="This is a note",
        created_by=test_budget_team_user.id,
    )
    mocker_create_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.create"
    )
    mocker_create_funding_budget.return_value = mock_output_data
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.post(url_for("api.can-funding-budget-group"), json=input_data)

    assert context_manager.metadata["new_can_funding_budget"] is not None
    assert context_manager.metadata["new_can_funding_budget"]["budget"] == mock_output_data.budget
    assert context_manager.metadata["new_can_funding_budget"]["created_by"] == mock_output_data.created_by
    assert context_manager.metadata["new_can_funding_budget"]["can_id"] == mock_output_data.can_id
    assert response.status_code == 201
    mocker_create_funding_budget.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["can_id"] == mock_output_data.can_id
    assert response.json["fiscal_year"] == mock_output_data.fiscal_year
    assert response.json["budget"] == mock_output_data.budget


def test_basic_user_cannot_post_funding_budget(basic_user_auth_client, app_ctx):
    input_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "This is a note",
    }
    response = basic_user_auth_client.post(url_for("api.can-funding-budget-group"), json=input_data)

    assert response.status_code == 403


def test_service_create_funding_budget(loaded_db, mocker):
    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=False)
    input_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "This is a note",
    }

    service = CANFundingBudgetService(loaded_db)

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


def test_funding_budget_post_400_missing_budget(budget_team_auth_client):
    response = budget_team_auth_client.post(
        url_for("api.can-funding-budget-group"),
        json={"can_id": 500, "fiscal_year": 2024, "notes": "This is a note"},
    )

    assert response.status_code == 400
    assert response.json["budget"][0] == "Missing data for required field."


def test_funding_budget_post_with_cents(budget_team_auth_client, mocker):
    budget_with_cents = 34500.23
    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=False)

    create_resp = budget_team_auth_client.post(
        url_for("api.can-funding-budget-group"),
        json={
            "can_id": 501,
            "fiscal_year": 2025,
            "budget": budget_with_cents,
            "notes": "Test Note",
        },
    )
    assert create_resp.status_code == 201
    assert create_resp.json["budget"] == budget_with_cents

    # Clean up
    delete_resp = budget_team_auth_client.delete(url_for("api.can-funding-budget-item", id=create_resp.json["id"]))
    assert delete_resp.status_code == 200


# Testing updating CANs by PATCH
def test_funding_budget_patch(budget_team_auth_client, mocker, app_ctx):
    test_budget_id = 600
    update_data = {"notes": "Fake test update", "budget": 123456.67}

    funding_budget = CANFundingBudget(can_id=500, fiscal_year=2024, budget=123456.67, notes="This is a note")
    old_funding_budget = CANFundingBudget(can_id=500, fiscal_year=2024, budget=100000.00, notes="This is a note")

    mocker_update_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.update"
    )
    mocker_get_funding_budget = mocker.patch("ops_api.ops.services.can_funding_budget.CANFundingBudgetService.get")
    mocker_get_funding_budget.return_value = old_funding_budget
    funding_budget.notes = update_data["notes"]
    mocker_update_funding_budget.return_value = funding_budget
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.patch(
        url_for("api.can-funding-budget-item", id=test_budget_id), json=update_data
    )

    assert context_manager.metadata["funding_budget_updates"]["changes"] is not None
    changes = context_manager.metadata["funding_budget_updates"]["changes"]
    assert len(changes.keys()) == 2
    # assert that new data we expect is on the context manager
    assert changes["budget"]["new_value"] == update_data["budget"]
    assert changes["budget"]["old_value"] == old_funding_budget.budget
    assert response.status_code == 200
    mocker_update_funding_budget.assert_called_once_with(update_data, test_budget_id)
    assert response.json["budget"] == funding_budget.budget
    assert response.json["notes"] == funding_budget.notes


def test_funding_budget_patch_404(budget_team_auth_client, app_ctx):
    test_budget_id = 518
    update_data = {
        "notes": "Test CANFundingBudget Created by unit test",
    }

    response = budget_team_auth_client.patch(
        url_for("api.can-funding-budget-item", id=test_budget_id), json=update_data
    )

    assert response.status_code == 404


def test_basic_user_cannot_patch_funding_budgets(basic_user_auth_client, app_ctx):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.patch(url_for("api.can-funding-budget-item", id=517), json=data)

    assert response.status_code == 403


def test_service_patch_funding_budget(loaded_db, mocker):
    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=False)
    update_data = {
        "notes": "Test Test Test",
    }

    input_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "This is a note",
    }

    budget_service = CANFundingBudgetService(loaded_db)

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
def test_funding_budget_put(budget_team_auth_client, mocker, app_ctx):
    test_funding_budget_id = 517
    update_data = {"can_id": 500, "fiscal_year": 2024, "budget": 234567, "notes": None}

    old_funding_budget = CANFundingBudget(can_id=500, fiscal_year=2024, budget=123456, notes="This is a note")
    funding_budget = CANFundingBudget(can_id=500, fiscal_year=2024, budget=234567, notes="This is a note")

    mocker_update_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.update"
    )
    funding_budget.budget = update_data["budget"]
    mocker_get_funding_budget = mocker.patch("ops_api.ops.services.can_funding_budget.CANFundingBudgetService.get")
    mocker_get_funding_budget.return_value = old_funding_budget
    mocker_update_funding_budget.return_value = funding_budget
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.patch(
        url_for("api.can-funding-budget-item", id=test_funding_budget_id),
        json=update_data,
    )

    assert context_manager.metadata["funding_budget_updates"]["changes"] is not None
    changes = context_manager.metadata["funding_budget_updates"]["changes"]
    assert len(changes.keys()) == 1
    # assert that new data we expect is on the context manager
    assert changes["budget"]["new_value"] == update_data["budget"]
    assert changes["budget"]["old_value"] == old_funding_budget.budget
    update_data["notes"] = None
    assert response.status_code == 200
    mocker_update_funding_budget.assert_called_once_with(update_data, test_funding_budget_id)
    assert response.json["budget"] == funding_budget.budget
    assert response.json["can_id"] == funding_budget.can_id


def test_basic_user_cannot_put_funding_budget(basic_user_auth_client, app_ctx):
    data = {
        "notes": "An updated can description",
    }
    response = basic_user_auth_client.put(url_for("api.can-funding-budget-item", id=517), json=data)

    assert response.status_code == 403


def test_funding_budget_put_404(budget_team_auth_client, app_ctx):
    test_funding_budget_id = 518
    update_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "Test test test",
    }

    response = budget_team_auth_client.put(f"/api/v1/can-funding-budgets/{test_funding_budget_id}", json=update_data)

    assert response.status_code == 404


def test_service_update_funding_budget_with_nones(loaded_db, mocker):
    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=False)

    update_data = {"can_id": 500, "fiscal_year": 2024, "budget": 123456, "notes": None}

    test_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "Test Notes",
    }

    funding_budget_service = CANFundingBudgetService(loaded_db)

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
def test_funding_budget_delete(budget_team_auth_client, mocker, app_ctx):
    test_funding_budget_id = 517

    mocker_delete_funding_budget = mocker.patch(
        "ops_api.ops.services.can_funding_budget.CANFundingBudgetService.delete"
    )
    response = budget_team_auth_client.delete(url_for("api.can-funding-budget-item", id=test_funding_budget_id))

    assert response.status_code == 200
    mocker_delete_funding_budget.assert_called_once_with(test_funding_budget_id)
    assert response.json["message"] == "CANFundingBudget deleted"
    assert response.json["id"] == test_funding_budget_id


def test_can_delete_404(budget_team_auth_client, app_ctx):
    test_can_id = 500

    response = budget_team_auth_client.delete(url_for("api.can-funding-budget-item", id=test_can_id))

    assert response.status_code == 404


def test_basic_user_cannot_delete_cans(basic_user_auth_client, app_ctx):
    response = basic_user_auth_client.delete("/api/v1/can-funding-budgets/517")

    assert response.status_code == 403


def test_service_delete_can(loaded_db, mocker):
    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=False)

    test_data = {
        "can_id": 500,
        "fiscal_year": 2024,
        "budget": 123456,
        "notes": "Test Notes",
    }

    funding_budget_service = CANFundingBudgetService(loaded_db)

    new_funding_budget = funding_budget_service.create(test_data)

    funding_budget_service.delete(new_funding_budget.id)

    stmt = select(CANFundingBudget).where(CANFundingBudget.id == new_funding_budget.id)
    can = loaded_db.scalar(stmt)

    assert can is None


def test_funding_budget_post_validate_can_not_expired(budget_team_auth_client, mocker, loaded_db):
    """
    Test that a funding budget can be created for an active (not expired) CAN.
    """
    active_can = CAN(
        number="ACTIVECAN",
        portfolio_id=1,
    )
    loaded_db.add(active_can)
    loaded_db.commit()

    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=False)

    response = budget_team_auth_client.post(
        url_for("api.can-funding-budget-group"),
        json={"can_id": active_can.id, "fiscal_year": 2025, "budget": 1000},
    )
    assert response.status_code == 201

    updated_can = loaded_db.get(CAN, active_can.id)
    assert updated_can.funding_budgets is not None

    # Clean up
    can_history = loaded_db.scalars(select(CANHistory).where(CANHistory.can_id == active_can.id)).all()
    for history in can_history:
        loaded_db.delete(history)
    loaded_db.delete(updated_can.funding_budgets[0])
    loaded_db.delete(active_can)
    loaded_db.commit()


def test_funding_budget_post_validate_can_expired(budget_team_auth_client, mocker, loaded_db):
    """
    Test that a funding budget cannot be created for an expired CAN.
    """
    active_can = CAN(
        number="EXPIREDCAN",
        portfolio_id=1,
    )
    loaded_db.add(active_can)
    loaded_db.commit()

    mocker.patch("models.CAN.is_expired", new_callable=mocker.PropertyMock, return_value=True)

    response = budget_team_auth_client.post(
        url_for("api.can-funding-budget-group"),
        json={"can_id": active_can.id, "fiscal_year": 2025, "budget": 1000},
    )
    assert response.status_code == 400

    updated_can = loaded_db.get(CAN, active_can.id)
    assert updated_can.funding_budgets == []

    # Clean up
    loaded_db.delete(active_can)
    loaded_db.commit()
