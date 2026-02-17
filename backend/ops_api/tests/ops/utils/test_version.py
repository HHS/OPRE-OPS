from unittest.mock import mock_open, patch

import pytest

from ops_api.ops.utils.version import VersionAPI, _load_api_version


@pytest.fixture(autouse=True)
def reset_cache():
    """Reset the cached version before each test."""
    import ops_api.ops.utils.version as version_module

    version_module._CACHED_VERSION = None
    yield
    version_module._CACHED_VERSION = None


def test_version_api_returns_version_from_openapi_yml(app):
    """Test that VersionAPI returns the version from openapi.yml."""
    openapi_content = """
openapi: 3.1.0
info:
  title: Test API
  version: 0.1.1
"""
    with app.app_context():
        with patch("builtins.open", mock_open(read_data=openapi_content)):
            api = VersionAPI()
            result = api.get()

            assert result.json is not None
            assert "version" in result.json
            assert result.json["version"] == "0.1.1"


def test_version_caching():
    """Test that the version is cached after the first read."""
    openapi_content = """
openapi: 3.1.0
info:
  title: Test API
  version: 1.2.3
"""

    with patch("builtins.open", mock_open(read_data=openapi_content)) as mock_file:
        # First call should read the file
        version1 = _load_api_version()
        assert version1 == "1.2.3"
        assert mock_file.call_count == 1

        # Second call should use cache, not read file again
        version2 = _load_api_version()
        assert version2 == "1.2.3"
        assert mock_file.call_count == 1  # Still only called once


def test_version_api_handles_missing_openapi_file():
    """Test that VersionAPI handles missing openapi.yml file gracefully."""
    with patch("builtins.open", side_effect=FileNotFoundError()):
        version = _load_api_version()
        assert "not found" in version.lower()


def test_version_api_handles_yaml_parse_error():
    """Test that VersionAPI handles YAML parse errors gracefully."""
    with patch("builtins.open", mock_open(read_data="invalid: yaml: content: [")):
        version = _load_api_version()
        assert "error" in version.lower()


def test_version_api_handles_missing_version_in_openapi():
    """Test that VersionAPI handles missing version field in openapi.yml."""
    openapi_content = """
openapi: 3.1.0
info:
  title: Test API
"""

    with patch("builtins.open", mock_open(read_data=openapi_content)):
        version = _load_api_version()
        assert version == "Unknown"


def test_version_api_handles_missing_info_section():
    """Test that VersionAPI handles missing info section in openapi.yml."""
    openapi_content = """
openapi: 3.1.0
paths: {}
"""

    with patch("builtins.open", mock_open(read_data=openapi_content)):
        version = _load_api_version()
        assert version == "Unknown"


def test_version_endpoint_integration(auth_client):
    """Integration test for the /version/ endpoint."""
    openapi_content = """
openapi: 3.1.0
info:
  title: Test API
  version: 0.1.1
"""
    with patch("builtins.open", mock_open(read_data=openapi_content)):
        response = auth_client.get("/api/v1/version/")
        assert response.status_code == 200
        assert "version" in response.json
        assert response.json["version"] == "0.1.1"


def test_version_endpoint_multiple_calls_use_cache(auth_client):
    """Test that multiple calls to the endpoint use cached version."""
    openapi_content = """
openapi: 3.1.0
info:
  title: Test API
  version: 9.9.9
"""

    with patch("builtins.open", mock_open(read_data=openapi_content)) as mock_file:
        # First request
        response1 = auth_client.get("/api/v1/version/")
        call_count_after_first = mock_file.call_count

        # Second request - should not open file again
        response2 = auth_client.get("/api/v1/version/")
        call_count_after_second = mock_file.call_count

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json["version"] == response2.json["version"]
        # File should only be opened once despite multiple requests
        assert call_count_after_second == call_count_after_first


def test_get_api_version_static_method():
    """Test that get_api_version can be called as a static method."""
    openapi_content = """
openapi: 3.1.0
info:
  title: Test API
  version: 5.5.5
"""

    with patch("builtins.open", mock_open(read_data=openapi_content)):
        version = VersionAPI.get_api_version()
        assert version == "5.5.5"
