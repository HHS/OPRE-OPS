from data_tools.src.disable_users.queries import get_active_user_admins
from models import Role, User, UserStatus


def test_get_active_user_admins_returns_only_active_user_admins(loaded_db):
    admin_role = Role(name="USER_ADMIN")
    other_role = Role(name="BUDGET_TEAM")
    active_admin = User(
        email="active.admin@example.gov",
        first_name="Active",
        last_name="Admin",
        status=UserStatus.ACTIVE,
        roles=[admin_role],
    )
    inactive_admin = User(
        email="inactive.admin@example.gov",
        first_name="Inactive",
        last_name="Admin",
        status=UserStatus.INACTIVE,
        roles=[admin_role],
    )
    locked_admin = User(
        email="locked.admin@example.gov",
        first_name="Locked",
        last_name="Admin",
        status=UserStatus.LOCKED,
        roles=[admin_role],
    )
    active_non_admin = User(
        email="active.user@example.gov",
        first_name="Active",
        last_name="User",
        status=UserStatus.ACTIVE,
        roles=[other_role],
    )
    loaded_db.add_all(
        [
            admin_role,
            other_role,
            active_admin,
            inactive_admin,
            locked_admin,
            active_non_admin,
        ]
    )
    loaded_db.commit()

    result_emails = {user.email for user in get_active_user_admins(loaded_db)}

    assert result_emails == {"active.admin@example.gov"}
