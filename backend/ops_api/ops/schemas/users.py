from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

import ops_api.ops.schemas.custom_types as custom_types
from marshmallow import Schema, fields
from models import UserStatus


class CreateUserSchema(Schema):
    email: Optional[str] = fields.String(required=True)
    first_name: Optional[str] = fields.String(load_default=None)
    last_name: Optional[str] = fields.String(load_default=None)
    division: Optional[int] = fields.Integer(load_default=None)
    status: Optional[UserStatus] = fields.Enum(UserStatus, load_default=UserStatus.INACTIVE)
    roles: Optional[list[str]] = fields.List(fields.String(), load_default=[])


class UpdateUserSchema(CreateUserSchema):
    id: Optional[int] = fields.Integer()
    email: Optional[str] = fields.String()


class QueryParameters(Schema):
    id: Optional[int] = fields.Integer()
    oidc_id: Optional[str] = fields.String()
    hhs_id: Optional[str] = fields.String()
    email: Optional[str] = fields.String()
    status: Optional[str] = fields.String()
    division: Optional[int] = fields.Integer()
    first_name: Optional[str] = fields.String()
    last_name: Optional[str] = fields.String()
    roles: Optional[list[str]] = custom_types.List(fields.String())


class RoleSchema(Schema):
    id: int = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    is_superuser = fields.Boolean(required=True)


class UserResponse(Schema):
    id: int = fields.Integer(required=True)
    oidc_id: UUID = fields.UUID(required=True)
    status: UserStatus = fields.Enum(UserStatus, required=True)
    hhs_id: Optional[str] = fields.String(allow_none=True)
    email: str = fields.String(required=True)
    first_name: Optional[str] = fields.String(allow_none=True)
    last_name: Optional[str] = fields.String(allow_none=True)
    full_name: Optional[str] = fields.String(allow_none=True)
    division: Optional[int] = fields.Integer(allow_none=True)
    roles: Optional[list[dict]] = fields.List(fields.Nested(RoleSchema), dump_default=[])
    display_name: str = fields.String(required=True)
    is_superuser: bool = fields.Boolean(required=True)
    created_by: Optional[int] = fields.Integer(allow_none=True)
    updated_by: Optional[int] = fields.Integer(allow_none=True)
    created_on: Optional[datetime] = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on: Optional[datetime] = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class SafeUserSchema(Schema):
    id: int = fields.Integer(required=True)
    full_name: Optional[str] = fields.String()
