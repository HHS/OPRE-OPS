"""Integration tests for the /agreements/<id>/award-history/ endpoint."""

from datetime import date
from decimal import Decimal

import pytest
from flask import url_for
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


def _cleanup_award_history(loaded_db, agreement, vendor=None):
    """Delete committed award-history data for an agreement in FK-safe order."""
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


def _completed_tracker(loaded_db, agreement_id, action_id, *, vendor=None, award_amount=None, requisition_number=None):
    tracker = DefaultProcurementTracker(
        agreement_id=agreement_id,
        status=ProcurementTrackerStatus.COMPLETED,
        procurement_action=action_id,
        active_step_number=6,
    )
    loaded_db.add(tracker)
    loaded_db.flush()
    loaded_db.add_all(
        [
            DefaultProcurementTrackerStep(
                procurement_tracker=tracker,
                step_number=5,
                step_type=ProcurementTrackerStepType.PRE_AWARD,
                status=ProcurementTrackerStepStatus.COMPLETED,
                pre_award_requisition_number=requisition_number,
                pre_award_requisition_approved_date=date(2024, 6, 20),
            ),
            DefaultProcurementTrackerStep(
                procurement_tracker=tracker,
                step_number=6,
                step_type=ProcurementTrackerStepType.AWARD,
                status=ProcurementTrackerStepStatus.COMPLETED,
                award_vendor_id=vendor.id if vendor else None,
                award_amount=award_amount,
                award_date=date(2024, 6, 26),
            ),
        ]
    )
    loaded_db.flush()
    return tracker


class TestAgreementAwardHistoryEndpoint:
    def test_contract_with_award_and_mod_returns_two_records(self, auth_client, loaded_db):
        vendor = Vendor(name="Flexion Inc.", duns="123456789", vendor_type=VendorType.SMALL_BUSINESS)
        loaded_db.add(vendor)
        loaded_db.flush()

        agreement = ContractAgreement(
            name="Award History Endpoint Contract",
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
        _completed_tracker(
            loaded_db,
            agreement.id,
            award_action.id,
            vendor=vendor,
            award_amount=Decimal("1000000.00"),
            requisition_number="REQ-000444",
        )

        mod = AgreementMod(
            agreement_id=agreement.id, number="Mod 1", mod_type=ModType.ADMIN, mod_date=date(2025, 1, 15)
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
        _completed_tracker(loaded_db, agreement.id, mod_action.id, vendor=vendor, award_amount=Decimal("1000000.00"))
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-award-history-item", id=agreement.id))
            assert response.status_code == 200
            data = response.json["data"]
            assert len(data) == 2

            award = data[0]
            assert award["fiscal_year_label"] == "FY 2024 Award"
            assert award["modification_number"] == "Base"
            assert award["award_amount"] == "1000000.00"
            assert award["contract_total"] == "5000000.00"
            assert award["contract_number"] == "CONTRACT-001"
            assert award["purchase_order_number"] == "PO-001"
            assert award["task_order_number"] == "TO-001"
            assert award["vendor_name"] == "Flexion Inc."
            assert award["vendor_unique_entity_id"] == "123456789"
            assert award["vendor_type"] == "SMALL_BUSINESS"
            assert award["requisition_number"] == "REQ-000444"

            assert data[1]["fiscal_year_label"] == "FY 2025 Mod 1"
            assert data[1]["modification_number"] == "Mod 1"
        finally:
            _cleanup_award_history(loaded_db, agreement, vendor)

    def test_aa_agreement_returns_records(self, auth_client, loaded_db):
        vendor = Vendor(name="AA Vendor", duns="999888777", vendor_type=VendorType.LARGE_BUSINESS)
        loaded_db.add(vendor)
        loaded_db.flush()
        agreement = AaAgreement(
            name="Award History Endpoint AA",
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
            date_awarded_obligated=date(2024, 6, 26),
            agreement_total=Decimal("2000000.00"),
        )
        loaded_db.add(action)
        loaded_db.flush()
        _completed_tracker(loaded_db, agreement.id, action.id, vendor=vendor, award_amount=Decimal("2000000.00"))
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-award-history-item", id=agreement.id))
            assert response.status_code == 200
            data = response.json["data"]
            assert len(data) == 1
            assert data[0]["contract_number"] == "AA-CONTRACT-001"
            assert data[0]["purchase_order_number"] == "AA-PO-001"
            assert data[0]["task_order_number"] == "AA-TO-001"
        finally:
            _cleanup_award_history(loaded_db, agreement, vendor)

    def test_empty_list_for_awarded_agreement_without_completed_trackers(self, auth_client, loaded_db):
        agreement = ContractAgreement(name="Award History Endpoint Empty", agreement_type=AgreementType.CONTRACT)
        loaded_db.add(agreement)
        loaded_db.commit()
        try:
            response = auth_client.get(url_for("api.agreements-award-history-item", id=agreement.id))
            assert response.status_code == 200
            assert response.json["data"] == []
        finally:
            loaded_db.delete(agreement)
            loaded_db.commit()

    def test_404_for_nonexistent_agreement(self, auth_client, loaded_db):
        response = auth_client.get(url_for("api.agreements-award-history-item", id=9999999))
        assert response.status_code == 404

    @pytest.mark.parametrize("agreement_type", [AgreementType.GRANT])
    def test_400_for_unsupported_agreement_type(self, auth_client, loaded_db, agreement_type):
        agreement = GrantAgreement(name="Award History Endpoint Grant", agreement_type=agreement_type)
        loaded_db.add(agreement)
        loaded_db.commit()
        try:
            response = auth_client.get(url_for("api.agreements-award-history-item", id=agreement.id))
            assert response.status_code == 400
        finally:
            loaded_db.delete(agreement)
            loaded_db.commit()

    def test_requires_authentication(self, client, loaded_db):
        response = client.get(url_for("api.agreements-award-history-item", id=1))
        assert response.status_code == 401
