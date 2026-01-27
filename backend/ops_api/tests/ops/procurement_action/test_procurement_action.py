"""Tests for procurement action endpoints and service layer."""

import pytest
from flask import url_for
from sqlalchemy import select

from models import Agreement, BudgetLineItem, ProcurementAction, ProcurementShop
from models.procurement_action import AwardType, ProcurementActionStatus
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.services.procurement_actions import ProcurementActionService


@pytest.fixture
def test_procurement_action(loaded_db):
    """Create a test procurement action."""
    # Get an existing agreement and procurement shop from test data
    agreement = loaded_db.get(Agreement, 1)
    proc_shop = loaded_db.get(ProcurementShop, 1)

    procurement_action = ProcurementAction(
        agreement_id=agreement.id,
        procurement_shop_id=proc_shop.id if proc_shop else None,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED,
        psc_action_number="TEST-PA-001",
        action_description="Test procurement action for testing",
        award_total=100000.00,
    )

    loaded_db.add(procurement_action)
    loaded_db.commit()

    yield procurement_action

    # Cleanup
    loaded_db.delete(procurement_action)
    loaded_db.commit()


@pytest.fixture
def test_procurement_action_with_budget_lines(loaded_db, test_procurement_action):
    """Create test budget line items linked to procurement action."""
    bli_1 = loaded_db.get(BudgetLineItem, 15002)  # Use existing BLI from test data
    bli_2 = loaded_db.get(BudgetLineItem, 15003)

    if bli_1:
        bli_1.procurement_action_id = test_procurement_action.id
    if bli_2:
        bli_2.procurement_action_id = test_procurement_action.id

    loaded_db.commit()

    yield test_procurement_action

    # Cleanup
    if bli_1:
        bli_1.procurement_action_id = None
    if bli_2:
        bli_2.procurement_action_id = None
    loaded_db.commit()


# Service Layer Tests


def test_procurement_action_service_get(loaded_db, test_procurement_action, app_ctx):
    """Test ProcurementActionService.get() retrieves a procurement action by ID."""
    service = ProcurementActionService(loaded_db)

    procurement_action = service.get(test_procurement_action.id)

    assert procurement_action is not None
    assert procurement_action.id == test_procurement_action.id
    assert procurement_action.psc_action_number == "TEST-PA-001"
    assert procurement_action.agreement_id == test_procurement_action.agreement_id


def test_procurement_action_service_get_nonexistent(loaded_db, app_ctx):
    """Test ProcurementActionService.get() raises ResourceNotFoundError for invalid ID."""
    service = ProcurementActionService(loaded_db)

    with pytest.raises(ResourceNotFoundError):
        service.get(999999)


def test_procurement_action_service_get_list_no_filters(loaded_db, app_ctx):
    """Test ProcurementActionService.get_list() returns all procurement actions without filters."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list()

    assert isinstance(procurement_actions, list)
    assert metadata["count"] > 0


def test_procurement_action_service_get_list_by_agreement_id(loaded_db, test_procurement_action, app_ctx):
    """Test ProcurementActionService.get_list() filters by agreement_id."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list(agreement_id=[test_procurement_action.agreement_id])

    assert len(procurement_actions) > 0
    for pa in procurement_actions:
        assert pa.agreement_id == test_procurement_action.agreement_id


def test_procurement_action_service_get_list_by_status(loaded_db, app_ctx):
    """Test ProcurementActionService.get_list() filters by status."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list(status=["PLANNED"])

    for pa in procurement_actions:
        assert pa.status == ProcurementActionStatus.PLANNED


def test_procurement_action_service_get_list_by_award_type(loaded_db, app_ctx):
    """Test ProcurementActionService.get_list() filters by award_type."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list(award_type=["NEW_AWARD"])

    for pa in procurement_actions:
        assert pa.award_type == AwardType.NEW_AWARD


def test_procurement_action_service_get_list_by_procurement_shop_id(loaded_db, test_procurement_action, app_ctx):
    """Test ProcurementActionService.get_list() filters by procurement_shop_id."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list(procurement_shop_id=[test_procurement_action.procurement_shop_id])

    assert len(procurement_actions) > 0
    for pa in procurement_actions:
        assert pa.procurement_shop_id == test_procurement_action.procurement_shop_id


def test_procurement_action_service_get_list_by_budget_line_item_id(
    loaded_db, test_procurement_action_with_budget_lines, app_ctx
):
    """Test ProcurementActionService.get_list() filters by budget_line_item_id."""
    service = ProcurementActionService(loaded_db)

    # Get a budget line item linked to this procurement action
    bli = loaded_db.scalars(
        select(BudgetLineItem).where(
            BudgetLineItem.procurement_action_id == test_procurement_action_with_budget_lines.id
        )
    ).first()

    if bli:
        procurement_actions, metadata = service.get_list(budget_line_item_id=[bli.id])

        assert len(procurement_actions) > 0
        # Verify the procurement action is in the results
        pa_ids = [pa.id for pa in procurement_actions]
        assert test_procurement_action_with_budget_lines.id in pa_ids


def test_procurement_action_service_get_list_with_pagination(loaded_db, app_ctx):
    """Test ProcurementActionService.get_list() respects pagination parameters."""
    service = ProcurementActionService(loaded_db)

    # Get total count
    all_results, all_metadata = service.get_list()
    total_count = all_metadata["count"]

    # Get first page
    page1_results, page1_metadata = service.get_list(limit=2, offset=0)

    assert len(page1_results) <= 2
    assert page1_metadata["count"] == total_count

    if total_count > 2:
        # Get second page
        page2_results, page2_metadata = service.get_list(limit=2, offset=2)

        assert len(page2_results) <= 2
        assert page2_metadata["count"] == total_count

        # Ensure different results
        page1_ids = [pa.id for pa in page1_results]
        page2_ids = [pa.id for pa in page2_results]
        assert not set(page1_ids).intersection(set(page2_ids))


def test_procurement_action_service_get_list_invalid_status(loaded_db, app_ctx):
    """Test ProcurementActionService.get_list() handles invalid status gracefully."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list(status=["INVALID_STATUS"])

    assert len(procurement_actions) == 0
    assert metadata["count"] == 0


def test_procurement_action_service_get_list_invalid_award_type(loaded_db, app_ctx):
    """Test ProcurementActionService.get_list() handles invalid award_type gracefully."""
    service = ProcurementActionService(loaded_db)

    procurement_actions, metadata = service.get_list(award_type=["INVALID_TYPE"])

    assert len(procurement_actions) == 0
    assert metadata["count"] == 0


# API Endpoint Tests


def test_get_procurement_action_detail(auth_client, test_procurement_action, app_ctx):
    """Test GET /api/v1/procurement-actions/<id> returns procurement action details."""
    response = auth_client.get(f"/api/v1/procurement-actions/{test_procurement_action.id}")

    assert response.status_code == 200
    assert response.json["id"] == test_procurement_action.id
    assert response.json["psc_action_number"] == "TEST-PA-001"
    assert response.json["agreement_id"] == test_procurement_action.agreement_id

    # Check nested data
    assert "agreement" in response.json
    assert "procurement_shop" in response.json

    # Check computed properties
    assert "display_name" in response.json
    assert "is_modification" in response.json
    assert "budget_lines_total" in response.json


def test_get_procurement_action_detail_not_found(auth_client, app_ctx):
    """Test GET /api/v1/procurement-actions/<id> returns 404 for invalid ID."""
    response = auth_client.get("/api/v1/procurement-actions/999999")

    assert response.status_code == 404


def test_get_procurement_actions_list(auth_client, app_ctx):
    """Test GET /api/v1/procurement-actions/ returns list of procurement actions."""
    response = auth_client.get("/api/v1/procurement-actions/")

    assert response.status_code == 200
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json
    assert isinstance(response.json["data"], list)
    assert response.json["count"] > 0


def test_get_procurement_actions_list_filter_by_agreement_id(auth_client, test_procurement_action, app_ctx):
    """Test GET /api/v1/procurement-actions/ filters by agreement_id."""
    response = auth_client.get(
        url_for("api.procurement-actions-group"),
        query_string={"agreement_id": test_procurement_action.agreement_id},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) > 0
    for pa in response.json["data"]:
        assert pa["agreement_id"] == test_procurement_action.agreement_id


def test_get_procurement_actions_list_filter_by_status(auth_client, app_ctx):
    """Test GET /api/v1/procurement-actions/ filters by status."""
    response = auth_client.get(
        url_for("api.procurement-actions-group"),
        query_string={"status": "PLANNED"},
    )

    assert response.status_code == 200
    for pa in response.json["data"]:
        assert pa["status"] == "PLANNED"


def test_get_procurement_actions_list_filter_by_award_type(auth_client, app_ctx):
    """Test GET /api/v1/procurement-actions/ filters by award_type."""
    response = auth_client.get(
        url_for("api.procurement-actions-group"),
        query_string={"award_type": "NEW_AWARD"},
    )

    assert response.status_code == 200
    for pa in response.json["data"]:
        assert pa["award_type"] == "NEW_AWARD"


def test_get_procurement_actions_list_filter_by_procurement_shop_id(auth_client, test_procurement_action, app_ctx):
    """Test GET /api/v1/procurement-actions/ filters by procurement_shop_id."""
    response = auth_client.get(
        url_for("api.procurement-actions-group"),
        query_string={"procurement_shop_id": test_procurement_action.procurement_shop_id},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) > 0
    for pa in response.json["data"]:
        assert pa["procurement_shop_id"] == test_procurement_action.procurement_shop_id


def test_get_procurement_actions_list_with_pagination(auth_client, app_ctx):
    """Test GET /api/v1/procurement-actions/ supports pagination."""
    # Get first page
    response1 = auth_client.get(
        url_for("api.procurement-actions-group"),
        query_string={"limit": 2, "offset": 0},
    )

    assert response1.status_code == 200
    assert len(response1.json["data"]) <= 2
    assert response1.json["limit"] == 2
    assert response1.json["offset"] == 0

    total_count = response1.json["count"]

    if total_count > 2:
        # Get second page
        response2 = auth_client.get(
            url_for("api.procurement-actions-group"),
            query_string={"limit": 2, "offset": 2},
        )

        assert response2.status_code == 200
        assert len(response2.json["data"]) <= 2
        assert response2.json["limit"] == 2
        assert response2.json["offset"] == 2

        # Ensure different results
        page1_ids = [pa["id"] for pa in response1.json["data"]]
        page2_ids = [pa["id"] for pa in response2.json["data"]]
        assert not set(page1_ids).intersection(set(page2_ids))


def test_get_procurement_actions_list_multiple_filters(auth_client, test_procurement_action, app_ctx):
    """Test GET /api/v1/procurement-actions/ with multiple filters combined."""
    response = auth_client.get(
        url_for("api.procurement-actions-group"),
        query_string={
            "agreement_id": test_procurement_action.agreement_id,
            "status": "PLANNED",
            "procurement_shop_id": test_procurement_action.procurement_shop_id,
        },
    )

    assert response.status_code == 200
    for pa in response.json["data"]:
        assert pa["agreement_id"] == test_procurement_action.agreement_id
        assert pa["status"] == "PLANNED"
        assert pa["procurement_shop_id"] == test_procurement_action.procurement_shop_id


def test_get_procurement_action_detail_schema_structure(auth_client, test_procurement_action, app_ctx):
    """Test GET /api/v1/procurement-actions/{id} returns proper schema structure."""
    response = auth_client.get(f"/api/v1/procurement-actions/{test_procurement_action.id}")

    assert response.status_code == 200

    # Required fields
    assert "id" in response.json
    assert "agreement_id" in response.json
    assert "display_name" in response.json
    assert "is_modification" in response.json

    # Nested objects
    assert "agreement" in response.json
    if response.json["agreement"]:
        assert "id" in response.json["agreement"]
        assert "name" in response.json["agreement"]

    # Optional fields that may be null
    assert "procurement_shop_id" in response.json
    assert "award_type" in response.json
    assert "status" in response.json

    # Computed fields
    assert "budget_lines_total" in response.json
    assert "totals_match" in response.json


def test_get_procurement_actions_list_response_lighter_schema(auth_client, app_ctx):
    """Test GET /api/v1/procurement-actions/ uses lighter schema than detail endpoint."""
    # Get list response
    list_response = auth_client.get("/api/v1/procurement-actions/")
    assert list_response.status_code == 200

    if len(list_response.json["data"]) > 0:
        list_item = list_response.json["data"][0]

        # Get detail response for same item
        detail_response = auth_client.get(f"/api/v1/procurement-actions/{list_item['id']}")
        assert detail_response.status_code == 200
        detail_item = detail_response.json

        # List schema should have fewer fields than detail schema
        # Detail has requisitions and full budget_line_items
        assert "requisitions" in detail_item

        # List has budget_line_items with IDs only
        if "budget_line_items" in list_item and list_item["budget_line_items"]:
            # Check that list item has minimal budget line info
            assert isinstance(list_item["budget_line_items"], list)


def test_procurement_action_requires_authentication(client, app_ctx):
    """Test that procurement action endpoints require authentication."""
    # Test detail endpoint
    response = client.get("/api/v1/procurement-actions/1")
    assert response.status_code == 401

    # Test list endpoint
    response = client.get("/api/v1/procurement-actions/")
    assert response.status_code == 401
