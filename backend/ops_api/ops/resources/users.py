from flask import jsonify
from flask import request
from flask import Response
from flask_jwt_extended import jwt_required
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.base import BaseModel
from ops.models.users import User
from typing_extensions import override


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> User:
        user = self.model.query.filter_by(id=id).first_or_404()
        return user

    # @jwt_required
    @override
    def get(self, id: int) -> Response:
        user = self._get_item(id)
        response = jsonify(user.to_dict())
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item_by_oidc(self, id: str) -> User:
        user = self.model.query.filter_by(oidc_id=id).first_or_404()
        return user

    @jwt_required(optional=True)
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
