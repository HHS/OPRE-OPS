import datetime

import pytest
from pytest_bdd import given, parsers, scenario, then, when
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

_STATUS_BY_NAME = {
    "Draft": BudgetLineItemStatus.DRAFT,
    "Planned": BudgetLineItemStatus.PLANNED,
    "Executing": BudgetLineItemStatus.IN_EXECUTION,
}


@pytest.fixture
def original_agreement(test_user, test_project):
    return {
        "name": "CT5819-DEL-BDD",
        "contract_number": "CT5819DEL",
        "contract_type": ContractType.FIRM_FIXED_PRICE,
        "agreement_type": AgreementType.CONTRACT,
        "project_id": test_project.id,
        "product_service_code_id": 2,
        "description": "Deleting budget lines as change requests",
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


@scenario("delete_budget_line_change_request.feature", "Deleting a draft budget line is immediate")
def test_delete_draft_immediate(): ...


@scenario("delete_budget_line_change_request.feature", "Deleting a planned budget line creates a change request")
def test_delete_planned_creates_cr(): ...


@scenario("delete_budget_line_change_request.feature", "Deleting an executing budget line creates a change request")
def test_delete_executing_creates_cr(): ...


@scenario("delete_budget_line_change_request.feature", "Deletion is blocked once the agreement reaches Pre-Award")
def test_delete_blocked_pre_award(): ...


@scenario("delete_budget_line_change_request.feature", "Deletion is blocked while a change request is pending")
def test_delete_blocked_in_review(): ...


@scenario("delete_budget_line_change_request.feature", "Unauthorized user cannot delete a budget line")
def test_delete_unauthorized(): ...


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


@given(parsers.parse("I have a budget line item in {status_name} status"), target_fixture="bli")
def bli_with_status(loaded_db, agreement, test_user, test_can, status_name):
    sc = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc)
    loaded_db.commit()

    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        comments="blah blah",
        line_description="LI 1",
        amount=500000.00,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=_STATUS_BY_NAME[status_name],
        proc_shop_fee_percentage=1.23,
        created_by=test_user.id,
        services_component_id=sc.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    yield bli

    # A deletion request may have created a change request referencing this BLI; remove it first.
    loaded_db.rollback()
    loaded_db.execute(text("DELETE FROM change_request WHERE budget_line_item_id = :id"), {"id": bli_id})
    loaded_db.commit()
    persisted = loaded_db.get(ContractBudgetLineItem, bli_id)
    if persisted is not None:
        loaded_db.delete(persisted)
        loaded_db.commit()
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


@when("I delete the budget line item", target_fixture="delete_response")
def delete_bli(bdd_client, bli):
    return bdd_client.delete(f"/api/v1/budget-line-items/{bli.id}")


@then("the budget line item should be deleted immediately")
def deleted_immediately(delete_response, loaded_db, bli):
    assert delete_response.status_code == 200
    assert loaded_db.get(ContractBudgetLineItem, bli.id) is None


@then("the deletion should be sent to approval")
def sent_to_approval(delete_response):
    assert delete_response.status_code == 202


@then("the budget line item should still exist")
def bli_still_exists(loaded_db, bli):
    assert loaded_db.get(ContractBudgetLineItem, bli.id) is not None


@then("I should get a validation error")
def validation_error(delete_response):
    assert delete_response.status_code == 400


@then("I should get an error that I am not authorized")
def unauthorized(delete_response):
    assert delete_response.status_code == 403
