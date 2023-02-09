import traceback
from typing import Union

import requests
from flask import Response, current_app, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity, jwt_required
from ops_api.ops.utils.auth import create_oauth_jwt, oauth
from ops_api.ops.utils.user import process_user

logging = current_app.logger


def login() -> Union[Response, tuple[str, int]]:
    authCode = request.json.get("code", None)

    print(f"Got an OIDC request with the code of {authCode}")

    try:
        authlib_client_config = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"]
        oauth.register(
            "logingov",
            client_id=authlib_client_config["client_id"],
            server_metadata_url=authlib_client_config["server_metadata_url"],
            client_kwargs=authlib_client_config["client_kwargs"],
        )

        token = oauth.logingov.fetch_access_token(
            "",
            client_assertion=create_oauth_jwt(),
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=authCode,
        )

        header = {"Authorization": f'Bearer {token["access_token"]}'}
        user_data = requests.get(
            authlib_client_config["user_info_url"],
            headers=header,
        ).json()

        # Generate internal backend-JWT
        # - user meta data
        # - endpoints validate backend-JWT
        #   - refesh - within 15 min - also include a call to login.gov /refresh
        #   - invalid JWT
        # - create backend-JWT endpoints /refesh /validate (drf-simplejwt)

        # See if user exists
        user = process_user(user_data)  # Refactor me

        # TODO
        # Do we want to embed the user's roles or permissions in the scope: [read write]?

        # The next two tokens are specific to our backend API, these are used for our API
        # authZ, given a valid login from the prior AuthN steps above.
        access_token = create_access_token(identity=user)
        refresh_token = create_refresh_token(identity=user)
        response = jsonify(access_token=access_token, refresh_token=refresh_token)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response

    except Exception as err:
        logging.error(err)
        traceback.print_exc()
        return f"Login Error: {err}", 400


# We are using the `refresh=True` options in jwt_required to only allow
# refresh tokens to access this route.
@jwt_required(refresh=True)
def refresh() -> Response:
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    response = jsonify(access_token=access_token)
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response
