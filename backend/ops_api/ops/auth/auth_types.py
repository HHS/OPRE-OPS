from dataclasses import dataclass
from enum import Enum, auto
from typing import NotRequired, Required, TypedDict

from marshmallow import Schema, fields


class PermissionType(Enum):
    DELETE = auto()
    GET = auto()
    PATCH = auto()
    POST = auto()
    PUT = auto()


class Permission(Enum):
    AGREEMENT = auto()
    BUDGET_LINE_ITEM = auto()
    BLI_PACKAGE = auto()
    CAN = auto()
    CHANGE_REQUEST = auto()
    DIVISION = auto()
    HISTORY = auto()
    NOTIFICATION = auto()
    PACKAGE = auto()
    PORTFOLIO = auto()
    RESEARCH_PROJECT = auto()
    SERVICES_COMPONENT = auto()
    UPLOAD_DOCUMENT = auto()
    USER = auto()
    WORKFLOW = auto()


class UserInfoDict(TypedDict):
    sub: Required[str]
    email: Required[str]
    aud: NotRequired[str]
    email_verified: NotRequired[bool]
    hhsid: NotRequired[str]
    IAL: NotRequired[int]
    name: NotRequired[str]
    iss: NotRequired[str]
    preferred_username: NotRequired[str]
    AAL: NotRequired[int]
    given_name: NotRequired[str]
    family_name: NotRequired[str]


class ProviderTypes(Enum):
    fakeauth = auto()
    logingov = auto()
    hhsams = auto()


class LoginErrorTypes(Enum):
    USER_NOT_FOUND = auto()
    USER_NOT_ACTIVE = auto()
    PROVIDER_ERROR = auto()
    UNKNOWN_ERROR = auto()


@dataclass
class LoginErrorResponse:
    error_type: LoginErrorTypes
    message: str


class LoginErrorResponseSchema(Schema):
    error_type = fields.Enum(LoginErrorTypes, required=True)
    message = fields.Str(required=True)
