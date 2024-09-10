from marshmallow import Schema, fields

from cans import CANSchema
from models import PortfolioStatus
from users import SafeUserSchema


class PortfolioUrlSchema(Schema):
    id = fields.Integer(required=True)
    portfolio_id = fields.Integer(required=True)
    url = fields.String()
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema, allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema, allow_none=True)


class PortfolioSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    abbreviation = fields.String()
    status = fields.Enum(PortfolioStatus)
    cans = fields.Nested(CANSchema)
    division_id = fields.Integer(required=True)
    urls = fields.List(fields.Nested(PortfolioUrlSchema), default=[])
    team_leaders = fields.List(fields.Nested(SafeUserSchema), default=[])
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema, allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema, allow_none=True)
