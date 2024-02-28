from enum import Enum

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from .base import BaseModel


class OpsEventType(Enum):
    LOGIN_ATTEMPT = 1
    CREATE_BLI = 2
    UPDATE_BLI = 3
    CREATE_PROJECT = 4
    CREATE_NEW_AGREEMENT = 5
    UPDATE_AGREEMENT = 6
    SEND_BLI_FOR_APPROVAL = 7
    DELETE_AGREEMENT = 8
    ACKNOWLEDGE_NOTIFICATION = 9
    LOGOUT = 10
    CREATE_USER = 11
    UPDATE_USER = 12
    DEACTIVATE_USER = 13
    CREATE_BLI_PACKAGE = 14
    UPDATE_BLI_PACKAGE = 15
    CREATE_SERVICES_COMPONENT = 16
    UPDATE_SERVICES_COMPONENT = 17
    DELETE_SERVICES_COMPONENT = 18


class OpsEventStatus(Enum):
    SUCCESS = 1
    FAILED = 2
    UNKNOWN = 3


class OpsEvent(BaseModel):
    __tablename__ = "ops_event"

    id = BaseModel.get_fk_column()
    event_type = sa.Column(sa.Enum(OpsEventType))
    event_status = sa.Column(sa.Enum(OpsEventStatus))
    event_details = sa.Column(JSONB)
