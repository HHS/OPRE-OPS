import os
from datetime import timedelta

DEBUG = False  # make sure DEBUG is off unless enabled explicitly otherwise

SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ECHO = False

FLASK_PORT = 8080

JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY")
JWT_PUBLIC_KEY_PATH = "./static/public.pem"
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
USER_SESSION_EXPIRATION = timedelta(minutes=30)

FAKE_USER_OIDC_IDS = [
    "00000000-0000-1111-a111-000000000018",
    "00000000-0000-1111-a111-000000000019",
    "00000000-0000-1111-a111-000000000020",
]
