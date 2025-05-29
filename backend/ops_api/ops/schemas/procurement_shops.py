from marshmallow import Schema, fields


class ProcurementShopFeeSchema(Schema):
    id = fields.Integer(required=True)
    procurement_shop_id = fields.Integer(required=True)
    procurement_shop = fields.Nested(
        "ops_api.ops.schemas.procurement_shops.ProcurementShopSchema",
        required=True,
        only=("id", "name", "abbr", "fee_percentage"),
    )
    fee = fields.Float(required=True)
    start_date = fields.Date(allow_none=True)
    end_date = fields.Date(allow_none=True)
    created_on = fields.DateTime(dump_only=True)
    updated_on = fields.DateTime(dump_only=True)
    created_by = fields.Integer(dump_only=True)
    updated_by = fields.Integer(dump_only=True)


class ProcurementShopSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbr = fields.String(required=True)
    procurement_shop_fees = fields.List(fields.Nested(ProcurementShopFeeSchema), required=True)
    fee_percentage = fields.Float(required=True)
    current_fee = fields.Nested(ProcurementShopFeeSchema, allow_none=True)
    created_on = fields.DateTime(dump_only=True)
    updated_on = fields.DateTime(dump_only=True)
    created_by = fields.Integer(dump_only=True)
    updated_by = fields.Integer(dump_only=True)
