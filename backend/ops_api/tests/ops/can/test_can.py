import datetime

import pytest
from sqlalchemy import func, select

from models import BudgetLineItem
from models.cans import CAN, CANArrangementType, CANStatus


@pytest.mark.usefixtures("app_ctx")
def test_can_retrieve(loaded_db, mocker):
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2023, 8, 1)
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can is not None
    assert can.number == "G99HRF2"
    assert can.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can.nickname == "HMRF-OPRE"
    assert can.appropriation_term == 1
    assert can.authorizer_id == 26
    assert can.managing_portfolio_id == 6
    assert can.arrangement_type == CANArrangementType.OPRE_APPROPRIATION
    assert can.status == CANStatus.ACTIVE
    assert len(can.funding_sources) == 2
    assert can.shared_portfolios == []
    assert (
        len(can.budget_line_items)
        == loaded_db.execute(
            select(func.count()).select_from(BudgetLineItem).where(BudgetLineItem.can_id == can.id)
        ).scalar()
    )


@pytest.mark.usefixtures("app_ctx")
def test_can_is_inactive(loaded_db, mocker):
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can is not None
    assert can.number == "G99HRF2"
    assert can.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can.nickname == "HMRF-OPRE"
    assert can.appropriation_term == 1
    assert can.authorizer_id == 26
    assert can.managing_portfolio_id == 6
    assert can.arrangement_type == CANArrangementType.OPRE_APPROPRIATION
    assert can.status == CANStatus.INACTIVE
    assert len(can.funding_sources) == 2
    assert can.shared_portfolios == []
    assert (
        len(can.budget_line_items)
        == loaded_db.execute(
            select(func.count()).select_from(BudgetLineItem).where(BudgetLineItem.can_id == can.id)
        ).scalar()
    )


def test_can_creation(loaded_db):
    can = CAN(
        number="G990991-X",
        description="Secondary Analyses Data On Child Care & Early Edu",
        nickname="ABCD",
        arrangement_type=CANArrangementType.COST_SHARE,
        authorizer_id=1,
        managing_portfolio_id=2,
        expiration_date=datetime.datetime(2022, 9, 30, 1, 1, 1),
    )

    serialized = can.to_dict()

    assert can is not None
    assert serialized["number"] == "G990991-X"


def test_can_get_all(auth_client, loaded_db):
    count = loaded_db.query(CAN).count()

    response = auth_client.get("/api/v1/cans/")
    assert response.status_code == 200
    assert len(response.json) == count


def test_can_no_expiration_date(loaded_db):
    can = CAN(
        number="G990991-X",
        description="Secondary Analyses Data On Child Care & Early Edu",
        nickname="ABCD",
        arrangement_type=CANArrangementType.COST_SHARE,
        authorizer_id=1,
        managing_portfolio_id=2,
        appropriation_date=datetime.datetime(2022, 9, 30, 1, 1, 1),
    )

    serialized = can.to_dict()

    assert can is not None
    assert serialized["appropriation_term"] == 0


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
