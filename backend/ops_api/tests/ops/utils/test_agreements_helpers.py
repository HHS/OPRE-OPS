"""Unit tests for ops.utils.agreements_helpers.

Pure unit tests — no database, no Docker required.
"""

from unittest.mock import Mock

import pytest
from sqlalchemy.exc import IntegrityError

from ops_api.ops.utils.agreements_helpers import (
    AGREEMENT_NAME_UNIQUE_INDEX,
    CLIN_NUMBER_AGREEMENT_UNIQUE_CONSTRAINT,
    is_agreement_name_unique_violation,
    is_unique_violation,
)


def make_integrity_error(orig_str: str, constraint_name: str | None = None) -> IntegrityError:
    """Build an IntegrityError whose orig has a configurable str() and optional diag.constraint_name."""
    orig = Mock()
    orig.__str__ = lambda self: orig_str
    if constraint_name is not None:
        orig.diag = Mock()
        orig.diag.constraint_name = constraint_name
    else:
        # Simulate drivers that don't expose diag (e.g. SQLite)
        del orig.diag  # getattr(..., "diag", None) will return None
    return IntegrityError("statement", "params", orig)


class TestIsUniqueViolation:
    """Tests for is_unique_violation(error, constraint_name)."""

    def test_returns_true_when_structured_diag_matches(self):
        """Prefers error.orig.diag.constraint_name when available."""
        error = make_integrity_error(
            orig_str="some other message",
            constraint_name="my_unique_constraint",
        )
        assert is_unique_violation(error, "my_unique_constraint") is True

    def test_returns_false_when_structured_diag_differs(self):
        """Structured diag present but names don't match — should be False."""
        error = make_integrity_error(
            orig_str='duplicate key violates unique constraint "my_unique_constraint"',
            constraint_name="some_other_constraint",
        )
        assert is_unique_violation(error, "my_unique_constraint") is False

    def test_returns_true_via_substring_fallback_when_no_diag(self):
        """Falls back to substring match on str(error) when diag is unavailable."""
        error = make_integrity_error(
            orig_str='duplicate key value violates unique constraint "my_unique_constraint"',
            constraint_name=None,
        )
        assert is_unique_violation(error, "my_unique_constraint") is True

    def test_returns_false_when_neither_diag_nor_substring_matches(self):
        """Neither structured diag nor substring present — should be False."""
        error = make_integrity_error(
            orig_str='duplicate key value violates unique constraint "some_other_constraint"',
            constraint_name=None,
        )
        assert is_unique_violation(error, "my_unique_constraint") is False

    @pytest.mark.parametrize("constraint", [CLIN_NUMBER_AGREEMENT_UNIQUE_CONSTRAINT, AGREEMENT_NAME_UNIQUE_INDEX])
    def test_named_constants_match_their_own_constraint(self, constraint):
        """Sanity-check the module constants work as expected with each branch."""
        via_diag = make_integrity_error(orig_str="irrelevant", constraint_name=constraint)
        via_str = make_integrity_error(orig_str=f'violates unique constraint "{constraint}"', constraint_name=None)
        assert is_unique_violation(via_diag, constraint) is True
        assert is_unique_violation(via_str, constraint) is True


class TestIsAgreementNameUniqueViolation:
    """Tests for is_agreement_name_unique_violation — delegates to is_unique_violation."""

    def test_returns_true_when_structured_diag_matches_agreement_index(self):
        error = make_integrity_error(orig_str="irrelevant", constraint_name=AGREEMENT_NAME_UNIQUE_INDEX)
        assert is_agreement_name_unique_violation(error) is True

    def test_returns_false_for_different_constraint(self):
        error = make_integrity_error(
            orig_str='violates unique constraint "some_other_index"',
            constraint_name="some_other_index",
        )
        assert is_agreement_name_unique_violation(error) is False
