"""Integration tests for editing the COR on an Awarded agreement (OPS-3153).

On an Awarded Contract or AA agreement (with ``ENABLE_MODIFIED_LOE_EDITS`` on):

- Changing the COR to the saved Alternate COR applies immediately and clears the Alternate COR,
  unless the same save picks a new one.
- Changing the COR to anyone else needs no approval but is *not* applied: it is recorded as one
  pending ADMIN_CHANGE ``ContractModificationEdit``, and the COR changes only once the contract
  modification is approved (#3269). A new target replaces the pending one.

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
    AgreementReason,
    AgreementType,
    AwardType,
    ContractAgreement,
    ContractModificationEdit,
    ContractType,
    GrantAgreement,
    ModificationEditType,
    OpsEvent,
    OpsEventType,
    ProcurementAction,
    ProcurementActionStatus,
    ServiceRequirementType,
    User,
)
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
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
        loaded_db.execute(text("DELETE FROM contract_modification_edit WHERE agreement_id = :id"), params)
        loaded_db.execute(text("DELETE FROM procurement_action WHERE agreement_id = :id"), params)
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


# --- Pending COR change -----------------------------------------------------------------------


def test_cor_change_is_recorded_as_pending_and_not_applied(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id == ALTERNATE_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.field == "project_officer_id"
    assert edit.old_value == CURRENT_COR_ID
    assert edit.new_value == NEW_COR_ID
    assert edit.requested_by_id == BASIC_USER_ID
    assert edit.requested_on is not None
    assert edit.change_request_id is None
    assert edit.approved_by_id is None
    assert edit.agreement_mod_id is None


def test_superuser_cor_change_is_also_pending(
    modified_loe_enabled, power_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(power_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    assert len(_cor_edits(loaded_db, agreement.id)) == 1


def test_new_target_replaces_the_pending_change(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    [first] = _cor_edits(loaded_db, agreement.id)

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": OTHER_COR_ID})

    assert response.status_code == 200, response.json
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.id == first.id
    assert edit.old_value == CURRENT_COR_ID
    assert edit.new_value == OTHER_COR_ID
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID


def test_saving_the_current_cor_leaves_the_pending_change(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """The form shows the current COR, so every save sends it; that is not a withdrawal."""
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = _patch(
        basic_user_auth_client, agreement.id, {"project_officer_id": CURRENT_COR_ID, "description": "Updated"}
    )

    assert response.status_code == 200, response.json
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID
    assert _reload(loaded_db, agreement.id).description == "Updated"


def test_mixed_save_applies_other_fields_and_records_the_cor(
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
    assert agreement.project_officer_id == CURRENT_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_new_alternate_set_as_cor_in_one_save_is_pending(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """The free promotion compares against the saved Alternate COR, not one set in the same save."""
    agreement = make_agreement()

    response = _patch(
        basic_user_auth_client,
        agreement.id,
        {"project_officer_id": NEW_COR_ID, "alternate_project_officer_id": NEW_COR_ID},
    )

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == CURRENT_COR_ID
    assert agreement.alternate_project_officer_id == NEW_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_cor_change_to_a_nonexistent_user_is_rejected(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": 999999})

    assert response.status_code == 400
    assert _cor_edits(loaded_db, agreement.id) == []


def test_failed_cor_record_rolls_back_the_whole_save(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx, monkeypatch
):
    """The COR is recorded before the commit, so when recording fails, the other fields in the
    same save aren't committed either."""
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
    assert _reload(loaded_db, agreement.id).description == original_description
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


def test_promoting_the_alternate_applies_now_and_clears_it(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})

    assert response.status_code == 200, response.json
    agreement = _reload(loaded_db, agreement.id)
    assert agreement.project_officer_id == ALTERNATE_COR_ID
    assert agreement.alternate_project_officer_id is None
    assert _cor_edits(loaded_db, agreement.id) == []


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


def test_promoting_the_alternate_updates_the_pending_change_from(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": ALTERNATE_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == ALTERNATE_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.old_value == ALTERNATE_COR_ID
    assert edit.new_value == NEW_COR_ID


def test_promoting_the_pending_target_removes_the_pending_change(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})
    _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": NEW_COR_ID})

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_alternate_cor_edits_stay_free(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"alternate_project_officer_id": OTHER_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).alternate_project_officer_id == OTHER_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


# --- Outside the gate -------------------------------------------------------------------------


def test_flag_off_applies_the_cor_change_directly(
    modified_loe_disabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


def test_awarded_aa_cor_change_is_pending(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement(agreement_type=AgreementType.AA)

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_awarded_grant_project_officer_change_applies_directly(
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


def test_not_awarded_applies_the_cor_change_directly(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement(awarded=False)

    response = _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == NEW_COR_ID
    assert _cor_edits(loaded_db, agreement.id) == []


# --- History, list and Start Modification -----------------------------------------------------


def test_pending_cor_change_records_history_and_event(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    loaded_db.expire_all()
    history = loaded_db.scalars(
        select(AgreementHistory).where(
            AgreementHistory.agreement_id_record == agreement.id,
            AgreementHistory.history_title == "Change to COR Pending Contract Modification",
        )
    ).all()
    assert len(history) == 1
    requestor = loaded_db.get(User, BASIC_USER_ID).full_name
    old_name = loaded_db.get(User, CURRENT_COR_ID).full_name
    new_name = loaded_db.get(User, NEW_COR_ID).full_name
    assert history[0].history_message == (
        f"{requestor} requested a COR change from {old_name} to {new_name}. "
        "This agreement is awarded, so the COR will change once the contract modification is approved."
    )
    event = loaded_db.get(OpsEvent, history[0].ops_event_id)
    assert event.event_type == OpsEventType.UPDATE_AGREEMENT
    assert event.created_by == BASIC_USER_ID
    assert "request.remote_addr" in event.event_details
    assert event.event_details["agreement_updates"]["pending_project_officer_change"] == {
        "old": CURRENT_COR_ID,
        "new": NEW_COR_ID,
    }


def test_pending_list_returns_the_cor_change_with_names(
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


def test_start_modification_leaves_cor_changes_pending(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    """Admin Changes go into the modification flow in #3269; until then a submit skips them."""
    agreement = make_agreement()
    _patch(basic_user_auth_client, agreement.id, {"project_officer_id": NEW_COR_ID})

    response = basic_user_auth_client.post(
        url_for("api.agreements-contract-modifications", id=agreement.id), json={"budget_line_item_ids": []}
    )

    assert response.status_code == 400
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.agreement_mod_id is None


def test_losing_a_concurrent_cor_save_raises_a_validation_error(
    modified_loe_enabled, loaded_db, make_agreement, app_ctx, monkeypatch
):
    """Two saves that both see no pending row: the second hits the unique index and gets a
    ValidationError (a 400 at the API), not an IntegrityError (a 500)."""
    agreement = make_agreement()
    service = ContractModificationEditService(loaded_db)
    user = loaded_db.get(User, BASIC_USER_ID)
    service.record_project_officer_change(agreement, NEW_COR_ID, user)
    loaded_db.commit()
    # The second save read before the first committed, so it doesn't see the pending row.
    monkeypatch.setattr(service, "_pending_project_officer_edit", lambda *args, **kwargs: None)

    with pytest.raises(ValidationError) as error:
        service.record_project_officer_change(agreement, OTHER_COR_ID, user)

    assert "project_officer_id" in error.value.validation_errors
    loaded_db.rollback()
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID


def test_one_pending_cor_change_per_agreement_is_enforced(modified_loe_enabled, loaded_db, make_agreement, app_ctx):
    agreement = make_agreement()
    service = ContractModificationEditService(loaded_db)
    user = loaded_db.get(User, BASIC_USER_ID)
    service.record_project_officer_change(agreement, NEW_COR_ID, user)
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


def test_edit_bundle_records_the_pending_cor_change_and_history(
    modified_loe_enabled, basic_user_auth_client, loaded_db, make_agreement, app_ctx
):
    agreement = make_agreement()

    response = basic_user_auth_client.patch(
        url_for("api.agreements-edit-bundle", id=agreement.id),
        json={"agreement": {"agreement_type": "CONTRACT", "project_officer_id": NEW_COR_ID}},
    )

    assert response.status_code == 200, response.json
    assert _reload(loaded_db, agreement.id).project_officer_id == CURRENT_COR_ID
    [edit] = _cor_edits(loaded_db, agreement.id)
    assert edit.new_value == NEW_COR_ID
    titles = loaded_db.scalars(
        select(AgreementHistory.history_title).where(AgreementHistory.agreement_id_record == agreement.id)
    ).all()
    assert "Change to COR Pending Contract Modification" in titles


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
    titles = loaded_db.scalars(
        select(AgreementHistory.history_title).where(AgreementHistory.agreement_id_record == agreement.id)
    ).all()
    assert "Change to COR" in titles
    assert "Change to Alternate COR" in titles
