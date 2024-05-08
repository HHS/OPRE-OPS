from datetime import timedelta

import pytest
from flask import url_for
from sqlalchemy import select

from models import UserSession
from ops_api.ops.auth.utils import is_token_expired


@pytest.mark.skip(
    reason="""
This test should only be run manually as it is dependent on timing and the JWT token expiration.
"""
)
def test_refresh_token(app, client, loaded_db, mocker):
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=30)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=10)
    login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert login_response.status_code == 200
    access_token = login_response.json["access_token"]
    refresh_token = login_response.json["refresh_token"]

    response = client.get(url_for("api.agreements-group"), headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json is not None

    # wait 1 minute for the access token to expire
    import time

    time.sleep(60)
    response = client.get(url_for("api.agreements-group"), headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 401

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200
    assert response.json is not None
    assert "access_token" in response.json
    access_token = response.json["access_token"]

    response = client.get(url_for("api.agreements-group"), headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json is not None


def test_refresh_token_active_session(app, client, loaded_db, mocker):
    """
    Test that the refresh token works with an active session when the access token not expired.

    /refresh should return the current access token since it is not expired.
    """
    login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert login_response.status_code == 200

    access_token = login_response.json["access_token"]
    refresh_token = login_response.json["refresh_token"]

    stmt = select(UserSession).where(UserSession.user_id == 21)
    user_sessions = loaded_db.execute(stmt).scalars().all()

    assert len(user_sessions) == 1
    assert user_sessions[0].is_active is True
    assert user_sessions[0].access_token == access_token
    assert user_sessions[0].refresh_token == refresh_token

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200
    assert access_token == response.json["access_token"]

    stmt = select(UserSession).where(UserSession.user_id == 21)
    user_sessions = loaded_db.execute(stmt).scalars().all()

    assert len(user_sessions) == 1
    assert user_sessions[0].is_active is True
    assert user_sessions[0].access_token == access_token
    assert user_sessions[0].refresh_token == refresh_token

    # cleanup
    loaded_db.delete(user_sessions[0])
    loaded_db.commit()


def test_refresh_token_active_session_expired(app, client, loaded_db, mocker):
    """
    Test that the refresh token works with an active session when the access token is expired.

    /refresh should generate a new access token and replace in current session.
    """
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=0.5)
    login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert login_response.status_code == 200

    access_token = login_response.json["access_token"]
    refresh_token = login_response.json["refresh_token"]

    stmt = select(UserSession).where(UserSession.user_id == 21)
    user_sessions = loaded_db.execute(stmt).scalars().all()

    assert len(user_sessions) == 1
    assert user_sessions[0].is_active is True
    assert user_sessions[0].access_token == access_token
    assert user_sessions[0].refresh_token == refresh_token

    # wait for the access token to expire
    import time

    time.sleep(1)

    assert is_token_expired(access_token, app.config["JWT_PRIVATE_KEY"])

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200
    assert access_token != response.json["access_token"]

    stmt = select(UserSession).where(UserSession.user_id == 21).order_by(UserSession.id.desc())
    user_sessions = loaded_db.execute(stmt).scalars().all()

    assert len(user_sessions) == 1
    assert user_sessions[0].is_active is True
    assert user_sessions[0].access_token == response.json["access_token"]
    assert user_sessions[0].refresh_token == refresh_token

    # cleanup
    loaded_db.delete(user_sessions[0])
    loaded_db.commit()
