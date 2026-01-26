# flake8: noqa B908
import pytest
from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import (
    CAN,
    BudgetLineItemStatus,
    GrantBudgetLineItem,
    OpsDBHistory,
    OpsDBHistoryType,
)


def test_bli_history(loaded_db: Session, test_can: CAN, app_ctx):
    bli = GrantBudgetLineItem(
        line_description="Grant Expendeture GA999",
        agreement_id=1,
        can_id=test_can.id,
        amount=850450.00,
        status=BudgetLineItemStatus.PLANNED,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(
        and_(OpsDBHistory.event_type == OpsDBHistoryType.NEW),
        OpsDBHistory.class_name == "GrantBudgetLineItem",  # type: ignore
    )
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "Grant Expendeture GA999"

    bli.line_description = "(UPDATED) Grant Expendeture GA999"
    loaded_db.add(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(
        and_(OpsDBHistory.event_type == OpsDBHistoryType.UPDATED),
        OpsDBHistory.class_name == "GrantBudgetLineItem",  # type: ignore
    )
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "(UPDATED) Grant Expendeture GA999"

    loaded_db.delete(bli)
    loaded_db.commit()

    stmt = select(OpsDBHistory).where(
        and_(OpsDBHistory.event_type == OpsDBHistoryType.DELETED),
        OpsDBHistory.class_name == "GrantBudgetLineItem",  # type: ignore
    )
    result = loaded_db.scalars(stmt).all()
    assert result[0].event_details["line_description"] == "(UPDATED) Grant Expendeture GA999"


def test_bli_history_force_an_error(loaded_db, app_ctx):
    bli = GrantBudgetLineItem(
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


def test_history_expanded(loaded_db: Session, test_can: CAN, app_ctx):
    """test the new columns for class_name, row_key to query for history of specific record
    and verify the new changes column contains the changes
    """
    bli = GrantBudgetLineItem(
        line_description="Grant Expenditure GA999",
        agreement_id=1,
        can_id=test_can.id,
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


def test_history_expanded_with_web_client(auth_client, loaded_db, test_user, test_admin_user, app_ctx):
    """test history with new columns with edits made using an authenticated web client"""
    # POST: create agreement
    post_data = {
        "agreement_type": "CONTRACT",
        "agreement_reason": "NEW_REQ",
        "name": "Contract123",
        "description": "History Test Description",
        "product_service_code_id": 1,
        "project_officer_id": test_user.id,
        "team_members": [
            {
                "id": 502,
            },
            {
                "id": 504,
            },
        ],
    }
    resp = auth_client.post("/api/v1/agreements/", json=post_data)
    assert resp.status_code == 201
    assert "id" in resp.json
    agreement_id = resp.json["id"]

    stmt = select(OpsDBHistory).where(
        and_(
            OpsDBHistory.class_name == "ContractAgreement",
            OpsDBHistory.row_key == str(agreement_id),
            OpsDBHistory.event_type == OpsDBHistoryType.NEW,
        )
    )
    result = loaded_db.scalars(stmt).first()
    assert result.created_by == test_admin_user.id
    assert result.event_details["description"] == post_data["description"]
    assert "description" in result.changes
    assert "new" in result.changes["description"]
    assert result.changes["description"]["new"] == post_data["description"]
    assert "old" not in result.changes["description"]
    assert "notes" not in result.changes
    assert "team_members" in result.changes
    assert len(result.changes["team_members"]["added"]) == 2
    assert "deleted" not in result.changes["team_members"]
    assert "support_contacts" not in result.changes
    assert "vendor_id" not in result.changes

    # PATCH: edit agreement
    patch_data = {
        "description": "Updated Test Description",
        "notes": "Test Notes",
        "team_members": [
            {
                "id": 501,
            },
            {
                "id": 502,
            },
            {
                "id": 503,
            },
        ],
    }
    resp = auth_client.patch(f"/api/v1/agreements/{agreement_id}", json=patch_data)
    assert resp.status_code == 200

    stmt = select(OpsDBHistory).where(
        and_(
            OpsDBHistory.class_name == "ContractAgreement",
            OpsDBHistory.row_key == str(agreement_id),
            OpsDBHistory.event_type == OpsDBHistoryType.UPDATED,
        )
    )
    result = loaded_db.scalars(stmt).first()
    assert result.created_by == test_admin_user.id
    assert result.event_details["description"] == patch_data["description"]
    assert result.event_details["notes"] == patch_data["notes"]
    assert "description" in result.changes
    assert "new" in result.changes["description"]
    assert result.changes["description"]["new"] == patch_data["description"]
    assert "old" in result.changes["description"]
    assert result.changes["description"]["old"] == post_data["description"]
    assert "notes" in result.changes
    assert "new" in result.changes["notes"]
    assert result.changes["notes"]["new"] == patch_data["notes"]
    assert "old" in result.changes["notes"]
    assert result.changes["notes"]["old"] == ""
    assert "team_members" in result.changes
    assert len(result.changes["team_members"]["added"]) == 2
    assert len(result.changes["team_members"]["deleted"]) == 1
    assert "support_contacts" not in result.changes
    assert "vendor_id" not in result.changes

    # DELETE: delete agreement
    resp = auth_client.delete(f"/api/v1/agreements/{agreement_id}")
    assert resp.status_code == 200

    stmt = select(OpsDBHistory).where(
        and_(
            OpsDBHistory.class_name == "ContractAgreement",
            OpsDBHistory.row_key == str(agreement_id),
            OpsDBHistory.event_type == OpsDBHistoryType.DELETED,
        )
    )
    result = loaded_db.scalars(stmt).first()
    assert result.created_by == test_admin_user.id

    assert not result.changes
