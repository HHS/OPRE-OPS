from flask import Response, current_app, request
from flask_jwt_extended import jwt_required

import ops_api.ops.auth.service as auth_service
from ops_api.ops.auth import bp
from ops_api.ops.auth.schema import (
    LoginRequestSchema,
    LoginResponseSchema,
    LogoutResponseSchema,
    RefreshResponseSchema,
    RoleRequestSchema,
    RoleResponseSchema,
)
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


@bp.route("/login/", methods=["POST"])
@error_simulator
def login_post() -> Response:
    request_schema = LoginRequestSchema()
    data = request_schema.dump(request_schema.load(request.json))
    result = auth_service.login(**data)
    response_schema = LoginResponseSchema()
    data = response_schema.dump(result)
    data["user"] = result["user"].to_dict()
    return make_response_with_headers(data)


@bp.route("/logout/", methods=["POST"])
@jwt_required()
@error_simulator
def logout_post() -> Response:
    result = auth_service.logout()
    response_schema = LogoutResponseSchema()
    data = response_schema.dump(result)
    return make_response_with_headers(data)


@bp.route("/refresh/", methods=["POST"])
@jwt_required(refresh=True, verify_type=True)
@error_simulator
def refresh_post() -> Response:
    result = auth_service.refresh()
    response_schema = RefreshResponseSchema()
    data = response_schema.dump(result)
    return make_response_with_headers(data)


@bp.route("/roles/", methods=["GET"])
@error_simulator
def roles_get() -> Response:
    request_schema = RoleRequestSchema()
    data = request_schema.dump(request_schema.load(request.args))
    result = auth_service.get_roles(current_app.db_session, **data)
    response_schema = RoleResponseSchema(many=True)
    data = response_schema.dump(result)
    return make_response_with_headers(data)
