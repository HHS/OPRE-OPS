import os

from ops_api.ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = False

# Pull secrets from ACA Environment
db_username = os.getenv("PGUSER")
db_password = os.getenv("PGPASSWORD")
db_host = os.getenv("PGHOST")
db_port = os.getenv("PGPORT")
db_name = os.getenv("PGDATABASE")

OPS_FRONTEND_URL = os.getenv("OPS_FRONTEND_URL")

SQLALCHEMY_DATABASE_URI = (
    f"postgresql+psycopg2://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"  # noqa: B950
)

AUTHLIB_OAUTH_CLIENTS = {
    "hhsams": {
        "server_metadata_url": "https://sso.acf.hhs.gov/auth/realms/ACF-AMS/.well-known/openid-configuration",
        "token_endpoint": "https://sso.acf.hhs.gov/auth/realms/ACF-AMS/protocol/openid-connect/token",
        "user_info_url": "https://sso.acf.hhs.gov/auth/realms/ACF-AMS/protocol/openid-connect/userinfo",
        "client_id": "https://ops.opre.acf.gov",
        "client_kwargs": {"scope": "openid email"},
        "aud": "https://sso.acf.hhs.gov/auth/realms/ACF-AMS/protocol/openid-connect/token",
        "redirect_uri": "https://ops.opre.acf.gov/login",
    },
}
