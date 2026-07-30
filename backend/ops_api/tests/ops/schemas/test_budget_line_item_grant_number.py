"""Schema-level tests for grant-number linkage on budget line items (OPS-5928).

These exercise the marshmallow schemas directly (no DB): the nested-request
mutual-exclusivity rules and the response serialization of ``grant_number_id``.
"""

import pytest
from marshmallow import ValidationError

from ops_api.ops.schemas.budget_line_items import (
    BudgetLineItemResponseSchema,
    NestedBudgetLineItemRequestSchema,
    POSTRequestBodySchema,
)


def test_nested_schema_accepts_grant_number_ref():
    loaded = NestedBudgetLineItemRequestSchema().load({"grant_number_ref": "Grant 1"})
    assert loaded["grant_number_ref"] == "Grant 1"


def test_post_schema_accepts_grant_number_id():
    loaded = POSTRequestBodySchema().load({"agreement_id": 1, "grant_number_id": 7})
    assert loaded["grant_number_id"] == 7


@pytest.mark.parametrize(
    "payload",
    [
        {"grant_number_id": 5, "grant_number_ref": "Grant 1"},
        {"services_component_id": 2, "grant_number_id": 5},
        {"services_component_ref": "SC1", "grant_number_ref": "Grant 1"},
        {"services_component_id": 2, "grant_number_ref": "Grant 1"},
    ],
)
def test_nested_schema_rejects_conflicting_grouping_links(payload):
    with pytest.raises(ValidationError):
        NestedBudgetLineItemRequestSchema().load(payload)


class _FakeGrantNumber:
    def __init__(self, number):
        self.id = 42
        self.agreement_id = 1
        self.number = number
        self.description = None
        self.display_title = f"Grant {number}"
        self.display_name = f"Grant {number}"
        self.period_start = None
        self.period_end = None
        self.created_by = None
        self.created_on = None
        self.updated_by = None
        self.updated_on = None


class _FakeBLI:
    """Minimal object with the fields the response schema reads."""

    def __init__(self, **overrides):
        defaults = dict(
            id=1,
            budget_line_item_type=None,
            agreement_id=1,
            can=None,
            can_id=500,
            services_component_id=None,
            grant_number_id=None,
            grant_number=None,
            clin_id=None,
            clin=None,
            amount=0.0,
            total=0.0,
            line_description="x",
            status=None,
            is_obe=False,
            in_review=False,
            fees=0.0,
        )
        defaults.update(overrides)
        for k, v in defaults.items():
            setattr(self, k, v)


def test_response_dumps_grant_number_id_for_grant_bli():
    gn = _FakeGrantNumber(number=3)
    bli = _FakeBLI(grant_number_id=gn.id, grant_number=gn)
    dumped = BudgetLineItemResponseSchema().dump(bli)
    assert dumped["grant_number_id"] == 42
    assert dumped["grant_number"]["number"] == 3


def test_response_dumps_null_grant_number_for_non_grant_bli():
    # A contract/other BLI lacks a grant number entirely — the shared response
    # schema must serialize it as null rather than raising.
    bli = _FakeBLI()
    dumped = BudgetLineItemResponseSchema().dump(bli)
    assert dumped["grant_number_id"] is None
    assert dumped["grant_number"] is None
