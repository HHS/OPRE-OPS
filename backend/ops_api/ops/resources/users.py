from flask import Response, jsonify, request
from flask_jwt_extended import jwt_required, verify_jwt_in_request
from models.base import BaseModel
from models.users import User
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item_by_oidc(self, oidc: str) -> User:
        print(f"get User by_oidc: {id}")
        user = self.model.query.filter_by(oidc_id=oidc).first_or_404()
        return user

    @override
    def get(self, id: int) -> Response:
        token = verify_jwt_in_request()
        # Get the user from the token to see who's making the request
        sub = str(token[1]["sub"])
        oidc_id = request.args.get("oidc_id", type=str)

        # Grab the user, based on which ID is being queried (id or oidc_id)
        if oidc_id:
            user = self._get_item_by_oidc(oidc_id)
        else:
            user = self._get_item(id)

        # Users can only see their own user details
        # Update this authZ checks once we determine additional
        # roles that can view other users details.
        if sub == str(user.oidc_id):
            response = jsonify(user.to_dict())
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        else:
            response = jsonify({}), 401
            return response


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> User:
        user = self.model.query.filter_by(id=id).first_or_404()
        return user

    def _get_item_by_oidc(self, id: str) -> User:
        user = self.model.query.filter_by(oidc_id=id).first_or_404()
        return user

    @jwt_required()
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
