from flask import Response, jsonify, request
from models.base import BaseModel

from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.auth_views import login, refresh
from ops_api.ops.utils.response import make_response_with_headers


class AuthLoginAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def post(self) -> Response:
        errors = self.validator.validate(self, request.json)

        if errors:
            return make_response_with_headers(errors, 400)

        try:
            return login()
        except Exception as ex:
            return make_response_with_headers(f"Login Error: {ex}", 400)


class AuthRefreshAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def post(self) -> Response:
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return refresh()
