from marshmallow import EXCLUDE, Schema, fields
from models import CANHistoryType


class CANHistoryItemSchema(Schema):
    id = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    ops_event_id = fields.Integer(required=True)
    history_title = fields.String(required=True)
    history_message = fields.String(required=True)
    timestamp = fields.String(required=True)
    history_type = fields.Enum(CANHistoryType)


class GetHistoryListQueryParametersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    can_id = fields.Integer(required=True)
    limit = fields.Integer(default=10, allow_none=True)
    offset = fields.Integer(default=0, allow_none=True)
