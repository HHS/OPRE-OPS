import datetime
from decimal import Decimal

import pytest
from models.cans import CAN
from ops.utils.cans import get_can_funding_summary


@pytest.mark.usefixtures("app_ctx")
def test_get_can_funding_summary_no_fiscal_year(loaded_db):
    can = loaded_db.session.get(CAN, 1)

    assert get_can_funding_summary(can) == {
        "available_funding": -860000.0,
        "can": {
            "appropriation_term": 1,
            "arrangement_type_id": 5,
            "authorizer_id": 26,
            "description": "Healthy Marriages Responsible Fatherhood - OPRE",
            "expiration_date": datetime.datetime(2023, 9, 1, 0, 0),
            "id": 1,
            "managing_portfolio_id": 6,
            "managing_research_project_id": None,
            "nickname": "HMRF-OPRE",
            "number": "G99HRF2",
            "purpose": "",
        },
        "carry_over_funding": Decimal("0"),
        "current_funding": Decimal("880000.00"),
        "expected_funding": Decimal("260000.00"),
        "expiration_date": "09/01/2023",
        "in_execution_funding": Decimal("2000000.00"),
        "obligated_funding": 0,
        "planned_funding": Decimal("0"),
        "total_funding": Decimal("1140000.00"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_can_funding_summary_with_fiscal_year(loaded_db):
    can = loaded_db.session.get(CAN, 1)

    assert get_can_funding_summary(can, 2023) == {
        "available_funding": -860000.0,
        "can": {
            "appropriation_term": 1,
            "arrangement_type_id": 5,
            "authorizer_id": 26,
            "description": "Healthy Marriages Responsible Fatherhood - OPRE",
            "expiration_date": datetime.datetime(2023, 9, 1, 0, 0),
            "id": 1,
            "managing_portfolio_id": 6,
            "managing_research_project_id": None,
            "nickname": "HMRF-OPRE",
            "number": "G99HRF2",
            "purpose": "",
        },
        "carry_over_funding": Decimal("0"),
        "current_funding": Decimal("880000.00"),
        "expected_funding": Decimal("260000.00"),
        "expiration_date": "09/01/2023",
        "in_execution_funding": Decimal("2000000.00"),
        "obligated_funding": 0,
        "planned_funding": Decimal("0"),
        "total_funding": Decimal("1140000.00"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_funding_summary(client):
    response = client.get("/api/v1/can-funding-summary/1")
    assert response.status_code == 200
    assert response.json["can"]["id"] == 1
