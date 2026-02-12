import os
from datetime import timedelta

DEBUG = False  # make sure DEBUG is off unless enabled explicitly otherwise

SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ECHO = False

# SQLAlchemy Connection Pool Settings
# Defaults are conservative for production; override in local/dev configs for E2E testing
SQLALCHEMY_POOL_SIZE = 10  # Number of connections to keep open (default 5)
SQLALCHEMY_MAX_OVERFLOW = 10  # Additional connections when pool exhausted (default 10)
SQLALCHEMY_POOL_TIMEOUT = 30  # Seconds to wait for connection (default 30)
SQLALCHEMY_POOL_RECYCLE = 3600  # Recycle connections after 1 hour
SQLALCHEMY_POOL_PRE_PING = True  # Test connections before use

FLASK_PORT = 8080

JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY")
JWT_PUBLIC_KEY = os.getenv("JWT_PUBLIC_KEY")
JWT_ALGORITHM = "RS256"
JWT_DECODE_ALGORITHMS = "RS256"
JWT_TOKEN_LOCATION = "headers"  # noqa: S105 "Not a secret"
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)  # FedRAMP AC-12 Control is 30 min
JWT_REFRESH_TOKEN_EXPIRES = timedelta(hours=12)

# OPS-API JWT
JWT_ENCODE_ISSUER = "https://opre-ops-backend-dev"
JWT_ENCODE_AUDIENCE = "https://opre-ops-frontend-dev"

# OPS-FRONTEND
OPS_FRONTEND_URL = "http://localhost:3000"

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "token_endpoint": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "redirect_uri": "http://localhost:3000/login",
    },
    "hhsams": {
        "server_metadata_url": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/.well-known/openid-configuration",
        "token_endpoint": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/token",
        "user_info_url": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/userinfo",
        "client_id": "44fe2c7a-e9c5-43ec-87e9-3de78d2d3a11",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://sso-stage.acf.hhs.gov/auth/realms/ACF-SSO/protocol/openid-connect/token",
        "redirect_uri": "http://localhost:3000/login",
    },
    "fakeauth": {
        "server_metadata_url": "http://localhost:5000/oidc/.well-known/openid-configuration",
        "token_endpoint": "http://localhost:5000/oidc/openid-connect/token",
        "user_info_url": "http://localhost:5000/oidc/openid-connect/userinfo",
        "client_id": "blah:blah",
        "client_kwargs": {"scope": "openid email"},
        "aud": "http://localhost:5000/oidc/openid-connect/token",
        "redirect_uri": "http://localhost:3000/login",
    },
}

STORAGE_ACCOUNT_NAME = "timstoragetesting"
STORAGE_ACCOUNT_KEY = os.getenv("AZURE_STORAGE_ACCOUNT_KEY")

JSONIFY_PRETTYPRINT_REGULAR = True

# User Session Variables
USER_SESSION_EXPIRATION = timedelta(minutes=28)  # See ADR 29

FAKE_USER_OIDC_IDS = [
    "00000000-0000-1111-a111-000000000018",
    "00000000-0000-1111-a111-000000000019",
    "00000000-0000-1111-a111-000000000020",
    "00000000-0000-1111-a111-000000000021",
    "00000000-0000-1111-a111-000000000022",
    "00000000-0000-1111-a111-000000000027",
    "00000000-0000-1111-a111-000000000028",
]

DOCUMENT_PROVIDERS = {
    "fake",
    "azure",
}

# Azure log truncation (Container App / Log Analytics Log field limit 32766 bytes)
# Only applied when OPS_CONFIG contains "environment/azure" (e.g. Azure deployment).
AZURE_LOG_FIELD_MAX_BYTES = 32766
AZURE_BODY_LOG_MAX_BYTES = 20000

# True when OPS_CONFIG points at Azure environment config; enables log truncation.
RUNNING_IN_AZURE = "environment/azure" in (os.getenv("OPS_CONFIG") or "")

# CSRF Protection
# This is the prefix for the Host header in the cloud environment.
HOST_HEADER_PREFIX = "localhost"

SUPER_USER = "SUPER_USER"
