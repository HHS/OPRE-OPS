import os
from datetime import timedelta

DEBUG = False  # make sure DEBUG is off unless enabled explicitly otherwise

# SQLALCHEMY_DATABASE_URI = "postgresql+psycopg2://postgres:local_password@localhost:5432/postgres"
SQLALCHEMY_TRACK_MODIFICATIONS = False
SQLALCHEMY_ECHO = False

FLASK_PORT = 8080

JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY")
# JWT_SECRET_KEY = "adfadfasdasfasdfasdfasfasdfasdfadfadfadfasdfasffasff"
JWT_PUBLIC_KEY_PATH = "./static/public.pem"
JWT_ALGORITHM = "RS256"
JWT_DECODE_ALGORITHMS = "RS256"
JWT_TOKEN_LOCATION = "headers"  # noqa: S105 "Not a secret"
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(hours=12)

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
    },
}
