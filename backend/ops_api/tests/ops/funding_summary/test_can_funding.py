"""Tests for the new /cans/<id>/funding/ and /cans/funding/ endpoints."""

from typing import Type

import pytest
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

    def test_get_can_funding_no_fiscal_year_returns_all(self, auth_client: FlaskClient, test_can: CAN) -> None:
        response = auth_client.get(url_for("api.can-funding", id=test_can.id))
        assert response.status_code == 200
        # When no fiscal_year is provided, it should be None (returns all FY data)
        assert response.json["fiscal_year"] is None

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

    def test_get_cans_funding_aggregate_fy_budget_reversed_bounds(self, auth_client: FlaskClient) -> None:
        """fy_budget with min > max should be normalized and still return results."""
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fy_budget": [1000000, 0]},
        )
        assert response.status_code == 200
        # Same as [0, 1000000] after normalization
        normal_response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fy_budget": [0, 1000000]},
        )
        assert len(response.json["cans"]) == len(normal_response.json["cans"])

    def test_get_cans_funding_aggregate_fy_budget_three_values(self, auth_client: FlaskClient) -> None:
        """fy_budget with wrong number of values should return 400."""
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"fy_budget": [0, 500000, 1000000]},
        )
        assert response.status_code == 400


class TestCANFundingErrorCases:
    """Tests for error handling and edge cases."""

    def test_get_can_funding_invalid_id(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(url_for("api.can-funding", id=99999))
        assert response.status_code == 404

    def test_get_can_funding_invalid_fiscal_year_type(self, auth_client: FlaskClient, test_can: CAN) -> None:
        """Non-numeric fiscal_year should fail schema validation."""
        response = auth_client.get(
            url_for("api.can-funding", id=test_can.id),
            query_string={"fiscal_year": "not_a_number"},
        )
        assert response.status_code == 400

    def test_get_cans_funding_aggregate_invalid_transfer_value(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"transfer": ["NONEXISTENT"]},
        )
        assert response.status_code == 400

    def test_get_cans_funding_aggregate_multiple_invalid_transfers(self, auth_client: FlaskClient) -> None:
        response = auth_client.get(
            url_for("api.can-funding-aggregate"),
            query_string={"transfer": ["DIRECT", "INVALID"]},
        )
        assert response.status_code == 400


class TestCANFundingAuthorization:
    """Tests for authorization on funding endpoints."""

    def test_can_funding_requires_auth(self, client: FlaskClient) -> None:
        """Unauthenticated requests should be rejected."""
        response = client.get(url_for("api.can-funding", id=500))
        assert response.status_code in (401, 422)

    def test_cans_funding_aggregate_requires_auth(self, client: FlaskClient) -> None:
        """Unauthenticated requests should be rejected."""
        response = client.get(url_for("api.can-funding-aggregate"))
        assert response.status_code in (401, 422)


class TestCANListPaginationEdgeCases:
    """Tests for pagination edge cases on the CAN list endpoint."""

    def test_can_list_offset_beyond_total(self, auth_client: FlaskClient) -> None:
        """Offset beyond total count should return empty data."""
        response = auth_client.get(
            url_for("api.can-group"),
            query_string={"limit": 10, "offset": 99999},
        )
        assert response.status_code == 200
        assert response.json["data"] == []
        assert response.json["count"] > 0  # total count is still accurate

    def test_can_list_limit_zero_rejected(self, auth_client: FlaskClient) -> None:
        """Limit of 0 should be rejected by schema validation (min is 1)."""
        response = auth_client.get(
            url_for("api.can-group"),
            query_string={"limit": 0, "offset": 0},
        )
        assert response.status_code == 400

    @pytest.mark.parametrize("limit,offset", [(10, 0), (5, 5), (1, 0)])
    def test_can_list_pagination_metadata(self, auth_client: FlaskClient, limit: int, offset: int) -> None:
        """Pagination metadata should reflect requested limit and offset."""
        response = auth_client.get(
            url_for("api.can-group"),
            query_string={"limit": limit, "offset": offset},
        )
        assert response.status_code == 200
        assert response.json["limit"] == limit
        assert response.json["offset"] == offset
        assert len(response.json["data"]) <= limit
