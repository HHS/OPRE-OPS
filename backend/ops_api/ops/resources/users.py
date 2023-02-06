from uuid import UUID

from flask import Response, jsonify, request
from flask_jwt_extended import verify_jwt_in_request
from models.base import BaseModel
from models.users import User
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: UUID) -> User:
        user = self.model.query.filter_by(id=id).first_or_404()
        return user

    @override
    def get(self, id: UUID) -> Response:
        token = verify_jwt_in_request()
        sub = UUID(token[1]["sub"])
        if sub == id:
            user = self._get_item(id)
            response = jsonify(user.to_dict())
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        else:
            response = jsonify({}), 401
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item_by_oidc(self, id: str) -> User:
        user = self.model.query.filter_by(oidc_id=id).first_or_404()
        return user

    @override
    def get(self) -> Response:
        oidc_id = request.args.get("oidc_id", type=str)
        response = jsonify("{}")
        if oidc_id:
            user = self._get_item_by_oidc(oidc_id)
            response = jsonify(user.to_dict())
        else:
            items = self.model.query.all()
            response = jsonify([item.to_dict() for item in items])

        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
