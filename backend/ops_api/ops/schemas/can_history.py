from marshmallow import EXCLUDE, Schema, fields
from marshmallow.validate import Range
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
    fiscal_year = fields.Integer(default=0)
    limit = fields.Integer(default=10, validate=Range(min=1, error="Limit must be greater than 0"), allow_none=True)
    offset = fields.Integer(default=0, validate=Range(min=0, error="Limit must be greater than 0"), allow_none=True)
    sort_asc = fields.Boolean(default=False)
