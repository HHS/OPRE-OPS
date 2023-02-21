import json
import os

from ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = True

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "user_info_url": "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid email"},
    },
}


# Helper function
def get_json_env_var(variable_name):
    """Retrieve and serialize a JSON environment variable."""
    return json.loads(os.getenv(variable_name, "{}"))


# Cloud.gov exposes variables for the application and bound services via
# VCAP_APPLICATION and VCAP_SERVICES environment variables, respectively.
vcap_services = get_json_env_var("VCAP_SERVICES")

# Note: if or when we have more than one db per application instance,
# we will need to do something smarter than taking the first db in the list
database_service = vcap_services["aws-rds"][0]
database_creds = database_service["credentials"]


SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{database_creds['username']}:{database_creds['password']}@{database_creds['host']}:{database_creds['port']}/{database_creds['db_name']}"  # noqa: B950
