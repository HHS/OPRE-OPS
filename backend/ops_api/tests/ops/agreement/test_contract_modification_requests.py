"""Integration tests for Contract Modification requests (#3268).

The user sends the agreement's pending "Edits That Require a Contract Modification", plus any
Planned current-FY budget lines to execute, to the Division Director
(POST /agreements/<id>/contract-modifications/). The Director approves or declines it
(PATCH /contract-modification-requests/<id>/). Approval creates the ``AgreementMod``, attaches
the edits and executes the budget lines; a decline leaves the edits pending.
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import select

from models import (
    AgreementHistory,
    AgreementHistoryType,
    AgreementMod,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    ContractModificationRequest,
    ContractModificationRequestNotification,
    ContractModificationRequestStatus,
    Document,
    DocumentType,
    ModType,
    OpsEvent,
    OpsEventType,
    ServicesComponent,
    ServicesComponentChangeRequest,
    User,
)
from models.utils.fiscal_year import get_current_fiscal_year
from tests.ops.agreement.test_contract_modification_edits import (  # noqa: F401 (fixtures)
    BASIC_USER_ID,
    DIVISION_DIRECTOR_USER_ID,
    _approved_amount_edit,
    _edits,
    _get_pending,
    make_agreement,
    modified_loe_disabled,
    modified_loe_enabled,
)


def _submit(client, agreement_id, **body):
    return client.post(url_for("api.agreements-contract-modifications", id=agreement_id), json=body)


def _review_mod(client, request_id, action="APPROVE", **body):
    return client.patch(
        url_for("api.contract-modification-requests-item", id=request_id), json={"action": action, **body}
    )


def _add_bli(loaded_db, agreement, test_can, *, status=BudgetLineItemStatus.PLANNED, date_needed=None):
    """A BLI in the current fiscal year unless ``date_needed`` says otherwise."""
    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="Contract mod request test BLI",
        amount=100000.00,
        can_id=test_can.id,
        date_needed=date_needed or datetime.date.today(),
        status=status,
        proc_shop_fee_percentage=0,
        created_by=BASIC_USER_ID,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli


@pytest.fixture()
def awarded_with_edit(
    modified_loe_enabled,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,  # noqa: F811
):
    """An Awarded agreement with one approved amount edit and one executable Planned BLI."""
    agreement, bli = make_agreement(test_can)
    _approved_amount_edit(basic_user_auth_client, division_director_auth_client, loaded_db, bli, 500000.00)
    executable = _add_bli(loaded_db, agreement, test_can)
    return agreement, bli, executable


def _latest_event(loaded_db, event_type):
    return loaded_db.scalars(
        select(OpsEvent).where(OpsEvent.event_type == event_type).order_by(OpsEvent.id.desc()).limit(1)
    ).one()


# ---=== Submit ===---


def test_submit_puts_edits_in_review_and_notifies_the_director(
    awarded_with_edit, basic_user_auth_client, loaded_db, app_ctx
):
    agreement, _, executable = awarded_with_edit

    response = _submit(
        basic_user_auth_client,
        agreement.id,
        budget_line_item_ids=[executable.id],
        requestor_notes="Please review",
    )
    assert response.status_code == 201, response.json
    assert response.json["status"] == "IN_REVIEW"
    assert response.json["budget_line_item_ids"] == [executable.id]
    assert response.json["requestor_notes"] == "Please review"
    assert response.json["agreement_mod_id"] is None

    # AC12: the edits stay on the list, now marked In Review; nothing is applied yet.
    (pending,) = _get_pending(basic_user_auth_client, agreement.id).json["data"]
    assert pending["in_review"] is True
    assert pending["id"] in {edit["id"] for edit in response.json["edits"]}
    assert {e.agreement_mod_id for e in _edits(loaded_db, agreement.id)} == {None}
    assert loaded_db.get(ContractBudgetLineItem, executable.id).status == BudgetLineItemStatus.PLANNED

    notification = loaded_db.scalars(
        select(ContractModificationRequestNotification).where(
            ContractModificationRequestNotification.contract_modification_request_id == response.json["id"]
        )
    ).one()
    assert notification.recipient_id == DIVISION_DIRECTOR_USER_ID

    # AC13: who / when / what / remote IP.
    event = _latest_event(loaded_db, OpsEventType.START_CONTRACT_MODIFICATION)
    assert event.created_by == BASIC_USER_ID
    assert event.event_details["contract_modification_request_id"] == response.json["id"]
    assert event.event_details["budget_line_item_ids"] == [executable.id]
    assert "request.remote_addr" in event.event_details
    history = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id == agreement.id,
            AgreementHistory.history_type == AgreementHistoryType.CONTRACT_MODIFICATION_STARTED,
        )
    ).one()
    basic_user = loaded_db.get(User, BASIC_USER_ID)
    assert history.history_message == (
        f"{basic_user.full_name} sent a contract modification to approval including 1 edit "
        "and 1 budget line to execute."
    )
    assert history.ops_event_id == event.id


def test_submit_records_the_remote_ip(awarded_with_edit, basic_user_auth_client, loaded_db, app_ctx):
    agreement, _, _ = awarded_with_edit
    response = basic_user_auth_client.post(
        url_for("api.agreements-contract-modifications", id=agreement.id),
        json={},
        environ_base={"REMOTE_ADDR": "10.7.8.9"},
    )
    assert response.status_code == 201, response.json
    event = _latest_event(loaded_db, OpsEventType.START_CONTRACT_MODIFICATION)
    assert event.event_details["request.remote_addr"] == "10.7.8.9"


def test_submit_while_one_is_in_review_returns_400(awarded_with_edit, basic_user_auth_client, loaded_db, app_ctx):
    agreement, _, _ = awarded_with_edit
    assert _submit(basic_user_auth_client, agreement.id).status_code == 201
    assert _submit(basic_user_auth_client, agreement.id).status_code == 400
    requests = loaded_db.scalars(
        select(ContractModificationRequest).where(ContractModificationRequest.agreement_id == agreement.id)
    ).all()
    assert len(requests) == 1


def test_submit_with_only_budget_lines_to_execute(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, make_agreement, app_ctx  # noqa: F811
):
    """An "as is" execution: no edits, just Planned budget lines to execute."""
    agreement, _ = make_agreement(test_can)
    executable = _add_bli(loaded_db, agreement, test_can)

    response = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id])

    assert response.status_code == 201, response.json
    assert response.json["edits"] == []


def test_submit_with_nothing_to_modify_returns_400(
    modified_loe_enabled, basic_user_auth_client, test_can, make_agreement, app_ctx  # noqa: F811
):
    agreement, _ = make_agreement(test_can)
    assert _submit(basic_user_auth_client, agreement.id).status_code == 400


@pytest.mark.parametrize(
    "status, date_needed, reason",
    [
        (BudgetLineItemStatus.DRAFT, None, "not in Planned status"),
        (BudgetLineItemStatus.OBLIGATED, None, "not in Planned status"),
        (BudgetLineItemStatus.IN_EXECUTION, None, "not in Planned status"),
        (BudgetLineItemStatus.PLANNED, datetime.date(2043, 1, 1), "not in the current fiscal year"),
    ],
)
def test_submit_rejects_budget_lines_that_cannot_be_executed(
    awarded_with_edit, basic_user_auth_client, loaded_db, test_can, status, date_needed, reason, app_ctx
):
    agreement, _, _ = awarded_with_edit
    ineligible = _add_bli(loaded_db, agreement, test_can, status=status, date_needed=date_needed)

    response = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[ineligible.id])

    assert response.status_code == 400, response.json
    assert reason in response.json["errors"]["budget_line_item_ids"][0]


def _executable_bli(loaded_db, agreement, test_can):
    """A Planned BLI that can be both executed (current FY) and edited (Need By Date not past)."""
    return _add_bli(loaded_db, agreement, test_can, date_needed=datetime.date(get_current_fiscal_year(), 9, 30))


def _move_into_pending_sc(client, loaded_db, agreement, bli):
    """Add SC2 after award (pending) and move ``bli`` into it, which requests SC2's addition."""
    response = client.post(
        url_for("api.services-component-group"), json={"agreement_id": agreement.id, "number": 2, "optional": False}
    )
    assert response.status_code == 201, response.json
    sc2_id = response.json["id"]
    response = client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"services_component_id": sc2_id})
    assert response.status_code in (200, 202), response.json
    change_request = loaded_db.scalars(
        select(ServicesComponentChangeRequest).where(ServicesComponentChangeRequest.services_component_id == sc2_id)
    ).one()
    return sc2_id, change_request.id


def test_submit_rejects_a_budget_line_in_an_sc_awaiting_approval(
    awarded_with_edit, basic_user_auth_client, loaded_db, test_can, app_ctx
):
    agreement, _, _ = awarded_with_edit
    executable = _executable_bli(loaded_db, agreement, test_can)
    _move_into_pending_sc(basic_user_auth_client, loaded_db, agreement, executable)

    response = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id])

    assert response.status_code == 400, response.json
    assert response.json["errors"]["budget_line_item_ids"] == [
        f"Budget line {executable.id} is in a Services Component that is awaiting approval."
    ]


def test_sc_addition_edit_is_attached_by_an_approved_modification(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, loaded_db, test_can, app_ctx
):
    agreement, _, _ = awarded_with_edit
    executable = _executable_bli(loaded_db, agreement, test_can)
    sc2_id, change_request_id = _move_into_pending_sc(basic_user_auth_client, loaded_db, agreement, executable)
    response = division_director_auth_client.patch(
        url_for("api.change-requests-item", id=change_request_id), json={"action": "APPROVE"}
    )
    assert response.status_code == 200, response.json
    (sc_edit,) = [e for e in _edits(loaded_db, agreement.id) if e.services_component_id == sc2_id]
    assert sc_edit.field == "services_component_create"

    request_id = _submit(basic_user_auth_client, agreement.id).json["id"]
    request = loaded_db.get(ContractModificationRequest, request_id)
    assert sc_edit.id in {edit.id for edit in request.edits}
    response = _review_mod(division_director_auth_client, request_id)

    assert response.status_code == 200, response.json
    loaded_db.expire_all()
    assert loaded_db.get(type(sc_edit), sc_edit.id).agreement_mod_id == response.json["agreement_mod_id"]
    assert loaded_db.get(ServicesComponent, sc2_id).awaiting_add_approval is False


def _approved_sc_addition_emptied(client, director_client, loaded_db, agreement, bli, sc1_id):
    """Approve "Add SC2" for ``bli``, then move ``bli`` back to SC1 so SC2 has no budget lines."""
    sc2_id, change_request_id = _move_into_pending_sc(client, loaded_db, agreement, bli)
    response = director_client.patch(
        url_for("api.change-requests-item", id=change_request_id), json={"action": "APPROVE"}
    )
    assert response.status_code == 200, response.json
    response = client.patch(url_for("api.budget-line-items-item", id=bli.id), json={"services_component_id": sc1_id})
    assert response.status_code in (200, 202), response.json
    return sc2_id


def test_deleting_an_approved_sc_removes_its_pending_addition_edit(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, loaded_db, test_can, app_ctx
):
    agreement, first, _ = awarded_with_edit
    executable = _executable_bli(loaded_db, agreement, test_can)
    sc2_id = _approved_sc_addition_emptied(
        basic_user_auth_client,
        division_director_auth_client,
        loaded_db,
        agreement,
        executable,
        first.services_component_id,
    )

    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 200, response.json
    assert [e for e in _edits(loaded_db, agreement.id) if e.services_component_id == sc2_id] == []
    pending = _get_pending(basic_user_auth_client, agreement.id).json["data"]
    assert [e for e in pending if e["services_component_id"] == sc2_id] == []


def test_deleting_an_sc_whose_addition_is_in_a_modification_in_review_returns_400(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, loaded_db, test_can, app_ctx
):
    agreement, first, _ = awarded_with_edit
    executable = _executable_bli(loaded_db, agreement, test_can)
    sc2_id = _approved_sc_addition_emptied(
        basic_user_auth_client,
        division_director_auth_client,
        loaded_db,
        agreement,
        executable,
        first.services_component_id,
    )
    assert _submit(basic_user_auth_client, agreement.id).status_code == 201

    response = basic_user_auth_client.delete(url_for("api.services-component-item", id=sc2_id))

    assert response.status_code == 400, response.json
    assert "contract modification that is in review" in response.json["errors"]["services_component"][0]
    loaded_db.expire_all()
    assert loaded_db.get(ServicesComponent, sc2_id) is not None
    assert len([e for e in _edits(loaded_db, agreement.id) if e.services_component_id == sc2_id]) == 1


def test_submit_rejects_a_budget_line_on_another_agreement(
    awarded_with_edit, basic_user_auth_client, loaded_db, test_can, make_agreement, app_ctx  # noqa: F811
):
    agreement, _, _ = awarded_with_edit
    other_agreement, _ = make_agreement(test_can)
    other_bli = _add_bli(loaded_db, other_agreement, test_can)

    response = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[other_bli.id])

    assert response.status_code == 400
    assert "not on this agreement" in response.json["errors"]["budget_line_item_ids"][0]


def test_submit_rejects_notes_over_150_characters(awarded_with_edit, basic_user_auth_client, app_ctx):
    agreement, _, _ = awarded_with_edit
    assert _submit(basic_user_auth_client, agreement.id, requestor_notes="x" * 151).status_code == 400


def test_submit_not_awarded_returns_400(
    modified_loe_enabled, basic_user_auth_client, loaded_db, test_can, make_agreement, app_ctx  # noqa: F811
):
    agreement, _ = make_agreement(test_can, awarded=False)
    executable = _add_bli(loaded_db, agreement, test_can)
    assert _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).status_code == 400


def test_submit_flag_off_returns_400(
    modified_loe_disabled, basic_user_auth_client, test_can, make_agreement, app_ctx  # noqa: F811
):
    agreement, _ = make_agreement(test_can)
    assert _submit(basic_user_auth_client, agreement.id).status_code == 400


def test_submit_unknown_agreement_returns_404(modified_loe_enabled, basic_user_auth_client, app_ctx):  # noqa: F811
    assert _submit(basic_user_auth_client, 9999999).status_code == 404


def test_submit_unassociated_user_returns_403(awarded_with_edit, division_6_director_auth_client, app_ctx):
    agreement, _, _ = awarded_with_edit
    assert _submit(division_6_director_auth_client, agreement.id).status_code == 403


# ---=== Review ===---


def test_approve_creates_the_mod_attaches_edits_and_executes_budget_lines(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, _, executable = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).json["id"]

    response = _review_mod(division_director_auth_client, request_id)

    assert response.status_code == 200, response.json
    assert response.json["status"] == "APPROVED"
    assert response.json["reviewed_by_id"] == DIVISION_DIRECTOR_USER_ID
    mod = loaded_db.get(AgreementMod, response.json["agreement_mod_id"])
    assert mod.agreement_id == agreement.id
    assert mod.mod_type == ModType.MODIFIED_LOE

    # Every edit (including superseded ones) is attached, so the list is now empty.
    assert {e.agreement_mod_id for e in _edits(loaded_db, agreement.id)} == {mod.id}
    assert _get_pending(basic_user_auth_client, agreement.id).json["data"] == []
    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, executable.id).status == BudgetLineItemStatus.IN_EXECUTION

    submitter_notification = loaded_db.scalars(
        select(ContractModificationRequestNotification).where(
            ContractModificationRequestNotification.contract_modification_request_id == request_id,
            ContractModificationRequestNotification.recipient_id == BASIC_USER_ID,
        )
    ).one()
    assert submitter_notification.title == "Contract Modification Approved"

    event = _latest_event(loaded_db, OpsEventType.REVIEW_CONTRACT_MODIFICATION)
    assert event.created_by == DIVISION_DIRECTOR_USER_ID
    assert event.event_details["status"] == "APPROVED"
    assert "request.remote_addr" in event.event_details
    history = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id == agreement.id,
            AgreementHistory.history_type == AgreementHistoryType.CONTRACT_MODIFICATION_APPROVED,
        )
    ).one()
    assert history.ops_event_id == event.id
    assert f"BL {executable.id} changed from Planned to Executing" in history.history_message

    # A new modification can be started for later edits.
    assert _submit(basic_user_auth_client, agreement.id).status_code == 400  # nothing pending


def test_approve_with_only_budget_lines_tags_mod_as_as_is(
    modified_loe_enabled,  # noqa: F811
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    make_agreement,  # noqa: F811
):
    """A pure "as is" execution (#1008) -- no edits bundled -- tags the mod AS_IS, not MODIFIED_LOE."""
    agreement, _ = make_agreement(test_can)
    executable = _add_bli(loaded_db, agreement, test_can)
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).json["id"]

    response = _review_mod(division_director_auth_client, request_id)

    assert response.status_code == 200, response.json
    mod = loaded_db.get(AgreementMod, response.json["agreement_mod_id"])
    assert mod.mod_type == ModType.AS_IS


def test_decline_returns_edits_to_pending(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, _, executable = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[executable.id]).json["id"]

    response = _review_mod(division_director_auth_client, request_id, "DECLINE", reviewer_notes="Let's talk Tuesday")

    assert response.status_code == 200, response.json
    assert response.json["status"] == "DECLINED"
    assert response.json["reviewer_notes"] == "Let's talk Tuesday"
    assert response.json["agreement_mod_id"] is None
    (pending,) = _get_pending(basic_user_auth_client, agreement.id).json["data"]
    assert pending["in_review"] is False
    loaded_db.expire_all()
    assert loaded_db.get(ContractBudgetLineItem, executable.id).status == BudgetLineItemStatus.PLANNED
    assert loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == agreement.id)).all() == []

    history = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id == agreement.id,
            AgreementHistory.history_type == AgreementHistoryType.CONTRACT_MODIFICATION_DECLINED,
        )
    ).one()
    assert history.history_message.endswith("Notes: Let's talk Tuesday")

    # The user can start again.
    assert _submit(basic_user_auth_client, agreement.id).status_code == 201


def test_review_twice_returns_400(awarded_with_edit, basic_user_auth_client, division_director_auth_client, app_ctx):
    agreement, _, _ = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id).json["id"]
    assert _review_mod(division_director_auth_client, request_id).status_code == 200
    assert _review_mod(division_director_auth_client, request_id, "DECLINE").status_code == 400


def test_review_by_another_divisions_director_returns_403(
    awarded_with_edit, basic_user_auth_client, division_6_director_auth_client, loaded_db, app_ctx
):
    agreement, _, _ = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id).json["id"]

    assert _review_mod(division_6_director_auth_client, request_id).status_code == 403
    assert loaded_db.get(ContractModificationRequest, request_id).status == ContractModificationRequestStatus.IN_REVIEW


def test_review_unknown_request_returns_404(modified_loe_enabled, division_director_auth_client, app_ctx):  # noqa: F811
    assert _review_mod(division_director_auth_client, 9999999).status_code == 404


def test_review_invalid_action_returns_400(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, app_ctx
):
    agreement, _, _ = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id).json["id"]
    assert _review_mod(division_director_auth_client, request_id, "MAYBE").status_code == 400


# ---=== List ===---


def test_get_requests_for_agreement_newest_first(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, app_ctx
):
    agreement, _, _ = awarded_with_edit
    first_id = _submit(basic_user_auth_client, agreement.id).json["id"]
    _review_mod(division_director_auth_client, first_id, "DECLINE")
    second_id = _submit(basic_user_auth_client, agreement.id).json["id"]

    response = basic_user_auth_client.get(url_for("api.agreements-contract-modifications", id=agreement.id))

    assert response.status_code == 200
    assert [r["id"] for r in response.json["data"]] == [second_id, first_id]
    assert [r["status"] for r in response.json["data"]] == ["IN_REVIEW", "DECLINED"]


def test_get_requests_can_review_is_true_only_for_an_authorized_director_on_the_in_review_request(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, division_6_director_auth_client
):
    agreement, _, _ = awarded_with_edit
    in_review_id = _submit(basic_user_auth_client, agreement.id).json["id"]

    by_client = {
        "director": division_director_auth_client,
        "submitter": basic_user_auth_client,
        "unrelated_director": division_6_director_auth_client,
    }
    can_review_by_client = {
        name: next(
            r["can_review"]
            for r in client.get(url_for("api.agreements-contract-modifications", id=agreement.id)).json["data"]
            if r["id"] == in_review_id
        )
        for name, client in by_client.items()
    }

    assert can_review_by_client == {"director": True, "submitter": False, "unrelated_director": False}

    # Once reviewed, even the authorized director no longer sees review controls for it.
    _review_mod(division_director_auth_client, in_review_id, "DECLINE")
    reviewed = next(
        r
        for r in division_director_auth_client.get(
            url_for("api.agreements-contract-modifications", id=agreement.id)
        ).json["data"]
        if r["id"] == in_review_id
    )
    assert reviewed["can_review"] is False


def test_agreement_notifications_include_contract_modification_requests(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, app_ctx
):
    agreement, _, _ = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id).json["id"]
    _review_mod(division_director_auth_client, request_id, "DECLINE", reviewer_notes="No")

    response = basic_user_auth_client.get(
        url_for("api.notifications-group"), query_string={"agreement_id": agreement.id, "user_id": BASIC_USER_ID}
    )

    assert response.status_code == 200, response.json
    (notification,) = [
        n for n in response.json if n["notification_type"] == "CONTRACT_MODIFICATION_REQUEST_NOTIFICATION"
    ]
    assert notification["contract_modification_request"]["status"] == "DECLINED"
    assert notification["contract_modification_request"]["reviewer_notes"] == "No"


# ---=== Review findings: failed approval is all-or-nothing; uploads for the new types ===---


@pytest.mark.parametrize(
    "budget_line_change",
    [
        pytest.param({"status": BudgetLineItemStatus.IN_EXECUTION}, id="executed after submit"),
        pytest.param({"amount": 90000.00}, id="amount changed after submit"),
    ],
)
def test_failed_approval_leaves_nothing_behind(
    awarded_with_edit,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    test_can,
    budget_line_change,
    app_ctx,
):
    """Approving must not leave a partial modification when a selected budget line changed after
    the request was sent: no new mod, edits still pending, the other budget line not executed."""
    agreement, _, executable = awarded_with_edit
    untouched = _add_bli(loaded_db, agreement, test_can)
    request_id = _submit(basic_user_auth_client, agreement.id, budget_line_item_ids=[untouched.id, executable.id]).json[
        "id"
    ]

    bli = loaded_db.get(ContractBudgetLineItem, executable.id)
    for field, value in budget_line_change.items():
        setattr(bli, field, value)
    loaded_db.commit()

    response = _review_mod(division_director_auth_client, request_id)

    assert response.status_code == 400, response.json
    loaded_db.expire_all()
    assert loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == agreement.id)).all() == []
    assert {e.agreement_mod_id for e in _edits(loaded_db, agreement.id)} == {None}
    assert loaded_db.get(ContractBudgetLineItem, untouched.id).status == BudgetLineItemStatus.PLANNED
    assert loaded_db.get(ContractModificationRequest, request_id).status == ContractModificationRequestStatus.IN_REVIEW
    # A decline still works, and leaves the edits pending for a new modification.
    assert _review_mod(division_director_auth_client, request_id, "DECLINE").status_code == 200
    assert _submit(basic_user_auth_client, agreement.id).status_code == 201


@pytest.mark.parametrize(
    "document_type",
    ["CONTRACT_MODIFICATION_MEMO", "REVISED_INDEPENDENT_GOVERNMENT_COST_ESTIMATE", "REVISED_STATEMENT_OF_REQUIREMENTS"],
)
def test_modification_document_types_can_be_uploaded(
    auth_client, loaded_db, test_can, make_agreement, document_type, app_ctx  # noqa: F811
):
    agreement, _ = make_agreement(test_can)

    response = auth_client.post(
        url_for("api.documents-list"),
        json={
            "agreement_id": agreement.id,
            "document_type": document_type,
            "document_name": "mod.pdf",
            "document_size": 1.0,
        },
    )

    assert response.status_code == 201, response.json
    document = loaded_db.scalars(select(Document).where(Document.agreement_id == agreement.id)).one()
    assert document.document_type == DocumentType[document_type]
    loaded_db.delete(document)
    loaded_db.commit()


def test_seeded_contract_modification_edit_points_at_agreement_523s_planned_budget_line(loaded_db, app_ctx):
    """The seed hard-codes the edit's budget_line_item_id (it has no FK); keep it pointing at 523's
    Planned BLI if seed rows ahead of it change the ids the loader assigns."""
    (edit,) = _edits(loaded_db, 523)
    bli = loaded_db.get(ContractBudgetLineItem, edit.budget_line_item_id)
    assert bli is not None and bli.agreement_id == 523
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert float(bli.amount) == edit.new_value


@pytest.mark.parametrize("action", ["APPROVE", "DECLINE"])
def test_review_marks_the_directors_request_notification_read(
    awarded_with_edit, basic_user_auth_client, division_director_auth_client, loaded_db, action, app_ctx
):
    """The Director's "please review" notification shares a type with the submitter's outcome
    notification; once reviewed it must not stay unread, or it shows as an outcome alert."""
    agreement, _, _ = awarded_with_edit
    request_id = _submit(basic_user_auth_client, agreement.id).json["id"]

    assert _review_mod(division_director_auth_client, request_id, action).status_code == 200

    loaded_db.expire_all()
    notifications = loaded_db.scalars(
        select(ContractModificationRequestNotification).where(
            ContractModificationRequestNotification.contract_modification_request_id == request_id
        )
    ).all()
    by_recipient = {n.recipient_id: n.is_read for n in notifications}
    assert by_recipient == {DIVISION_DIRECTOR_USER_ID: True, BASIC_USER_ID: False}
