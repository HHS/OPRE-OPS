"""Endpoint tests for GrantBudgetLineItem PUT/PATCH/DELETE.

Mirrors the contract BudgetLineItem edit coverage in ``test_budget_line_item.py`` for the
grant polymorphic subtype: successful round-trip updates, required-field validation on a
status that enforces them, and role/authorization checks (authorized 2xx, unauthorized 403).

Grant BLIs differ from contract BLIs in one relevant way: their status-change required
fields include ``grant_number_id`` instead of ``services_component_id``
(see ``GrantBudgetLineItem.get_required_fields_for_status_change``).
"""

import datetime

import pytest
from flask import url_for

from models import (
    AgreementType,
    BudgetLineItemStatus,
    GrantAgreement,
    GrantNumber,
)
from models.budget_line_items import GrantBudgetLineItem


@pytest.fixture()
def test_grant_agreement(loaded_db, test_project, app_ctx):
    ga = GrantAgreement(
        name="Grant-BLI-endpoint-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()

    yield ga

    loaded_db.rollback()
    loaded_db.delete(ga)
    loaded_db.commit()


@pytest.fixture()
def test_grant_number(loaded_db, test_grant_agreement, app_ctx):
    gn = GrantNumber(agreement_id=test_grant_agreement.id, number=1, description="Endpoint-test grant number")
    loaded_db.add(gn)
    loaded_db.commit()

    yield gn

    lingering = loaded_db.get(GrantNumber, gn.id)
    if lingering:
        loaded_db.delete(lingering)
        loaded_db.commit()


@pytest.fixture()
def test_grant_bli_draft(loaded_db, test_grant_agreement, test_grant_number, test_can, app_ctx):
    bli = GrantBudgetLineItem(
        line_description="Grant BLI",
        agreement_id=test_grant_agreement.id,
        grant_number_id=test_grant_number.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.rollback()
    lingering = loaded_db.get(GrantBudgetLineItem, bli.id)
    if lingering:
        loaded_db.delete(lingering)
        loaded_db.commit()


# ---------------------------------------------------------------------------
# PUT
# ---------------------------------------------------------------------------


def test_put_grant_budget_line_item(auth_client, loaded_db, test_grant_bli_draft, test_grant_agreement, app_ctx):
    data = {
        "line_description": "Updated Grant BLI",
        "comments": "hah hah",
        "agreement_id": test_grant_agreement.id,
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
        "status": "DRAFT",
    }
    response = auth_client.put(url_for("api.budget-line-items-item", id=test_grant_bli_draft.id), json=data)
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated Grant BLI"
    assert response.json["id"] == test_grant_bli_draft.id
    assert response.json["comments"] == "hah hah"
    assert response.json["agreement_id"] == test_grant_agreement.id
    assert response.json["can_id"] == 501
    assert response.json["amount"] == 200.24
    assert response.json["status"] == "DRAFT"
    assert response.json["date_needed"] == "2044-01-01"
    assert response.json["created_on"] != response.json["updated_on"]


def test_put_grant_budget_line_item_cannot_change_agreement(auth_client, test_grant_bli_draft, app_ctx):
    response = auth_client.put(
        url_for("api.budget-line-items-item", id=test_grant_bli_draft.id),
        json={"agreement_id": 1},
    )
    assert response.status_code == 400


def test_put_grant_budget_line_item_auth(client, app_ctx):
    response = client.put("/api/v1/budget-line-items/1000", json={})
    assert response.status_code == 401


def test_put_grant_budget_line_item_empty_request(auth_client, test_grant_bli_draft, app_ctx):
    response = auth_client.put(url_for("api.budget-line-items-item", id=test_grant_bli_draft.id), json={})
    assert response.status_code == 400


# ---------------------------------------------------------------------------
# PATCH
# ---------------------------------------------------------------------------


def test_patch_grant_budget_line_item(auth_client, loaded_db, test_grant_bli_draft, test_grant_number, app_ctx):
    data = {
        "line_description": "Patched Grant BLI",
        "comments": "hah hah",
        "can_id": 501,
        "amount": 200.24,
        "date_needed": "2044-01-01",
    }
    response = auth_client.patch(url_for("api.budget-line-items-item", id=test_grant_bli_draft.id), json=data)
    assert response.status_code == 200
    assert response.json["line_description"] == "Patched Grant BLI"
    assert response.json["id"] == test_grant_bli_draft.id
    assert response.json["comments"] == "hah hah"
    assert response.json["can_id"] == 501
    assert response.json["amount"] == 200.24
    assert response.json["date_needed"] == "2044-01-01"
    # Grant linkage is preserved across a partial patch that omits it.
    assert response.json["grant_number_id"] == test_grant_number.id
    assert response.json["created_on"] != response.json["updated_on"]


def test_patch_grant_budget_line_item_auth_required(client, app_ctx):
    response = client.patch("/api/v1/budget-line-items/1", json={})
    assert response.status_code == 401


def test_patch_grant_budget_line_item_bad_status(auth_client, test_grant_bli_draft, app_ctx):
    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=test_grant_bli_draft.id),
        json={"status": "blah blah"},
    )
    assert response.status_code == 400


def test_patch_grant_budget_line_item_invalid_can(auth_client, test_grant_bli_draft, app_ctx):
    response = auth_client.patch(
        url_for("api.budget-line-items-item", id=test_grant_bli_draft.id),
        json={"can_id": 10000000},
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Required-field validation (on a status that enforces them)
# ---------------------------------------------------------------------------


def test_patch_grant_budget_line_item_to_invalid_required_fields(
    auth_client, loaded_db, test_grant_agreement, test_grant_number, test_can, app_ctx
):
    """PATCHing a PLANNED grant BLI's required fields to null fails validation.

    A PLANNED grant BLI must retain date_needed/can_id/amount; clearing them is rejected,
    mirroring the contract BLI validation test.
    """
    bli = GrantBudgetLineItem(
        line_description="Planned Grant BLI",
        agreement_id=test_grant_agreement.id,
        grant_number_id=test_grant_number.id,
        can_id=test_can.id,
        amount=111.11,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2044, 1, 1),
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    try:
        response = auth_client.patch(
            url_for("api.budget-line-items-item", id=bli.id),
            json={"amount": None, "date_needed": None},
        )
        assert response.status_code == 400
        assert response.json["message"] == "Validation failed"
    finally:
        loaded_db.delete(bli)
        loaded_db.commit()


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------


def test_delete_grant_budget_line_item(auth_client, loaded_db, test_grant_agreement, test_can, app_ctx):
    bli = GrantBudgetLineItem(
        line_description="Grant BLI to delete",
        agreement_id=test_grant_agreement.id,
        can_id=test_can.id,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    response = auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200
    assert loaded_db.get(GrantBudgetLineItem, bli_id) is None


# ---------------------------------------------------------------------------
# Role / authorization (authorized 2xx, unauthorized 403)
# ---------------------------------------------------------------------------


def test_patch_grant_budget_line_item_forbidden_status_change_as_basic_user(
    basic_user_auth_client, test_grant_bli_draft, app_ctx
):
    """A basic user not associated with the grant cannot push a change request via PATCH."""
    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=test_grant_bli_draft.id),
        json={"status": "PLANNED"},
    )
    assert response.status_code == 403


def test_post_grant_budget_line_item_forbidden_as_basic_user(
    basic_user_auth_client, test_grant_agreement, test_grant_number, test_can, app_ctx
):
    """A basic user not associated with the grant cannot create a grant BLI."""
    response = basic_user_auth_client.post(
        "/api/v1/budget-line-items/",
        json={
            "agreement_id": test_grant_agreement.id,
            "grant_number_id": test_grant_number.id,
            "line_description": "Unauthorized create",
            "can_id": test_can.id,
            "amount": 100.12,
            "status": "DRAFT",
            "date_needed": "2043-01-01",
        },
    )
    assert response.status_code == 403


def test_delete_grant_budget_line_item_forbidden_as_basic_user(
    basic_user_auth_client, test_grant_bli_draft, loaded_db, app_ctx
):
    """A basic user not associated with the grant cannot delete a grant BLI."""
    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=test_grant_bli_draft.id))
    assert response.status_code == 403
    # BLI is untouched.
    assert loaded_db.get(GrantBudgetLineItem, test_grant_bli_draft.id) is not None
