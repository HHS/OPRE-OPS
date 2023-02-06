import logging
import sys
import traceback
from typing import Union

from flask import current_app
from flask import jsonify
from flask import request
from flask import Response
from flask_jwt_extended import create_access_token
from flask_jwt_extended import create_refresh_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required
from ops.utils.auth import get_jwt
from ops.utils.auth import oauth
from ops.utils.user import process_user
import requests

logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)


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
            client_assertion=get_jwt(),
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=authCode,
        )
        logging.debug(f"token: {token}")

        header = {"Authorization": f'Bearer {token["access_token"]}'}
        logging.debug(f"Header: {header}")
        user_data = requests.get(
            authlib_client_config["user_info_url"],
            headers=header,
        ).json()
        logging.debug(f"User Data: {user_data}")

        # Generate internal backend-JWT
        # - user meta data
        # - endpoints validate backend-JWT
        #   - refesh - within 15 min - also include a call to login.gov /refresh
        #   - invalid JWT
        # - create backend-JWT endpoints /refesh /validate (drf-simplejwt)

        # See if user exists
        user = process_user(user_data)  # Refactor me
        # user.auth_token = str(token)
        # user.last_login = datetime.datetime.now()
        # user.save()

        # TODO
        # Do we want to embed the user's roles or permissions in the scope: [read write]?

        access_token = create_access_token(identity=user)
        logging.info(f"access_token: {access_token}")

        refresh_token = create_refresh_token(identity=user)
        logging.debug(f"refresh_token: {refresh_token}")

        response = jsonify(access_token=access_token, refresh_token=refresh_token)
        response.headers.add("Access-Control-Allow-Origin", "*")
        logging.debug(f"response: {response}")
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
