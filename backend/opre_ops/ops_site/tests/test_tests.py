import pytest


@pytest.mark.parametrize("text_input, result", [("5+5", 10), ("1+4", 5)])
def test_sum(text_input, result):
    assert eval(text_input) == result
