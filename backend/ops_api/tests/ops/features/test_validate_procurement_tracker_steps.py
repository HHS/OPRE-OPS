import pytest
from pytest_bdd import given, scenario, then, when
from sqlalchemy import text

from models import (
    AgreementReason,
    AgreementType,
    ContractAgreement,
    ContractType,
    ProcurementTracker,
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


@pytest.fixture()
def setup_and_teardown(loaded_db, context):
    ...
    yield
    cleanup(loaded_db, context)


@given("I am logged in as an OPS user", target_fixture="bdd_client")
def bdd_client(basic_user_auth_client):
    return basic_user_auth_client


@given("I have a Contract Agreement with OPS user as a team member")
def agreement_with_ops_user(bdd_client, test_user, loaded_db, context):
    test_user_id = 521  # The id of the user in our auth client
    contract_agreement = ContractAgreement(
        name="ABCD12345",
        contract_number="CT1234",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        description="Test Contract Agreement",
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user_id,  # The id of the user in our auth client
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement
    context["user_id"] = test_user_id


@given("I have a Contract Agreement without OPS user as a team member")
def agreement_without_ops_user(bdd_client, test_user, loaded_db, context):
    test_user_id = 521
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
    context["user_id"] = test_user_id


@given("I have a procurement tracker with an empty step number 1")
def procurement_tracker_with_empty_step(loaded_db, context):
    agreement = context["agreement"]

    procurement_tracker = ProcurementTracker(agreement_id=agreement.id, tracker_type=ProcurementTrackerType.DEFAULT)
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    try:
        step1 = ProcurementTrackerStep(
            procurement_tracker_id=procurement_tracker.id,
            step_number=1,
            status=ProcurementTrackerStepStatus.PENDING,
            step_type=ProcurementTrackerStepType.ACQUISITION_PLANNING,
        )
        loaded_db.add(step1)
        loaded_db.commit()

        context["procurement_tracker"] = procurement_tracker
        context["procurement_tracker_step"] = step1
    except Exception as e:
        loaded_db.rollback()
        raise e


@given("I have a procurement tracker with a completed step 1")
def procurement_tracker_with_completed_step(loaded_db, context):
    agreement = context["agreement"]

    procurement_tracker = ProcurementTracker(agreement_id=agreement.id, tracker_type=ProcurementTrackerType.DEFAULT)
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    step1 = ProcurementTrackerStep(
        procurement_tracker_id=procurement_tracker.id,
        step_number=1,
        status=ProcurementTrackerStepStatus.COMPLETED,
        step_type=ProcurementTrackerStepType.ACQUISITION_PLANNING,
    )
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


@when("I submit a procurement step update")
def submit_procurement_step_update(bdd_client, loaded_db, context):
    step1 = context["procurement_tracker_step"]

    request_body = context.get("request_body", {})

    context["response_patch"] = bdd_client.patch(f"/api/v1/procurement-tracker-steps/{step1.id}", json=request_body)


@then("I should get a message that it was successful")
def check_successful_response(context, setup_and_teardown):
    response = context["response_patch"]
    assert response.status_code == 200


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
