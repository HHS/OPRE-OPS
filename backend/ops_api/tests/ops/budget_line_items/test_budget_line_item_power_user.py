from datetime import timedelta

import pytest
from flask import url_for
from sqlalchemy import select

from models import (
    AaAgreement,
    AABudgetLineItem,
    AgreementAgency,
    AgreementReason,
    AgreementType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
    ProcurementShop,
    ProductServiceCode,
    ServiceRequirementType,
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
def test_power_user_can_update_contract_bli_amount_without_change_request(
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
def test_power_user_cannot_update_contract_bli_that_is_in_review(
    loaded_db, bli_status, power_user_auth_client, test_can, test_project, test_admin_user
):
    # Create a test agreement - need to make sure all required fields are populated
    agreement = ContractAgreement(
        agreement_type=AgreementType.CONTRACT,
        name="In Review BLI Agreement",
        nick_name="In Review",
        description="Agreement with CR for In Review BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Add BLI with IN_EXECUTION status and set in_review to True
    from datetime import datetime

    bli = ContractBudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    # Create first BLI level change request
    bli_cr = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(bli_cr)
    loaded_db.commit()

    assert bli.in_review is True
    assert len(bli.change_requests_in_review) == 1, "BLI should have one CR in review"

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 9999.99},
    )
    assert response.status_code == 400, "Power user should NOT be able to update BLI that is in review"
    assert "Budget Line Item is not in an editable state." in response.json["errors"]["status"]

    updated_bli = loaded_db.get(ContractBudgetLineItem, bli.id)
    assert updated_bli.amount is None, "BLI amount should NOT be updated by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
def test_power_user_can_update_obe_contract_bli_amount_without_change_request(
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
        is_obe=True,
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
def test_power_user_can_update_grant_bli_amount_without_change_request(
    loaded_db, bli_status, power_user_auth_client, test_can, test_project, test_admin_user
):

    agreement = GrantAgreement(
        agreement_type=AgreementType.GRANT,
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

    bli = GrantBudgetLineItem(
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

    updated_bli = loaded_db.get(GrantBudgetLineItem, bli.id)
    assert updated_bli.amount == amount, f"{bli_status} BLI amount should be updated by power user"
    assert (
        updated_bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review after update by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
def test_power_user_cannot_update_grant_bli_that_is_in_review(
    loaded_db, bli_status, power_user_auth_client, test_can, test_project, test_admin_user
):
    # Create a test agreement - need to make sure all required fields are populated
    agreement = GrantAgreement(
        agreement_type=AgreementType.GRANT,
        name="In Review BLI Agreement",
        nick_name="In Review",
        description="Agreement with CR for In Review BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Add BLI with IN_EXECUTION status and set in_review to True
    from datetime import datetime

    bli = GrantBudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    # Create first BLI level change request
    bli_cr = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(bli_cr)
    loaded_db.commit()

    assert bli.in_review is True
    assert len(bli.change_requests_in_review) == 1, "BLI should have one CR in review"

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 9999.99},
    )
    assert response.status_code == 400, "Power user should NOT be able to update BLI that is in review"
    assert "Budget Line Item is not in an editable state." in response.json["errors"]["status"]

    updated_bli = loaded_db.get(GrantBudgetLineItem, bli.id)
    assert updated_bli.amount is None, "BLI amount should NOT be updated by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
def test_power_user_can_update_AA_bli_amount_without_change_request(
    loaded_db, bli_status, power_user_auth_client, test_can, test_project, test_admin_user, db_for_aa_agreement
):

    agreement = AaAgreement(
        agreement_type=AgreementType.AA,
        name=f"{bli_status} BLI Agreement",
        nick_name=f"{bli_status}",
        description=f"Agreement with CR for {bli_status} BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )
    db_for_aa_agreement.add(agreement)
    db_for_aa_agreement.commit()

    # Add BLI with the given status
    from datetime import datetime

    bli = AABudgetLineItem(
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

    updated_bli = loaded_db.get(AABudgetLineItem, bli.id)
    assert updated_bli.amount == amount, f"{bli_status} BLI amount should be updated by power user"
    assert (
        updated_bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review after update by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
def test_power_user_cannot_update_AA_bli_that_is_in_review(
    loaded_db, bli_status, power_user_auth_client, test_can, test_project, test_admin_user, db_for_aa_agreement
):

    agreement = AaAgreement(
        agreement_type=AgreementType.AA,
        name="In Review BLI Agreement",
        nick_name="In Review",
        description="Agreement with CR for In Review BLI",
        project_id=test_project.id,
        product_service_code_id=loaded_db.get(ProductServiceCode, 1).id,
        awarding_entity_id=loaded_db.get(ProcurementShop, 1).id,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )
    db_for_aa_agreement.add(agreement)
    db_for_aa_agreement.commit()

    # Add BLI with IN_EXECUTION status and set in_review to True
    from datetime import datetime

    bli = AABudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
    )

    loaded_db.add(bli)
    loaded_db.commit()

    # Create first BLI level change request
    bli_cr = BudgetLineItemChangeRequest(
        agreement_id=agreement.id,
        budget_line_item_id=bli.id,
        change_request_type=ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"note": f"CR for {bli_status} BLI"},
    )
    loaded_db.add(bli_cr)
    loaded_db.commit()

    assert bli.in_review is True
    assert len(bli.change_requests_in_review) == 1, "BLI should have one CR in review"

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"amount": 9999.99},
    )
    assert response.status_code == 400, "Power user should NOT be able to update BLI that is in review"
    assert "Budget Line Item is not in an editable state." in response.json["errors"]["status"]

    updated_bli = loaded_db.get(AABudgetLineItem, bli.id)
    assert updated_bli.amount is None, "BLI amount should NOT be updated by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(agreement)
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()
