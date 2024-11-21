from marshmallow import Schema, fields, validate
from ops_api.ops.schemas.cans import CANSchema


class FiscalYearBudgetSchema(Schema):
    min_fy_budget = fields.Integer(allow_none=True)
    max_fy_budget = fields.Integer(allow_none=True)


class GetCANFundingSummaryRequestSchema(Schema):
    can_ids = fields.List(fields.Integer(), required=False)
    fiscal_year = fields.String(allow_none=True)
    active_period = fields.List(fields.Integer(), allow_none=True)
    transfer = fields.List(
        fields.String(validate=validate.OneOf(["DIRECT", "COST_SHARE", "IAA", "IDDA"])), allow_none=True
    )
    portfolio = fields.List(fields.String(), allow_none=True)
    fy_budget = fields.List(fields.Integer(), min_items=2, max_items=2, allow_none=True)


class CANSFundingSourceSchema(Schema):
    can = fields.Nested(CANSchema())
    carry_forward_label = fields.String(allow_none=False)
    expiration_date = fields.String(allow_none=False)


class CANFundingSummaryResponseSchema(Schema):
    available_funding = fields.String(allow_none=False)
    cans = fields.Nested(CANSFundingSourceSchema())
    carry_forward_funding = fields.String(allow_none=False)
    received_funding = fields.String(allow_none=False)
    expected_funding = fields.String(allow_none=False)
    in_draft_funding = fields.String(allow_none=False)
    in_execution_funding = fields.String(allow_none=False)
    obligated_funding = fields.String(allow_none=False)
    planned_funding = fields.String(allow_none=False)
    total_funding = fields.String(allow_none=False)
    new_funding = fields.String(allow_none=False)
