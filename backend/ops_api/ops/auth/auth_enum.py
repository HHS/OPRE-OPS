from enum import Enum, auto


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
    CHANGE_REQUEST_REVIEW = auto()
    DIVISION = auto()
    HISTORY = auto()
    NOTIFICATION = auto()
    PACKAGE = auto()
    PORTFOLIO = auto()
    RESEARCH_PROJECT = auto()
    SERVICES_COMPONENT = auto()
    USER = auto()
    WORKFLOW = auto()
