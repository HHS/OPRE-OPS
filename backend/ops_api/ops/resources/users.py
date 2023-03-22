from flask import Response, jsonify, request
from flask_jwt_extended import jwt_required, verify_jwt_in_request
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def get(self, id: int) -> Response:
        token = verify_jwt_in_request()
        # Get the user from the token to see who's making the request
        sub = str(token[1]["sub"])
        oidc_id = request.args.get("oidc_id", type=str)

        # Grab the user, based on which ID is being queried (id or oidc_id)
        if oidc_id:
            response = self._get_item_by_oidc_with_try(oidc_id)
        else:
            response = self._get_item_with_try(id)

        # Users can only see their own user details
        # Update this authZ checks once we determine additional
        # roles that can view other users details.
        if sub == str(response[0].json["oidc_id"]):
            return response
        else:
            response = jsonify({}), 401
            return response


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    @override
    def get(self) -> Response:
        oidc_id = request.args.get("oidc_id", type=str)

        if oidc_id:
            response = self._get_item_by_oidc_with_try(oidc_id)
        else:
            items = self.model.query.all()
            response = jsonify([item.to_dict() for item in items])

        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
