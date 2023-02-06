import time
from typing import Optional
import uuid

from authlib.integrations.flask_client import OAuth
from authlib.jose import jwt as jose_jwt
from flask import current_app
from flask_jwt_extended import JWTManager
from ops.models.users import User

jwtMgr = JWTManager()
oauth = OAuth()


@jwtMgr.user_identity_loader
def user_identity_lookup(user: User) -> str:
    return user.oidc_id


@jwtMgr.user_lookup_loader
def user_lookup_callback(_jwt_header: dict, jwt_data: dict) -> Optional[User]:
    identity = jwt_data["sub"]
    return User.query.filter_by(id=identity).one_or_none()


def get_jwt(key: Optional[str] = None, header: Optional[str] = None, payload: Optional[str] = None) -> str:
    """
    Returns an Access Token JWS from the configured OAuth Client
    :param key: OPTIONAL - Private Key used for encoding the JWS
    :param header: OPTIONAL - JWS Header containing algorithm type
    :param payload: OPTIONAL - Contains the JWS payload
    :return: JsonWebSignature
    """
    jwt_private_key = key or current_app.config.get("JWT_PRIVATE_KEY")
    if not jwt_private_key:
        raise NotImplementedError

    client_id = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"]["client_id"]
    _payload = payload or {
        "iss": client_id,
        "sub": client_id,
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    header = header or {"alg": "RS256"}
    jws = jose_jwt.encode(header, _payload, jwt_private_key)
    return jws
