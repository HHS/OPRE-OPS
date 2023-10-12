from marshmallow import Schema, fields


class ProductServiceCodeSchema(Schema):
    id = fields.Integer(required=True)
