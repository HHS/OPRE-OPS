from marshmallow import Schema, fields

from models import CANHistoryType
from ops_api.ops.schemas.pagination import PaginationSchema


class CANHistoryItemSchema(Schema):
    id = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    ops_event_id = fields.Integer(required=True)
    history_title = fields.String(required=True)
    history_message = fields.String(required=True)
    timestamp = fields.String(required=True)
    history_type = fields.Enum(CANHistoryType)


class GetHistoryListQueryParametersSchema(PaginationSchema):
    can_id = fields.Integer(required=True)
    fiscal_year = fields.Integer(load_default=0, dump_default=0)
    sort_asc = fields.Boolean(load_default=False, dump_default=False)
