import datetime
from decimal import Decimal

from ops.models.cans import CAN
from ops.utils.cans import get_can_funding_summary
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_get_can_funding_summary_no_fiscal_year(loaded_db):
    can = loaded_db.session.query(CAN).get(1)

    assert get_can_funding_summary(can) == {
        "available_funding": 4693574.0,
        "can": {
            "appropriation_term": 1,
            "arrangement_type_id": 3,
            "authorizer_id": 1,
            "description": "Secondary Analyses Data On Child Care & Early Edu",
            "expiration_date": datetime.datetime(2025, 1, 1, 0, 0),
            "id": 1,
            "managing_portfolio_id": 1,
            "managing_research_project_id": None,
            "nickname": "CCE",
            "number": "G99WRGB",
            "purpose": "Secondary Analyses of Child Care and Early Education Data "
            "(2022)",
        },
        "carry_over_funding": Decimal("15.00"),
        "current_funding": Decimal("5000000.00"),
        "expected_funding": Decimal("566246.00"),
        "expiration_date": "01/01/2025",
        "in_execution_funding": Decimal("850450.00"),
        "obligated_funding": 0,
        "planned_funding": Decimal("22222.00"),
        "total_funding": Decimal("5566246.00"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_can_funding_summary_with_fiscal_year(loaded_db):
    can = loaded_db.session.query(CAN).get(1)

    assert get_can_funding_summary(can, 2023) == {
        "available_funding": 4310901.0,
        "can": {
            "appropriation_term": 1,
            "arrangement_type_id": 3,
            "authorizer_id": 1,
            "description": "Secondary Analyses Data On Child Care & Early Edu",
            "expiration_date": datetime.datetime(2025, 1, 1, 0, 0),
            "id": 1,
            "managing_portfolio_id": 1,
            "managing_research_project_id": None,
            "nickname": "CCE",
            "number": "G99WRGB",
            "purpose": "Secondary Analyses of Child Care and Early Education Data "
            "(2022)",
        },
        "carry_over_funding": Decimal("10.00"),
        "current_funding": Decimal("4000000.00"),
        "expected_funding": Decimal("333123.00"),
        "expiration_date": "01/01/2025",
        "in_execution_funding": 0,
        "obligated_funding": 0,
        "planned_funding": Decimal("22222.00"),
        "total_funding": Decimal("4333123.00"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_funding_summary(client):
    response = client.get("/api/v1/can-funding-summary/1")
    assert response.status_code == 200
    assert response.json["can"]["id"] == 1
