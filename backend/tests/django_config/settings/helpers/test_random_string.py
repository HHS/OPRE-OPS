from ops_api.django_config.settings.helpers import random_string
import pytest


@pytest.mark.parametrize("_length", [10, 256, 9999])
def test_generate_random_string_length(_length) -> None:
    """
    Basic test for the provided parameters, mostly to ensure that pytest
    is working correctly.
    :param length: length of the string you want generated
    :return: None
    """
    s = random_string.generate_random_string(_length)
    assert len(s) == _length  # noqa: S101,S307
