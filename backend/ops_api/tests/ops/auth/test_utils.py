from ops.auth.utils import get_jwt
import pytest


@pytest.mark.skip(reason="Need to clean up auth a bit")
def test_get_jwt_no_key(app):
    with app.test_request_context("/auth/login", method="POST", data={"code": ""}):
        jwt = get_jwt()
        assert jwt is not None
        assert len(str(jwt)) == 738
