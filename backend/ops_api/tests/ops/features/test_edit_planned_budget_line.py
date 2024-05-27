import datetime

import pytest
from pytest_bdd import given, scenario, then, when

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    User,
)
from ops_api.ops.schemas.budget_line_items import RequestBodySchema


@pytest.fixture
def original_agreement():
    return {
        "name": "CTXX12399",
        "contract_number": "CT0002",
        "contract_type": ContractType.FIRM_FIXED_PRICE,
        "agreement_type": AgreementType.CONTRACT,
        "project_id": 1,
        "product_service_code_id": 2,
        "description": "Using Innovative Data...",
        "agreement_reason": AgreementReason.NEW_REQ,
        "project_officer_id": 1,
        "procurement_shop_id": 1,
        "created_by": 1,
    }


@given(
    "I am logged in as an OPS user",
    target_fixture="bdd_client",
)
def bdd_client(auth_client):
    yield auth_client


@given(
    "I am logged in as an OPS user with the correct authorization but no perms",
    target_fixture="bdd_client",
)
def no_perms_client(no_perms_auth_client):
    yield no_perms_auth_client


@scenario("edit_planned_budget_line.feature", "Successful Edit as Owner")
def test_edit_planned_budget_line_owner(): ...


@scenario("edit_planned_budget_line.feature", "Successful Edit as Project Officer")
def test_edit_planned_budget_line_project_officer(): ...


@scenario("edit_planned_budget_line.feature", "Successful Edit as a Team Member")
def test_edit_planned_budget_line_team_member(): ...


@scenario("edit_planned_budget_line.feature", "Successful Edit as a member of the Budget Team")
def test_edit_planned_budget_line_budget_team(): ...


@scenario("edit_planned_budget_line.feature", "Unsuccessful Edit")
def test_edit_planned_budget_line_unauthorized(): ...


@given(
    "I have a Contract Agreement as the original Agreement owner",
    target_fixture="agreement",
)
def agreement_owner(loaded_db, original_agreement):
    original_agreement["created_by"] = 4
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement as the Project Officer", target_fixture="agreement")
def agreement_project_officer(loaded_db, original_agreement):
    original_agreement["project_officer_id"] = 4
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement as a Team Member", target_fixture="agreement")
def agreement_team_member(loaded_db, original_agreement):
    user = loaded_db.get(User, 4)
    contract_agreement = ContractAgreement(**original_agreement)
    contract_agreement.team_members = [user]
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given(
    "I have a Contract Agreement as a member of the Budget Team",
    target_fixture="agreement",
)
def agreement_budget_team(loaded_db, original_agreement):
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement as an unauthorized user", target_fixture="agreement")
def agreement_unauthorized(loaded_db, original_agreement):
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a budget line item in Planned status", target_fixture="bli")
def planned_bli(loaded_db, agreement):
    planned_bli = BudgetLineItem(
        agreement_id=agreement.id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=1,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )
    loaded_db.add(planned_bli)
    loaded_db.commit()

    yield planned_bli

    loaded_db.delete(planned_bli)
    loaded_db.commit()


@given("I edit the budget line item to change a value", target_fixture="edited_bli")
def edit_bli(bli):
    bli.line_description = "Updated Description"
    yield bli


@when("I submit the budget line item", target_fixture="submit_response")
def submit(bdd_client, edited_bli):
    field_names = {f for f in RequestBodySchema().fields.keys()} | {"agreement_id"}
    data = {k: v for k, v in edited_bli.to_dict().items() if k in field_names}
    resp = bdd_client.put(f"/api/v1/budget-line-items/{edited_bli.id}", json=data)
    return resp


@then("I should get an error that I am not authorized")
def invalid(submit_response):
    assert submit_response.status_code == 401


@then("I should get a message that it was successful")
def success(submit_response):
    # TODO: what should these tests do now that change requests are created and the response is 202?
    # just changing this from 200 to 202 for now
    assert submit_response.status_code == 202
