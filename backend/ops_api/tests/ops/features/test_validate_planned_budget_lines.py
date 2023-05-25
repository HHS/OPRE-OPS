import datetime

import pytest
from models import AgreementType, BudgetLineItem, BudgetLineItemStatus, ContractAgreement, ContractType
from ops_api.ops.resources.budget_line_items import POSTRequestBody
from pytest_bdd import given, scenario, then, when


@pytest.fixture(scope="function")
def context():
    return {}


@scenario("validate_planned_budget_lines.feature", "Valid Project")
def test_valid_project(loaded_db, context):
    # cleanup any existing data
    agreement = loaded_db.get(ContractAgreement, context["agreement"].id)
    bli = loaded_db.get(BudgetLineItem, context["bli"].id)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()


@scenario("validate_planned_budget_lines.feature", "Valid Agreement Type")
def test_valid_agreement_type(loaded_db, context):
    # cleanup any existing data
    agreement = loaded_db.get(ContractAgreement, context["agreement"].id)
    bli = loaded_db.get(BudgetLineItem, context["bli"].id)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()


@given("I am logged in as an OPS user")
def client(auth_client):
    return auth_client


@given("I have an Agreement with a NULL Project")
def agreement_null_project(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Agreement Type")
def agreement_null_agreement_type(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        product_service_code_id=2,
        research_project_id=1,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@when("I have a BLI in DRAFT status")
def bli(loaded_db, context):
    bli = BudgetLineItem(
        id=1000,
        line_description="LI 1",
        comments="blah blah",
        agreement_id=context["agreement"].id,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2023, 1, 1),
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    context["bli"] = bli


@when("I submit a BLI to move to IN_REVIEW status")
def response(client, context):
    data = POSTRequestBody(
        line_description="Updated LI 1",
        comments="hah hah",
        agreement_id=context["agreement"].id,
        can_id=2,
        amount=200.24,
        status="UNDER_REVIEW",
        date_needed="2024-01-01",
        psc_fee_amount=2.34,
    )

    context["response"] = client.put("/api/v1/budget-line-items/1000", json=data.__dict__)


@then("I should get an error message that the BLI's Agreement must have a valid Project")
def error_message_valid_project(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI's Agreement must have a valid Agreement Type")
def error_message_valid_agreement_type(context):
    # Need to implement this to throw an error message and return 400
    ...
