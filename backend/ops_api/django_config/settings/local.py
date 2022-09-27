"""
Configuration for running OPRE OPS locally.
We use Docker Compose for local development.
See the project Dockerfile and docker-compose.yml for context.
These are settings for local development only, not cloud or production environments.
"""
import os

# Import all common settings relevant to both local & cloud:
from ops_api.django_config.settings.common import *  # noqa: F403, F401
from ops_api.django_config.settings.helpers.random_string import generate_random_string


# Local database config for use with Docker Compose
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "postgres",
        "USER": "postgres",
        "PASSWORD": "local_password",
        "HOST": "db",
        "PORT": "5432",
    }
}

SECRET_KEY = generate_random_string(50)

DEBUG = True

ALLOWED_HOSTS = ["localhost"]
CORS_ALLOWED_ORIGIN_REGEXES = [r"http://localhost(:\d{1,4})?"]

INSTALLED_APPS += ["django_extensions"]  # noqa: F405

AUTHLIB_OAUTH_CLIENTS = {
    "logingov": {
        "server_metadata_url": "https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
        "client_id": "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        "client_kwargs": {"scope": "openid"},
    }
}
AUTHLIB_INSECURE_TRANSPORT = True

JWT_PRIVATE_KEY = os.getenv("JWT_PRIVATE_KEY").replace("\\n", "\n")
if not JWT_PRIVATE_KEY:
    raise NotImplementedError("JWT_PRIVATE_KEY environment variable must be specified")
