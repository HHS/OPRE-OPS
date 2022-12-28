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
from ops.utils.authn import get_jwt
from ops.utils.authn import oauth
from ops.utils.user import process_user
import requests

logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)


def login() -> Union[Response, tuple[str, int]]:
    authCode = request.json.get("code", None)

    print(f"Got an OIDC request with the code of {authCode}")

    try:
        oauth_client = current_app.config["AUTHLIB_OAUTH_CLIENTS"][
            current_app.config["ACTIVE_OAUTH_CLIENT"]
        ]
        oauth.register(
            oauth_client,
            client_id=oauth_client["client_id"],
            server_metadata_url=oauth_client["server_metadata_url"],
            client_kwargs=oauth_client["client_kwargs"],
        )

        token = oauth.logingov.fetch_access_token(
            "",
            client_assertion=get_jwt(),
            client_assertion_type=(
                "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
            ),
            grant_type="authorization_code",
            code=authCode,
        )

        header = {"Authorization": f'Bearer {token["access_token"]}'}
        user_data = requests.get(
            current_app.config["AUTHLIB_OAUTH_CLIENTS"]["logingov"]["user_info_url"],
            headers=header,
        ).json()

        # See if user exists
        user = process_user(user_data)  # Refactor me

        access_token = create_access_token(identity=user)
        refresh_token = create_refresh_token(identity=user)
        return jsonify(access_token=access_token, refresh_token=refresh_token)

    except Exception as err:
        traceback.print_exc()
        return f"You screwed up!: {err}", 400


# We are using the `refresh=True` options in jwt_required to only allow
# refresh tokens to access this route.
@jwt_required(refresh=True)
def refresh() -> Response:
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify(access_token=access_token)


def parse_input():
    return {
        "input": {
            "method": request.method,
            "path": request.path.rstrip("/").strip().split("/")[1:],
            "user": request.headers.get("Authorization", ""),
        }
    }
