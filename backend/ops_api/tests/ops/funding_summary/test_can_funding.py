"""Tests for the new /cans/<id>/funding/ and /cans/funding/ endpoints."""

from typing import Type

from flask import url_for
from flask.testing import FlaskClient

from models.cans import CAN


class TestCANFundingSingleEndpoint:
    """Tests for GET /cans/<id>/funding/"""

    def test_get_can_funding(self, auth_client: FlaskClient, test_can: CAN) -> None:
        response = auth_client.get(url_for("api.can-funding", id=test_can.id))
        assert response.status_code == 200
        data = response.json

        # Verify top-level structure
        assert "fiscal_year" in data
        assert "funding" in data
        assert "funding_by_fiscal_year" in data
        assert "can" in data

        # Verify funding sub-keys
        funding = data["funding"]
        expected_keys = [
            "total_funding",
            "available_funding",
            "carry_forward_funding",
            "new_funding",
            "expected_funding",
            "received_funding",
            "planned_funding",
            "obligated_funding",
            "in_execution_funding",
            "in_draft_funding",
        ]
        for key in expected_keys:
            assert key in funding, f"Missing key: {key}"
            assert isinstance(funding[key], (int, float)), f"{key} should be numeric"

        # Verify can metadata
        can = data["can"]
        assert can["id"] == test_can.id
        assert can["number"] == test_can.number
        assert "portfolio_id" in can
        assert "active_period" in can
        assert "carry_forward_label" in can
        assert "expiration_date" in can

    def test_get_can_funding_with_fiscal_year(self, auth_client: FlaskClient, test_can: CAN) -> None:
        response = auth_client.get(url_for("api.can-funding", id=test_can.id), query_string={"fiscal_year": 2023})
        assert response.status_code == 200
        data = response.json

        assert data["fiscal_year"] == 2023
        assert (
            data["funding"]["total_funding"]
            == data["funding"]["carry_forward_funding"] + data["funding"]["new_funding"]
        )

    def test_get_can_funding_defaults_fiscal_year(self, auth_client: FlaskClient, test_can: CAN) -> None:
        response = auth_client.get(url_for("api.can-funding", id=test_can.id))
        assert response.status_code == 200
        # fiscal_year should be set to current FY
        assert response.json["fiscal_year"] is not None

    def test_get_can_funding_not_found(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(url_for("api.can-funding", id=99999))
        assert response.status_code == 404

    def test_get_can_funding_by_fiscal_year_structure(self, auth_client: FlaskClient, test_can: CAN) -> None:
        response = auth_client.get(url_for("api.can-funding", id=test_can.id))
        assert response.status_code == 200
        for entry in response.json["funding_by_fiscal_year"]:
            assert "fiscal_year" in entry
            assert "amount" in entry
            assert isinstance(entry["fiscal_year"], int)
            assert isinstance(entry["amount"], (int, float))

    def test_get_can_funding_total_equals_new_plus_carry_forward(self, auth_client: FlaskClient, test_can: CAN) -> None:
        response = auth_client.get(url_for("api.can-funding", id=test_can.id), query_string={"fiscal_year": 2023})
        assert response.status_code == 200
        funding = response.json["funding"]
        assert funding["total_funding"] == funding["new_funding"] + funding["carry_forward_funding"]


class TestCANsFundingAggregateEndpoint:
    """Tests for GET /cans/funding/"""

    def test_get_cans_funding_aggregate(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(url_for("api.can-funding-aggregate"))
        assert response.status_code == 200
        data = response.json

        # Verify top-level structure
        assert "funding" in data
        assert "cans" in data

        # Verify funding sub-keys
        funding = data["funding"]
        assert "total_funding" in funding
        assert "available_funding" in funding
        assert isinstance(data["cans"], list)

    def test_get_cans_funding_aggregate_with_fiscal_year(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(url_for("api.can-funding-aggregate"), query_string={"fiscal_year": 2023})
        assert response.status_code == 200
        data = response.json
        assert data["fiscal_year"] == 2023
        assert len(data["cans"]) == 15  # Matches old endpoint test

    def test_get_cans_funding_aggregate_no_match(self, auth_client: FlaskClient, test_cans: list[Type[CAN]]) -> None:
        response = auth_client.get(url_for("api.can-funding-aggregate"), query_string={"fiscal_year": 2044})
        assert response.status_code == 200
        data = response.json
        assert len(data["cans"]) == 0
        assert data["funding"]["total_funding"] == 0.0

    def test_get_cans_funding_aggregate_transfer_filter(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fiscal_year": 2023, "transfer": ["DIRECT"]},
        )
        assert response.status_code == 200
        data = response.json
        assert len(data["cans"]) == 5
        assert data["funding"]["total_funding"] == 14420000.0

    def test_get_cans_funding_aggregate_invalid_transfer(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fiscal_year": 2023, "transfer": ["INVALID"]},
        )
        assert response.status_code == 400

    def test_get_cans_funding_aggregate_fy_budget_filter(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fy_budget": [0, 1000000]},
        )
        assert response.status_code == 200
        assert len(response.json["cans"]) == 6

    def test_get_cans_funding_aggregate_fy_budget_invalid(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fy_budget": [0]},
        )
        assert response.status_code == 400

    def test_get_cans_funding_aggregate_portfolio_filter(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fiscal_year": 2023, "portfolio": ["HMRF"]},
        )
        assert response.status_code == 200
        data = response.json
        assert data["funding"]["carry_forward_funding"] == 11140000
        assert data["funding"]["new_funding"] == 23420000
        assert data["funding"]["total_funding"] == 34560000

    def test_get_cans_funding_aggregate_can_detail_structure(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fiscal_year": 2023},
        )
        assert response.status_code == 200
        if len(response.json["cans"]) > 0:
            can = response.json["cans"][0]
            assert "id" in can
            assert "number" in can
            assert "portfolio_id" in can
            assert "active_period" in can
