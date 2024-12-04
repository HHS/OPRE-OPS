from marshmallow import Schema, fields
from models import CANFundingSource, CANMethodOfTransfer, PortfolioStatus
from ops_api.ops.schemas.budget_line_items import BudgetLineItemResponseSchema
from ops_api.ops.schemas.projects import ProjectSchema
from ops_api.ops.schemas.users import SafeUserSchema


class GetCANListRequestSchema(Schema):
    search = fields.String(allow_none=True)


class CreateUpdateCANRequestSchema(Schema):
    nick_name = fields.String(load_default=None)
    number = fields.String(required=True)
    description = fields.String(allow_none=True, load_default=None)
    portfolio_id = fields.Integer(required=True)
    funding_details_id = fields.Integer(allow_none=True, load_default=None)


class BasicCANSchema(Schema):
    active_period = fields.Integer(allow_none=True)
    funding_method = fields.String(allow_none=True)
    funding_frequency = fields.String(allow_none=True)
    funding_type = fields.String(allow_none=True)
    display_name = fields.String(allow_none=True)
    nick_name = fields.String(allow_none=True)
    number = fields.String(required=True)
    description = fields.String(allow_none=True)
    id = fields.Integer(required=True)
    portfolio_id = fields.Integer(required=True)
    obligate_by = fields.Integer(allow_none=True)
    projects = fields.List(fields.Nested(ProjectSchema()), default=[])


class PortfolioUrlCANSchema(Schema):
    id = fields.Integer(required=True)
    portfolio_id = fields.Integer(required=True)
    url = fields.String(required=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class PortfolioCANSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    abbreviation = fields.String(required=True)
    status = fields.Enum(PortfolioStatus)
    division_id = fields.Integer(required=True)
    urls = fields.List(fields.Nested(PortfolioUrlCANSchema()), default=[])
    team_leaders = fields.List(fields.Nested(SafeUserSchema()), default=[])
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class FundingBudgetVersionSchema(Schema):
    budget = fields.Float(allow_none=True)
    can = fields.Nested(BasicCANSchema())
    can_id = fields.Integer(required=True)
    display_name = fields.String(allow_none=True)
    fiscal_year = fields.Integer(required=True)
    id = fields.Integer()
    notes = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema())
    updated_by_user = fields.Nested(SafeUserSchema())
    transaction_id = fields.Integer()
    end_transaction_id = fields.Integer()
    operation_type = fields.Integer()


class FundingBudgetSchema(Schema):
    budget = fields.Float(allow_none=True)
    can = fields.Nested(BasicCANSchema())
    can_id = fields.Integer(required=True)
    display_name = fields.String(allow_none=True)
    fiscal_year = fields.Integer(required=True)
    id = fields.Integer()
    notes = fields.String(allow_none=True)
    versions = fields.List(fields.Nested(FundingBudgetVersionSchema()), default=[])
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class CreateUpdateFundingBudgetSchema(Schema):
    fiscal_year = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    budget = fields.Float(load_default=None)
    notes = fields.String(load_default=None)


class CreateUpdateFundingDetailsSchema(Schema):
    allotment = fields.String(allow_none=True, load_default=None)
    allowance = fields.String(allow_none=True, load_default=None)
    display_name = fields.String(allow_none=True, load_default=None)
    fiscal_year = fields.Integer(required=True)
    fund_code = fields.String(required=True)
    funding_partner = fields.String(allow_none=True, load_default=None)
    funding_source = fields.Enum(CANFundingSource, allow_none=True, load_default=None)
    method_of_transfer = fields.Enum(CANMethodOfTransfer, allow_none=True, load_default=None)
    sub_allowance = fields.String(allow_none=True, load_default=None)


class FundingDetailsSchema(Schema):
    active_period = fields.Integer(allow_none=True)
    funding_method = fields.String(allow_none=True)
    funding_received = fields.String(allow_none=True)
    funding_type = fields.String(allow_none=True)
    allotment = fields.String(allow_none=True)
    allowance = fields.String(allow_none=True)
    display_name = fields.String(allow_none=True)
    fiscal_year = fields.Integer(required=True)
    fund_code = fields.String(required=True)
    funding_partner = fields.String(allow_none=True)
    funding_source = fields.Enum(CANFundingSource, allow_none=True)
    id = fields.Integer(required=True)
    method_of_transfer = fields.Enum(CANMethodOfTransfer, allow_none=True)
    obligate_by = fields.Integer(allow_none=True)
    sub_allowance = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class FundingReceivedSchema(Schema):
    can = fields.Nested(BasicCANSchema())
    can_id = fields.Integer(required=True)
    display_name = fields.String(allow_none=True)
    fiscal_year = fields.Integer(required=True)
    funding = fields.Float(allow_none=True)
    id = fields.Integer(required=True)
    notes = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class CreateUpdateFundingReceivedSchema(Schema):
    fiscal_year = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    funding = fields.Integer(load_default=None)
    notes = fields.String(load_default=None)


class CANSchema(BasicCANSchema):
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema()), default=[])
    funding_budgets = fields.List(fields.Nested(FundingBudgetSchema()), default=[])
    funding_details = fields.Nested(FundingDetailsSchema())
    funding_details_id = fields.Integer(allow_none=True)
    funding_received = fields.List(fields.Nested(FundingReceivedSchema()), default=[])
    # Exclude all CANs that are normally attached to a portfolio
    portfolio = fields.Nested(PortfolioCANSchema(), allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
