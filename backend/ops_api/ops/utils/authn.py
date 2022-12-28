import time
from typing import Optional
import uuid

from authlib.integrations.flask_client import OAuth
from authlib.jose import jwt
from flask import current_app
from flask_jwt_extended import JWTManager
from ops.models.users import User

jwtMgr = JWTManager()
oauth = OAuth()


@jwtMgr.user_identity_loader
def user_identity_lookup(user: User) -> str:
    return user.username


@jwtMgr.user_lookup_loader
def user_lookup_callback(_jwt_header: dict, jwt_data: dict) -> Optional[User]:
    identity = jwt_data["sub"]
    return User.query.filter_by(id=identity).one_or_none()


def get_jwt(key: Optional[str] = None) -> str:
    """Used to get a  JWT from another source, specifically a 3rd party login service (Oauth)

    Args:
        key (Optional[str], optional): Private Key used to encrypt the JWT. Defaults to None.

    Raises:
        NotImplementedError: If no key is provided, or found within the app config,
        then a Not Implemented Error is thrown

    Returns:
        jws: Returns the loaded, and encrypted JWT values.
    """
    jwt_private_key = current_app.config.get("JWT_PRIVATE_KEY") or key
    if not jwt_private_key:
        raise NotImplementedError

    client_id = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"]["client_id"]
    payload = {
        "iss": client_id,
        "sub": client_id,
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    header = {"alg": "RS256"}
    jws = jwt.encode(header, payload, jwt_private_key)

    return jws
