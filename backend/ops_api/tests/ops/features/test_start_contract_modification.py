"""BDD scenarios for the Contract Modification approval journey (#3268)."""

from flask import url_for
from pytest_bdd import given, scenario, then, when
from sqlalchemy import select

from models import (
    AgreementMod,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    ContractModificationRequestNotification,
    ModType,
)
from tests.ops.agreement.test_contract_modification_edits import (  # noqa: F401 (fixtures)
    BASIC_USER_ID,
    _approved_amount_edit,
    _edits,
    _get_pending,
    make_agreement,
    modified_loe_enabled,
)
from tests.ops.agreement.test_contract_modification_requests import _add_bli


@scenario("start_contract_modification.feature", "The Division Director approves the contract modification")
def test_director_approves_contract_modification(app):
    """``app`` makes pytest-flask push a request context, which url_for needs."""


@scenario("start_contract_modification.feature", "The Division Director declines the contract modification")
def test_director_declines_contract_modification(app): ...


@given(
    "I have an Awarded contract with an approved edit that requires a contract modification",
    target_fixture="agreement",
)
def awarded_agreement_with_edit(
    modified_loe_enabled,  # noqa: F811
    make_agreement,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
):
    agreement, bli = make_agreement(test_can)
    _approved_amount_edit(basic_user_auth_client, division_director_auth_client, loaded_db, bli, 500000.00)
    return agreement


@given("it has a Planned budget line in the current fiscal year", target_fixture="executable")
def planned_current_fy_budget_line(agreement, loaded_db, test_can):
    return _add_bli(loaded_db, agreement, test_can)


@when(
    "I send a contract modification to approval that executes the Planned budget line",
    target_fixture="mod_request",
)
def send_to_approval(agreement, executable, basic_user_auth_client):
    response = basic_user_auth_client.post(
        url_for("api.agreements-contract-modifications", id=agreement.id),
        json={"budget_line_item_ids": [executable.id], "requestor_notes": "Please review"},
    )
    assert response.status_code == 201, response.json
    return response.json


@then("the edit is listed as In Review")
def edit_in_review(agreement, basic_user_auth_client):
    (edit,) = _get_pending(basic_user_auth_client, agreement.id).json["data"]
    assert edit["in_review"] is True


@then("I cannot send another contract modification for the agreement")
def cannot_send_another(agreement, basic_user_auth_client):
    response = basic_user_auth_client.post(url_for("api.agreements-contract-modifications", id=agreement.id), json={})
    assert response.status_code == 400


@when("the Division Director approves the contract modification", target_fixture="review")
def director_approves(mod_request, division_director_auth_client):
    response = division_director_auth_client.patch(
        url_for("api.contract-modification-requests-item", id=mod_request["id"]), json={"action": "APPROVE"}
    )
    assert response.status_code == 200, response.json
    return response.json


@when("the Division Director declines the contract modification with notes", target_fixture="review")
def director_declines(mod_request, division_director_auth_client):
    response = division_director_auth_client.patch(
        url_for("api.contract-modification-requests-item", id=mod_request["id"]),
        json={"action": "DECLINE", "reviewer_notes": "Let's review together on Tuesday"},
    )
    assert response.status_code == 200, response.json
    return response.json


@then("a Modified LOE agreement modification is created with the edit attached")
def mod_created(review, agreement, loaded_db):
    mod = loaded_db.get(AgreementMod, review["agreement_mod_id"])
    assert mod.mod_type == ModType.MODIFIED_LOE
    assert {edit.agreement_mod_id for edit in _edits(loaded_db, agreement.id)} == {mod.id}


@then("the budget line is Executing")
def budget_line_executing(executable, loaded_db):
    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, executable.id).status == BudgetLineItemStatus.IN_EXECUTION


@then("the budget line is still Planned")
def budget_line_planned(executable, loaded_db):
    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, executable.id).status == BudgetLineItemStatus.PLANNED


@then("no edits require a contract modification")
def no_pending_edits(agreement, basic_user_auth_client):
    assert _get_pending(basic_user_auth_client, agreement.id).json["data"] == []


@then("the edit is pending again and not In Review")
def edit_pending_again(agreement, basic_user_auth_client):
    (edit,) = _get_pending(basic_user_auth_client, agreement.id).json["data"]
    assert edit["in_review"] is False


@then("I am notified that the contract modification was approved")
def notified_approved(mod_request, loaded_db):
    assert _submitter_notification(mod_request, loaded_db).title == "Contract Modification Approved"


@then("I am notified that the contract modification was declined")
def notified_declined(mod_request, loaded_db):
    assert _submitter_notification(mod_request, loaded_db).title == "Contract Modification Declined"


@then("I can send a new contract modification")
def can_send_again(agreement, basic_user_auth_client):
    response = basic_user_auth_client.post(url_for("api.agreements-contract-modifications", id=agreement.id), json={})
    assert response.status_code == 201, response.json


def _submitter_notification(mod_request, loaded_db):
    return loaded_db.scalars(
        select(ContractModificationRequestNotification).where(
            ContractModificationRequestNotification.contract_modification_request_id == mod_request["id"],
            ContractModificationRequestNotification.recipient_id == BASIC_USER_ID,
        )
    ).one()
