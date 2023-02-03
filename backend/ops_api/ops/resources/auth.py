from flask import Response, jsonify, request
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.auth_views import login, refresh


class AuthLoginAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def post(self) -> Response:
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return login()


class AuthRefreshAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def post(self) -> Response:
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return refresh()
