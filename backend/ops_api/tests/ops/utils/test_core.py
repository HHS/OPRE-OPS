import uuid

import pytest

from models import User
from ops_api.ops.utils.core import is_fake_user, is_unit_test


@pytest.fixture()
def test_oidc():
    return uuid.uuid4()


@pytest.fixture()
def fake_user(test_oidc):
    return User(
        oidc_id=test_oidc,
        email="john@example.com",
        division=1,
    )


def test_is_fake_user(app, fake_user, app_ctx):
    assert is_fake_user(app, fake_user) is False
    app.config["FAKE_USER_OIDC_IDS"] = [str(fake_user.oidc_id)]
    assert is_fake_user(app, fake_user) is True


def test_is_unit_test(app):
    assert is_unit_test()
