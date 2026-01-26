# flake8: noqa: S105, S106
import datetime
import uuid

import pytest
from sqlalchemy import select, text

from models import User, UserSession
from ops_api.ops.auth.utils import create_oauth_jwt


@pytest.fixture()
def db_with_active_user_session(loaded_db, test_user):
    user = loaded_db.execute(select(User).where(User.email == "user.demo@email.com")).scalars().one_or_none()
    active_user_session_1 = UserSession(
        user_id=user.id,
        is_active=True,
        ip_address="26.13.164.12",
        access_token="6526adb0e0777586804035802f48d8",
        refresh_token="14b0c1c59859cf1a7cca71af11283c",
        last_active_at=datetime.datetime(2021, 10, 1, 0),
        created_on=datetime.datetime(2021, 10, 1, 0),
    )

    active_user_session_2 = UserSession(
        user_id=user.id,
        is_active=True,
        ip_address="26.13.164.12",
        access_token="11b022d9393fde833971b768b0912b",
        refresh_token="7227b10ebb7bf9ac3f5996f195ed99",
        last_active_at=datetime.datetime(2021, 9, 1, 0),
        created_on=datetime.datetime(2021, 9, 1, 0),
    )

    active_user_session_3 = UserSession(
        user_id=user.id,
        is_active=False,
        ip_address="26.13.164.12",
        access_token="df16a2a9f6662ba1f42d310c89f0a8",
        refresh_token="6ed846b542097f55e52c0326188ff2",
        last_active_at=datetime.datetime(2021, 8, 1, 0),
        created_on=datetime.datetime(2021, 8, 1, 0),
    )

    active_user_session_4 = UserSession(
        user_id=test_user.id,
        is_active=True,
        ip_address="31.202.194.117",
        access_token="4c17b37e698f579c79c8d70000451b",
        refresh_token="50240dcd320589d0dd029414bf622c",
        last_active_at=datetime.datetime(2021, 11, 1, 0),
        created_on=datetime.datetime(2021, 11, 1, 0),
    )

    loaded_db.add(active_user_session_1)
    loaded_db.add(active_user_session_2)
    loaded_db.add(active_user_session_3)
    loaded_db.add(active_user_session_4)
    loaded_db.commit()
    yield loaded_db

    loaded_db.execute(text("DELETE FROM user_session"))
    loaded_db.commit()


def test_logout(app, client, db_with_active_user_session, app_ctx):
    jwt = create_oauth_jwt(
        "fakeauth",
        app.config,
        payload={
            "sub": "00000000-0000-1111-a111-000000000019",
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=1),
            "iss": app.config["AUTHLIB_OAUTH_CLIENTS"]["fakeauth"]["client_id"],
            "aud": app.config["AUTHLIB_OAUTH_CLIENTS"]["fakeauth"]["aud"],
            "jti": str(uuid.uuid4()),
            "sso": "fakeauth",
        },
    )

    res = client.post("/auth/logout/", headers={"Authorization": f"Bearer {jwt.decode('utf-8')}"})
    assert res.status_code == 200
    assert res.json["message"] == "User: user.demo@email.com Logged out"

    user = (
        db_with_active_user_session.execute(select(User).where(User.email == "user.demo@email.com"))
        .scalars()
        .one_or_none()
    )
    stmt = select(UserSession).where(UserSession.user_id == user.id)
    user_sessions = db_with_active_user_session.execute(stmt).scalars().all()
    assert len(user_sessions) == 3
    assert not user_sessions[0].is_active
    assert not user_sessions[1].is_active
    assert not user_sessions[2].is_active

    # cleanup
    db_with_active_user_session.execute(text("DELETE FROM user_session"))
    db_with_active_user_session.commit()
