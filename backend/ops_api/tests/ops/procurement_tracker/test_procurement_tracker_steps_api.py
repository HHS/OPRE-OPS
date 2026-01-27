"""Tests for procurement tracker API endpoints."""

import pytest


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_step_by_id(auth_client):
    """Test retrieving a single procurement tracker step by ID."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 200

    data = response.json
    assert data["procurement_tracker_id"] == 1
    assert data["step_number"] == 1
    assert data["status"] == "PENDING"
    assert data["step_type"] == "ACQUISITION_PLANNING"
    assert data["step_class"] == "default_step"
    assert data["task_completed_by"] is None
    assert data["date_completed"] is None
    assert data["notes"] is None


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_step_by_id_not_found(auth_client):
    """Test retrieving a non-existent procurement tracker steps returns 404."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/9999")
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list(auth_client):
    """Test retrieving list of procurement tracker steps."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/")
    assert response.status_code == 200

    # Verify response structure
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json

    # Verify pagination metadata
    # Verify data
    data = response.json["data"]
    assert len(data) == 10
    # Verify pagination metadata (without relying on a global, environment-dependent count)
    assert isinstance(response.json["count"], int)
    assert response.json["count"] >= len(data)
    assert response.json["limit"] == 10
    assert response.json["offset"] == 0

    # Verify data
    data = response.json["data"]
    assert len(data) == 10
    assert data[0]["id"] == 1
    assert data[0]["procurement_tracker_id"] == 1
    assert data[0]["step_number"] == 1
    assert data[1]["id"] == 2
    assert data[1]["procurement_tracker_id"] == 1
    assert data[1]["step_number"] == 2
    assert data[2]["id"] == 3
    assert data[2]["procurement_tracker_id"] == 1
    assert data[2]["step_number"] == 3
    assert data[3]["id"] == 4
    assert data[3]["procurement_tracker_id"] == 1
    assert data[3]["step_number"] == 4
    assert data[4]["id"] == 5
    assert data[4]["procurement_tracker_id"] == 1
    assert data[4]["step_number"] == 5
    assert data[5]["id"] == 6
    assert data[5]["procurement_tracker_id"] == 1
    assert data[5]["step_number"] == 6
    assert data[6]["id"] == 7
    assert data[6]["procurement_tracker_id"] == 2
    assert data[6]["step_number"] == 1
    assert data[7]["id"] == 8
    assert data[7]["procurement_tracker_id"] == 2
    assert data[7]["step_number"] == 2


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list_with_pagination(auth_client):
    """Test pagination parameters work correctly."""
    # Get first tracker only
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=1&offset=0")
    assert response.status_code == 200
    # Verify data
    data = response.json["data"]
    assert len(data) == 1
    # Verify pagination metadata (without relying on a global, environment-dependent count)
    assert isinstance(response.json["count"], int)
    assert response.json["count"] >= len(data)
    assert response.json["limit"] == 1
    assert response.json["offset"] == 0
    assert response.json["data"][0]["id"] == 1
    assert response.json["data"][0]["procurement_tracker_id"] == 1
    assert response.json["data"][0]["step_number"] == 1

    # Get second tracker only
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=1&offset=1")
    assert response.status_code == 200
    data = response.json["data"]
    assert len(data) == 1
    assert response.json["count"] >= len(data)
    assert response.json["limit"] == 1
    assert response.json["offset"] == 1
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 2
    assert response.json["data"][0]["procurement_tracker_id"] == 1
    assert response.json["data"][0]["step_number"] == 2


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list_filter_by_procurement_tracker_id(auth_client):
    """Test filtering procurement tracker steps by procurement_tracker_id."""
    # Filter by agreement 13 (should return steps id 1-6)
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=13")
    assert response.status_code == 200
    assert response.json["count"] == 6
    assert len(response.json["data"]) == 6
    assert response.json["data"][0]["id"] == 1
    assert response.json["data"][0]["step_number"] == 1
    assert response.json["data"][0]["procurement_tracker_id"] == 1

    # Filter by agreement 14 (should return tracker steps id 7-12)
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=14")
    assert response.status_code == 200
    assert response.json["count"] == 6
    assert len(response.json["data"]) == 6
    assert response.json["data"][0]["id"] == 7
    assert response.json["data"][0]["procurement_tracker_id"] == 2
    assert response.json["data"][0]["step_number"] == 1

    # Filter by non-existent agreement (should return empty list)
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=9999")
    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list_filter_by_multiple_agreement_ids(auth_client):
    """Test filtering by multiple agreement IDs."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/?agreement_id=13&agreement_id=14")
    assert response.status_code == 200
    assert response.json["count"] == 12
    assert len(response.json["data"]) == 10


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list_pagination_limits(auth_client):
    """Test pagination limit validation."""
    # Valid limit
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=50")
    assert response.status_code == 200

    # Limit too high should fail
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=51")
    assert response.status_code == 400

    # Limit too low should fail
    response = auth_client.get("/api/v1/procurement-tracker-steps/?limit=0")
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list_offset_validation(auth_client):
    """Test offset validation."""
    # Valid offset
    response = auth_client.get("/api/v1/procurement-tracker-steps/?offset=0")
    assert response.status_code == 200

    # Negative offset should fail
    response = auth_client.get("/api/v1/procurement-tracker-steps/?offset=-1")
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_step_unauthorized(client):
    """Test that unauthorized requests are rejected."""
    response = client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_steps_list_unauthorized(client):
    """Test that unauthorized list requests are rejected."""
    response = client.get("/api/v1/procurement-tracker-steps/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_procurement_tracker_step_response_structure(auth_client):
    """Test that the response has all expected top-level fields."""
    response = auth_client.get("/api/v1/procurement-tracker-steps/1")
    assert response.status_code == 200

    data = response.json
    expected_fields = [
        "id",
        "procurement_tracker_id",
        "step_number",
        "step_class",
        "step_type",
        "status",
    ]

    for field in expected_fields:
        assert field in data, f"Expected field '{field}' not found in response"


def test_update_procurement_tracker_step_by_id(auth_client, app_ctx, loaded_db):
    """Test updating a procurement tracker step by ID."""
    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": "2024-01-15",
        "notes": "Step completed successfully.",
    }
    response = auth_client.patch("/api/v1/procurement-tracker-steps/1", json=update_data)
    assert response.status_code == 200

    data = response.json
    assert data["id"] == 1
    assert data["procurement_tracker_id"] == 1
    assert data["step_number"] == 1
    assert data["status"] == "COMPLETED"
    assert data["task_completed_by"] == 500
    assert data["date_completed"] == "2024-01-15"
    assert data["notes"] == "Step completed successfully."
