"""Integration tests for Services Component add/delete on Awarded agreements (OPS-6440, AC6/AC7).

On an Awarded agreement, adding an SC goes to Division Director approval through a
``ServicesComponentChangeRequest``, with or without budget lines. Deleting an SC with no budget
lines, or only Draft ones, goes to approval too; deleting one with non-Draft budget lines is
blocked for everyone but superusers. These tests cover creating the requests, approving/declining
them, keeping a pending SC's add request in step with its budget lines, and the delete block.

``basic_user_auth_client`` (user 521) is a team member on the test agreements and submits the
changes; ``division_director_auth_client`` (user 522) directs division 5, which manages
``test_can`` (CAN 500), and reviews them.
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError

from models import (
    AgreementHistory,
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequestNotification,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractModificationEdit,
    ContractType,
    ProcurementAction,
    ProcurementActionStatus,
    ServicesComponent,
    ServicesComponentChangeRequest,
    User,
)
from ops_api.ops.services.change_requests import ChangeRequestService

SYSTEM_OWNER_USER_ID = 503
BASIC_USER_ID = 521
DIVISION_DIRECTOR_USER_ID = 522


@pytest.fixture()
def modified_loe_enabled(app):
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = True
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


@pytest.fixture()
def awarded_agreement(loaded_db, test_project, test_can):
    """An Awarded Contract agreement with SC1 and one Planned budget line on ``test_can``.

    That budget line is what resolves the agreement's Division Director (division 5).
    Cleans up everything the tests can create on it.
    """
    suffix = datetime.datetime.now().strftime("%H%M%S%f")
    agreement = ContractAgreement(
        name=f"SC Change Request Test Agreement {suffix}",
        contract_number=f"CTSCCR{suffix}",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        product_service_code_id=2,
        description="Agreement for the OPS-6440 services component change request tests",
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=SYSTEM_OWNER_USER_ID,
        awarding_entity_id=1,
    )
    loaded_db.add(agreement)
    loaded_db.flush()
    agreement.team_members.append(loaded_db.get(User, BASIC_USER_ID))
    loaded_db.add(
        ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
    )
    loaded_db.commit()

    sc1 = ServicesComponent(agreement_id=agreement.id, number=1, optional=False)
    loaded_db.add(sc1)
    loaded_db.commit()
    _add_bli(loaded_db, agreement, sc1, test_can, BudgetLineItemStatus.PLANNED)
    loaded_db.refresh(agreement)
    agreement_id = agreement.id

    yield agreement

    loaded_db.rollback()
    params = {"id": agreement_id}
    loaded_db.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), params)
    loaded_db.execute(text("DELETE FROM change_request WHERE agreement_id = :id"), params)
    loaded_db.execute(text("DELETE FROM procurement_action WHERE agreement_id = :id"), params)
    loaded_db.commit()
    for bli in loaded_db.query(ContractBudgetLineItem).filter_by(agreement_id=agreement_id).all():
        loaded_db.delete(bli)
    loaded_db.commit()
    for sc in loaded_db.query(ServicesComponent).filter_by(agreement_id=agreement_id).all():
        loaded_db.delete(sc)
    loaded_db.commit()
    agreement = loaded_db.get(ContractAgreement, agreement_id)
    if agreement is not None:
        loaded_db.delete(agreement)
        loaded_db.commit()


def _add_bli(loaded_db, agreement, sc, can, status):
    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="SC change request test BLI",
        amount=100000.00,
        can_id=can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=status,
        proc_shop_fee_percentage=0,
        created_by=SYSTEM_OWNER_USER_ID,
        services_component_id=sc.id if sc else None,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli


def _add_sc(loaded_db, agreement, number, *, awaiting_add_approval=False):
    sc = ServicesComponent(
        agreement_id=agreement.id, number=number, optional=False, awaiting_add_approval=awaiting_add_approval
    )
    loaded_db.add(sc)
    loaded_db.commit()
    return sc


def _request(app, loaded_db, sc):
    """Create an SC add request the way the services component service will, as user 521."""
    service = ChangeRequestService(loaded_db)
    with app.test_request_context():
        cr_id = service.add_services_component_create_change_request(sc)
    change_request = loaded_db.get(ServicesComponentChangeRequest, cr_id)
    change_request.created_by = BASIC_USER_ID
    loaded_db.commit()
    return change_request


def _review(client, cr_id, action="APPROVE"):
    response = client.patch(url_for("api.change-requests-item", id=cr_id), json={"action": action})
    assert response.status_code == 200, response.json
    return response


def _sc_change_requests(loaded_db, agreement_id):
    loaded_db.expire_all()
    return list(
        loaded_db.scalars(
            select(ServicesComponentChangeRequest)
            .where(ServicesComponentChangeRequest.agreement_id == agreement_id)
            .order_by(ServicesComponentChangeRequest.id)
        ).all()
    )


def _edits(loaded_db, agreement_id):
    loaded_db.expire_all()
    return list(
        loaded_db.scalars(
            select(ContractModificationEdit)
            .where(ContractModificationEdit.agreement_id == agreement_id)
            .order_by(ContractModificationEdit.id)
        ).all()
    )


def _history_titles(loaded_db, agreement_id):
    loaded_db.expire_all()
    return [
        row.history_title
        for row in loaded_db.scalars(
            select(AgreementHistory).where(AgreementHistory.agreement_id_record == agreement_id)
        ).all()
    ]


# ---=== Creating the requests ===---


def test_add_request_payload_notifies_director_and_marks_sc_in_review(
    app, modified_loe_enabled, division_director_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)

    cr = _request(app, loaded_db, sc2)

    assert cr.change_request_type == ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST
    assert cr.status == ChangeRequestStatus.IN_REVIEW
    assert cr.requested_change_data == {"services_component_create": True}
    assert cr.requested_change_diff == {"services_component_create": {"old": None, "new": "SC2"}}
    assert cr.requested_change_info["target_display_name"] == "SC2"
    assert cr.requested_change_info["linked_budget_line_item_ids"] == [bli.id]
    data = cr.to_dict()
    assert data["has_services_component_change"] is True
    assert data["requires_contract_modification"] is True

    assert sc2.in_review is True
    # An SC request doesn't lock the agreement's budget lines.
    assert bli.in_review is False

    notification = loaded_db.scalar(
        select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == cr.id)
    )
    assert notification.recipient_id == DIVISION_DIRECTOR_USER_ID
    assert "type=budget-change" in notification.message

    response = division_director_auth_client.get(
        url_for("api.change-requests-list"), query_string={"userId": DIVISION_DIRECTOR_USER_ID}
    )
    assert response.status_code == 200, response.json
    (item,) = [item for item in response.json["data"] if item["id"] == cr.id]
    assert item["has_services_component_change"] is True
    assert item["services_component_id"] == sc2.id


def test_requires_contract_modification_is_false_when_flag_off(app, loaded_db, test_can, awarded_agreement, app_ctx):
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)

    cr = _request(app, loaded_db, sc2)

    assert cr.requires_contract_modification is False


def test_second_in_review_request_for_the_same_sc_is_rejected_by_the_database(
    app, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    _request(app, loaded_db, sc2)

    with pytest.raises(IntegrityError):
        _request(app, loaded_db, sc2)
    loaded_db.rollback()

    assert len(_sc_change_requests(loaded_db, awarded_agreement.id)) == 1


# ---=== Reviewing the requests ===---


def test_approved_add_clears_pending_flag_and_records_edit(
    app,
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    cr = _request(app, loaded_db, sc2)
    sc2_id = sc2.id

    _review(division_director_auth_client, cr.id)

    loaded_db.expire_all()
    sc2 = loaded_db.get(ServicesComponent, sc2_id)
    assert sc2.awaiting_add_approval is False
    assert sc2.in_review is False
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.services_component_id == sc2_id
    assert edit.budget_line_item_id is None
    assert edit.field == "services_component_create"
    assert edit.new_value == "SC2"
    assert edit.requested_by_id == BASIC_USER_ID

    notification = loaded_db.scalar(
        select(ChangeRequestNotification).where(
            ChangeRequestNotification.change_request_id == cr.id,
            ChangeRequestNotification.recipient_id == BASIC_USER_ID,
        )
    )
    assert notification.title == "Services Component Change Approved"
    assert notification.message == "Your request to add SC2 has been approved."
    assert "Services Component Addition Approved" in _history_titles(loaded_db, awarded_agreement.id)

    response = basic_user_auth_client.get(
        url_for("api.agreements-contract-modification-edits", id=awarded_agreement.id)
    )
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert record["services_component_id"] == sc2_id


def test_declined_add_removes_sc_and_keeps_its_budget_lines(
    app, modified_loe_enabled, division_director_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    cr = _request(app, loaded_db, sc2)
    sc2_id, bli_id, cr_id = sc2.id, bli.id, cr.id

    _review(division_director_auth_client, cr_id, action="REJECT")

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    cr = loaded_db.get(ServicesComponentChangeRequest, cr_id)
    assert cr.status == ChangeRequestStatus.REJECTED
    assert cr.services_component_id is None
    assert _edits(loaded_db, awarded_agreement.id) == []
    titles = _history_titles(loaded_db, awarded_agreement.id)
    assert "Services Component Addition Declined" in titles
    assert "Services Component Deleted" in titles


def test_declined_add_keeps_an_sc_whose_addition_was_already_approved(
    app, modified_loe_enabled, division_director_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    cr = _request(app, loaded_db, sc2)
    sc2_id, bli_id, cr_id = sc2.id, bli.id, cr.id
    # The addition was applied some other way (e.g. an earlier approval) while this request was in review.
    sc2.awaiting_add_approval = False
    loaded_db.commit()

    _review(division_director_auth_client, cr_id, action="REJECT")

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is not None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id == sc2_id
    assert loaded_db.get(ServicesComponentChangeRequest, cr_id).status == ChangeRequestStatus.REJECTED
    assert "Services Component Deleted" not in _history_titles(loaded_db, awarded_agreement.id)


def test_requester_and_other_division_director_cannot_review_sc_request(
    app,
    modified_loe_enabled,
    basic_user_auth_client,
    division_6_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    cr = _request(app, loaded_db, sc2)
    sc2_id, cr_id = sc2.id, cr.id

    for client in (basic_user_auth_client, division_6_director_auth_client):
        response = client.patch(url_for("api.change-requests-item", id=cr_id), json={"action": "APPROVE"})
        assert response.status_code == 403, response.json

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponentChangeRequest, cr_id).status == ChangeRequestStatus.IN_REVIEW
    assert loaded_db.get(ServicesComponent, sc2_id) is not None


# ---=== Draft -> Planned on a pending SC's budget line ===---


def _request_planned(client, bli_id):
    response = client.patch(url_for("api.budget-line-items-item", id=bli_id), json={"status": "PLANNED"})
    assert response.status_code == 202, response.json


def _bli_change_request(loaded_db, bli_id):
    loaded_db.expire_all()
    return loaded_db.scalar(
        select(BudgetLineItemChangeRequest).where(BudgetLineItemChangeRequest.budget_line_item_id == bli_id)
    )


def test_draft_to_planned_on_normal_sc_requests_no_sc_addition(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)

    _request_planned(basic_user_auth_client, bli.id)

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


@pytest.mark.parametrize("action", ["APPROVE", "REJECT"])
def test_reviewing_draft_to_planned_on_pending_sc_keeps_sc_addition_in_review(
    app,
    action,
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    _request(app, loaded_db, sc2)
    _request_planned(basic_user_auth_client, bli.id)

    _review(division_director_auth_client, _bli_change_request(loaded_db, bli.id).id, action=action)

    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert cr.status == ChangeRequestStatus.IN_REVIEW


# ---=== Keeping a pending SC's add request in step with its budget lines ===---


def test_approved_budget_line_delete_keeps_sc_addition_in_review(
    app,
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    _request(app, loaded_db, sc2)
    bli_id = bli.id

    response = basic_user_auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 202, response.json
    _review(division_director_auth_client, _bli_change_request(loaded_db, bli_id).id)

    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert cr.status == ChangeRequestStatus.IN_REVIEW


def test_pending_sc_without_a_request_gets_one_on_its_next_budget_line_link(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """An SC left pending with no request (saved before every addition needed approval)."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id, bli_id = sc2.id, bli.id

    response = _patch_bli(basic_user_auth_client, bli_id, {"services_component_id": sc2_id})
    assert response.status_code == 202, response.json

    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert cr.services_component_id == sc2_id
    assert cr.requested_change_info["linked_budget_line_item_ids"] == [bli_id]


def test_sync_add_request_rereads_flag_after_lock(
    app, mocker, modified_loe_enabled, loaded_db, test_can, awarded_agreement, app_ctx
):
    mocker.patch("ops_api.ops.utils.budget_line_items_helpers.is_super_user", return_value=False)
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    # An approval committed by another request: the row is updated, the loaded SC still says pending.
    loaded_db.execute(
        update(ServicesComponent).where(ServicesComponent.id == sc2.id).values(awaiting_add_approval=False),
        execution_options={"synchronize_session": False},
    )
    assert sc2.awaiting_add_approval is True

    with app.test_request_context():
        change_request_id = ChangeRequestService(loaded_db).sync_services_component_add_change_request(sc2)

    assert change_request_id is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


# ---=== Services Component service and resource ===---


def _post_sc(client, agreement_id, number):
    response = client.post(
        url_for("api.services-component-group"),
        json={"agreement_id": agreement_id, "number": number, "optional": False},
    )
    assert response.status_code == 201, response.json
    return response.json


def _patch_bli(client, bli_id, body):
    return client.patch(url_for("api.budget-line-items-item", id=bli_id), json=body)


def test_sc_added_after_award_with_no_budget_lines_goes_to_approval(
    modified_loe_enabled, basic_user_auth_client, loaded_db, awarded_agreement, app_ctx
):
    data = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)

    assert data["awaiting_add_approval"] is True
    assert data["in_review"] is True
    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert data["change_requests_in_review"][0]["id"] == cr.id
    assert cr.services_component_id == data["id"]
    assert cr.requested_change_data == {"services_component_create": True}
    assert cr.requested_change_info["linked_budget_line_item_ids"] == []
    assert cr.requires_contract_modification is True
    assert cr.created_by == BASIC_USER_ID
    notification = loaded_db.scalar(
        select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == cr.id)
    )
    assert notification.recipient_id == DIVISION_DIRECTOR_USER_ID
    titles = _history_titles(loaded_db, awarded_agreement.id)
    assert "New Services Component Added" in titles
    assert "Services Component Addition Requested" in titles


def test_approved_add_of_sc_with_no_budget_lines_shows_on_award_and_modifications(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    awarded_agreement,
    app_ctx,
):
    sc2_id = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)["id"]
    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)

    _review(division_director_auth_client, cr.id)

    response = basic_user_auth_client.get(
        url_for("api.agreements-contract-modification-edits", id=awarded_agreement.id)
    )
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert record["services_component_id"] == sc2_id
    assert record["field"] == "services_component_create"
    assert record["new_value"] == "SC2"


def test_sc_added_with_flag_off_is_not_pending(basic_user_auth_client, loaded_db, awarded_agreement, app, app_ctx):
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False

    data = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)

    assert data["awaiting_add_approval"] is False
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


def test_superuser_adding_an_sc_applies_directly(
    modified_loe_enabled, power_user_auth_client, loaded_db, awarded_agreement, app_ctx
):
    data = _post_sc(power_user_auth_client, awarded_agreement.id, 2)

    assert data["awaiting_add_approval"] is False
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


def test_linking_budget_lines_to_pending_sc_refreshes_its_one_request(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """Per-resource path: the SC is POSTed first and its budget lines are linked afterwards."""
    sc2_id = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)["id"]
    planned = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    planned_id = planned.id

    response = _patch_bli(basic_user_auth_client, planned_id, {"services_component_id": sc2_id})
    assert response.status_code == 200, response.json
    response = basic_user_auth_client.post(
        url_for("api.budget-line-items-group"),
        json={
            "agreement_id": awarded_agreement.id,
            "line_description": "Draft on pending SC",
            "amount": 1000.0,
            "can_id": test_can.id,
            "status": "DRAFT",
            "services_component_id": sc2_id,
        },
    )
    assert response.status_code == 201, response.json
    draft_id = response.json["id"]

    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert cr.requested_change_info["linked_budget_line_item_ids"] == [planned_id, draft_id]


def test_moving_the_last_budget_line_off_a_pending_sc_keeps_its_request(
    app, modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    _request(app, loaded_db, sc2)
    sc1_id = loaded_db.scalar(
        select(ServicesComponent.id).where(
            ServicesComponent.agreement_id == awarded_agreement.id, ServicesComponent.number == 1
        )
    )

    response = _patch_bli(basic_user_auth_client, bli.id, {"services_component_id": sc1_id})
    assert response.status_code in (200, 202), response.json

    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert cr.status == ChangeRequestStatus.IN_REVIEW
    assert cr.requested_change_info["linked_budget_line_item_ids"] == []


def test_superuser_linking_a_planned_budget_line_applies_the_sc_addition(
    modified_loe_enabled, power_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id = sc2.id

    response = _patch_bli(power_user_auth_client, bli.id, {"services_component_id": sc2_id})
    assert response.status_code == 200, response.json

    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    assert loaded_db.get(ServicesComponent, sc2_id).awaiting_add_approval is False


@pytest.mark.parametrize("client_fixture", ["basic_user_auth_client", "budget_team_auth_client"])
def test_deleting_sc_with_planned_budget_lines_is_blocked(
    request, client_fixture, modified_loe_enabled, loaded_db, test_can, awarded_agreement, app_ctx
):
    client = request.getfixturevalue(client_fixture)
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id, bli_id = sc2.id, bli.id

    response = client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 400, response.json
    assert response.json["errors"]["services_component"] == [
        "Services Components with budget lines cannot be deleted on awarded agreements."
    ]
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is not None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id == sc2_id
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []
    assert "Services Component Deleted" not in _history_titles(loaded_db, awarded_agreement.id)


def test_deleting_sc_with_planned_budget_lines_applies_directly_when_flag_off(
    basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id = sc2.id

    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None


def _delete_sc(client, sc_id, status_code):
    response = client.delete(url_for("api.services-component-item", id=sc_id))
    assert response.status_code == status_code, response.json
    return response.json


@pytest.mark.parametrize("draft_budget_line", [False, True])
def test_deleting_sc_with_no_non_draft_budget_lines_goes_to_approval(
    draft_budget_line, modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = (
        _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT) if draft_budget_line else None
    )
    sc2_id = sc2.id
    bli_ids = [bli.id] if bli else []

    data = _delete_sc(basic_user_auth_client, sc2_id, 202)

    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert data["change_request_id"] == cr.id
    assert cr.requested_change_data == {"services_component_delete": True}
    assert cr.requested_change_diff == {"services_component_delete": {"old": "SC2", "new": "Deleted"}}
    assert cr.requested_change_info["linked_budget_line_item_ids"] == bli_ids
    assert cr.has_services_component_change is True
    assert cr.requires_contract_modification is True
    sc2 = loaded_db.get(ServicesComponent, sc2_id)
    assert sc2 is not None
    assert sc2.in_review is True
    if bli:
        assert loaded_db.get(ContractBudgetLineItem, bli.id).services_component_id == sc2_id
    notification = loaded_db.scalar(
        select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == cr.id)
    )
    assert notification.recipient_id == DIVISION_DIRECTOR_USER_ID
    titles = _history_titles(loaded_db, awarded_agreement.id)
    assert "Services Component Deletion Requested" in titles
    assert "Services Component Deleted" not in titles


def test_approved_sc_delete_removes_sc_unlinks_draft_lines_and_records_edit(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id, bli_id = sc2.id, bli.id
    cr_id = _delete_sc(basic_user_auth_client, sc2_id, 202)["change_request_id"]

    _review(division_director_auth_client, cr_id)

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    cr = loaded_db.get(ServicesComponentChangeRequest, cr_id)
    assert cr.status == ChangeRequestStatus.APPROVED
    assert cr.services_component_id is None
    (edit,) = _edits(loaded_db, awarded_agreement.id)
    assert edit.services_component_id == sc2_id
    assert edit.field == "services_component_delete"
    assert edit.old_value == "SC2"
    assert edit.new_value == "Deleted"
    notification = loaded_db.scalar(
        select(ChangeRequestNotification).where(
            ChangeRequestNotification.change_request_id == cr_id,
            ChangeRequestNotification.recipient_id == BASIC_USER_ID,
        )
    )
    assert notification.message == "Your request to delete SC2 has been approved."
    titles = _history_titles(loaded_db, awarded_agreement.id)
    assert "Services Component Deletion Approved" in titles
    assert "Services Component Deleted" in titles

    response = basic_user_auth_client.get(
        url_for("api.agreements-contract-modification-edits", id=awarded_agreement.id)
    )
    assert response.status_code == 200, response.json
    (record,) = response.json["data"]
    assert record["field"] == "services_component_delete"
    assert record["old_value"] == "SC2"


def test_declined_sc_delete_keeps_sc_and_its_links(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id, bli_id = sc2.id, bli.id
    cr_id = _delete_sc(basic_user_auth_client, sc2_id, 202)["change_request_id"]

    _review(division_director_auth_client, cr_id, action="REJECT")

    loaded_db.expire_all()
    sc2 = loaded_db.get(ServicesComponent, sc2_id)
    assert sc2 is not None
    assert sc2.in_review is False
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id == sc2_id
    assert _edits(loaded_db, awarded_agreement.id) == []
    assert "Services Component Deletion Declined" in _history_titles(loaded_db, awarded_agreement.id)


def test_budget_lines_cannot_join_an_sc_whose_delete_is_in_review(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id, bli_id = sc2.id, bli.id
    _delete_sc(basic_user_auth_client, sc2_id, 202)

    response = _patch_bli(basic_user_auth_client, bli_id, {"services_component_id": sc2_id})
    assert response.status_code == 400, response.json
    response = basic_user_auth_client.post(
        url_for("api.budget-line-items-group"),
        json={
            "agreement_id": awarded_agreement.id,
            "line_description": "Draft on SC pending delete",
            "amount": 1000.0,
            "can_id": test_can.id,
            "status": "DRAFT",
            "services_component_id": sc2_id,
        },
    )
    assert response.status_code == 400, response.json

    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None


def test_deleting_sc_whose_approved_addition_is_pending_applies_directly(
    app,
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    awarded_agreement,
    app_ctx,
):
    """The addition and the delete cancel out, so nothing goes to the contract."""
    sc2_id = _post_sc(basic_user_auth_client, awarded_agreement.id, 2)["id"]
    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    _review(division_director_auth_client, cr.id)
    assert len(_edits(loaded_db, awarded_agreement.id)) == 1

    _delete_sc(basic_user_auth_client, sc2_id, 200)

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert _edits(loaded_db, awarded_agreement.id) == []
    assert len(_sc_change_requests(loaded_db, awarded_agreement.id)) == 1
    assert "Services Component Deleted" in _history_titles(loaded_db, awarded_agreement.id)


def test_deleting_pending_sc_without_a_request_applies_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    sc2_id = sc2.id

    _delete_sc(basic_user_auth_client, sc2_id, 200)

    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


def test_superuser_deleting_sc_with_planned_budget_lines_applies_directly(
    modified_loe_enabled, power_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc2_id, bli_id = sc2.id, bli.id

    response = power_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id is None
    assert _sc_change_requests(loaded_db, awarded_agreement.id) == []


def test_in_review_sc_cannot_be_edited_or_deleted(
    app, modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    _request(app, loaded_db, sc2)

    response = basic_user_auth_client.patch(
        url_for("api.services-component-item", id=sc2.id), json={"description": "changed"}
    )
    assert response.status_code == 400, response.json
    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2.id))
    assert response.status_code == 400, response.json


def test_bundle_new_sc_with_planned_budget_line_creates_request(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    bli = _add_bli(loaded_db, awarded_agreement, None, test_can, BudgetLineItemStatus.PLANNED)

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={
            "services_components": {"create": [{"ref": "sc2", "number": 2, "optional": False}]},
            "budget_line_items": {"update": [{"id": bli.id, "services_component_ref": "sc2"}]},
        },
    )

    assert response.status_code == 202, response.json
    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert cr.id in response.json["change_request_ids"]
    assert (
        loaded_db.scalar(select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == cr.id))
        is not None
    )


def test_bundle_new_sc_without_budget_lines_creates_request(
    modified_loe_enabled, basic_user_auth_client, loaded_db, awarded_agreement, app_ctx
):
    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={"services_components": {"create": [{"ref": "sc2", "number": 2, "optional": False}]}},
    )

    assert response.status_code == 202, response.json
    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert response.json["change_request_ids"] == [cr.id]
    assert (
        loaded_db.scalar(select(ChangeRequestNotification).where(ChangeRequestNotification.change_request_id == cr.id))
        is not None
    )


def test_bundle_deleting_draft_budget_lines_then_their_sc_sends_the_delete_to_approval(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.DRAFT)
    sc2_id = sc2.id

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={"services_components": {"delete": [sc2_id]}, "budget_line_items": {"delete": [bli.id]}},
    )

    assert response.status_code == 202, response.json
    assert response.json["services_components_deleted"] == 0
    (cr,) = _sc_change_requests(loaded_db, awarded_agreement.id)
    assert response.json["change_request_ids"] == [cr.id]
    assert cr.requested_change_data == {"services_component_delete": True}
    assert cr.requested_change_info["linked_budget_line_item_ids"] == []
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is not None


def test_bundle_sc_delete_with_planned_budget_line_is_blocked_and_rolls_back(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc3 = _add_sc(loaded_db, awarded_agreement, 3)
    sc2_id, sc3_id, bli_id = sc2.id, sc3.id, bli.id

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=awarded_agreement.id),
        json={"services_components": {"delete": [sc3_id, sc2_id]}},
    )

    assert response.status_code == 400, response.json
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is not None
    assert loaded_db.get(ServicesComponent, sc3_id) is not None
    assert loaded_db.get(ContractBudgetLineItem, bli_id).services_component_id == sc2_id


def test_sc_response_includes_its_in_review_request(
    app, modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    cr = _request(app, loaded_db, sc2)

    response = basic_user_auth_client.get(url_for("api.services-component-item", id=sc2.id))

    assert response.status_code == 200, response.json
    (item,) = response.json["change_requests_in_review"]
    assert item["id"] == cr.id
    assert item["has_services_component_change"] is True
    assert item["requested_change_info"]["linked_budget_line_item_ids"] == [bli.id]

    response = basic_user_auth_client.get(
        url_for("api.services-component-group"), query_string={"agreement_id": awarded_agreement.id}
    )
    sc1 = next(sc for sc in response.json if sc["number"] == 1)
    assert sc1["change_requests_in_review"] is None


def test_agreement_in_review_list_has_sc_fields_but_not_budget_flags(
    app, modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, awarded_agreement, app_ctx
):
    """The approve page combines this list with each BL's own requests, so BL requests here must not
    look like budget changes (that would review them twice)."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    sc_cr = _request(app, loaded_db, sc2)
    response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 5.0})
    assert response.status_code == 202, response.json

    response = basic_user_auth_client.get(url_for("api.agreements-item", id=awarded_agreement.id))

    assert response.status_code == 200, response.json
    by_id = {cr["id"]: cr for cr in response.json["change_requests_in_review"]}
    assert by_id[sc_cr.id]["has_services_component_change"] is True
    assert by_id[sc_cr.id]["requested_change_info"]["target_display_name"] == "SC2"
    bli_crs = [cr for cr in by_id.values() if cr["id"] != sc_cr.id]
    assert bli_crs and all("has_budget_change" not in cr for cr in bli_crs)


def test_requester_notification_carries_the_sc_request(
    app,
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    awarded_agreement,
    app_ctx,
):
    """The requester's approved/declined alert reads the request from the notification."""
    sc2 = _add_sc(loaded_db, awarded_agreement, 2, awaiting_add_approval=True)
    bli = _add_bli(loaded_db, awarded_agreement, sc2, test_can, BudgetLineItemStatus.PLANNED)
    cr = _request(app, loaded_db, sc2)
    _review(division_director_auth_client, cr.id, action="REJECT")

    response = basic_user_auth_client.get(url_for("api.notifications-group", user_id=BASIC_USER_ID))

    assert response.status_code == 200, response.json
    (notification,) = [n for n in response.json if (n.get("change_request") or {}).get("id") == cr.id]
    assert notification["change_request"]["requested_change_diff"] == {
        "services_component_create": {"old": None, "new": "SC2"}
    }
    assert notification["change_request"]["requested_change_info"]["linked_budget_line_item_ids"] == [bli.id]
