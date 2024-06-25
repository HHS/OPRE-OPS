from decimal import Decimal

import pytest
from flask.testing import FlaskClient

from models.cans import CAN
from ops_api.ops.utils.cans import get_can_funding_summary


@pytest.mark.usefixtures("app_ctx")
def test_get_can_funding_summary_no_fiscal_year(loaded_db) -> None:
    can = loaded_db.get(CAN, 1)
    result = get_can_funding_summary(can)

    # Remove these because they are set according to when the test was run
    del result["can"]["created_on"]
    del result["can"]["updated_on"]
    del result["can"]["versions"]

    assert result == {
        "available_funding": -860000.0,
        "can": {
            "appropriation_date": None,
            "appropriation_term": 1,
            "arrangement_type": "OPRE_APPROPRIATION",
            "authorizer": 26,
            "authorizer_id": 26,
            "budget_line_items": [9, 29, 30],
            "can_type": None,
            "created_by": None,
            "created_by_user": None,
            "description": "Healthy Marriages Responsible Fatherhood - OPRE",
            "display_name": "G99HRF2",
            "division_id": 5,
            "expiration_date": "2023-09-01T00:00:00.000000Z",
            "funding_sources": [24, 26],
            "id": 1,
            "managing_portfolio": 6,
            "managing_portfolio_id": 6,
            "nickname": "HMRF-OPRE",
            "number": "G99HRF2",
            "purpose": "",
            "projects": [],
            "shared_portfolios": [],
            "updated_by": None,
            "updated_by_user": None,
        },
        "carry_forward_funding": 0,
        "carry_forward_label": "Carry-Forward",
        "received_funding": Decimal("880000.00"),
        "expected_funding": Decimal("260000.00"),
        "expiration_date": "09/01/2023",
        "in_execution_funding": Decimal("2000000.00"),
        "obligated_funding": 0,
        "planned_funding": 0,
        "total_funding": Decimal("1140000.00"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_can_funding_summary_with_fiscal_year(loaded_db) -> None:
    can = loaded_db.get(CAN, 1)
    result = get_can_funding_summary(can, 2023)

    # Remove these because they are set according to when the test was run
    del result["can"]["created_on"]
    del result["can"]["updated_on"]
    del result["can"]["versions"]

    assert result == {
        "available_funding": -860000.0,
        "can": {
            "appropriation_date": None,
            "appropriation_term": 1,
            "arrangement_type": "OPRE_APPROPRIATION",
            "authorizer": 26,
            "authorizer_id": 26,
            "budget_line_items": [9, 29, 30],
            "can_type": None,
            "created_by": None,
            "created_by_user": None,
            "description": "Healthy Marriages Responsible Fatherhood - OPRE",
            "display_name": "G99HRF2",
            "division_id": 5,
            "expiration_date": "2023-09-01T00:00:00.000000Z",
            "funding_sources": [24, 26],
            "id": 1,
            "managing_portfolio": 6,
            "managing_portfolio_id": 6,
            "nickname": "HMRF-OPRE",
            "number": "G99HRF2",
            "purpose": "",
            "projects": [],
            "shared_portfolios": [],
            "updated_by": None,
            "updated_by_user": None,
        },
        "carry_forward_funding": 0,
        "carry_forward_label": "Carry-Forward",
        "received_funding": Decimal("880000.00"),
        "expected_funding": Decimal("260000.00"),
        "expiration_date": "09/01/2023",
        "in_execution_funding": Decimal("2000000.00"),
        "obligated_funding": 0,
        "planned_funding": 0,
        "total_funding": Decimal("1140000.00"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_funding_summary(
    auth_client: FlaskClient,  # type: ignore [type-arg]
) -> None:
    response = auth_client.get("/api/v1/can-funding-summary/1")
    assert response.status_code == 200
    assert response.json["can"]["id"] == 1
