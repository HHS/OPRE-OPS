from marshmallow import Schema, fields


class ProcurementShopFeeSchema(Schema):
    id = fields.Integer(required=True)
    procurement_shop = fields.Nested(
        "ops_api.ops.schemas.procurement_shops.ProcurementShopSchema",
        required=True,
        only=("id", "name", "abbr", "fee_percentage"),
    )
    fee = fields.Float(required=True)
    start_date = fields.Date()
    end_date = fields.Date()


class ProcurementShopSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbr = fields.String(required=True)
    procurement_shop_fees = fields.List(fields.Nested(ProcurementShopFeeSchema), required=True)
    fee_percentage = fields.Float(required=True)
    current_fee = fields.Nested(ProcurementShopFeeSchema, required=True)
