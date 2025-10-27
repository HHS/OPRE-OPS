from typing import Optional
from uuid import UUID

from marshmallow import Schema, fields
from models import UserStatus
from ops_api.ops.auth.auth_types import ProviderTypes


class LoginRequestSchema(Schema):
    code: str = fields.String(required=True)
    provider: ProviderTypes = fields.Enum(ProviderTypes, required=True)


class LoginResponseSchema(Schema):
    # user is also passed back in the response, but it is not defined here
    access_token: str = fields.String(required=True)
    refresh_token: str = fields.String(required=True)


class LogoutResponseSchema(Schema):
    message: str = fields.String(required=True)


class RefreshResponseSchema(Schema):
    access_token: str = fields.String(required=True)


class RoleRequestSchema(Schema):
    id: Optional[int] = fields.Integer()
    name: Optional[str] = fields.String()


class RoleResponseSchema(Schema):
    id: int = fields.Integer(required=True)
    name: str = fields.String(required=True)


class UserResponseSchema(Schema):
    id: int = fields.Integer(required=True)
    oidc_id: UUID = fields.UUID(required=True)
    status: UserStatus = fields.Enum(UserStatus, required=True)
    hhs_id: Optional[str] = fields.String(allow_none=True)
    email: str = fields.String(required=True)
    first_name: Optional[str] = fields.String(allow_none=True)
    last_name: Optional[str] = fields.String(allow_none=True)
    full_name: Optional[str] = fields.String(allow_none=True)
    division: Optional[int] = fields.Integer(allow_none=True)
    roles: Optional[list[str]] = fields.List(fields.String(), dump_default=[])
    display_name: str = fields.String(required=True)
