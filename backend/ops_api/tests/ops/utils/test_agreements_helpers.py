"""Unit tests for ops.utils.agreements_helpers.

Pure unit tests — no database, no Docker required.
"""

from unittest.mock import Mock

import pytest
from sqlalchemy.exc import IntegrityError

from models.budget_line_items import BudgetLineItemStatus
from ops_api.ops.utils.agreements_helpers import (
    AGREEMENT_NAME_UNIQUE_INDEX,
    CLIN_NUMBER_AGREEMENT_UNIQUE_CONSTRAINT,
    get_division_directors_for_agreement,
    get_pre_award_notification_directors_for_agreement,
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


# ---=== DIRECTOR HELPERS (OPS-2280) ===---


def _make_division(director_id, deputy_id=None):
    """Build a minimal Mock Division for unit-testing director helpers."""
    div = Mock()
    div.division_director_id = director_id
    div.deputy_division_director_id = deputy_id
    return div


def _make_can(division):
    """Build a Mock CAN whose portfolio has the given division."""
    can = Mock()
    can.portfolio = Mock()
    can.portfolio.division = division
    return can


def _make_bli(can, status):
    """Build a Mock BLI with the given CAN and status."""
    bli = Mock()
    bli.can = can
    bli.status = status
    return bli


class TestGetPreAwardNotificationDirectors:
    """
    get_pre_award_notification_directors_for_agreement must only include divisions
    reachable through PLANNED or IN_EXECUTION BLIs.

    get_division_directors_for_agreement must include ALL BLIs regardless of status.
    This verifies the distinction between the two helpers added in OPS-2279.
    """

    def _make_agreement(self, blis):
        agreement = Mock()
        agreement.budget_line_items = blis
        return agreement

    def test_pre_award_excludes_draft_only_division(self):
        """A division reachable only via DRAFT BLIs is excluded from pre-award notification."""
        div_draft = _make_division(director_id=1)
        draft_bli = _make_bli(_make_can(div_draft), BudgetLineItemStatus.DRAFT)

        agreement = self._make_agreement([draft_bli])
        directors, deputies = get_pre_award_notification_directors_for_agreement(agreement)

        assert 1 not in directors

    def test_pre_award_includes_planned_division(self):
        """A division reachable via a PLANNED BLI IS included in pre-award notification."""
        div_planned = _make_division(director_id=10)
        planned_bli = _make_bli(_make_can(div_planned), BudgetLineItemStatus.PLANNED)

        agreement = self._make_agreement([planned_bli])
        directors, deputies = get_pre_award_notification_directors_for_agreement(agreement)

        assert 10 in directors

    def test_pre_award_includes_in_execution_division(self):
        """A division reachable via an IN_EXECUTION BLI IS included in pre-award notification."""
        div_exec = _make_division(director_id=20)
        exec_bli = _make_bli(_make_can(div_exec), BudgetLineItemStatus.IN_EXECUTION)

        agreement = self._make_agreement([exec_bli])
        directors, deputies = get_pre_award_notification_directors_for_agreement(agreement)

        assert 20 in directors

    def test_pre_award_excludes_draft_includes_planned_from_same_agreement(self):
        """
        Mixed agreement: DRAFT BLI's division excluded, PLANNED BLI's division included.
        Both use the same agreement so the filter distinction is clear.
        """
        div_draft = _make_division(director_id=1)
        div_planned = _make_division(director_id=10)
        blis = [
            _make_bli(_make_can(div_draft), BudgetLineItemStatus.DRAFT),
            _make_bli(_make_can(div_planned), BudgetLineItemStatus.PLANNED),
        ]
        agreement = self._make_agreement(blis)

        directors, _ = get_pre_award_notification_directors_for_agreement(agreement)
        assert 10 in directors
        assert 1 not in directors

    def test_all_directors_includes_draft_division(self):
        """
        get_division_directors_for_agreement includes DRAFT BLI divisions too —
        the distinction from the pre-award helper.
        """
        div_draft = _make_division(director_id=1)
        draft_bli = _make_bli(_make_can(div_draft), BudgetLineItemStatus.DRAFT)

        agreement = self._make_agreement([draft_bli])
        directors, _ = get_division_directors_for_agreement(agreement)

        assert 1 in directors

    def test_deputy_included_when_present(self):
        """Deputy director IDs are returned in the second tuple element."""
        div = _make_division(director_id=5, deputy_id=6)
        planned_bli = _make_bli(_make_can(div), BudgetLineItemStatus.PLANNED)

        agreement = self._make_agreement([planned_bli])
        directors, deputies = get_pre_award_notification_directors_for_agreement(agreement)

        assert 5 in directors
        assert 6 in deputies

    def test_returns_empty_for_blis_without_cans(self):
        """BLIs with no CAN (can=None) are gracefully skipped."""
        bli_no_can = Mock()
        bli_no_can.can = None
        bli_no_can.status = BudgetLineItemStatus.PLANNED

        agreement = self._make_agreement([bli_no_can])
        directors, deputies = get_pre_award_notification_directors_for_agreement(agreement)

        assert directors == []
        assert deputies == []
