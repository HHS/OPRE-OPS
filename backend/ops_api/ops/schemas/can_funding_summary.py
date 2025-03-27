from marshmallow import Schema, fields
from ops_api.ops.schemas.cans import BasicCANSchema


class GetCANFundingSummaryRequestSchema(Schema):
    can_ids = fields.List(fields.String(), required=True)
    fiscal_year = fields.String(allow_none=True)
    active_period = fields.List(fields.Integer(), allow_none=True)
    transfer = fields.List(fields.String(), allow_none=True)
    portfolio = fields.List(fields.String(), allow_none=True)
    fy_budget = fields.List(fields.Integer(), allow_none=True)


class SimpleFundingReceivedSchema(Schema):
    can_id = fields.Integer(required=True)
    display_name = fields.String(required=True)
    fiscal_year = fields.Integer(required=True)
    funding = fields.Decimal(as_string=False, required=True)
    id = fields.Integer(required=True)
    notes = fields.String(allow_none=True)


class SimpleFundingDetailsSchema(Schema):
    allotment = fields.String(allow_none=True)
    allowance = fields.String(allow_none=True)
    appropriation = fields.String(allow_none=True)
    display_name = fields.String(required=True)
    fiscal_year = fields.Integer(required=True)
    fund_code = fields.String(required=True)
    funding_partner = fields.String(allow_none=True)
    funding_source = fields.String(required=True)
    id = fields.Integer(required=True)
    method_of_transfer = fields.String(allow_none=True)
    sub_allowance = fields.String(allow_none=True)


class SimpleFundingBudgetSchema(Schema):
    budget = fields.Decimal(as_string=False, required=True)
    can_id = fields.Integer(required=True)
    display_name = fields.String(required=True)
    fiscal_year = fields.Integer(required=True)
    id = fields.Integer(required=True)
    notes = fields.String(allow_none=True)


class SimpleCANSchema(BasicCANSchema):
    appropriation_date = fields.Integer(required=True)
    expiration_date = fields.Integer(required=True)
    funding_budgets = fields.List(fields.Nested(SimpleFundingBudgetSchema), required=True)
    funding_details = fields.Nested(SimpleFundingDetailsSchema, required=True)
    funding_details_id = fields.Integer(required=True)
    funding_received = fields.List(fields.Nested(SimpleFundingReceivedSchema), required=True)
    portfolio = fields.Integer(required=True)


class CANsFundingSourceSchema(Schema):
    can = fields.Nested(SimpleCANSchema, required=True)
    carry_forward_label = fields.String(allow_none=True)
    expiration_date = fields.String(allow_none=True)


class GetCANFundingSummaryResponseSchema(Schema):
    available_funding = fields.Float(allow_none=True)
    cans = fields.List(fields.Nested(CANsFundingSourceSchema()), default=[])
    carry_forward_funding = fields.Float(allow_none=True)
    expected_funding = fields.Float(allow_none=True)
    in_draft_funding = fields.Float(allow_none=True)
    in_execution_funding = fields.Float(allow_none=True)
    new_funding = fields.Float(allow_none=True)
    obligated_funding = fields.Float(allow_none=True)
    planned_funding = fields.Float(allow_none=True)
    received_funding = fields.Float(allow_none=True)
    total_funding = fields.Float(allow_none=True)
