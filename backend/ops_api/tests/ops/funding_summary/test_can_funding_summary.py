from decimal import Decimal
from typing import Type
from unittest.mock import MagicMock

import pytest
from flask.testing import FlaskClient

from models.cans import CAN, CANFundingBudget, CANMethodOfTransfer
from ops_api.ops.utils.cans import (
    aggregate_funding_summaries,
    filter_by_attribute,
    filter_by_fiscal_year_budget,
    get_can_funding_summary,
    get_filtered_cans,
    get_nested_attribute,
)
from ops_api.tests.utils import remove_keys


@pytest.fixture
def mock_can():
    funding_details = MagicMock(
        fiscal_year=2021,
        fund_code="ABXXXX20215MBD",
        funding_source="OPRE",
        method_of_transfer="Reimbursable",
        active_period=5,
        obligate_by=2026,
    )

    funding_budgets = [
        MagicMock(fiscal_year=2021, budget=Decimal("50000000.00")),  # This is a new_funding budget for FY 2021
        MagicMock(fiscal_year=2023, budget=Decimal("594500.00")),  # This is a carry_forward budget for FY 2023
        MagicMock(fiscal_year=2024, budget=Decimal("614000.00")),  # This is a carry_forward budget for FY 2024
    ]

    can = MagicMock(
        id=500,
        number="M14HRF1",
        description="Healthy Marriages For Happy Kids - OPRE",
        nick_name="HMFHK-OPRE",
        funding_details=funding_details,
        funding_budgets=funding_budgets,
        active_period=5,
        obligate_by=2026,
    )

    return can


@pytest.fixture
def mock_can_without_funding_details():
    funding_budgets = [
        CANFundingBudget(fiscal_year=2021, budget=Decimal("50000000.00")),
        CANFundingBudget(fiscal_year=2023, budget=Decimal("594500.00")),
        CANFundingBudget(fiscal_year=2024, budget=Decimal("614000.00")),
    ]

    can = CAN(
        id=500,
        number="M14HRF1",
        description="Healthy Marriages For Happy Kids - OPRE",
        nick_name="HMFHK-OPRE",
        funding_budgets=funding_budgets,
    )

    return can


class DummyObject:
    def __init__(self):
        self.nested = DummyNestedObject()


class DummyNestedObject:
    def __init__(self):
        self.value = "test_value"


def test_can_get_can_funding_summary_filter_fy_budget_400(auth_client: FlaskClient):
    query_params = f"can_ids={0}&fy_budget=0"
    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")
    assert response.status_code == 400
    assert response.json["Error"] == "'fy_budget' must be two integers for min and max budget values."


def test_can_get_can_funding_summary_fy_budget(auth_client: FlaskClient):
    query_params = f"can_ids={0}&fy_budget=0&fy_budget=1000000"
    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")
    assert response.status_code == 200
    assert len(response.json["cans"]) == 5


def test_can_get_can_funding_summary_duplicate_transfer(auth_client: FlaskClient):
    query_params = f"can_ids={0}&fiscal_year=2023&transfer=COST_SHARE&transfer=COST_SHARE"
    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")
    assert response.status_code == 200
    assert len(response.json["cans"]) == 1


def test_can_get_can_funding_summary_cost_share_transfer(auth_client: FlaskClient):
    query_params = f"can_ids={0}&fiscal_year=2021&transfer=COST_SHARE"

    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")

    assert response.status_code == 200
    assert len(response.json["cans"]) == 1
    assert response.json["expected_funding"] == 0.0
    assert response.json["received_funding"] == 200000.0
    assert response.json["total_funding"] == 200000.0


def test_can_get_can_funding_summary_invalid_transfer(auth_client: FlaskClient):
    query_params = f"can_ids={0}&fiscal_year=2023&transfer=INVALID"
    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")
    assert response.status_code == 400
    assert response.json["Error"] == "Invalid 'transfer' value. Must be one of: DIRECT, COST_SHARE, IAA, IDDA, OTHER."


def test_can_get_can_funding_summary_all_cans_fiscal_year_match(auth_client: FlaskClient) -> None:
    query_params = f"can_ids={0}&fiscal_year=2023"

    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")

    assert response.status_code == 200
    assert len(response.json["cans"]) == 15


def test_can_get_can_funding_summary_filter_budget_fiscal_year_no_cans(auth_client: FlaskClient) -> None:
    query_params = f"can_ids={0}&fiscal_year=2023&fy_budget=3635000&fy_budget=7815000"

    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")

    assert response.status_code == 200
    assert len(response.json["cans"]) == 0


def test_can_get_can_funding_summary_filter_budget_fiscal_year_cans(auth_client: FlaskClient) -> None:
    query_params = f"can_ids={0}&fiscal_year=2023&fy_budget=200000&fy_budget=592000"

    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")

    assert response.status_code == 200
    assert len(response.json["cans"]) == 1


def test_can_get_can_funding_summary_all_cans_no_fiscal_year_match(
    auth_client: FlaskClient, test_cans: list[Type[CAN]]
) -> None:
    query_params = f"can_ids={0}&fiscal_year=2044"

    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")

    assert response.status_code == 200
    assert len(response.json["cans"]) == 0
    assert response.json["available_funding"] == 0.0
    assert response.json["carry_forward_funding"] == 0.0
    assert response.json["expected_funding"] == 0.0
    assert response.json["in_draft_funding"] == 0.0
    assert response.json["in_execution_funding"] == 0.0
    assert response.json["new_funding"] == 0.0
    assert response.json["obligated_funding"] == 0.0
    assert response.json["planned_funding"] == 0.0
    assert response.json["received_funding"] == 0.0
    assert response.json["total_funding"] == 0.0


@pytest.mark.usefixtures("app_ctx")
def test_get_can_funding_summary_no_fiscal_year(loaded_db, test_can) -> None:
    result = get_can_funding_summary(test_can)

    # Remove these because they are set according to when the test was run
    remove_keys(result, ["created_on", "updated_on", "versions"])

    assert result == {
        "available_funding": Decimal("-860000.00"),
        "cans": [
            {
                "can": {
                    "active_period": 1,
                    "appropriation_date": 2023,
                    "budget_line_items": [15019],
                    "created_by": None,
                    "created_by_user": None,
                    "description": "Healthy Marriages Responsible Fatherhood - OPRE",
                    "display_name": "G99HRF2",
                    "expiration_date": 2024,
                    "funding_budgets": [
                        {
                            "budget": "1140000.0",  # This is a new_funding budget
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
                    "projects": [1000],
                    "updated_by": None,
                    "updated_by_user": None,
                },
                "carry_forward_label": " Carry-Forward",
                "expiration_date": "10/01/2024",
            }
        ],
        "carry_forward_funding": 0,
        "expected_funding": Decimal("260000.0"),
        "in_draft_funding": 0,
        "in_execution_funding": Decimal("2000000.00"),
        "new_funding": Decimal("1140000.0"),
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
        "cans": [
            {
                "can": {
                    "active_period": 1,
                    "appropriation_date": 2023,
                    "budget_line_items": [15019],
                    "created_by": None,
                    "created_by_user": None,
                    "description": "Healthy Marriages Responsible Fatherhood - OPRE",
                    "display_name": "G99HRF2",
                    "expiration_date": 2024,
                    "funding_budgets": [
                        {
                            "budget": "1140000.0",  # This is a new_funding budget
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
                    "projects": [1000],
                    "updated_by": None,
                    "updated_by_user": None,
                },
                "carry_forward_label": " Carry-Forward",
                "expiration_date": "10/01/2024",
            }
        ],
        "carry_forward_funding": 0,
        "in_draft_funding": Decimal("0.0"),
        "expected_funding": Decimal("260000.0"),
        "in_execution_funding": 0,
        "obligated_funding": 0,
        "planned_funding": 0,
        "received_funding": Decimal("880000.0"),
        "total_funding": Decimal("1140000.0"),
        "new_funding": Decimal("1140000.0") - 0,
    }


def test_can_get_can_funding_summary(auth_client: FlaskClient, test_can: CAN) -> None:
    query_params = f"can_ids={test_can.id}"

    response = auth_client.get(f"/api/v1/can-funding-summary?{query_params}")

    assert response.status_code == 200
    assert response.json["cans"][0]["can"]["id"] == test_can.id
    assert "new_funding" in response.json
    assert isinstance(response.json["new_funding"], float)
    assert "expiration_date" in response.json["cans"][0]
    assert "carry_forward_label" in response.json["cans"][0]


def test_cans_get_can_funding_summary(auth_client: FlaskClient, test_cans: list[Type[CAN]]) -> None:
    # The math will work differently on this test if you run it alone vs running the full test suite
    # If it fails, try running the full test suite
    url = f"/api/v1/can-funding-summary?can_ids={test_cans[0].id}&can_ids={test_cans[1].id}"

    response = auth_client.get(url)

    available_funding = response.json["available_funding"]
    carry_forward_funding = response.json["carry_forward_funding"]
    new_funding = response.json["new_funding"]
    total_funding = response.json["total_funding"]

    assert response.status_code == 200
    assert len(response.json["cans"]) == 2

    assert available_funding == 3374500.23
    assert carry_forward_funding == 10034500.23
    assert new_funding == 1340000.0
    assert total_funding == 11374500.23
    assert carry_forward_funding != available_funding
    assert total_funding == carry_forward_funding + new_funding


def test_can_get_can_funding_summary_filter(auth_client: FlaskClient, test_cans: list[Type[CAN]]) -> None:
    url = f"/api/v1/can-funding-summary?" f"can_ids={test_cans[0].id}&can_ids={test_cans[1].id}&active_period=1"

    response = auth_client.get(url)

    assert response.status_code == 200
    assert len(response.json["cans"]) == 1
    assert response.json["cans"][0]["can"]["active_period"] == 1


def test_can_get_can_funding_summary_transfer_filter(auth_client: FlaskClient) -> None:
    url = "/api/v1/can-funding-summary?can_ids=0&fiscal_year=2023&transfer=DIRECT"

    response = auth_client.get(url)

    assert response.status_code == 200
    assert len(response.json["cans"]) == 5
    assert response.json["expected_funding"] == 4780000.0
    assert response.json["received_funding"] == 9640000.0
    assert response.json["total_funding"] == 14420000.0


def test_can_get_can_funding_summary_complete_filter(auth_client: FlaskClient, test_cans: list[Type[CAN]]) -> None:
    url = (
        f"/api/v1/can-funding-summary?"
        f"can_ids={test_cans[0].id}&can_ids={test_cans[1].id}&"
        f"fiscal_year=2024&"
        f"active_period=1&active_period=5&"
        f"transfer=DIRECT&transfer=IAA&"
        f"portfolio=HS&portfolio=HMRF&"
        f"fy_budget=50000&fy_budget=100000"
    )

    response = auth_client.get(url)

    assert response.status_code == 200
    assert len(response.json["cans"]) == 0
    assert "new_funding" in response.json
    assert response.json["obligated_funding"] == 0.0


def test_get_nested_attribute_existing_attribute():
    obj = DummyObject()
    result = get_nested_attribute(obj, "nested.value")
    assert result == "test_value"


def test_get_nested_attribute_non_existing_attribute():
    obj = DummyObject()
    result = get_nested_attribute(obj, "nested.non_existing")
    assert result is None


def test_get_nested_attribute_non_existing_top_level():
    obj = DummyObject()
    result = get_nested_attribute(obj, "non_existing")
    assert result is None


def test_filter_cans_by_attribute():
    cans = [
        MagicMock(active_period=1, funding_details=MagicMock(method_of_transfer=CANMethodOfTransfer.DIRECT)),
        MagicMock(active_period=2, funding_details=MagicMock(method_of_transfer=CANMethodOfTransfer.IAA)),
        MagicMock(active_period=1, funding_details=MagicMock(method_of_transfer=CANMethodOfTransfer.DIRECT)),
    ]

    filtered_cans = filter_by_attribute(cans, "funding_details.method_of_transfer", [CANMethodOfTransfer.DIRECT])

    assert len(filtered_cans) == 2


def test_filter_cans_by_fiscal_year_budget():
    cans = [
        MagicMock(
            funding_budgets=[MagicMock(budget=1000001.0, fiscal_year=2023)],
        ),
        MagicMock(funding_budgets=[MagicMock(budget=2000000.0, fiscal_year=2023)]),
        MagicMock(funding_budgets=[MagicMock(budget=500000.0, fiscal_year=2023)]),
    ]

    fiscal_year_budget = [Decimal(1000000), Decimal(2000000)]
    budget_fiscal_year = 2023
    filtered_cans = filter_by_fiscal_year_budget(cans, fiscal_year_budget, budget_fiscal_year)

    assert len(filtered_cans) == 2


def test_filter_cans_by_fiscal_year_budget_no_match():
    cans = [
        MagicMock(funding_budgets=[MagicMock(budget=500000.0, fiscal_year=2023)]),
        MagicMock(funding_budgets=[MagicMock(budget=7000000.0, fiscal_year=2024)]),
    ]

    fiscal_year_budget = [Decimal(1000000), Decimal(2000000)]
    budget_fiscal_year = 2023
    filtered_cans = filter_by_fiscal_year_budget(cans, fiscal_year_budget, budget_fiscal_year)

    assert len(filtered_cans) == 0


@pytest.mark.parametrize(
    "active_period, transfer, portfolio, fy_budget, expected_count",
    [
        (None, None, None, None, 3),
        ([1], None, None, None, 2),
        (None, [CANMethodOfTransfer.DIRECT], None, None, 1),
        (None, None, None, [100000, 200000], 2),
        ([1], [CANMethodOfTransfer.IAA], ["HS"], [100000, 200000], 0),
    ],
)
def test_filter_cans(active_period, transfer, portfolio, fy_budget, expected_count):
    cans = [
        MagicMock(
            active_period=1,
            funding_details=MagicMock(method_of_transfer=CANMethodOfTransfer.DIRECT),
            portfolio=[MagicMock(abbreviation="HS")],
            funding_budgets=[MagicMock(budget=150000)],
        ),
        MagicMock(
            active_period=2,
            funding_details=MagicMock(method_of_transfer=CANMethodOfTransfer.IAA),
            portfolio=[MagicMock(abbreviation="HS")],
            funding_budgets=[MagicMock(budget=50000)],
        ),
        MagicMock(
            active_period=1,
            funding_details=MagicMock(method_of_transfer=CANMethodOfTransfer.IAA),
            portfolio=[MagicMock(abbreviation="HMRF")],
            funding_budgets=[MagicMock(budget=200000)],
        ),
    ]

    filtered_cans = get_filtered_cans(
        cans, active_period=active_period, transfer=transfer, portfolio=portfolio, fy_budget=fy_budget
    )

    assert len(filtered_cans) == expected_count


def test_aggregate_funding_summaries():
    funding_sums = [
        {
            "available_funding": 100000,
            "cans": [
                {
                    "can": {
                        "id": 1,
                        "description": "Grant for educational projects",
                        "amount": 50000,
                        "obligate_by": 2025,
                    },
                    "carry_forward_label": "2024 Carry Forward",
                    "expiration_date": "10/01/2025",
                }
            ],
            "carry_forward_funding": 20000,
            "received_funding": 75000,
            "expected_funding": 125000 - 75000,
            "in_draft_funding": 0,
            "in_execution_funding": 50000,
            "obligated_funding": 30000,
            "planned_funding": 120000,
            "total_funding": 125000,
            "new_funding": 100000 + 20000,
        },
        {
            "available_funding": 150000,
            "cans": [
                {
                    "can": {
                        "id": 2,
                        "description": "Infrastructure development grant",
                        "amount": 70000,
                        "obligate_by": 2026,
                    },
                    "carry_forward_label": "2025 Carry Forward",
                    "expiration_date": "10/01/2026",
                }
            ],
            "carry_forward_funding": 150000,
            "received_funding": 100000,
            "expected_funding": 180000 - 100000,
            "in_draft_funding": 0,
            "in_execution_funding": 80000,
            "obligated_funding": 50000,
            "planned_funding": 160000,
            "total_funding": 180000,
            "new_funding": 150000 + 30000,
        },
    ]

    result = aggregate_funding_summaries(funding_sums)

    assert result == {
        "available_funding": Decimal("250000"),
        "cans": [
            {
                "can": {"amount": 50000, "description": "Grant for educational projects", "id": 1, "obligate_by": 2025},
                "carry_forward_label": "2024 Carry Forward",
                "expiration_date": "10/01/2025",
            },
            {
                "can": {
                    "amount": 70000,
                    "description": "Infrastructure development grant",
                    "id": 2,
                    "obligate_by": 2026,
                },
                "carry_forward_label": "2025 Carry Forward",
                "expiration_date": "10/01/2026",
            },
        ],
        "carry_forward_funding": Decimal("170000"),
        "expected_funding": Decimal("130000"),
        "in_draft_funding": Decimal("0"),
        "in_execution_funding": Decimal("130000"),
        "new_funding": Decimal("300000"),
        "obligated_funding": Decimal("80000"),
        "planned_funding": Decimal("280000"),
        "received_funding": Decimal("175000"),
        "total_funding": Decimal("305000"),
    }


def test_can_get_can_funding_summary_all_cans(auth_client: FlaskClient) -> None:
    response = auth_client.get(f"/api/v1/can-funding-summary?can_ids={0}")
    assert response.status_code == 200
    assert len(response.json["cans"]) == 20


def test_new_funding_math(auth_client: FlaskClient) -> None:
    expected_carry_forward_data = {
        2027: 500000,
        2026: 500000,
        2025: 1034500.23,  # test_funding_budget_post_with_cents added a 34500.23 budget
        2024: 20140000,
        2023: 51140000,
        2022: 10000000,
        2021: 0,
    }

    expected_new_funding_data = {
        2027: 0,
        2026: 0,
        2025: 0,
        2024: 0,
        2023: 27060000,
        2022: 17000000,
        2021: 30200000,
    }

    for year in expected_carry_forward_data.keys():
        response = auth_client.get(f"/api/v1/can-funding-summary?can_ids=0&fiscal_year={year}")
        assert response.status_code == 200
        assert response.json["carry_forward_funding"] == expected_carry_forward_data[year]
        assert response.json["new_funding"] == expected_new_funding_data[year]
        assert response.json["total_funding"] == expected_carry_forward_data[year] + expected_new_funding_data[year]


def test_carry_forward_with_transfer_filter(auth_client: FlaskClient) -> None:
    response = auth_client.get("/api/v1/can-funding-summary?can_ids=0&fiscal_year=2023&transfer=IAA")
    assert response.status_code == 200
    assert response.json["carry_forward_funding"] == 20000000
    assert response.json["new_funding"] == 1140000
    assert response.json["total_funding"] == 21140000
    assert response.json["total_funding"] == response.json["carry_forward_funding"] + response.json["new_funding"]


def test_carry_forward_with_portfolio_filter(auth_client: FlaskClient) -> None:
    response = auth_client.get("/api/v1/can-funding-summary?can_ids=0&fiscal_year=2023&portfolio=HMRF")
    assert response.status_code == 200
    assert response.json["carry_forward_funding"] == 11140000
    assert response.json["new_funding"] == 23420000
    assert response.json["total_funding"] == 34560000
    assert response.json["total_funding"] == response.json["carry_forward_funding"] + response.json["new_funding"]


# Helper function to validate the funding results for a fiscal year
def assert_funding_summary(result, expected_cf, expected_nf, expected_tf):
    assert "carry_forward_funding" in result
    assert "new_funding" in result
    assert "total_funding" in result

    cf = result["carry_forward_funding"]
    nf = result["new_funding"]
    tf = result["total_funding"]

    assert cf == expected_cf
    assert nf == expected_nf
    assert tf == expected_tf
    assert tf == cf + nf


@pytest.mark.parametrize(
    "fiscal_year, expected_cf, expected_nf, expected_tf",
    [
        (2020, 0, 0, 0),
        (2021, 0, 50000000.0, 50000000.0),
        (2022, 0, 0, 0),
        (2023, 594500.0, 0, 594500.0),
        (2024, 614000.0, 0, 614000.0),
        (2025, 0, 0, 0),
    ],
)
def test_get_can_funding_summary(mock_can, fiscal_year, expected_cf, expected_nf, expected_tf):
    result = get_can_funding_summary(mock_can, fiscal_year)
    assert_funding_summary(result, expected_cf, expected_nf, expected_tf)


@pytest.mark.parametrize(
    "fiscal_year, expected_cf, expected_nf, expected_tf",
    [(2020, 0, 0, 0), (2021, 0, 0, 0), (2022, 0, 0, 0), (2023, 0, 0, 0), (2024, 0, 0, 0), (2025, 0, 0, 0)],
)
def test_get_can_funding_summary_with_no_funding_details(
    mock_can_without_funding_details, fiscal_year, expected_cf, expected_nf, expected_tf
):
    result = get_can_funding_summary(mock_can_without_funding_details, fiscal_year)
    assert_funding_summary(result, expected_cf, expected_nf, expected_tf)
