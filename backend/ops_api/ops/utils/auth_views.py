import logging
import sys
import traceback
from typing import Union

# from flask import current_app
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
        # authlib_client_config = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"]
        # client_id = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"][
        #     "client_id"
        # ]
        # server_metadata_url = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"][
        #     "server_metadata_url"
        # ]
        # client_kwargs = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"][
        #     "client_kwargs"
        # ]
        # user_info_url = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"][
        #     "user_info_url"
        # ]
        # logging.info(f"client_id: {client_id}")
        # logging.info(f"server_metadata_url: {server_metadata_url}")
        # logging.info(f"client_kwargs: {client_kwargs}")
        # logging.info(f"user_info_url: {user_info_url}")

        # oauth.register(
        #     "logingov",
        #     client_id="urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
        #     server_metadata_url=server_metadata_url,
        #     client_kwargs=client_kwargs,
        # )
        # logging.info("client registered")

        # reverted back to what's in main, just to test...
        oauth.register(
            "logingov",
            client_id="urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
            server_metadata_url=(
                "https://idp.int.identitysandbox.gov"
                "/.well-known/openid-configuration"
            ),
            client_kwargs={"scope": "openid email profile"},
        )

        token = oauth.logingov.fetch_access_token(
            "",
            client_assertion=get_jwt(),
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=authCode,
        )
        logging.info(f"token: {token}")

        header = {"Authorization": f'Bearer {token["access_token"]}'}
        logging.debug(f"Header: {header}")
        user_data = requests.get(
            "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
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

        access_token = create_access_token(identity=user)
        logging.debug(f"access_token: {access_token}")
        refresh_token = create_refresh_token(identity=user)
        logging.debug(f"refresh_toekn: {refresh_token}")
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
