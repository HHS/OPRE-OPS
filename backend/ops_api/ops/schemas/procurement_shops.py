from marshmallow import Schema, fields


class ProcurementShopSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbr = fields.String(required=True)
    fee = fields.Float(default=0.0)
