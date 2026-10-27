import os

from ops_api.ops.environment.azure.dev import *  # noqa: F403, F401

# Per-PR preview environments.
# Behaves like dev, except: FakeAuth only, and the frontend URL and Host prefix
# come from the container app's env because each PR has its own hostname.

OPS_FRONTEND_URL = os.environ["OPS_FRONTEND_URL"]  # e.g. https://pr-123.ops.opre.acf.gov

# Must end with "." (enforced at startup by validate_host_header_prefix).
HOST_HEADER_PREFIX = os.environ["HOST_HEADER_PREFIX"]  # e.g. opre-ops-pr123-app-backend.

SQLALCHEMY_ECHO = False

# Up to 8 previews share one B1ms Postgres server (35 usable connections), so each
# backend gets at most 3: 8 x 3 plus seed/migrate jobs fits. A 4th concurrent request
# waits up to 10s for a connection and then fails, which is fine for QA traffic.
SQLALCHEMY_POOL_SIZE = 2
SQLALCHEMY_MAX_OVERFLOW = 1
SQLALCHEMY_POOL_TIMEOUT = 10

# Previews have no HHS AMS client, so the health check skips the auth services check.
HEALTH_CHECK_AUTH_SERVICES = False

# FakeAuth only (no HHS AMS), reusing dev's client but redirecting to this PR's frontend.
AUTHLIB_OAUTH_CLIENTS = {
    "fakeauth": {
        **AUTHLIB_OAUTH_CLIENTS["fakeauth"],  # noqa: F405
        "redirect_uri": f"{OPS_FRONTEND_URL}/login",
    },
}
