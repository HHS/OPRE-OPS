from marshmallow import Schema, fields

from ops_api.ops.schemas.pagination import PaginationSchema


class SpecialTopicsSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)


class SpecialTopicsRequestSchema(PaginationSchema):
    # No additional fields are needed for now
    pass
