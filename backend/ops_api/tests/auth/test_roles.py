import datetime

from flask import url_for
from sqlalchemy import select, text

from models import BudgetLineItemStatus, ContractBudgetLineItem, Role

NEW_PERMISSIONS = [
    "PUT_BUDGET_LINE_ITEM",
    "PATCH_BUDGET_LINE_ITEM",
    "POST_BUDGET_LINE_ITEM",
    "DELETE_BUDGET_LINE_ITEM",
    "PUT_SERVICES_COMPONENT",
    "PATCH_SERVICES_COMPONENT",
    "POST_SERVICES_COMPONENT",
    "DELETE_SERVICES_COMPONENT",
]

UPGRADE_SQL = text(
    """
    UPDATE ops.role
    SET permissions = array_append(permissions, :perm)
    WHERE name = 'REVIEWER_APPROVER'
      AND NOT (:perm = ANY(permissions))
    """
)

DOWNGRADE_SQL = text(
    """
    UPDATE ops.role
    SET permissions = array_remove(permissions, :perm)
    WHERE name = 'REVIEWER_APPROVER'
    """
)


def test_get_roles(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get"))
    assert response.status_code == 200

    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json
    assert {"id": 2, "name": "VIEWER_EDITOR", "is_superuser": False} in response.json
    assert {
        "id": 3,
        "name": "REVIEWER_APPROVER",
        "is_superuser": False,
    } in response.json
    assert {"id": 4, "name": "USER_ADMIN", "is_superuser": False} in response.json
    assert {"id": 5, "name": "BUDGET_TEAM", "is_superuser": False} in response.json
    assert {"id": 6, "name": "PROCUREMENT_TEAM", "is_superuser": False} in response.json
    assert {"id": 7, "name": "SUPER_USER", "is_superuser": True} in response.json


def test_get_roles_with_filter_by_id(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", id=1))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json


def test_get_roles_with_filter_by_name(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", name="SYSTEM_OWNER"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json


def test_get_roles_with_filter_by_id_and_name(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", id=1, name="SYSTEM_OWNER"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert {"id": 1, "name": "SYSTEM_OWNER", "is_superuser": False} in response.json


def test_get_roles_with_filter_none_found(auth_client, app_ctx):
    response = auth_client.get(url_for("auth.roles_get", id=3, name="user"))
    assert response.status_code == 200
    assert len(response.json) == 0


def test_reviewer_approver_has_budget_line_item_permissions(loaded_db):
    role = loaded_db.execute(select(Role).where(Role.name == "REVIEWER_APPROVER")).scalar_one()
    expected_bli_perms = {
        "GET_BUDGET_LINE_ITEM",
        "PUT_BUDGET_LINE_ITEM",
        "PATCH_BUDGET_LINE_ITEM",
        "POST_BUDGET_LINE_ITEM",
        "DELETE_BUDGET_LINE_ITEM",
    }
    assert expected_bli_perms.issubset(set(role.permissions))


def test_reviewer_approver_has_services_component_permissions(loaded_db):
    role = loaded_db.execute(select(Role).where(Role.name == "REVIEWER_APPROVER")).scalar_one()
    expected_sc_perms = {
        "GET_SERVICES_COMPONENT",
        "PUT_SERVICES_COMPONENT",
        "PATCH_SERVICES_COMPONENT",
        "POST_SERVICES_COMPONENT",
        "DELETE_SERVICES_COMPONENT",
    }
    assert expected_sc_perms.issubset(set(role.permissions))


def test_reviewer_approver_permissions_match_viewer_editor_for_bli_and_sc(loaded_db):
    reviewer = loaded_db.execute(select(Role).where(Role.name == "REVIEWER_APPROVER")).scalar_one()
    editor = loaded_db.execute(select(Role).where(Role.name == "VIEWER_EDITOR")).scalar_one()

    reviewer_perms = set(reviewer.permissions)
    editor_perms = set(editor.permissions)

    editor_bli_perms = {p for p in editor_perms if "BUDGET_LINE_ITEM" in p}
    editor_sc_perms = {p for p in editor_perms if "SERVICES_COMPONENT" in p}

    reviewer_bli_perms = {p for p in reviewer_perms if "BUDGET_LINE_ITEM" in p}
    reviewer_sc_perms = {p for p in reviewer_perms if "SERVICES_COMPONENT" in p}

    assert editor_bli_perms == reviewer_bli_perms
    assert editor_sc_perms == reviewer_sc_perms


def test_reviewer_approver_can_get_budget_line_items(division_6_director_auth_client, app_ctx):
    response = division_6_director_auth_client.get("/api/v1/budget-line-items/")
    assert response.status_code == 200


def test_reviewer_approver_can_patch_budget_line_item(
    division_6_director_auth_client, loaded_db, test_can, app_ctx
):
    bli = ContractBudgetLineItem(
        line_description="Reviewer Test BLI",
        comments="test",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.00,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        created_by=525,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    data = {"line_description": "Updated by Reviewer"}
    response = division_6_director_auth_client.patch(
        url_for("api.budget-line-items-item", id=bli.id), json=data
    )
    assert response.status_code == 200
    assert response.json["line_description"] == "Updated by Reviewer"

    loaded_db.delete(bli)
    loaded_db.commit()


def test_reviewer_approver_can_post_budget_line_item(
    division_6_director_auth_client, loaded_db, test_can, app_ctx
):
    data = {
        "line_description": "New BLI by Reviewer",
        "comments": "test",
        "agreement_id": 1,
        "can_id": test_can.id,
        "amount": 50.00,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
    }
    response = division_6_director_auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 201

    bli_id = response.json["id"]
    bli = loaded_db.get(ContractBudgetLineItem, bli_id)
    loaded_db.delete(bli)
    loaded_db.commit()


def test_reviewer_approver_can_delete_budget_line_item(
    division_6_director_auth_client, loaded_db, test_can, app_ctx
):
    bli = ContractBudgetLineItem(
        line_description="BLI to delete",
        comments="test",
        agreement_id=1,
        can_id=test_can.id,
        amount=100.00,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 1, 1),
        created_by=525,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    response = division_6_director_auth_client.delete(
        url_for("api.budget-line-items-item", id=bli.id)
    )
    assert response.status_code == 200


def test_reviewer_approver_can_get_services_components(division_6_director_auth_client, app_ctx):
    response = division_6_director_auth_client.get("/api/v1/services-components/")
    assert response.status_code == 200


def test_migration_upgrade_adds_missing_permissions(loaded_db):
    """Simulate pre-migration state by removing permissions, then verify upgrade adds them."""
    # Remove the new permissions to simulate pre-migration state
    for perm in NEW_PERMISSIONS:
        loaded_db.execute(DOWNGRADE_SQL, {"perm": perm})
    loaded_db.commit()

    role = loaded_db.execute(select(Role).where(Role.name == "REVIEWER_APPROVER")).scalar_one()
    loaded_db.refresh(role)
    for perm in NEW_PERMISSIONS:
        assert perm not in role.permissions

    # Run upgrade SQL
    for perm in NEW_PERMISSIONS:
        loaded_db.execute(UPGRADE_SQL, {"perm": perm})
    loaded_db.commit()

    loaded_db.refresh(role)
    for perm in NEW_PERMISSIONS:
        assert perm in role.permissions


def test_migration_upgrade_is_idempotent(loaded_db):
    """Verify running upgrade when permissions already exist is a no-op."""
    role = loaded_db.execute(select(Role).where(Role.name == "REVIEWER_APPROVER")).scalar_one()
    perms_before = list(role.permissions)

    # Run upgrade again — permissions already exist from JSON5 seed data
    for perm in NEW_PERMISSIONS:
        loaded_db.execute(UPGRADE_SQL, {"perm": perm})
    loaded_db.commit()

    loaded_db.refresh(role)
    assert role.permissions == perms_before


def test_migration_downgrade_removes_permissions(loaded_db):
    """Verify downgrade removes the added permissions."""
    role = loaded_db.execute(select(Role).where(Role.name == "REVIEWER_APPROVER")).scalar_one()
    for perm in NEW_PERMISSIONS:
        assert perm in role.permissions

    # Run downgrade SQL
    for perm in NEW_PERMISSIONS:
        loaded_db.execute(DOWNGRADE_SQL, {"perm": perm})
    loaded_db.commit()

    loaded_db.refresh(role)
    for perm in NEW_PERMISSIONS:
        assert perm not in role.permissions

    # Restore for other tests
    for perm in NEW_PERMISSIONS:
        loaded_db.execute(UPGRADE_SQL, {"perm": perm})
    loaded_db.commit()
