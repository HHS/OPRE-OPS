"""
Configuration for running OPRE OPS locally.
We use Docker Compose for local development.
See the project Dockerfile and docker-compose.yml for context.
These are settings for local development only, not cloud or production environments.
"""
# Import all common settings relevant to both local & cloud:
from opre_ops.django_config.settings.common import *  # noqa: F403, F401
from opre_ops.django_config.settings.helpers.random_string import generate_random_string

__all__ = [
    "DATABASES",
    "SECRET_KEY",
    "DEBUG",
    "ALLOWED_HOSTS",
    "CORS_ALLOWED_ORIGIN_REGEXES",
    "INSTALLED_APPS",
]

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
