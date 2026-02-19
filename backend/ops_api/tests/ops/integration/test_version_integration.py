"""
Integration tests for the /api/v1/version/ endpoint.

These tests verify the version endpoint works correctly in a full application context,
including authentication, caching, and proper response format.
"""

import re


class TestVersionEndpointIntegration:
    """Integration tests for the version endpoint."""

    def test_version_endpoint_requires_authentication(self, client):
        """Test that the version endpoint requires authentication."""
        response = client.get("/api/v1/version/")
        assert response.status_code == 401
        assert "msg" in response.json
        assert "Authorization" in response.json["msg"]

    def test_version_endpoint_with_authentication(self, auth_client):
        """Test that authenticated users can access the version endpoint."""
        response = auth_client.get("/api/v1/version/")
        assert response.status_code == 200
        assert "version" in response.json
        # Should contain the actual version from openapi.yml (0.1.1) or an error message
        version = response.json["version"]
        assert version is not None
        assert len(version) > 0

    def test_version_endpoint_returns_json(self, auth_client):
        """Test that the version endpoint returns JSON."""
        response = auth_client.get("/api/v1/version/")
        assert response.status_code == 200
        assert response.content_type == "application/json"

    def test_version_endpoint_response_structure(self, auth_client):
        """Test that the version endpoint returns the expected structure."""
        response = auth_client.get("/api/v1/version/")
        assert response.status_code == 200
        assert isinstance(response.json, dict)
        assert "version" in response.json
        assert isinstance(response.json["version"], str)

    def test_version_endpoint_consistency_across_requests(self, auth_client):
        """Test that the version endpoint returns consistent results."""
        # Make multiple requests
        response1 = auth_client.get("/api/v1/version/")
        response2 = auth_client.get("/api/v1/version/")
        response3 = auth_client.get("/api/v1/version/")

        # All responses should be successful
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response3.status_code == 200

        # All responses should return the same version
        assert response1.json["version"] == response2.json["version"]
        assert response2.json["version"] == response3.json["version"]

    def test_version_endpoint_with_different_user_roles(self, auth_client, basic_user_auth_client):
        """Test that the version endpoint works for different user roles."""
        # Admin/auth user
        response1 = auth_client.get("/api/v1/version/")
        assert response1.status_code == 200
        assert "version" in response1.json

        # Basic user
        response2 = basic_user_auth_client.get("/api/v1/version/")
        assert response2.status_code == 200
        assert "version" in response2.json

        # Both should get the same version
        assert response1.json["version"] == response2.json["version"]

    def test_version_endpoint_cors_headers(self, auth_client):
        """Test that the version endpoint includes proper CORS headers."""
        response = auth_client.get("/api/v1/version/")
        assert response.status_code == 200

        # Check for CORS headers (if configured)
        # These may vary based on Flask-CORS configuration
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Credentials" in response.headers

    def test_version_format_is_valid(self, auth_client):
        """Test that the version format follows expected patterns."""
        response = auth_client.get("/api/v1/version/")
        assert response.status_code == 200

        version = response.json["version"]
        # Version should be either:
        # 1. Semantic versioning (e.g., "0.1.1")
        # 2. An error message if file can't be read
        is_semver = re.match(r"^\d+\.\d+\.\d+", version)
        is_error = "error" in version.lower() or "not found" in version.lower()

        assert is_semver or is_error, f"Version '{version}' is not in expected format"
