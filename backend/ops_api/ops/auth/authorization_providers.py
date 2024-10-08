from flask import current_app
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import select

from models.users import User
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.authorization_gateway import AuthorizationGateway


class BasicAuthorizationProvider:
    def __init__(self, authorized_users: list[str] = []):
        self.authorized_users = authorized_users

    def is_authorized(self, oidc_id: str, permission: str) -> bool:
        stmt = select(User).where(User.oidc_id == oidc_id)
        users = current_app.db_session.execute(stmt).all()
        if users and len(users) == 1:
            user = users[0][0]

            user_permissions = set(p for role in user.roles for p in role.permissions)
            if permission in user_permissions:
                return True

        return False


def _check_role(permission_type: PermissionType, permission: Permission) -> bool:
    auth_gateway = AuthorizationGateway(BasicAuthorizationProvider())
    identity = get_jwt_identity()
    return auth_gateway.is_authorized(identity, f"{permission_type.name}_{permission.name}".upper())


# def _check_groups(groups: Optional[list[str]]) -> bool:
#     auth_group = False
#     if groups is not None:
#         auth_group = len(set(groups) & {g.name for g in current_user.groups}) > 0
#     return auth_group


# def _check_extra(extra_check: Optional[Callable[..., bool]], args, kwargs) -> bool:
#     valid = False
#     if extra_check is not None:
#         valid = extra_check(*args, **kwargs)
#     return valid
