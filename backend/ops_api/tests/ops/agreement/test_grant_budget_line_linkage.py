"""Tests for linking grant budget line items to grant numbers (OPS-5928).

Covers the grant analog of the services-component linkage:
- Atomic edit-bundle: create a grant number and reference it from a new BLI via
  ``grant_number_ref``; reassign an existing BLI to a grant number.
- Ref-resolution failure rolls back the whole bundle.
- Cross-agreement grant-number rejection.
- Status-change required-fields: a grant BLI requires ``grant_number_id`` (not
  ``services_component_id``) to leave DRAFT.
"""

import pytest
from flask import url_for
from sqlalchemy import select

from models import (
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    GrantAgreement,
    GrantNumber,
)
from models.budget_line_items import GrantBudgetLineItem


@pytest.fixture()
def bundle_grant(loaded_db, test_admin_user, app_ctx):
    """A grant agreement plus one grant number and one grant BLI linked to it."""
    grant = GrantAgreement(
        agreement_type=AgreementType.GRANT,
        name="Bundle-Test-Grant",
        nick_name="Bundle Grant",
        description="Grant for BLI-linkage bundle tests",
        project_officer_id=test_admin_user.id,
        nofo_number="NOFO-2026-5928",
        created_by=test_admin_user.id,
    )
    loaded_db.add(grant)
    loaded_db.flush()

    gn = GrantNumber(
        agreement_id=grant.id,
        number=1,
        description="Initial grant number",
    )
    loaded_db.add(gn)
    loaded_db.flush()

    bli = GrantBudgetLineItem(
        agreement_id=grant.id,
        grant_number_id=gn.id,
        line_description="Initial grant BLI",
        amount=100000.00,
        can_id=500,
        status=BudgetLineItemStatus.DRAFT,
        created_by=test_admin_user.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield grant


def _bundle_url(agreement_id: int) -> str:
    return url_for("api.agreements-edit-bundle", id=agreement_id)


def test_bundle_creates_grant_number_and_references_it_from_new_bli(auth_client, bundle_grant, loaded_db):
    response = auth_client.patch(
        _bundle_url(bundle_grant.id),
        json={
            "grant_numbers": {
                "create": [{"ref": "Grant 2", "number": 2, "description": "Second grant number"}],
            },
            "budget_line_items": {
                "create": [
                    {
                        "line_description": "Linked to new grant number",
                        "amount": 250000.00,
                        "can_id": 500,
                        "status": "DRAFT",
                        "grant_number_ref": "Grant 2",
                    }
                ],
            },
        },
    )
    assert response.status_code == 200
    assert response.json["grant_numbers_created"] == 1
    assert response.json["budget_line_items_created"] == 1

    new_bli = loaded_db.scalar(
        select(BudgetLineItem)
        .where(BudgetLineItem.agreement_id == bundle_grant.id)
        .where(BudgetLineItem.line_description == "Linked to new grant number")
    )
    assert new_bli is not None
    assert new_bli.grant_number_id is not None
    assert new_bli.grant_number.number == 2


def test_bundle_reassigns_existing_bli_to_grant_number(auth_client, bundle_grant, loaded_db):
    bli = bundle_grant.budget_line_items[0]

    response = auth_client.patch(
        _bundle_url(bundle_grant.id),
        json={
            "grant_numbers": {
                "create": [{"ref": "Grant 3", "number": 3, "description": "Third grant number"}],
            },
            "budget_line_items": {
                "update": [{"id": bli.id, "grant_number_ref": "Grant 3"}],
            },
        },
    )
    assert response.status_code == 200

    loaded_db.expire(bli)
    refreshed = loaded_db.get(BudgetLineItem, bli.id)
    assert refreshed.grant_number.number == 3


def test_invalid_grant_number_ref_rolls_back(auth_client, bundle_grant, loaded_db):
    before = loaded_db.scalar(
        select(BudgetLineItem).where(BudgetLineItem.agreement_id == bundle_grant.id).where(BudgetLineItem.id < 0)
    )
    assert before is None  # sanity

    response = auth_client.patch(
        _bundle_url(bundle_grant.id),
        json={
            "budget_line_items": {
                "create": [
                    {
                        "line_description": "Bad ref",
                        "amount": 10000.00,
                        "can_id": 500,
                        "status": "DRAFT",
                        "grant_number_ref": "does-not-exist",
                    }
                ],
            },
        },
    )
    assert response.status_code == 400

    created = loaded_db.scalar(
        select(BudgetLineItem)
        .where(BudgetLineItem.agreement_id == bundle_grant.id)
        .where(BudgetLineItem.line_description == "Bad ref")
    )
    assert created is None


def test_cross_agreement_grant_number_rejected(auth_client, bundle_grant, loaded_db, test_admin_user, app_ctx):
    """A BLI cannot be linked to a grant number that belongs to a different agreement."""
    other_grant = GrantAgreement(
        agreement_type=AgreementType.GRANT,
        name="Other-Grant-For-Cross-Check",
        project_officer_id=test_admin_user.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(other_grant)
    loaded_db.flush()
    foreign_gn = GrantNumber(agreement_id=other_grant.id, number=9, description="Foreign")
    loaded_db.add(foreign_gn)
    loaded_db.commit()

    bli = bundle_grant.budget_line_items[0]
    response = auth_client.patch(
        _bundle_url(bundle_grant.id),
        json={"budget_line_items": {"update": [{"id": bli.id, "grant_number_id": foreign_gn.id}]}},
    )
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# Model-level: status-change required fields are polymorphic (no DB needed)
# ---------------------------------------------------------------------------


def test_grant_bli_requires_grant_number_for_status_change():
    from models.budget_line_items import ContractBudgetLineItem

    grant_required = GrantBudgetLineItem.get_required_fields_for_status_change()
    contract_required = ContractBudgetLineItem.get_required_fields_for_status_change()

    assert "grant_number_id" in grant_required
    assert "services_component_id" not in grant_required
    # Contract BLIs are unchanged.
    assert "services_component_id" in contract_required
    assert "grant_number_id" not in contract_required
