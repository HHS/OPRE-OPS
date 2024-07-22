from typing import Any

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import current_user
from marshmallow import Schema
from werkzeug.exceptions import Forbidden

import ops_api.ops.services.users as users_service
from models import BaseModel, OpsEventType, User
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.users import (
    PATCHRequestBody,
    POSTRequestBody,
    PutUserSchema,
    QueryParameters,
    SafeUserSchema,
    UserResponse,
)
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.users import is_user_admin


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = UserResponse()
        self._put_schema = mmdc.class_schema(POSTRequestBody)()
        self._patch_schema = mmdc.class_schema(PATCHRequestBody)()

    @is_authorized(PermissionType.GET, Permission.USER)
    def get(self, id: int) -> Response:
        """
        Get a user by ID

        :param id: The ID of the user to get
        :return: The user

        Business Rules:
        - If the user is an admin, they can get the full details of any user
        - If the user is not an admin, they can get the full details of their own user or a safe version of another user
        """
        with OpsEventHandler(OpsEventType.GET_USER_DETAILS) as meta:
            user: User = users_service.get_user(current_app.db_session, id=id)

            if is_user_admin(current_user) or user.id == current_user.id:
                schema = self._response_schema
            else:
                schema = SafeUserSchema()

            user_data = schema.dump(user)
            user_data["roles"] = [role.name for role in user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)

    @is_authorized(PermissionType.PUT, Permission.USER)
    def put(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_USER) as meta:
            request_schema = PutUserSchema()
            user_data = request_schema.load(request.json)

            user: User = users_service.get_user(current_app.db_session, id=id)

            if is_user_admin(current_user) or user.id == current_user.id:
                schema = self._response_schema
            else:
                raise Forbidden("You do not have permission to update this user")

            updated_user = users_service.update_user(current_app.db_session, id=id, data=user_data)

            user_data = schema.dump(updated_user)
            user_data["roles"] = [role.name for role in updated_user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)

    @is_authorized(PermissionType.PATCH, Permission.USER)
    def patch(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_USER) as meta:
            request_schema = PutUserSchema(partial=True)
            user_data = request_schema.load(request.json)

            user: User = users_service.get_user(current_app.db_session, id=id)

            if is_user_admin(current_user) or user.id == current_user.id:
                schema = self._response_schema
            else:
                raise Forbidden("You do not have permission to update this user")

            updated_user = users_service.update_user(current_app.db_session, id=id, data=user_data)

            user_data = schema.dump(updated_user)
            user_data["roles"] = [role.name for role in updated_user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = mmdc.class_schema(POSTRequestBody)()
        self._get_schema = mmdc.class_schema(QueryParameters)()

    @is_authorized(PermissionType.GET, Permission.USER)
    def get(self) -> Response:
        oidc_id = request.args.get("oidc_id", type=str)

        if oidc_id:
            response = self._get_item_by_oidc_with_try(oidc_id)
        else:
            items = self.model.query.all()
            response = make_response_with_headers([item.to_dict() for item in items])
        return response

    @is_authorized(PermissionType.PUT, Permission.USER)
    def put(self, id: int) -> Response:
        # Update the user with the request data, and save the changes to the database
        user = update_user(request.json, id)

        # Return the updated user as a response
        return make_response_with_headers(user.to_dict())


def update_data(user: User, data: dict[str, Any]) -> None:
    for item in data:
        current_app.logger.debug(f"Updating user with item: {user} {item} {getattr(user, item)} {data[item]}")
        setattr(user, item, data[item])
    current_app.logger.debug(f"Updated user (setattr): {user.to_dict()}")
    return user


def update_user(user: User, data: dict[str, Any]) -> User:
    user = update_data(user, data)
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
