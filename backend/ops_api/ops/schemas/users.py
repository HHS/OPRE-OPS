from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID

from marshmallow import Schema, fields

ENDPOINT_STRING = "/users"


class SafeUserSchema(Schema):
    id = fields.Integer()
    full_name = fields.String()


@dataclass(kw_only=True)
class RequestBody:
    id: int = None
    oidc_id: Optional[str] = None
    hhs_id: Optional[str] = None
    email: Optional[str] = None


@dataclass(kw_only=True)
class POSTRequestBody(RequestBody):
    id: int  # user_id is required for POST


@dataclass(kw_only=True)
class PATCHRequestBody(RequestBody):
    id: Optional[int] = None  # user_id (and all params) are optional for PATCH


@dataclass
class QueryParameters:
    id: Optional[int] = None
    oidc_id: Optional[str] = None
    hhs_id: Optional[str] = None
    email: Optional[str] = None


@dataclass
class RoleResponse:
    name: str


@dataclass(kw_only=True)
class UserResponse:
    id: int
    oidc_id: UUID
    hhs_id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    division: int
    roles: list[RoleResponse] = field(default_factory=lambda: [])
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
