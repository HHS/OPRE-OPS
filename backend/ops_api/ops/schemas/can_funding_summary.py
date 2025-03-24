from decimal import Decimal

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


if __name__ == "__main__":
    data = {
        "available_funding": Decimal("3340000.00"),
        "cans": [
            {
                "can": {
                    "active_period": 1,
                    "appropriation_date": 2023,
                    "budget_line_items": [15019],
                    "created_by": None,
                    "created_by_user": None,
                    "created_on": "2025-03-21T20:31:35.329924Z",
                    "description": "Healthy Marriages Responsible Fatherhood - OPRE",
                    "display_name": "G99HRF2",
                    "expiration_date": 2024,
                    "funding_budgets": [
                        {
                            "budget": "1140000.0",
                            "can": 500,
                            "can_id": 500,
                            "created_by": None,
                            "created_by_user": None,
                            "created_on": "2025-03-21T20:31:35.356666Z",
                            "display_name": "CANFundingBudget#1",
                            "fiscal_year": 2023,
                            "id": 1,
                            "notes": None,
                            "updated_by": None,
                            "updated_by_user": None,
                            "updated_on": "2025-03-21T20:31:35.356666Z",
                            "versions": [...],
                        }
                    ],
                    "funding_details": {
                        "allotment": None,
                        "allowance": None,
                        "appropriation": None,
                        "created_by": None,
                        "created_by_user": None,
                        "created_on": "2025-03-21T20:31:35.300103Z",
                        "display_name": "CANFundingDetails#1",
                        "fiscal_year": 2023,
                        "fund_code": "AAXXXX20231DAD",
                        "funding_partner": None,
                        "funding_source": "OPRE",
                        "id": 1,
                        "method_of_transfer": "DIRECT",
                        "sub_allowance": None,
                        "updated_by": None,
                        "updated_by_user": None,
                        "updated_on": "2025-03-21T20:31:35.300103Z",
                    },
                    "funding_details_id": 1,
                    "funding_received": [
                        {
                            "can": 500,
                            "can_id": 500,
                            "created_by": None,
                            "created_by_user": None,
                            "created_on": "2025-03-21T20:31:35.428869Z",
                            "display_name": "CANFundingReceived#500",
                            "fiscal_year": 2023,
                            "funding": "880000.0",
                            "id": 500,
                            "notes": None,
                            "updated_by": None,
                            "updated_by_user": None,
                            "updated_on": "2025-03-21T20:31:35.428869Z",
                        }
                    ],
                    "id": 500,
                    "nick_name": "HMRF-OPRE",
                    "number": "G99HRF2",
                    "portfolio": 6,
                    "portfolio_id": 6,
                    "projects": [1000],
                    "updated_by": None,
                    "updated_by_user": None,
                    "updated_on": "2025-03-21T20:31:35.329924Z",
                    "versions": [{"id": 500, "transaction_id": 202}],
                },
                "carry_forward_label": " Carry-Forward",
                "expiration_date": "10/01/2024",
            }
        ],
        "carry_forward_funding": Decimal("10000000.0"),
        "expected_funding": Decimal("4260000.0"),
        "in_draft_funding": Decimal("0"),
        "in_execution_funding": Decimal("4000000.00"),
        "new_funding": Decimal("1340000.0"),
        "obligated_funding": Decimal("3000000.00"),
        "planned_funding": Decimal("1000000.00"),
        "received_funding": Decimal("7080000.0"),
        "total_funding": Decimal("11340000.0"),
    }

    schema = GetCANFundingSummaryResponseSchema()
    result = schema.dump(data)
    print(result)
