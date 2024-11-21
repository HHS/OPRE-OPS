from marshmallow import Schema, fields
from ops_api.ops.schemas.cans import BasicCANSchema


class CANSFundingSourceSchema(Schema):
    can = fields.Nested(BasicCANSchema())
    carry_forward_label = fields.String(allow_none=True)
    expiration_date = fields.String(allow_none=True)


class GetCANFundingSummaryResponseSchema(Schema):
    available_funding = fields.String(allow_none=True)
    cans = fields.List(fields.Nested(CANSFundingSourceSchema), default=[])
    carry_forward_funding = fields.String(allow_none=True)
    received_funding = fields.String(allow_none=True)
    expected_funding = fields.String(allow_none=True)
    in_draft_funding = fields.String(allow_none=True)
    in_execution_funding = fields.String(allow_none=True)
    obligated_funding = fields.String(allow_none=True)
    planned_funding = fields.String(allow_none=True)
    total_funding = fields.String(allow_none=True)
    new_funding = fields.String(allow_none=True)
