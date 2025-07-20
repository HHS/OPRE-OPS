from __future__ import annotations

import typing
from datetime import date

from _decimal import Decimal
from flask import current_app

from marshmallow import EXCLUDE, Schema, ValidationError, fields, validates_schema
from marshmallow.experimental.context import Context
from marshmallow.validate import Range
from models import AgreementReason, BudgetLineItem, BudgetLineItemStatus, BudgetLineSortCondition, ServicesComponent
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
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    status = fields.Enum(BudgetLineItemStatus, dump_default=None, allow_none=True)
    line_description = fields.Str(dump_default=None, allow_none=True)
    can_id = fields.Int(dump_default=None, allow_none=True)
    amount = fields.Float(dump_default=None, allow_none=True)
    date_needed = fields.Date(dump_default=None, allow_none=True)
    comments = fields.Str(dump_default=None, allow_none=True)
    proc_shop_fee_percentage = fields.Float(dump_default=None, allow_none=True)
    services_component_id = fields.Int(dump_default=None, allow_none=True)
    clin_id = fields.Int(dump_default=None, allow_none=True)

    def get_target_status(self, data):
        requested_status = data.get("status") if "status" in data else None
        if requested_status:
            return requested_status
        current_bli = self.get_current_budget_line_item()
        if current_bli:
            return current_bli.status
        return None

    def target_status_is_beyond_draft(self, data):
        target_status = self.get_target_status(data)
        return target_status and target_status != BudgetLineItemStatus.DRAFT

    def status_is_changing_beyond_draft(self, data):
        requested_status = data.get("status") if "status" in data else None
        if not requested_status or requested_status == BudgetLineItemStatus.DRAFT:
            return False
        current_bli = self.get_current_budget_line_item()
        current_status = current_bli.status if current_bli else None
        return requested_status != current_status

    def get_current_budget_line_item(self):
        return current_app.db_session.get(BudgetLineItem, get_context_value("id"))

    def get_target_value(self, key: str, data: dict) -> bool:
        requested_value = data.get(key)
        if get_context_value("method") in ["POST", "PUT"]:
            return requested_value
        if key in data:
            return requested_value
        current_budget_line_item = self.get_current_budget_line_item()
        if current_budget_line_item and hasattr(current_budget_line_item, key):
            return getattr(current_budget_line_item, key)
        return requested_value

    def should_validate_field(self, key: str, data: dict) -> bool:
        if self.status_is_changing_beyond_draft(data):
            return True
        if self.target_status_is_beyond_draft(data) and key in data:
            return True
        return False

    @validates_schema
    def validate_agreement_id(self, data, **kwargs):
        key = "agreement_id"
        if self.status_is_changing_beyond_draft(data):
            target_value = self.get_target_value(key, data)
            if not target_value:
                raise ValidationError("BLI must have an Agreement when status is not DRAFT")

    @validates_schema
    def validate_agreement_project_id(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.project_id:
                raise ValidationError("BLI's Agreement must have a Project when status is not DRAFT")

    @validates_schema
    def validate_agreement_type(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.agreement_type:
                raise ValidationError("BLI's Agreement must have an AgreementType when status is not DRAFT")

    @validates_schema
    def validate_agreement_description(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.description:
                raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")

    @validates_schema
    def validate_agreement_product_service_code(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.product_service_code_id:
                raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")

    @validates_schema
    def validate_agreement_procurement_shop(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.awarding_entity_id:
                raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")

    @validates_schema
    def validate_agreement_reason(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.agreement_reason:
                raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")

    @validates_schema
    def validate_agreement_reason_must_have_vendor(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if (
                bli
                and bli.agreement_id
                and (
                    bli.agreement.agreement_reason == AgreementReason.RECOMPETE
                    or bli.agreement.agreement_reason == AgreementReason.LOGICAL_FOLLOW_ON
                )
                and not bli.agreement.vendor_id
            ):
                raise ValidationError(
                    "BLI's Agreement must have a Vendor if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
                )

    @validates_schema
    def validate_agreement_project_officer(self, data, **kwargs):
        if self.status_is_changing_beyond_draft(data):
            bli = self.get_current_budget_line_item()
            if bli and bli.agreement_id and not bli.agreement.project_officer:
                raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    @validates_schema
    def validate_need_by_date(self, data: dict, **kwargs):
        key = "date_needed"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must valid a valid Need By Date when status is not DRAFT"
            if is_blank(target_value):
                raise ValidationError(msg)

    @validates_schema
    def validate_need_by_date_in_the_future(self, data: dict, **kwargs):
        key = "date_needed"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            today = date.today()
            msg = "BLI must valid a Need By Date in the future when status is not DRAFT"
            if isinstance(target_value, date) and target_value <= today:
                raise ValidationError(msg)

    @validates_schema
    def validate_can(self, data: dict, **kwargs):
        key = "can_id"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must have a valid CAN when status is not DRAFT"
            if not target_value:
                raise ValidationError(msg)

    @validates_schema
    def validate_amount(self, data: dict, **kwargs):
        key = "amount"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must have a valid Amount when status is not DRAFT"
            if target_value is None:
                raise ValidationError(msg)

    @validates_schema
    def validate_amount_greater_than_zero(self, data: dict, **kwargs):
        key = "amount"
        if self.should_validate_field(key, data):
            target_value = self.get_target_value(key, data)
            msg = "BLI must be a valid Amount (greater than zero) when status is not DRAFT"
            if isinstance(target_value, (Decimal, float, int)) and (target_value <= 0):
                raise ValidationError(msg)

    @validates_schema
    def validate_services_component_id(self, data: dict, **kwargs):
        services_component_id = data.get("services_component_id")
        if services_component_id is not None:
            sc: ServicesComponent = current_app.db_session.get(ServicesComponent, services_component_id)
            if sc:
                sc_contract_agreement_id = sc.contract_agreement_id
                if get_context_value("method") in ["POST"]:
                    bli_agreement_id = data.get("agreement_id")
                else:
                    bli: BudgetLineItem = current_app.db_session.get(BudgetLineItem, get_context_value("id"))
                    bli_agreement_id = bli.agreement_id if bli else None
                if sc_contract_agreement_id != bli_agreement_id:
                    raise ValidationError("The Services Component must belong to the same Agreement as the BLI")


class POSTRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(required=True)  # agreement_id is required for POST


class PATCHRequestBodySchema(RequestBodySchema):
    agreement_id = fields.Int(
        dump_default=None, allow_none=True
    )  # agreement_id (and all params) are optional for PATCH


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


class SimpleAgreementSchema(Schema):
    id = fields.Integer(required=True)
    agreement_type = fields.String(allow_none=False)
    name = fields.String(allow_none=False)
    awarding_entity_id = fields.Integer(allow_none=True)


class BudgetLineItemResponseSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    id = fields.Int(required=True)
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
    fees = fields.Decimal(as_string=True, required=True)
    created_by = fields.Int(required=True)
    updated_by = fields.Int(required=True)
    created_on = fields.DateTime(required=True)
    updated_on = fields.DateTime(required=True)

    _meta = fields.Nested(MetaSchema, required=True)


class BudgetLineItemListFilterOptionResponseSchema(Schema):
    fiscal_years = fields.List(fields.Int(), required=True)
    statuses = fields.List(fields.String(), required=True)
    portfolios = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
