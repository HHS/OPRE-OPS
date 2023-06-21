import datetime

import pytest
from pytest_bdd import given, scenario, then, when

from models import AgreementType, BudgetLineItem, BudgetLineItemStatus, ContractAgreement, ContractType, DirectAgreement


@pytest.fixture()
def contract_agreement(loaded_db):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        number="BDD0999",
        contract_number="CT0999",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def contract_with_draft_bli(loaded_db, contract_agreement):
    draft_bli = BudgetLineItem(
        agreement_id=contract_agreement.id,
        comments="blah bleh bleh blah",
        line_description="LI Draft",
        amount=100.12,
        can_id=1,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(draft_bli)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(draft_bli)
    loaded_db.commit()


@pytest.fixture()
def contract_with_planned_bli(loaded_db, contract_agreement):
    planned_bli = BudgetLineItem(
        agreement_id=contract_agreement.id,
        comments="blah blah bleh blah",
        line_description="LI Planned",
        amount=200.24,
        can_id=1,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        psc_fee_amount=2.34,
        created_by=1,
    )
    loaded_db.add(planned_bli)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(planned_bli)
    loaded_db.commit()


@pytest.fixture()
def direct_agreement(loaded_db):
    direct_agreement = DirectAgreement(
        name="Feature Test Direct",
        number="BDD0969",
        payee="Somebody who needs money",
        agreement_type=AgreementType.DIRECT_ALLOCATION,
        research_project_id=1,
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


@given("I am logged in as an OPS user with the correct authorization", target_fixture="client")
def client(auth_client):
    # TODO: Authorization stuff
    return auth_client


@given("I have a contract agreement with only draft BLIs", target_fixture="agreement")
def contract_draft_bli(contract_with_draft_bli):
    return contract_with_draft_bli


@given("I have a contract agreement with non-draft BLIs", target_fixture="agreement")
def contract_non_draft_bli(contract_with_planned_bli):
    return contract_with_planned_bli


@given("I have a non-contract agreement", target_fixture="agreement")
def non_contract(direct_agreement):
    return direct_agreement


@when("I delete the agreement", target_fixture="submit_response")
def delete_agreement(client, agreement):
    resp = client.delete(f"/api/v1/agreements/{agreement.id}")
    return resp


@then("I should get a message that it was successful")
def delete_success(submit_response):
    assert submit_response.status_code == 200


@then("I should get an error message that it's invalid")
def delete_failure(submit_response):
    assert submit_response.status_code == 400
