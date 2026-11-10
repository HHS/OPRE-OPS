"""BDD scenario for a Contract Modification that carries a COR change (#3269)."""

import datetime

from flask import url_for
from pytest_bdd import given, scenario, then, when
from sqlalchemy import select

from models import AgreementHistory, AgreementMod, BudgetLineItemStatus, ContractBudgetLineItem, ModType
from tests.ops.agreement.test_cor_change_awarded import (  # noqa: F401 (fixtures)
    BASIC_USER_ID,
    NEW_COR_ID,
    OTHER_COR_ID,
    _cor_edits,
    _patch,
    _reload,
    make_agreement,
    modified_loe_enabled,
)


@scenario(
    "start_contract_modification_cor_change.feature",
    "The Division Director approves a contract modification with only a COR change",
)
def test_director_approves_cor_change_modification(app):
    """``app`` makes pytest-flask push a request context, which url_for needs."""


@given("I have an Awarded contract with a pending COR change", target_fixture="agreement")
def awarded_contract_with_pending_cor_change(
    modified_loe_enabled,  # noqa: F811
    make_agreement,  # noqa: F811
    basic_user_auth_client,
    loaded_db,
    test_can,
):
    agreement = make_agreement()
    # An Obligated budget line, as on any Awarded contract; its CAN's division reviews the mod.
    loaded_db.add(
        ContractBudgetLineItem(
            agreement_id=agreement.id,
            line_description="COR change BDD BLI",
            amount=100000.00,
            can_id=test_can.id,
            date_needed=datetime.date.today(),
            status=BudgetLineItemStatus.OBLIGATED,
            proc_shop_fee_percentage=0,
            created_by=BASIC_USER_ID,
        )
    )
    loaded_db.commit()
    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    assert response.status_code == 200, response.json
    return agreement


@when(
    "I send a contract modification to approval without selecting budget lines",
    target_fixture="mod_request",
)
def send_to_approval(agreement, basic_user_auth_client):
    response = basic_user_auth_client.post(
        url_for("api.agreements-contract-modifications", id=agreement.id),
        json={"budget_line_item_ids": [], "requestor_notes": "New COR starts Monday"},
    )
    assert response.status_code == 201, response.json
    return response.json


@then("the COR change is listed as In Review")
def cor_change_in_review(agreement, basic_user_auth_client):
    response = basic_user_auth_client.get(url_for("api.agreements-contract-modification-edits", id=agreement.id))
    (edit,) = response.json["data"]
    assert edit["field"] == "project_officer_id"
    assert edit["in_review"] is True


@then("the COR cannot be changed again")
def cor_locked(agreement, basic_user_auth_client):
    assert _patch(basic_user_auth_client, agreement.id, {"project_officer_id": OTHER_COR_ID}).status_code == 400


@when("the Division Director approves the contract modification", target_fixture="review")
def director_approves(mod_request, division_director_auth_client):
    response = division_director_auth_client.patch(
        url_for("api.contract-modification-requests-item", id=mod_request["id"]), json={"action": "APPROVE"}
    )
    assert response.status_code == 200, response.json
    return response.json


@then("the agreement's COR is the new COR")
def cor_applied(agreement, loaded_db):
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID


@then("an Admin agreement modification is created with the COR change attached")
def admin_mod_created(review, agreement, loaded_db):
    mod = loaded_db.get(AgreementMod, review["agreement_mod_id"])
    assert mod.mod_type == ModType.ADMIN
    (edit,) = _cor_edits(loaded_db, agreement.id)
    assert edit.agreement_mod_id == mod.id


@then("the agreement history records the COR change")
def cor_change_history(agreement, loaded_db):
    titles = loaded_db.scalars(
        select(AgreementHistory.history_title).where(AgreementHistory.agreement_id_record == agreement.id)
    ).all()
    assert "Contract Modification Sent to Approval" in titles
    assert "Contract Modification Approved" in titles
    assert "Change to COR" in titles
