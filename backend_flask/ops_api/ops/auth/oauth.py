import time
import traceback
import uuid
import requests
from flask import Blueprint
from flask import jsonify
from flask import request
from ops.default_settings import AUTHLIB_OAUTH_CLIENTS
from ops.default_settings import JWT_PRIVATE_KEY


# from authlib.integrations.requests_client import OAuth2Session
from authlib.integrations.flask_client import OAuth
from authlib.jose import jwt
from ops.user.models import User
from ops.user.models import process_user
from flask_jwt_extended import create_access_token
from flask_jwt_extended import create_refresh_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required
from flask_jwt_extended import JWTManager

oauth = OAuth()
bp = Blueprint("auth", __name__)
jwtMgr = JWTManager()


@jwtMgr.user_identity_loader
def user_identity_lookup(user):
    return user.username


@jwtMgr.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    return User.query.filter_by(id=identity).one_or_none()


@bp.route("/login", methods=["POST"])
def login():
    authCode = request.json.get("code", None)

    print(f"Got an OIDC request with the code of {authCode}")

    try:

        oauth.register("logingov", client_id="urn:gov:gsa:openidconnect.profiles:sp:sso:hhs_acf:opre_ops",
                       server_metadata_url="https://idp.int.identitysandbox.gov/.well-known/openid-configuration",
                       client_kwargs={"scope": "openid email profile"}
                    )

        token = oauth.logingov.fetch_access_token("",
            client_assertion=get_jwt(),
            client_assertion_type="urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            grant_type="authorization_code",
            code=authCode,
        )

        print(f"Token: {token}")

        header = {"Authorization": f'Bearer {token["access_token"]}'}
        user_data = requests.get(
            "https://idp.int.identitysandbox.gov/api/openid_connect/userinfo",
            headers=header
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
        #user.auth_token = str(token)
        #user.last_login = datetime.datetime.now()
        #user.save()

        access_token = create_access_token(identity=user)
        refresh_token = create_refresh_token(identity=user)
        return jsonify(access_token=access_token, refresh_token=refresh_token)

    except Exception as err:
        traceback.print_exc()
        return "You screwed up!", 400


# We are using the `refresh=True` options in jwt_required to only allow
# refresh tokens to access this route.
@bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify(access_token=access_token)


def get_jwt(key=JWT_PRIVATE_KEY):
    if not key:
        raise NotImplementedError

    client_id = AUTHLIB_OAUTH_CLIENTS["logingov"]["client_id"]
    payload = {
        "iss": client_id,
        "sub": client_id,
        "aud": "https://idp.int.identitysandbox.gov/api/openid_connect/token",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) + 300,
    }
    header = {"alg": "RS256"}
    jws = jwt.encode(header, payload, key)

    return jws
