from enum import Enum
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from typing_extensions import override

from .base import BaseModel


class OpsEventType(Enum):
    LOGIN_ATTEMPT = 1
    CREATE_BLI = 2
    UPDATE_BLI = 3
    CREATE_RESEARCH_PROJECT = 4
    CREATE_NEW_AGREEMENT = 5
    UPDATE_AGREEMENT = 6
    SEND_BLI_FOR_APPROVAL = 7
    DELETE_AGREEMENT = 8
    ACKNOWLEDGE_NOTIFICATION = 9
    LOGOUT = 10


class OpsEventStatus(Enum):
    SUCCESS = 1
    FAILED = 2
    UNKNOWN = 3


class OpsEvent(BaseModel):
    __tablename__ = "ops_event"

    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    event_type = sa.Column(sa.Enum(OpsEventType))
    event_status = sa.Column(sa.Enum(OpsEventStatus))
    event_details = sa.Column(JSONB)

    @override
    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = super().to_dict()

        d.update(
            {
                "event_type": self.event_type.name if self.event_type else None,
                "event_status": self.event_status.name if self.event_status else None,
            }
        )

        return d
