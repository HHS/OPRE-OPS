import time
import uuid

from authlib.integrations.flask_client import OAuth

# from authlib.integrations.requests_client import OAuth2Session
from authlib.jose import jwt
from flask_jwt_extended import JWTManager
from ops.default_settings import AUTHLIB_OAUTH_CLIENTS, JWT_PRIVATE_KEY
from ops.user.models import User

jwtMgr = JWTManager()
oauth = OAuth()


@jwtMgr.user_identity_loader
def user_identity_lookup(user):
    return user.username


@jwtMgr.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(id=identity).one_or_none()


def get_jwt(key=JWT_PRIVATE_KEY):
    if not key:
        raise NotImplementedError

    client_id = AUTHLIB_OAUTH_CLIENTS["logingov"]["client_id"]
    payload = {
        "iss": client_id,
        "sub": client_id,
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    header = {"alg": "RS256"}
    jws = jwt.encode(header, payload, key)

    return jws
