import datetime

import pytest
from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractType,
    User,
)
from ops_api.ops.resources.budget_line_items import POSTRequestBody
from pytest_bdd import given, scenario, then, when


@pytest.fixture(scope="function")
def context():
    return {}


def cleanup(loaded_db, context):
    # cleanup any existing data
    agreement = loaded_db.get(ContractAgreement, context["agreement"].id)
    bli = loaded_db.get(BudgetLineItem, context["bli"].id)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.commit()


@scenario("validate_draft_budget_lines.feature", "Valid Project")
def test_valid_project(loaded_db, context):
    cleanup(loaded_db, context)


@scenario("validate_draft_budget_lines.feature", "Valid Agreement Type")
def test_valid_agreement_type(loaded_db, context):
    cleanup(loaded_db, context)


@scenario("validate_draft_budget_lines.feature", "Valid Description")
def test_valid_agreement_description(loaded_db, context):
    cleanup(loaded_db, context)


@scenario("validate_draft_budget_lines.feature", "Valid Product Service Code")
def test_valid_product_service_code(loaded_db, context):
    cleanup(loaded_db, context)


@scenario("validate_draft_budget_lines.feature", "Valid Procurement Shop")
def test_valid_procurement_shop(loaded_db, context):
    cleanup(loaded_db, context)


@scenario("validate_draft_budget_lines.feature", "Valid Agreement Reason")
def test_valid_agreement_reason(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Agreement Reason - NEW_REQ does not have an Incumbent",
)
def test_valid_agreement_reason_no_incumbent(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Agreement Reason - RECOMPETE and LOGICAL_FOLLOW_ON requires an Incumbent",
)
def test_valid_agreement_reason_incumbent_required(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Project Officer",
)
def test_valid_project_officer(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Team Members",
)
def test_valid_team_members(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Description",
)
def test_valid_description(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Need By Date",
)
def test_valid_need_by_date(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid CAN",
)
def test_valid_can(loaded_db, context):
    cleanup(loaded_db, context)


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Amount",
)
def test_valid_amount(loaded_db, context):
    cleanup(loaded_db, context)


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
        procurement_shop_id=1,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
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
        procurement_shop_id=1,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with an empty string Description")
def agreement_empty_description(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        description="",
        procurement_shop_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Product Service Code")
def agreement_null_product_service_code(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        procurement_shop_id=1,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Procurement Shop")
def agreement_null_procurement_shop(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Agreement Reason")
def agreement_null_agreement_reason(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with an AgreementReason = NEW_REQ and an Incumbent")
def agreement_reason_with_incumbent(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        incumbent="CURRENT VENDOR",
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given(
    "I have an Agreement with an AgreementReason = RECOMPETE or LOGICAL_FOLLOW_ON and has a NULL or empty string Incumbent"
)
def agreement_reason_with_incumbent_required(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.RECOMPETE,
        project_officer=1,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement without a Project Officer")
def agreement_null_project_officer(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement without any Team Members")
def agreement_null_team_members(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have a valid Agreement")
def valid_agreement(loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        number="AGRXX003459217-B",
        contract_number="CT0002",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
    )
    contract_agreement.team_members.append(loaded_db.get(User, 1))
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


@when("I have a BLI in DRAFT status without a Description")
def bli_without_description(loaded_db, context):
    bli = BudgetLineItem(
        id=1000,
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


@when("I have a BLI in DRAFT status without a Need By Date")
def bli_without_need_by_date(loaded_db, context):
    bli = BudgetLineItem(
        id=1000,
        comments="blah blah",
        line_description="LI 1",
        agreement_id=context["agreement"].id,
        can_id=1,
        amount=100.12,
        status=BudgetLineItemStatus.DRAFT,
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    context["bli"] = bli


@when("I have a BLI in DRAFT status without a CAN")
def bli_without_can(loaded_db, context):
    bli = BudgetLineItem(
        id=1000,
        comments="blah blah",
        line_description="LI 1",
        agreement_id=context["agreement"].id,
        amount=100.12,
        date_needed=datetime.date(2023, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    context["bli"] = bli


@when("I have a BLI in DRAFT status without an Amount")
def bli_without_amount(loaded_db, context):
    bli = BudgetLineItem(
        id=1000,
        comments="blah blah",
        line_description="LI 1",
        agreement_id=context["agreement"].id,
        can_id=1,
        date_needed=datetime.date(2023, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        psc_fee_amount=1.23,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    context["bli"] = bli


@when("I have a BLI in DRAFT status without an Agreement")
def bli_without_agreement(loaded_db, context):
    bli = BudgetLineItem(
        id=1000,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=1,
        date_needed=datetime.date(2023, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
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


@then("I should get an error message that the BLI's Agreement must have a valid Description")
def error_message_valid_agreement_description(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI's Agreement must have a valid Product Service Code")
def error_message_valid_product_service_code(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI's Agreement must have a valid Procurement Shop")
def error_message_valid_procurement_shop(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI's Agreement must have a valid Agreement Reason")
def error_message_valid_agreement_reason(context):
    # Need to implement this to throw an error message and return 400
    ...


@then(
    "I should get an error message that the BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ"
)
def error_message_valid_agreement_reason_with_incumbent(context):
    # Need to implement this to throw an error message and return 400
    ...


@then(
    "I should get an error message that the BLI's Agreement must have an Incumbent if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
)
def error_message_valid_agreement_reason_with_incumbent_required(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI's Agreement must have a Project Officer")
def error_message_valid_project_officer(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI's Agreement must have at least one Team Member")
def error_message_valid_team_members(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI must have a Description")
def error_message_valid_description(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI must have a Need By Date")
def error_message_need_by_date(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI must have a CAN")
def error_message_can(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI must have an Amount")
def error_message_amount(context):
    # Need to implement this to throw an error message and return 400
    ...


@then("I should get an error message that the BLI must have an Agreement")
def error_message_agreement(context):
    # Need to implement this to throw an error message and return 400
    ...
