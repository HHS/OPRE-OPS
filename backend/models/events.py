from enum import Enum, auto

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import ENUM, JSONB

from .base import BaseModel


class OpsEventType(Enum):

    # BLI Related Events
    CREATE_BLI = auto()
    UPDATE_BLI = auto()
    DELETE_BLI = auto()
    SEND_BLI_FOR_APPROVAL = auto()

    # Project Related Events
    CREATE_PROJECT = auto()

    # Agreement Related Events
    GET_AGREEMENT = auto()
    CREATE_NEW_AGREEMENT = auto()
    UPDATE_AGREEMENT = auto()
    DELETE_AGREEMENT = auto()

    # CAN Related Events
    CREATE_NEW_CAN = auto()
    UPDATE_CAN = auto()
    DELETE_CAN = auto()

    # CAN Funding Received Related Events
    CREATE_CAN_FUNDING_RECEIVED = auto()
    UPDATE_CAN_FUNDING_RECEIVED = auto()
    DELETE_CAN_FUNDING_RECEIVED = auto()

    # CAN Funding Budget Related Events
    CREATE_CAN_FUNDING_BUDGET = auto()
    UPDATE_CAN_FUNDING_BUDGET = auto()
    DELETE_CAN_FUNDING_BUDGET = auto()

    # CAN Funding Details related events
    CREATE_CAN_FUNDING_DETAILS = auto()
    UPDATE_CAN_FUNDING_DETAILS = auto()
    DELETE_CAN_FUNDING_DETAILS = auto()

    # Notification Related Events
    ACKNOWLEDGE_NOTIFICATION = auto()

    # Package Related Events
    CREATE_BLI_PACKAGE = auto()
    UPDATE_BLI_PACKAGE = auto()

    # Services Component Related Events
    CREATE_SERVICES_COMPONENT = auto()
    UPDATE_SERVICES_COMPONENT = auto()
    DELETE_SERVICES_COMPONENT = auto()

    # Procurement Acquisition Planning Related Events
    CREATE_PROCUREMENT_ACQUISITION_PLANNING = auto()
    UPDATE_PROCUREMENT_ACQUISITION_PLANNING = auto()
    DELETE_PROCUREMENT_ACQUISITION_PLANNING = auto()

    # Document Related Events
    CREATE_DOCUMENT = auto()
    UPDATE_DOCUMENT = auto()

    # Auth Related Events
    LOGIN_ATTEMPT = auto()
    LOGOUT = auto()
    IDLE_LOGOUT = auto()

    # User Related Events
    GET_USER_DETAILS = auto()
    CREATE_USER = auto()
    UPDATE_USER = auto()
    DEACTIVATE_USER = auto()

    # Portfolio Url Related Events
    CREATE_PORTFOLIO_URL = auto()
    UPDATE_PORTFOLIO_URL = auto()
    DELETE_PORTFOLIO_URL = auto()

    # Change Requests Related Events
    CREATE_CHANGE_REQUEST = auto()
    UPDATE_CHANGE_REQUEST = auto()
    DELETE_CHANGE_REQUEST = auto()

    # Procurement Shop Related Events
    CREATE_PROCUREMENT_SHOP = auto()
    UPDATE_PROCUREMENT_SHOP = auto()
    DELETE_PROCUREMENT_SHOP = auto()

    # Roles Related Events
    CREATE_ROLE = auto()
    UPDATE_ROLE = auto()
    DELETE_ROLE = auto()

    # User Session Related Events
    CREATE_USER_SESSION = auto()
    UPDATE_USER_SESSION = auto()
    DELETE_USER_SESSION = auto()

    # Procurement Tracker Related Events
    CREATE_PROCUREMENT_TRACKER = auto()
    UPDATE_PROCUREMENT_TRACKER = auto()  # When ProcurementTracker advances through steps and completes
    DELETE_PROCUREMENT_TRACKER = auto()

    UPDATE_PROCUREMENT_TRACKER_STEP = auto()

    # Procurement Action Related Events
    CREATE_PROCUREMENT_ACTION = auto()
    UPDATE_PROCUREMENT_ACTION = auto()
    DELETE_PROCUREMENT_ACTION = auto()


class OpsEventStatus(Enum):
    SUCCESS = 1
    FAILED = 2
    UNKNOWN = 3


class OpsEvent(BaseModel):
    __tablename__ = "ops_event"

    id = BaseModel.get_pk_column()
    event_type = Column(ENUM(OpsEventType))
    event_status = Column(ENUM(OpsEventStatus))
    event_details = Column(JSONB)
