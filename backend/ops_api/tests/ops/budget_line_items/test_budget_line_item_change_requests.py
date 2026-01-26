import pytest

from models import (
    AgreementChangeRequest,
    AgreementType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
)


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_bli_in_review_true_if_agreement_cr_in_review(loaded_db, test_admin_user, bli_status, app_ctx):
    # Create a test agreement
    agreement = ContractAgreement(
        agreement_type=AgreementType.CONTRACT,
        name=f"{bli_status} BLI Agreement",
        nick_name=f"{bli_status}",
        description=f"Agreement with CR for {bli_status} BLI",
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    # Add BLI with the given status
    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        status=bli_status,
    )
    loaded_db.add(bli)
    loaded_db.flush()

    # BLI should not be in_review initially
    assert bli.in_review is False
    assert bli.change_requests_in_review is None, f"{bli_status} BLI should not have any CR in review initially"

    # Create agreement level change request
    cr = AgreementChangeRequest(
        agreement_id=agreement.id,
        change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(cr)
    loaded_db.flush()

    # BLI should now be in_review due to the agreement CR
    assert bli.in_review is True
    assert len(bli.change_requests_in_review) == 1

    # Create first BLI level change request
    bli_cr = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(bli_cr)

    # Create another BLI level change request
    bli_cr_2 = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": "Another CR for the same BLI"},
    )
    loaded_db.add(bli_cr_2)

    # Update db to reflect changes
    loaded_db.commit()
    loaded_db.refresh(bli)

    # BLI should still be in_review with 3 CRs
    assert bli.in_review is True, f"{bli_status} BLI should be in_review if agreement has IN_REVIEW CR"
    assert len(bli.change_requests_in_review) == 3, f"{bli_status} BLI should have 3 CR in review"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(bli_cr)
    loaded_db.delete(bli_cr_2)
    loaded_db.delete(cr)
    loaded_db.delete(agreement)

    # Test data should be fully removed from DB
    loaded_db.commit()
    assert loaded_db.get(ContractBudgetLineItem, bli.id) is None
    assert loaded_db.get(AgreementChangeRequest, cr.id) is None
    assert loaded_db.get(BudgetLineItemChangeRequest, bli_cr.id) is None
    assert loaded_db.get(BudgetLineItemChangeRequest, bli_cr_2.id) is None
    assert loaded_db.get(ContractAgreement, agreement.id) is None, "Agreement should be deleted after test"


def test_bli_in_review_with_no_agreement_crs_should_return_one_bli_cr(loaded_db, app_ctx):
    # Create a test agreement
    agreement = GrantAgreement(
        agreement_type=AgreementType.GRANT,
        name="BLI Agreement with no agreement CRs",
        nick_name="No Agreement CRs",
        description="Agreement with no CRs at the agreement level",
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    # Create a test bli
    bli = ContractBudgetLineItem(
        line_description="Test BLI for checking in_review with no agreement CRs",
        agreement_id=agreement.id,
        status=BudgetLineItemStatus.PLANNED,
    )
    loaded_db.add(bli)
    loaded_db.flush()

    # Create a bli cr
    bli_cr = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": "CR for BLI with no agreement CRs"},
    )
    loaded_db.add(bli_cr)
    loaded_db.commit()

    # Refresh the BLI to get the latest state
    loaded_db.refresh(bli)
    assert bli.in_review is True, "BLI should be in_review if it has its own IN_REVIEW CR"
    assert len(bli.change_requests_in_review) == 1, "BLI should have exactly one CR in review"
    assert bli.change_requests_in_review[0].id == bli_cr.id, "The CR in review should be the one created for the BLI"

    # Clean up test data
    loaded_db.delete(bli)
    loaded_db.delete(bli_cr)
    loaded_db.delete(agreement)
    loaded_db.commit()
    assert loaded_db.get(BudgetLineItemChangeRequest, bli_cr.id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli.id) is None
    assert loaded_db.get(GrantAgreement, agreement.id) is None
