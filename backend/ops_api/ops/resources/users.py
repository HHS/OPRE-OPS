from flask import Response, current_app, request
from flask_jwt_extended import current_user

import ops_api.ops.services.users as users_service
from models import BaseModel, OpsEventType, User
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.users import CreateUserSchema, QueryParameters, SafeUserSchema, UpdateUserSchema, UserResponse
from ops_api.ops.services.users import get_users
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.users import is_user_admin


class UsersItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

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
                schema = UserResponse()
            else:
                schema = SafeUserSchema()

            user_data = schema.dump(user)
            user_data["roles"] = [role.name for role in user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)

    @is_authorized(PermissionType.PUT, Permission.USER)
    def put(self, id: int) -> Response:
        """
        Update a user by ID

        :param id: The ID of the user to update
        :return: The updated user

        Business Rules:
        - Only USER_ADMIN role can update users

        """
        with OpsEventHandler(OpsEventType.UPDATE_USER) as meta:
            schema = UpdateUserSchema()
            user_data = schema.load(request.json)

            updated_user = users_service.update_user(
                current_app.db_session, id=id, data=user_data, request_user=current_user
            )

            schema = UserResponse()
            user_data = schema.dump(updated_user)
            user_data["roles"] = [role.name for role in updated_user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)

    @is_authorized(PermissionType.PATCH, Permission.USER)
    def patch(self, id: int) -> Response:
        """
        Partially update a user by ID

        :param id: The ID of the user to update
        :return: The updated user

        Business Rules:
        - Only USER_ADMIN role can update users

        """
        with OpsEventHandler(OpsEventType.UPDATE_USER) as meta:
            schema = UpdateUserSchema(partial=True)
            user_data = schema.load(request.json)

            updated_user = users_service.update_user(
                current_app.db_session, id=id, data=user_data, request_user=current_user
            )

            schema = UserResponse()
            user_data = schema.dump(updated_user)
            user_data["roles"] = [role.name for role in updated_user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)


class UsersListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.USER)
    def get(self) -> Response:
        """
        Get all users

        :return: All users

        Business Rules:
        - If the user is an admin, they can get the full details of all users
        - If the user is not an admin, they can get the safe version of other users
        """
        with OpsEventHandler(OpsEventType.GET_USER_DETAILS) as meta:
            schema = QueryParameters()
            request_data = schema.load(request.args)

            users = get_users(current_app.db_session, **request_data)

            if is_user_admin(current_user) or (len(users) == 1 and users[0].id == current_user.id):
                schema = UserResponse(many=True)
            else:
                schema = SafeUserSchema(many=True)

            user_data = schema.dump(users)

            if not isinstance(schema, SafeUserSchema):
                for user in users:
                    for data in user_data:
                        if user.id == data["id"]:
                            data["roles"] = [role.name for role in user.roles]
                            break

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data)

    @is_authorized(PermissionType.POST, Permission.USER)
    def post(self) -> Response:
        """
        Create a user

        :return: The created user

        Business Rules:
        - Only USER_ADMIN role can create users

        """
        with OpsEventHandler(OpsEventType.CREATE_USER) as meta:
            schema = CreateUserSchema(partial=True)
            user_data = schema.load(request.json)

            updated_user = users_service.create_user(current_app.db_session, data=user_data, request_user=current_user)

            schema = UserResponse()
            user_data = schema.dump(updated_user)
            user_data["roles"] = [role.name for role in updated_user.roles]

            meta.metadata.update({"user_details": user_data})

            return make_response_with_headers(user_data, 202)
