import datetime
from dataclasses import fields

import pytest
from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    Group,
    Role,
    User,
)
from ops_api.ops.resources.budget_line_item_schemas import RequestBody
from pytest_bdd import given, scenario, then, when


@pytest.fixture
def original_agreement():
    return {
        "name": "CTXX12399",
        "contract_number": "CT0002",
        "contract_type": ContractType.RESEARCH,
        "agreement_type": AgreementType.CONTRACT,
        "research_project_id": 1,
        "product_service_code_id": 2,
        "description": "Using Innovative Data...",
        "agreement_reason": AgreementReason.NEW_REQ,
        "project_officer_id": 1,
        "procurement_shop_id": 1,
        "created_by": 1,
    }


@pytest.fixture
def not_admin_user(loaded_db):
    user = loaded_db.get(User, 4)
    user_role = loaded_db.get(Role, 2)
    roles = user.roles
    user.roles = [user_role]
    loaded_db.add(user)
    loaded_db.commit()
    yield user

    user.roles = roles
    loaded_db.add(user)
    loaded_db.commit()


@pytest.fixture
def not_budget_team(loaded_db, not_admin_user):
    user = not_admin_user
    groups = user.groups
    user.groups = []
    loaded_db.add(user)
    loaded_db.commit()
    yield user

    user.groups = groups
    loaded_db.add(user)
    loaded_db.commit()


@pytest.fixture
def in_budget_team(loaded_db, not_admin_user):
    user = not_admin_user
    budget_team = loaded_db.get(Group, 1)
    groups = user.groups
    user.groups = [budget_team]
    loaded_db.add(user)
    loaded_db.commit()

    yield user

    user.groups = groups
    loaded_db.add(user)
    loaded_db.commit()


@scenario("edit_planned_budget_line.feature", "Successful Edit as Owner")
def test_edit_planned_budget_line_owner():
    ...


@scenario("edit_planned_budget_line.feature", "Successful Edit as Project Officer")
def test_edit_planned_budget_line_project_officer():
    ...


@scenario("edit_planned_budget_line.feature", "Successful Edit as a Team Member")
def test_edit_planned_budget_line_team_member():
    ...


@scenario("edit_planned_budget_line.feature", "Successful Edit as a member of the Budget Team")
def test_edit_planned_budget_line_budget_team():
    ...


@scenario("edit_planned_budget_line.feature", "Unsuccessful Edit")
def test_edit_planned_budget_line_unauthorized():
    ...


@given("I am logged in as an OPS user")
def client(auth_client):
    yield auth_client


@given(
    "I have a Contract Agreement as the original Agreement owner",
    target_fixture="agreement",
)
def agreement_owner(loaded_db, original_agreement, not_budget_team):
    original_agreement["created_by"] = 4
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement as the Project Officer", target_fixture="agreement")
def agreement_project_officer(loaded_db, original_agreement, not_budget_team):
    original_agreement["project_officer_id"] = 4
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement as a Team Member", target_fixture="agreement")
def agreement_team_member(loaded_db, original_agreement, not_budget_team):
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
def agreement_budget_team(loaded_db, original_agreement, in_budget_team):
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement as an unauthorized user", target_fixture="agreement")
def agreement_unauthorized(loaded_db, original_agreement, not_budget_team):
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
def submit(client, edited_bli):
    field_names = {f.name for f in fields(RequestBody)} | {"agreement_id"}
    data = {k: v for k, v in edited_bli.to_dict().items() if k in field_names}
    resp = client.put(f"/api/v1/budget-line-items/{edited_bli.id}", json=data)
    return resp


@then("I should get an error that I am not authorized")
def invalid(submit_response):
    if submit_response.status_code != 401:
        print("-" * 20)
        print(submit_response.data)
        print("-" * 20)
    assert submit_response.status_code == 401


@then("I should get a message that it was successful")
def success(submit_response):
    if submit_response.status_code != 200:
        print("-" * 20)
        print(submit_response.data)
        print("-" * 20)
    assert submit_response.status_code == 200
