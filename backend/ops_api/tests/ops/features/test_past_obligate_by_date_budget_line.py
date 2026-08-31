import datetime

import pytest
from pytest_bdd import given, scenario, then, when

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    ServicesComponent,
)


@pytest.fixture(scope="function")
def context():
    return {}


@scenario(
    "past_obligate_by_date_budget_line.feature",
    "Administrative Power User edits a planned BLI's obligate-by date to a past date",
)
def test_power_user_edit_with_past_date(loaded_db, context): ...


@scenario(
    "past_obligate_by_date_budget_line.feature",
    "Administrative Power User creates a BLI and transitions it with a past obligate-by date",
)
def test_power_user_create_then_transition_with_past_date(loaded_db, context): ...


@scenario(
    "past_obligate_by_date_budget_line.feature",
    "Standard user is blocked from editing a planned BLI's obligate-by date to a past date",
)
def test_budget_team_edit_with_past_date_rejected(loaded_db, context): ...


@scenario(
    "past_obligate_by_date_budget_line.feature",
    "Standard user is blocked from transitioning a BLI to PLANNED with a past obligate-by date",
)
def test_budget_team_create_then_transition_with_past_date_rejected(loaded_db, context): ...


@given(
    "I am logged in as an Administrative Power User",
    target_fixture="bdd_client",
)
def bdd_power_user_client(power_user_auth_client):
    return power_user_auth_client


@given(
    "I am logged in as a Budget Team user",
    target_fixture="bdd_client",
)
def bdd_budget_team_client(budget_team_auth_client):
    return budget_team_auth_client


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

    sc = ServicesComponent(agreement_id=contract_agreement.id, number=99, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    context["agreement"] = contract_agreement
    context["services_component"] = sc


@given("I have a PLANNED BLI with a future Need By Date")
def planned_bli(loaded_db, context, test_user, test_can):
    bli = ContractBudgetLineItem(
        agreement_id=context["agreement"].id,
        line_description="Planned LI",
        amount=1000.0,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
        services_component_id=context["services_component"].id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    context["bli"] = bli


@when("the Administrative Power User PATCHes the BLI with a past Need By Date")
def power_user_patch_past_date(bdd_client, context):
    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['bli'].id}",
        json={"date_needed": "2020-06-21"},
    )


@when("the Budget Team user PATCHes the BLI with a past Need By Date")
def budget_team_patch_past_date(bdd_client, context):
    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['bli'].id}",
        json={"date_needed": "2020-06-21"},
    )


@when("the Administrative Power User POSTs a DRAFT BLI with a past Need By Date")
def power_user_post_draft_with_past_date(bdd_client, context, test_can):
    context["response_post"] = bdd_client.post(
        "/api/v1/budget-line-items/",
        json={
            "agreement_id": context["agreement"].id,
            "line_description": "New LI with past date",
            "can_id": test_can.id,
            "amount": 2000.0,
            "status": "DRAFT",
            "date_needed": "2020-06-21",
            "proc_shop_fee_percentage": 1.23,
            "services_component_id": context["services_component"].id,
        },
    )
    if context["response_post"].status_code == 201:
        context["created_bli_id"] = context["response_post"].json["id"]


@when("the Budget Team user POSTs a DRAFT BLI with a past Need By Date")
def budget_team_post_draft_with_past_date(bdd_client, context, test_can):
    context["response_post"] = bdd_client.post(
        "/api/v1/budget-line-items/",
        json={
            "agreement_id": context["agreement"].id,
            "line_description": "New LI with past date",
            "can_id": test_can.id,
            "amount": 2000.0,
            "status": "DRAFT",
            "date_needed": "2020-06-21",
            "proc_shop_fee_percentage": 1.23,
            "services_component_id": context["services_component"].id,
        },
    )
    if context["response_post"].status_code == 201:
        context["created_bli_id"] = context["response_post"].json["id"]


@when("the Administrative Power User PATCHes the new BLI to PLANNED status")
def power_user_transition_new_bli_to_planned(bdd_client, context):
    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['created_bli_id']}",
        json={"status": "PLANNED"},
    )


@when("the Budget Team user PATCHes the new BLI to PLANNED status")
def budget_team_transition_new_bli_to_planned(bdd_client, context):
    context["response_patch"] = bdd_client.patch(
        f"/api/v1/budget-line-items/{context['created_bli_id']}",
        json={"status": "PLANNED"},
    )


@then("the PATCH response is successful for the Administrative Power User")
def patch_success_power_user(context):
    assert context["response_patch"].status_code == 200


@then("the POST response creates the BLI successfully")
def post_creates_bli(context):
    assert context["response_post"].status_code == 201
    assert context["response_post"].json["id"] is not None


@then("the transition to PLANNED is successful for the Administrative Power User")
def transition_success_power_user(context):
    assert context["response_patch"].status_code == 200


@then("the PATCH is rejected with a Need By Date in the future error")
def patch_rejected_future_date_error(context):
    assert context["response_patch"].status_code == 400
    assert (
        "BLI must have a Need By Date in the future when status is not DRAFT"
        in context["response_patch"].json["errors"]["date_needed"]
    )


@then("the transition to PLANNED is rejected with a Need By Date in the future error")
def transition_rejected_future_date_error(context):
    assert context["response_patch"].status_code == 400
    assert (
        "BLI must have a Need By Date in the future when status is not DRAFT"
        in context["response_patch"].json["errors"]["date_needed"]
    )
