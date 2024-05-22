from marshmallow import Schema, fields


class ProductServiceCodeSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    naics = fields.Integer(allow_none=True)
    support_code = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
