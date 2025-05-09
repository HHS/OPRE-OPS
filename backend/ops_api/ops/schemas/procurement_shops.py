from marshmallow import Schema, fields


class ProcurementShopSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbr = fields.String(required=True)
    fee = fields.Float(load_default=0.0, dump_default=0.0)
