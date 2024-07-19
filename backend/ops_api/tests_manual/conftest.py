"""Configuration for pytest tests."""

import subprocess
from collections.abc import Generator

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from flask import Flask
from flask.testing import FlaskClient
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError

from ops_api.ops import create_app

from ..tests.auth_client import AuthClient


@pytest.fixture()
def app() -> Generator[Flask, None, None]:
    """Make and return the flask app."""
    app = create_app()
    yield app


@pytest.fixture()
def client(app: Flask, loaded_db) -> FlaskClient:  # type: ignore [type-arg]
    """Get a test client for flask."""
    return app.test_client()


@pytest.fixture()
def auth_client(app: Flask) -> FlaskClient:  # type: ignore [type-arg]
    """Get the authenticated test client for flask."""
    app.testing = True
    app.test_client_class = AuthClient
    return app.test_client()


def is_responsive(db: Engine) -> bool:
    """Check if the DB is responsive."""
    try:
        with db.connect() as connection:
            connection.execute(text("SELECT 1;"))
        return True
    except OperationalError:
        return False


def is_loaded(db: Engine) -> bool:
    """Check if the DB is up."""
    try:
        if is_responsive(db):
            # This will wait until the data-import is complete
            result = subprocess.run(
                'docker ps -f "name=pytest-data-import" -a | grep "Exited (0)"',
                shell=True,
                check=True,
            )
            print(f"result: {result}")
            return True
    except subprocess.CalledProcessError:
        return False
    else:
        return False


@pytest.fixture()
def app_ctx(app: Flask) -> Generator[None, None, None]:
    """Activate the ApplicationContext for the flask app."""
    with app.app_context():
        yield
