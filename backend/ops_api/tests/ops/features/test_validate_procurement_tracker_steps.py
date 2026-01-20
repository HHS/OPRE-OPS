import pytest
from pytest_bdd import given, scenario, then, when

from models import (
    AgreementReason,
    AgreementType,
    ContractAgreement,
    ContractType,
    ProcurementTracker,
    ProcurementTrackerStep,
)


@pytest.fixture(scope="function")
def context():
    return {}


def cleanup(loaded_db, context):
    pass


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


@given("I am logged in as an OPS user", target_fixture="bdd_client")
def bdd_client(basic_user_auth_client):
    return basic_user_auth_client


@given("I have a Contract Agreement with OPS user as a team member")
def agreement_with_ops_user(bdd_client, test_user, loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX14000",
        contract_number="CT00010",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        description="Test Contract Agreement",
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_user.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    context["agreement"] = contract_agreement
    context["user"] = test_user


@given("I have a Contract Agreement without OPS user as a team member")
def agreement_without_ops_user(bdd_client, test_user, loaded_db, context):
    contract_agreement = ContractAgreement(
        name="CTXX14000",
        contract_number="CT00010",
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
    context["user"] = test_user


@given("I have a procurement tracker with an empty step number 1")
def procurement_tracker_with_empty_step(loaded_db, context):
    agreement = context["agreement"]

    procurement_tracker = ProcurementTracker(
        agreement_id=agreement.id,
        name="Procurement Tracker 1",
    )
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    step1 = ProcurementTrackerStep(
        procurement_tracker_id=procurement_tracker.id,
        step_number=1,
        status="PENDING",
    )
    loaded_db.add(step1)
    loaded_db.commit()

    context["procurement_tracker"] = procurement_tracker
    context["procurement_tracker_step"] = step1


@given("I have a procurement tracker with a completed step 1")
def procurement_tracker_with_completed_step(loaded_db, context):
    agreement = context["agreement"]

    procurement_tracker = ProcurementTracker(
        agreement_id=agreement.id,
        name="Procurement Tracker 1",
    )
    loaded_db.add(procurement_tracker)
    loaded_db.commit()

    step1 = ProcurementTrackerStep(
        procurement_tracker_id=procurement_tracker.id,
        step_number=1,
        status="COMPLETED",
    )
    loaded_db.add(step1)
    loaded_db.commit()

    context["procurement_tracker"] = procurement_tracker
    context["procurement_tracker_step"] = step1


# TODO#####
@when("I have a valid completed procurement step")
def have_valid_completed_procurement_step(context):
    data = {
        "status": "COMPLETED",
        "assigned_to": context["user"].id,
        "id": context["procurement_tracker_step"].id,
        "step_number": context["procurement_tracker_step"].step_number,
        "step_type": context["procurement_tracker_step"].step_type,
        "step_completed_date": "12/25/2025",
    }

    context["request_body"] = data


@when("I have a procurement step with a non-existent user in the task_completed_by step")
def have_procurement_step_with_nonexistent_user(context):
    data = {
        "status": "COMPLETED",
        "assigned_to": context["user"].id,
        "id": context["procurement_tracker_step"].id,
        "step_number": context["procurement_tracker_step"].step_number,
        "step_type": context["procurement_tracker_step"].step_type,
        "step_completed_date": "12/25/2025",
    }

    context["request_body"] = data


@when("I have a procurement step with an invalid completion date")
def have_procurement_step_with_invalid_completion_date(context):
    data = {
        "status": "COMPLETED",
        "assigned_to": context["user"].id,
        "id": context["procurement_tracker_step"].id,
        "step_number": context["procurement_tracker_step"].step_number,
        "step_type": context["procurement_tracker_step"].step_type,
        "step_completed_date": "25/25/2025",
    }

    context["request_body"] = data


@when("I have a procurement step with an invalid status")
def have_procurement_step_with_invalid_status(context):
    data = {
        "status": "BAD_STATUS",
        "assigned_to": context["user"].id,
        "id": context["procurement_tracker_step"].id,
        "step_number": context["procurement_tracker_step"].step_number,
        "step_type": context["procurement_tracker_step"].step_type,
        "step_completed_date": "12/25/2025",
    }

    context["request_body"] = data


@when("I have a procurement step with no presolicitation package sent to procurement shop")
def have_procurement_step_with_no_presolicitation_package(context):
    data = {
        "status": "COMPLETED",
        "assigned_to": context["user"].id,
        "id": context["procurement_tracker_step"].id,
        "step_number": context["procurement_tracker_step"].step_number,
        "step_type": context["procurement_tracker_step"].step_type,
    }

    context["request_body"] = data


@when("I submit a procurement step update")
def submit_procurement_step_update(bdd_client, loaded_db, context):
    step1 = context["step1"]

    request_body = context.get("request_body", {})

    context["response_patch"] = bdd_client.patch(f"/api/v1/procurement_tracker_steps/{step1.id}", json=request_body)


@then("I should get a message that it was successful")
def check_successful_response(context):
    response = context["response_patch"]
    assert response.status_code == 200


@then("I should get an error message that users must be associated with an agreement")
def check_user_association_error_message(context):
    response = context["response_patch"]
    assert response.status_code == 403
    assert "is not authorized to update procurement tracker step" in response.json()["message"]


@then("I should get an error message that date must be a valid date")
def check_invalid_date_error_message(context):
    response = context["response_patch"]
    assert response.status_code == 400
    assert "must be a valid date" in response.json()["message"]


@then("I should get an error message that a valid status is required")
def check_invalid_status_error_message(context):
    response = context["response_patch"]
    assert response.status_code == 400
    assert "is not a valid status" in response.json()["message"]


@then("I should get an error message that completed procurement tracker steps cannot be updated")
def check_completed_step_update_error_message(context):
    response = context["response_patch"]
    assert response.status_code == 400
    assert "Cannot update a procurement tracker step that is already completed." in response.json()["message"]
