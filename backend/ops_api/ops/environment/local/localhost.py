from ops_api.ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = True  # make sure DEBUG is off unless enabled explicitly otherwise

# pragma: allowlist secret
SQLALCHEMY_DATABASE_URI = (
    "postgresql+psycopg2://postgres:local_password@localhost:5432/postgres"  # pragma: allowlist secret
)
SQLALCHEMY_ECHO = False

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops_localhost",
        "client_kwargs": {"scope": "openid"},
    }
}
