from marshmallow import Schema, fields


class RequestSchema(Schema):
    fiscal_year = fields.Integer(allow_none=True)


class FundingLineItem(Schema):
    amount = fields.Float(required=True)
    percent = fields.String(required=True)


class ResponseSchema(Schema):
    total_funding = fields.Nested(FundingLineItem)
    carry_forward_funding = fields.Nested(FundingLineItem)
    planned_funding = fields.Nested(FundingLineItem)
    obligated_funding = fields.Nested(FundingLineItem)
    in_execution_funding = fields.Nested(FundingLineItem)
    available_funding = fields.Nested(FundingLineItem)
    draft_funding = fields.Nested(FundingLineItem)
    new_funding = fields.Nested(FundingLineItem)
