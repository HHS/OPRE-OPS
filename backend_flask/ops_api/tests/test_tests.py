import pytest


@pytest.mark.parametrize("text_input, result", [("5+5", 10), ("1+4", 5)])
def test_sum(text_input, result) -> None:
    """
    Basic test for the provided parameters, mostly to ensure that pytest
    is working correctly.
    :param text_input: String representing a Sum operation. Ex: "3+3"
    :param result: Numeric value of the expected result. Ex: 5
    :return: None
    """
    assert eval(text_input) == result  # noqa: S101,S307
