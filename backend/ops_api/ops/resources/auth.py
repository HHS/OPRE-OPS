from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseListAPI
from ops.utils.auth_views import login
from ops.utils.auth_views import refresh


class AuthLoginAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    def post(self) -> Response:
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return login()


class AuthRefreshAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    def post(self) -> Response:
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return refresh()
