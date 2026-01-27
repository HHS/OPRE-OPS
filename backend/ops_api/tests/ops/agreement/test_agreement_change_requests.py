import datetime

import pytest
from flask import url_for

from models import (
    AgreementChangeRequest,
    AgreementType,
    BudgetLineItemStatus,
    ChangeRequestNotification,
    ChangeRequestStatus,
    ChangeRequestType,
    GrantAgreement,
    GrantBudgetLineItem,
    NotificationType,
    ProcurementShop,
    ProcurementShopFee,
    User,
)
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import ValidationError


@pytest.fixture()
def test_grant_agreement(loaded_db, test_admin_user):
    grant = GrantAgreement(
        agreement_type=AgreementType.GRANT,
        name="Test Grant for Change Requests",
        nick_name="Test Grant CR",
        description="Test Grant for Change Requests",
        product_service_code_id=1,
        project_officer_id=test_admin_user.id,
        awarding_entity_id=1,
    )
    loaded_db.add(grant)
    loaded_db.commit()

    yield grant

    loaded_db.delete(grant)
    loaded_db.commit()


@pytest.fixture()
def test_cr_psf(loaded_db):
    ps = ProcurementShop(name="Test Procurement Shop for Change Requests", abbr="TPSCR")

    loaded_db.add(ps)
    loaded_db.commit()
    loaded_db.refresh(ps)

    psf = ProcurementShopFee(
        id=100,
        procurement_shop_id=ps.id,
        fee=0.5,
    )

    ps.procurement_shop_fees.append(psf)

    loaded_db.add(psf)
    loaded_db.commit()

    yield psf

    loaded_db.delete(ps)
    loaded_db.delete(psf)
    loaded_db.commit()


@pytest.fixture()
def test_cr_blis(loaded_db, test_admin_user, test_grant_agreement, test_cr_psf, test_can):
    bli = GrantBudgetLineItem(
        line_description="Test BLI for Change Requests",
        agreement_id=test_grant_agreement.id,
        can_id=test_can.id,
        status=BudgetLineItemStatus.PLANNED,
        procurement_shop_fee=test_cr_psf,
        date_needed=datetime.date(2043, 6, 30),
        created_by=test_admin_user.id,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    yield bli

    loaded_db.delete(bli)
    loaded_db.commit()


def test_update_awarding_entity_creates_agreement_change_request(
    monkeypatch,
    test_admin_user,
    loaded_db,
    test_grant_agreement,
    test_cr_blis,
    test_cr_psf,
    division_director_auth_client,
):
    # Patch auth and association checks
    monkeypatch.setattr("ops_api.ops.services.agreements.get_current_user", lambda: test_admin_user)
    monkeypatch.setattr("ops_api.ops.services.agreements.associated_with_agreement", lambda _: True)

    # Patch current user to be the test division director
    monkeypatch.setattr("ops_api.ops.services.change_requests.current_user", loaded_db.get(User, 522))

    # Trigger change request
    service = AgreementsService(loaded_db)
    _, status_code = service.update(
        test_grant_agreement.id,
        {"awarding_entity_id": 2, "agreement_cls": GrantAgreement},
    )
    assert status_code == 202

    # Confirm change request created
    cr_service = ChangeRequestService(loaded_db)
    change_requests, _ = cr_service.get_list({"reviewer_user_id": 522, "limit": 10, "offset": 0})
    matching_crs = [
        cr
        for cr in change_requests
        if cr.agreement_id == test_grant_agreement.id
        and cr.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST
    ]

    assert len(matching_crs) == 1
    change_request_id = matching_crs[0].id

    # Confirm agreement updated to reflect change request in review
    agreement = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    assert agreement.awarding_entity_id == test_grant_agreement.awarding_entity_id == 1
    assert agreement.in_review is True
    assert agreement.change_requests_in_review is not None
    assert len(agreement.change_requests_in_review) == 1
    assert agreement.change_requests_in_review[0].agreement_id == test_grant_agreement.id
    assert agreement.change_requests_in_review[0].status == ChangeRequestStatus.IN_REVIEW
    assert agreement.change_requests_in_review[0].id == change_request_id

    # Confirm the Planned BLI on the agreement is in_review
    blis = (
        loaded_db.query(GrantBudgetLineItem).filter(GrantBudgetLineItem.agreement_id == test_grant_agreement.id).all()
    )
    assert len(blis) == 1
    assert blis[0].agreement_id is test_grant_agreement.id
    assert blis[0].status is BudgetLineItemStatus.PLANNED
    assert blis[0].in_review is True

    # Confirm "has_proc_shop_change" is True
    change_request = loaded_db.get(AgreementChangeRequest, change_request_id)
    assert change_request.has_proc_shop_change is True

    # Confirm notification created
    notifications = (
        loaded_db.query(ChangeRequestNotification)
        .filter(ChangeRequestNotification.change_request_id == change_request_id)
        .all()
    )
    assert notifications is not None
    assert len(notifications) == 1
    assert notifications[0].recipient_id == 522
    assert notifications[0].is_read is False
    assert notifications[0].notification_type == NotificationType.CHANGE_REQUEST_NOTIFICATION
    assert "type=procurement-shop-change" in notifications[0].message

    # Approve the change request
    response = division_director_auth_client.patch(
        url_for("api.change-requests-list"),
        json={"change_request_id": change_request_id, "action": "APPROVE"},
    )
    assert response.status_code == 200

    # Confirm agreement updated to reflect approved change request
    updated_agreement = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    assert updated_agreement.awarding_entity_id == 2
    assert updated_agreement.in_review is False
    assert updated_agreement.change_requests_in_review is None

    # Confirm change request updated to approved
    updated_cr = loaded_db.get(AgreementChangeRequest, change_request_id)
    assert updated_cr.status == ChangeRequestStatus.APPROVED
    assert updated_cr.reviewed_by_id == 522
    assert updated_cr.reviewed_on is not None

    # Confirm notifications to change request creator
    final_notifications = (
        loaded_db.query(ChangeRequestNotification)
        .filter(ChangeRequestNotification.change_request_id == change_request_id)
        .all()
    )
    assert final_notifications is not None
    assert len(final_notifications) == 2
    assert "Your procurement shop change request has been approved." in final_notifications[1].message

    # Cleanup
    cr_service.delete(change_request_id)


def test_update_procurement_shop_creates_change_request_e2e(
    auth_client,
    division_director_auth_client,
    test_admin_user,
    test_division_director,
    loaded_db,
    test_grant_agreement,
    test_cr_blis,
    app_ctx,
):
    # PATCH the procurement shop
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_grant_agreement.id),
        json={
            "awarding_entity_id": 2,
        },
    )

    assert response.status_code == 202

    # Confirm change request created
    cr_service = ChangeRequestService(loaded_db)
    change_requests, _ = cr_service.get_list({"reviewer_user_id": test_division_director.id, "limit": 10, "offset": 0})
    matching_crs = [
        cr
        for cr in change_requests
        if cr.agreement_id == test_grant_agreement.id
        and cr.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST
    ]
    assert len(matching_crs) == 1

    # Confirm agreement updated to reflect change request in review
    updated_agreement = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    assert updated_agreement.awarding_entity_id == 1
    assert updated_agreement.in_review is True
    assert updated_agreement.change_requests_in_review is not None

    # get change request from API
    request = auth_client.get(
        url_for("api.change-requests-list"),
        query_string={"userId": test_division_director.id},
    )

    assert request.status_code == 200
    assert len(request.json) == 1
    assert matching_crs[0].id == request.json[0]["id"]

    # approve the change request
    response = division_director_auth_client.patch(
        url_for("api.change-requests-list"),
        json={"change_request_id": matching_crs[0].id, "action": "APPROVE"},
    )

    assert response.status_code == 200

    # Confirm agreement updated to reflect approved change request
    updated_agreement = loaded_db.get(GrantAgreement, test_grant_agreement.id)
    assert updated_agreement.awarding_entity_id == 2
    assert updated_agreement.in_review is False
    assert updated_agreement.change_requests_in_review is None


def test_update_awarding_entity_fails_when_agreement_in_review_with_procurement_shop_changes(
    monkeypatch,
    test_admin_user,
    loaded_db,
    test_grant_agreement,
    test_cr_blis,
):
    # Patch auth and association checks
    monkeypatch.setattr("ops_api.ops.services.agreements.get_current_user", lambda: test_admin_user)
    monkeypatch.setattr("ops_api.ops.services.agreements.associated_with_agreement", lambda _: True)

    # Create a change request (this should automatically set agreement to in_review)
    cr = AgreementChangeRequest(
        agreement_id=test_grant_agreement.id,
        change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        status=ChangeRequestStatus.IN_REVIEW,
        requested_change_data={"awarding_entity_id": 2},
        created_by=test_admin_user.id,
    )
    loaded_db.add(cr)
    loaded_db.commit()
    loaded_db.refresh(test_grant_agreement)

    # Verify agreement is now in_review
    assert test_grant_agreement.in_review is True

    # Attempt to trigger another procurement shop change request
    service = AgreementsService(loaded_db)
    with pytest.raises(ValidationError):
        service.update(
            test_grant_agreement.id,
            {"awarding_entity_id": 3, "agreement_cls": GrantAgreement},
        )

    # Cleanup - remove the change request (in_review should update automatically)
    loaded_db.delete(cr)
    loaded_db.commit()
