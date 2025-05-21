from marshmallow import Schema, fields


class ProcurementShopFeeSchema(Schema):
    id = fields.Integer(required=True)
    procurement_shop = fields.Nested("ProcurementShopSchema", required=True)
    fee = fields.Float(required=True)
    start_date = fields.Date()
    end_date = fields.Date()


class ProcurementShopSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbr = fields.String(required=True)
    # fee = fields.Float(default=0.0)
