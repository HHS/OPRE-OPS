"""
Configuration for running OPRE OPS locally.
We use Docker Compose for local development.
See the project Dockerfile and docker-compose.yml for context.
These are settings for local development only, not cloud or production environments.
"""

# Import all common settings relevant to both local & cloud:
from opre_ops.settings.common import *
from opre_ops.settings.helpers.random_string import generate_random_string


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

ALLOWED_HOSTS = [
    "localhost",
    "0.0.0.0",
]

INSTALLED_APPS = ["django_extensions"] + INSTALLED_APPS
