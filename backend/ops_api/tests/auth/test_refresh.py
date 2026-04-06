# flake8: noqa: S105, S106
import datetime
from datetime import timedelta

import pytest
from flask import url_for
from flask_jwt_extended import create_refresh_token
from sqlalchemy import select, text

from models import User, UserSession
from ops_api.ops.auth.utils import get_latest_user_session


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


@pytest.mark.skip(reason="""
This test should only be run manually as it is dependent on timing and the JWT token expiration.
""")
def test_refresh_token(app, client, loaded_db, mocker):
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=30)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=10)
    login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert login_response.status_code == 200
    access_token = login_response.json["access_token"]
    refresh_token = login_response.json["refresh_token"]

    response = client.get(
        url_for("api.agreements-group"),
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    assert response.json is not None

    # wait 1 minute for the access token to expire
    import time

    time.sleep(60)
    response = client.get(
        url_for("api.agreements-group"),
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 401

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200
    assert response.json is not None
    assert "access_token" in response.json
    access_token = response.json["access_token"]

    response = client.get(
        url_for("api.agreements-group"),
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    assert response.json is not None


def test_refresh_token_active_session(app, client, db_with_active_user_session, mocker):
    """
    Test that the refresh token works with an active session when the access token not expired.

    /refresh should return the current access token since it is not expired.
    """
    m1 = mocker.patch("ops_api.ops.auth.service.is_token_expired")
    m1.return_value = False

    user = (
        db_with_active_user_session.execute(select(User).where(User.email == "user.demo@email.com"))  # noqa
        .scalars()
        .one_or_none()
    )
    refresh_token = create_refresh_token(
        identity=user,
        expires_delta=app.config.get("JWT_REFRESH_TOKEN_EXPIRES"),
    )

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200

    latest_user_session = get_latest_user_session(user.id, db_with_active_user_session)

    assert latest_user_session.access_token == response.json["access_token"]


def test_refresh_token_active_session_expired(app, client, db_with_active_user_session, mocker):
    """
    Test that the refresh token works with an active session when the access token is expired.

    /refresh should generate a new access token and replace in current session.
    """
    m1 = mocker.patch("ops_api.ops.auth.service.is_token_expired")
    m1.return_value = True

    user = (
        db_with_active_user_session.execute(select(User).where(User.email == "user.demo@email.com"))  # noqa
        .scalars()
        .one_or_none()
    )
    refresh_token = create_refresh_token(
        identity=user,
        expires_delta=app.config.get("JWT_REFRESH_TOKEN_EXPIRES"),
    )

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200

    latest_user_session = get_latest_user_session(user.id, db_with_active_user_session)

    assert latest_user_session.access_token == response.json["access_token"]
    assert latest_user_session.access_token != "6526adb0e0777586804035802f48d8"  # old access token should be replaced
