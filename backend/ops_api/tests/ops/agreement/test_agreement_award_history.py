"""Integration tests for the /agreements/<id>/award-history/ endpoint."""

from datetime import date
from decimal import Decimal

import pytest
from flask import url_for

from models import (
    AaAgreement,
    AgreementType,
    AwardType,
    ContractAgreement,
    GrantAgreement,
    ProcurementAction,
    ProcurementActionStatus,
    Vendor,
    VendorType,
)
from ops_api.tests.utils import cleanup_award_history, make_awarded_tracker


class TestAgreementAwardHistoryEndpoint:
    def test_contract_with_award_and_mod_returns_two_records(self, auth_client, awarded_contract):
        agreement = awarded_contract["agreement"]
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
        make_awarded_tracker(
            loaded_db,
            agreement.id,
            action.id,
            vendor=vendor,
            award_amount=Decimal("2000000.00"),
            award_date=date(2024, 6, 26),
        )
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
            cleanup_award_history(loaded_db, agreement, vendor)

    def test_step_6_award_fields_are_serialized(self, auth_client, loaded_db):
        """OPS-5892: the Modification # / Purchase Order # / Task Order # captured on the
        AWARD step reach the response, overriding the agreement-level columns."""
        agreement = ContractAgreement(
            name="Award History Endpoint Step 6",
            agreement_type=AgreementType.CONTRACT,
            po_number="PO-IMPORTED",
            task_order_number="TO-IMPORTED",
        )
        loaded_db.add(agreement)
        loaded_db.flush()
        action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=AwardType.NEW_AWARD,
            status=ProcurementActionStatus.AWARDED,
            date_awarded_obligated=date(2024, 6, 26),
        )
        loaded_db.add(action)
        loaded_db.flush()
        make_awarded_tracker(
            loaded_db,
            agreement.id,
            action.id,
            award_modification_number="P00002",
            award_purchase_order_number="PO-STEP6",
            award_task_order_number="TO-STEP6",
        )
        loaded_db.commit()

        try:
            response = auth_client.get(url_for("api.agreements-award-history-item", id=agreement.id))
            assert response.status_code == 200
            record = response.json["data"][0]
            assert record["modification_number"] == "P00002"
            assert record["purchase_order_number"] == "PO-STEP6"
            assert record["task_order_number"] == "TO-STEP6"
        finally:
            cleanup_award_history(loaded_db, agreement)

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
