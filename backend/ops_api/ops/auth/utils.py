import json
import time
import uuid
from functools import wraps
from typing import Optional
from uuid import UUID

import requests
from authlib.jose import JsonWebToken
from authlib.jose import jwt as jose_jwt
from flask import Config, current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from marshmallow import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError
from sqlalchemy.orm import load_only

from models import Role, User, UserStatus
from ops_api.ops.auth.auth_types import UserInfoDict
from ops_api.ops.auth.exceptions import NotActiveUserError, PrivateKeyError
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
    config: Config,
    key: Optional[str] = None,
    header: Optional[str] = None,
    payload: Optional[str] = None,
) -> str:
    """
    Returns an Access Token JWS from the configured OAuth Client
    :param provider: REQUIRED - The provider to use for the JWS
    :param config: REQUIRED - The configuration object for the application
    :param key: OPTIONAL - Private Key used for encoding the JWS
    :param header: OPTIONAL - JWS Header containing algorithm type
    :param payload: OPTIONAL - Contains the JWS payload
    :return: JsonWebSignature
    """
    jwt_private_key = key or config.get("JWT_PRIVATE_KEY")
    if not jwt_private_key:
        raise PrivateKeyError("Private Key not found in the configuration")

    expire = config["JWT_ACCESS_TOKEN_EXPIRES"]
    current_app.logger.debug(f"expire={expire}")

    _payload = payload or {
        "iss": config["AUTHLIB_OAUTH_CLIENTS"][provider]["client_id"],
        "sub": config["AUTHLIB_OAUTH_CLIENTS"][provider]["client_id"],
        "aud": config["AUTHLIB_OAUTH_CLIENTS"][provider]["aud"],
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


def get_user_from_userinfo(user_info: UserInfoDict) -> Optional[User]:
    """
    Get a user from the database using the user information
    :param user_info: REQUIRED - The user information to search for
    :return: User
    """
    user = current_app.db_session.scalars(
        select(User).where((User.email == user_info.get("sub")))
    ).one_or_none()  # type: ignore
    if user:
        return user
    user = current_app.db_session.scalars(
        select(User).where((User.email == user_info.get("email")))
    ).one_or_none()  # type: ignore
    return user


def update_user_from_userinfo(user: User, user_info: UserInfoDict) -> None:
    """
    Update a user in the database using the user information
    :param user: REQUIRED - The user to update
    :param user_info: REQUIRED - The user information to update
    """
    user.first_name = user_info.get("given_name")
    user.last_name = user_info.get("family_name")
    user.hhs_id = user_info.get("hhsid")
    user.email = user_info.get("email")
    user.oidc_id = UUID(user_info.get("sub"))


def get_user(user_info: UserInfoDict) -> tuple[User, bool] | None:
    """
    Get a user from the database by user data
    :param user_data: REQUIRED - The user data to search for
    :return: User, bool

    The bool return param is used to determine if the user is new or not.
    """
    # Find existing user
    user = get_user_from_userinfo(user_info)
    if user:
        update_user_from_userinfo(user, user_info)
        return user, False

    # Create new user
    user = register_user(user_info)
    return user, True


def register_user(userinfo: UserInfoDict) -> User:
    """
    Register a new user in the database
    :param userinfo: REQUIRED - The user information to register
    :return: User
    """
    # Create new user
    # Default to an 'unassigned' role.
    # Set status as INACTIVE to prevent them for logging in until they are whitelisted.
    current_app.logger.debug("Creating new user")

    # Find the role with the matching permission
    role = current_app.db_session.query(Role).options(load_only(Role.name)).filter_by(name="unassigned").one()

    user = User(
        email=userinfo["email"],
        oidc_id=UUID(userinfo["sub"]),
        roles=[role],
        status=UserStatus.INACTIVE,
    )

    update_user_from_userinfo(user, userinfo)

    current_app.db_session.add(user)
    current_app.db_session.commit()

    return user


def _get_token_and_user_data_from_internal_auth(user_data: dict[str, str]):
    # Generate internal backend-JWT
    # - user meta data
    # - endpoints validate backend-JWT
    #   - refresh - within 15 min - also include a call to login.gov /refresh
    #   - invalid JWT
    # - create backend-JWT endpoints /refesh /validate (drf-simplejwt)
    # See if user exists
    user, is_new_user = get_user(user_data)

    # TODO
    # Do we want to embed the user's roles or permissions in the scope: [read write]?
    # The next two tokens are specific to our backend API, these are used for our API
    # authZ, given a valid login from the prior AuthN steps above.

    if is_new_user:
        return None, None, user, is_new_user

    additional_claims = {}
    if user.roles:
        additional_claims["roles"] = [role.name for role in user.roles]
    access_token = create_access_token(
        identity=user,
        expires_delta=current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES"),
        additional_claims=additional_claims,
        fresh=True,
    )
    refresh_token = create_refresh_token(
        identity=user,
        expires_delta=current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES"),
        additional_claims=additional_claims,
    )
    return access_token, refresh_token, user, is_new_user
