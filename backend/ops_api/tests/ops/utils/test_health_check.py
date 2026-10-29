import asyncio
from unittest.mock import Mock, patch

import pytest
from flask import Flask

from ops_api.ops.utils.health_check import check_auth_services


@pytest.fixture()
def auth_check_app():
    app = Flask(__name__)
    app.config["AUTHLIB_OAUTH_CLIENTS"] = {"hhsams": {"server_metadata_url": "https://sso.example.com/metadata"}}
    with app.app_context():
        yield app


def test_check_auth_services_skipped_when_disabled(auth_check_app):
    """Previews have no hhsams client; with the check off they report healthy without calling out."""
    auth_check_app.config["HEALTH_CHECK_AUTH_SERVICES"] = False
    del auth_check_app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]

    with patch("requests.get") as mock_get:
        resp = asyncio.run(check_auth_services())

    assert resp == {"status_code": None, "alarm_level": 0}
    mock_get.assert_not_called()


@pytest.mark.parametrize("status_code, alarm_level", [(200, 0), (503, 1)])
def test_check_auth_services_runs_when_enabled(auth_check_app, status_code, alarm_level):
    auth_check_app.config["HEALTH_CHECK_AUTH_SERVICES"] = True

    with patch("requests.get", return_value=Mock(status_code=status_code)) as mock_get:
        resp = asyncio.run(check_auth_services())

    mock_get.assert_called_once_with("https://sso.example.com/metadata", timeout=10)
    assert resp == {"status_code": status_code, "alarm_level": alarm_level}
