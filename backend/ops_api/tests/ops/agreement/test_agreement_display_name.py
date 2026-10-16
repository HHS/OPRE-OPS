"""Unit tests for Agreement.display_name / full_name / display_name_expression (issue #6144).

`display_name` is the nickname-preferred label used everywhere except the agreement's
own details page (which must keep using `name` / `full_name`). See
`models/agreements.py::Agreement.display_name` and `Agreement.display_name_expression`.
"""

import pytest
from sqlalchemy import select

from models import AgreementType, ContractAgreement


class TestAgreementDisplayNameProperty:
    """Pure Python property tests — no DB round trip needed."""

    def test_display_name_prefers_nick_name(self):
        agreement = ContractAgreement(name="Full Title", nick_name="ABC", agreement_type=AgreementType.CONTRACT)
        assert agreement.display_name == "ABC"

    def test_display_name_strips_surrounding_whitespace(self):
        agreement = ContractAgreement(name="Full Title", nick_name="  ABC  ", agreement_type=AgreementType.CONTRACT)
        assert agreement.display_name == "ABC"

    @pytest.mark.parametrize(
        "nick_name",
        [None, "", "   ", "\t", "\n", "\t\n "],
        ids=["none", "empty", "spaces", "tab", "newline", "mixed-whitespace"],
    )
    def test_display_name_falls_back_to_name(self, nick_name):
        """None, "", and *any* whitespace-only nick_name (not just spaces) fall back to name.

        Python's `.strip()` strips all whitespace (tabs, newlines, etc.), unlike Postgres's
        `TRIM()`, which only strips spaces by default — this pins that Python-side behavior.
        """
        agreement = ContractAgreement(name="Full Title", nick_name=nick_name, agreement_type=AgreementType.CONTRACT)
        assert agreement.display_name == "Full Title"

    def test_full_name_is_always_the_full_title(self):
        agreement = ContractAgreement(name="Full Title", nick_name="ABC", agreement_type=AgreementType.CONTRACT)
        assert agreement.full_name == "Full Title"
        assert agreement.full_name != agreement.display_name


class TestAgreementDisplayNameExpression:
    """Compares the SQL expression (`display_name_expression()`) to the Python property."""

    @pytest.mark.parametrize(
        "nick_name",
        [None, "", "   ", "ABC", "  ABC  "],
        ids=["none", "empty", "spaces", "value", "value-with-spaces"],
    )
    def test_display_name_expression_matches_python_property(self, loaded_db, app_ctx, nick_name):
        """Pins B1's SQL/Python parity for the cases where Postgres TRIM() (spaces only)
        and Python .strip() (all whitespace) agree. Ref: issue #6144.
        """
        agreement = ContractAgreement(name="Full Title", nick_name=nick_name, agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        python_value = agreement.display_name
        sql_value = loaded_db.scalar(
            select(ContractAgreement.display_name_expression()).where(ContractAgreement.id == agreement.id)
        )

        assert sql_value == python_value

        loaded_db.delete(agreement)
        loaded_db.commit()

    @pytest.mark.parametrize(
        "nick_name",
        ["\t", "\n"],
        ids=["tab", "newline"],
    )
    def test_display_name_expression_matches_python_property_for_non_space_whitespace(
        self, loaded_db, app_ctx, nick_name
    ):
        """A tab-only or newline-only nick_name must fall back to `name` on both sides.

        display_name_expression() uses regexp_replace (not TRIM()) specifically so that
        Postgres's whitespace definition matches Python's str.strip(). Ref: issue #6144.
        """
        agreement = ContractAgreement(name="Full Title", nick_name=nick_name, agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()

        python_value = agreement.display_name
        sql_value = loaded_db.scalar(
            select(ContractAgreement.display_name_expression()).where(ContractAgreement.id == agreement.id)
        )

        assert sql_value == python_value

        loaded_db.delete(agreement)
        loaded_db.commit()
