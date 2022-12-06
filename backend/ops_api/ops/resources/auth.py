from flask import jsonify
from flask import request
from ops.auth.views import login
from ops.auth.views import refresh
from ops.views import BaseListAPI


class AuthLoginAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    def post(self):
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return login()


class AuthRefreshAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    def post(self):
        errors = self.validator.validate(self, request.json)

        if errors:
            return jsonify(errors), 400

        return refresh()
