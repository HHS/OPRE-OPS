from flask import Response

from ops_api.ops.auth import bp
from ops_api.ops.auth.auth_views import login, logout, refresh
from ops_api.ops.auth.utils import handle_api_error
from ops_api.ops.utils.response import make_response_with_headers


@handle_api_error
@bp.route("/login/", methods=["POST"])
def login_post() -> Response:
    # TODO: Implement validation
    # errors = self.validator.validate(self, request.json)
    #
    # if errors:
    #     return make_response_with_headers(errors, 400)

    try:
        return login()
    except Exception as ex:
        return make_response_with_headers(f"Login Error: {ex}", 400)


@handle_api_error
@bp.route("/logout/", methods=["POST"])
def logout_post() -> Response:
    # TODO: Implement validation
    # errors = self.validator.validate(self, request.json)
    #
    # if errors:
    #     return make_response_with_headers(errors, 400)

    try:
        return logout()
    except Exception as ex:
        return make_response_with_headers(f"Logout Error: {ex}", 400)


@handle_api_error
@bp.route("/refresh/", methods=["POST"])
def refresh_post() -> Response:
    # TODO: Implement validation
    # errors = self.validator.validate(self, request.json)
    #
    # if errors:
    #     return jsonify(errors), 400

    return refresh()
