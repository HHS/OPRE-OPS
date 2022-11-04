import traceback

import requests

# from authlib.integrations.requests_client import OAuth2Session
from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from ops.auth.utils import get_jwt, oauth
from ops.user.utils import process_user


def login():
    authCode = request.json.get("code", None)

    print(f"Got an OIDC request with the code of {authCode}")

    try:

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
            client_assertion_type=(
                "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
            ),
            grant_type="authorization_code",
            code=authCode,
        )

        print(f"Token: {token}")

        header = {"Authorization": f'Bearer {token["access_token"]}'}
        user_data = requests.get(
            "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
            headers=header,
        ).json()
        print(user_data)

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
        refresh_token = create_refresh_token(identity=user)
        return jsonify(access_token=access_token, refresh_token=refresh_token)

    except Exception as err:
        traceback.print_exc()
        return f"You screwed up!: {err}", 400


# We are using the `refresh=True` options in jwt_required to only allow
# refresh tokens to access this route.
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify(access_token=access_token)
