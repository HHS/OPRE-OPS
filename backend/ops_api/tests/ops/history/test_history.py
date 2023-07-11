import pytest
from models import BudgetLineItem, BudgetLineItemStatus, OpsDBHistory, OpsDBHistoryType
from sqlalchemy import select, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


@pytest.mark.usefixtures("app_ctx")
def test_bli_history(loaded_db: Session):
    bli = BudgetLineItem(
        line_description="Grant Expendeture GA999",
        agreement_id=1,
        can_id=1,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(OpsDBHistory.event_type == OpsDBHistoryType.NEW)
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "Grant Expendeture GA999"

    bli.line_description = "(UPDATED) Grant Expendeture GA999"
    loaded_db.add(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(OpsDBHistory.event_type == OpsDBHistoryType.UPDATED)
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "(UPDATED) Grant Expendeture GA999"

    loaded_db.delete(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(OpsDBHistory.event_type == OpsDBHistoryType.DELETED)
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "(UPDATED) Grant Expendeture GA999"


@pytest.mark.usefixtures("app_ctx")
def test_history_enhanced(loaded_db: Session):
    """test the new columns for class_name, row_key to query for history of specific record
    and verify the new original and diff columns contain the values before and the changes
    """
    bli = BudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=1,
        can_id=1,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    row_key = str(bli.id)
    class_name = bli.__class__.__name__

    stmt = select(OpsDBHistory).where(
        and_(
            OpsDBHistory.class_name == class_name,
            OpsDBHistory.row_key == row_key,
            OpsDBHistory.event_type == OpsDBHistoryType.NEW,
        )
    )
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "Grant Expenditure GA999"
    assert "line_description" not in result[0].original
    assert result[0].diff["line_description"] == "Grant Expenditure GA999"

    bli.line_description = "(UPDATED) Grant Expenditure GA999"
    loaded_db.add(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(
        and_(
            OpsDBHistory.class_name == class_name,
            OpsDBHistory.row_key == row_key,
            OpsDBHistory.event_type == OpsDBHistoryType.UPDATED,
        )
    )
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "(UPDATED) Grant Expenditure GA999"
    assert result[0].original["line_description"] == "Grant Expenditure GA999"
    assert result[0].diff["line_description"] == "(UPDATED) Grant Expenditure GA999"
    assert "status" in result[0].original
    assert "status" not in result[0].diff

    loaded_db.delete(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(
        and_(
            OpsDBHistory.class_name == class_name,
            OpsDBHistory.row_key == row_key,
            OpsDBHistory.event_type == OpsDBHistoryType.DELETED,
        )
    )
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "(UPDATED) Grant Expenditure GA999"
    assert result[0].original["line_description"] == "(UPDATED) Grant Expenditure GA999"
    assert len(result[0].diff) == 0


@pytest.mark.usefixtures("app_ctx")
def test_bli_history_force_an_error(loaded_db):
    bli = BudgetLineItem(
        line_description="Grant Expendeture GA999",
        agreement_id=1000000,
        can_id=1,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )

    with pytest.raises(IntegrityError):
        loaded_db.add(bli)
        loaded_db.commit()

        stmt = select(OpsDBHistory).where(OpsDBHistory.event_type == OpsDBHistoryType.ERROR)
        result = loaded_db.scalars(stmt).all()
        assert result[0].event_details["agreement_id"] == 1000000
