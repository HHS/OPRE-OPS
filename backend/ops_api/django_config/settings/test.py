"""
Configuration for running OPRE OPS in a test
"""
# Import all settings from the local environment
from ops_api.django_config.settings.local import *  # noqa: F403, F401


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": "test",
    }
}
