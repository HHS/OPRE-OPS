from sqlalchemy import select, text

from models import UserSession
from models.users import User


def test_login_with_no_active_session(client, loaded_db, mocker):
    # setup mocks
    m2 = mocker.patch("ops_api.ops.auth.service._get_token_and_user_data_from_internal_auth")
    user = loaded_db.get(User, 1)
    m2.return_value = ("blah", "blah", user)

    res = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert res.status_code == 200

    stmt = select(UserSession).where(UserSession.user_id == user.id)
    # get all results from stmt
    user_sessions = loaded_db.execute(stmt).scalars().all()
    assert len(user_sessions) == 1

    # cleanup
    loaded_db.execute(text("DELETE FROM user_session"))
    loaded_db.commit()
