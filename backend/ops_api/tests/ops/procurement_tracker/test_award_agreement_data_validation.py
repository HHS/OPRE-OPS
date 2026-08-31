"""Tests for AWARD step agreement data (Vendor/CLIN) validation."""

from datetime import date

import pytest

from models import AgreementType, ContractAgreement, ProcurementTracker, ProcurementTrackerStepStatus
from models.procurement_tracker import (
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    ProcurementTrackerStepType,
)
from models.services_components import CLIN
from models.vendors import Vendor


@pytest.fixture
def test_contract_agreement(app_ctx, loaded_db):
    """Create a test contract agreement without vendor or CLINs."""
    agreement = ContractAgreement(
        name="Test Contract for AWARD Validation",
        agreement_type=AgreementType.CONTRACT,
        project_id=1000,  # Existing project from test data
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    loaded_db.refresh(agreement)

    yield agreement

    # Cleanup
    loaded_db.rollback()
    try:
        test_agreement = loaded_db.get(ContractAgreement, agreement.id)
        if test_agreement:
            loaded_db.delete(test_agreement)
            loaded_db.commit()
    except Exception:
        loaded_db.rollback()


@pytest.fixture
def test_procurement_tracker_with_award(app_ctx, loaded_db, test_contract_agreement):
    """Create a procurement tracker with AWARD step."""
    tracker = DefaultProcurementTracker(
        agreement_id=test_contract_agreement.id,
    )
    loaded_db.add(tracker)
    loaded_db.flush()

    # Create AWARD step
    award_step = DefaultProcurementTrackerStep(
        procurement_tracker_id=tracker.id,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        status=ProcurementTrackerStepStatus.ACTIVE,
        award_approval_status="APPROVED",  # Set approval so it doesn't block
    )
    loaded_db.add(award_step)
    loaded_db.commit()
    loaded_db.refresh(award_step)

    yield award_step

    # Cleanup
    loaded_db.rollback()
    try:
        from models.procurement_tracker import ProcurementTrackerStep

        test_step = loaded_db.get(ProcurementTrackerStep, award_step.id)
        if test_step:
            loaded_db.delete(test_step)
        test_tracker = loaded_db.get(ProcurementTracker, tracker.id)
        if test_tracker:
            loaded_db.delete(test_tracker)
        loaded_db.commit()
    except Exception:
        loaded_db.rollback()


def test_award_completion_fails_without_vendor(auth_client, app_ctx, loaded_db, test_procurement_tracker_with_award):
    """Test that AWARD step completion fails when vendor is missing for contracts."""
    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_procurement_tracker_with_award.id}", json=update_data
    )
    assert response.status_code == 400
    assert "errors" in response.json
    # Check if any error message contains "vendor"
    error_messages = " ".join(str(v) for v in response.json["errors"].values())
    assert "vendor" in error_messages.lower()


def test_award_completion_succeeds_with_vendor_on_step_only(
    auth_client, app_ctx, loaded_db, test_procurement_tracker_with_award, test_contract_agreement
):
    """Test that AWARD completion passes when vendor is on the step but not the agreement.

    This covers the 'New Requirement' contract case: vendor is entered in the
    procurement tracker step 6 form (stored as award_vendor_id on the step) but
    agreement.vendor_id is still null. The rule must check the step first.
    """
    vendor = Vendor(name="Test Vendor Step Only", duns="111222333")
    loaded_db.add(vendor)
    loaded_db.flush()
    # Set vendor on the step only — agreement.vendor_id stays null
    test_procurement_tracker_with_award.award_vendor_id = vendor.id
    loaded_db.refresh(test_contract_agreement)
    assert (
        test_contract_agreement.vendor_id is None
    ), "Test setup: agreement.vendor_id must be null for this bug scenario"

    # Add CLIN
    clin = CLIN(agreement_id=test_contract_agreement.id, number=1, name="Test CLIN")
    loaded_db.add(clin)
    loaded_db.commit()

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_procurement_tracker_with_award.id}", json=update_data
    )
    assert response.status_code == 200

    # Cleanup
    loaded_db.delete(clin)
    loaded_db.delete(vendor)
    loaded_db.commit()


def test_award_completion_fails_without_clins(
    auth_client, app_ctx, loaded_db, test_procurement_tracker_with_award, test_contract_agreement
):
    """Test that AWARD step completion fails when CLINs are missing for contracts."""
    # Create and add vendor but no CLINs
    vendor = Vendor(name="Test Vendor for Award", duns="123456789")
    loaded_db.add(vendor)
    loaded_db.flush()
    test_contract_agreement.vendor_id = vendor.id
    loaded_db.commit()

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_procurement_tracker_with_award.id}", json=update_data
    )
    assert response.status_code == 400
    assert "errors" in response.json
    # Check if any error message contains "clin"
    error_messages = " ".join(str(v) for v in response.json["errors"].values())
    assert "clin" in error_messages.lower()


def test_award_completion_succeeds_with_vendor_and_clins(
    auth_client, app_ctx, loaded_db, test_procurement_tracker_with_award, test_contract_agreement
):
    """Test that AWARD step completion succeeds when vendor and CLINs exist."""
    # Create and add vendor
    vendor = Vendor(name="Test Vendor for Award Success", duns="987654321")
    loaded_db.add(vendor)
    loaded_db.flush()
    test_contract_agreement.vendor_id = vendor.id
    loaded_db.commit()

    # Add CLIN
    clin = CLIN(
        agreement_id=test_contract_agreement.id,
        number=1,
        name="Test CLIN",
    )
    loaded_db.add(clin)
    loaded_db.commit()

    update_data = {
        "status": "COMPLETED",
        "task_completed_by": 500,
        "date_completed": date.today().isoformat(),
    }

    response = auth_client.patch(
        f"/api/v1/procurement-tracker-steps/{test_procurement_tracker_with_award.id}", json=update_data
    )
    assert response.status_code == 200

    # Verify completion
    loaded_db.refresh(test_procurement_tracker_with_award)
    assert test_procurement_tracker_with_award.status == ProcurementTrackerStepStatus.COMPLETED

    # Cleanup CLIN
    loaded_db.delete(clin)
    loaded_db.commit()
