import json
import time
import uuid
from enum import Enum, auto
from functools import wraps
from typing import Callable, Optional

import requests
from authlib.integrations.flask_client import OAuth
from authlib.jose import JsonWebToken
from authlib.jose import jwt as jose_jwt
from flask import Response, current_app
from flask_jwt_extended import JWTManager, get_current_user, get_jwt_identity, jwt_required
from sqlalchemy import select
from sqlalchemy.exc import MultipleResultsFound, NoResultFound

from models.users import User
from ops_api.ops.utils.authorization import AuthorizationGateway, BasicAuthorizationPrivider
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers

jwtMgr = JWTManager()
oauth = OAuth()
auth_gateway = AuthorizationGateway(BasicAuthorizationPrivider())


class PermissionType(Enum):
    DELETE = auto()
    GET = auto()
    PATCH = auto()
    POST = auto()
    PUT = auto()


class Permission(Enum):
    AGREEMENT = auto()
    BUDGET_LINE_ITEM = auto()
    BLI_PACKAGE = auto()
    CAN = auto()
    DIVISION = auto()
    HISTORY = auto()
    NOTIFICATION = auto()
    PACKAGE = auto()
    PORTFOLIO = auto()
    RESEARCH_PROJECT = auto()
    USER = auto()
    WORKFLOW = auto()
    SERVICES_COMPONENT = auto()


@jwtMgr.user_identity_loader
def user_identity_lookup(user: User) -> str:
    return user.oidc_id


@jwtMgr.user_lookup_loader
def user_lookup_callback(_jwt_header: dict, jwt_data: dict) -> Optional[User]:
    identity = jwt_data["sub"]
    stmt = select(User).where(User.oidc_id == identity)
    try:
        return current_app.db_session.scalars(stmt).one()

    except (NoResultFound, MultipleResultsFound):
        return None


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


class ExtraCheckError(Exception):
    """Exception used to handle errors from the extra check function that can be passed
    into @is_authorized().
    """

    def __init__(self, response_data):
        super().__init__()
        self.response_data = response_data


def _check_role(permission_type: PermissionType, permission: Permission) -> bool:
    identity = get_jwt_identity()
    return auth_gateway.is_authorized(identity, f"{permission_type.name}_{permission.name}".upper())


def _check_groups(groups: Optional[list[str]]) -> bool:
    auth_group = False
    if groups is not None:
        user = get_current_user()
        auth_group = len(set(groups) & {g.name for g in user.groups}) > 0
    return auth_group


def _check_extra(extra_check: Optional[Callable[..., bool]], args, kwargs) -> bool:
    valid = False
    if extra_check is not None:
        valid = extra_check(*args, **kwargs)
    return valid


class is_authorized:
    def __init__(
        self,
        permission_type: PermissionType,
        permission: Permission,
        extra_check: Optional[Callable[..., bool]] = None,
        groups: Optional[list[str]] = None,
    ) -> None:
        """Checks for if the user is authorized to use this endpoint. The order of authorizations is as follows:
        Role -> Group -> Extra.

        If the user has the correct role permission, then the user is authorized.
        Else if the user has the correct group the user is authorized.
        Else if the user passes the extra validation check that is defined, the user is authorized.
        Else the user is not authorized.

        Args:
            permission_type: The permission "verb" (GET, PUT, PATCH, etc)
            permission: The permission "noun" (USER, AGREEMENT, BUDGET_LINE_ITEM, etc)
            group: If given, the list of groups authorized to use this endpoint.
            extra_check: If given, a function that accepts the same parameters as the decorated function/method, and
                returns a boolean value, which does additional custom checking to see if the user is authorized.
        """
        self.permission_type = permission_type
        self.permission = permission
        self.extra_check = extra_check
        self.groups = groups

    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        @jwt_required()
        @error_simulator
        def wrapper(*args, **kwargs) -> Response:
            try:
                if (
                    _check_role(self.permission_type, self.permission)
                    or _check_groups(self.groups)
                    or _check_extra(self.extra_check, args, kwargs)
                ):
                    response = func(*args, **kwargs)

                else:
                    response = make_response_with_headers({}, 401)

            except ExtraCheckError as e:
                response = make_response_with_headers(e.response_data, 400)

            return response

        return wrapper
