"""Tests for the atomic edit-bundle endpoint: ``PATCH /agreements/<id>/edit-bundle``.

Covers:
- Happy paths for each section of the bundle and combinations.
- Rollback semantics: a single failure leaves no partial writes.
- Authorization passthrough (uses the same agreement-level permission as PATCH).
"""

import pytest
from flask import url_for
from sqlalchemy import func, select

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    ServiceRequirementType,
    ServicesComponent,
)
from models.budget_line_items import ContractBudgetLineItem


@pytest.fixture()
def bundle_contract(loaded_db, test_admin_user, test_project, app_ctx):
    """A contract agreement plus one SC and one BLI suitable for bundle edit tests.

    Yields the agreement; DB rollback in ``loaded_db`` cleans up.
    """
    contract = ContractAgreement(
        name="Bundle-Test-Contract",
        agreement_type=AgreementType.CONTRACT,
        agreement_reason=AgreementReason.NEW_REQ,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        project_id=test_project.id,
        project_officer_id=test_admin_user.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(contract)
    loaded_db.flush()

    sc = ServicesComponent(
        agreement_id=contract.id,
        number=1,
        optional=False,
        description="Initial SC",
    )
    loaded_db.add(sc)
    loaded_db.flush()

    bli = ContractBudgetLineItem(
        agreement_id=contract.id,
        services_component_id=sc.id,
        line_description="Initial BLI",
        amount=100000.00,
        can_id=500,
        status=BudgetLineItemStatus.DRAFT,
        created_by=test_admin_user.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield contract


def _bundle_url(agreement_id: int) -> str:
    return url_for("api.agreements-edit-bundle", id=agreement_id)


# ---------------------------------------------------------------------------
# Happy paths
# ---------------------------------------------------------------------------


def test_empty_bundle_is_a_noop(auth_client, bundle_contract):
    response = auth_client.patch(_bundle_url(bundle_contract.id), json={})
    assert response.status_code == 200
    assert response.json["budget_line_items_created"] == 0
    assert response.json["services_components_created"] == 0


def test_bundle_updates_agreement_only(auth_client, bundle_contract, loaded_db):
    response = auth_client.patch(
        _bundle_url(bundle_contract.id),
        json={
            "agreement": {
                "agreement_type": "CONTRACT",
                "name": "Updated-Bundle-Name",
                "description": "From bundle",
            }
        },
    )
    assert response.status_code == 200
    assert response.json["agreement_updated"] is True

    refreshed = loaded_db.scalar(select(ContractAgreement).where(ContractAgreement.id == bundle_contract.id))
    assert refreshed.name == "Updated-Bundle-Name"
    assert refreshed.description == "From bundle"


def test_bundle_creates_sc_and_references_it_from_new_bli(auth_client, bundle_contract, loaded_db):
    response = auth_client.patch(
        _bundle_url(bundle_contract.id),
        json={
            "services_components": {
                "create": [{"ref": "opt1", "number": 2, "optional": True, "description": "Option 1"}],
            },
            "budget_line_items": {
                "create": [
                    {
                        "line_description": "Linked to new SC",
                        "amount": 250000.00,
                        "can_id": 500,
                        "status": "DRAFT",
                        "services_component_ref": "opt1",
                    }
                ],
            },
        },
    )
    assert response.status_code == 200
    assert response.json["services_components_created"] == 1
    assert response.json["budget_line_items_created"] == 1

    new_bli = loaded_db.scalar(
        select(BudgetLineItem)
        .where(BudgetLineItem.agreement_id == bundle_contract.id)
        .where(BudgetLineItem.line_description == "Linked to new SC")
    )
    assert new_bli is not None
    assert new_bli.services_component_id is not None
    assert new_bli.services_component.number == 2


def test_bundle_updates_existing_sc_and_bli(auth_client, bundle_contract, loaded_db):
    sc = bundle_contract.services_components[0]
    bli = bundle_contract.budget_line_items[0]

    response = auth_client.patch(
        _bundle_url(bundle_contract.id),
        json={
            "services_components": {"update": [{"id": sc.id, "description": "Bundle-updated SC"}]},
            "budget_line_items": {"update": [{"id": bli.id, "line_description": "Bundle-updated BLI"}]},
        },
    )
    assert response.status_code == 200

    loaded_db.expire(sc)
    loaded_db.expire(bli)
    refreshed_sc = loaded_db.get(ServicesComponent, sc.id)
    refreshed_bli = loaded_db.get(BudgetLineItem, bli.id)
    assert refreshed_sc.description == "Bundle-updated SC"
    assert refreshed_bli.line_description == "Bundle-updated BLI"


def test_bundle_deletes_bli_then_sc(auth_client, bundle_contract, loaded_db):
    sc = bundle_contract.services_components[0]
    bli = bundle_contract.budget_line_items[0]

    response = auth_client.patch(
        _bundle_url(bundle_contract.id),
        json={
            "budget_line_items": {"delete": [bli.id]},
            "services_components": {"delete": [sc.id]},
        },
    )
    assert response.status_code == 200
    assert response.json["budget_line_items_deleted"] == 1
    assert response.json["services_components_deleted"] == 1

    assert loaded_db.get(BudgetLineItem, bli.id) is None
    assert loaded_db.get(ServicesComponent, sc.id) is None


# ---------------------------------------------------------------------------
# Rollback semantics — the whole point of this endpoint
# ---------------------------------------------------------------------------


def test_invalid_can_in_new_bli_rolls_back_entire_bundle(auth_client, bundle_contract, loaded_db):
    """An invalid CAN on a new BLI must leave SC creates and agreement edits unpersisted."""
    initial_agreement_name = bundle_contract.name
    initial_sc_count = loaded_db.scalar(
        select(func.count())
        .select_from(ServicesComponent)
        .where(ServicesComponent.agreement_id == bundle_contract.id)
    )

    response = auth_client.patch(
        _bundle_url(bundle_contract.id),
        json={
            "agreement": {"agreement_type": "CONTRACT", "name": "Should-not-persist"},
            "services_components": {
                "create": [{"ref": "newsc", "number": 5, "optional": False, "description": "x"}]
            },
            "budget_line_items": {
                "create": [
                    {
                        "line_description": "Bad CAN",
                        "amount": 10.0,
                        "can_id": 99999,  # does not exist
                        "status": "DRAFT",
                        "services_component_ref": "newsc",
                    }
                ]
            },
        },
    )
    assert response.status_code >= 400

    loaded_db.expire(bundle_contract)
    refreshed = loaded_db.get(ContractAgreement, bundle_contract.id)
    assert refreshed.name == initial_agreement_name
    final_sc_count = loaded_db.scalar(
        select(func.count())
        .select_from(ServicesComponent)
        .where(ServicesComponent.agreement_id == bundle_contract.id)
    )
    assert final_sc_count == initial_sc_count


def test_invalid_services_component_ref_rolls_back(auth_client, bundle_contract, loaded_db):
    initial_bli_count = loaded_db.scalar(
        select(func.count())
        .select_from(BudgetLineItem)
        .where(BudgetLineItem.agreement_id == bundle_contract.id)
    )

    response = auth_client.patch(
        _bundle_url(bundle_contract.id),
        json={
            "services_components": {"create": [{"ref": "real", "number": 9, "optional": False}]},
            "budget_line_items": {
                "create": [
                    {
                        "line_description": "Refs missing SC",
                        "amount": 1.0,
                        "can_id": 500,
                        "status": "DRAFT",
                        "services_component_ref": "does-not-exist",
                    }
                ]
            },
        },
    )
    assert response.status_code == 400

    final_bli_count = loaded_db.scalar(
        select(func.count())
        .select_from(BudgetLineItem)
        .where(BudgetLineItem.agreement_id == bundle_contract.id)
    )
    assert final_bli_count == initial_bli_count


# ---------------------------------------------------------------------------
# Authorization
# ---------------------------------------------------------------------------


def test_bundle_requires_authentication(client, bundle_contract):
    response = client.patch(_bundle_url(bundle_contract.id), json={})
    assert response.status_code == 401


def test_bundle_no_perms_user_forbidden(no_perms_auth_client, bundle_contract):
    response = no_perms_auth_client.patch(_bundle_url(bundle_contract.id), json={})
    assert response.status_code == 403
