from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.base import BaseModel
from ops.models.users import User
from ops.utils.authz import check_auth
from typing_extensions import override


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> User:
        user = self.model.query.filter_by(id=id).first_or_404()
        return user

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

    @override
    # @jwt_required
    def get(self) -> Response:
        oidc_id = request.args.get("oidc_id", type=str)
        # Remove leading '/', then split into array by each remaining '/'
        path_as_array = request.path.strip("/").split("/")
        if oidc_id:
            if check_auth(request.method, path_as_array, oidc_id):
                user = self._get_item_by_oidc(oidc_id)
                response = jsonify(user.to_dict())
                response.headers.add("Access-Control-Allow-Origin", "*")
                return response
            return '{"error": "Not Authorized"}', 401
        else:
            items = self.model.query.all()
            response = jsonify([item.to_dict() for item in items])
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
