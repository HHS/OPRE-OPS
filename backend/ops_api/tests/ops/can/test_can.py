import datetime

import pytest
from sqlalchemy import func, select

from models import CAN, BudgetLineItem, CANFundingSource, CANStatus


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
