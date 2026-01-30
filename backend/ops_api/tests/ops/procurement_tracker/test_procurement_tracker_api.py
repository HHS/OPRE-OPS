"""Tests for procurement tracker API endpoints."""


def test_get_procurement_tracker_by_id(auth_client, app_ctx):
    """Test retrieving a single procurement tracker by ID."""
    response = auth_client.get("/api/v1/procurement-trackers/1")
    assert response.status_code == 200

    data = response.json
    assert data["id"] == 1
    assert data["agreement_id"] == 13
    assert data["status"] == "ACTIVE"
    assert data["tracker_type"] == "DEFAULT"
    assert data["active_step_number"] == 1
    assert data["procurement_action"] == 100

    # Verify steps are included
    assert "steps" in data
    assert len(data["steps"]) == 6

    # Verify step 1 is ACQUISITION_PLANNING with extra fields
    step_1 = data["steps"][0]
    assert step_1["step_number"] == 1
    assert step_1["step_type"] == "ACQUISITION_PLANNING"
    assert step_1["status"] == "PENDING"
    assert "task_completed_by" in step_1
    assert "date_completed" in step_1
    assert "notes" in step_1

    # Verify step 2 is PRE_SOLICITATION without extra fields
    step_2 = data["steps"][1]
    assert step_2["step_number"] == 2
    assert step_2["step_type"] == "PRE_SOLICITATION"
    assert step_2["status"] == "PENDING"
    assert "task_completed_by" not in step_2
    assert "date_completed" not in step_2
    assert "notes" not in step_2


def test_get_procurement_tracker_by_id_not_found(auth_client, app_ctx):
    """Test retrieving a non-existent procurement tracker returns 404."""
    response = auth_client.get("/api/v1/procurement-trackers/9999")
    assert response.status_code == 404


def test_get_procurement_trackers_list(auth_client, app_ctx):
    """Test retrieving list of procurement trackers."""
    response = auth_client.get("/api/v1/procurement-trackers/")
    assert response.status_code == 200

    # Verify response structure
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json

    # Verify pagination metadata
    assert isinstance(response.json["count"], int)
    assert response.json["count"] >= len(response.json["data"])
    assert response.json["limit"] == 10
    assert response.json["offset"] == 0

    # Verify data
    data = response.json["data"]
    assert len(data) == 2
    assert data[0]["id"] == 1
    assert data[1]["id"] == 2

    # Verify steps are included in list response
    assert "steps" in data[0]
    assert len(data[0]["steps"]) == 6


def test_get_procurement_trackers_list_with_pagination(auth_client, app_ctx):
    """Test pagination parameters work correctly."""
    # Get first tracker only
    response = auth_client.get("/api/v1/procurement-trackers/?limit=1&offset=0")
    assert response.status_code == 200
    assert isinstance(response.json["count"], int)
    assert response.json["count"] >= len(response.json["data"])
    assert response.json["limit"] == 1
    assert response.json["offset"] == 0
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 1

    # Get second tracker only
    response = auth_client.get("/api/v1/procurement-trackers/?limit=1&offset=1")
    assert response.status_code == 200
    assert response.json["count"] == 2
    assert response.json["limit"] == 1
    assert response.json["offset"] == 1
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 2


def test_get_procurement_trackers_list_filter_by_agreement_id(auth_client, app_ctx):
    """Test filtering procurement trackers by agreement_id."""
    # Filter by agreement 13 (should return tracker 1)
    response = auth_client.get("/api/v1/procurement-trackers/?agreement_id=13")
    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 1
    assert response.json["data"][0]["agreement_id"] == 13

    # Filter by agreement 14 (should return tracker 2)
    response = auth_client.get("/api/v1/procurement-trackers/?agreement_id=14")
    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 2
    assert response.json["data"][0]["agreement_id"] == 14

    # Filter by non-existent agreement (should return empty list)
    response = auth_client.get("/api/v1/procurement-trackers/?agreement_id=9999")
    assert response.status_code == 200
    assert response.json["count"] == 0
    assert len(response.json["data"]) == 0


def test_get_procurement_trackers_list_filter_by_multiple_agreement_ids(auth_client, app_ctx):
    """Test filtering by multiple agreement IDs."""
    response = auth_client.get("/api/v1/procurement-trackers/?agreement_id=13&agreement_id=14")
    assert response.status_code == 200
    assert response.json["count"] == 2
    assert len(response.json["data"]) == 2


def test_get_procurement_trackers_list_pagination_limits(auth_client, app_ctx):
    """Test pagination limit validation."""
    # Valid limit
    response = auth_client.get("/api/v1/procurement-trackers/?limit=50")
    assert response.status_code == 200

    # Limit too high should fail
    response = auth_client.get("/api/v1/procurement-trackers/?limit=51")
    assert response.status_code == 400

    # Limit too low should fail
    response = auth_client.get("/api/v1/procurement-trackers/?limit=0")
    assert response.status_code == 400


def test_get_procurement_trackers_list_offset_validation(auth_client, app_ctx):
    """Test offset validation."""
    # Valid offset
    response = auth_client.get("/api/v1/procurement-trackers/?offset=0")
    assert response.status_code == 200

    # Negative offset should fail
    response = auth_client.get("/api/v1/procurement-trackers/?offset=-1")
    assert response.status_code == 400


def test_get_procurement_tracker_steps_ordering(auth_client, app_ctx):
    """Test that steps are returned in correct order by step_number."""
    response = auth_client.get("/api/v1/procurement-trackers/1")
    assert response.status_code == 200

    steps = response.json["steps"]
    assert len(steps) == 6

    # Verify all step types are present in correct order
    expected_step_types = [
        "ACQUISITION_PLANNING",
        "PRE_SOLICITATION",
        "SOLICITATION",
        "EVALUATION",
        "PRE_AWARD",
        "AWARD",
    ]

    for i, expected_type in enumerate(expected_step_types):
        assert steps[i]["step_number"] == i + 1
        assert steps[i]["step_type"] == expected_type


def test_get_procurement_tracker_unauthorized(client, app_ctx):
    """Test that unauthorized requests are rejected."""
    response = client.get("/api/v1/procurement-trackers/1")
    assert response.status_code == 401


def test_get_procurement_trackers_list_unauthorized(client, app_ctx):
    """Test that unauthorized list requests are rejected."""
    response = client.get("/api/v1/procurement-trackers/")
    assert response.status_code == 401


def test_get_procurement_tracker_all_step_fields(auth_client, app_ctx):
    """Test that all expected fields are present in steps."""
    response = auth_client.get("/api/v1/procurement-trackers/1")
    assert response.status_code == 200

    steps = response.json["steps"]

    # Check common fields in all steps
    for step in steps:
        assert "id" in step
        assert "procurement_tracker_id" in step
        assert "step_number" in step
        assert "step_type" in step
        assert "status" in step
        assert "step_start_date" in step
        assert "step_completed_date" in step

    # ACQUISITION_PLANNING step should have extra fields
    acquisition_step = steps[0]
    assert acquisition_step["step_type"] == "ACQUISITION_PLANNING"
    assert "task_completed_by" in acquisition_step
    assert "date_completed" in acquisition_step
    assert "notes" in acquisition_step

    # Other steps should NOT have extra fields
    for step in steps[1:]:
        assert "task_completed_by" not in step
        assert "date_completed" not in step
        assert "notes" not in step


def test_get_procurement_tracker_response_structure(auth_client, app_ctx):
    """Test that the response has all expected top-level fields."""
    response = auth_client.get("/api/v1/procurement-trackers/1")
    assert response.status_code == 200

    data = response.json
    expected_fields = [
        "id",
        "agreement_id",
        "status",
        "procurement_action",
        "tracker_type",
        "active_step_number",
        "steps",
    ]

    for field in expected_fields:
        assert field in data, f"Expected field '{field}' not found in response"
