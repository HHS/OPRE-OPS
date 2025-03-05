import datetime

import pytest
from pytest_bdd import given, scenario, then, when

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
)


@pytest.fixture(scope="function")
def context():
    return {}


def cleanup(loaded_db, context):
    # cleanup any existing data
    if "agreement" in context:
        agreement = loaded_db.get(ContractAgreement, context["agreement"].id)
        loaded_db.delete(agreement)

    if "initial_bli_for_put" in context:
        bli = loaded_db.get(BudgetLineItem, context["initial_bli_for_put"].id)
        loaded_db.delete(bli)

    if "initial_bli_for_patch" in context:
        bli = loaded_db.get(BudgetLineItem, context["initial_bli_for_patch"].id)
        loaded_db.delete(bli)

    if "bli" in context:
        bli = loaded_db.get(BudgetLineItem, context["bli"].id)
        loaded_db.delete(bli)

    loaded_db.commit()


@scenario("validate_draft_budget_lines.feature", "Valid Project")
def test_valid_project(loaded_db, context): ...


@scenario("validate_draft_budget_lines.feature", "Valid Agreement")
def test_valid_agreement(loaded_db, context): ...


@scenario("validate_draft_budget_lines.feature", "Valid Agreement Description")
def test_valid_agreement_description(loaded_db, context): ...


@scenario("validate_draft_budget_lines.feature", "Valid Product Service Code")
def test_valid_product_service_code(loaded_db, context): ...


@scenario("validate_draft_budget_lines.feature", "Valid Procurement Shop")
def test_valid_procurement_shop(loaded_db, context): ...


@scenario("validate_draft_budget_lines.feature", "Valid Agreement Reason")
def test_valid_agreement_reason(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Agreement Reason - RECOMPETE and LOGICAL_FOLLOW_ON requires a Vendor",
)
def test_valid_agreement_reason_vendor_required(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Project Officer",
)
def test_valid_project_officer(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Need By Date: Both NULL",
)
def test_valid_need_by_date_both_null(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Need By Date: Request Empty",
)
def test_valid_need_by_date_request_empty(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Need By Date: Both Empty",
)
def test_valid_need_by_date_both_empty(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Need By Date: Future Date",
)
def test_valid_need_by_date_exists_future_date(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid CAN: Both NULL",
)
def test_valid_can_both_null(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid CAN: Request Empty",
)
def test_valid_can_request_empty(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Amount: Both NULL",
)
def test_valid_amount_both_null(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Amount: Request Empty",
)
def test_valid_amount_request_empty(loaded_db, context): ...


@scenario(
    "validate_draft_budget_lines.feature",
    "Valid Amount: Greater than 0",
)
def test_valid_amount_greater_than_zero(loaded_db, context): ...


@pytest.fixture()
def setup_and_teardown(loaded_db, context):
    ...
    yield
    cleanup(loaded_db, context)


@given(
    "I am logged in as an OPS user",
    target_fixture="bdd_client",
)
def bdd_client(budget_team_auth_client):
    return budget_team_auth_client


@given("I have an Agreement with a NULL Project")
def agreement_null_project(loaded_db, context, test_user):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        awarding_entity_id=1,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Agreement Type")
def agreement_null_agreement_type(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        project_id=test_project.id,
        awarding_entity_id=1,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
    )
    contract_agreement.team_members.append(test_user)
    contract_agreement.agreement_type = None
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with an empty string Description")
def agreement_empty_description(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        description="",
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Product Service Code")
def agreement_null_product_service_code(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        awarding_entity_id=1,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Procurement Shop")
def agreement_null_procurement_shop(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with a NULL Agreement Reason")
def agreement_null_agreement_reason(loaded_db, context, test_user, test_project, test_vendor):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        vendor_id=test_vendor.id,
        project_officer_id=test_user.id,
        awarding_entity_id=1,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement with an AgreementReason = NEW_REQ and a Vendor")
def agreement_reason_with_vendor(loaded_db, context, test_user, test_vendor, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        vendor_id=test_vendor.id,
        project_officer_id=test_user.id,
        awarding_entity_id=1,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given(
    "I have an Agreement with an AgreementReason = RECOMPETE or LOGICAL_FOLLOW_ON and has a NULL or empty string Vendor"
)
def agreement_reason_with_vendor_required(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.RECOMPETE,
        project_officer_id=test_user.id,
        awarding_entity_id=1,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement without a Project Officer")
def agreement_null_project_officer(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        awarding_entity_id=1,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have an Agreement without any Team Members")
def agreement_null_team_members(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
        awarding_entity_id=1,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@given("I have a valid Agreement")
def valid_agreement(loaded_db, context, test_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="CT0002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Using Innovative Data...",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
        awarding_entity_id=1,
    )
    contract_agreement.team_members.append(test_user)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement


@when("I have a BLI in DRAFT status")
def bli(loaded_db, context, test_user, test_can):
    initial_bli_for_put = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I have a BLI in DRAFT status without a Need By Date")
def bli_without_need_by_date(loaded_db, context, test_user, test_can):
    initial_bli_for_put = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I have a BLI in DRAFT status with a Need By Date in the past or today")
def bli_past_need_by_date(loaded_db, context, test_user, test_can):
    initial_bli_for_put = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2022, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2022, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I have a BLI in DRAFT status without a CAN")
def bli_without_can(loaded_db, context, test_user):
    initial_bli_for_put = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I have a BLI in DRAFT status without an Amount")
def bli_without_amount(loaded_db, context, test_user, test_can):
    initial_bli_for_put = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I have a BLI in DRAFT status with an Amount less than or equal to 0")
def bli_with_amount_less_than_or_equal_to_zero(loaded_db, context, test_user, test_can):
    initial_bli_for_put = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=0,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        comments="blah blah",
        line_description="LI 1",
        amount=0,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I have a BLI in DRAFT status without an Agreement")
def bli_without_agreement(loaded_db, context, test_user, test_can):
    initial_bli_for_put = ContractBudgetLineItem(
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    initial_bli_for_patch = ContractBudgetLineItem(
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
    )
    loaded_db.add(initial_bli_for_put)
    loaded_db.add(initial_bli_for_patch)
    loaded_db.commit()

    context["initial_bli_for_put"] = initial_bli_for_put
    context["initial_bli_for_patch"] = initial_bli_for_patch


@when("I submit a BLI to move to IN_REVIEW status")
def submit(bdd_client, context):
    data = {
        "agreement_id": context["agreement"].id,
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "can_id": 501,
        "amount": 200.24,
        "status": "PLANNED",
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@when("I submit a BLI to move to IN_REVIEW status (without an Agreement)")
def submit_without_agreement(bdd_client, context):
    data = {
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "can_id": 501,
        "amount": 200.24,
        "status": "PLANNED",
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@when("I submit a BLI to move to IN_REVIEW status (without Need By Date)")
def submit_without_need_by_date(bdd_client, context):
    data = {
        "agreement_id": context["agreement"].id,
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "can_id": 501,
        "amount": 200.24,
        "status": "PLANNED",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@when("I submit a BLI to move to IN_REVIEW status with an empty Need By Date")
def submit_empty_need_by_date(bdd_client, context):
    data = {
        "agreement_id": context["agreement"].id,
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "can_id": 501,
        "amount": 200.24,
        "status": "PLANNED",
        "date_needed": "  ",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@when("I submit a BLI to move to IN_REVIEW status (without a CAN)")
def submit_without_can(bdd_client, context):
    data = {
        "agreement_id": context["agreement"].id,
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "amount": 200.24,
        "status": "PLANNED",
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@when("I submit a BLI to move to IN_REVIEW status (without an Amount)")
def submit_without_amount(bdd_client, context):
    data = {
        "agreement_id": context["agreement"].id,
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "can_id": 2,
        "status": "PLANNED",
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@when("I submit a BLI to move to IN_REVIEW status (with an Amount less than or equal to 0)")
def submit_amount_less_than_zero(bdd_client, context):
    data = {
        "agreement_id": context["agreement"].id,
        "line_description": "Updated LI 1",
        "comments": "hah hah",
        "can_id": 2,
        "amount": -200.24,
        "status": "PLANNED",
        "date_needed": "2044-01-01",
        "proc_shop_fee_percentage": 2.34,
    }

    context["response_put"] = bdd_client.put(
        f"/api/v1/budget-line-items/{context['initial_bli_for_put'].id}", json=data
    )

    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['initial_bli_for_patch'].id}",
        json={
            "status": "PLANNED",
        },
    )


@then("I should get an error message that the BLI's Agreement must have a valid Project")
def error_message_valid_project(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have a Project when status is not " "DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have a Project when status is not " "DRAFT"]
    }


@then("I should get an error message that the BLI's Agreement must have a valid Agreement Type")
def error_message_valid_agreement_type(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have an AgreementType when status is not " "DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have an AgreementType when status is not " "DRAFT"]
    }


@then("I should get an error message that the BLI's Agreement must have a valid Description")
def error_message_valid_agreement_description(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have a Description when status is not " "DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have a Description when status is not " "DRAFT"]
    }


@then("I should get an error message that the BLI's Agreement must have a valid Product Service Code")
def error_message_valid_product_service_code(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have a ProductServiceCode when status is not DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have a ProductServiceCode when status is not DRAFT"]
    }


@then("I should get an error message that the BLI's Agreement must have a valid Procurement Shop")
def error_message_valid_procurement_shop(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have a ProcurementShop when status is not DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have a ProcurementShop when status is not DRAFT"]
    }


@then("I should get an error message that the BLI's Agreement must have a valid Agreement Reason")
def error_message_valid_agreement_reason(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have an AgreementReason when status is not DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have an AgreementReason when status is not DRAFT"]
    }


@then(
    "I should get an error message that the BLI's Agreement cannot have a Vendor if it has an Agreement Reason of NEW_REQ"
)
def error_message_valid_agreement_reason_with_Vendor(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement cannot have a Vendor if it has an Agreement Reason of NEW_REQ"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement cannot have a Vendor if it has an Agreement Reason of NEW_REQ"]
    }


@then(
    "I should get an error message that the BLI's Agreement must have a Vendor if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
)
def error_message_valid_agreement_reason_with_vendor_required(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": [
            "BLI's Agreement must have a Vendor if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
        ]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": [
            "BLI's Agreement must have a Vendor if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
        ]
    }


@then("I should get an error message that the BLI's Agreement must have a Project Officer")
def error_message_valid_project_officer(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI's Agreement must have a ProjectOfficer when status is not DRAFT"]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI's Agreement must have a ProjectOfficer when status is not DRAFT"]
    }


@then("I should get an error message that the BLI must have a Need By Date")
def error_message_need_by_date(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {"_schema": ["BLI must valid a valid Need By Date when status is not DRAFT"]}
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI must valid a valid Need By Date when status is not DRAFT"]
    }


@then("I should get an error message that the BLI must have a Need By Date (for PUT only)")
def error_message_need_by_date_put_only(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "date_needed": ["Not a valid date."],
    }
    assert context["response_patch"].status_code == 202


@then("I should get an error message that the BLI must have a Need By Date (with empty Request)")
def error_message_need_by_date_empty_request(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "date_needed": ["Not a valid date."],
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI must valid a valid Need By Date when status is not DRAFT"]
    }


@then("I should get an error message that the BLI must have a CAN")
def error_message_can(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI must have a valid CAN when status is not DRAFT"],
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {"_schema": ["BLI must have a valid CAN when status is not DRAFT"]}


@then("I should get an error message that the BLI must have a CAN (for PUT only)")
def error_message_can_put_only(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI must have a valid CAN when status is not DRAFT"],
    }
    assert context["response_patch"].status_code == 202


@then("I should get an error message that the BLI must have an Amount")
def error_message_amount(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI must have a valid Amount when status is not DRAFT"],
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {"_schema": ["BLI must have a valid Amount when status is not DRAFT"]}


@then("I should get an error message that the BLI must have an Amount (for PUT only)")
def error_message_amount_put_only(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI must have a valid Amount when status is not DRAFT"],
    }
    assert context["response_patch"].status_code == 202


@then("I should get an error message that the BLI must have an Agreement")
def error_message_agreement(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": ["BLI must have an Agreement when status is not DRAFT"],
        "agreement_id": ["Missing data for required field."],
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {"_schema": ["BLI must have an Agreement when status is not DRAFT"]}


@then("I should get an error message that the BLI must have a Need By Date in the future")
def error_message_future_need_by_date(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "date_needed": ["Not a valid date."],
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": ["BLI must valid a Need By Date in the future when status is not DRAFT"]
    }


@then("I should get an error message that the BLI must have an Amount greater than 0")
def error_message_amount_less_than_or_equal_to_zero(context, setup_and_teardown):
    assert context["response_put"].status_code == 400
    assert context["response_put"].json == {
        "_schema": [
            "BLI must be a valid Amount (greater than zero) when status is not DRAFT",
        ]
    }
    assert context["response_patch"].status_code == 400
    assert context["response_patch"].json == {
        "_schema": [
            "BLI must be a valid Amount (greater than zero) when status is not DRAFT",
        ]
    }
