import datetime

import pytest
from flask import current_app
from pytest_bdd import given, scenario, then, when
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerType,
    ServicesComponent,
)
from ops_api.ops.schemas.budget_line_items import RequestBodySchema


@pytest.fixture
def original_agreement(test_user, test_project):
    return {
        "name": "CT5819-BDD",
        "contract_number": "CT5819",
        "contract_type": ContractType.FIRM_FIXED_PRICE,
        "agreement_type": AgreementType.CONTRACT,
        "project_id": test_project.id,
        "product_service_code_id": 2,
        "description": "Editing executing budget lines",
        "agreement_reason": AgreementReason.NEW_REQ,
        "project_officer_id": test_user.id,
        "awarding_entity_id": 1,
        "created_by": test_user.id,
    }


@given("I am logged in as an OPS user", target_fixture="bdd_client")
def bdd_client(auth_client):
    yield auth_client


@given("I am logged in as a basic user", target_fixture="bdd_client")
def bdd_basic_user_client(basic_user_auth_client):
    yield basic_user_auth_client


@scenario("edit_executing_budget_line.feature", "Non-budget edit on an executing budget line applies directly")
def test_edit_executing_non_budget_direct(): ...


@scenario("edit_executing_budget_line.feature", "Budget edit on an executing budget line is routed to a change request")
def test_edit_executing_budget_routed_to_cr(): ...


@scenario("edit_executing_budget_line.feature", "Editing is blocked once the agreement reaches Pre-Award")
def test_edit_executing_blocked_pre_award(): ...


@scenario("edit_executing_budget_line.feature", "Editing is blocked while a change request is pending")
def test_edit_executing_blocked_in_review(): ...


@scenario("edit_executing_budget_line.feature", "Unauthorized user cannot edit an executing budget line")
def test_edit_executing_unauthorized(): ...


@given("I have a Contract Agreement as the Project Officer", target_fixture="agreement")
def agreement_project_officer(loaded_db, original_agreement, test_admin_user):
    original_agreement["project_officer_id"] = test_admin_user.id
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.rollback()
    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a Contract Agreement without the user as a team member", target_fixture="agreement")
def agreement_unauthorized(loaded_db, original_agreement):
    contract_agreement = ContractAgreement(**original_agreement)
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.rollback()
    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@given("I have a budget line item in Executing status", target_fixture="bli")
def executing_bli(loaded_db, agreement, test_user, test_can):
    sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        comments="blah blah",
        line_description="LI 1",
        amount=100.12,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.IN_EXECUTION,
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
        services_component_id=sc.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    yield bli

    # A budget edit may have created a change request referencing this BLI; remove it first.
    # ChangeRequest uses single-table inheritance, so budget_line_item_id lives on change_request.
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM change_request WHERE budget_line_item_id = :id"), {"id": bli_id})
    loaded_db.commit()
    loaded_db.delete(bli)
    loaded_db.delete(sc)
    loaded_db.commit()


@given("the agreement has reached Pre-Award")
def agreement_at_pre_award(loaded_db, agreement, bli):
    tracker = ProcurementTracker(
        agreement_id=agreement.id,
        status=ProcurementTrackerStatus.ACTIVE,
        tracker_type=ProcurementTrackerType.DEFAULT,
        active_step_number=5,
    )
    loaded_db.add(tracker)
    loaded_db.commit()
    tracker_id = tracker.id

    yield

    # ProcurementTracker is versioned; clean up with raw SQL to avoid continuum StaleDataError.
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM default_procurement_tracker WHERE id = :id"), {"id": tracker_id})
    loaded_db.execute(text("DELETE FROM procurement_tracker WHERE id = :id"), {"id": tracker_id})
    loaded_db.commit()


@given("the budget line item has a change request in review")
def bli_with_change_request_in_review(loaded_db, agreement, bli, test_user):
    cr = BudgetLineItemChangeRequest(
        budget_line_item_id=bli.id,
        agreement_id=agreement.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"amount": 200.50},
        created_by=test_user.id,
    )
    loaded_db.add(cr)
    loaded_db.commit()

    yield

    loaded_db.delete(cr)
    loaded_db.commit()


@given("I edit the budget line item description", target_fixture="edit_overrides")
def edit_bli_description(bli):
    # Record the change as an override rather than mutating the (committed, attached) BLI, which
    # would autoflush the new value to the DB before the PUT and erase the diff.
    current_app.config["SKIP_SETTING_CREATED_BY"] = True
    yield {"line_description": "Updated Description"}


@given("I edit the budget line item amount", target_fixture="edit_overrides")
def edit_bli_amount(bli):
    yield {"amount": 200.50}


@when("I submit the budget line item", target_fixture="submit_response")
def submit(bdd_client, bli, edit_overrides):
    field_names = {f for f in RequestBodySchema().fields.keys()} | {"agreement_id"}
    # Build a complete PUT body from the BLI's persisted values, then apply the edit override.
    data = {k: v for k, v in bli.to_dict().items() if k in field_names}
    data.update(edit_overrides)
    resp = bdd_client.put(f"/api/v1/budget-line-items/{bli.id}", json=data)
    return resp


@then("I should get a message that it was successful")
def success(submit_response):
    assert submit_response.status_code == 200


@then("I should get a message that it was sent to approval")
def sent_to_approval(submit_response):
    assert submit_response.status_code == 202
    assert submit_response.json["in_review"] is True


@then("I should get a validation error")
def validation_error(submit_response):
    assert submit_response.status_code == 400


@then("I should get an error that I am not authorized")
def unauthorized(submit_response):
    assert submit_response.status_code == 403
