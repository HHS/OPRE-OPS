from sqlalchemy import select, text

from models import UserSession
from models.users import User


def test_login_with_no_active_session(client, loaded_db, mocker):
    # setup mocks
    m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    user = loaded_db.execute(select(User).where(User.email == "admin.demo@email.com")).scalars().one_or_none()
    m2.return_value = ("blah", "blah", user)

    res = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert res.status_code == 200

    stmt = select(UserSession).where(UserSession.user_id == user.id)
    user_sessions = loaded_db.execute(stmt).scalars().all()
    assert len(user_sessions) == 1
    assert user_sessions[0].is_active
    assert user_sessions[0].access_token == "blah"
    assert user_sessions[0].refresh_token == "blah"
    assert user_sessions[0].user_id == user.id
    assert user_sessions[0].ip_address == "127.0.0.1"

    # cleanup
    loaded_db.execute(text("DELETE FROM user_session"))
    loaded_db.commit()
