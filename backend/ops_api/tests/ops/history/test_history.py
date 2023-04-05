import pytest
from models import BudgetLineItem, BudgetLineItemStatus, OpsDBHistory, OpsDBHistoryType
from sqlalchemy import select
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
