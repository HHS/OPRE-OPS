"""
Configuration for running OPRE OPS in cloud.gov.
"""
from datetime import timedelta
import json
import os

import cfenv

from ops_api.django_config.settings.common import *  # noqa: F403, F401
from ops_api.django_config.settings.helpers.random_string import generate_random_string


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

# nosemgrep: python.django.security.audit.django-rest-framework.missing-throttle-config.missing-throttle-config
REST_FRAMEWORK = REST_FRAMEWORK | {  # noqa: F405
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {"anon": "1000/day", "user": "5000/day"},
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=12),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "RS256",
    "SIGNING_KEY": "private_key_value",
    "VERIFYING_KEY": "public_key_value",
    "AUDIENCE": None,
    "ISSUER": None,
    "JWK_URL": None,
    "LEEWAY": timedelta(minutes=5),
    "AUTH_HEADER_TYPES": ("Bearer", "JWT"),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "uuid",
    "USER_ID_CLAIM": "uuid",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
}
