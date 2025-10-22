import uuid

from models import Role, User, UserStatus
from sqlalchemy import select

from ops_api.ops.utils.users import is_super_user


def test_is_super_user(app):
    session = app.db_session

    super_user = User(
        oidc_id=uuid.uuid4(),
        email="superuser@example.com",
        status=UserStatus.ACTIVE,
        roles=[session.scalar(select(Role).where(Role.name == "SUPER_USER"))],
    )
    session.add(super_user)
    session.commit()

    retrieved_super_user = is_super_user(super_user, app)
    assert retrieved_super_user is True

    normal_user = User(
        oidc_id=uuid.uuid4(),
        email="normaluser@example.com",
        status=UserStatus.ACTIVE,
        roles=[session.scalar(select(Role).where(Role.name == "VIEWER_EDITOR"))],
    )
    session.add(normal_user)
    session.commit()

    retrieved_normal_user = is_super_user(normal_user, app)
    assert retrieved_normal_user is False

    # clean up
    session.delete(super_user)
    session.delete(normal_user)
    session.commit()
