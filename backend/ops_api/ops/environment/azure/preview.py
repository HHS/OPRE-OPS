import os

from ops_api.ops.environment.azure.dev import *  # noqa: F403, F401

# Per-PR preview environments.
# Behaves like dev, except: FakeAuth only, and the frontend URL and Host prefix
# come from the container app's env because each PR has its own hostname.

OPS_FRONTEND_URL = os.environ["OPS_FRONTEND_URL"]  # e.g. https://pr-123.ops.opre.acf.gov

# Must end with "." (enforced at startup by validate_host_header_prefix).
HOST_HEADER_PREFIX = os.environ["HOST_HEADER_PREFIX"]  # e.g. opre-ops-pr123-app-backend.

SQLALCHEMY_ECHO = False

# Up to 8 previews share one small Postgres server, so keep each pool small. A write
# request holds the request session's connection while each OpsEventHandler exit briefly
# opens (and closes) its own Session, so a thread needs at most 2 at once. With 4 gunicorn
# threads that's up to 8 wanted under full load; a pool of threads + 1 (5) doesn't cover
# that, but it guarantees one thread can always get its second connection and finish, so
# extra writes wait (up to SQLALCHEMY_POOL_TIMEOUT) instead of deadlocking. With fewer, every
# connection can be held by a write waiting for its second, so they all time out and fail.
# Idle, each preview keeps only 2 open.
SQLALCHEMY_POOL_SIZE = 2
SQLALCHEMY_MAX_OVERFLOW = 3
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
