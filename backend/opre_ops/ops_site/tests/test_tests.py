import pytest


@pytest.mark.parametrize("text_input, result", [("5+5", 10), ("1+4", 5)])
def test_sum(text_input: str, result: bool) -> None:
    assert eval(text_input) == result  # noqa: S101,S307,B101,B307
