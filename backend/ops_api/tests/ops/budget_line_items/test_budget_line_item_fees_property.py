from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy import select

from models import (
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ProcurementShop,
    ProcurementShopFee,
)


@pytest.fixture
def test_procurement_shop(loaded_db):
    """Create a test procurement shop with a default fee rate."""
    proc_shop = ProcurementShop(
        name="Test Procurement Shop",
        abbr="TPS",
    )
    loaded_db.add(proc_shop)
    loaded_db.flush()
    return proc_shop


@pytest.fixture
def test_procurement_shop_fee(loaded_db, test_procurement_shop):
    """Create a test procurement shop fee entry."""
    fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id,
        fee=Decimal(10.0),  # 10% fee rate
    )
    loaded_db.add(fee)
    loaded_db.flush()
    return fee


@pytest.fixture
def test_agreement(loaded_db, test_can):
    """Create a test agreement without a procurement shop initially."""
    agreement = ContractAgreement(name="Test Agreement", description="Test agreement description")
    loaded_db.add(agreement)
    loaded_db.flush()
    return agreement


@pytest.fixture
def test_agreement_with_procurement_shop(loaded_db, test_agreement, test_procurement_shop):
    """Create a test agreement with a procurement shop."""
    test_agreement.procurement_shop_id = test_procurement_shop.id
    loaded_db.flush()
    return test_agreement


def test_fees_with_locked_in_rate(app, loaded_db, test_user, test_agreement, test_procurement_shop):
    """Test fees calculation when a locked-in rate (procurement_shop_fee_id) is set"""
    proc_shop_fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id,
        fee=Decimal(10.0),  # 10% fee
    )
    loaded_db.add(proc_shop_fee)
    loaded_db.flush()

    bli = ContractBudgetLineItem(
        agreement_id=test_agreement.id,
        amount=1000.0,
        procurement_shop_fee_id=proc_shop_fee.id,
        status=BudgetLineItemStatus.DRAFT,
    )
    loaded_db.add(bli)
    loaded_db.flush()

    assert bli.fees == 100.0  # 10% of 1000 = 100

    stmt = select(BudgetLineItem.fees).where(BudgetLineItem.id == bli.id)
    result = loaded_db.execute(stmt).scalar_one()
    assert result == 100.0


def test_fees_with_agreement_procurement_shop(app, loaded_db, test_user, test_agreement, test_procurement_shop):
    """Test fees calculation when using the agreement's procurement shop current fee"""
    today = date.today()
    fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id, fee=Decimal(5.0), start_date=today, end_date=None  # 5% fee
    )
    loaded_db.add(fee)
    loaded_db.flush()

    test_agreement.awarding_entity_id = test_procurement_shop.id
    loaded_db.flush()

    bli = ContractBudgetLineItem(agreement_id=test_agreement.id, amount=2000.0, status=BudgetLineItemStatus.DRAFT)
    loaded_db.add(bli)
    loaded_db.flush()

    assert bli.fees == 100.0  # 5% of 2000 = 100

    stmt = select(BudgetLineItem.fees).where(BudgetLineItem.id == bli.id)
    result = loaded_db.execute(stmt).scalar_one()
    assert result == 100.0


def test_fees_no_procurement_shop_all_draft(app, loaded_db, test_user, test_agreement):
    """Test fees calculation when agreement has no procurement shop and all BLIs are DRAFT"""
    test_agreement.procurement_shop_id = None
    loaded_db.flush()

    bli = ContractBudgetLineItem(agreement_id=test_agreement.id, amount=3000.0, status=BudgetLineItemStatus.DRAFT)
    loaded_db.add(bli)
    loaded_db.flush()

    assert bli.fees == 0.0

    stmt = select(BudgetLineItem.fees).where(BudgetLineItem.id == bli.id)
    result = loaded_db.execute(stmt).scalar_one()
    assert result == 0.0


def test_fees_no_procurement_shop_with_non_draft_bli(app, loaded_db, test_user, test_agreement):
    """Test fees calculation when agreement has no procurement shop but has a non-DRAFT BLI"""
    test_agreement.procurement_shop_id = None
    loaded_db.flush()

    non_draft_bli = ContractBudgetLineItem(
        agreement_id=test_agreement.id, amount=1000.0, status=BudgetLineItemStatus.PLANNED
    )
    loaded_db.add(non_draft_bli)

    draft_bli = ContractBudgetLineItem(agreement_id=test_agreement.id, amount=3000.0, status=BudgetLineItemStatus.DRAFT)
    loaded_db.add(draft_bli)
    loaded_db.flush()

    assert draft_bli.fees == 0.0

    stmt = select(BudgetLineItem.fees).where(BudgetLineItem.id == draft_bli.id)
    result = loaded_db.execute(stmt).scalar_one()
    assert result == 0.0


def test_fees_with_null_amount(app, loaded_db, test_user, test_agreement, test_procurement_shop):
    """Test fees calculation when BLI amount is NULL"""
    fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id,
        fee=Decimal("5.0"),  # 5% fee
        start_date=date.today(),
        end_date=None,
    )
    loaded_db.add(fee)
    loaded_db.flush()

    test_agreement.awarding_entity_id = test_procurement_shop.id
    loaded_db.flush()

    bli = ContractBudgetLineItem(
        agreement_id=test_agreement.id,
        amount=None,
        status=BudgetLineItemStatus.DRAFT,
    )
    loaded_db.add(bli)
    loaded_db.flush()

    assert bli.fees == 0.0

    stmt = select(BudgetLineItem.fees).where(BudgetLineItem.id == bli.id)
    result = loaded_db.execute(stmt).scalar_one()
    assert result == 0.0


def test_fees_priority_order(app, loaded_db, test_user, test_agreement, test_procurement_shop):
    """Test that locked-in fee takes priority over agreement procurement shop fee"""

    agreement_fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id, fee=Decimal("5.0"), start_date=date.today()  # 5% fee
    )
    loaded_db.add(agreement_fee)

    locked_in_fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id, fee=Decimal("10.0"), start_date=None  # 10% fee
    )
    loaded_db.add(locked_in_fee)
    loaded_db.flush()

    test_agreement.awarding_entity_id = test_procurement_shop.id
    loaded_db.flush()

    bli = ContractBudgetLineItem(
        agreement_id=test_agreement.id,
        amount=1000.0,
        procurement_shop_fee_id=locked_in_fee.id,
        status=BudgetLineItemStatus.DRAFT,
    )
    loaded_db.add(bli)
    loaded_db.flush()

    assert bli.fees == 100.0  # 10% of 1000

    stmt = select(BudgetLineItem.fees).where(BudgetLineItem.id == bli.id)
    result = loaded_db.execute(stmt).scalar_one()
    assert result == 100.0


def test_fees_in_bulk_query(app, loaded_db, test_user, test_agreement, test_procurement_shop):
    """Test that fees can be used in a bulk query with filtering, scoped to this test's data only."""
    default_fee = ProcurementShopFee(
        procurement_shop_id=test_procurement_shop.id, fee=Decimal("5.0"), start_date=date.today()
    )
    loaded_db.add(default_fee)

    test_agreement.awarding_entity_id = test_procurement_shop.id
    loaded_db.flush()

    locked_in_fee = ProcurementShopFee(procurement_shop_id=test_procurement_shop.id, fee=Decimal("10.0"))
    loaded_db.add(locked_in_fee)
    loaded_db.flush()

    bli1 = ContractBudgetLineItem(
        agreement_id=test_agreement.id,
        amount=1000.0,
        procurement_shop_fee_id=locked_in_fee.id,
        status=BudgetLineItemStatus.DRAFT,
    )
    bli2 = ContractBudgetLineItem(agreement_id=test_agreement.id, amount=2000.0, status=BudgetLineItemStatus.DRAFT)

    loaded_db.add_all([bli1, bli2])
    loaded_db.flush()

    base_stmt = select(BudgetLineItem).where(BudgetLineItem.agreement_id == test_agreement.id)

    stmt = base_stmt.where(BudgetLineItem.fees > 90.0)
    results = loaded_db.execute(stmt).scalars().all()
    assert {bli.id for bli in results} == {bli1.id, bli2.id}

    stmt = base_stmt.where(BudgetLineItem.fees > 95.0)
    results = loaded_db.execute(stmt).scalars().all()
    assert {bli.id for bli in results} == {bli1.id, bli2.id}

    stmt = base_stmt.where(BudgetLineItem.fees > 105.0)
    results = loaded_db.execute(stmt).scalars().all()
    assert len(results) == 0
