"""Integration tests for editing the COR on an Awarded agreement (OPS-3153, #3269).

On an Awarded Contract or AA agreement (with ``ENABLE_MODIFIED_LOE_EDITS`` on), a COR change needs
no approval and applies immediately. It is also tracked as one ADMIN_CHANGE
``ContractModificationEdit`` (a card on the Award & Modifications tab), showing the net change from
the COR on the contract to the current COR: a further change updates it, and changing back removes
it. Promoting the saved Alternate COR clears the Alternate COR, unless the same save picks a new
one; changing back restores it. While the card is in a contract modification in review, the COR
can't change. Approving the modification doesn't change the COR; declining it undoes the change.

``basic_user_auth_client`` (user 521) is a team member on the test agreement.
``power_user_auth_client`` (user 528) is a superuser and gets no bypass.
"""

import datetime

import pytest
from flask import url_for
from sqlalchemy import select, text

from models import (
    AaAgreement,
    Agreement,
    AgreementHistory,
    AgreementHistoryType,
    AgreementMod,
    AgreementReason,
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractModificationEdit,
    ContractType,
    GrantAgreement,
    ModificationEditType,
    ModType,
    OpsEvent,
    OpsEventType,
    ProcurementAction,
    ProcurementActionStatus,
    ServiceRequirementType,
    User,
)
from ops_api.ops.services.contract_modification_edits import (
    COR_CHANGE_IN_MODIFICATION_MESSAGE,
    ContractModificationEditService,
)
from ops_api.ops.services.ops_service import ValidationError

CURRENT_COR_ID = 503
ALTERNATE_COR_ID = 520
BASIC_USER_ID = 521
NEW_COR_ID = 512
OTHER_COR_ID = 513


@pytest.fixture()
def modified_loe_enabled(app):
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = True
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


@pytest.fixture()
def modified_loe_disabled(app):
    original = app.config.get("ENABLE_MODIFIED_LOE_EDITS", False)
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = False
    yield
    app.config["ENABLE_MODIFIED_LOE_EDITS"] = original


@pytest.fixture()
def make_agreement(loaded_db, test_project):
    """Factory for a Contract agreement with a COR and an Alternate COR, Awarded by default."""
    created = []

    def _make(*, awarded=True, alternate=ALTERNATE_COR_ID, agreement_type=AgreementType.CONTRACT):
        suffix = f"{len(created)}{datetime.datetime.now().strftime('%H%M%S%f')}"
        common = {
            "name": f"COR Change Test Agreement {suffix}",
            "agreement_type": agreement_type,
            "project_id": test_project.id,
            "description": "Agreement for the OPS-3153 COR change tests",
            "project_officer_id": CURRENT_COR_ID,
            "alternate_project_officer_id": alternate,
        }
        if agreement_type == AgreementType.CONTRACT:
            agreement = ContractAgreement(
                **common,
                contract_number=f"CTCOR{suffix}",
                contract_type=ContractType.FIRM_FIXED_PRICE,
                product_service_code_id=2,
                agreement_reason=AgreementReason.NEW_REQ,
                awarding_entity_id=1,
                service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
            )
        elif agreement_type == AgreementType.AA:
            agreement = AaAgreement(
                **common,
                requesting_agency_id=1,
                servicing_agency_id=1,
                service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
            )
        else:
            agreement = GrantAgreement(**common)
        loaded_db.add(agreement)
        loaded_db.flush()
        agreement.team_members.append(loaded_db.get(User, BASIC_USER_ID))
        loaded_db.commit()
        if awarded:
            loaded_db.add(
                ProcurementAction(
                    agreement_id=agreement.id,
                    status=ProcurementActionStatus.AWARDED,
                    award_type=AwardType.NEW_AWARD,
                )
            )
            loaded_db.commit()
            loaded_db.refresh(agreement)
        created.append(agreement.id)
        return agreement

    yield _make

    loaded_db.rollback()
    for agreement_id in created:
        params = {"id": agreement_id}
        loaded_db.execute(text("DELETE FROM contract_modification_request WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM agreement_mod WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM procurement_action WHERE agreement_id = :id"), params)
        loaded_db.commit()
        for bli in loaded_db.query(ContractBudgetLineItem).filter_by(agreement_id=agreement_id).all():
            loaded_db.delete(bli)
        loaded_db.commit()
        agreement = loaded_db.get(Agreement, agreement_id)
        if agreement is not None:
            loaded_db.delete(agreement)
            loaded_db.commit()


def _patch(client, agreement_id, body):
    return client.patch(url_for("api.agreements-item", id=agreement_id), json=body)


def _cor_edits(loaded_db, agreement_id):
    loaded_db.expire_all()
    return list(
        loaded_db.scalars(
            select(ContractModificationEdit)
            .where(
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.modification_type == ModificationEditType.ADMIN_CHANGE,
            )
            .order_by(ContractModificationEdit.id)
        ).all()
    )


def _reload(loaded_db, agreement_id):
    loaded_db.expire_all()
    return loaded_db.get(Agreement, agreement_id)


# --- COR change applies and is tracked --------------------------------------------------------


def test_cor_change_applies_and_is_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == NEW_COR_ID
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.field == "project_officer_id"
    assert edit.old_value == CURRENT_COR_ID
    assert edit.new_value == NEW_COR_ID
    assert edit.requested_by_id == BASIC_USER_ID
    assert edit.requested_on is not None
    assert edit.change_request_id is None
    assert edit.agreement_mod_id is None


def test_superuser_cor_change_is_also_tracked(
    modified_loe_enabled, power_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(power_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert len(_cor_edits(loaded_db, agreement.id)) == 1


def test_a_further_change_updates_the_card_to_the_net_change(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    [first] = _cor_edits(loaded_db, agreement.id)

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": OTHER_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == OTHER_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.id == first.id
    assert edit.old_value == CURRENT_COR_ID  # still the COR on the contract
    assert edit.new_value == OTHER_COR_ID


def test_changing_back_to_the_cor_on_the_contract_removes_the_card(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": CURRENT_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_saving_the_current_cor_leaves_the_card(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """The form sends the current COR on every save; that isn't a change."""
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = _patch(
        basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID, "description": "Updated"}
    )

    assert response.status_code == 200, response.json
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID
    assert _reload(loaded_db, agreement.id).description == "Updated"


def test_mixed_save_applies_every_field_and_tracks_the_cor(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(
        basic_user_auth_client,
        agreement.id,
        {"project_officer_id": NEW_COR_ID, "description": "Mixed save", "alternate_project_officer_id": OTHER_COR_ID},
    )

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.description == "Mixed save"
    assert agreement.alternate_project_officer_id == OTHER_COR_ID
    assert agreement.project_officer_id == NEW_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_cor_change_to_a_nonexistent_user_is_rejected(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": 999999})

    assert response.status_code == 400
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_failed_cor_record_rolls_back_the_whole_save(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx, monkeypatch
):
    """The card is recorded before the commit, so when recording fails, nothing in the save is
    committed: not the COR, and not the other fields."""
    agreement = make_agreement()
    original_description = agreement.description

    def fail(*args, **kwargs):
        raise ValidationError({"project_officer_id": ["Another COR change was saved at the same time."]})

    monkeypatch.setattr(ContractModificationEditService, "record_project_officer_change", fail)

    response = _patch(
        basic_user_auth_client,
        agreement.id,
        {"project_officer_id": NEW_COR_ID, "description": "Should not be saved"},
    )

    assert response.status_code == 400
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.description == original_description
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_removing_the_cor_is_rejected(modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": None})

    assert response.status_code == 400
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_put_with_unchanged_cor_records_nothing(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    body = basic_user_auth_client.get(url_for("api.agreements-item", id=agreement.id)).json
    put_body = {
        key: body[key]
        for key in (
            "agreement_type",
            "name",
            "description",
            "project_id",
            "product_service_code_id",
            "agreement_reason",
            "project_officer_id",
            "alternate_project_officer_id",
            "awarding_entity_id",
            "contract_type",
            "contract_number",
            "service_requirement_type",
        )
        if key in body
    }
    put_body["description"] = "PUT with the same COR"

    response = basic_user_auth_client.put(url_for("api.agreements-item", id=agreement.id), json=put_body)

    assert response.status_code == 200, response.json
    assert _cor_edits(loaded_db, agreement.id) == []


# --- Alternate COR promotion ------------------------------------------------------------------


def test_promoting_the_alternate_clears_it_and_is_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == ALTERNATE_COR_ID
    assert agreement.alternate_project_officer_id is None
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.old_value == CURRENT_COR_ID
    assert edit.new_value == ALTERNATE_COR_ID


def test_promoting_the_alternate_keeps_a_new_alternate_from_the_same_save(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(
        basic_user_auth_client,
        agreement.id,
        {"project_officer_id": ALTERNATE_COR_ID, "alternate_project_officer_id": OTHER_COR_ID},
    )

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == ALTERNATE_COR_ID
    assert agreement.alternate_project_officer_id == OTHER_COR_ID


def test_promoting_the_alternate_after_a_change_tracks_the_net_change(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == ALTERNATE_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.old_value == CURRENT_COR_ID
    assert edit.new_value == ALTERNATE_COR_ID


def test_alternate_cor_edits_are_not_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": OTHER_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).alternate_project_officer_id == OTHER_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


# --- Outside the gate -------------------------------------------------------------------------


def test_flag_off_cor_change_is_not_tracked(
    modified_loe_disabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_awarded_aa_cor_change_is_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement(agreement_type=AgreementType.AA)

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_awarded_grant_project_officer_change_is_not_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """Contract modifications cover Contract and AA agreements only."""
    agreement = make_agreement(agreement_type=AgreementType.GRANT)

    response = _patch(
        basic_user_auth_client, agreement.id, {"agreement_type": "GRANT", "project_officer_id": NEW_COR_ID}
    )

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_not_awarded_cor_change_is_not_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement(awarded=False)

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


# --- History, list and concurrency ------------------------------------------------------------


def test_cor_change_records_history_and_event(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    loaded_db.expire_all()
    [history] = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id_record == agreement.id,
            AgreementHistory.history_title == "Change to COR",
        )
    ).all()
    requestor = loaded_db.get(User, BASIC_USER_ID).full_name
    old_name = loaded_db.get(User, CURRENT_COR_ID).full_name
    new_name = loaded_db.get(User, NEW_COR_ID).full_name
    assert history.history_message.startswith(f"{requestor} changed the COR from {old_name} to {new_name}.")
    event = loaded_db.get(OpsEvent, history.ops_event_id)
    assert event.event_type == OpsEventType.UPDATE_AGREEMENT
    assert event.created_by == BASIC_USER_ID
    assert "request.remote_addr" in event.event_details
    assert "Change to COR Pending Contract Modification" not in _history_titles(loaded_db, agreement.id)


def test_list_returns_the_cor_card_with_names(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = basic_user_auth_client.get(url_for("api.agreements-contract-modification-edits", id=agreement.id))

    assert response.status_code == 200, response.json
    [card] = response.json["data"]
    assert card["modification_type"] == "ADMIN_CHANGE"
    assert card["field"] == "project_officer_id"
    assert card["budget_line_item_id"] is None
    assert card["old_display_name"] == loaded_db.get(User, CURRENT_COR_ID).full_name
    assert card["new_display_name"] == loaded_db.get(User, NEW_COR_ID).full_name
    assert card["requested_by"]["id"] == BASIC_USER_ID


def test_losing_a_concurrent_cor_save_raises_a_validation_error(
    modified_loe_enabled, loaded_db, make_agreement, app_ctx, monkeypatch
):
    """Two saves that both see no card: the second hits the unique index and gets a
    ValidationError (a 400 at the API), not an IntegrityError (a 500)."""
    agreement = make_agreement()
    service = ContractModificationEditService(loaded_db)
    user = loaded_db.get(User, BASIC_USER_ID)
    service.record_project_officer_change(agreement, CURRENT_COR_ID, NEW_COR_ID, user)
    loaded_db.commit()
    # The second save read before the first committed, so it doesn't see the card.
    monkeypatch.setattr(service, "_pending_project_officer_edit", lambda *args, **kwargs: None)

    with pytest.raises(ValidationError) as error:
        service.record_project_officer_change(agreement, CURRENT_COR_ID, OTHER_COR_ID, user)

    assert "project_officer_id" in error.value.validation_errors
    loaded_db.rollback()
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def _commit_cor_in_another_session(loaded_db, agreement_id, project_officer_id, delete_cor_card=False):
    """Simulates an overlapping save that committed after this session loaded the agreement."""
    from sqlalchemy.orm import Session

    with Session(bind=loaded_db.get_bind()) as other:
        other.get(Agreement, agreement_id).project_officer_id = project_officer_id
        if delete_cor_card:
            other.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), {"id": agreement_id})
        other.commit()


def test_overlapping_revert_does_not_record_a_card_from_a_stale_cor(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """Card A→B and COR B. Two overlapping saves both change the COR back to A. The second one
    loaded COR B before the first committed; it must re-read COR A and track nothing, not insert a
    card B→A. (This checks the re-read; the lock itself is checked by the SQL test below.)"""
    from ops_api.ops.services.agreements import AgreementsService

    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == NEW_COR_ID  # this session loaded COR B
    # The first save's revert commits elsewhere: COR back to A, card removed.
    _commit_cor_in_another_session(loaded_db, agreement.id, CURRENT_COR_ID, delete_cor_card=True)

    tracked = AgreementsService(loaded_db)._prepare_project_officer_change(
        agreement, {"project_officer_id": CURRENT_COR_ID}
    )

    assert tracked is None
    loaded_db.rollback()


def test_overlapping_change_records_the_card_from_the_current_cor(
    modified_loe_enabled, loaded_db, make_agreement, app_ctx
):
    """The second of two overlapping saves records its card from the COR the first one saved,
    not from the COR it loaded."""
    from ops_api.ops.services.agreements import AgreementsService

    agreement = make_agreement()  # COR A in this session's copy
    _commit_cor_in_another_session(loaded_db, agreement.id, NEW_COR_ID)  # the other save: COR B
    agreement = loaded_db.get(Agreement, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID  # stale

    tracked = AgreementsService(loaded_db)._prepare_project_officer_change(
        agreement, {"project_officer_id": OTHER_COR_ID}
    )

    assert tracked == (NEW_COR_ID, OTHER_COR_ID, None)
    loaded_db.rollback()


def test_stale_cor_equal_to_the_incoming_one_is_still_tracked(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """The request loaded COR A, another save then committed COR B, and this save sends A. The
    check runs after the re-read, so it's tracked as a change back to A, not skipped."""
    from ops_api.ops.services.agreements import AgreementsService

    agreement = make_agreement()
    assert agreement.project_officer_id == CURRENT_COR_ID  # this session loaded COR A
    _commit_cor_in_another_session(loaded_db, agreement.id, NEW_COR_ID)

    tracked = AgreementsService(loaded_db)._prepare_project_officer_change(
        agreement, {"project_officer_id": CURRENT_COR_ID}
    )

    assert tracked == (NEW_COR_ID, CURRENT_COR_ID, None)
    loaded_db.rollback()


def test_cor_save_locks_the_agreement_then_the_card_before_the_in_review_check(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """Locks behind the re-read and the in-review check (#3269):
    - The agreement row is locked FOR NO KEY UPDATE, not FOR UPDATE. That serializes COR saves
      without blocking the foreign key check of a contract modification being sent, which holds
      the card lock, so the two can't deadlock.
    - The pending card is locked before the in-review query, so a save and a send take turns.
    The tests above share one connection, so they can't see locks; this checks the SQL."""
    import re

    from sqlalchemy import event

    from ops_api.ops.services.agreements import AgreementsService

    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    agreement = _reload(loaded_db, agreement.id)
    statements = []

    def capture(conn, cursor, statement, parameters, context, executemany):
        statements.append(" ".join(statement.split()))

    event.listen(loaded_db.get_bind(), "before_cursor_execute", capture)
    try:
        AgreementsService(loaded_db)._prepare_project_officer_change(agreement, {"project_officer_id": OTHER_COR_ID})
    finally:
        event.remove(loaded_db.get_bind(), "before_cursor_execute", capture)
        loaded_db.rollback()

    def first(predicate):
        return next(i for i, statement in enumerate(statements) if predicate(statement))

    agreement_lock = first(lambda q: re.search(r"FROM (ops\.)?agreement\b", q) and "FOR NO KEY UPDATE" in q)
    card_lock = first(
        lambda q: re.search(r"FROM (ops\.)?contract_modification_edit\b", q)
        and q.endswith("FOR UPDATE")
        and "contract_mod_request_edits" not in q
    )
    in_review_check = first(lambda q: "contract_mod_request_edits" in q)
    assert agreement_lock < card_lock < in_review_check
    assert not any(
        re.search(r"FROM (ops\.)?agreement\b", q) and q.endswith(" FOR UPDATE") for q in statements[: card_lock + 1]
    ), "the agreement must not be locked FOR UPDATE (it would block the foreign key check of a send)"


def test_one_pending_cor_card_per_agreement_is_enforced(modified_loe_enabled, loaded_db, make_agreement, app_ctx):
    agreement = make_agreement()
    service = ContractModificationEditService(loaded_db)
    user = loaded_db.get(User, BASIC_USER_ID)
    service.record_project_officer_change(agreement, CURRENT_COR_ID, NEW_COR_ID, user)
    loaded_db.commit()

    # Simulates a concurrent save that didn't see the first row.
    loaded_db.add(
        ContractModificationEdit(
            agreement_id=agreement.id,
            modification_type=ModificationEditType.ADMIN_CHANGE,
            field="project_officer_id",
            old_value=CURRENT_COR_ID,
            new_value=OTHER_COR_ID,
            requested_by_id=BASIC_USER_ID,
        )
    )
    with pytest.raises(Exception, match="ix_contract_modification_edit_one_pending_cor_change"):
        loaded_db.commit()
    loaded_db.rollback()


def test_edit_bundle_applies_and_tracks_the_cor_change(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=agreement.id),
        json={"agreement": {"agreement_type": "CONTRACT", "project_officer_id": NEW_COR_ID}},
    )

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID
    assert "Change to COR" in _history_titles(loaded_db, agreement.id)


def test_edit_bundle_alternate_promotion_records_history(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=agreement.id),
        json={"agreement": {"agreement_type": "CONTRACT", "project_officer_id": ALTERNATE_COR_ID}},
    )

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == ALTERNATE_COR_ID
    assert agreement.alternate_project_officer_id is None
    assert len(_cor_edits(loaded_db, agreement.id)) == 1
    titles = _history_titles(loaded_db, agreement.id)
    assert "Change to COR" in titles
    assert "Change to Alternate COR" in titles


# --- Contract modification with a COR change (#3269) ------------------------------------------


@pytest.fixture()
def cor_change_in_review(modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, test_can):
    """Factory: an Awarded agreement with an Obligated budget line (so the Division Director of
    ``test_can`` reviews it), its COR changed to ``NEW_COR_ID``, and a contract modification with
    only that change sent to approval. Returns ``(agreement, request_id)``."""

    def _make(new_cor=NEW_COR_ID, **agreement_kwargs):
        agreement = make_agreement(**agreement_kwargs)
        loaded_db.add(
            ContractBudgetLineItem(
                agreement_id=agreement.id,
                line_description="COR change mod test BLI",
                amount=100000.00,
                can_id=test_can.id,
                date_needed=datetime.date.today(),
                status=BudgetLineItemStatus.OBLIGATED,
                proc_shop_fee_percentage=0,
                created_by=BASIC_USER_ID,
            )
        )
        loaded_db.commit()
        assert _patch(basic_user_auth_client, agreement.id, {"project_officer_id": new_cor}).status_code == 200
        response = _submit_mod(basic_user_auth_client, agreement.id)
        assert response.status_code == 201, response.json
        return agreement, response.json["id"]

    return _make


def _submit_mod(client, agreement_id, **body):
    return client.post(
        url_for("api.agreements-contract-modifications", id=agreement_id), json={"budget_line_item_ids": [], **body}
    )


def _review(client, request_id, action="APPROVE", **body):
    return client.patch(
        url_for("api.contract-modification-requests-item", id=request_id), json={"action": action, **body}
    )


def _history_titles(loaded_db, agreement_id):
    loaded_db.expire_all()
    return loaded_db.scalars(
        select(AgreementHistory.history_title)
        .where(AgreementHistory.agreement_id_record == agreement_id)
        .order_by(AgreementHistory.id)
    ).all()


def test_start_modification_with_only_a_cor_change_puts_it_in_review(
    cor_change_in_review, basic_user_auth_client, loaded_db, app_ctx
):
    agreement, request_id = cor_change_in_review()

    [edit] = _cor_edits(loaded_db, agreement.id)
    response = basic_user_auth_client.get(url_for("api.agreements-contract-modifications", id=agreement.id))
    [request] = [r for r in response.json["data"] if r["id"] == request_id]
    assert [e["id"] for e in request["edits"]] == [edit.id]
    listed = basic_user_auth_client.get(url_for("api.agreements-contract-modification-edits", id=agreement.id))
    [card] = listed.json["data"]
    assert card["in_review"] is True
    started = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id_record == agreement.id,
            AgreementHistory.history_type == AgreementHistoryType.CONTRACT_MODIFICATION_STARTED,
        )
    ).one()
    assert "(changing the COR)" in started.history_message


def test_approving_a_cor_change_attaches_it_and_leaves_the_cor(
    cor_change_in_review, division_director_auth_client, loaded_db, app_ctx
):
    agreement, request_id = cor_change_in_review()

    response = _review(division_director_auth_client, request_id)

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == NEW_COR_ID  # applied when it was saved
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID
    mod = loaded_db.get(AgreementMod, response.json["agreement_mod_id"])
    assert mod.mod_type == ModType.ADMIN
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.agreement_mod_id == mod.id

    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.REVIEW_CONTRACT_MODIFICATION)
        .order_by(OpsEvent.id.desc())
        .limit(1)
    ).one()
    assert event.event_details["project_officer_change"] == {"old": CURRENT_COR_ID, "new": NEW_COR_ID}
    assert "request.remote_addr" in event.event_details
    # The approval writes only its own entry; the COR change was recorded when it was saved.
    [approved] = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id_record == agreement.id, AgreementHistory.ops_event_id == event.id
        )
    ).all()
    assert approved.history_type == AgreementHistoryType.CONTRACT_MODIFICATION_APPROVED
    assert "It included changing the COR." in approved.history_message


def test_approval_does_not_change_the_cor_or_the_alternate(
    cor_change_in_review, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, request_id = cor_change_in_review()
    # Alternate COR edits stay free while the COR change is in review.
    assert (
        _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": OTHER_COR_ID}).status_code == 200
    )

    response = _review(division_director_auth_client, request_id)

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == NEW_COR_ID
    assert agreement.alternate_project_officer_id == OTHER_COR_ID


def test_declining_a_cor_change_reverts_the_cor_and_removes_the_card(
    cor_change_in_review, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, request_id = cor_change_in_review()

    response = _review(division_director_auth_client, request_id, "DECLINE", reviewer_notes="Not yet")

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID  # back to the COR on the contract
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID  # untouched: it wasn't cleared
    assert _cor_edits(loaded_db, agreement.id) == []

    event = loaded_db.scalars(
        select(OpsEvent)
        .where(OpsEvent.event_type == OpsEventType.REVIEW_CONTRACT_MODIFICATION)
        .order_by(OpsEvent.id.desc())
        .limit(1)
    ).one()
    assert event.event_details["project_officer_revert"] == {
        "from": NEW_COR_ID,
        "to": CURRENT_COR_ID,
        "alternate_from": ALTERNATE_COR_ID,
        "alternate_to": ALTERNATE_COR_ID,
    }
    entries = loaded_db.scalars(
        select(AgreementHistory)
        .where(AgreementHistory.agreement_id_record == agreement.id, AgreementHistory.ops_event_id == event.id)
        .order_by(AgreementHistory.id)
    ).all()
    assert [entry.history_type for entry in entries] == [
        AgreementHistoryType.CONTRACT_MODIFICATION_DECLINED,
        AgreementHistoryType.AGREEMENT_UPDATED,
    ]
    assert "It included changing the COR." in entries[0].history_message
    old_name = loaded_db.get(User, NEW_COR_ID).full_name
    new_name = loaded_db.get(User, CURRENT_COR_ID).full_name
    assert entries[1].history_title == "Change to COR"
    assert entries[1].history_message.startswith(f"The COR changed back from {old_name} to {new_name} because ")

    # Nothing is locked or pending; the COR can be changed again, starting a new card.
    assert _patch(basic_user_auth_client, agreement.id, {"project_officer_id": OTHER_COR_ID}).status_code == 200
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert (edit.old_value, edit.new_value) == (CURRENT_COR_ID, OTHER_COR_ID)


def test_declining_a_promoted_alternate_restores_the_alternate(
    cor_change_in_review, division_director_auth_client, loaded_db, app_ctx
):
    """Promoting the Alternate COR cleared it; declining puts both back."""
    agreement, request_id = cor_change_in_review(new_cor=ALTERNATE_COR_ID)
    assert _reload(loaded_db, agreement.id).alternate_project_officer_id is None
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.cleared_alternate_project_officer_id == ALTERNATE_COR_ID

    response = _review(division_director_auth_client, request_id, "DECLINE")

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []
    titles = _history_titles(loaded_db, agreement.id)
    assert titles[-2:] == ["Change to COR", "Change to Alternate COR"]


def test_declining_keeps_an_alternate_picked_after_the_promotion(
    cor_change_in_review, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    agreement, request_id = cor_change_in_review(new_cor=ALTERNATE_COR_ID)
    # Alternate COR edits stay free while the COR change is in review.
    assert (
        _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": OTHER_COR_ID}).status_code == 200
    )

    assert _review(division_director_auth_client, request_id, "DECLINE").status_code == 200

    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id == OTHER_COR_ID


def test_declining_clears_an_alternate_who_is_the_restored_cor(
    cor_change_in_review, basic_user_auth_client, division_director_auth_client, loaded_db, app_ctx
):
    """If the Alternate COR was set to the COR on the contract while in review, restoring that COR
    clears the Alternate COR, so one person isn't both."""
    agreement, request_id = cor_change_in_review()
    assert (
        _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": CURRENT_COR_ID}).status_code
        == 200
    )

    assert _review(division_director_auth_client, request_id, "DECLINE").status_code == 200

    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id is None


def test_a_further_change_keeps_the_first_cleared_alternate(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """A→Alternate (clears the Alternate) then →Other: the card still remembers the Alternate it
    cleared, so a decline can restore the agreement as it was on the contract."""
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": OTHER_COR_ID})

    [edit] = _cor_edits(loaded_db, agreement.id)
    assert (edit.old_value, edit.new_value) == (CURRENT_COR_ID, OTHER_COR_ID)
    assert edit.cleared_alternate_project_officer_id == ALTERNATE_COR_ID


@pytest.mark.parametrize("via_other_cor", [False, True], ids=["direct", "via_another_cor"])
def test_changing_back_restores_the_alternate_the_change_cleared(
    via_other_cor, modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """A→Alternate (clears the Alternate), then back to A: the card goes and the Alternate COR
    comes back, as declining the change would do."""
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})
    if via_other_cor:
        _patch(basic_user_auth_client, agreement.id, {"project_officer_id": OTHER_COR_ID})

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": CURRENT_COR_ID})

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_changing_back_keeps_an_alternate_picked_after_the_promotion(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """A→Alternate (clears it), then a separate save picks a new Alternate COR, then back to A:
    the new Alternate COR stays, as on a decline."""
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})
    _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": OTHER_COR_ID})

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": CURRENT_COR_ID})

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id == OTHER_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_changing_back_keeps_an_alternate_picked_in_the_same_save(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})

    response = _patch(
        basic_user_auth_client,
        agreement.id,
        {"project_officer_id": CURRENT_COR_ID, "alternate_project_officer_id": OTHER_COR_ID},
    )

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).alternate_project_officer_id == OTHER_COR_ID


def test_declining_a_cor_change_with_a_modified_loe_edit_reverts_only_the_cor(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    make_agreement,
    test_can,
    app_ctx,
):
    """Both kinds of edit in one declined modification: the COR change is undone and its card
    removed, while the Modified LOE edit stays pending for the next modification."""
    agreement = make_agreement()
    bli = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="COR + LOE decline test BLI",
        amount=100000.00,
        can_id=test_can.id,
        date_needed=datetime.date.today(),
        status=BudgetLineItemStatus.OBLIGATED,
        proc_shop_fee_percentage=0,
        created_by=BASIC_USER_ID,
    )
    loaded_db.add(bli)
    loaded_db.flush()
    loe_edit = ContractModificationEdit(
        agreement_id=agreement.id,
        modification_type=ModificationEditType.MODIFIED_LOE,
        budget_line_item_id=bli.id,
        field="amount",
        old_value=100000.0,
        new_value=120000.0,
        requested_by_id=BASIC_USER_ID,
        requested_on=datetime.datetime.now(),
    )
    loaded_db.add(loe_edit)
    loaded_db.commit()
    loe_edit_id = loe_edit.id
    assert _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID}).status_code == 200
    submitted = _submit_mod(basic_user_auth_client, agreement.id)
    assert submitted.status_code == 201, submitted.json
    assert len(submitted.json["edits"]) == 2

    response = _review(division_director_auth_client, submitted.json["id"], "DECLINE")

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []
    loe_edit = loaded_db.get(ContractModificationEdit, loe_edit_id)
    assert loe_edit is not None
    assert loe_edit.agreement_mod_id is None
    assert [edit["id"] for edit in response.json["edits"]] == [loe_edit_id]


@pytest.mark.parametrize("new_cor", [OTHER_COR_ID, ALTERNATE_COR_ID], ids=["change", "promote_alternate"])
def test_cor_cannot_change_while_its_change_is_in_review(
    new_cor, cor_change_in_review, basic_user_auth_client, loaded_db, app_ctx
):
    agreement, _ = cor_change_in_review()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": new_cor})

    assert response.status_code == 400, response.json
    assert COR_CHANGE_IN_MODIFICATION_MESSAGE in str(response.json)
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == NEW_COR_ID
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_edit_bundle_cannot_change_the_cor_while_its_change_is_in_review(
    cor_change_in_review, basic_user_auth_client, loaded_db, app_ctx
):
    agreement, _ = cor_change_in_review()

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=agreement.id),
        json={"agreement": {"agreement_type": "CONTRACT", "project_officer_id": OTHER_COR_ID}},
    )

    assert response.status_code == 400, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_failed_approval_leaves_the_card_unattached(
    modified_loe_enabled,
    basic_user_auth_client,
    division_director_auth_client,
    loaded_db,
    make_agreement,
    test_can,
    app_ctx,
):
    """Approval is all-or-nothing: if a budget line sent with the COR change changed after the
    modification was sent, the approval fails and the card stays unattached."""
    agreement = make_agreement()
    planned = ContractBudgetLineItem(
        agreement_id=agreement.id,
        line_description="COR change mod test Planned BLI",
        amount=100000.00,
        can_id=test_can.id,
        date_needed=datetime.date.today(),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=0,
        created_by=BASIC_USER_ID,
    )
    loaded_db.add(planned)
    loaded_db.commit()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    request_id = _submit_mod(basic_user_auth_client, agreement.id, budget_line_item_ids=[planned.id]).json["id"]
    planned.line_description = "Edited after the modification was sent"
    loaded_db.commit()

    response = _review(division_director_auth_client, request_id)

    assert response.status_code == 400, response.json
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.agreement_mod_id is None
    assert loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == agreement.id)).all() == []


@pytest.mark.parametrize(
    "edit_types, expected",
    [
        ([], ModType.AS_IS),
        ([ModificationEditType.ADMIN_CHANGE], ModType.ADMIN),
        ([ModificationEditType.MODIFIED_LOE], ModType.MODIFIED_LOE),
        ([ModificationEditType.ADMIN_CHANGE, ModificationEditType.MODIFIED_LOE], ModType.MODIFIED_LOE),
    ],
)
def test_mod_type_follows_the_bundled_edits(edit_types, expected):
    from types import SimpleNamespace

    from ops_api.ops.services.contract_modification_requests import _mod_type

    request = SimpleNamespace(edits=[SimpleNamespace(modification_type=t) for t in edit_types])
    assert _mod_type(request) == expected


def test_agreement_meta_says_why_the_cor_is_locked_while_its_change_is_in_review(
    cor_change_in_review, basic_user_auth_client, division_director_auth_client, app_ctx
):
    agreement, request_id = cor_change_in_review()

    def locked_message():
        response = basic_user_auth_client.get(url_for("api.agreements-item", id=agreement.id))
        assert response.status_code == 200, response.json
        return response.json["_meta"]["projectOfficerLockedMessage"]

    assert locked_message() == COR_CHANGE_IN_MODIFICATION_MESSAGE
    assert _review(division_director_auth_client, request_id, "DECLINE").status_code == 200
    assert locked_message() is None


# --- Data migration 6f1d2c3b4a59 (#3269) ------------------------------------------------------


def _load_apply_pending_cor_changes_sql():
    import importlib.util
    from pathlib import Path

    path = (
        Path(__file__).resolve().parents[4]
        / "alembic"
        / "versions"
        / "2026_11_11_1200-6f1d2c3b4a59_apply_pending_cor_changes.py"
    )
    spec = importlib.util.spec_from_file_location("_apply_pending_cor_changes", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return text(module.APPLY_PENDING_COR_CHANGES_SQL)


def _old_rule_cor_edit(loaded_db, agreement, new_value, agreement_mod_id=None):
    """A COR edit as OPS-3153's earlier rule recorded it: the agreement's COR was left unchanged."""
    loaded_db.add(
        ContractModificationEdit(
            agreement_id=agreement.id,
            modification_type=ModificationEditType.ADMIN_CHANGE,
            field="project_officer_id",
            old_value=agreement.project_officer_id,
            new_value=new_value,
            requested_by_id=BASIC_USER_ID,
            agreement_mod_id=agreement_mod_id,
        )
    )
    loaded_db.commit()


def test_migration_applies_cor_changes_recorded_under_the_old_rule(loaded_db, make_agreement, app_ctx):
    to_alternate = make_agreement()
    _old_rule_cor_edit(loaded_db, to_alternate, ALTERNATE_COR_ID)
    to_other = make_agreement()
    _old_rule_cor_edit(loaded_db, to_other, NEW_COR_ID)
    already_in_a_mod = make_agreement()
    mod = AgreementMod(agreement_id=already_in_a_mod.id, mod_type=ModType.ADMIN)
    loaded_db.add(mod)
    loaded_db.commit()
    _old_rule_cor_edit(loaded_db, already_in_a_mod, NEW_COR_ID, agreement_mod_id=mod.id)
    to_missing_user = make_agreement()
    _old_rule_cor_edit(loaded_db, to_missing_user, 999999)

    loaded_db.execute(_load_apply_pending_cor_changes_sql())
    loaded_db.commit()

    to_alternate = _reload(loaded_db, to_alternate.id)
    assert to_alternate.project_officer_id == ALTERNATE_COR_ID
    assert to_alternate.alternate_project_officer_id is None  # one person isn't both
    to_other = _reload(loaded_db, to_other.id)
    assert to_other.project_officer_id == NEW_COR_ID
    assert to_other.alternate_project_officer_id == ALTERNATE_COR_ID
    # An edit already in an approved modification is left alone.
    assert _reload(loaded_db, already_in_a_mod.id).project_officer_id == CURRENT_COR_ID
    # A target user who no longer exists is skipped instead of failing the migration.
    assert _reload(loaded_db, to_missing_user.id).project_officer_id == CURRENT_COR_ID
