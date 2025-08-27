from datetime import timedelta

import pytest
from flask import url_for

from models import (
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ProcurementShop,
    ProductServiceCode,
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
def test_power_user_can_update_bli_amount_without_change_request(
    loaded_db, bli_status, power_user_auth_client, test_can, test_project, test_admin_user
):
    # Create a test agreement - need to make sure all required fields are populated
    agreement = ContractAgreement(
        agreement_type=AgreementType.CONTRACT,
        name=f"{bli_status} BLI Agreement",
        nick_name=f"{bli_status}",
        description=f"Agreement with CR for {bli_status} BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Add BLI with the given status
    from datetime import datetime

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    # BLI should not be in_review initially
    assert bli.in_review is False
    assert bli.change_requests_in_review is None, f"{bli_status} BLI should not have any CR in review initially"

    amount = 5000.00 + list(BudgetLineItemStatus).index(bli_status)

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": amount},  # add unique amount per status
    )
    assert response.status_code == 200, f"Power user should be able to update {bli_status} BLI without CR"

    updated_bli = loaded_db.get(ContractBudgetLineItem, bli.id)
    assert updated_bli.amount == amount, f"{bli_status} BLI amount should be updated by power user"
    assert (
        updated_bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review after update by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)

    # Test data should be fully removed from DB
    loaded_db.commit()
