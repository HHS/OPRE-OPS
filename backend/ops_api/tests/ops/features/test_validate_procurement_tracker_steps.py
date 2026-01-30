import uuid
from datetime import date

import pytest
from pytest_bdd import given, scenario, then, when
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    AwardType,
    ContractAgreement,
    ContractType,
    DefaultProcurementTracker,
    ProcurementAction,
    ProcurementActionStatus,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStep,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    ProcurementTrackerType,
)


@pytest.fixture(scope="function")
def context():
    return {}


def cleanup(loaded_db, context):
    """Clean up all resources created during the test using raw SQL to bypass ORM versioning."""
    try:
        # Use raw SQL to delete, bypassing SQLAlchemy Continuum versioning
        # This prevents StaleDataError when version tables are out of sync
        # Delete in reverse order of foreign key dependencies

        # Delete ProcurementTrackerStep first (has FK to ProcurementTracker)
        if "procurement_tracker_step" in context and context["procurement_tracker_step"].id is not None:
            step_id = context["procurement_tracker_step"].id
            # Ensure tracker_id is an int before using it in the query for safety reasons
            if isinstance(step_id, int):
                loaded_db.execute(text("DELETE FROM procurement_tracker_step WHERE id = :id"), {"id": step_id})

        # Delete ProcurementTracker (has FK to Agreement)
        # Uses joined-table inheritance: default_procurement_tracker -> procurement_tracker
        if "procurement_tracker" in context and context["procurement_tracker"].id is not None:
            tracker_id = context["procurement_tracker"].id
            # Ensure tracker_id is an int before using it in the query for safety reasons
            if isinstance(tracker_id, int):
                # Delete from child table first
                loaded_db.execute(text("DELETE FROM default_procurement_tracker WHERE id = :id"), {"id": tracker_id})
                # Then from parent table
                loaded_db.execute(text("DELETE FROM procurement_tracker WHERE id = :id"), {"id": tracker_id})

        # Delete ContractAgreement last
        # Uses joined-table inheritance: contract_agreement -> agreement
        if "agreement" in context and context["agreement"].id is not None:
            agreement_id = context["agreement"].id
            # Ensure tracker_id is an int before using it in the query for safety reasons
            if isinstance(agreement_id, int):
                # Delete from child table first (contract_agreement)
                loaded_db.execute(text("DELETE FROM contract_agreement WHERE id = :id"), {"id": agreement_id})
                # Then from parent table (agreement)
                loaded_db.execute(text("DELETE FROM agreement WHERE id = :id"), {"id": agreement_id})

        loaded_db.commit()
    except Exception as e:
        loaded_db.rollback()
        # Don't raise during cleanup to avoid masking test failures
        print(f"Error during cleanup: {e}")


@scenario(
    "validate_procurement_tracker_steps.feature",
    "Valid Procurement Step Update",
)
def test_validate_updating_procurement_tracker_step_with_valid_data(): ...


@scenario(
    "validate_procurement_tracker_steps.feature",
    "User belongs to Agreement",
)
def test_validate_updating_procurement_tracker_step_user_belongs_to_agreement(): ...


@scenario("validate_procurement_tracker_steps.feature", "Valid Task Completed By")
def test_validate_updating_procurement_tracker_step_with_valid_task_completed_by(): ...


@scenario("validate_procurement_tracker_steps.feature", "Valid Completion Date")
def test_validate_updating_procurement_tracker_step_with_valid_completion_date(): ...


@scenario("validate_procurement_tracker_steps.feature", "Validate no future completion date for acquisition planning")
def test_validate_no_future_completion_date_for_acquisition_planning(): ...


@scenario("validate_procurement_tracker_steps.feature", "Valid status")
def test_validate_updating_procurement_tracker_step_with_valid_status(): ...


@scenario(
    "validate_procurement_tracker_steps.feature",
    "When no presolicitation package is sent to proc shop, the request is valid with unfilled request",
)
def test_validate_updating_procurement_tracker_step_without_presolicitation_package(): ...


@scenario(
    "validate_procurement_tracker_steps.feature",
    "Cannot update completed procurement tracker step",
)
def test_cannot_update_completed_procurement_tracker_step(): ...


@scenario(
    "validate_procurement_tracker_steps.feature",
    "Validate Procurement Tracker Step exists",
)
def test_validate_procurement_tracker_step_exists(): ...


@scenario(
    "validate_procurement_tracker_steps.feature",
    "Complete Procurement Tracker",
)
def test_complete_procurement_tracker(): ...


@pytest.fixture()
def setup_and_teardown(loaded_db, context):
    ...
    yield
    cleanup(loaded_db, context)


@given("I am logged in as an OPS user", target_fixture="bdd_client")
def bdd_client(basic_user_auth_client):
    return basic_user_auth_client


@given("I have a Contract Agreement with OPS user as a team member")
def agreement_with_ops_user(bdd_client, test_non_admin_user, loaded_db, context):
    contract_agreement = ContractAgreement(
        name=str(uuid.uuid4()),
        contract_number="CT1234",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        description="Test Contract Agreement",
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_non_admin_user.id,  # The id of the user in our auth client
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement
    context["user_id"] = test_non_admin_user.id


@given("I have a Contract Agreement with OPS user as a team member and a new award procurement action")
def agreement_with_ops_user_and_procurement_action(bdd_client, test_non_admin_user, loaded_db, context):
    contract_agreement = ContractAgreement(
        name=str(uuid.uuid4()),
        contract_number="CT1234",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        description="Test Contract Agreement",
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_non_admin_user.id,  # The id of the user in our auth client
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()
    loaded_db.flush()

    # Create a new procurement action associated with the agreement
    procurement_action = ProcurementAction(
        agreement_id=contract_agreement.id,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.PLANNED,  # Initial status
    )
    loaded_db.add(procurement_action)
    loaded_db.commit()
    loaded_db.flush()

    context["agreement"] = contract_agreement
    context["user_id"] = test_non_admin_user.id
    context["procurement_action"] = procurement_action


@given("I have a Contract Agreement without OPS user as a team member")
def agreement_without_ops_user(bdd_client, test_non_admin_user, loaded_db, context):
    contract_agreement = ContractAgreement(
        name="ABCD12345",
        contract_number="CT99999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        description="Test Contract Agreement",
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement
    context["user_id"] = test_non_admin_user.id


@given("I have a procurement tracker with an empty step number 1")
def procurement_tracker_with_empty_step(loaded_db, context):
    agreement = context["agreement"]
    procurement_tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id, status=ProcurementTrackerStatus.ACTIVE, created_by=agreement.created_by
    )
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    # Extract step 1 from the procurement tracker
    step1 = next((step for step in procurement_tracker.steps if step.step_number == 1), None)

    context["procurement_tracker"] = procurement_tracker
    context["procurement_tracker_step"] = step1


@given("I have a procurement tracker with a completed step 1")
def procurement_tracker_with_completed_step(loaded_db, context):
    agreement = context["agreement"]

    procurement_tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id, status=ProcurementTrackerStatus.ACTIVE, created_by=agreement.created_by
    )
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    # Extract step 1 from the procurement tracker
    step1 = next((step for step in procurement_tracker.steps if step.step_number == 1), None)
    step1.status = ProcurementTrackerStepStatus.COMPLETED
    step1.step_completed_date = date.today()
    loaded_db.add(step1)
    loaded_db.commit()

    context["procurement_tracker"] = procurement_tracker
    context["procurement_tracker_step"] = step1


@given("I have a procurement tracker with no steps")
def procurement_tracker_no_steps(loaded_db, context):
    agreement = context["agreement"]

    procurement_tracker = ProcurementTracker(agreement_id=agreement.id, tracker_type=ProcurementTrackerType.DEFAULT)
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    unadded_step_1 = ProcurementTrackerStep(
        procurement_tracker_id=procurement_tracker.id,
        step_number=1,
        status=ProcurementTrackerStepStatus.PENDING,
        step_type=ProcurementTrackerStepType.ACQUISITION_PLANNING,
    )
    context["procurement_tracker"] = procurement_tracker
    context["procurement_tracker_step"] = unadded_step_1


@given("I have a procurement tracker with an uncompleted final step and procurement action")
def procurement_tracker_with_uncompleted_final_step(loaded_db, context):
    agreement = context["agreement"]
    procurement_action = context["procurement_action"]
    procurement_tracker = DefaultProcurementTracker.create_with_steps(
        agreement_id=agreement.id,
        status=ProcurementTrackerStatus.ACTIVE,
        created_by=agreement.created_by,
        procurement_action=procurement_action.id,
    )
    procurement_tracker.steps[-1].status = ProcurementTrackerStepStatus.PENDING
    final_step = procurement_tracker.steps[-1]
    final_step_number = final_step.step_number
    procurement_tracker.active_step_number = final_step_number
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    context["procurement_tracker"] = procurement_tracker
    context["procurement_tracker_step"] = final_step


@when("I have a valid completed procurement step")
def have_valid_completed_procurement_step(context):
    data = {
        "status": "COMPLETED",
        "date_completed": "2025-12-25",
        "task_completed_by": context["user_id"],
    }

    context["request_body"] = data


@when("I have a procurement step with a non-existent user in the task_completed_by step")
def have_procurement_step_with_nonexistent_user(context):
    data = {
        "status": "COMPLETED",
        "date_completed": "2025-12-25",
        "task_completed_by": 999,
    }

    context["request_body"] = data


@when("I have a procurement step with an invalid completion date")
def have_procurement_step_with_invalid_completion_date(context):
    data = {
        "status": "COMPLETED",
        "date_completed": "2025-25-25",
        "task_completed_by": context["user_id"],
    }

    context["request_body"] = data


@when("I have a procurement step with a date completed in the future")
def have_procurement_step_with_future_completion_date(context):
    future_date = date.today().replace(year=date.today().year + 1).isoformat()
    data = {
        "status": "COMPLETED",
        "date_completed": future_date,
        "task_completed_by": context["user_id"],
    }

    context["request_body"] = data


@when("I have a procurement step with an invalid status")
def have_procurement_step_with_invalid_status(context):
    data = {
        "status": "BAD_STATUS",
        "date_completed": "2025-12-25",
        "task_completed_by": context["user_id"],
    }

    context["request_body"] = data


@when("I have a procurement step with no presolicitation package sent to procurement shop")
def have_procurement_step_with_no_presolicitation_package(context):
    data = {
        "status": "COMPLETED",
    }

    context["request_body"] = data


@when("I have a valid completed final procurement step")
def have_valid_completed_final_procurement_step(context):
    data = {
        "status": "COMPLETED",
    }

    context["request_body"] = data


@when("I submit a procurement step update")
def submit_procurement_step_update(bdd_client, loaded_db, context):
    step1 = context["procurement_tracker_step"]

    # In scenarios where the procurement tracker has no persisted steps,
    # step1.id may be None. Use a clearly non-existent integer ID so that
    # the route is hit and the application-level 404 is exercised.
    step_id = getattr(step1, "id", None)
    if step_id is None:
        step_id = 9999

    request_body = context.get("request_body", {})

    context["response_patch"] = bdd_client.patch(f"/api/v1/procurement-tracker-steps/{step_id}", json=request_body)


@then("I should get a message that it was successful and my procurement tracker has moved onto the next step")
def check_successful_response(context, loaded_db, setup_and_teardown):
    response = context["response_patch"]
    assert response.status_code == 200
    procurement_tracker_id = response.get_json().get("procurement_tracker_id")

    procurement_tracker = loaded_db.query(ProcurementTracker).filter_by(id=procurement_tracker_id).first()
    assert procurement_tracker.active_step_number == 2

    # Check that step number 2 has step_start_date set to today
    step_2 = (
        loaded_db.query(ProcurementTrackerStep)
        .filter_by(procurement_tracker_id=procurement_tracker_id, step_number=2)
        .first()
    )
    assert step_2 is not None, "Step number 2 should exist"
    assert step_2.step_start_date == date.today(), "Step 2 should have step_start_date set to today"


@then(
    "I should get a message that it was successful and my procurement tracker has completed. Also, the procurement action's status should be awarded"
)
def check_successful_completion_response(context, loaded_db, setup_and_teardown):
    response = context["response_patch"]
    procurement_tracker_step = context["procurement_tracker_step"]
    assert response.status_code == 200
    procurement_tracker_id = response.get_json().get("procurement_tracker_id")

    procurement_tracker = loaded_db.query(ProcurementTracker).filter_by(id=procurement_tracker_id).first()
    # Steps aren't 0 based so active step should equal length of step list
    assert procurement_tracker.active_step_number == len(procurement_tracker.steps)

    # Check that final step has step_completed_date set to today
    final_step = (
        loaded_db.query(ProcurementTrackerStep)
        .filter_by(procurement_tracker_id=procurement_tracker_id, step_number=procurement_tracker_step.step_number)
        .first()
    )
    assert final_step is not None, "Final step should exist"
    assert final_step.step_completed_date == date.today(), "Final step should have step_completed_date set to today"
    assert procurement_tracker.status == ProcurementTrackerStatus.COMPLETED
    procurement_action = loaded_db.get(ProcurementAction, procurement_tracker.procurement_action)
    assert procurement_action is not None, "Procurement action should exist"
    assert procurement_action.status == ProcurementActionStatus.AWARDED
    assert procurement_action.award_date == date.today()


@then("I should get an error message that users must be associated with an agreement")
def check_user_association_error_message(context, setup_and_teardown):
    response = context["response_patch"]
    json_data = response.get_json()
    assert response.status_code == 403
    assert "is not authorized" in json_data["message"]


@then("I should get a validation error")
def check_invalid_status_error_message(context, setup_and_teardown):
    response = context["response_patch"]
    assert response.status_code == 400


@then("I should get a resource not found error")
def check_resource_not_found_error_message(context, setup_and_teardown):
    response = context["response_patch"]
    assert response.status_code == 404
