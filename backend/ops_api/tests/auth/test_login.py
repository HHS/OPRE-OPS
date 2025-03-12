# flake8: noqa: S105, S106
import datetime

import pytest
from sqlalchemy import select, text

from models import UserSession
from models.users import User


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


@pytest.fixture()
def db_with_inactive_user_session(loaded_db, test_user):
    user = loaded_db.execute(select(User).where(User.email == "user.demo@email.com")).scalars().one_or_none()
    active_user_session_1 = UserSession(
        user_id=user.id,
        is_active=False,
        ip_address="26.13.164.12",
        access_token="6526adb0e0777586804035802f48d8",
        refresh_token="14b0c1c59859cf1a7cca71af11283c",
        last_active_at=datetime.datetime(2021, 10, 1, 0),
        created_on=datetime.datetime(2021, 10, 1, 0),
    )

    active_user_session_2 = UserSession(
        user_id=user.id,
        is_active=True,
        ip_address="26.13.164.12",  # noqa
        access_token="11b022d9393fde833971b768b0912b",  # noqa
        refresh_token="7227b10ebb7bf9ac3f5996f195ed99",  # noqa
        last_active_at=datetime.datetime(2021, 9, 1, 0),
        created_on=datetime.datetime(2021, 9, 1, 0),
    )

    active_user_session_3 = UserSession(
        user_id=user.id,
        is_active=False,
        ip_address="26.13.164.12",  # noqa
        access_token="df16a2a9f6662ba1f42d310c89f0a8",  # noqa
        refresh_token="6ed846b542097f55e52c0326188ff2",  # noqa
        last_active_at=datetime.datetime(2021, 8, 1, 0),
        created_on=datetime.datetime(2021, 8, 1, 0),
    )

    active_user_session_4 = UserSession(
        user_id=test_user.id,
        is_active=True,
        ip_address="31.202.194.117",  # noqa
        access_token="4c17b37e698f579c79c8d70000451b",  # noqa
        refresh_token="50240dcd320589d0dd029414bf622c",  # noqa
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


def test_login_with_no_active_session(client, loaded_db, mocker):
    # setup mocks
    m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    user = loaded_db.execute(select(User).where(User.email == "user.demo@email.com")).scalars().one_or_none()
    m2.return_value = ("blah", "blah", user)

    res = client.post("/auth/login/", json={"provider": "fakeauth", "code": "basic_user"})
    assert res.status_code == 200

    stmt = select(UserSession).where(UserSession.user_id == user.id)
    user_sessions = loaded_db.execute(stmt).scalars().all()
    assert len(user_sessions) == 1
    assert user_sessions[0].is_active
    assert user_sessions[0].access_token == "blah"
    assert user_sessions[0].refresh_token == "blah"
    assert user_sessions[0].user_id == user.id
    assert user_sessions[0].ip_address == "127.0.0.1"
    assert user_sessions[0].last_active_at is not None

    # cleanup
    loaded_db.execute(text("DELETE FROM user_session"))
    loaded_db.commit()


def test_login_with_active_session(client, db_with_active_user_session, mocker):
    # setup mocks
    m1 = mocker.patch("ops_api.ops.auth.service.is_token_expired")
    m1.return_value = False
    m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    user = (
        db_with_active_user_session.execute(select(User).where(User.email == "user.demo@email.com"))
        .scalars()
        .one_or_none()
    )  # noqa
    m2.return_value = ("blah", "blah", user)

    res = client.post("/auth/login/", json={"provider": "fakeauth", "code": "basic_user"})
    assert res.status_code == 200

    stmt = select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_on.desc())
    user_sessions = db_with_active_user_session.execute(stmt).scalars().all()
    assert user_sessions[0].is_active
    assert user_sessions[0].access_token != "6526adb0e0777586804035802f48d8"
    assert user_sessions[0].refresh_token != "14b0c1c59859cf1a7cca71af11283c"
    assert user_sessions[0].user_id == user.id
    assert user_sessions[0].ip_address != "26.13.164.12"
    assert user_sessions[0].last_active_at != datetime.datetime(2021, 10, 1, 0)

    # cleanup
    db_with_active_user_session.execute(text("DELETE FROM user_session"))
    db_with_active_user_session.commit()


def test_login_with_inactive_session(client, db_with_inactive_user_session, mocker):
    # setup mocks
    m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    user = (
        db_with_inactive_user_session.execute(select(User).where(User.email == "user.demo@email.com"))
        .scalars()
        .one_or_none()
    )  # noqa
    m2.return_value = ("blah", "blah", user)

    res = client.post("/auth/login/", json={"provider": "fakeauth", "code": "basic_user"})
    assert res.status_code == 200

    stmt = select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_on.desc())
    user_sessions = db_with_inactive_user_session.execute(stmt).scalars().all()
    assert user_sessions[0].is_active
    assert user_sessions[0].access_token == "blah"
    assert user_sessions[0].refresh_token == "blah"
    assert user_sessions[0].user_id == user.id
    assert user_sessions[0].ip_address == "127.0.0.1"
    assert user_sessions[0].last_active_at > datetime.datetime(2024, 1, 1)

    # cleanup
    db_with_inactive_user_session.execute(text("DELETE FROM user_session"))
    db_with_inactive_user_session.commit()
