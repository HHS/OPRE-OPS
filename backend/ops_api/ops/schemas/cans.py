from marshmallow import Schema, fields, pre_load

from models import (
    CANFundingSource,
    CANMethodOfTransfer,
    CANSortCondition,
    PortfolioStatus,
)
from ops_api.ops.schemas.budget_line_items import BudgetLineItemResponseSchema
from ops_api.ops.schemas.pagination import PaginationListSchema
from ops_api.ops.schemas.projects import ProjectSchema
from ops_api.ops.schemas.users import SafeUserSchema


class CANFiltersQueryParametersSchema(Schema):
    fiscal_year = fields.List(fields.Integer(), required=False)


class CANListFilterOptionResponseSchema(Schema):
    portfolios = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    can_numbers = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    fy_budget_range = fields.Dict(keys=fields.String(), values=fields.Float(), required=True)


class GetCANListRequestSchema(PaginationListSchema):
    search = fields.List(fields.String(), required=False)
    fiscal_year = fields.List(fields.Integer(), required=False)
    sort_conditions = fields.List(fields.Enum(CANSortCondition), required=False)
    sort_descending = fields.List(fields.Boolean(), required=False)
    # Filter parameters
    active_period = fields.List(fields.Integer(), required=False)
    transfer = fields.List(fields.String(), required=False)
    portfolio = fields.List(fields.String(), required=False)
    portfolio_id = fields.List(fields.Integer(), required=False)
    can_ids = fields.List(fields.Integer(), required=False)
    # Single-value filters (wrapped in List due to Flask query param parsing with flat=False)
    budget_min = fields.List(fields.Float(), required=False)
    budget_max = fields.List(fields.Float(), required=False)


class CreateUpdateCANRequestSchema(Schema):
    nick_name = fields.String(required=True)
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
    projects = fields.List(fields.Nested(ProjectSchema()), load_default=[], dump_default=[])
    is_expired = fields.Boolean(allow_none=True)


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


class CreateUpdatePortfolioUrlSchema(Schema):
    portfolio_id = fields.Integer(required=True)
    url = fields.String(required=True)


class DivisionSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    abbreviation = fields.String(required=True)
    division_director_id = fields.Integer(required=True)
    deputy_division_director_id = fields.Integer(required=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class PortfolioCANSchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    abbreviation = fields.String(required=True)
    status = fields.Enum(PortfolioStatus)
    division = fields.Nested(DivisionSchema(), load_default=[], dump_default=[])
    division_id = fields.Integer(required=True)
    team_leaders = fields.List(fields.Nested(SafeUserSchema()), load_default=[], dump_default=[])


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
    versions = fields.List(fields.Nested(FundingBudgetVersionSchema()), load_default=[], dump_default=[])
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class FundingBudgetListSchema(Schema):
    """Lightweight schema for list endpoint with only fields used by frontend.

    Excludes expensive nested relationships (can, versions, created_by_user, updated_by_user)
    to eliminate N+1 query problems. Preserves audit timestamps for debugging.
    """

    id = fields.Integer()
    can_id = fields.Integer(required=True)
    fiscal_year = fields.Integer(required=True)
    budget = fields.Float(allow_none=True)
    notes = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class CreateUpdateFundingBudgetSchema(Schema):
    fiscal_year = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    budget = fields.Float(required=True)
    notes = fields.String(load_default=None)


class CreateUpdateFundingDetailsSchema(Schema):
    allotment = fields.String(allow_none=True, load_default=None)
    allowance = fields.String(allow_none=True, load_default=None)
    appropriation = fields.String(allow_none=True, load_default=None)
    display_name = fields.String(allow_none=True, load_default=None)
    fiscal_year = fields.Integer(required=True)
    fund_code = fields.String(required=True)
    funding_partner = fields.String(allow_none=True, load_default=None)
    funding_source = fields.Enum(CANFundingSource, allow_none=True, load_default=None)
    method_of_transfer = fields.Enum(CANMethodOfTransfer, allow_none=True, load_default=None)
    sub_allowance = fields.String(allow_none=True, load_default=None)


class FundingDetailsListSchema(Schema):
    """Lightweight schema for list endpoint with only fields used by frontend.

    Excludes expensive nested relationships (created_by_user, updated_by_user)
    to eliminate N+1 query problems. Preserves audit timestamps for debugging.
    """

    id = fields.Integer(required=True)
    fiscal_year = fields.Integer(required=True)
    fund_code = fields.String(required=True)
    active_period = fields.Integer(allow_none=True)
    funding_method = fields.String(allow_none=True)
    funding_received = fields.String(allow_none=True)
    funding_type = fields.String(allow_none=True)
    allotment = fields.String(allow_none=True)
    allowance = fields.String(allow_none=True)
    appropriation = fields.String(allow_none=True)
    display_name = fields.String(allow_none=True)
    funding_partner = fields.String(allow_none=True)
    funding_source = fields.Enum(CANFundingSource, allow_none=True)
    method_of_transfer = fields.Enum(CANMethodOfTransfer, allow_none=True)
    obligate_by = fields.Integer(allow_none=True)
    sub_allowance = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class FundingDetailsSchema(Schema):
    active_period = fields.Integer(allow_none=True)
    funding_method = fields.String(allow_none=True)
    funding_received = fields.String(allow_none=True)
    funding_type = fields.String(allow_none=True)
    allotment = fields.String(allow_none=True)
    allowance = fields.String(allow_none=True)
    appropriation = fields.String(allow_none=True)
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


class FundingReceivedListSchema(Schema):
    """Lightweight schema for list endpoint with only fields used by frontend.

    Excludes expensive nested relationships (can, created_by_user, updated_by_user)
    to eliminate N+1 query problems. Preserves audit timestamps for debugging.
    """

    id = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    fiscal_year = fields.Integer(required=True)
    funding = fields.Float(allow_none=True)
    notes = fields.String(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class CreateUpdateFundingReceivedSchema(Schema):
    fiscal_year = fields.Integer(required=True)
    can_id = fields.Integer(required=True)
    funding = fields.Decimal(required=True, places=2)
    notes = fields.String(load_default=None)


class CANSchema(BasicCANSchema):
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema), load_default=[], dump_default=[])
    funding_budgets = fields.List(fields.Nested(FundingBudgetSchema()), load_default=[], dump_default=[])
    funding_details = fields.Nested(FundingDetailsSchema())
    funding_details_id = fields.Integer(allow_none=True)
    funding_received = fields.List(fields.Nested(FundingReceivedSchema()), load_default=[], dump_default=[])
    # Exclude all CANs that are normally attached to a portfolio
    portfolio = fields.Nested(PortfolioCANSchema, allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)


class CANFundingRequestSchema(Schema):
    fiscal_year = fields.Integer(required=False, load_default=None)


class CANFundingAmountsSchema(Schema):
    total_funding = fields.Float(allow_none=True)
    available_funding = fields.Float(allow_none=True)
    carry_forward_funding = fields.Float(allow_none=True)
    new_funding = fields.Float(allow_none=True)
    expected_funding = fields.Float(allow_none=True)
    received_funding = fields.Float(allow_none=True)
    planned_funding = fields.Float(allow_none=True)
    obligated_funding = fields.Float(allow_none=True)
    in_execution_funding = fields.Float(allow_none=True)
    in_draft_funding = fields.Float(allow_none=True)


class CANFundingByFiscalYearSchema(Schema):
    fiscal_year = fields.Int(required=True)
    amount = fields.Float(required=True)


class CANFundingCANDetailSchema(Schema):
    id = fields.Int(required=True)
    number = fields.String(required=True)
    nick_name = fields.String(allow_none=True)
    portfolio_id = fields.Int(required=True)
    portfolio = fields.String(allow_none=True)
    active_period = fields.Int(allow_none=True)
    carry_forward_label = fields.String(allow_none=True)
    expiration_date = fields.String(allow_none=True)


class CANFundingResponseSchema(Schema):
    fiscal_year = fields.Int(required=True)
    funding = fields.Nested(CANFundingAmountsSchema)
    funding_by_fiscal_year = fields.List(fields.Nested(CANFundingByFiscalYearSchema))
    can = fields.Nested(CANFundingCANDetailSchema)


class CANsFundingAggregateRequestSchema(Schema):
    fiscal_year = fields.Integer(required=False, load_default=None)
    active_period = fields.List(fields.Integer(), allow_none=True, load_default=[], dump_default=[])
    transfer = fields.List(fields.String(), allow_none=True, load_default=[], dump_default=[])
    portfolio = fields.List(fields.String(), allow_none=True, load_default=[], dump_default=[])
    fy_budget = fields.List(fields.Decimal(), allow_none=True, load_default=[], dump_default=[])

    @pre_load
    def process_flask_args(self, data, **kwargs):
        """Convert Flask's ImmutableMultiDict to proper format for Marshmallow."""
        if hasattr(data, "getlist"):
            processed = {}
            list_fields = ["active_period", "transfer", "portfolio", "fy_budget"]
            for key in data.keys():
                if key in list_fields:
                    processed[key] = data.getlist(key)
                else:
                    processed[key] = data.get(key)
            return processed
        return data


class CANsFundingAggregateResponseSchema(Schema):
    fiscal_year = fields.Int(allow_none=True)
    funding = fields.Nested(CANFundingAmountsSchema)
    cans = fields.List(fields.Nested(CANFundingCANDetailSchema))


class CANListSchema(BasicCANSchema):
    budget_line_items = fields.List(
        fields.Nested(BudgetLineItemResponseSchema, only=["id"]),
        load_default=[],
        dump_default=[],
    )
    funding_budgets = fields.List(fields.Nested(FundingBudgetSchema()), load_default=[], dump_default=[])
    funding_details = fields.Nested(FundingDetailsSchema())
    funding_details_id = fields.Integer(allow_none=True)
    funding_received = fields.List(fields.Nested(FundingReceivedSchema()), load_default=[], dump_default=[])
    # Exclude all CANs that are normally attached to a portfolio
    portfolio = fields.Nested(PortfolioCANSchema, allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
    updated_by_user = fields.Nested(SafeUserSchema(), allow_none=True)
