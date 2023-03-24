import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import Encoding, NoEncryption, PrivateFormat
from models.events import OpsEvent, OpsEventStatus, OpsEventType
from ops_api.ops.utils.auth import create_oauth_jwt
from sqlalchemy import select


def test_auth_post_fails(client):
    data = {"code": "abc1234"}

    res = client.post("/api/v1/auth/login/", json=data)
    assert res.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_get_jwt_not_none(app):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    encoded = key.private_bytes(Encoding.PEM, PrivateFormat.TraditionalOpenSSL, NoEncryption())
    with app.test_request_context("/auth/login", method="POST", data={"code": ""}):
        assert create_oauth_jwt(encoded) is not None


def test_auth_post_fails_creates_event(client, loaded_db):
    data = {"code": "abc1234"}

    res = client.post("/api/v1/auth/login/", json=data)
    assert res.status_code == 400

    stmt = select(OpsEvent).where(OpsEvent.event_status == OpsEventStatus.FAILED)
    event = loaded_db.session.scalar(stmt)
    assert "Code is invalid" in event.event_details["error_message"]
    assert "<class 'authlib.integrations.base_client.errors.OAuthError'>" == event.event_details["error_type"]
    assert data == event.event_details["request.json"]
    # cleanup
    loaded_db.session.delete(event)
    loaded_db.session.commit()


def test_auth_post_succeeds_creates_event(client, loaded_db, mocker):
    # setup mocks
    m1 = mocker.patch("ops_api.ops.utils.auth_views._get_token_and_user_data_from_oauth_provider")
    m1.return_value = ({"access_token": "blah"}, {})
    m2 = mocker.patch("ops_api.ops.utils.auth_views._get_token_and_user_data_from_internal_auth")
    user = mocker.MagicMock()
    user.to_dict.return_value = {}
    m2.return_value = ("blah", "blah", user)

    # test
    res = client.post("/api/v1/auth/login/", json={})
    assert res.status_code == 200

    stmt = select(OpsEvent).where(OpsEvent.event_status == OpsEventStatus.SUCCESS)
    event = loaded_db.session.scalar(stmt)
    assert event.event_type == OpsEventType.LOGIN_ATTEMPT
    assert event.event_status == OpsEventStatus.SUCCESS
    assert event.event_details["access_token"] == "blah"

    # cleanup
    loaded_db.session.delete(event)
    loaded_db.session.commit()
