import os

from flask import Flask

from models import User


def is_fake_user(app: Flask, user: User) -> bool:
    return str(user.oidc_id) in app.config.get("FAKE_USER_OIDC_IDS", [])


def is_unit_test() -> bool:
    """
    Check if the current environment is a unit test environment.
    """
    return os.getenv("PYTEST_VERSION", "") != ""
