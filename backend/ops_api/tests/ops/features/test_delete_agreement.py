import datetime
from contextlib import suppress

import pytest
from pytest_bdd import given, scenario, then, when
from sqlalchemy.orm.exc import StaleDataError

from models import (
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    DirectAgreement,
    User,
)


@given(
    "I am logged in as an OPS user with the correct authorization",
    target_fixture="client",
)
def client(auth_client):
    # TODO: Authorization stuff
    yield auth_client


@given(
    "I am logged in as an OPS user with the correct authorization but no perms",
    target_fixture="client",
)
def no_perm_client(no_perms_auth_client):
    yield no_perms_auth_client


@pytest.fixture()
def contract_agreement_project_officer(loaded_db, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_user.id,
        project_officer_id=503,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def contract_agreement_team_member(loaded_db, test_user, test_admin_user, test_project):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_user.id,
        project_officer_id=test_user.id,
        team_members=[test_admin_user],
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)

    with suppress(StaleDataError):
        loaded_db.commit()


@pytest.fixture()
def contract_agreement_not_associated(loaded_db, test_project):
    user = User(
        email="blah@example.com",
        first_name="blah",
        last_name="blah",
        division=1,
    )
    loaded_db.add(user)
    loaded_db.commit()

    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=user.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.delete(user)
    loaded_db.commit()


@pytest.fixture()
def contract_with_draft_bli(loaded_db, test_user, test_admin_user, test_can, test_project):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    draft_bli = ContractBudgetLineItem(
        agreement_id=contract_agreement.id,
        comments="blah bleh bleh blah",
        line_description="LI Draft",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(draft_bli)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(draft_bli)
    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def contract_with_planned_bli(loaded_db, test_user, test_admin_user, test_can, test_project):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    planned_bli = ContractBudgetLineItem(
        agreement_id=contract_agreement.id,
        comments="blah blah bleh blah",
        line_description="LI Planned",
        amount=200.24,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=2.34,
        created_by=test_user.id,
    )
    loaded_db.add(planned_bli)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(planned_bli)
    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def direct_agreement(loaded_db, test_project):
    direct_agreement = DirectAgreement(
        name="Feature Test Direct",
        payee="Somebody who needs money",
        agreement_type=AgreementType.DIRECT_OBLIGATION,
        project_id=test_project.id,
        created_by=503,
    )
    loaded_db.add(direct_agreement)
    loaded_db.commit()

    yield direct_agreement

    loaded_db.delete(direct_agreement)
    loaded_db.commit()


@scenario("delete_agreement.feature", "Contract Agreement with only draft BLIs")
def test_contract_draft_bli():
    pass


@scenario("delete_agreement.feature", "Contract Agreement with non-draft BLIs")
def test_contract_non_draft_bli():
    pass


@scenario("delete_agreement.feature", "Non-Contract Agreement")
def test_non_contract():
    pass


@scenario("delete_agreement.feature", "Contract Agreement as Project Officer")
def test_contract_project_officer():
    pass


@scenario("delete_agreement.feature", "Contract Agreement as Team Member")
def test_contract_team_member():
    pass


@scenario("delete_agreement.feature", "Contract Agreement I am not an authorized user for")
def test_contract_not_associated():
    pass


@given("I have a contract agreement with only draft BLIs", target_fixture="agreement")
def contract_draft_bli(contract_with_draft_bli):
    yield contract_with_draft_bli


@given("I have a contract agreement with non-draft BLIs", target_fixture="agreement")
def contract_non_draft_bli(contract_with_planned_bli):
    yield contract_with_planned_bli


@given("I have a non-contract agreement", target_fixture="agreement")
def non_contract(direct_agreement):
    yield direct_agreement


@given("I have a contract agreement as the project officer", target_fixture="agreement")
def project_officer(contract_agreement_project_officer):
    yield contract_agreement_project_officer


@given("I have a contract agreement as a team member", target_fixture="agreement")
def team_member(contract_agreement_team_member):
    yield contract_agreement_team_member


@given("I have a contract agreement I am not allowed to delete", target_fixture="agreement")
def not_associated(contract_agreement_not_associated):
    yield contract_agreement_not_associated


@when("I delete the agreement", target_fixture="submit_response")
def delete_agreement(client, agreement):
    resp = client.delete(f"/api/v1/agreements/{agreement.id}")
    return resp


@when(
    "I delete the agreement with a user that has no perms",
    target_fixture="submit_response",
)
def delete_agreement_no_perms(client, agreement):
    resp = client.delete(f"/api/v1/agreements/{agreement.id}")
    return resp


@then("I should get a message that it was successful")
def delete_success(submit_response):
    assert submit_response.status_code == 200


@then("I should get an error message that it's invalid")
def delete_failure(submit_response):
    assert submit_response.status_code == 400


@then("I should get an error message that I'm not authorized")
def delete_failure_not_authorized(submit_response):
    assert submit_response.status_code == 403
