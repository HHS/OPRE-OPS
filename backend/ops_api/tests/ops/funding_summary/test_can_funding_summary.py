from decimal import Decimal

import pytest
from flask.testing import FlaskClient

from models.cans import CAN
from ops_api.ops.utils.cans import get_can_funding_summary
from ops_api.tests.utils import remove_keys


@pytest.mark.usefixtures("app_ctx")
def test_get_can_funding_summary_no_fiscal_year(loaded_db, test_can) -> None:
    result = get_can_funding_summary(test_can)

    # Remove these because they are set according to when the test was run
    remove_keys(result, ["created_on", "updated_on", "versions"])

    assert result == {
        "available_funding": Decimal("-860000.00"),
        "can": {
            "active_period": 1,
            "appropriation_date": 2023,
            "budget_line_items": [15008],
            "created_by": None,
            "created_by_user": None,
            "description": "Healthy Marriages Responsible Fatherhood - OPRE",
            "display_name": "G99HRF2",
            "expiration_date": 2024,
            "funding_budgets": [
                {
                    "budget": "1140000.0",
                    "can": 500,
                    "can_id": 500,
                    "created_by": None,
                    "created_by_user": None,
                    "display_name": "CANFundingBudget#1",
                    "fiscal_year": 2023,
                    "id": 1,
                    "notes": None,
                    "updated_by": None,
                    "updated_by_user": None,
                }
            ],
            "funding_details": {
                "allotment": None,
                "allowance": None,
                "appropriation": None,
                "created_by": None,
                "created_by_user": None,
                "display_name": "CANFundingDetails#1",
                "fiscal_year": 2023,
                "fund_code": "AAXXXX20231DAD",
                "funding_partner": None,
                "funding_source": "OPRE",
                "id": 1,
                "method_of_transfer": "DIRECT",
                "sub_allowance": None,
                "updated_by": None,
                "updated_by_user": None,
            },
            "funding_details_id": 1,
            "funding_received": [
                {
                    "can": 500,
                    "can_id": 500,
                    "created_by": None,
                    "created_by_user": None,
                    "display_name": "CANFundingReceived#500",
                    "fiscal_year": 2023,
                    "funding": "880000.0",
                    "id": 500,
                    "notes": None,
                    "updated_by": None,
                    "updated_by_user": None,
                }
            ],
            "id": 500,
            "nick_name": "HMRF-OPRE",
            "number": "G99HRF2",
            "portfolio": 6,
            "portfolio_id": 6,
            "projects": [],
            "updated_by": None,
            "updated_by_user": None,
        },
        "carry_forward_funding": 0,
        "carry_forward_label": " Carry-Forward",
        "expected_funding": Decimal("260000.0"),
        "expiration_date": "10/01/2024",
        "in_execution_funding": Decimal("2000000.00"),
        "obligated_funding": 0,
        "planned_funding": 0,
        "received_funding": Decimal("880000.0"),
        "total_funding": Decimal("1140000.0"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_can_funding_summary_with_fiscal_year(loaded_db, test_can) -> None:
    result = get_can_funding_summary(test_can, 2023)

    # Remove these because they are set according to when the test was run
    remove_keys(result, ["created_on", "updated_on", "versions"])

    assert result == {
        "available_funding": Decimal("1140000.0"),
        "can": {
            "active_period": 1,
            "appropriation_date": 2023,
            "budget_line_items": [15008],
            "created_by": None,
            "created_by_user": None,
            "description": "Healthy Marriages Responsible Fatherhood - OPRE",
            "display_name": "G99HRF2",
            "expiration_date": 2024,
            "funding_budgets": [
                {
                    "budget": "1140000.0",
                    "can": 500,
                    "can_id": 500,
                    "created_by": None,
                    "created_by_user": None,
                    "display_name": "CANFundingBudget#1",
                    "fiscal_year": 2023,
                    "id": 1,
                    "notes": None,
                    "updated_by": None,
                    "updated_by_user": None,
                }
            ],
            "funding_details": {
                "allotment": None,
                "allowance": None,
                "appropriation": None,
                "created_by": None,
                "created_by_user": None,
                "display_name": "CANFundingDetails#1",
                "fiscal_year": 2023,
                "fund_code": "AAXXXX20231DAD",
                "funding_partner": None,
                "funding_source": "OPRE",
                "id": 1,
                "method_of_transfer": "DIRECT",
                "sub_allowance": None,
                "updated_by": None,
                "updated_by_user": None,
            },
            "funding_details_id": 1,
            "funding_received": [
                {
                    "can": 500,
                    "can_id": 500,
                    "created_by": None,
                    "created_by_user": None,
                    "display_name": "CANFundingReceived#500",
                    "fiscal_year": 2023,
                    "funding": "880000.0",
                    "id": 500,
                    "notes": None,
                    "updated_by": None,
                    "updated_by_user": None,
                }
            ],
            "id": 500,
            "nick_name": "HMRF-OPRE",
            "number": "G99HRF2",
            "portfolio": 6,
            "portfolio_id": 6,
            "projects": [],
            "updated_by": None,
            "updated_by_user": None,
        },
        "carry_forward_funding": 0,
        "carry_forward_label": " Carry-Forward",
        "expected_funding": Decimal("260000.0"),
        "expiration_date": "10/01/2024",
        "in_execution_funding": 0,
        "obligated_funding": 0,
        "planned_funding": 0,
        "received_funding": Decimal("880000.0"),
        "total_funding": Decimal("1140000.0"),
    }


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_can_get_can_funding_summary(auth_client: FlaskClient, test_can: CAN) -> None:
    response = auth_client.get(f"/api/v1/can-funding-summary/{test_can.id}")
    assert response.status_code == 200
    assert response.json["can"]["id"] == test_can.id
