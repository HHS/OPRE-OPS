import pytest
from ops import create_app


@pytest.fixture
def app():
    app = create_app({"TESTING": True})
    # set up here
    yield app
    # tear down here


@pytest.fixture
def client(app):
    return app.test_client()
