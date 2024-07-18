from enum import Enum, auto

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

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
    CREATE_NEW_AGREEMENT = auto()
    UPDATE_AGREEMENT = auto()
    DELETE_AGREEMENT = auto()

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

    # Auth Related Events
    LOGIN_ATTEMPT = auto()
    LOGOUT = auto()

    # User Related Events
    GET_USER_DETAILS = auto()
    CREATE_USER = auto()
    UPDATE_USER = auto()
    DEACTIVATE_USER = auto()


class OpsEventStatus(Enum):
    SUCCESS = 1
    FAILED = 2
    UNKNOWN = 3


class OpsEvent(BaseModel):
    __tablename__ = "ops_event"

    id = BaseModel.get_pk_column()
    event_type = sa.Column(sa.Enum(OpsEventType))
    event_status = sa.Column(sa.Enum(OpsEventStatus))
    event_details = sa.Column(JSONB)
