from datetime import date, datetime, timedelta

import pytest
from flask import url_for

from models import (
    AaAgreement,
    AABudgetLineItem,
    AgreementReason,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    DirectAgreement,
    DirectObligationBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
    IaaAgreement,
    IAABudgetLineItem,
    IAADirectionType,
    ServiceRequirementType,
    ServicesComponent,
)


@pytest.fixture()
def test_contract(loaded_db, test_project, test_admin_user):
    """
    Create a test contract agreement - need to make sure all required fields are populated
    i.e. there is a list of required fields in the ContractAgreement model that are validated when
    moving a budget line past the DRAFT status.
    """
    agreement = ContractAgreement(
        name="Test Contract Agreement",
        nick_name="Test Contract",
        description="Test Contract Agreement Description",
        project_id=test_project.id,
        product_service_code_id=1,
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    yield agreement
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def test_grant(loaded_db):
    agreement = GrantAgreement(
        name="Test Grant Agreement",
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    yield agreement
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def test_aa(loaded_db):
    agreement = AaAgreement(
        name="Test AA Agreement",
        requesting_agency_id=1,
        servicing_agency_id=1,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    yield agreement
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def test_iaa(loaded_db):
    agreement = IaaAgreement(
        name="IAA Agreement",
        direction=IAADirectionType.INCOMING,
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    yield agreement
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def test_do(loaded_db):
    agreement = DirectAgreement(
        name="DO Agreement",
    )
    loaded_db.add(agreement)
    loaded_db.commit()
    yield agreement
    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def test_services_component(loaded_db, test_contract):
    sc = ServicesComponent(
        agreement=test_contract,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=date(2024, 1, 1),
        period_end=date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()
    yield sc
    loaded_db.delete(sc)
    loaded_db.commit()


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
    loaded_db, bli_status, power_user_auth_client, test_can, test_contract, app_ctx
):
    agreement = test_contract

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        services_component_id=agreement.awarding_entity_id,
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

    # Test data should be fully removed from DB
    loaded_db.commit()


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
    loaded_db, bli_status, power_user_auth_client, test_can, test_contract, app_ctx
):
    agreement = test_contract

    bli = ContractBudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
        services_component_id=agreement.awarding_entity_id,
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
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
    loaded_db, bli_status, power_user_auth_client, test_can, test_contract, app_ctx
):
    agreement = test_contract

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        services_component_id=agreement.awarding_entity_id,
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

    # Test data should be fully removed from DB
    loaded_db.commit()


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
    loaded_db, bli_status, power_user_auth_client, test_can, test_grant, app_ctx
):
    agreement = test_grant

    bli = GrantBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        services_component_id=1,
    )

    loaded_db.add(bli)
    loaded_db.commit()

    # BLI should not be in_review initially
    assert bli.in_review is False
    assert bli.change_requests_in_review is None, f"{bli_status} BLI should not have any CR in review initially"

    amount = 5000.00 + list(BudgetLineItemStatus).index(bli_status)

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={
            "amount": amount,
        },  # add unique amount per status
    )
    assert response.status_code == 200, f"Power user should be able to update {bli_status} BLI without CR"

    updated_bli = loaded_db.get(GrantBudgetLineItem, bli.id)
    assert updated_bli.amount == amount, f"{bli_status} BLI amount should be updated by power user"
    assert (
        updated_bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review after update by power user"

    # Delete created test objects
    loaded_db.delete(bli)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
    loaded_db, bli_status, power_user_auth_client, test_can, test_grant, app_ctx
):
    # Create a test agreement - need to make sure all required fields are populated
    agreement = test_grant

    bli = GrantBudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
        services_component_id=agreement.awarding_entity_id,
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
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
    loaded_db,
    bli_status,
    power_user_auth_client,
    test_can,
    db_for_aa_agreement,
    test_aa,
    test_services_component,
    app_ctx,
):

    agreement = test_aa

    test_services_component.agreement = agreement
    loaded_db.commit()

    bli = AABudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        amount=5000,
        status=bli_status,
        services_component_id=test_services_component.id,
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
    loaded_db.delete(test_services_component)

    # Test data should be fully removed from DB
    loaded_db.commit()


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
    loaded_db,
    bli_status,
    power_user_auth_client,
    test_can,
    db_for_aa_agreement,
    test_aa,
):

    agreement = test_aa

    bli = AABudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
        services_component_id=1,
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
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_can_update_IAA_bli_amount_without_change_request(
    loaded_db,
    bli_status,
    power_user_auth_client,
    test_can,
    test_iaa,
    app_ctx,
):
    agreement = test_iaa

    bli = IAABudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        services_component_id=1,
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

    updated_bli = loaded_db.get(IAABudgetLineItem, bli.id)
    assert updated_bli.amount == amount, f"{bli_status} BLI amount should be updated by power user"
    assert (
        updated_bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review after update by power user"

    # Delete created test objects
    loaded_db.delete(bli)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_cannot_update_IAA_bli_that_is_in_review(
    loaded_db,
    bli_status,
    power_user_auth_client,
    test_can,
    db_for_aa_agreement,
    test_iaa,
):
    agreement = test_iaa

    bli = IAABudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
        services_component_id=agreement.awarding_entity_id,
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

    updated_bli = loaded_db.get(IAABudgetLineItem, bli.id)
    assert updated_bli.amount is None, "BLI amount should NOT be updated by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_can_update_direct_obligation_bli_amount_without_change_request(
    loaded_db, bli_status, power_user_auth_client, test_can, test_do
):
    agreement = test_do
    bli = DirectObligationBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        services_component_id=1,
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

    updated_bli = loaded_db.get(DirectObligationBudgetLineItem, bli.id)
    assert updated_bli.amount == amount, f"{bli_status} BLI amount should be updated by power user"
    assert (
        updated_bli.change_requests_in_review is None
    ), f"{bli_status} BLI should not have any CR in review after update by power user"

    # Delete created test objects
    loaded_db.delete(bli)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_cannot_update_direct_obligation_bli_that_is_in_review(
    loaded_db, bli_status, power_user_auth_client, test_can, test_do
):
    agreement = test_do
    bli = DirectObligationBudgetLineItem(
        line_description="In Review BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=BudgetLineItemStatus.IN_EXECUTION,
        services_component_id=agreement.awarding_entity_id,
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

    updated_bli = loaded_db.get(DirectObligationBudgetLineItem, bli.id)
    assert updated_bli.amount is None, "BLI amount should NOT be updated by power user"

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(bli_cr)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_change_can_in_contract_bli_without_change_request(
    loaded_db, bli_status, power_user_auth_client, test_cans, test_contract
):
    agreement = test_contract
    test_can = test_cans[0]

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        amount=5000,
        services_component_id=agreement.awarding_entity_id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    assert bli.in_review is False
    assert bli.change_requests_in_review is None, f"{bli_status} BLI should not have any CR in review initially"

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"can_id": test_cans[1].id},
    )

    assert response.status_code == 200, f"User should be able to change the CAN in {bli_status} bli."

    # Delete created test objects
    loaded_db.delete(bli)


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_update_obligate_by_date(
    power_user_auth_client,
    loaded_db,
    bli_status,
    test_can,
    test_contract,
    basic_user_auth_client,
):

    agreement = test_contract

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        can_id=test_can.id,
        status=bli_status,
        amount=5000,
        services_component_id=agreement.awarding_entity_id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"date_needed": None, "amount": 8000},
    )
    if bli_status == BudgetLineItemStatus.DRAFT:
        assert response.status_code == 200
    else:
        assert response.status_code == 400
        assert "BLI must have a Need By Date when status is not DRAFT" in response.json["errors"]["date_needed"]

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={
            "date_needed": "2043-06-21",
            "amount": 6000,
        },
    )
    assert response.status_code == 200

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"date_needed": "2020-06-21", "amount": 7000},
    )
    assert response.status_code == 200

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"date_needed": "2020-06-21", "amount": 9999},
    )
    assert response.status_code == 403

    # Delete created test objects
    loaded_db.delete(bli)

    # Test data should be fully removed from DB
    loaded_db.commit()


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_power_user_cannot_update_can_in_contract_bli_that_is_in_review(
    loaded_db,
    bli_status,
    power_user_auth_client,
    test_cans,
    test_project,
    test_admin_user,
    test_contract,
):

    agreement = test_contract

    test_can = test_cans[0]

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
        json={"can_id": test_cans[1].id},
    )

    assert response.status_code == 400, "Power user should NOT be able to update BLI that is in review"
    assert "Budget Line Item is not in an editable state." in response.json["errors"]["status"]

    updated_bli = loaded_db.get(ContractBudgetLineItem, bli.id)
    assert updated_bli.can_id == test_can.id, "BLI CAN should NOT be updated by power user"

    # Delete created test objects
    loaded_db.delete(bli_cr)
    loaded_db.delete(bli)
    loaded_db.delete(agreement)


@pytest.mark.parametrize(
    "bli_status",
    [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
        BudgetLineItemStatus.IN_EXECUTION,
        BudgetLineItemStatus.OBLIGATED,
    ],
)
def test_optional_services_component_for_power_user(
    power_user_auth_client,
    loaded_db,
    bli_status,
    test_can,
    test_contract,
    basic_user_auth_client,
    test_services_component,
):

    agreement = test_contract

    bli = ContractBudgetLineItem(
        line_description=f"{bli_status} BLI",
        agreement_id=agreement.id,
        date_needed=datetime.now() + timedelta(days=1),
        can_id=test_can.id,
        status=bli_status,
        amount=8000,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"services_component_id": test_services_component.id},
    )
    assert response.status_code == 200

    response = power_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"services_component_id": None},
    )
    assert response.status_code == 200

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id),
        json={"services_component_id": None, "amount": 9999.99},
    )
    assert response.status_code == 403

    # Delete created test objects
    loaded_db.delete(bli)
    loaded_db.delete(test_services_component)

    # Test data should be fully removed from DB
    loaded_db.commit()
