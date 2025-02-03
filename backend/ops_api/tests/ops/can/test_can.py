import datetime

import pytest
from sqlalchemy import func, select

from models import CAN, BudgetLineItem, CANFundingSource, CANStatus
from ops.services.cans import CANService
from ops_api.tests.utils import DummyContextManager


@pytest.mark.usefixtures("app_ctx")
def test_can_retrieve(loaded_db, mocker):
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2023, 8, 1)
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can is not None
    assert can.number == "G99HRF2"
    assert can.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can.nick_name == "HMRF-OPRE"
    assert can.active_period == 1
    assert can.portfolio_id == 6
    assert can.funding_details.funding_source == CANFundingSource.OPRE
    assert can.funding_budgets[0].fiscal_year == 2023
    assert can.funding_received[0].fiscal_year == 2023
    assert can.status == CANStatus.ACTIVE
    assert (
        len(can.budget_line_items)
        == loaded_db.execute(
            select(func.count()).select_from(BudgetLineItem).where(BudgetLineItem.can_id == can.id)
        ).scalar()
    )


@pytest.mark.usefixtures("app_ctx")
def test_can_is_expired_1_year_can(loaded_db, mocker):
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()
    assert can is not None

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2022, 8, 1)
    assert can.is_expired is False, "can is active in 2023"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2023, 8, 1)
    assert can.is_expired is False, "can is active in 2023"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2024, 8, 1)
    assert can.is_expired is True, "can is active in 2023"


@pytest.mark.usefixtures("app_ctx")
def test_can_is_expired_5_year_can(loaded_db, mocker):
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99IA14")).scalar_one()
    assert can is not None

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2020, 8, 1)
    assert can.is_expired is False, "can is active in 2021-2025"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2021, 8, 1)
    assert can.is_expired is False, "can is active in 2021-2025"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2022, 8, 1)
    assert can.is_expired is False, "can is active in 2021-2025"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2025, 10, 1)
    assert can.is_expired is True, "can is active in 2021-2025"


@pytest.mark.usefixtures("app_ctx")
def test_can_is_inactive(loaded_db, mocker):
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2024, 10, 1)
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can is not None
    assert can.status == CANStatus.INACTIVE


@pytest.mark.usefixtures("app_ctx")
def test_can_get_all(auth_client, mocker, test_can):
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get_list")
    mocker_get_can.return_value = [test_can]
    mock_simple_agreement = {
        "agreement_type": "AgreementType.DIRECT_OBLIGATION",
        "name": "DIRECT ALLOCATION #2: African American Child and Family Research Center",
        "awarding_entity_id": 3,
    }
    response = auth_client.get("/api/v1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["budget_line_items"][0]["agreement"] == mock_simple_agreement
    mocker_get_can.assert_called_once()


def test_service_can_get_all(auth_client, loaded_db):
    count = loaded_db.query(CAN).count()
    can_service = CANService()
    response = can_service.get_list()
    assert len(response) == count


@pytest.mark.usefixtures("app_ctx")
def test_can_get_by_id(auth_client, mocker, test_can):
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get")
    mocker_get_can.return_value = test_can
    response = auth_client.get(f"/api/v1/cans/{test_can.id}")
    assert response.status_code == 200
    assert response.json["number"] == "G99HRF2"


def test_can_service_get_by_id(test_can):
    service = CANService()
    can = service.get(test_can.id)
    assert test_can.id == can.id
    assert test_can.number == can.number


@pytest.mark.usefixtures("app_ctx")
def test_can_get_portfolio_cans(auth_client, loaded_db):
    response = auth_client.get("/api/v1/cans/portfolio/1")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["id"] == 501


@pytest.mark.usefixtures("app_ctx")
def test_get_cans_search_filter(auth_client, loaded_db, test_can):
    response = auth_client.get("/api/v1/cans/?search=XXX8")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == 512

    response = auth_client.get("/api/v1/cans/?search=G99HRF2")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == test_can.id

    response = auth_client.get("/api/v1/cans/?search=")
    assert response.status_code == 200
    assert len(response.json) == 0


def test_service_get_cans_search_filter(test_can):
    can_service = CANService()
    response = can_service.get_list("XXX8")
    assert len(response) == 1
    assert response[0].id == 512

    response = can_service.get_list("G99HRF2")
    assert len(response) == 1
    assert response[0].id == test_can.id

    response = can_service.get_list("")
    assert len(response) == 0


# Testing CAN Creation
@pytest.mark.usefixtures("app_ctx")
def test_can_post_creates_can(budget_team_auth_client, mocker, loaded_db):
    input_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
        "nick_name": "MockNickname",
    }

    mock_output_data = CAN(
        id=517, portfolio_id=6, number="G998235", description="Test CAN Created by unit test", nick_name="MockNickname"
    )
    mocker_create_can = mocker.patch("ops_api.ops.services.cans.CANService.create")
    mocker_create_can.return_value = mock_output_data
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.post("/api/v1/cans/", json=input_data)

    assert context_manager.metadata["new_can"]["id"] == 517
    assert context_manager.metadata["new_can"]["number"] == "G998235"

    # Add fields that are default populated on load.
    input_data["funding_details_id"] = None
    assert response.status_code == 201
    mocker_create_can.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["portfolio_id"] == mock_output_data.portfolio_id
    assert response.json["number"] == mock_output_data.number
    assert response.json["description"] == mock_output_data.description
    assert response.json["nick_name"] == mock_output_data.nick_name


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_post_creates_can(basic_user_auth_client):
    data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }
    response = basic_user_auth_client.post("/api/v1/cans/", json=data)

    assert response.status_code == 403


def test_service_create_can(loaded_db):
    data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(data)

    can = loaded_db.execute(select(CAN).where(CAN.number == "G998235")).scalar_one()

    assert can is not None
    assert can.number == "G998235"
    assert can.description == "Test CAN Created by unit test"
    assert can.portfolio_id == 6
    assert can.id == 517
    assert can == new_can

    loaded_db.delete(new_can)
    loaded_db.commit()


# Testing updating CANs by PATCH
@pytest.mark.usefixtures("app_ctx")
def test_can_patch(budget_team_auth_client, mocker, unadded_can):
    test_can_id = 517
    update_data = {"description": "Updated Description", "nick_name": "My nick name"}
    mocker_update_can = mocker.patch("ops_api.ops.services.cans.CANService.update")
    unadded_can.description = update_data["description"]
    updated_can = CAN(portfolio_id=6, number="G998235", description="Updated Description", nick_name="My nick name")
    mocker_update_can.return_value = updated_can
    response = budget_team_auth_client.patch(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 200
    mocker_update_can.assert_called_once_with(update_data, test_can_id)
    assert response.json["number"] == unadded_can.number
    assert response.json["description"] == unadded_can.description


@pytest.mark.usefixtures("app_ctx")
def test_can_patch_404(budget_team_auth_client, mocker, loaded_db, unadded_can):
    test_can_id = 518
    update_data = {
        "description": "Test CAN Created by unit test",
    }

    response = budget_team_auth_client.patch(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_patch_cans(basic_user_auth_client):
    data = {
        "description": "An updated can description",
    }
    response = basic_user_auth_client.patch("/api/v1/cans/517", json=data)

    assert response.status_code == 403


def test_service_patch_can(loaded_db):
    update_data = {
        "description": "Test Test Test",
    }

    test_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(test_data)

    updated_can = can_service.update(update_data, new_can.id)

    can = loaded_db.execute(select(CAN).where(CAN.number == "G998235")).scalar_one()

    assert can is not None
    assert can.number == "G998235"
    assert updated_can.number == "G998235"
    assert can.description == "Test Test Test"
    assert updated_can.description == "Test Test Test"

    loaded_db.delete(new_can)
    loaded_db.commit()


# Testing updating CANs by PUT
@pytest.mark.usefixtures("app_ctx")
def test_can_put(budget_team_auth_client, mocker, unadded_can):
    test_can_id = 517
    update_data = {
        "number": "G123456",
        "description": "Test CAN Created by unit test",
        "portfolio_id": 6,
        "funding_details_id": 1,
        "nick_name": "MockNickname",
    }

    mocker_update_can = mocker.patch("ops_api.ops.services.cans.CANService.update")
    unadded_can.description = update_data["description"]
    mocker_update_can.return_value = unadded_can
    response = budget_team_auth_client.put(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 200
    mocker_update_can.assert_called_once_with(update_data, test_can_id)
    assert response.json["number"] == unadded_can.number
    assert response.json["description"] == unadded_can.description
    assert response.json["nick_name"] == unadded_can.nick_name


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_put_cans(basic_user_auth_client):
    data = {
        "description": "An updated can description",
    }
    response = basic_user_auth_client.put("/api/v1/cans/517", json=data)

    assert response.status_code == 403


@pytest.mark.usefixtures("app_ctx")
def test_can_put_404(budget_team_auth_client):
    test_can_id = 518
    update_data = {
        "number": "G123456",
        "description": "Test CAN Created by unit test",
        "portfolio_id": 6,
        "funding_details_id": 1,
        "nick_name": "MockNickname",
    }

    response = budget_team_auth_client.put(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 404


def test_service_update_can_with_nones(loaded_db):
    update_data = {
        "nick_name": None,
        "number": "G123456",
        "description": "Test Test Test",
        "portfolio_id": 6,
        "funding_details_id": 1,
    }

    test_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "nick_name": "My Nickname",
        "funding_details_id": 1,
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(test_data)

    updated_can = can_service.update(update_data, new_can.id)

    can = loaded_db.execute(select(CAN).where(CAN.id == updated_can.id)).scalar_one()

    assert can is not None
    assert can.number == "G123456"
    assert updated_can.number == "G123456"
    assert can.nick_name is None
    assert updated_can.nick_name is None
    assert can.portfolio_id == 6
    assert updated_can.portfolio_id == 6
    assert can.description == "Test Test Test"
    assert updated_can.description == "Test Test Test"
    assert can.funding_details_id == 1
    assert updated_can.funding_details_id == 1

    loaded_db.delete(new_can)
    loaded_db.commit()


# Testing deleting CANs
@pytest.mark.usefixtures("app_ctx")
def test_can_delete(budget_team_auth_client, mocker, unadded_can):
    test_can_id = 517

    mocker_delete_can = mocker.patch("ops_api.ops.services.cans.CANService.delete")
    response = budget_team_auth_client.delete(f"/api/v1/cans/{test_can_id}")

    assert response.status_code == 200
    mocker_delete_can.assert_called_once_with(test_can_id)
    assert response.json["message"] == "CAN deleted"
    assert response.json["id"] == test_can_id


@pytest.mark.usefixtures("app_ctx")
def test_can_delete_404(budget_team_auth_client):
    test_can_id = 1

    response = budget_team_auth_client.delete(f"/api/v1/cans/{test_can_id}")

    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_delete_cans(basic_user_auth_client):
    response = basic_user_auth_client.delete("/api/v1/cans/517")

    assert response.status_code == 403


def test_service_delete_can(loaded_db):

    test_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(test_data)

    can_service.delete(new_can.id)

    stmt = select(CAN).where(CAN.id == new_can.id)
    can = loaded_db.scalar(stmt)

    assert can is None
