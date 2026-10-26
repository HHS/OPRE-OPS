import runpy
from pathlib import Path

import pytest
from flask import Flask, request

from ops_api.ops import check_csrf
from ops_api.ops.auth.exceptions import NoAuthorizationError

PREVIEW_CONFIG = Path(__file__).parents[2] / "ops" / "environment" / "azure" / "preview.py"

FRONTEND_URL = "https://pr-12.ops.opre.acf.gov"
HOST_PREFIX = "opre-ops-pr12-app-backend."


def load_preview_config(monkeypatch, host_prefix=HOST_PREFIX):
    monkeypatch.setenv("OPS_FRONTEND_URL", FRONTEND_URL)
    monkeypatch.setenv("HOST_HEADER_PREFIX", host_prefix)
    return runpy.run_path(str(PREVIEW_CONFIG))


@pytest.fixture()
def preview_app(monkeypatch):
    app = Flask(__name__)
    config = load_preview_config(monkeypatch)
    app.config["OPS_FRONTEND_URL"] = config["OPS_FRONTEND_URL"]
    app.config["HOST_HEADER_PREFIX"] = config["HOST_HEADER_PREFIX"]
    return app


def run_check_csrf(app, host, referer):
    with app.test_request_context("/api/v1/agreements/", method="POST", headers={"Host": host, "Referer": referer}):
        check_csrf(app, request)


def test_preview_csrf_accepts_own_backend_and_frontend(preview_app):
    run_check_csrf(
        preview_app,
        host="opre-ops-pr12-app-backend.internal.eastus.azurecontainerapps.io:443",
        referer=f"{FRONTEND_URL}/agreements/create",
    )


def test_preview_csrf_rejects_another_prs_backend(preview_app):
    """PR 12's backend config rejects PR 123's backend Host (prefix delimiter: see test_api_helpers.py)."""
    with pytest.raises(NoAuthorizationError, match="HOST_HEADER_PREFIX"):
        run_check_csrf(
            preview_app,
            host="opre-ops-pr123-app-backend.internal.eastus.azurecontainerapps.io:443",
            referer=f"{FRONTEND_URL}/agreements",
        )


def test_preview_csrf_rejects_another_prs_frontend(preview_app):
    with pytest.raises(NoAuthorizationError, match="Referer"):
        run_check_csrf(
            preview_app,
            host="opre-ops-pr12-app-backend.internal.eastus.azurecontainerapps.io:443",
            referer="https://pr-123.ops.opre.acf.gov/agreements",
        )


def test_preview_config_is_fakeauth_only_and_redirects_to_its_own_frontend(monkeypatch):
    config = load_preview_config(monkeypatch)

    assert list(config["AUTHLIB_OAUTH_CLIENTS"]) == ["fakeauth"]
    assert config["AUTHLIB_OAUTH_CLIENTS"]["fakeauth"]["redirect_uri"] == f"{FRONTEND_URL}/login"


def test_preview_config_reuses_dev_fakeauth_client(monkeypatch):
    preview = load_preview_config(monkeypatch)["AUTHLIB_OAUTH_CLIENTS"]["fakeauth"]
    dev = runpy.run_path(str(PREVIEW_CONFIG.with_name("dev.py")))["AUTHLIB_OAUTH_CLIENTS"]["fakeauth"]

    assert {k: v for k, v in preview.items() if k != "redirect_uri"} == {
        k: v for k, v in dev.items() if k != "redirect_uri"
    }
