from datetime import date
from decimal import Decimal

import pytest

from models import (
    AgreementMod,
    AgreementType,
    AwardType,
    ContractAgreement,
    ModType,
    ProcurementAction,
    ProcurementActionStatus,
    Vendor,
    VendorType,
)
from ops_api.tests.utils import cleanup_award_history, make_awarded_tracker


@pytest.fixture
def awarded_contract(loaded_db):
    """An awarded ContractAgreement with an initial award + one completed modification.

    Shared by the award-history service tests and the award-history endpoint tests,
    which both exercise this same award+mod object graph. Yields a dict with the
    created objects; cleans up on teardown.
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
    make_awarded_tracker(
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
    make_awarded_tracker(
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

    cleanup_award_history(loaded_db, agreement, vendor)
