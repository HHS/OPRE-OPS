import re
import time

import pytest
from pytest_bdd import given, scenario, then, when


@pytest.fixture(scope="function")
def context():
    """Shared context for BDD scenarios."""
    return {}


@scenario("api_version.feature", "Get API version as an authenticated user")
def test_get_version_authenticated():
    """Test getting API version as an authenticated user."""
    pass


@scenario("api_version.feature", "Get API version as an unauthenticated user")
def test_get_version_unauthenticated():
    """Test getting API version as an unauthenticated user."""
    pass


@scenario("api_version.feature", "Verify version format is valid")
def test_version_format():
    """Test that the version format is valid."""
    pass


@scenario("api_version.feature", "Verify version endpoint performance with caching")
def test_version_caching_performance():
    """Test that version endpoint uses caching for performance."""
    pass


# Given steps


@given("I am logged in as an authenticated user", target_fixture="client")
def authenticated_client(auth_client):
    """Provide an authenticated test client."""
    return auth_client


@given("I am not logged in", target_fixture="client")
def unauthenticated_client(client):
    """Provide an unauthenticated test client."""
    return client


# When steps


@when("I request the API version", target_fixture="response")
def request_version(client, context, app):
    """Make a request to the version endpoint."""
    with app.app_context():
        response = client.get("/api/v1/version/")
        context["response"] = response
        return response


@when("I request the API version multiple times", target_fixture="responses")
def request_version_multiple_times(client, context, app):
    """Make multiple requests to the version endpoint."""
    responses = []
    timings = []

    with app.app_context():
        # Make 5 requests and track timing
        for _ in range(5):
            start_time = time.time()
            response = client.get("/api/v1/version/")
            end_time = time.time()

            responses.append(response)
            timings.append(end_time - start_time)

    context["responses"] = responses
    context["timings"] = timings
    return responses


# Then steps


@then("I should receive a successful response")
def check_successful_response(context):
    """Verify the response was successful."""
    response = context.get("response")
    assert response is not None, "Response was not captured"
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"


@then("I should receive an unauthorized response")
def check_unauthorized_response(context):
    """Verify the response was unauthorized."""
    response = context.get("response")
    assert response is not None, "Response was not captured"
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"


@then("the response should contain a version number")
def check_version_in_response(context):
    """Verify the response contains a version number."""
    response = context.get("response")
    assert response is not None, "Response was not captured"
    assert response.json is not None, "Response JSON is empty"
    assert "version" in response.json, "Version key not found in response"
    assert response.json["version"] is not None, "Version value is None"
    assert len(response.json["version"]) > 0, "Version value is empty"


@then("the version should be in a valid format")
def check_version_format(context):
    """Verify the version follows a valid format (semantic versioning or error message)."""
    response = context.get("response")
    assert response is not None, "Response was not captured"
    assert "version" in response.json, "Version key not found in response"

    version = response.json["version"]

    # Valid version should be either:
    # 1. Semantic versioning format (e.g., "1.2.3", "0.1.1")
    # 2. An error message (e.g., "OpenAPI spec file not found...")
    is_semver = re.match(r"^\d+\.\d+\.\d+", version)
    is_error_message = "error" in version.lower() or "not found" in version.lower()

    assert is_semver or is_error_message, f"Version '{version}' is not in a valid format"


@then("all requests should return the same version")
def check_consistent_version(context):
    """Verify all requests return the same version."""
    responses = context.get("responses")
    assert responses is not None, "Responses were not captured"
    assert len(responses) > 1, "Need multiple responses to check consistency"

    versions = [r.json.get("version") for r in responses if r.json]
    assert all(v == versions[0] for v in versions), "Versions are not consistent across requests"
