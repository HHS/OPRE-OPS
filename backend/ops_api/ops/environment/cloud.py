import json
import os

from ops.environment.default_settings import *  # noqa: F403, F401

DEBUG = False


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
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": database_creds["db_name"],
#         "USER": database_creds["username"],
#         "PASSWORD": database_creds["password"],
#         "HOST": database_creds["host"],
#         "PORT": database_creds["port"],
#     }
# }
