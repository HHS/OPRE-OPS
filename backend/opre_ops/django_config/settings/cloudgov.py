"""
Configuration for running OPRE OPS in cloud.gov.
"""
import json
import os

import cfenv

from opre_ops.django_config.settings.common import *  # noqa: F401,F403,
from opre_ops.django_config.settings.helpers.random_string import generate_random_string


env = cfenv.AppEnv()


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


# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": database_creds["db_name"],
        "USER": database_creds["username"],
        "PASSWORD": database_creds["password"],
        "HOST": database_creds["host"],
        "PORT": database_creds["port"],
    }
}

# SECURITY: Keep the secret keys used in production secret!
SECRET_KEY = env.get_credential("APP_SECRET_KEY", generate_random_string(50))

DEBUG = False

ALLOWED_HOSTS = [".cloud.gov"]
CSRF_TRUSTED_ORIGINS = ["https://*.app.cloud.gov"]
CORS_ALLOWED_ORIGIN_REGEXES = [r"https://\S+\.app.cloud.gov"]

REST_FRAMEWORK = REST_FRAMEWORK | {
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "1000/day", "user": "5000/day"},
}
