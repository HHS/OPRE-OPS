import pytest

from pytest_factoryboy import register
from tests.ops.users.user_factory import UserFactory

register(UserFactory)  # -> user_factory
