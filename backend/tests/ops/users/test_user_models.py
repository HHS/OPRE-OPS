from ops_api.ops.users.models import User

def test_user_is_admin(db, user_factory):
    user: User = user_factory.create()
    print(user.username)
    assert True