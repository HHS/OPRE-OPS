import json
import time
import uuid
from functools import wraps
from typing import Optional

import requests
from authlib.jose import JsonWebToken
from authlib.jose import jwt as jose_jwt
from flask import current_app
from marshmallow import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError
from sqlalchemy.orm import load_only

from models import Role, User
from ops_api.ops.auth.auth_types import UserInfoDict
from ops_api.ops.auth.exceptions import NotActiveUserError
from ops_api.ops.utils.response import make_response_with_headers


def handle_api_error(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except (KeyError, RuntimeError, PendingRollbackError) as er:
            current_app.logger.error(er)
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            current_app.logger.error(ve)
            return make_response_with_headers(ve.normalized_messages(), 400)
        except NotActiveUserError as e:
            current_app.logger.error(e)
            return make_response_with_headers({}, 403)
        except Exception as e:
            current_app.logger.exception(e)
            return make_response_with_headers({}, 500)

    return decorated


def create_oauth_jwt(
    provider: str,
    key: Optional[str] = None,
    header: Optional[str] = None,
    payload: Optional[str] = None,
) -> str:
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

    expire = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    current_app.logger.debug(f"expire={expire}")

    _payload = payload or {
        "iss": current_app.config["AUTHLIB_OAUTH_CLIENTS"][provider]["client_id"],
        "sub": current_app.config["AUTHLIB_OAUTH_CLIENTS"][provider]["client_id"],
        "aud": current_app.config["AUTHLIB_OAUTH_CLIENTS"][provider]["aud"],
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + expire.seconds,
        "sso": provider,
    }
    current_app.logger.debug(f"_payload={_payload}")
    _header = header or {"alg": "RS256"}
    jws = jose_jwt.encode(header=_header, payload=_payload, key=jwt_private_key)
    return jws


def get_jwks(provider_metadata_url: str):
    provider_uris = json.loads(
        requests.get(
            provider_metadata_url,
            headers={"Accept": "application/json"},
        ).content.decode("utf-8")
    )

    jwks_uri = provider_uris["jwks_uri"]
    jwks = requests.get(jwks_uri).content.decode("utf-8")
    return jwks


def decode_user(
    payload: Optional[str] = None,
    provider: Optional[str] = None,
) -> dict[str, str]:
    # TODO: Determine which claims we want to validate when decoding a user from the provider
    #       beyond just the signature. Should these be universal for any claims (global)?
    # ex: validate the JTI, validate the expiration, validate the si
    # claims_options = {
    #     "iss": {
    #         "essential": True,
    #         "values": current_app.config["AUTHLIB_OAUTH_CLIENTS"][provider]["client_id"],
    #     },
    #     "jti": {"validate": JWTClaims.validate_jti},
    #     "exp": {"validate": JWTClaims.validate_exp},
    # }
    jwt = JsonWebToken(["RS256"])
    # claims = jwt.decode(payload, get_jwks(provider), claims_options=claims_options)
    claims = jwt.decode(payload, get_jwks(provider))
    return claims


def register_user(userinfo: UserInfoDict) -> User:
    user = get_user_from_token(userinfo)
    if user:
        return user, False
    else:
        # Create new user
        # Default to an 'unassigned' role.
        current_app.logger.debug("Creating new user")
        try:
            # Find the role with the matching permission
            role = current_app.db_session.query(Role).options(load_only(Role.name)).filter_by(name="unassigned").one()
            user = User(
                email=userinfo["email"],
                oidc_id=userinfo["sub"],
                roles=[role],
            )

            current_app.db_session.add(user)
            current_app.db_session.commit()
            return user, True
        except Exception as e:
            current_app.logger.debug(f"User Creation Error: {e}")
            current_app.db_session.rollback()
            return None, False


def get_user_from_token(userinfo: UserInfoDict) -> Optional[User]:
    if userinfo is None:
        return None
    try:
        stmt = select(User).where((User.oidc_id == userinfo["sub"]))
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            return users[0][0]
    except Exception as e:
        current_app.logger.debug(f"User Lookup Error: {e}")
        return None
