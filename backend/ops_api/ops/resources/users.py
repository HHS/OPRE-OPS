from typing import Any

import marshmallow_dataclass as mmdc

# from desert import schema
from flask import Response, current_app, request
from marshmallow import Schema, ValidationError
from models.base import BaseModel

# from models.events import OpsEventType
from models.users import User
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI  # , OPSMethodView
from ops_api.ops.resources.users_schemas import PATCHRequestBody, POSTRequestBody, QueryParameters
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized

# from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from typing_extensions import override


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(User)()
        self._put_schema = mmdc.class_schema(POSTRequestBody)()
        self._patch_schema = mmdc.class_schema(PATCHRequestBody)()

    @override
    @is_authorized(PermissionType.GET, Permission.USER)
    def get(self, id: int) -> Response:
        # token = verify_jwt_in_request()
        # Get the user from the token to see who's making the request
        # sub = str(token[1]["sub"])
        oidc_id = request.args.get("oidc_id", type=str)

        # Grab the user, based on which ID is being queried (id or oidc_id)
        if oidc_id:
            response = self._get_item_by_oidc_with_try(oidc_id)
        else:
            response = self._get_item_with_try(id)

        # Users can only see their own user details
        # Update this authZ checks once we determine additional
        # roles that can view other users details.
        # TODO: Need to be able to do user lookup without OIDC
        # if sub == str(response.json["oidc_id"]):
        return response
        # else:
        #    response = make_response({}, 401)  # nosemgrep
        #    return response

    @override
    @is_authorized(PermissionType.PUT, Permission.USER)
    def put(self, id: int) -> Response:
        # message_prefix = f"PUT /api/v1/users/{id}"
        # Update the user with the request data, and save the changes to the database
        try:
            # with OpsEventHandler(OpsEventType.UPDATE_USER) as meta:
            old_user: User = User.query.get(id)
            if not old_user:
                raise RuntimeError("Invalid User ID")
            # schema = RequestBody.get_schema()
            # OPSMethodView._validate_request(
            #     schema=schema,
            #     message=f"{message_prefix} - Params failed validation:",
            # )

            data = request.json
            # data = data.__dict__
            current_app.logger.debug(f"old_user: {old_user.to_dict()}")
            current_app.logger.debug(f"data: {data}")

            user = update_user(old_user, data)
            user_dict = user.to_dict()

            current_app.logger.debug(f"user_dict: {user_dict}")
            # meta.metadata.update({"udpated_user": user_dict})
            # Return the updated user as a response
            return make_response_with_headers(user_dict)
        except ValidationError as err:
            return make_response_with_headers(err.messages, 400)
        except Exception as err:
            return make_response_with_headers({"error": str(err)}, 400)

    @override
    @is_authorized(PermissionType.PATCH, Permission.USER)
    def patch(self, id: int) -> Response:
        # Update the user with the request data, and save the changes to the database
        try:
            user = update_user(request.json, id)
            # Return the updated user as a response
            return make_response_with_headers(user.to_dict())
        except ValidationError as err:
            return make_response_with_headers(err.messages, 400)
        except Exception as err:
            return make_response_with_headers({"error": str(err)}, 400)


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = mmdc.class_schema(POSTRequestBody)()
        self._get_schema = mmdc.class_schema(QueryParameters)()

    @override
    @is_authorized(PermissionType.GET, Permission.USER)
    def get(self) -> Response:
        oidc_id = request.args.get("oidc_id", type=str)

        if oidc_id:
            response = self._get_item_by_oidc_with_try(oidc_id)
        else:
            items = self.model.query.all()
            response = make_response_with_headers([item.to_dict() for item in items])

        return response

    @override
    @is_authorized(PermissionType.PUT, Permission.USER)
    def put(self, id: int) -> Response:
        # Update the user with the request data, and save the changes to the database
        user = update_user(request.json, id)

        # Return the updated user as a response
        return make_response_with_headers(user.to_dict())


def update_data(user: User, data: dict[str, Any]) -> None:
    for item in data:
        current_app.logger.debug(f"Updating user with item: {user} {item} {data[item]}")
        setattr(user, item, data[item])


def update_user(user: User, data: dict[str, Any]) -> User:
    update_data(user, data)
    current_app.db_session.add(user)
    current_app.db_session.commit()
    return user


def validate_and_normalize_request_data_for_patch(schema: Schema) -> dict[str, Any]:
    data = schema.dump(schema.load(request.json))
    data = {k: v for (k, v) in data.items() if k in request.json}  # only keep the attributes from the request body
    return data


def validate_and_normalize_request_data_for_put(schema: Schema) -> dict[str, Any]:
    data = schema.dump(schema.load(request.json))
    return data
