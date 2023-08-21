import json
from typing import Union

import requests
from authlib.integrations.requests_client import OAuth2Session
from flask import Response, current_app, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from models.events import OpsEventType
from ops_api.ops.utils.auth import create_oauth_jwt, decode_user
from ops_api.ops.utils.authentication import AuthenticationGateway
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import register_user


def login() -> Union[Response, tuple[str, int]]:
    try:
        auth_code = request.json.get("code")
        provider = request.json.get("provider")
        current_app.logger.debug(f"login - auth_code: {auth_code}")
        current_app.logger.debug(f"login - provider: {provider}")

        with current_app.app_context():
            auth_gateway = AuthenticationGateway(current_app.config.get("JWT_PRIVATE_KEY"))

        with OpsEventHandler(OpsEventType.LOGIN_ATTEMPT) as la:
            if auth_code is None:
                return "Invalid Auth Code", 400

            if provider not in auth_gateway.providers.keys():
                return "Invalid provider name", 400

            token = auth_gateway.authenticate(provider, auth_code)
            # current_app.logger.debug(f"auth_gateway.authenticate() - token: {token['access_token'].strip()}")
            if not token:
                current_app.logger.error(f"Failed to authenticate with provider {provider} using auth code {auth_code}")
                return "Invalid Provider Auth Token", 400

            user_data = auth_gateway.get_user_info(provider, token["access_token"].strip())
            # Issues where user_data is sometimes just a string, and sometimes a dict.
            if isinstance(user_data, str):
                user_data = json.loads(user_data)
            else:
                user_data = user_data

            # current_app.logger.debug(f"Got an OIDC request with the code of {auth_code}")
            # current_app.logger.debug(f"Login for SSO: {provider}")

            # ### token, user_data = _get_token_and_user_data_from_oauth_provider(provider, auth_code)
            # current_app.logger.debug(f"provider_access_token: {token}")
            current_app.logger.debug(f"Provider Returned user_data: {user_data}")

            (
                access_token,
                refresh_token,
                user,
                is_new_user,
            ) = _get_token_and_user_data_from_internal_auth(user_data)
            current_app.logger.debug(
                f"api_access_token={access_token};   api_refresh_token={refresh_token};    user={user};    is_new_user={is_new_user}"
            )

        la.metadata.update(
            {
                "user": user.to_dict(),
                "api_access_token": access_token,
                "api_refresh_token": refresh_token,
                "oidc_access_token": token,
            }
        )

        return make_response_with_headers(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "is_new_user": is_new_user,
                "user": user.to_dict(),
            }
        )
    except Exception as e:
        current_app.logger.exception(e)
        la.metadata.update(
            {
                "exception": e,
            }
        )
        return make_response_with_headers({"message": str(e)}, 500)


@jwt_required(True)
def logout() -> Union[Response, tuple[str, int]]:
    with OpsEventHandler(OpsEventType.LOGOUT) as la:
        try:
            identity = get_jwt_identity()
            la.metadata.update({"oidc_id": identity})
            # TODO: Process the /logout endpoint for the OIDC Provider here.
            return make_response_with_headers({"message": f"User {identity} Logged out"})
        except RuntimeError:
            return make_response_with_headers({"message": "Logged out"})


def _get_token_and_user_data_from_internal_auth(user_data: dict[str, str]):
    # Generate internal backend-JWT
    # - user meta data
    # - endpoints validate backend-JWT
    #   - refresh - within 15 min - also include a call to login.gov /refresh
    #   - invalid JWT
    # - create backend-JWT endpoints /refesh /validate (drf-simplejwt)
    # See if user exists
    try:
        user, is_new_user = register_user(user_data)  # Refactor me
        current_app.logger.debug(f"User: {user}")
        current_app.logger.debug(f"Is New User: {is_new_user}")
        # TODO
        # Do we want to embed the user's roles or permissions in the scope: [read write]?
        # The next two tokens are specific to our backend API, these are used for our API
        # authZ, given a valid login from the prior AuthN steps above.

        additional_claims = {}
        if user.roles:
            additional_claims["roles"] = [role.name for role in user.roles]
        current_app.logger.debug("######### KEY ###########")
        current_app.logger.debug(current_app.config["JWT_PRIVATE_KEY"])
        access_token = create_access_token(identity=user, expires_delta=False, additional_claims=additional_claims)
        refresh_token = create_refresh_token(identity=user, expires_delta=False, additional_claims=additional_claims)
    except Exception as e:
        current_app.logger.exception(e)
        return None, None, None, None
    return access_token, refresh_token, user, is_new_user


def _get_token_and_user_data_from_oauth_provider(provider: str, auth_code: str):
    try:
        authlib_client_config = current_app.config["AUTHLIB_OAUTH_CLIENTS"]
        current_app.logger.debug(f"authlib_client_config={authlib_client_config}")
        current_app.logger.debug(f"auth_provider={provider}")
        provider_config = authlib_client_config[provider]

        jwt = create_oauth_jwt(provider)
        current_app.logger.debug(f"jwt={jwt}")

        client = OAuth2Session(
            provider_config["client_id"],
            scope="openid profile email",
            redirect_uri=provider_config["redirect_uri"],
        )
        token = client.fetch_token(
            provider_config["token_endpoint"],
            client_assertion=jwt,
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=auth_code,
        )
        current_app.logger.debug(f"token={token}")
        access_token = token["access_token"].strip()
        header = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }
        current_app.logger.debug(f"header={header}")
        user_jwt = requests.get(
            provider_config["user_info_url"],
            headers=header,
        ).content.decode("utf-8")

        current_app.logger.debug(f"user_jwt={user_jwt}")
        # user_data = decode_jwt(payload=user_jwt)
        # HHSAMS returns a JWT, for user data, which needs decoded,
        # Login.gov returns a JSON object for user data,
        # so we need to handle both cases.
        user_data = decode_user(payload=user_jwt, provider=provider) if provider == "hhsams" else user_jwt
        current_app.logger.debug(f"user_data={user_data}")
    except Exception as e:
        current_app.logger.exception(e)
        raise e
    finally:
        return token, user_data


# We are using the `refresh=True` options in jwt_required to only allow
# refresh tokens to access this route.
@jwt_required(refresh=True)
def refresh() -> Response:
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return make_response_with_headers({"access_token": access_token})
