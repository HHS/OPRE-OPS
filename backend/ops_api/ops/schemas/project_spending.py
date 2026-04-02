from marshmallow import Schema, fields


class SpendingTypeBreakdownSchema(Schema):
    """Schema for spending type breakdown by fiscal year"""

    contract = fields.Decimal(as_string=True, required=True)
    grant = fields.Decimal(as_string=True, required=True)
    partner = fields.Decimal(as_string=True, required=True)
    direct_obligation = fields.Decimal(as_string=True, required=True)


class ProjectSpendingMetadataSchema(Schema):
    """Schema for project spending metadata"""

    total = fields.Decimal(as_string=True, required=True)
    total_by_fiscal_year = fields.Dict(keys=fields.Integer(), values=fields.Decimal(as_string=True), required=True)
    spending_type_by_fiscal_year = fields.Dict(
        keys=fields.Integer(), values=fields.Nested(SpendingTypeBreakdownSchema), required=True
    )
    agreements_by_fy = fields.Dict(keys=fields.Integer(), values=fields.List(fields.Integer()), required=True)
