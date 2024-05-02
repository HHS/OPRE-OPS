import json
from typing import Any, Union

from flask import Response, current_app
from flask_jwt_extended import create_access_token, current_user, get_jwt_identity

from models.events import OpsEventType
from ops_api.ops.auth.authentication_gateway import AuthenticationGateway
from ops_api.ops.auth.utils import _get_token_and_user_data_from_internal_auth
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


def login(code: str, provider: str) -> dict[str, Any]:
    """
    If the user is authenticated with the provider, but there is no existing user in the database, then a new user
    is created in the database however, the user is not active until the user is approved by an admin.
    Therefore, the new user will not receive an access token until the user is approved by an admin.
    """
    current_app.logger.debug(f"login - auth_code: {code}")
    current_app.logger.debug(f"login - provider: {provider}")

    with current_app.app_context():
        auth_gateway = AuthenticationGateway(current_app.config)

    with OpsEventHandler(OpsEventType.LOGIN_ATTEMPT) as la:
        token = auth_gateway.authenticate(provider, code)

        if not token:
            current_app.logger.error(f"Failed to authenticate with provider {provider} using auth code {code}")
            return "Invalid Provider Auth Token", 400

        user_data = auth_gateway.get_user_info(provider, token["access_token"].strip())

        # Issues where user_data is sometimes just a string, and sometimes a dict.
        if isinstance(user_data, str):
            user_data = json.loads(user_data)  # pragma: allowlist
        else:
            user_data = user_data

        current_app.logger.debug(f"Provider Returned user_data: {user_data}")

        (
            access_token,
            refresh_token,
            user,
            is_new_user,
        ) = _get_token_and_user_data_from_internal_auth(user_data)

    la.metadata.update(
        {
            "user": user.to_dict(),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "oidc_access_token": token,
        }
    )

    response = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "is_new_user": is_new_user,
        "user": user,
    }

    return response


def logout() -> Union[Response, tuple[str, int]]:
    with OpsEventHandler(OpsEventType.LOGOUT) as la:
        try:
            identity = get_jwt_identity()
            la.metadata.update({"oidc_id": identity})
            # TODO: Process the /logout endpoint for the OIDC Provider here.
            return make_response_with_headers({"message": f"User {identity} Logged out"})
        except RuntimeError:
            return make_response_with_headers({"message": "Logged out"})


# def _get_token_and_user_data_from_oauth_provider(provider: str, auth_code: str):
#     try:
#         authlib_client_config = current_app.config["AUTHLIB_OAUTH_CLIENTS"]
#         current_app.logger.debug(f"authlib_client_config={authlib_client_config}")
#         current_app.logger.debug(f"auth_provider={provider}")
#         provider_config = authlib_client_config[provider]
#
#         jwt = create_oauth_jwt(provider, current_app.config)
#         current_app.logger.debug(f"jwt={jwt}")
#
#         client = OAuth2Session(
#             provider_config["client_id"],
#             scope="openid profile email",
#             redirect_uri=provider_config["redirect_uri"],
#         )
#         token = client.fetch_token(
#             provider_config["token_endpoint"],
#             client_assertion=jwt,
#             client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
#             grant_type="authorization_code",
#             code=auth_code,
#         )
#         current_app.logger.debug(f"token={token}")
#         access_token = token["access_token"].strip()
#         header = {
#             "Authorization": f"Bearer {access_token}",
#             "Accept": "application/json",
#         }
#         current_app.logger.debug(f"header={header}")
#         user_jwt = requests.get(
#             provider_config["user_info_url"],
#             headers=header,
#         ).content.decode("utf-8")
#
#         # HHSAMS returns a JWT, for user data, which needs decoded,
#         # Login.gov returns a JSON object for user data,
#         # so we need to handle both cases.
#         user_data = (
#             decode_user(payload=user_jwt, provider=provider)
#             if provider == "hhsams"
#             else user_jwt
#         )
#         current_app.logger.debug(f"user_data={user_data}")
#     except Exception as e:
#         current_app.logger.exception(e)
#         raise e
#     finally:
#         return token, user_data


def refresh() -> Response:
    additional_claims = {"roles": []}
    current_app.logger.debug(f"user {current_user}")
    if current_user.roles:
        additional_claims["roles"] = [role.name for role in current_user.roles]
    access_token = create_access_token(
        identity=current_user,
        expires_delta=current_app.config.get("JWT_ACCESS_TOKEN_EXPIRES"),
        additional_claims=additional_claims,
        fresh=False,
    )
    return make_response_with_headers({"access_token": access_token})
