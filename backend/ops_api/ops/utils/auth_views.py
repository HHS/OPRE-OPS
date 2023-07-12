from typing import Union

import requests
from authlib.integrations.requests_client import OAuth2Session
from flask import Response, current_app, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from models.events import OpsEventType
from ops_api.ops.utils.auth import create_oauth_jwt, decode_user
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import register_user


def login() -> Union[Response, tuple[str, int]]:
    auth_code = request.json.get("code")
    current_app.logger.debug(f"Got an OIDC request with the code of {auth_code}")
    with OpsEventHandler(OpsEventType.LOGIN_ATTEMPT) as la:
        token, user_data = _get_token_and_user_data_from_oauth_provider(auth_code)
        current_app.logger.debug(f"provider_access_token={token};user_data={user_data}")

        access_token, refresh_token, user, is_new_user = _get_token_and_user_data_from_internal_auth(user_data)
        current_app.logger.debug(f"api_access_token={access_token};api_refresh_token={refresh_token};user={user}")

        la.metadata.update(
            {
                "user": user.to_dict(),
                "api_access_token": access_token,
                "api_refresh_token": refresh_token,
                "oidc_access_token": token,
            }
        )

    return make_response_with_headers(
        {"access_token": access_token, "refresh_token": refresh_token, "is_new_user": is_new_user}
    )


@jwt_required(True)
def logout() -> Union[Response, tuple[str, int]]:
    with OpsEventHandler(OpsEventType.LOGOUT) as la:
        try:
            identity = get_jwt_identity()
            la.metadata.update({"oidc_id": identity})

            return make_response_with_headers({"message": f"User {identity} Logged out"})
        except RuntimeError:
            return make_response_with_headers({"message": "Logged out"})


def _get_token_and_user_data_from_internal_auth(user_data):
    # Generate internal backend-JWT
    # - user meta data
    # - endpoints validate backend-JWT
    #   - refesh - within 15 min - also include a call to login.gov /refresh
    #   - invalid JWT
    # - create backend-JWT endpoints /refesh /validate (drf-simplejwt)
    # See if user exists
    user, is_new_user = register_user(user_data)  # Refactor me
    # TODO
    # Do we want to embed the user's roles or permissions in the scope: [read write]?
    # The next two tokens are specific to our backend API, these are used for our API
    # authZ, given a valid login from the prior AuthN steps above.
    access_token = create_access_token(identity=user)
    refresh_token = create_refresh_token(identity=user)
    return access_token, refresh_token, user, is_new_user


def _get_token_and_user_data_from_oauth_provider(auth_code: str):
    try:
        authlib_client_config = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]
        current_app.logger.debug(f"authlib_client_config={authlib_client_config}")
        jwt = create_oauth_jwt()
        current_app.logger.debug(f"jwt={jwt}")

        client = OAuth2Session(
            authlib_client_config["client_id"],
            scope="openid profile email",
            redirect_uri=authlib_client_config["redirect_uri"],
        )
        token = client.fetch_token(
            authlib_client_config["token_endpoint"],
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
            authlib_client_config["user_info_url"],
            headers=header,
        ).content.decode("utf-8")

        current_app.logger.debug(f"user_jwt={user_jwt}")
        # user_data = decode_jwt(payload=user_jwt)
        user_data = decode_user(payload=user_jwt)
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
