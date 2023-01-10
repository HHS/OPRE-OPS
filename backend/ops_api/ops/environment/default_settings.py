from datetime import timedelta
import os

DEBUG = False  # make sure DEBUG is off unless enabled explicitly otherwise
SQLALCHEMY_DATABASE_URI = "sqlite:///ops_test.db"
SQLALCHEMY_TRACK_MODIFICATIONS = False
FLASK_PORT = 8080
AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid"},
    }
}
JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY")
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=1)
