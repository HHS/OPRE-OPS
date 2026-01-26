from flask import url_for


def test_index(client):
    response = client.get("/")
    assert b"It works!" in response.data


def test_csrf_protection_azure_prod(app, auth_client, mocker, app_ctx):
    """
    Test the happy path for CSRF protection in Azure production environment
    i.e. the headers are correct and the request is successful.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Add our custom headers to the default headers
    default_headers.update(
        {
            "Host": "OPRE-OPS-PROD-APP-BACKEND.xxxxx.yyyy.cloud.io:443",
            "Referer": "https://referer.example.com/agreements",
        }
    )

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 200


def test_csrf_protection_azure_prod_host_not_set(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment when either the Host header is not set.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Remove Host header
    del default_headers["Host"]

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 401


def test_csrf_protection_azure_prod_referer_not_set(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment when the Referer header is not set.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # No need to remove the Referer header (it's not in the default headers), just use the default headers
    response = auth_client.post(
        url_for("auth.logout_post"),
    )

    assert response.status_code == 401


def test_csrf_protection_azure_prod_host_not_matching(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment when the Host header does not match the Azure backend prefix.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Change the Host header to something that does not match the Azure backend prefix
    default_headers.update(
        {
            "Host": "OPRE-OPS-PROD-APP-BACKEND-WRONG-PREFIX.xxxxx.yyyy.cloud.io:443",
            "Referer": "https://referer.example.com/agreements",
        }
    )

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 401


def test_csrf_protection_azure_prod_referrer_not_matching(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment when the Referer header does not match the OPS_FRONTEND_URL.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Change the Referer header to something that does not match the OPS_FRONTEND_URL
    default_headers.update(
        {
            "Host": "OPRE-OPS-PROD-APP-BACKEND.xxxxx.yyyy.cloud.io:443",
            "Referer": "https://wrong-referer.example.com/agreements",
        }
    )

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 401


def test_csrf_protection_azure_prod_wrong_port(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment when the Host header port is not 443.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Change the Host header port to something other than 443
    default_headers.update(
        {
            "Host": "OPRE-OPS-PROD-APP-BACKEND.xxxxx.yyyy.cloud.io:8080",
            "Referer": "https://referer.example.com/agreements",
        }
    )

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 401


def test_csrf_protection_azure_prod_wrong_protocol(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment when the Referer header protocol is not https.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Change the Referer header protocol to http
    default_headers.update(
        {
            "Host": "OPRE-OPS-PROD-APP-BACKEND.xxxxx.yyyy.cloud.io:443",
            "Referer": "http://referer.example.com/agreements",
        }
    )

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 401


def test_csrf_protection_localhost_unchanged(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in localhost environment where the headers are not changed.
    This should not raise any errors and should return a 200 status code.
    """
    # Make a simple request to get the default headers
    default_response = auth_client.get("/")
    default_headers = dict(default_response.request.headers)

    # Use the updated headers for the test
    response = auth_client.post(
        url_for("auth.logout_post"),
        headers=default_headers,
    )

    assert response.status_code == 200


def test_csrf_protection_azure_prod_exclude_health_probe(app, auth_client, mocker, app_ctx):
    """
    Test the CSRF protection in Azure production environment for the health probe endpoint.
    This should not raise any errors and should return a 200 status code.
    """
    app.config["OPS_FRONTEND_URL"] = "https://referer.example.com"
    app.config["HOST_HEADER_PREFIX"] = "opre-ops-prod-app-backend."

    # Make a request to the health check endpoint
    response = auth_client.get(url_for("api.health-check"))

    assert response.status_code == 200
