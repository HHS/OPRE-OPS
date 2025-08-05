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
)


@pytest.mark.usefixtures("app_ctx", "loaded_db")
@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_bli_in_review_true_if_agreement_cr_in_review(loaded_db, test_admin_user, bli_status):
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

    # Check if BLI is in_review before any CR is added
    assert bli.in_review is False
    assert bli.change_requests_in_review is None, f"{bli_status} BLI should not have any CR in review initially"

    # Create Agreement-level change request
    cr = AgreementChangeRequest(
        agreement_id=agreement.id,
        change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(cr)

    bli_cr = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(bli_cr)

    bli_cr_2 = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": "Another CR for the same BLI"},
    )
    loaded_db.add(bli_cr_2)

    loaded_db.commit()
    loaded_db.refresh(bli)

    assert bli.in_review is True, f"{bli_status} BLI should be in_review if agreement has IN_REVIEW CR"
    assert len(bli.change_requests_in_review) == 3, f"{bli_status} BLI should have 3 CR in review"

    # Delete the created objects
    loaded_db.delete(bli)
    loaded_db.delete(cr)
    loaded_db.delete(agreement)

    # Check if the objects are deleted
    loaded_db.commit()
    assert loaded_db.get(ContractBudgetLineItem, bli.id) is None
    assert loaded_db.get(AgreementChangeRequest, cr.id) is None
    assert loaded_db.get(ContractAgreement, agreement.id) is None, "Agreement should be deleted after test"
