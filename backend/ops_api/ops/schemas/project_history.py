from marshmallow import Schema, fields

from models import ProjectHistoryType
from ops_api.ops.schemas.pagination import PaginationSchema


class ProjectHistoryItemSchema(Schema):
    id = fields.Integer(required=True)
    project_id = fields.Integer(allow_none=True)
    project_id_record = fields.Integer(required=True)
    ops_event_id = fields.Integer(allow_none=True)
    history_title = fields.String(required=True)
    history_message = fields.String(required=True)
    timestamp = fields.String(required=True)
    history_type = fields.Enum(ProjectHistoryType)


class GetProjectHistoryListQueryParametersSchema(PaginationSchema):
    sort_asc = fields.Boolean(load_default=False, dump_default=False)
