import datetime

import pytest
from sqlalchemy import func, select

from models import CAN, BudgetLineItem, CANFundingSource, CANStatus
from ops.services.cans import CANService


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


def test_can_get_all(auth_client, loaded_db):
    count = loaded_db.query(CAN).count()

    response = auth_client.get("/api/v1/cans/")
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_can_get_by_id(auth_client, loaded_db, test_can):
    response = auth_client.get(f"/api/v1/cans/{test_can.id}")
    assert response.status_code == 200
    assert response.json["number"] == "G99HRF2"


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


# Testing CAN Creation
@pytest.mark.usefixtures("app_ctx")
def test_can_post_creates_can(budget_team_auth_client, mocker, loaded_db):
    input_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    mock_output_data = CAN(id=517, portfolio_id=6, number="G998235", description="Test CAN Created by unit test")
    mocker_create_can = mocker.patch("ops_api.ops.services.cans.CANService.create")
    mocker_create_can.return_value = mock_output_data
    response = budget_team_auth_client.post("/api/v1/cans/", json=input_data)

    assert response.status_code == 201
    mocker_create_can.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["portfolio_id"] == mock_output_data.portfolio_id
    assert response.json["number"] == mock_output_data.number
    assert response.json["description"] == mock_output_data.description


@pytest.mark.usefixtures("app_ctx")
def test_basic_user_cannot_post_creates_can(basic_user_auth_client):
    data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }
    response = basic_user_auth_client.post("/api/v1/cans/", json=data)

    assert response.status_code == 401


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


# Testing updating CANs by field
@pytest.mark.usefixtures("app_ctx")
def test_can_patch_updates_can(budget_team_auth_client, mocker, unadded_can):
    test_can_id = 517
    update_data = {
        "description": "Test CAN Created by unit test",
    }

    mocker_update_can = mocker.patch("ops_api.ops.services.cans.CANService.update_by_fields")
    unadded_can.description = update_data["description"]
    mocker_update_can.return_value = unadded_can
    response = budget_team_auth_client.patch(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 200
    mocker_update_can.assert_called_once_with(update_data, test_can_id)
    # Assert fields that should not have changed
    assert response.json["number"] == unadded_can.number
    # Assert field that should have changed.
    assert response.json["description"] == update_data["description"]


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

    assert response.status_code == 401


def test_service_patch_can(loaded_db):
    test_can_id = 517
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

    can_service = CANService()

    updated_can = can_service.update_by_fields(update_data, test_can_id)

    can = loaded_db.execute(select(CAN).where(CAN.number == "G998235")).scalar_one()

    assert can is not None
    assert can.number == "G998235"
    assert updated_can.number == "G998235"
    assert can.description == "Test Test Test"
    assert updated_can.description == "Test Test Test"

    loaded_db.delete(new_can)
    loaded_db.commit()


@pytest.fixture()
def db_with_test_can(loaded_db, unadded_can):
    loaded_db.add(unadded_can)
    loaded_db.commit()
    yield loaded_db

    loaded_db.delete(unadded_can)
    loaded_db.commit()
