DEBUG = True  # make sure DEBUG is off unless enabled explicitly otherwise

# pragma: allowlist secret
SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://postgres:local_password@db:5432/postgres"  # pragma: allowlist secret
# SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://postgres:local_password@localhost:5432/postgres"  # pragma: allowlist secret
SQLALCHEMY_ECHO = False

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
    },
}

JWT_PUBLIC_KEY_PATH = "static/test-public-key.pem"
