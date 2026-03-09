"""Tests for the /lookups/ namespace endpoints.

Covers:
  Group A - Authenticated positive tests (5 tests)
  Group B - Unauthenticated 401 tests (5 tests)
  Group C - Old URL 404 tests (5 tests)
"""

from models.agreements import AgreementReason, AgreementType
from models.projects import ResearchType

# ---------------------------------------------------------------------------
# Group A — Authenticated positive tests
# ---------------------------------------------------------------------------


def test_get_lookup_agreement_types(auth_client, app_ctx):
    """GET /api/v1/lookups/agreement-types/ returns 200 with a list of AgreementType names."""
    response = auth_client.get("/api/v1/lookups/agreement-types/")
    assert response.status_code == 200
    assert isinstance(response.json, list)
    expected_names = [e.name for e in AgreementType]
    for name in expected_names:
        assert name in response.json


def test_get_lookup_agreement_reasons(auth_client, app_ctx):
    """GET /api/v1/lookups/agreement-reasons/ returns 200 with a list of AgreementReason names."""
    response = auth_client.get("/api/v1/lookups/agreement-reasons/")
    assert response.status_code == 200
    assert isinstance(response.json, list)
    expected_names = [e.name for e in AgreementReason]
    for name in expected_names:
        assert name in response.json


def test_get_lookup_research_types(auth_client, app_ctx):
    """GET /api/v1/lookups/research-types/ returns 200 with a dict of ResearchType enum names/values."""
    response = auth_client.get("/api/v1/lookups/research-types/")
    assert response.status_code == 200
    assert response.json == {e.name: e.value for e in ResearchType}


def test_get_lookup_portfolio_status_list(auth_client, app_ctx):
    """GET /api/v1/lookups/portfolio-status/ returns 200 with a list of length 3."""
    response = auth_client.get("/api/v1/lookups/portfolio-status/")
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 3


def test_get_lookup_portfolio_status_by_id(auth_client, app_ctx):
    """GET /api/v1/lookups/portfolio-status/1 returns 200 with value 'IN_PROCESS'."""
    response = auth_client.get("/api/v1/lookups/portfolio-status/1")
    assert response.status_code == 200
    assert response.json == "IN_PROCESS"


# ---------------------------------------------------------------------------
# Group B — Unauthenticated 401 tests
# ---------------------------------------------------------------------------


def test_get_lookup_agreement_types_unauthenticated(client, app_ctx):
    """GET /api/v1/lookups/agreement-types/ without auth returns 401."""
    response = client.get("/api/v1/lookups/agreement-types/")
    assert response.status_code == 401


def test_get_lookup_agreement_reasons_unauthenticated(client, app_ctx):
    """GET /api/v1/lookups/agreement-reasons/ without auth returns 401."""
    response = client.get("/api/v1/lookups/agreement-reasons/")
    assert response.status_code == 401


def test_get_lookup_research_types_unauthenticated(client, app_ctx):
    """GET /api/v1/lookups/research-types/ without auth returns 401."""
    response = client.get("/api/v1/lookups/research-types/")
    assert response.status_code == 401


def test_get_lookup_portfolio_status_list_unauthenticated(client, app_ctx):
    """GET /api/v1/lookups/portfolio-status/ without auth returns 401."""
    response = client.get("/api/v1/lookups/portfolio-status/")
    assert response.status_code == 401


def test_get_lookup_portfolio_status_by_id_unauthenticated(client, app_ctx):
    """GET /api/v1/lookups/portfolio-status/1 without auth returns 401."""
    response = client.get("/api/v1/lookups/portfolio-status/1")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Group C — Old URL 404 tests
# ---------------------------------------------------------------------------


def test_old_agreement_types_url_returns_404(auth_client, app_ctx):
    """GET /api/v1/agreement-types/ (old URL) returns 404 after migration."""
    response = auth_client.get("/api/v1/agreement-types/")
    assert response.status_code == 404


def test_old_agreement_reasons_url_returns_404(auth_client, app_ctx):
    """GET /api/v1/agreement-reasons/ (old URL) returns 404 after migration."""
    response = auth_client.get("/api/v1/agreement-reasons/")
    assert response.status_code == 404


def test_old_research_types_url_returns_404(auth_client, app_ctx):
    """GET /api/v1/research-types/ (old URL) returns 404 after migration."""
    response = auth_client.get("/api/v1/research-types/")
    assert response.status_code == 404


def test_old_portfolio_status_url_returns_404(auth_client, app_ctx):
    """GET /api/v1/portfolio-status/ (old URL) returns 404 after migration."""
    response = auth_client.get("/api/v1/portfolio-status/")
    assert response.status_code == 404


def test_old_portfolio_status_by_id_url_returns_404(auth_client, app_ctx):
    """GET /api/v1/portfolio-status/1 (old URL) returns 404 after migration."""
    response = auth_client.get("/api/v1/portfolio-status/1")
    assert response.status_code == 404
