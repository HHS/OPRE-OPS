from flask import Response, request

from ops_api.ops.auth import bp
from ops_api.ops.auth.schema import LoginRequestSchema, LoginResponseSchema
from ops_api.ops.auth.service import login, logout, refresh
from ops_api.ops.auth.utils import handle_api_error
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


@bp.route("/login/", methods=["POST"])
@error_simulator
@handle_api_error
def login_post() -> Response:
    request_schema = LoginRequestSchema()
    data = request_schema.dump(request_schema.load(request.json))
    result = login(**data)
    response_schema = LoginResponseSchema()
    data = response_schema.dump(result)
    data["user"] = result["user"].to_dict()
    return make_response_with_headers(data)


@bp.route("/logout/", methods=["POST"])
@handle_api_error
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


@bp.route("/refresh/", methods=["POST"])
@handle_api_error
def refresh_post() -> Response:
    return refresh()
