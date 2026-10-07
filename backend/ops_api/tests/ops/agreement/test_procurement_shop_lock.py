"""Unit tests for the shared Procurement Shop lock helpers (OPS-6312).

Covers ``has_proc_shop_blocking_bli`` and ``get_procurement_shop_locked_reason``
(``ops_api.ops.utils.agreements_helpers``) and the UI-copy mapper
``AgreementsService._get_procurement_shop_locked_message``. These are the single source of
truth the frontend's disabled-dropdown signal and the backend's ``ProcurementShopChangeRule``
both now defer to — see that rule and ``AgreementEditForm.hooks.js`` for the two consumers.
"""

import pytest
from flask import url_for

from models import (
    AaAgreement,
    Agreement,
    AgreementChangeRequest,
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractBudgetLineItem,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
    IAADirectionType,
    ProcurementAction,
    ProcurementActionStatus,
    User,
)
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.utils.agreements_helpers import (
    PROCUREMENT_SHOP_BLOCKING_BLI_STATUSES,
    ProcurementShopLockReason,
    get_procurement_shop_locked_reason,
    has_proc_shop_blocking_bli,
)
from ops_api.ops.validation.agreement_validator import AgreementValidator
from ops_api.ops.validation.awarded_agreement_validator import AwardedAgreementValidator
from ops_api.ops.validation.rules.agreement import ProcurementShopChangeRule
from ops_api.ops.validation.rules.awarded import ImmutableAwardedFieldsRule

# ---------------------------------------------------------------------------
# has_proc_shop_blocking_bli — the user-free predicate _handle_proc_shop_change calls directly
# ---------------------------------------------------------------------------


class TestHasProcShopBlockingBli:
    def test_no_user_required_and_works_on_a_transient_agreement(self):
        """Guards the _handle_proc_shop_change call site (services/agreements.py), which has no
        authenticated user and, per the existing service-layer unit tests, calls this against a
        bare, uncommitted Agreement() — not a concrete subclass, no session, no user."""
        agreement = Agreement()
        agreement.budget_line_items = []
        assert has_proc_shop_blocking_bli(agreement) is False

    @pytest.mark.parametrize(
        "status",
        [
            BudgetLineItemStatus.IN_EXECUTION,
            BudgetLineItemStatus.OBLIGATED,
        ],
    )
    def test_true_for_each_blocking_status(self, status):
        agreement = Agreement()
        bli = ContractBudgetLineItem()
        bli.status = status
        agreement.budget_line_items = [bli]
        assert has_proc_shop_blocking_bli(agreement) is True

    @pytest.mark.parametrize("status", [BudgetLineItemStatus.DRAFT, BudgetLineItemStatus.PLANNED, None])
    def test_false_for_non_blocking_status(self, status):
        """A NULL status must not raise (the ordinal check this replaced raised ValueError for
        None — see get_procurement_shop_locked_reason's docstring in agreements_helpers.py)."""
        agreement = Agreement()
        bli = ContractBudgetLineItem()
        bli.status = status
        agreement.budget_line_items = [bli]
        assert has_proc_shop_blocking_bli(agreement) is False

    def test_blocking_statuses_set_matches_the_two_named_statuses(self):
        assert PROCUREMENT_SHOP_BLOCKING_BLI_STATUSES == {
            BudgetLineItemStatus.IN_EXECUTION,
            BudgetLineItemStatus.OBLIGATED,
        }


# ---------------------------------------------------------------------------
# get_procurement_shop_locked_reason — the full, user-aware reason
# ---------------------------------------------------------------------------


@pytest.fixture()
def unawarded_contract(loaded_db, test_project, test_admin_user):
    """A CONTRACT agreement with no award data at all (is_awarded == False). Regression fixture
    for the production incident (#6312): agreements 522/525/526 all had awarding_entity_id=NULL,
    is_awarded=False, and at least one OBLIGATED budget line."""
    agreement = ContractAgreement(
        name="OPS-6312 unawarded contract",
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    yield agreement

    loaded_db.delete(agreement)
    loaded_db.commit()


@pytest.fixture()
def awarded_contract(loaded_db, test_project, test_admin_user):
    agreement = ContractAgreement(
        name="OPS-6312 awarded contract",
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    award_action = ProcurementAction(
        agreement_id=agreement.id,
        status=ProcurementActionStatus.AWARDED,
        award_type=AwardType.NEW_AWARD,
    )
    loaded_db.add(award_action)
    loaded_db.commit()
    loaded_db.refresh(agreement)

    yield agreement

    loaded_db.delete(award_action)
    loaded_db.delete(agreement)
    loaded_db.commit()


def _add_bli(loaded_db, agreement, test_can, status):
    bli = ContractBudgetLineItem(
        line_description="OPS-6312 test BLI",
        agreement_id=agreement.id,
        can_id=test_can.id,
        amount=1000.00,
        status=status,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()
    return bli


class TestGetProcurementShopLockedReason:
    @pytest.mark.parametrize(
        "status",
        [
            BudgetLineItemStatus.IN_EXECUTION,
            BudgetLineItemStatus.OBLIGATED,
        ],
    )
    def test_bli_in_execution_even_when_not_awarded(
        self, loaded_db, unawarded_contract, test_can, test_admin_user, status
    ):
        """The regression this ticket exists for: a locking BLI status must be reported
        regardless of is_awarded (see Context in the OPS-6312 story — OPS can under-report
        is_awarded for agreements that are, outside of OPS, already awarded)."""
        bli = _add_bli(loaded_db, unawarded_contract, test_can, status)
        assert unawarded_contract.is_awarded is False

        reason = get_procurement_shop_locked_reason(unawarded_contract, test_admin_user)
        assert reason == ProcurementShopLockReason.BLI_IN_EXECUTION

        loaded_db.delete(bli)
        loaded_db.commit()

    def test_null_status_bli_does_not_block(self, loaded_db, unawarded_contract, test_can, test_admin_user):
        bli = _add_bli(loaded_db, unawarded_contract, test_can, None)
        reason = get_procurement_shop_locked_reason(unawarded_contract, test_admin_user)
        assert reason is None

        loaded_db.delete(bli)
        loaded_db.commit()

    @pytest.mark.parametrize("status", [BudgetLineItemStatus.DRAFT, BudgetLineItemStatus.PLANNED])
    def test_none_for_draft_only_and_planned_only(
        self, loaded_db, unawarded_contract, test_can, test_admin_user, status
    ):
        bli = _add_bli(loaded_db, unawarded_contract, test_can, status)
        assert get_procurement_shop_locked_reason(unawarded_contract, test_admin_user) is None

        loaded_db.delete(bli)
        loaded_db.commit()

    def test_change_request_in_review_with_proc_shop_change(self, loaded_db, unawarded_contract, test_admin_user):
        cr = AgreementChangeRequest(
            agreement_id=unawarded_contract.id,
            change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
            status=ChangeRequestStatus.IN_REVIEW,
            requested_change_data={"awarding_entity_id": 2},
            created_by=test_admin_user.id,
        )
        loaded_db.add(cr)
        loaded_db.commit()
        loaded_db.refresh(unawarded_contract)

        reason = get_procurement_shop_locked_reason(unawarded_contract, test_admin_user)
        assert reason == ProcurementShopLockReason.CHANGE_REQUEST_IN_REVIEW

        loaded_db.delete(cr)
        loaded_db.commit()

    def test_change_request_in_review_without_proc_shop_change_does_not_block(
        self, loaded_db, unawarded_contract, test_admin_user
    ):
        """An in-review CR that doesn't touch awarding_entity_id (e.g. a notes-only change
        request) must not lock the Procurement Shop."""
        cr = AgreementChangeRequest(
            agreement_id=unawarded_contract.id,
            change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
            status=ChangeRequestStatus.IN_REVIEW,
            requested_change_data={"notes": "unrelated change"},
            created_by=test_admin_user.id,
        )
        loaded_db.add(cr)
        loaded_db.commit()
        loaded_db.refresh(unawarded_contract)

        assert get_procurement_shop_locked_reason(unawarded_contract, test_admin_user) is None

        loaded_db.delete(cr)
        loaded_db.commit()

    def test_awarded_for_non_superuser(self, awarded_contract, test_admin_user):
        """test_admin_user has a SYSTEM_OWNER role, not SUPER_USER — a real non-superuser."""
        assert test_admin_user.is_superuser is False
        assert (
            get_procurement_shop_locked_reason(awarded_contract, test_admin_user) == ProcurementShopLockReason.AWARDED
        )

    def test_none_for_superuser_on_an_otherwise_unlocked_awarded_agreement(self, loaded_db, awarded_contract):
        """User 528 (power-user) holds the SUPER_USER role in seed data — the one case where
        the backend genuinely accepts the change (ImmutableAwardedFieldsRule exempts
        superusers, and there's no blocking BLI or CR here)."""
        superuser = loaded_db.get(User, 528)
        assert superuser.is_superuser is True
        assert get_procurement_shop_locked_reason(awarded_contract, superuser) is None

    def test_bli_in_execution_takes_precedence_over_awarded(
        self, loaded_db, awarded_contract, test_can, test_admin_user
    ):
        """Precedence mirrors the validator chain: ProcurementShopChangeRule runs before
        ImmutableAwardedFieldsRule, so an awarded+obligated agreement reports the BLI reason —
        the error a user (including a superuser) actually gets back from the API."""
        bli = _add_bli(loaded_db, awarded_contract, test_can, BudgetLineItemStatus.OBLIGATED)

        assert get_procurement_shop_locked_reason(awarded_contract, test_admin_user) == (
            ProcurementShopLockReason.BLI_IN_EXECUTION
        )

        superuser = loaded_db.get(User, 528)
        assert get_procurement_shop_locked_reason(awarded_contract, superuser) == (
            ProcurementShopLockReason.BLI_IN_EXECUTION
        )

        loaded_db.delete(bli)
        loaded_db.commit()

    def test_awarded_aa_reports_awarded_the_control_case_for_direct_obligation_iaa_divergence(
        self, loaded_db, test_admin_user
    ):
        """AA is the one agreement type whose immutable_awarded_fields list DOES include
        awarding_entity_id (models/agreements.py), so it's unaffected by the deliberate
        decision (see get_procurement_shop_locked_reason's docstring) to not gate AWARDED on
        that list. This is the control: it must behave the same as a contract."""
        agreement = AaAgreement(
            name="OPS-6312 awarded AA control case",
            agreement_type=AgreementType.AA,
            requesting_agency_id=1,
            servicing_agency_id=1,
            created_by=test_admin_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        award_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(award_action)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert "awarding_entity_id" in agreement.immutable_awarded_fields
        assert get_procurement_shop_locked_reason(agreement, test_admin_user) == ProcurementShopLockReason.AWARDED

        loaded_db.delete(award_action)
        loaded_db.delete(agreement)
        loaded_db.commit()

    @pytest.mark.parametrize("agreement_cls", [GrantAgreement, DirectAgreement])
    def test_awarded_grant_and_direct_obligation_report_awarded_despite_empty_immutable_fields(
        self, loaded_db, test_admin_user, agreement_cls
    ):
        """Deliberate divergence from ImmutableAwardedFieldsRule (see the docstring on
        get_procurement_shop_locked_reason): Grant/Direct Obligation's immutable_awarded_fields
        list is empty, so the backend rule itself would NOT block this. Locking the UI anyway is
        intentionally more conservative — a disabled field can never produce an unsavable
        state — and keeps today's frontend behavior for these types unchanged rather than
        silently loosening it."""
        agreement = agreement_cls(
            name=f"OPS-6312 awarded {agreement_cls.__name__}",
            agreement_type=(
                AgreementType.GRANT if agreement_cls is GrantAgreement else AgreementType.DIRECT_OBLIGATION
            ),
            created_by=test_admin_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        award_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(award_action)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.immutable_awarded_fields == []
        assert get_procurement_shop_locked_reason(agreement, test_admin_user) == ProcurementShopLockReason.AWARDED

        loaded_db.delete(award_action)
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_awarded_iaa_reports_awarded(self, loaded_db, test_admin_user):
        agreement = IaaAgreement(
            name="OPS-6312 awarded IAA",
            agreement_type=AgreementType.IAA,
            direction=IAADirectionType.INCOMING,
            created_by=test_admin_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        award_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(award_action)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.immutable_awarded_fields == []
        assert get_procurement_shop_locked_reason(agreement, test_admin_user) == ProcurementShopLockReason.AWARDED

        loaded_db.delete(award_action)
        loaded_db.delete(agreement)
        loaded_db.commit()


# ---------------------------------------------------------------------------
# AgreementsService._get_procurement_shop_locked_message — the UI copy mapper
# ---------------------------------------------------------------------------


class TestGetProcurementShopLockedMessage:
    def test_bli_in_execution_message(self, loaded_db, unawarded_contract, test_can, test_admin_user):
        bli = _add_bli(loaded_db, unawarded_contract, test_can, BudgetLineItemStatus.OBLIGATED)
        service = AgreementsService(loaded_db)

        message = service._get_procurement_shop_locked_message(unawarded_contract, test_admin_user)
        assert message == (
            "The Procurement Shop cannot be edited because this agreement has budget lines in "
            "Executing or Obligated status."
        )

        loaded_db.delete(bli)
        loaded_db.commit()

    def test_change_request_in_review_message(self, loaded_db, unawarded_contract, test_admin_user):
        cr = AgreementChangeRequest(
            agreement_id=unawarded_contract.id,
            change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
            status=ChangeRequestStatus.IN_REVIEW,
            requested_change_data={"awarding_entity_id": 2},
            created_by=test_admin_user.id,
        )
        loaded_db.add(cr)
        loaded_db.commit()
        loaded_db.refresh(unawarded_contract)

        service = AgreementsService(loaded_db)
        message = service._get_procurement_shop_locked_message(unawarded_contract, test_admin_user)
        assert message == (
            "There are pending edits In Review for the Procurement Shop.\n It cannot be edited "
            "until pending edits have been approved or declined."
        )

        loaded_db.delete(cr)
        loaded_db.commit()

    def test_awarded_message(self, loaded_db, awarded_contract, test_admin_user):
        service = AgreementsService(loaded_db)
        message = service._get_procurement_shop_locked_message(awarded_contract, test_admin_user)
        assert message == "The Procurement Shop cannot be edited on an awarded agreement."

    def test_none_when_unlocked(self, loaded_db, unawarded_contract, test_can, test_admin_user):
        bli = _add_bli(loaded_db, unawarded_contract, test_can, BudgetLineItemStatus.DRAFT)
        service = AgreementsService(loaded_db)
        assert service._get_procurement_shop_locked_message(unawarded_contract, test_admin_user) is None

        loaded_db.delete(bli)
        loaded_db.commit()


# ---------------------------------------------------------------------------
# Validator precedence — a structural guard, not just a comment (see
# ProcurementShopChangeRule's docstring and the OPS-6312 story's "Regression Prevention").
# A reorder here wouldn't break authorization (both orders still reject an awarded+obligated
# change) but would silently make the tooltip state the wrong reason.
# ---------------------------------------------------------------------------


class TestValidatorPrecedence:
    def test_procurement_shop_change_rule_precedes_immutable_awarded_fields_rule(self):
        validators = AwardedAgreementValidator()._get_default_validators()
        proc_shop_index = next(i for i, v in enumerate(validators) if isinstance(v, ProcurementShopChangeRule))
        immutable_index = next(i for i, v in enumerate(validators) if isinstance(v, ImmutableAwardedFieldsRule))
        assert proc_shop_index < immutable_index

    def test_base_validator_includes_procurement_shop_change_rule_exactly_once(self):
        validators = AgreementValidator()._get_default_validators()
        matches = [v for v in validators if isinstance(v, ProcurementShopChangeRule)]
        assert len(matches) == 1


# ---------------------------------------------------------------------------
# Equivalence — the actual regression gate. For each shape, the backend's _meta signal and the
# backend's PATCH acceptance must agree, EXCEPT the one documented exemption below.
# ---------------------------------------------------------------------------


class TestProcurementShopLockMatchesPatchAcceptance:
    """GET _meta.procurementShopLockedMessage and PATCH awarding_entity_id must agree on whether
    the change is possible — this is the test that would have caught #6312. One shape is a
    documented exemption (see test name) rather than a bug: it's intentionally conservative."""

    def _assert_matches(self, auth_client, loaded_db, agreement, new_awarding_entity_id):
        get_response = auth_client.get(url_for("api.agreements-item", id=agreement.id))
        locked_message = get_response.json["_meta"]["procurementShopLockedMessage"]

        patch_response = auth_client.patch(
            url_for("api.agreements-item", id=agreement.id),
            json={"awarding_entity_id": new_awarding_entity_id},
        )
        return locked_message, patch_response.status_code

    def test_draft_only_is_unlocked_and_patch_succeeds(self, auth_client, loaded_db, unawarded_contract):
        locked_message, status = self._assert_matches(auth_client, loaded_db, unawarded_contract, 2)
        assert locked_message is None
        assert status in (200, 202)

    def test_obligated_bli_is_locked_and_patch_fails(self, auth_client, loaded_db, unawarded_contract, test_can):
        bli = _add_bli(loaded_db, unawarded_contract, test_can, BudgetLineItemStatus.OBLIGATED)

        locked_message, status = self._assert_matches(auth_client, loaded_db, unawarded_contract, 2)
        assert locked_message is not None
        assert status == 400

        loaded_db.delete(bli)
        loaded_db.commit()

    def test_awarded_direct_obligation_is_an_exemption_locked_in_ui_but_patch_would_succeed(
        self, loaded_db, auth_client, test_admin_user
    ):
        """Documented exemption (see get_procurement_shop_locked_reason and the OPS-6312 story's
        decision 6): a Direct Obligation's immutable_awarded_fields list is empty, so
        ImmutableAwardedFieldsRule would NOT reject this PATCH even though the agreement is
        awarded — but the UI locks it anyway. _meta correctly reports locked; the PATCH
        correctly succeeds. These two are expected to disagree here, by design."""
        agreement = DirectAgreement(
            name="OPS-6312 awarded direct obligation exemption",
            agreement_type=AgreementType.DIRECT_OBLIGATION,
            created_by=test_admin_user.id,
        )
        loaded_db.add(agreement)
        loaded_db.commit()
        award_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(award_action)
        loaded_db.commit()

        locked_message, status = self._assert_matches(auth_client, loaded_db, agreement, 2)
        assert locked_message is not None
        assert status in (200, 202)

        loaded_db.delete(award_action)
        loaded_db.delete(agreement)
        loaded_db.commit()
