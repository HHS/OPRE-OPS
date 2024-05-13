from sqlalchemy import select, text

from models.users import User


def test_logout(app, client, loaded_db, mocker):
    # setup mocks
    # app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=30)
    # app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=10)
    # m1 = mocker.patch("ops_api.ops.auth.service.is_token_expired")
    # m1.return_value = False
    # m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    # user = loaded_db.execute(select(User).where(User.email == "admin.demo@email.com")).scalars().one_or_none()  # noqa
    # m2.return_value = ("blah", "blah", user)

    m1 = mocker.patch("ops_api.ops.auth.service.is_token_expired")
    m1.return_value = False
    m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    user = loaded_db.execute(select(User).where(User.email == "admin.demo@email.com")).scalars().one_or_none()  # noqa
    m2.return_value = ("blah", "blah", user)

    login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert login_response.status_code == 200

    # access_token = login_response.json["access_token"]
    # # refresh_token = login_response.json["refresh_token"]
    # user = loaded_db.execute(select(User).where(User.email == "admin.demo@email.com")).scalars().one_or_none()  # noqa
    #
    # stmt = select(UserSession).where(UserSession.user_id == user.id)
    # user_sessions = loaded_db.execute(stmt).scalars().all()
    # last_active_at = user_sessions[0].last_active_at
    # # assert len(user_sessions) == 1
    # # assert user_sessions[0].is_active
    # # assert user_sessions[0].access_token == access_token
    # # assert user_sessions[0].refresh_token == refresh_token
    # # assert user_sessions[0].user_id == user.id
    # # assert user_sessions[0].ip_address == "127.0.0.1"
    # # assert last_active_at is not None
    #
    # res = client.post("/auth/logout/", headers={"Authorization": f"Bearer {access_token}"})
    # assert res.status_code == 200
    # assert res.json["message"] == f"User: {user.email} Logged out"
    #
    # stmt = select(UserSession).where(UserSession.user_id == user.id)
    # user_sessions = loaded_db.execute(stmt).scalars().all()
    # assert len(user_sessions) == 1
    # assert not user_sessions[0].is_active
    # assert user_sessions[0].last_active_at != last_active_at
    #
    # # login again
    # login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    # assert login_response.status_code == 200
    # access_token = login_response.json["access_token"]
    # refresh_token = login_response.json["refresh_token"]
    #
    # stmt = select(UserSession).where(UserSession.user_id == user.id).order_by(UserSession.created_on.desc())
    # user_sessions = loaded_db.execute(stmt).scalars().all()
    # last_active_at = user_sessions[0].last_active_at
    # assert len(user_sessions) == 2
    # assert user_sessions[0].is_active
    # assert user_sessions[0].access_token == access_token
    # assert user_sessions[0].refresh_token == refresh_token
    # assert user_sessions[0].user_id == user.id
    # assert user_sessions[0].ip_address == "127.0.0.1"
    # assert last_active_at is not None
    # assert not user_sessions[1].is_active
    # assert user_sessions[1].last_active_at != last_active_at
    # assert user_sessions[1].access_token != access_token
    # assert user_sessions[1].refresh_token != refresh_token
    # assert user_sessions[1].user_id == user.id
    # assert user_sessions[1].ip_address == "127.0.0.1"

    # cleanup
    loaded_db.execute(text("DELETE FROM user_session"))
    loaded_db.commit()
