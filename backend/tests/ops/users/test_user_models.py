from django.contrib.auth import get_user_model
import pytest

from ops_api.ops.users.models import User


@pytest.fixture
def users():
    user = get_user_model().objects.create_superuser(
        fname="Hubert",
        lname="Farnsworth",
        email="hfarnsworth@planetexpress.com",
        uuid="123e4567-e89b-12d3-a456-426655440000",
    )
    return user


def test_user_is_admin(db, user_factory):
    user: User = user_factory.create()
    print(user.uuid)
    assert user.uuid is not None


def test_create_user(db):
    user: User = get_user_model().objects.create_user(
        fname="Turanga",
        lname="Leela",
        email="tleela@planetexpress.com",
        uuid="00010203-0405-0607-0809-0a0b0c0d0e0f",
    )
    print(user.uuid)
    assert user.uuid is not None


def test_create_super_user(db):
    user: User = get_user_model().objects.create_superuser(
        fname="Hubert",
        lname="Farnsworth",
        email="hfarnsworth@planetexpress.com",
        uuid="123e4567-e89b-12d3-a456-426655440000",
    )
    print(user.uuid)
    assert user.uuid is not None


def test_get_existing_user(db, users):
    # Get existing user (from fixture)
    user: User = get_user_model().objects.get(email="hfarnsworth@planetexpress.com")
    print(user.uuid)
    assert user.uuid == users.uuid
