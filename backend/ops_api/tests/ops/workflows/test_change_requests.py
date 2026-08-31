import datetime
from decimal import Decimal

from flask import url_for

from models import (
    Agreement,
    AgreementChangeRequest,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ChangeRequest,
    ChangeRequestNotification,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractBudgetLineItem,
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    Division,
    ProcurementTrackerStatus,
    ProcurementTrackerStepType,
    User,
)
from ops_api.ops.services.agreement_history import AgreementHistoryService

test_no_perms_user_id = 506

# ---=== CHANGE REQUESTS ===---


def test_change_request(app, app_ctx):
    session = app.db_session
    change_request = ChangeRequest()
    change_request.created_by = 1
    change_request.requested_change_data = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.change_request_type == ChangeRequestType.CHANGE_REQUEST

    session.delete(change_request)
    session.commit()


def test_agreement_change_request(app, app_ctx):
    session = app.db_session
    change_request = AgreementChangeRequest()
    change_request.agreement_id = 1
    change_request.created_by = 1
    change_request.requested_change_data = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request = session.get(ChangeRequest, new_change_request_id)
    assert change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST

    session.delete(change_request)
    session.commit()


def test_budget_line_item_change_request(app, test_bli, app_ctx):
    session = app.db_session
    change_request = BudgetLineItemChangeRequest()
    change_request.budget_line_item_id = test_bli.id
    change_request.agreement_id = 1
    change_request.created_by = 1
    change_request.requested_change_data = {"foo": "bar"}
    session.add(change_request)
    session.commit()

    assert change_request.id is not None
    new_change_request_id = change_request.id
    change_request: ChangeRequest = session.get(ChangeRequest, new_change_request_id)
    assert change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST

    session.delete(change_request)
    session.commit()


def test_budget_line_item_patch_with_budgets_change_requests(
    basic_user_auth_client,
    division_director_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    session = app.db_session
    agreement_id = 1
    history_service = AgreementHistoryService(session)
    # initialize hist count
    hists, _ = history_service.get(agreement_id, limit=100, offset=0)
    prev_hist_count = len(hists)

    # Add basic_user (521) as a team member on agreement 1 so they pass the association check.
    # Agreement 1's existing members are all superusers or division directors; 521 is a plain
    # VIEWER_EDITOR who will trigger the change-request workflow (not bypass it).
    agreement = session.get(Agreement, agreement_id)
    basic_user = session.get(User, 521)
    agreement.team_members.append(basic_user)
    session.flush()

    #  create PLANNED BLI with a valid future date so required-field validation passes.
    #  Use a date different from the patch target (2032-02-02) so patching date_needed creates a CR.
    #  Agreement 1 is a contract agreement, so use ContractBudgetLineItem (grant BLIs now require
    #  grant_number_id for status changes and would fail validation on this agreement).
    bli = ContractBudgetLineItem(
        line_description="SC1",
        agreement_id=1,
        can_id=test_can.id,
        amount=111.11,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2033, 1, 1),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    assert bli.id is not None
    bli_id = bli.id

    # verify agreement history added
    hists, _ = history_service.get(agreement_id, limit=100, offset=0)

    #  submit PATCH BLI which triggers a budget change requests
    # SC 1 on agreement 1 has period_start=2043-06-13 and period_end=2044-06-13; date must be within that window.
    data = {"amount": 222.22, "can_id": 501, "date_needed": "2043-09-01"}
    response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 202
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    change_requests_in_review = resp_json["change_requests_in_review"]
    assert len(change_requests_in_review) == 3

    # verify agreement history added for 3 change requests
    hists, _ = history_service.get(agreement_id, limit=100, offset=0)
    hist_count = len(hists)
    # 4 change requests
    assert hist_count == prev_hist_count + 3
    prev_hist_count = hist_count

    can_id_change_request_id = None
    change_request_ids = []
    for change_request in change_requests_in_review:
        assert "id" in change_request
        change_request_id = change_request["id"]
        change_request_ids.append(change_request_id)
        assert change_request["change_request_type"] == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
        assert change_request["budget_line_item_id"] == bli_id
        assert change_request["has_budget_change"] is True
        assert change_request["has_status_change"] is False
        assert "requested_change_data" in change_request
        requested_change_data = change_request["requested_change_data"]
        assert "requested_change_diff" in change_request
        requested_change_diff = change_request["requested_change_diff"]
        assert requested_change_diff.keys() == requested_change_data.keys()
        if "amount" in requested_change_data:
            assert requested_change_data["amount"] == 222.22
            assert requested_change_diff["amount"]["old"] == 111.11
            assert requested_change_diff["amount"]["new"] == 222.22
        if "date_needed" in requested_change_data:
            assert requested_change_data["date_needed"] == "2043-09-01"
            assert requested_change_diff["date_needed"]["old"] == "2033-01-01"
            assert requested_change_diff["date_needed"]["new"] == "2043-09-01"
        if "can_id" in requested_change_data:
            assert can_id_change_request_id is None
            can_id_change_request_id = change_request_id
            assert requested_change_data["can_id"] == 501
            assert requested_change_diff["can_id"]["old"] == 500
            assert requested_change_diff["can_id"]["new"] == 501
    assert can_id_change_request_id is not None

    # verify the BLI was not updated yet
    bli = session.get(BudgetLineItem, bli_id)
    assert str(bli.amount) == "111.11"
    assert bli.amount == Decimal("111.11")
    assert bli.can_id == 500
    assert bli.date_needed == datetime.date(2033, 1, 1)
    assert len(bli.change_requests_in_review) == len(change_request_ids)
    assert bli.in_review is True

    # verify the change requests and in_review are in the BLI
    response = division_director_auth_client.get(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    assert len(resp_json["change_requests_in_review"]) == 3
    assert "in_review" in resp_json
    assert resp_json["in_review"] is True

    # verify the change requests and in_review are in the agreement's BLIs
    response = division_director_auth_client.get(url_for("api.agreements-item", id=bli.agreement_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "budget_line_items" in resp_json
    ag_blis = resp_json["budget_line_items"]
    ag_bli = next((bli for bli in ag_blis if bli["id"] == bli_id), None)
    assert ag_bli is not None
    assert "in_review" in ag_bli
    assert ag_bli["in_review"] is True
    assert "change_requests_in_review" in ag_bli
    assert len(ag_bli["change_requests_in_review"]) == 3
    ag_bli_other = next((bli for bli in ag_blis if bli["id"] != bli_id), None)
    assert "in_review" in ag_bli_other
    assert ag_bli_other["in_review"] is False
    assert "change_requests_in_review" in ag_bli
    assert ag_bli_other["change_requests_in_review"] is None

    # verify managing_division
    for change_request in change_requests_in_review:
        assert "managing_division_id" in change_request
        assert change_request["managing_division_id"] == 5

    # review the change requests, reject the can_id change request and approve the others
    for change_request in change_requests_in_review:
        change_request_id = change_request["id"]
        can_request = "can_id" in change_request["requested_change_data"]
        action = "REJECT" if can_request else "APPROVE"
        data = {"action": action}
        response = division_director_auth_client.patch(
            url_for("api.change-requests-item", id=change_request_id), json=data
        )
        assert response.status_code == 200

    # verify agreement history added for 3 reviews
    hists, _ = history_service.get(agreement_id, limit=100, offset=0)
    hist_count = len(hists)
    assert hist_count == prev_hist_count + 3
    prev_hist_count = hist_count

    # verify the BLI was updated
    bli = session.get(BudgetLineItem, bli_id)
    assert bli.amount == Decimal("222.22")
    assert bli.can_id == 500  # can_id change request was rejected
    assert bli.date_needed == datetime.date(2043, 9, 1)
    assert bli.change_requests_in_review is None
    assert bli.in_review is False

    # verify delete cascade
    session.delete(bli)
    session.commit()
    for change_request_id in change_request_ids:
        change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
        assert change_request is None
    bli = session.get(BudgetLineItem, bli_id)
    assert bli is None


def test_change_request_list(auth_client, app, test_user, test_admin_user, test_bli, app_ctx):
    session = app.db_session

    # verify no change request in list to review for this user
    response = auth_client.get(url_for("api.change-requests-list"), query_string={"userId": test_admin_user.id})
    assert response.status_code == 200
    assert len(response.json["data"]) == 0

    # create a change request
    change_request1 = BudgetLineItemChangeRequest()
    change_request1.status = ChangeRequestStatus.IN_REVIEW
    change_request1.budget_line_item_id = test_bli.id
    change_request1.agreement_id = 1
    change_request1.created_by = test_user.id
    change_request1.managing_division_id = 1
    change_request1.requested_change_data = {"key": "value"}
    session.add(change_request1)
    session.commit()

    # change division#1 director and division#2 deputy directory to this test user
    division1: Division = session.get(Division, 1)
    division1.division_director_id = test_admin_user.id
    session.add(division1)
    division2: Division = session.get(Division, 2)
    division2.deputy_division_director_id = test_admin_user.id
    session.add(division2)
    session.commit()

    # verify there is one change request in the list to review for this user
    response = auth_client.get(url_for("api.change-requests-list"), query_string={"userId": test_admin_user.id})
    assert response.status_code == 200
    assert response.json["count"] == 1
    assert len(response.json["data"]) == 1
    cr1 = response.json["data"][0]
    assert "has_budget_change" in cr1
    assert not cr1["has_status_change"]
    assert "has_status_change" in cr1
    assert not cr1["has_status_change"]
    assert "has_proc_shop_change" in cr1
    assert not cr1["has_proc_shop_change"]

    # create a change request for division#2
    change_request2 = BudgetLineItemChangeRequest()
    change_request2.status = ChangeRequestStatus.IN_REVIEW
    change_request2.budget_line_item_id = 15001
    change_request2.agreement_id = 1
    change_request2.requested_change_data = {"key": "value"}
    change_request2.created_by = test_user.id
    change_request2.managing_division_id = 2
    session.add(change_request2)
    session.commit()

    # verify there is two change requests in the list to review for this user
    response = auth_client.get(url_for("api.change-requests-list"), query_string={"userId": test_admin_user.id})
    assert response.status_code == 200
    assert response.json["count"] == 2
    assert len(response.json["data"]) == 2

    # review (approve/reject) the change requests
    change_request1.status = ChangeRequestStatus.APPROVED
    change_request2.status = ChangeRequestStatus.REJECTED
    session.add(change_request1)
    session.add(change_request2)
    session.commit()

    # verify no change request in the list to review for this user
    response = auth_client.get(url_for("api.change-requests-list"), query_string={"userId": test_admin_user.id})

    assert response.status_code == 200
    assert len(response.json["data"]) == 0

    # cleanup
    division1.division_director_id = 522
    session.add(division1)
    division2.division_director_id = 520
    session.add(division2)
    session.delete(change_request1)
    session.delete(change_request2)
    session.commit()


def test_budget_line_item_patch_with_status_change_requests(
    budget_team_auth_client,
    division_director_auth_client,
    app,
    loaded_db,
    test_division_director,
    app_ctx,
):
    session = app.db_session
    agreement_id = 1

    # initialize hist count
    response = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
    assert response.status_code == 200
    prev_hist_count = len(response.json["data"])

    #  create DRAFT BLI with missing required fields
    bli = ContractBudgetLineItem(
        line_description="SC1",
        agreement_id=agreement_id,
        status=BudgetLineItemStatus.DRAFT,
        created_by=test_division_director.id,
        services_component_id=1,
    )
    session.add(bli)
    session.commit()
    assert bli.id is not None
    bli_id = bli.id
    assert agreement_id == bli.agreement_id

    #  submit PATCH BLI which is rejected due to missing required fields
    data = {"status": "PLANNED", "requestor_notes": "Notes from the requestor"}
    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 400
    assert "errors" in response.json

    # make the BLI valid for status change
    # SC 1 on agreement 1 has period_start=2043-06-13 and period_end=2044-06-13; date must be within that window.
    bli.can_id = 500
    bli.amount = 111.11
    bli.date_needed = datetime.date(2043, 9, 1)
    session.add(bli)
    session.commit()

    #  submit PATCH BLI which triggers a change request for status change
    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)

    assert response.status_code == 202
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    change_requests_in_review = resp_json["change_requests_in_review"]
    assert len(change_requests_in_review) == 1
    change_request = change_requests_in_review[0]
    change_request_id = change_request["id"]
    assert change_request["change_request_type"] == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST.name
    assert change_request["budget_line_item_id"] == bli_id
    assert change_request["has_budget_change"] is False
    assert change_request["has_status_change"] is True
    assert "requested_change_data" in change_request
    requested_change_data = change_request["requested_change_data"]
    assert "requested_change_diff" in change_request
    requested_change_diff = change_request["requested_change_diff"]
    assert requested_change_diff.keys() == requested_change_data.keys()
    assert requested_change_data["status"] == "PLANNED"
    assert requested_change_diff["status"]["old"] == "DRAFT"
    assert requested_change_diff["status"]["new"] == "PLANNED"
    assert "managing_division_id" in change_request
    assert change_request["managing_division_id"] == 5
    assert change_request["requestor_notes"] == data["requestor_notes"]

    # # verify agreement history added for 1 change request
    response = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
    assert response.status_code == 200
    hist_count = len(response.json["data"])
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count

    # verify the change request and in_review are in the BLI
    response = division_director_auth_client.get(url_for("api.budget-line-items-item", id=bli_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    assert len(resp_json["change_requests_in_review"]) == 1
    assert "in_review" in resp_json
    assert resp_json["in_review"] is True

    # verify the change request and in_review are in the agreement's BLIs
    response = division_director_auth_client.get(url_for("api.agreements-item", id=agreement_id))
    assert response.status_code == 200
    resp_json = response.json
    assert "budget_line_items" in resp_json
    ag_blis = resp_json["budget_line_items"]
    ag_bli = next((bli for bli in ag_blis if bli["id"] == bli_id), None)
    assert ag_bli is not None
    assert "in_review" in ag_bli
    assert ag_bli["in_review"] is True
    assert "change_requests_in_review" in ag_bli
    assert len(ag_bli["change_requests_in_review"]) == 1
    ag_bli_other = next((bli for bli in ag_blis if bli["id"] != bli_id), None)
    assert "in_review" in ag_bli_other
    assert ag_bli_other["in_review"] is False
    assert "change_requests_in_review" in ag_bli
    assert ag_bli_other["change_requests_in_review"] is None

    # approve the change request
    data = {
        "action": "APPROVE",
        "reviewer_notes": "Notes from the reviewer",
    }
    response = division_director_auth_client.patch(url_for("api.change-requests-item", id=change_request_id), json=data)
    assert response.status_code == 200

    # query Notification to find the ChangeRequestNotification for the approval sent to the submitter
    notification = (
        loaded_db.query(ChangeRequestNotification)
        .filter_by(
            change_request_id=change_request_id,
            recipient_id=change_request["created_by"],
        )
        .first()
    )
    assert notification is not None
    print(notification.message)
    assert notification.change_request.id == change_request_id

    # verify agreement history added for 1 review and 1 update
    response = division_director_auth_client.get(url_for("api.agreement-history", id=agreement_id, limit=100))
    hist_count = len(response.json["data"])
    assert hist_count == prev_hist_count + 1
    prev_hist_count = hist_count

    # verify the change request was updated
    change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
    assert change_request.status == ChangeRequestStatus.APPROVED
    assert change_request.reviewer_notes == data["reviewer_notes"]

    # verify the BLI was updated
    bli = session.get(BudgetLineItem, bli_id)
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert bli.change_requests_in_review is None
    assert bli.in_review is False

    # verify delete cascade
    session.delete(bli)
    session.commit()
    change_request = session.get(BudgetLineItemChangeRequest, change_request_id)
    assert change_request is None
    bli = session.get(BudgetLineItem, bli_id)
    assert bli is None


def test_change_request_review_auth(
    no_perms_auth_client,
    division_director_auth_client,
    division_6_director_auth_client,
    test_change_request,
    app_ctx,
):

    # verify access denied for use with no permissions (no roles) and not a DD or DDD
    data = {"action": "APPROVE"}
    response = no_perms_auth_client.patch(url_for("api.change-requests-item", id=test_change_request.id), json=data)
    assert response.status_code == 403

    # verify that division directors cannot approve/deny change requests outside their division.
    data = {"action": "APPROVE"}
    response = division_6_director_auth_client.patch(
        url_for("api.change-requests-item", id=test_change_request.id), json=data
    )
    assert response.status_code == 403

    # verify access now granted
    data = {"action": "APPROVE"}
    response = division_director_auth_client.patch(
        url_for("api.change-requests-item", id=test_change_request.id), json=data
    )
    assert response.status_code == 200

    # delete change request


# ---=== CAN-ID FALLBACK BRANCH COVERAGE (OPS-2280) ===---


def test_bli_patch_can_id_fallback_resolves_division_from_incoming_can(
    basic_user_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """
    When a PLANNED BLI has no CAN assigned (can_id=None) and the PATCH includes a can_id,
    the change-request service must resolve the managing division from the *incoming* CAN
    rather than the null DB can_id.

    Expected: 202, one change request whose managing_division_id matches the incoming CAN's
    division, and a ChangeRequestNotification sent to that division's director.
    """
    # Add basic_user (521) to agreement 1's team so they pass the association check
    agreement = app.db_session.get(Agreement, 1)
    basic_user = app.db_session.get(User, 521)
    if basic_user not in agreement.team_members:
        agreement.team_members.append(basic_user)
        app.db_session.flush()

    # Create a PLANNED BLI with no CAN but a valid future date
    bli = ContractBudgetLineItem(
        line_description="BLI with no initial CAN",
        agreement_id=1,
        can_id=None,
        amount=100.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 9, 1),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    # PATCH: change the amount AND assign a CAN for the first time
    data = {"amount": 200.00, "can_id": test_can.id}
    response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 202, response.json

    resp_json = response.json
    assert "change_requests_in_review" in resp_json
    change_requests = resp_json["change_requests_in_review"]
    # One CR for amount, one for can_id
    assert len(change_requests) >= 1

    # All CRs must have a non-null managing_division_id (resolved from the incoming CAN)
    for cr in change_requests:
        assert (
            cr.get("managing_division_id") is not None
        ), "managing_division_id should be resolved from the incoming CAN, not the null DB can_id"

    # At least one ChangeRequestNotification sent to division 5's director (user 522, test_can → division 5)
    cr_id = change_requests[0]["id"]
    notification = (
        loaded_db.query(ChangeRequestNotification)
        .filter_by(change_request_id=cr_id, recipient_id=test_division_director.id)
        .first()
    )
    assert (
        notification is not None
    ), "A ChangeRequestNotification must be sent to the division director resolved from the incoming CAN"


def test_bli_patch_can_id_fallback_validation_error_when_no_can_provided(
    basic_user_auth_client,
    app,
    loaded_db,
    test_division_director,
    app_ctx,
):
    """
    When a PLANNED BLI has can_id=None in the DB AND the PATCH does not include a can_id,
    attempting a financial change must raise a 400 ValidationError with the 'can_id' message.
    """
    # Add basic_user (521) to agreement 1's team so they pass the association check
    agreement = app.db_session.get(Agreement, 1)
    basic_user = app.db_session.get(User, 521)
    if basic_user not in agreement.team_members:
        agreement.team_members.append(basic_user)
        app.db_session.flush()

    # Create a PLANNED BLI with no CAN but a valid future date
    bli = ContractBudgetLineItem(
        line_description="BLI with no CAN, no can_id in PATCH",
        agreement_id=1,
        can_id=None,
        amount=100.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2032, 2, 2),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    app.db_session.add(bli)
    app.db_session.commit()
    bli_id = bli.id

    # PATCH only the amount — no can_id provided; must be rejected with a 400 error
    # related to the missing CAN (either "can_id" key or "missing required fields" which
    # includes can_id in its required-field check).
    data = {"amount": 999.99}
    response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert response.status_code == 400, response.json


def test_budget_team_bli_patch_writes_directly_no_change_request(
    budget_team_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """
    A Budget Team user editing a PLANNED BLI's financial fields must get a direct write
    (HTTP 200) rather than a change request (HTTP 202), but ONLY when the agreement has
    an active award-approval request (step 6). This covers the is_budget_team() bypass
    added in OPS-2280.
    """
    # Set up an active procurement tracker with a pending AWARD approval for agreement 1
    tracker = DefaultProcurementTracker(agreement_id=1, status=ProcurementTrackerStatus.ACTIVE)
    loaded_db.add(tracker)
    loaded_db.flush()
    award_step = DefaultProcurementTrackerStep(
        procurement_tracker_id=tracker.id,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        award_approval_requested=True,
        award_approval_status=None,  # pending — not yet approved or declined
    )
    loaded_db.add(award_step)

    # Create a PLANNED BLI with a CAN and a valid future date
    bli = ContractBudgetLineItem(
        line_description="BLI for budget-team direct-write test",
        agreement_id=1,
        can_id=test_can.id,
        amount=500.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 9, 1),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    # Budget Team patches a financial field → should write directly, not create a CR
    data = {"amount": 750.00}
    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert (
        response.status_code == 200
    ), f"Budget Team should get a direct 200 write, not a 202 change-request. Got: {response.json}"
    assert not response.json.get("change_requests_in_review"), "Budget Team edits must not create change requests"

    # Confirm the BLI was updated in the DB
    updated_bli = loaded_db.get(type(bli), bli_id)
    assert float(updated_bli.amount) == 750.00


def test_budget_team_bli_patch_creates_change_request_without_active_award_approval(
    budget_team_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """
    A Budget Team user editing a PLANNED BLI when NO active award-approval request
    exists must still go through the change-request workflow (HTTP 202).
    This is the negative case: the bypass must not apply outside the award-approval flow.
    """
    # Agreement 1 has no procurement tracker in seed data — is_award_approval_requested returns False
    bli = ContractBudgetLineItem(
        line_description="BLI for budget-team no-bypass test",
        agreement_id=1,
        can_id=test_can.id,
        amount=500.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 9, 1),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    data = {"amount": 750.00}
    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert (
        response.status_code == 202
    ), f"Budget Team without active award approval should get a 202 change-request. Got: {response.json}"
    assert response.json.get(
        "change_requests_in_review"
    ), "A change request must be created when no active award approval exists"


def test_budget_team_bli_patch_writes_directly_when_tracker_not_active(
    budget_team_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """
    The bypass must apply even when the procurement tracker status is not ACTIVE
    (e.g. COMPLETED), as long as the AWARD step has a pending approval request.
    Regression test for the ACTIVE-filter removal in is_award_approval_requested.
    """
    # Use a COMPLETED tracker — previously this would have caused is_award_approval_requested
    # to return False and the bypass to silently fail.
    tracker = DefaultProcurementTracker(agreement_id=1, status=ProcurementTrackerStatus.COMPLETED)
    loaded_db.add(tracker)
    loaded_db.flush()
    award_step = DefaultProcurementTrackerStep(
        procurement_tracker_id=tracker.id,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        award_approval_requested=True,
        award_approval_status=None,  # pending — not yet approved or declined
    )
    loaded_db.add(award_step)

    # Agreement 1 is a contract agreement, so use ContractBudgetLineItem (grant BLIs now require
    # grant_number_id for status changes and would fail validation on this agreement).
    bli = ContractBudgetLineItem(
        line_description="BLI for budget-team bypass with non-active tracker",
        agreement_id=1,
        can_id=test_can.id,
        amount=500.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 9, 1),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    bli_id = bli.id

    data = {"amount": 750.00}
    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli_id), json=data)
    assert (
        response.status_code == 200
    ), f"Budget Team bypass should work even when tracker is COMPLETED. Got: {response.json}"
    assert not response.json.get("change_requests_in_review"), "No change request should be created"

    updated_bli = loaded_db.get(type(bli), bli_id)
    assert float(updated_bli.amount) == 750.00


# --- Post-pre-award lock tests ---


def _setup_fully_approved_pre_award(loaded_db):
    """Helper: create a procurement tracker with a fully approved PRE_AWARD step on agreement 1."""
    tracker = DefaultProcurementTracker(agreement_id=1, status=ProcurementTrackerStatus.ACTIVE)
    loaded_db.add(tracker)
    loaded_db.flush()
    pre_award_step = DefaultProcurementTrackerStep(
        procurement_tracker_id=tracker.id,
        step_number=5,
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        pre_award_approval_requested=True,
        pre_award_approval_status="APPROVED",
        pre_award_requisition_approved_by=500,  # approved by user 500
    )
    loaded_db.add(pre_award_step)
    return tracker, pre_award_step


def _make_planned_bli(loaded_db, test_can, test_division_director):
    """Helper: create a PLANNED BLI on agreement 1."""
    bli = ContractBudgetLineItem(
        line_description="BLI for post-pre-award lock test",
        agreement_id=1,
        can_id=test_can.id,
        amount=500.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 9, 1),
        created_by=test_division_director.id,
        services_component_id=1,
    )
    loaded_db.add(bli)
    return bli


def test_post_pre_award_lock_blocks_regular_user(
    basic_user_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """Regular users cannot edit BLIs once pre-award is fully approved."""
    # Add basic user (521) as team member so they pass the association check
    agreement = app.db_session.get(Agreement, 1)
    basic_user = app.db_session.get(User, 521)
    agreement.team_members.append(basic_user)
    app.db_session.flush()

    _setup_fully_approved_pre_award(loaded_db)
    bli = _make_planned_bli(loaded_db, test_can, test_division_director)
    loaded_db.commit()

    response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 750.00})
    assert response.status_code == 400, f"Should be blocked after full pre-award approval. Got: {response.json}"
    assert "Pre-Award Approval" in response.json.get("errors", {}).get("status", "")


def test_post_pre_award_lock_allows_clin_only_for_any_user(
    basic_user_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """Any authorized user can update clin_id after pre-award is fully approved — CLIN assignment
    is part of the award workflow (COR assigns CLINs before submitting for award approval)."""
    # Add basic user (521) as team member so they pass the association check
    agreement = app.db_session.get(Agreement, 1)
    basic_user = app.db_session.get(User, 521)
    agreement.team_members.append(basic_user)
    app.db_session.flush()

    _setup_fully_approved_pre_award(loaded_db)
    bli = _make_planned_bli(loaded_db, test_can, test_division_director)
    loaded_db.commit()

    response = basic_user_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"clin_id": 1})
    assert response.status_code == 200, f"clin_id update should be allowed for any user. Got: {response.json}"


def test_post_pre_award_lock_blocks_mixed_clin_and_financial_edit(
    basic_user_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """A payload containing clin_id AND a financial field is blocked — the clin-only exception
    is exact and cannot be used as a loophole to sneak through financial changes."""
    agreement = app.db_session.get(Agreement, 1)
    basic_user = app.db_session.get(User, 521)
    agreement.team_members.append(basic_user)
    app.db_session.flush()

    _setup_fully_approved_pre_award(loaded_db)
    bli = _make_planned_bli(loaded_db, test_can, test_division_director)
    loaded_db.commit()

    response = basic_user_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json={"clin_id": 1, "amount": 750.00}
    )
    assert response.status_code == 400, f"Mixed clin+financial edit should be blocked. Got: {response.json}"
    assert "Pre-Award Approval" in response.json.get("errors", {}).get("status", "")


def test_post_pre_award_lock_allows_budget_team(
    budget_team_auth_client,
    app,
    loaded_db,
    test_division_director,
    test_can,
    app_ctx,
):
    """Budget team can still edit BLIs after pre-award approval (routes through change-request)."""
    _setup_fully_approved_pre_award(loaded_db)
    bli = _make_planned_bli(loaded_db, test_can, test_division_director)
    loaded_db.commit()

    response = budget_team_auth_client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"amount": 750.00})
    # Budget team is not blocked — goes through change-request workflow (202)
    assert response.status_code == 202, f"Budget team should get 202 change-request. Got: {response.json}"
