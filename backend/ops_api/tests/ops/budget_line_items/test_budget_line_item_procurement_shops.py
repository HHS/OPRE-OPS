from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from flask import url_for
from marshmallow.experimental.context import Context
from sqlalchemy import select

from models import (
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    ProcurementShopFee,
)
from models.budget_line_items import DirectObligationBudgetLineItem
from ops_api.ops.schemas.budget_line_items import (
    PATCHRequestBodySchema,
    POSTRequestBodySchema,
)


@pytest.fixture
def mock_db_session():
    db_session = MagicMock()
    return db_session


@pytest.fixture
def mock_procurement_shop_fee():
    procurement_shop_fee = MagicMock()
    procurement_shop_fee.fee = 0.05
    return procurement_shop_fee


def test_create_bli_with_procurement_shop_fee_id():
    """Test creating a BLI with procurement_shop_fee_id"""
    bli = DirectObligationBudgetLineItem(
        budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
        line_description="Test Description",
        amount=Decimal("1000000.0"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2043, 6, 13),
        procurement_shop_fee_id=4,
    )

    assert bli.procurement_shop_fee_id == 4
    assert bli.proc_shop_fee_percentage is None


def test_fees_calculation_with_procurement_shop_fee(mock_procurement_shop_fee):
    """Test fees calculation when using procurement_shop_fee"""
    bli = DirectObligationBudgetLineItem(
        budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
        line_description="Test Description",
        amount=Decimal("1000000.0"),
        status=BudgetLineItemStatus.PLANNED,
        procurement_shop_fee_id=4,
        procurement_shop_fee=mock_procurement_shop_fee,
    )

    assert bli.fees == Decimal("500.00000")
    assert bli.total == Decimal("1000500.00000")


def test_post_schema_accepts_procurement_shop_fee_id(app_ctx):
    """Test POST schema accepts procurement_shop_fee_id"""
    schema = POSTRequestBodySchema()
    # Create valid data with procurement_shop_fee_id
    data = {
        "agreement_id": 1,
        "line_description": "Test Line Item",
        "can_id": 508,
        "amount": 1000000.0,
        "status": BudgetLineItemStatus.PLANNED.name,
        "date_needed": "2043-06-13",
        "procurement_shop_fee_id": 4,
    }

    # The schema should accept procurement_shop_fee_id to unknown=EXCLUDE
    result = schema.load(data, unknown="exclude")
    assert result is not None


def test_patch_schema_accepts_procurement_shop_fee_id(app_ctx):
    """Test PATCH schema accepts procurement_shop_fee_id"""
    schema = PATCHRequestBodySchema()

    # Create PATCH data with procurement_shop_fee_id
    data = {"line_description": "Updated Line Item", "procurement_shop_fee_id": 5}

    with Context({"id": 1, "method": "PATCH"}):
        # The schema should accept procurement_shop_fee_id
        result = schema.load(data, unknown="exclude")
        assert result is not None


def test_obligated_bli_with_procurement_shop_fee_id():
    """Test an OBLIGATED BLI with procurement_shop_fee_id"""
    bli = DirectObligationBudgetLineItem(
        budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
        line_description="Test Line Item",
        amount=Decimal("3000000.0"),
        status=BudgetLineItemStatus.OBLIGATED,
        date_needed=date(2043, 6, 13),
        procurement_shop_fee_id=4,
    )

    assert bli.procurement_shop_fee_id == 4
    assert bli.status == BudgetLineItemStatus.OBLIGATED


def test_bli_procurement_shop_fee_relationship(mock_procurement_shop_fee):
    """Test the relationship between BLI and procurement_shop_fee"""
    bli = DirectObligationBudgetLineItem(
        budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
        line_description="Test Line Item",
        amount=Decimal("1000000.0"),
        status=BudgetLineItemStatus.PLANNED,
        procurement_shop_fee_id=4,
        procurement_shop_fee=mock_procurement_shop_fee,
    )

    assert bli.procurement_shop_fee_id == 4
    assert bli.procurement_shop_fee is not None
    assert bli.procurement_shop_fee.fee == 0.05


def test_bli_response_schema_includes_procurement_shop_fee():
    """Test that the BudgetLineItemResponseSchema includes the procurement_shop_fee field"""
    from ops_api.ops.schemas.budget_line_items import BudgetLineItemResponseSchema

    schema = BudgetLineItemResponseSchema()
    # Check that procurement_shop_fee is in the schema
    assert "procurement_shop_fee" in schema.fields
    assert schema.fields["procurement_shop_fee"].allow_none is True


def test_serialization_with_procurement_shop_fee(mock_procurement_shop_fee):
    """Test that the BLI serializes with procurement_shop_fee correctly"""
    bli = DirectObligationBudgetLineItem(
        id=1,
        budget_line_item_type=AgreementType.DIRECT_OBLIGATION,
        line_description="Test Line Item",
        amount=Decimal("1000000.0"),
        status=BudgetLineItemStatus.PLANNED,
        procurement_shop_fee_id=4,
        procurement_shop_fee=mock_procurement_shop_fee,
    )

    # Verify the to_dict method includes procurement_shop_fee_id
    bli_dict = bli.to_dict()
    assert "procurement_shop_fee_id" in bli_dict
    assert bli_dict["procurement_shop_fee_id"] == 4


def test_budget_line_item_procurement_shop_lookup(loaded_db, test_bli, app_ctx):
    """Test retrieving procurement shop information from a BLI."""
    bli = loaded_db.get(BudgetLineItem, test_bli.id)
    assert bli is not None

    # Verify procurement shop fields
    bli_dict = bli.to_dict()
    assert "procurement_shop_fee_id" in bli_dict
    assert "procurement_shop_fee" in bli_dict


def test_budget_line_item_with_procurement_shop_fee(loaded_db, test_can, app_ctx):
    """Test creating a BLI with procurement shop."""
    # Find an existing procurement shop
    procurement_shop_fee = loaded_db.scalars(select(ProcurementShopFee).limit(1)).first()
    assert procurement_shop_fee is not None

    # Create BLI with procurement shop
    bli = ContractBudgetLineItem(
        line_description="BLI with Procurement Shop",
        agreement_id=1,
        can_id=test_can.id,
        amount=75000.00,
        status=BudgetLineItemStatus.DRAFT,
        procurement_shop_fee_id=procurement_shop_fee.id,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    try:
        # Verify the procurement shop was set
        retrieved_bli = loaded_db.get(ContractBudgetLineItem, bli.id)
        assert retrieved_bli.procurement_shop_fee_id == procurement_shop_fee.id
    finally:
        # Clean up
        loaded_db.delete(bli)
        loaded_db.commit()


def test_get_procurement_shop_fees_for_budget_line_items(auth_client, app_ctx):
    """Test budget lines items contain procurement shop fee information"""
    response = auth_client.get(
        url_for("api.budget-line-items-group"),
        query_string={"limit": 50, "offset": 0, "agreement_id": 7},
    )
    assert response.status_code == 200
    data = response.json
    # assert that in this list there is at least 1 budget line with a procurement shop fee
    assert any(
        bli["procurement_shop_fee"] is not None and bli["procurement_shop_fee"]["id"] in [1, 2, 3, 4] for bli in data
    )  # assert that in this list there is at least 1 budget line with a procurement shop fee with a fee of 0, 0.5, and 4.8
    assert any(
        bli["procurement_shop_fee"] is not None and bli["procurement_shop_fee"]["fee"] in [0, 0.5, 4.8] for bli in data
    )
