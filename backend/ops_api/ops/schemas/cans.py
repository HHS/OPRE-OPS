from marshmallow import Schema, fields

from budget_line_items import BudgetLineItemCANSchema
from portfolios import PortfolioSchema
from users import SafeUserSchema


class BasicCANSchema(Schema):
    active_period = fields.Integer()
    display_name = fields.String()
    nick_name = fields.String()
    number = fields.String()
    description = fields.String()
    id = fields.String()
    portfolio_id = fields.Integer()
    projects = fields.List(fields.Integer())


class FundingBudgetVersionSchema(Schema):
    budget = fields.Float(allow_none=True)
    can = fields.Nested(BasicCANSchema)
    can_id = fields.Integer(required=True)
    display_name = fields.String(allow_none=True)
    fiscal_year = fields.Integer(required=True)
    id = fields.Integer(required=True)
    notes = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema)
    updated_by_user = fields.Nested(SafeUserSchema)
    transaction_id = fields.Integer()
    end_transaction_id = fields.Integer()
    operation_type = fields.Integer()


class FundingBudgetSchema(Schema):
    budget = fields.Float(allow_none=True)
    can = fields.Nested(BasicCANSchema)
    can_id = fields.Integer(required=True)
    display_name = fields.String(allow_none=True)
    fiscal_year = fields.Integer(required=True)
    id = fields.Integer(required=True)
    notes = fields.String(allow_none=True)
    versions = fields.List(fields.Nested(FundingBudgetVersionSchema), default=[])
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema, allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema, allow_none=True)


class FundingDetailsSchema(Schema):
    allotment = fields.String()
    allowance = fields.String()
    display_name = fields.String()
    fiscal_year = fields.Integer()
    fund_code = fields.String()
    funding_partner = fields.String()
    funding_source = fields.String()
    id = fields.Integer(required=True)
    method_of_transfer = fields.String()
    sub_allowance = fields.String()


class FundingReceivedSchema(Schema):
    can = fields.Nested(BasicCANSchema)
    can_id = fields.Integer()
    display_name = fields.String()
    fiscal_year = fields.Integer()
    funding = fields.Float()
    id = fields.Integer()
    notes = fields.String()
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema, allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema, allow_none=True)


class CANSchema(BasicCANSchema):
    budget_line_items = fields.List(fields.Nested(BudgetLineItemCANSchema), default=[])
    funding_budgets = fields.List(fields.Nested(FundingBudgetSchema), default=[])
    funding_details = fields.List(fields.Nested(FundingDetailsSchema), default=[])
    funding_details_id = fields.Integer()
    funding_received = fields.List(fields.Nested(FundingReceivedSchema), default=[])
    # Exclude all CANs that are normally attached to a portfolio
    portfolio = fields.Nested(PortfolioSchema(exclude=("cans",)))
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema, allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema, allow_none=True)
