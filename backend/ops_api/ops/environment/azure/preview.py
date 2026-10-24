import os

from ops_api.ops.environment.azure.dev import *  # noqa: F403, F401

# Per-PR preview environments.
# Behaves like dev, except: FakeAuth only, and the frontend URL and Host prefix
# come from the container app's env because each PR has its own hostname.

OPS_FRONTEND_URL = os.environ["OPS_FRONTEND_URL"]  # e.g. https://pr-123.ops.opre.acf.gov

# check_csrf compares the Host header with startswith, so the prefix must end at a
# delimiter; otherwise the prefix for PR 12 would also accept PR 123's backend.
HOST_HEADER_PREFIX = os.environ["HOST_HEADER_PREFIX"]  # e.g. opre-ops-pr123-app-backend.
if not HOST_HEADER_PREFIX.endswith("."):
    raise ValueError("HOST_HEADER_PREFIX must end with '.'")

SQLALCHEMY_ECHO = False

# Up to 8 previews share one small Postgres server, so keep each pool small.
SQLALCHEMY_POOL_SIZE = 2
SQLALCHEMY_MAX_OVERFLOW = 3

AUTHLIB_OAUTH_CLIENTS = {
    "fakeauth": {
        "server_metadata_url": "http://localhost:5000/oidc/.well-known/openid-configuration",
        "token_endpoint": "http://localhost:5000/oidc/openid-connect/token",
        "user_info_url": "http://localhost:5000/oidc/openid-connect/userinfo",
        "client_id": "blah:blah",
        "client_kwargs": {"scope": "openid email"},
        "aud": "http://localhost:5000/oidc/openid-connect/token",
        "redirect_uri": f"{OPS_FRONTEND_URL}/login",
    },
}
