from __future__ import annotations

import typing

from marshmallow import EXCLUDE, Schema, fields
from marshmallow.experimental.context import Context
from marshmallow.validate import Range
from models import AgreementType, BudgetLineItemStatus, BudgetLineSortCondition
from ops_api.ops.schemas.change_requests import BudgetLineItemChangeRequestResponseSchema


def is_blank(value) -> bool:
    if isinstance(value, str):
        return (not value) or (value and len(value.strip()) == 0)
    else:
        return not value


class ContextDict(typing.TypedDict):
    id: int
    method: str


def get_context_value(key: str) -> typing.Any:
    """Get a value from the context dictionary."""
    context_dict = Context[ContextDict].get(default={"method": None, "id": None})
    return context_dict.get(key)


class RequestBodySchema(Schema):
    """
    Base schema for request bodies related to budget line items.

    services_component_id and clin_id are optional fields (based on type) and so do not have load_default=None

    requestor_notes isn't a field in the model, but is used on a potential change request generated as a side effect.
    """

    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    status = fields.Enum(
        BudgetLineItemStatus,
        allow_none=True,
        load_default=None,
    )
    line_description = fields.Str(allow_none=True, load_default=None)
    can_id = fields.Int(allow_none=True, load_default=None)
    amount = fields.Float(allow_none=True, load_default=None)
    date_needed = fields.Date(allow_none=True, load_default=None)
    comments = fields.Str(allow_none=True, load_default=None)
    proc_shop_fee_percentage = fields.Float(allow_none=True, load_default=None)
    services_component_id = fields.Int(allow_none=True)
    clin_id = fields.Int(allow_none=True)
    requestor_notes = fields.Str(allow_none=True)


class POSTRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(required=True)


class PATCHRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(dump_default=None, allow_none=True, required=False)


class PUTRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(required=True)
    services_component_id = fields.Int(allow_none=True, load_default=None)
    clin_id = fields.Int(allow_none=True, load_default=None)


class MetaSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    limit = fields.Integer(load_default=None, dump_default=None, required=False)
    offset = fields.Integer(load_default=None, dump_default=None, required=False)
    number_of_pages = fields.Integer(load_default=None, dump_default=None, required=False)
    total_count = fields.Integer(load_default=None, dump_default=None, required=False)
    query_parameters = fields.String(load_default=None, dump_default=None, required=False)
    total_amount = fields.Float(load_default=None, dump_default=None, required=False)
    total_draft_amount = fields.Float(load_default=None, dump_default=None, required=False)
    total_planned_amount = fields.Float(load_default=None, dump_default=None, required=False)
    total_in_execution_amount = fields.Float(load_default=None, dump_default=None, required=False)
    total_obligated_amount = fields.Float(load_default=None, dump_default=None, required=False)
    total_overcome_by_events_amount = fields.Float(load_default=None, dump_default=None, required=False)
    isEditable = fields.Bool(dump_default=False, required=True)


class QueryParametersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    fiscal_year = fields.List(fields.Integer(), required=False)
    budget_line_status = fields.List(fields.String(), required=False)
    portfolio = fields.List(fields.Integer(), required=False)
    can_id = fields.List(fields.Integer(), required=False)
    agreement_id = fields.List(fields.Integer(), required=False)
    status = fields.List(fields.String(), required=False)
    only_my = fields.List(fields.Boolean(), required=False)
    include_fees = fields.List(fields.Boolean(), required=False)
    limit = fields.List(
        fields.Integer(
            load_default=None,
            dump_default=None,
            validate=Range(min=1, error="Limit must be greater than 1"),
            allow_none=True,
        )
    )
    offset = fields.List(
        fields.Integer(
            load_default=None,
            dump_default=None,
            validate=Range(min=0, error="Offset must be greater than 0"),
            allow_none=True,
        )
    )
    sort_conditions = fields.List(fields.Enum(BudgetLineSortCondition), required=False)
    sort_descending = fields.List(fields.Boolean(), required=False)


class BLIFiltersQueryParametersSchema(Schema):
    only_my = fields.List(fields.Boolean(), required=False)


class BLITeamMembersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    full_name = fields.Str(load_default=None, dump_default=None, allow_none=True)
    email = fields.Str(load_default=None, dump_default=None, allow_none=True)


class PortfolioTeamLeadersSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    full_name = fields.Str(dump_default=None, load_default=None, allow_none=True)
    email = fields.Str(dump_default=None, load_default=None, allow_none=True)


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


class PortfolioBLISchema(Schema):
    division_id = fields.Int(required=True)
    division = fields.Nested(DivisionSchema(), load_default=[], dump_default=[])


class BudgetLineItemCANSchema(Schema):
    id = fields.Int(required=True)
    portfolio = fields.Nested(PortfolioBLISchema())
    display_name = fields.Str(required=True)
    number = fields.Str(required=True)
    description = fields.Str(required=True)
    nick_name = fields.Str(required=True)
    active_period = fields.Int(required=True)
    funding_method = fields.String(allow_none=True)
    funding_frequency = fields.String(allow_none=True)
    funding_type = fields.String(allow_none=True)
    portfolio_id = fields.Int(required=True)
    expiration_date = fields.Int(required=True)
    appropriation_date = fields.Int(required=True)


class SimpleProjectSchema(Schema):
    id = fields.Int(required=True)
    title = fields.Str(required=True)


class SimpleAgreementSchema(Schema):
    id = fields.Integer(required=True)
    agreement_type = fields.String(allow_none=False)
    name = fields.String(allow_none=False)
    awarding_entity_id = fields.Integer(allow_none=True)
    project = fields.Nested(SimpleProjectSchema, required=True)


class BudgetLineItemResponseSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
    budget_line_item_type = fields.Enum(
        AgreementType,
        required=True,
        allow_none=False,
    )
    agreement_id = fields.Int(required=True)
    can = fields.Nested(BudgetLineItemCANSchema(), required=True)
    can_id = fields.Int(required=True)
    services_component_id = fields.Int(load_default=None, dump_default=None, allow_none=True)
    amount = fields.Float(required=True)
    line_description = fields.Str(required=True)
    status = fields.Enum(BudgetLineItemStatus, required=True)
    is_obe = fields.Bool(required=True)
    comments = fields.Str(load_default=None, dump_default=None, allow_none=True)
    proc_shop_fee_percentage = fields.Float(load_default=None, dump_default=None, allow_none=True)
    date_needed = fields.Date(required=True)
    portfolio_id = fields.Int(load_default=None, dump_default=None, allow_none=True)
    fiscal_year = fields.Int(load_default=None, dump_default=None, allow_none=True)
    team_members = fields.Nested(BLITeamMembersSchema, many=True, load_default=None, dump_default=None, allow_none=True)
    portfolio_team_leaders = fields.Nested(
        PortfolioTeamLeadersSchema, many=True, load_default=None, dump_default=None, allow_none=True
    )
    in_review = fields.Bool(required=True)
    change_requests_in_review = fields.Nested(
        BudgetLineItemChangeRequestResponseSchema, many=True, load_default=None, dump_default=None, allow_none=True
    )
    agreement = fields.Nested(SimpleAgreementSchema, required=True)
    procurement_shop_fee = fields.Nested(
        "ops_api.ops.schemas.procurement_shops.ProcurementShopFeeSchema", required=True, allow_none=True
    )
    fees = fields.Float(required=True)
    procurement_shop_fee_id = fields.Int(allow_none=True, required=False)
    created_by = fields.Int(required=True)
    updated_by = fields.Int(required=True)
    created_on = fields.DateTime(required=True)
    updated_on = fields.DateTime(required=True)

    _meta = fields.Nested(MetaSchema, required=True)


class BudgetLineItemListFilterOptionResponseSchema(Schema):
    fiscal_years = fields.List(fields.Int(), required=True)
    statuses = fields.List(fields.String(), required=True)
    portfolios = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
