from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID

from marshmallow import Schema, fields

from models import UserStatus

ENDPOINT_STRING = "/users"


class SafeUserSchema(Schema):
    id: int = fields.Integer(required=True)
    full_name: str = fields.String(required=True)


# Unable to use SafeUserSchema ^ in budget_line_items due to this error:
# marshmallow.exceptions.RegistryError: Multiple classes with name 'SafeUserSchema' were found. Please use the full, module-qualified path.
# so I'm using this instead:
@dataclass
class SafeUser:
    id: int
    full_name: Optional[str] = None


class RoleResponse(Schema):
    id: int = fields.Integer(required=True)
    name: str = fields.String(required=True)


class PutUserSchema(Schema):
    id: int = fields.Integer(required=True)
    email: Optional[str] = fields.String()
    first_name: Optional[str] = fields.String(load_default=None)
    last_name: Optional[str] = fields.String(load_default=None)
    division: Optional[int] = fields.Integer(load_default=None)
    status: Optional[UserStatus] = fields.Enum(UserStatus, load_default=UserStatus.INACTIVE)
    roles: Optional[list[RoleResponse]] = fields.List(fields.Nested(RoleResponse), load_default=[])


class POSTRequestBody(PutUserSchema):
    id: int  # user_id is required for POST


class PATCHRequestBody(PutUserSchema):
    id: Optional[int] = None  # user_id (and all params) are optional for PATCH


@dataclass
class QueryParameters:
    id: Optional[int] = None
    oidc_id: Optional[str] = None
    hhs_id: Optional[str] = None
    email: Optional[str] = None


class UserResponse(Schema):
    id: int = fields.Integer(required=True)
    oidc_id: UUID = fields.UUID(required=True)
    hhs_id: Optional[str] = fields.String(allow_none=True)
    email: str = fields.String(required=True)
    first_name: Optional[str] = fields.String(allow_none=True)
    last_name: Optional[str] = fields.String(allow_none=True)
    full_name: Optional[str] = fields.String(allow_none=True)
    division: Optional[int] = fields.Integer(allow_none=True)
    status: UserStatus = fields.Enum(UserStatus, required=True)
    roles: list[RoleResponse] = fields.List(fields.Nested(RoleResponse), default=[])
    display_name: str = fields.String(required=True)
    created_by: Optional[int] = fields.Integer(allow_none=True)
    updated_by: Optional[int] = fields.Integer(allow_none=True)
    created_on: Optional[datetime] = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on: Optional[datetime] = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
