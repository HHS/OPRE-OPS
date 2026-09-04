"""Unit/integration tests for AgreementAwardHistoryService and its label helper."""

from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select

from models import (
    AaAgreement,
    AgreementMod,
    AgreementType,
    AwardType,
    ContractAgreement,
    DefaultProcurementTracker,
    DefaultProcurementTrackerStep,
    GrantAgreement,
    ModType,
    ProcurementAction,
    ProcurementActionStatus,
    ProcurementTracker,
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    Vendor,
    VendorType,
)
from ops_api.ops.services.agreement_award_history import (
    AgreementAwardHistoryService,
    build_fiscal_year_label,
)
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError


def _cleanup_award_history(loaded_db, agreement, vendor=None):
    """Delete committed award-history data for an agreement in FK-safe order.

    Trackers reference procurement actions; actions reference agreement mods, so
    they must be removed in that order. Deleting a tracker cascades its steps.
    """
    loaded_db.rollback()
    for tracker in loaded_db.scalars(
        select(ProcurementTracker).where(ProcurementTracker.agreement_id == agreement.id)
    ).all():
        loaded_db.delete(tracker)
    loaded_db.flush()
    for action in loaded_db.scalars(
        select(ProcurementAction).where(ProcurementAction.agreement_id == agreement.id)
    ).all():
        loaded_db.delete(action)
    loaded_db.flush()
    for mod in loaded_db.scalars(select(AgreementMod).where(AgreementMod.agreement_id == agreement.id)).all():
        loaded_db.delete(mod)
    loaded_db.delete(agreement)
    if vendor is not None:
        loaded_db.delete(vendor)
    loaded_db.commit()


def _make_awarded_tracker(
    loaded_db,
    agreement_id,
    action_id,
    *,
    vendor=None,
    award_amount=None,
    award_date=None,
    requisition_number=None,
    requisition_approved_date=None,
    tracker_status=ProcurementTrackerStatus.COMPLETED,
    award_step_status=ProcurementTrackerStepStatus.COMPLETED,
    award_approval_status="APPROVED",
):
    """Create a tracker linked to a procurement action, with AWARD + PRE_AWARD steps.

    Defaults to a COMPLETED tracker whose AWARD step has been Budget-Team-approved —
    the state the award-history tab surfaces. Override ``tracker_status`` /
    ``award_step_status`` / ``award_approval_status`` to exercise the gating (e.g. an
    in-progress tracker whose award is already approved, or a tracker whose award has
    not yet been approved).
    """
    tracker = DefaultProcurementTracker(
        agreement_id=agreement_id,
        status=tracker_status,
        procurement_action=action_id,
        active_step_number=6,
    )
    loaded_db.add(tracker)
    loaded_db.flush()

    pre_award_step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=5,
        step_type=ProcurementTrackerStepType.PRE_AWARD,
        status=ProcurementTrackerStepStatus.COMPLETED,
        pre_award_requisition_number=requisition_number,
        pre_award_requisition_approved_date=requisition_approved_date,
    )
    award_step = DefaultProcurementTrackerStep(
        procurement_tracker=tracker,
        step_number=6,
        step_type=ProcurementTrackerStepType.AWARD,
        status=award_step_status,
        award_approval_status=award_approval_status,
        award_vendor_id=vendor.id if vendor else None,
        award_amount=award_amount,
        award_date=award_date,
    )
    loaded_db.add_all([pre_award_step, award_step])
    loaded_db.flush()
    return tracker


@pytest.fixture
def awarded_contract(loaded_db):
    """An awarded ContractAgreement with an initial award + one completed modification.

    Yields a dict with the created objects; cleans up on teardown.
    """
    vendor = Vendor(name="Flexion Inc.", duns="123456789", vendor_type=VendorType.SMALL_BUSINESS)
    loaded_db.add(vendor)
    loaded_db.flush()

    agreement = ContractAgreement(
        name="Award History Contract Test",
        agreement_type=AgreementType.CONTRACT,
        contract_number="CONTRACT-001",
        po_number="PO-001",
        task_order_number="TO-001",
    )
    loaded_db.add(agreement)
    loaded_db.flush()

    award_action = ProcurementAction(
        agreement_id=agreement.id,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        date_awarded_obligated=date(2024, 6, 26),
        agreement_total=Decimal("5000000.00"),
    )
    loaded_db.add(award_action)
    loaded_db.flush()
    _make_awarded_tracker(
        loaded_db,
        agreement.id,
        award_action.id,
        vendor=vendor,
        award_amount=Decimal("1000000.00"),
        award_date=date(2024, 6, 26),
        requisition_number="REQ-000444",
        requisition_approved_date=date(2024, 6, 20),
    )

    mod = AgreementMod(
        agreement_id=agreement.id,
        number="Mod 1",
        mod_type=ModType.ADMIN,
        mod_date=date(2025, 1, 15),
    )
    loaded_db.add(mod)
    loaded_db.flush()
    mod_action = ProcurementAction(
        agreement_id=agreement.id,
        agreement_mod_id=mod.id,
        award_type=AwardType.MODIFICATION,
        status=ProcurementActionStatus.AWARDED,
        date_awarded_obligated=date(2025, 1, 15),
        agreement_total=Decimal("6000000.00"),
    )
    loaded_db.add(mod_action)
    loaded_db.flush()
    _make_awarded_tracker(
        loaded_db,
        agreement.id,
        mod_action.id,
        vendor=vendor,
        award_amount=Decimal("1000000.00"),
        award_date=date(2025, 1, 15),
        requisition_number="REQ-000555",
        requisition_approved_date=date(2025, 1, 10),
    )
    loaded_db.commit()

    yield {"agreement": agreement, "vendor": vendor, "mod": mod}

    _cleanup_award_history(loaded_db, agreement, vendor)


class TestBuildFiscalYearLabel:
    def test_initial_award_label(self):
        assert build_fiscal_year_label(date(2024, 6, 26), False, None) == "FY 2024 Award"

    def test_award_uses_federal_fiscal_year(self):
        # Oct 1 rolls into the next fiscal year.
        assert build_fiscal_year_label(date(2024, 10, 1), False, None) == "FY 2025 Award"

    def test_modification_label_uses_mod_number_verbatim(self):
        assert build_fiscal_year_label(date(2025, 1, 15), True, "Mod 1") == "FY 2025 Mod 1"

    def test_modification_without_number(self):
        assert build_fiscal_year_label(date(2025, 1, 15), True, None) == "FY 2025 Mod"

    def test_missing_date_drops_fy_prefix(self):
        assert build_fiscal_year_label(None, False, None) == "Award"
        assert build_fiscal_year_label(None, True, "Mod 2") == "Mod 2"


class TestAgreementAwardHistoryService:
    def test_returns_ordered_award_then_mod(self, loaded_db, app_ctx, awarded_contract):
        service = AgreementAwardHistoryService(loaded_db)
        records = service.get_award_history(awarded_contract["agreement"].id)

        assert len(records) == 2
        # Oldest-first: initial award, then modification.
        assert records[0]["fiscal_year_label"] == "FY 2024 Award"
        assert records[0]["modification_number"] == "Base"
        assert records[1]["fiscal_year_label"] == "FY 2025 Mod 1"
        assert records[1]["modification_number"] == "Mod 1"

    def test_field_mapping_for_initial_award(self, loaded_db, app_ctx, awarded_contract):
        service = AgreementAwardHistoryService(loaded_db)
        record = service.get_award_history(awarded_contract["agreement"].id)[0]

        assert record["award_date"] == date(2024, 6, 26)
        assert record["award_amount"] == Decimal("1000000.00")
        assert record["contract_total"] == Decimal("5000000.00")
        assert record["contract_number"] == "CONTRACT-001"
        assert record["requisition_number"] == "REQ-000444"
        assert record["requisition_approval_date"] == date(2024, 6, 20)
        assert record["vendor_name"] == "Flexion Inc."
        assert record["vendor_unique_entity_id"] == "123456789"
        assert record["vendor_type"] == VendorType.SMALL_BUSINESS
        # Agreement-level fields repeat on every row.
        assert record["purchase_order_number"] == "PO-001"
        assert record["task_order_number"] == "TO-001"

    def test_po_and_task_order_repeat_across_rows(self, loaded_db, app_ctx, awarded_contract):
        service = AgreementAwardHistoryService(loaded_db)
        records = service.get_award_history(awarded_contract["agreement"].id)
        for record in records:
            assert record["purchase_order_number"] == "PO-001"
            assert record["task_order_number"] == "TO-001"
            assert record["contract_number"] == "CONTRACT-001"

    def test_resolves_fields_for_aa_agreement(self, loaded_db, app_ctx):
        """The Contract/AA subtype resolution works for AaAgreement too (Decision 1a)."""
        vendor = Vendor(name="AA Vendor", duns="999888777", vendor_type=VendorType.LARGE_BUSINESS)
        loaded_db.add(vendor)
        loaded_db.flush()

        agreement = AaAgreement(
            name="Award History AA Test",
            agreement_type=AgreementType.AA,
            requesting_agency_id=1,
            servicing_agency_id=1,
            contract_number="AA-CONTRACT-001",
            po_number="AA-PO-001",
            task_order_number="AA-TO-001",
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=AwardType.NEW_AWARD,
            status=ProcurementActionStatus.AWARDED,
            date_awarded_obligated=date(2024, 3, 1),
            agreement_total=Decimal("2000000.00"),
        )
        loaded_db.add(action)
        loaded_db.flush()
        _make_awarded_tracker(loaded_db, agreement.id, action.id, vendor=vendor, award_amount=Decimal("2000000.00"))
        loaded_db.commit()

        try:
            service = AgreementAwardHistoryService(loaded_db)
            records = service.get_award_history(agreement.id)
            assert len(records) == 1
            assert records[0]["contract_number"] == "AA-CONTRACT-001"
            assert records[0]["purchase_order_number"] == "AA-PO-001"
            assert records[0]["task_order_number"] == "AA-TO-001"
            assert records[0]["vendor_name"] == "AA Vendor"
            assert records[0]["modification_number"] == "Base"
        finally:
            _cleanup_award_history(loaded_db, agreement, vendor)

    def test_missing_fields_are_none(self, loaded_db, app_ctx):
        """Fields with no underlying data resolve to None (frontend applies NO_DATA)."""
        agreement = ContractAgreement(
            name="Award History Sparse Test",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()
        action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=AwardType.NEW_AWARD,
            status=ProcurementActionStatus.AWARDED,
        )
        loaded_db.add(action)
        loaded_db.flush()
        _make_awarded_tracker(loaded_db, agreement.id, action.id)
        loaded_db.commit()

        try:
            service = AgreementAwardHistoryService(loaded_db)
            record = service.get_award_history(agreement.id)[0]
            assert record["award_date"] is None
            assert record["award_amount"] is None
            assert record["contract_total"] is None
            assert record["contract_number"] is None
            assert record["requisition_number"] is None
            assert record["vendor_name"] is None
            assert record["vendor_type"] is None
            assert record["purchase_order_number"] is None
            # "Base" is still applied for the initial award even when everything else is empty.
            assert record["modification_number"] == "Base"
            assert record["fiscal_year_label"] == "Award"
        finally:
            _cleanup_award_history(loaded_db, agreement)

    def test_excludes_actions_without_approved_award(self, loaded_db, app_ctx):
        """An action whose AWARD step has not been Budget-Team-approved is not returned,
        even if the tracker is otherwise progressing."""
        agreement = ContractAgreement(
            name="Award History Unapproved Award Test",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()
        action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=AwardType.NEW_AWARD,
            status=ProcurementActionStatus.IN_PROCESS,
        )
        loaded_db.add(action)
        loaded_db.flush()
        # AWARD step is still ACTIVE with approval pending (no APPROVED status yet).
        _make_awarded_tracker(
            loaded_db,
            agreement.id,
            action.id,
            tracker_status=ProcurementTrackerStatus.ACTIVE,
            award_step_status=ProcurementTrackerStepStatus.ACTIVE,
            award_approval_status=None,
        )
        loaded_db.commit()

        try:
            service = AgreementAwardHistoryService(loaded_db)
            assert service.get_award_history(agreement.id) == []
        finally:
            _cleanup_award_history(loaded_db, agreement)

    def test_includes_award_approved_before_tracker_completed(self, loaded_db, app_ctx):
        """A cycle is returned once the Budget Team approves the award, before the COR
        completes the final step (tracker still ACTIVE, AWARD step not yet COMPLETED)."""
        agreement = ContractAgreement(
            name="Award History Approved Not Completed Test",
            agreement_type=AgreementType.CONTRACT,
            contract_number="CONTRACT-APPROVED",
        )
        loaded_db.add(agreement)
        loaded_db.flush()
        action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=AwardType.NEW_AWARD,
            status=ProcurementActionStatus.AWARDED,
            date_awarded_obligated=date(2024, 6, 26),
            agreement_total=Decimal("3000000.00"),
        )
        loaded_db.add(action)
        loaded_db.flush()
        _make_awarded_tracker(
            loaded_db,
            agreement.id,
            action.id,
            award_amount=Decimal("500000.00"),
            award_date=date(2024, 6, 26),
            tracker_status=ProcurementTrackerStatus.ACTIVE,
            award_step_status=ProcurementTrackerStepStatus.ACTIVE,
            award_approval_status="APPROVED",
        )
        loaded_db.commit()

        try:
            service = AgreementAwardHistoryService(loaded_db)
            records = service.get_award_history(agreement.id)
            assert len(records) == 1
            assert records[0]["contract_number"] == "CONTRACT-APPROVED"
            assert records[0]["award_amount"] == Decimal("500000.00")
        finally:
            _cleanup_award_history(loaded_db, agreement)

    def test_empty_list_when_no_actions(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Award History Empty Test",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        try:
            service = AgreementAwardHistoryService(loaded_db)
            assert service.get_award_history(agreement.id) == []
        finally:
            loaded_db.delete(agreement)
            loaded_db.commit()

    def test_raises_not_found_for_missing_agreement(self, loaded_db, app_ctx):
        service = AgreementAwardHistoryService(loaded_db)
        with pytest.raises(ResourceNotFoundError):
            service.get_award_history(9999999)

    def test_raises_validation_error_for_grant(self, loaded_db, app_ctx):
        """A non-Contract/AA agreement is rejected before any .po_number access."""
        agreement = GrantAgreement(
            name="Award History Grant Test",
            agreement_type=AgreementType.GRANT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        try:
            service = AgreementAwardHistoryService(loaded_db)
            with pytest.raises(ValidationError):
                service.get_award_history(agreement.id)
        finally:
            loaded_db.delete(agreement)
            loaded_db.commit()
