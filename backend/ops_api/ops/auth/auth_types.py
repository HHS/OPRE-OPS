from enum import Enum, auto
from typing import Optional, TypedDict


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
    DIVISION = auto()
    HISTORY = auto()
    NOTIFICATION = auto()
    PACKAGE = auto()
    PORTFOLIO = auto()
    RESEARCH_PROJECT = auto()
    USER = auto()
    WORKFLOW = auto()
    SERVICES_COMPONENT = auto()


class UserInfoDict(TypedDict):
    sub: str
    email: Optional[str]
    given_name: Optional[str]
