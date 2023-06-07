from ops_api.ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = True

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
    },
}

db_user = "psqladmin"
db_pass = "D161t4l42"
db_host = "postgresql-server-ops-db.postgres.database.azure.com"
db_name = "postgres"

SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}/{db_name}?sslmode=require"  # noqa: B950
